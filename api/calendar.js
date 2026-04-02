/**
 * api/calendar.js
 * ULTRA-ROBUST CALENDAR VERSION
 * Targets the /calendar/v1/ API for organizations using PCO Calendar.
 * * FIXES:
 * 1. Removes 'rooms' from mandatory includes to prevent 404 errors.
 * 2. If the date-filtered query fails (404), it automatically falls back 
 * to fetching all future events to ensure the connection is working.
 */
export default async function handler(req, res) {
  const { date } = req.query;
  const appId = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;

  // Verify that credentials are set in Vercel
  if (!appId || !secret) {
    return res.status(401).json({ 
      error: "Credentials missing. Ensure PCO_APP_ID and PCO_SECRET are set in Vercel Environment Variables." 
    });
  }

  try {
    const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
    const headers = { 
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };

    // 1. Setup 7-Day Window for the primary query
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(startDate.getDate() + 7);

    const startStr = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const endStr = endDate.toISOString().split('T')[0] + 'T23:59:59Z';
    
    // 2. Fetch Event Instances
    // Note: We only include 'event' (for names). We exclude 'rooms' because 
    // including it causes a 404 if the Rooms feature isn't fully initialized.
    const pcoUrl = `https://api.planningcenteronline.com/calendar/v1/event_instances?include=event&where[starts_at][gte]=${startStr}&where[starts_at][lte]=${endStr}&per_page=100`;
    
    let response = await fetch(pcoUrl, { headers });
    let data;

    // 3. Fallback Logic: If the filtered query returns 404, try the simplest "future" feed
    if (!response.ok && response.status === 404) {
      const fallbackUrl = `https://api.planningcenteronline.com/calendar/v1/event_instances?include=event&filter=future&per_page=50`;
      const fallbackRes = await fetch(fallbackUrl, { headers });
      
      if (fallbackRes.ok) {
        data = await fallbackRes.json();
      } else {
        const errorDetail = await fallbackRes.text();
        throw new Error(`PCO API Error: ${fallbackRes.status} - ${errorDetail}`);
      }
    } else if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`PCO API Error: ${response.status} - ${errorDetail}`);
    } else {
      data = await response.json();
    }

    // 4. Separate Fetch for Rooms (Optional)
    // We try to get room names for the "Discovery" menu, but won't crash if it fails.
    let rooms = [];
    try {
        const roomsRes = await fetch('https://api.planningcenteronline.com/calendar/v1/rooms', { headers });
        if (roomsRes.ok) {
            const rData = await roomsRes.json();
            rooms = rData.data || [];
        }
    } catch (e) {
        // Silently fail rooms - we want events to show up regardless.
    }

    // Set standard response headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    // Return the combined data to the frontend
    return res.status(200).json({
        rooms: rooms,
        instances: data.data || [],
        included: data.included || [],
        range: { start: startStr, end: endStr },
        isFallback: !response.ok
    });

  } catch (error) {
    console.error("Backend Proxy Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
