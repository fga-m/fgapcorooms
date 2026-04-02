/**
 * api/calendar.js
 * ULTRA-ROBUST CALENDAR VERSION
 * 1. Removes 'rooms' from mandatory includes to prevent 404s.
 * 2. Fetches raw event instances for the next 7 days.
 * 3. Provides detailed diagnostic info if Planning Center rejects the request.
 */
export default async function handler(req, res) {
  const { date } = req.query;
  const appId = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;

  if (!appId || !secret) {
    return res.status(401).json({ 
      error: "Credentials missing. Ensure PCO_APP_ID and PCO_SECRET are set in Vercel." 
    });
  }

  try {
    const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
    const headers = { 
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };

    // 1. Setup 7-Day Window
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(startDate.getDate() + 7);

    // PCO requires ISO strings for the where filter
    const startStr = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const endStr = endDate.toISOString().split('T')[0] + 'T23:59:59Z';
    
    // 2. Fetch Event Instances
    // FIX: We removed 'rooms' from include. If 'Rooms' aren't enabled in PCO Calendar, 
    // including them in the query causes a 404 error for the whole request.
    const pcoUrl = `https://api.planningcenteronline.com/calendar/v1/event_instances?include=event&where[starts_at][gte]=${startStr}&where[starts_at][lte]=${endStr}&per_page=100`;
    
    const response = await fetch(pcoUrl, { headers });

    if (!response.ok) {
      const errorDetail = await response.text();
      // If the specific filtered URL 404s, try a fallback to just 'future' events
      if (response.status === 404) {
          const fallbackUrl = `https://api.planningcenteronline.com/calendar/v1/event_instances?include=event&filter=future&per_page=50`;
          const fallbackRes = await fetch(fallbackUrl, { headers });
          if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              return res.status(200).json({
                  instances: fallbackData.data || [],
                  included: fallbackData.included || [],
                  note: "Filtered query failed (404), showing all future events instead."
              });
          }
      }
      throw new Error(`PCO API Error: ${response.status} - ${errorDetail}`);
    }
    
    const data = await response.json();

    // 3. Optional: Try to fetch rooms separately so we don't crash the main feed
    let rooms = [];
    try {
        const roomsRes = await fetch('https://api.planningcenteronline.com/calendar/v1/rooms', { headers });
        if (roomsRes.ok) {
            const rData = await roomsRes.json();
            rooms = rData.data || [];
        }
    } catch (e) {
        // Silently fail rooms, we care about the events right now
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return res.status(200).json({
        rooms: rooms,
        instances: data.data || [],
        included: data.included || [],
        range: { start: startStr, end: endStr }
    });

  } catch (error) {
    console.error("Critical Proxy Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
