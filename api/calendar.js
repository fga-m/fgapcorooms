/**
 * api/calendar.js
 * FIXED URL ENCODING VERSION
 * Uses URLSearchParams to ensure brackets and dates are encoded correctly for PCO.
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
      'Accept': 'application/json'
    };

    // 1. Setup 7-Day Window
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(startDate.getDate() + 7);

    const startStr = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
    const endStr = endDate.toISOString().split('T')[0] + 'T23:59:59Z';
    
    // 2. Build URL with proper encoding for brackets
    // PCO often 404s if [ and ] are not %encoded
    const params = new URLSearchParams();
    params.append('include', 'event,rooms');
    params.append('where[starts_at][gte]', startStr);
    params.append('where[starts_at][lte]', endStr);
    params.append('per_page', '100');

    const pcoUrl = `https://api.planningcenteronline.com/calendar/v1/event_instances?${params.toString()}`;
    
    const response = await fetch(pcoUrl, { headers });

    if (!response.ok) {
      const text = await response.text();
      // If it's a 404, try a simpler fallback without the 'rooms' include
      if (response.status === 404) {
          const fallbackParams = new URLSearchParams();
          fallbackParams.append('include', 'event');
          fallbackParams.append('filter', 'future');
          const fallbackUrl = `https://api.planningcenteronline.com/calendar/v1/event_instances?${fallbackParams.toString()}`;
          const fallbackRes = await fetch(fallbackUrl, { headers });
          
          if (fallbackRes.ok) {
              const fbData = await fallbackRes.json();
              return res.status(200).json({
                  instances: fbData.data || [],
                  included: fbData.included || [],
                  note: "Primary query 404'd, using fallback feed."
              });
          }
      }
      return res.status(response.status).json({ error: `PCO API ${response.status}`, details: text.substring(0, 200) });
    }
    
    const data = await response.json();

    // 3. Fetch rooms separately to avoid 404s in the main query
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
        included: data.included || []
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
