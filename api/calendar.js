/**
 * api/calendar.js
 * ULTRA-STABLE CALENDAR PROXY
 * 1. Uses hard-coded URL strings to avoid encoding issues with brackets.
 * 2. Prevents "Wall of Text" errors by validating JSON content types.
 * 3. Includes an automatic probe of the /events endpoint if /event_instances 404s.
 */
export default async function handler(req, res) {
  const { date } = req.query;
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
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(startDate.getDate() + 7);

    const startStr = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const endStr = endDate.toISOString().split('T')[0] + 'T23:59:59Z';
    
    // 2. Build URL manually to ensure PCO compatibility
    // We use literal brackets which PCO often prefers over %-encoded ones
    const pcoUrl = `https://api.planningcenteronline.com/calendar/v1/event_instances?include=event&where[starts_at][gte]=${startStr}&where[starts_at][lte]=${endStr}&per_page=100`;
    
    let response = await fetch(pcoUrl, { headers });
    let data = null;
    let contentType = response.headers.get("content-type");

    // 3. Robust Response Handling
    if (response.ok && contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If we got a 404 or HTML, try the absolute simplest "Events" endpoint as a fallback
      // This confirms if the API key can talk to Calendar at all
      const fallbackUrl = `https://api.planningcenteronline.com/calendar/v1/events?per_page=50`;
      const fallbackRes = await fetch(fallbackUrl, { headers });
      
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        // We map Events to look like Instances so the UI doesn't crash
        const simulatedInstances = (fbData.data || []).map(evt => ({
          id: `sim-${evt.id}`,
          type: "EventInstance",
          attributes: {
            event_name: evt.attributes.name,
            starts_at: new Date().toISOString(), // Mock date for visibility
            ends_at: new Date().toISOString()
          },
          relationships: { event: { data: { id: evt.id, type: "Event" } } }
        }));

        return res.status(200).json({
          instances: simulatedInstances,
          included: fbData.data.map(d => ({ ...d, type: "Event" })),
          note: "Primary query failed. Showing raw Event list as fallback."
        });
      }

      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `PCO Server Error (${response.status})`, 
        details: "PCO returned an HTML error page. Check your App ID/Secret and ensure 'Calendar' scope is enabled." 
      });
    }

    // 4. Fetch rooms separately (non-blocking)
    let rooms = [];
    try {
        const roomsRes = await fetch('https://api.planningcenteronline.com/calendar/v1/rooms', { headers });
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
