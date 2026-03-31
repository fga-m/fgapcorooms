/**
 * api/calendar.js
 * Serverless function to proxy Planning Center API requests.
 * FIX: Updated the bookings filter to use the most compatible PCO syntax.
 */
export default async function handler(req, res) {
  const { date } = req.query;
  const appId = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;

  if (!appId || !secret) {
    return res.status(401).json({ 
      error: "Credentials missing in Vercel settings.",
    });
  }

  try {
    const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
    const headers = { 'Authorization': `Basic ${auth}` };

    // 1. Fetch Resources (Rooms)
    const resourcesRes = await fetch(
      'https://api.planningcenteronline.com/resources/v2/resources?per_page=100',
      { headers }
    );
    const resourcesData = await resourcesRes.json();

    // 2. Fetch Bookings 
    // FIX: Simplified the filter to avoid the "Not Found" error 
    // We fetch for the specific day by targeting the starts_at window
    const start = `${date}T00:00:00Z`;
    const end = `${date}T23:59:59Z`;
    
    const bookingsRes = await fetch(
      `https://api.planningcenteronline.com/resources/v2/bookings?where[starts_at][gte]=${start}&where[starts_at][lte]=${end}&per_page=100`,
      { headers }
    );

    if (!bookingsRes.ok) {
      // This will help us see if PCO is still unhappy with the URL
      const errText = await bookingsRes.text();
      throw new Error(`PCO Bookings Error: ${bookingsRes.status} ${bookingsRes.statusText}`);
    }
    
    const bookingsData = await bookingsRes.json();

    const resourceList = (resourcesData.data || []).map(r => ({
      id: r.id,
      name: r.attributes.name
    }));

    const eventList = (bookingsData.data || []).map(b => ({
      id: b.id,
      title: b.attributes.event_name || "Untitled Event",
      start: b.attributes.starts_at,
      end: b.attributes.ends_at,
      resourceId: b.relationships?.resource?.data?.id
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      events: eventList,
      resources: resourceList
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
