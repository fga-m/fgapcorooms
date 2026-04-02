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

    // Fetch a window that covers the full Melbourne day regardless of DST
    const startStr = date + 'T00:00:00Z';
    const nextDay = new Date(date + 'T00:00:00Z');
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const endStr = nextDay.toISOString().split('T')[0] + 'T12:59:59Z';

    const prevDay = new Date(date + 'T00:00:00Z');
    prevDay.setUTCDate(prevDay.getUTCDate() - 1);
    const startStrWide = prevDay.toISOString().split('T')[0] + 'T13:00:00Z';

    const pcoUrl = `https://api.planningcenteronline.com/calendar/v2/event_instances?include=event,resource_bookings,tags&where[starts_at][gte]=${startStrWide}&where[starts_at][lte]=${endStr}&per_page=100`;

    const [eventRes, roomsRes, tagsRes] = await Promise.all([
      fetch(pcoUrl, { headers }),
      fetch('https://api.planningcenteronline.com/calendar/v2/rooms?per_page=100', { headers }),
      fetch('https://api.planningcenteronline.com/calendar/v2/tags?include=tag_group&per_page=100', { headers })
    ]);

    if (!eventRes.ok) {
      const errorText = await eventRes.text();
      return res.status(eventRes.status).json({
        error: `PCO Event Error (${eventRes.status})`,
        details: errorText.slice(0, 500)
      });
    }

    const data = await eventRes.json();

    // Build resource ID -> room name lookup
    let resourceMap = {};
    if (roomsRes.ok) {
      const roomsData = await roomsRes.json();
      for (const room of (roomsData.data || [])) {
        resourceMap[room.id] = room.attributes.name;
      }
    }

    if (O
