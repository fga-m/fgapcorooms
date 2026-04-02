/**
 * api/calendar.js
 * CALENDAR APP VERSION
 * Targets the /calendar/v1/ API for organizations using PCO Calendar for room management.
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
    const headers = { 'Authorization': `Basic ${auth}` };

    // 1. Fetch Rooms from the Calendar App
    // This allows the "Bug" menu to show the correct rooms and IDs
    const roomsRes = await fetch(
      'https://api.planningcenteronline.com/calendar/v1/rooms?per_page=100',
      { headers }
    );
    
    if (!roomsRes.ok) {
      throw new Error(`PCO Rooms Fetch Error: ${roomsRes.status}`);
    }
    const roomsData = await roomsRes.json();

    // 2. Fetch Event Instances for the specific date
    // We include 'event' (for titles) and 'rooms' (for location mapping)
    const start = `${date}T00:00:00Z`;
    const end = `${date}T23:59:59Z`;
    
    const instancesRes = await fetch(
      `https://api.planningcenteronline.com/calendar/v1/event_instances?include=event,rooms&where[starts_at][gte]=${start}&where[starts_at][lte]=${end}&per_page=100`,
      { headers }
    );

    if (!instancesRes.ok) {
      throw new Error(`PCO Instance Fetch Error: ${instancesRes.status}`);
    }
    
    const instancesData = await instancesRes.json();

    // Set CORS and Cache headers for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    // Return the combined data to the frontend
    return res.status(200).json({
        rooms: roomsData.data || [],
        instances: instancesData.data || [],
        included: instancesData.included || []
    });

  } catch (error) {
    console.error("Backend Proxy Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
