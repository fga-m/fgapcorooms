/**
 * api/calendar.js
 * This is a Vercel Serverless Function.
 * It handles the secure communication with Planning Center.
 */

export default async function handler(req, res) {
  const { date } = req.query;
  const appId = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;

  // 1. Safety Check: Ensure credentials exist
  if (!appId || !secret) {
    return res.status(401).json({ 
      error: "Credentials missing. Ensure PCO_APP_ID and PCO_SECRET are set in Vercel Environment Variables.",
    });
  }

  try {
    const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
    const headers = { 'Authorization': `Basic ${auth}` };

    // 2. Fetch Resources (Rooms) - This populates the "Bug" discovery menu
    const resourcesRes = await fetch(
      'https://api.planningcenteronline.com/resources/v2/resources?per_page=100',
      { headers }
    );
    
    if (!resourcesRes.ok) {
      throw new Error(`PCO Resources Error: ${resourcesRes.statusText}`);
    }
    const resourcesData = await resourcesRes.json();

    // 3. Fetch Bookings for the specific date (YYYY-MM-DD)
    const start = `${date}T00:00:00Z`;
    const end = `${date}T23:59:59Z`;
    const bookingsRes = await fetch(
      `https://api.planningcenteronline.com/resources/v2/bookings?filter=future,past&where[starts_at]=${start}&where[ends_at]=${end}&per_page=100`,
      { headers }
    );

    if (!bookingsRes.ok) {
      throw new Error(`PCO Bookings Error: ${bookingsRes.statusText}`);
    }
    const bookingsData = await bookingsRes.json();

    // 4. Format and Clean Data for the Dashboard
    const resourceList = (resourcesData.data || []).map(r => ({
      id: r.id,
      name: r.attributes.name
    }));

    const eventList = (bookingsData.data || []).map(b => ({
      id: b.id,
      title: b.attributes.event_name || "Untitled Event",
      start: b.attributes.starts_at,
      end: b.attributes.ends_at,
      resourceId: b.relationships.resource.data.id
    }));

    // 5. Send Response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
    return res.status(200).json({
      events: eventList,
      resources: resourceList
    });

  } catch (error) {
    console.error('API Proxy Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
