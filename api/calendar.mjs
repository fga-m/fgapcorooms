/**
 * api/calendar.mjs
 */
export default async function handler(req, res) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Missing required 'date' query parameter (e.g. ?date=2026-04-02)" });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD (e.g. ?date=2026-04-02)" });
  }

  const appId = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;
  if (!appId || !secret) {
    return res.status(401).json({ error: "API Credentials missing in Vercel settings." });
  }

  try {
    const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'User-Agent': 'FGAM-Resource-Planner-v1'
    };

    // Fetch from midnight UTC on the requested date to 1pm UTC the next day.
    // This covers a full Melbourne day (UTC+10/+11) regardless of daylight saving.
    // The frontend filters to the correct Melbourne day using getMelbDate().
    const startStr = date + 'T00:00:00Z';
    const nextDay = new Date(date + 'T00:00:00Z');
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const endStr = nextDay.toISOString().split('T')[0] + 'T12:59:59Z';

    // Fetch event instances and rooms in parallel
    const pcoUrl = `https://api.planningcenteronline.com/calendar/v2/event_instances?include=event,resource_bookings&where[starts_at][gte]=${startStr}&where[starts_at][lte]=${endStr}&per_page=100`;

    const [eventRes, roomsRes] = await Promise.all([
      fetch(pcoUrl, { headers }),
      fetch('https://api.planningcenteronline.com/calendar/v2/rooms?per_page=100', { headers })
    ]);

    if (!eventRes.ok) {
      const errorText = await eventRes.text();
      return res.status(eventRes.status).json({
        error: `PCO Event Error (${eventRes.status})`,
        details: errorText.slice(0, 500)
      });
    }

    const data = await eventRes.json();

    // Build a resource ID -> room name lookup map
    let resourceMap = {};
    if (roomsRes.ok) {
      const roomsData = await roomsRes.json();
      for (const room of (roomsData.data || [])) {
        resourceMap[room.id] = room.attributes.name;
      }
    }

    // Also check resources endpoint in case rooms are stored there
    if (Object.keys(resourceMap).length === 0) {
      try {
        const resourcesRes = await fetch('https://api.planningcenteronline.com/calendar/v2/resources?per_page=100', { headers });
        if (resourcesRes.ok) {
          const resourcesData = await resourcesRes.json();
          for (const resource of (resourcesData.data || [])) {
            resourceMap[resource.id] = resource.attributes.name;
          }
        }
      } catch (e) {}
    }

    // Enrich each instance with resolved room names
    const instances = (data.data || []).map(instance => {
      const bookingRefs = instance.relationships?.resource_bookings?.data || [];
      const roomNames = bookingRefs
        .map(ref => {
          const booking = (data.included || []).find(
            inc => inc.type === 'ResourceBooking' && inc.id === ref.id
          );
          if (!booking) return null;
          const resourceId = booking.relationships?.resource?.data?.id;
          return resourceId ? (resourceMap[resourceId] || null) : null;
        })
        .filter(Boolean);

      return {
        ...instance,
        resolvedRooms: [...new Set(roomNames)]
      };
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      rooms: Object.entries(resourceMap).map(([id, name]) => ({ id, name })),
      instances,
      included: data.included || [],
      range: { start: startStr, end: endStr }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
