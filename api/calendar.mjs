/**
 * api/calendar.mjs
 */

const PCO_BASE = 'https://api.planningcenteronline.com/calendar/v2';

/**
 * Fetch every page of a PCO collection by following links.next.
 * Returns { ok, data, included } or { ok: false, status, errorText }.
 */
async function fetchAllPages(url, headers, maxPages = 10) {
  let data = [];
  let included = [];
  let next = url;
  let pages = 0;

  while (next && pages < maxPages) {
    const r = await fetch(next, { headers });
    if (!r.ok) {
      const text = await r.text();
      return { ok: false, status: r.status, errorText: text.slice(0, 500) };
    }
    const json = await r.json();
    data = data.concat(json.data || []);
    included = included.concat(json.included || []);
    next = json.links?.next || null;
    pages++;
  }

  return { ok: true, data, included };
}

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

    // Lightweight summary mode: which rooms are booked on each of the next N days.
    // Used for the date-strip dots. ?summary=14&date=<start>
    if (req.query.summary) {
      const days = Math.min(31, Math.max(1, parseInt(req.query.summary, 10) || 14));
      const sStart = new Date(date + 'T00:00:00Z');
      sStart.setUTCDate(sStart.getUTCDate() - 1);
      const sEnd = new Date(date + 'T00:00:00Z');
      sEnd.setUTCDate(sEnd.getUTCDate() + days);
      const sUrl = `${PCO_BASE}/event_instances?include=resource_bookings` +
        `&where[starts_at][gte]=${sStart.toISOString().split('T')[0]}T13:00:00Z` +
        `&where[starts_at][lte]=${sEnd.toISOString().split('T')[0]}T13:59:59Z` +
        `&order=starts_at&per_page=100`;
      const result = await fetchAllPages(sUrl, headers, 15);
      if (!result.ok) {
        return res.status(result.status).json({ error: `PCO Summary Error (${result.status})`, details: result.errorText });
      }
      const byDay = {};
      for (const instance of result.data) {
        const startsAt = instance.attributes?.starts_at;
        if (!startsAt) continue;
        const melbDay = new Date(startsAt).toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' });
        const bookingRefs = instance.relationships?.resource_bookings?.data || [];
        const roomIds = bookingRefs
          .map(ref => {
            const booking = (result.included || []).find(inc => inc.type === 'ResourceBooking' && inc.id === ref.id);
            return booking?.relationships?.resource?.data?.id || null;
          })
          .filter(Boolean);
        if (roomIds.length === 0) continue;
        if (!byDay[melbDay]) byDay[melbDay] = new Set();
        roomIds.forEach(id => byDay[melbDay].add(id));
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json({
        days: Object.entries(byDay).map(([d, ids]) => ({ date: d, roomIds: [...ids] }))
      });
    }

    // Fetch a window that covers the full Melbourne day regardless of DST
    const nextDay = new Date(date + 'T00:00:00Z');
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const endStr = nextDay.toISOString().split('T')[0] + 'T12:59:59Z';

    const prevDay = new Date(date + 'T00:00:00Z');
    prevDay.setUTCDate(prevDay.getUTCDate() - 1);
    const startStrWide = prevDay.toISOString().split('T')[0] + 'T13:00:00Z';

    const includeWithOwner = 'include=event,event.owner,resource_bookings,tags';
    const include = 'include=event,resource_bookings,tags';

    const overlapWhere = `where[starts_at][lte]=${endStr}&where[ends_at][gte]=${startStrWide}`;
    const fallbackWhere = `where[starts_at][gte]=${startStrWide}&where[starts_at][lte]=${endStr}`;

    // Try richest query first, degrade gracefully:
    // 1. overlap window + event owner  2. overlap window  3. original starts_at window
    const candidateUrls = [
      `${PCO_BASE}/event_instances?${includeWithOwner}&${overlapWhere}&order=starts_at&per_page=100`,
      `${PCO_BASE}/event_instances?${include}&${overlapWhere}&order=starts_at&per_page=100`,
      `${PCO_BASE}/event_instances?${include}&${fallbackWhere}&per_page=100`
    ];

    let [eventResult, roomsResult, tagsResult] = await Promise.all([
      fetchAllPages(candidateUrls[0], headers),
      fetchAllPages(`${PCO_BASE}/rooms?per_page=100`, headers),
      fetchAllPages(`${PCO_BASE}/tags?include=tag_group&per_page=100`, headers)
    ]);

    for (let i = 1; i < candidateUrls.length && !eventResult.ok; i++) {
      eventResult = await fetchAllPages(candidateUrls[i], headers);
    }

    if (!eventResult.ok) {
      return res.status(eventResult.status).json({
        error: `PCO Event Error (${eventResult.status})`,
        details: eventResult.errorText
      });
    }

    // Build resource ID -> room name lookup
    let resourceMap = {};
    if (roomsResult.ok) {
      for (const room of roomsResult.data) {
        resourceMap[room.id] = room.attributes.name;
      }
    }

    if (Object.keys(resourceMap).length === 0) {
      try {
        const resourcesResult = await fetchAllPages(`${PCO_BASE}/resources?per_page=100`, headers);
        if (resourcesResult.ok) {
          for (const resource of resourcesResult.data) {
            resourceMap[resource.id] = resource.attributes.name;
          }
        }
      } catch (e) {}
    }

    // Build tag ID -> tag info lookup (name, color, group)
    let tagMap = {};
    let tagGroups = {};
    if (tagsResult.ok) {
      for (const group of tagsResult.included) {
        if (group.type === 'TagGroup') {
          tagGroups[group.id] = group.attributes.name;
        }
      }
      for (const tag of tagsResult.data) {
        tagMap[tag.id] = {
          id: tag.id,
          name: tag.attributes.name,
          color: tag.attributes.color,
          groupId: tag.relationships?.tag_group?.data?.id,
          groupName: tagGroups[tag.relationships?.tag_group?.data?.id] || null
        };
      }
    }

    const included = eventResult.included;

    // Enrich each instance with resolved rooms (id + name), tags and owner
    const instances = eventResult.data.map(instance => {
      const bookingRefs = instance.relationships?.resource_bookings?.data || [];
      const roomObjs = [];
      for (const ref of bookingRefs) {
        const booking = included.find(
          inc => inc.type === 'ResourceBooking' && inc.id === ref.id
        );
        if (!booking) continue;
        const resourceId = booking.relationships?.resource?.data?.id;
        if (!resourceId || roomObjs.some(r => r.id === resourceId)) continue;
        roomObjs.push({ id: resourceId, name: resourceMap[resourceId] || null });
      }
      const roomNames = roomObjs.map(r => r.name).filter(Boolean);

      // Resolve the event owner ("booked by") when included
      const eventId = instance.relationships?.event?.data?.id;
      const eventData = eventId
        ? included.find(inc => inc.type === 'Event' && inc.id === eventId)
        : null;
      const ownerId = eventData?.relationships?.owner?.data?.id;
      const owner = ownerId
        ? included.find(inc => inc.type === 'Person' && inc.id === ownerId)
        : null;
      const eventOwner = owner
        ? (owner.attributes?.name ||
           [owner.attributes?.first_name, owner.attributes?.last_name].filter(Boolean).join(' ') ||
           null)
        : null;

      // Resolve tags from included
      const tagRefs = instance.relationships?.tags?.data || [];
      const resolvedTags = tagRefs
        .map(ref => tagMap[ref.id])
        .filter(Boolean);

      const departmentTags = resolvedTags.filter(t => t.groupName === 'Department/Ministries');
      const eventTypeTags = resolvedTags.filter(t => t.groupName === 'Event Type');

      // Use the first department tag's color for the event, fallback to grey
      const eventColor = departmentTags[0]?.color || eventTypeTags[0]?.color || '#94a3b8';

      return {
        ...instance,
        resolvedRooms: [...new Set(roomNames)],
        resolvedRoomObjs: roomObjs,
        eventOwner,
        resolvedTags,
        departmentTags,
        eventTypeTags,
        eventColor
      };
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    // Let Vercel's edge absorb repeat requests (congregation + kiosk polling)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      rooms: Object.entries(resourceMap).map(([id, name]) => ({ id, name })),
      tags: Object.values(tagMap),
      tagGroups: Object.entries(tagGroups).map(([id, name]) => ({ id, name })),
      instances,
      included,
      range: { start: startStrWide, end: endStr }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
