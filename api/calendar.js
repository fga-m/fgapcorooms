/**
 * api/calendar.js
 * ENHANCED DIAGNOSTIC VERSION
 * 1. Fetches a 7-day range for better visibility of upcoming events.
 * 2. Handles room 404s gracefully to prevent app crashes.
 * 3. Uses standard PCO ISO 8601 UTC date filtering.
 */
export default async function handler(req, res) {
  const { date } = req.query;
  const appId = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;

  if (!appId || !secret) {
    return res.status(401).json({ 
      error: "Missing API Keys. Ensure PCO_APP_ID and PCO_SECRET are set in Vercel settings." 
    });
  }

  try {
    const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
    const headers = { 
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };

    // 1. Fetch Rooms (Optional)
    // We wrap this in a try/catch so if PCO returns a 404 for rooms, 
    // the rest of the calendar data can still load.
    let rooms = [];
    try {
      const roomsRes = await fetch('https://api.planningcenteronline.com/calendar/v1/rooms?per_page=100', { headers });
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        rooms = roomsData.data || [];
      } else {
        console.warn(`Rooms endpoint returned ${roomsRes.status}. Continuing with events only.`);
      }
    } catch (e) {
      console.error("Room fetch failed:", e.message);
    }

    // 2. Setup 7-Day Range for Events
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(startDate.getDate() + 7);

    const startStr = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const endStr = endDate.toISOString().split('T')[0] + 'T23:59:59Z';
    
    // 3. Fetch Event Instances
    // We include 'event' for titles and 'rooms' for location metadata
    const instancesRes = await fetch(
      `https://api.planningcenteronline.com/calendar/v1/event_instances?include=event,rooms&where[starts_at][gte]=${startStr}&where[starts_at][lte]=${endStr}&per_page=100`,
      { headers }
    );

    if (!instancesRes.ok) {
      const errText = await instancesRes.text();
      return res.status(instancesRes.status).json({ 
        error: `PCO Instances Error: ${instancesRes.status}`, 
        details: errText 
      });
    }
    
    const instancesData = await instancesRes.json();

    // 4. Return combined data
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return res.status(200).json({
        rooms: rooms,
        instances: instancesData.data || [],
        included: instancesData.included || [],
        range: { start: startStr, end: endStr }
    });

  } catch (error) {
    console.error("Critical Proxy Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
