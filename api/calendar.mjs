/**
 * api/calendar.mjs
 * ULTRA-STABLE CALENDAR PROXY
 */
export default async function handler(req, res) {
  const { date } = req.query;

  // Validate date parameter
  if (!date) {
    return res.status(400).json({ error: "Missing required 'date' query parameter (e.g. ?date=2026-04-02)" });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
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

    // 1. Setup Time Window
    const startDate = parsedDate;
    const endDate = new Date(parsedDate);
    endDate.setDate(startDate.getDate() + 7);
    const startStr = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const endStr = endDate.toISOString().split('T')[0] + 'T23:59:59Z';
    
    // 2. Build URL with v2 and resource_bookings include for room data
    const pcoUrl = `https://api.planningcenteronline.com/calendar/v2/event_instances?include=event,resource_bookings&where[starts_at][gte]=${startStr}&where[starts_at][lte]=${endStr}&per_page=100`;
    
    let response = await fetch(pcoUrl, { headers });
    let data = null;
    let contentType = response.headers.get("content-type");

    // 3. Response Handling with debug info on failure
    if (response.ok && contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `PCO Server Error (${response.status})`,
        url: pcoUrl,
        details: errorText.slice(0, 500)
      });
    }

    // 4. Fetch rooms separately so we have a full room list
    let rooms = [];
    try {
      const roomsRes = await fetch('https://api.planningcenteronline.com/calendar/v2/rooms', { headers });
      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        rooms = rData.data || [];
      }
    } catch (e) {}

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      rooms: rooms,
      instances: data.data || [],
      included: data.included || [],
      range: { start: startStr, end: endStr }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
