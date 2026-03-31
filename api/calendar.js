export default async function handler(req, res) {
  const { date } = req.query;
  const appId = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;

  if (!appId || !secret) {
    return res.status(401).json({ 
      error: "Credentials missing. Ensure PCO_APP_ID and PCO_SECRET are set in Vercel Settings > Environment Variables.",
    });
  }

  try {
    const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
    const headers = { 'Authorization': `Basic ${auth}` };

    // 1. Fetch Rooms (Resources) for the Discovery Menu
    const resourcesRes = await fetch(
      'https://api.planningcenteronline.com/resources/v2/resources?per_page=100',
      { headers }
    );
    
    if (!resourcesRes.ok) {
      const err = await resourcesRes.json();
      throw new Error(`PCO Resources API Error: ${err.errors?.[0]?.detail || resourcesRes.statusText}`);
    }
    const resourcesData = await resourcesRes.json();

    // 2. Fetch Bookings for the specific date
    // Note: We use per_page=100 to get everything for the day
    const start = `${date}T00:00:00Z`;
    const end = `${date}T23:59:59Z`;
    const bookingsRes = await fetch(
      `https://api.planningcenteronline.com/resources/v2/bookings?filter=future,past&where[starts_at]=${start}&where[ends_at]=${end}&per_page=100`,
      { headers }
    );

    if (!bookingsRes.ok) {
      throw new Error(`PCO Bookings API Error: ${bookingsRes.statusText}`);
    }
    const bookingsData = await bookingsRes.json();

    // 3. Clean up the data for the frontend
    const resourceList = resourcesData.data.map(r => ({
      id: r.id,
      name: r.attributes.name
    }));

    const eventList = bookingsData.data.map(b => ({
      id: b.id,
      title: b.attributes.event_name || "Untitled Event",
      start: b.attributes.starts_at,
      end: b.attributes.ends_at,
      resourceId: b.relationships.resource.data.id
    }));

    return res.status(200).json({
      events: eventList,
      resources: resourceList
    });

  } catch (error) {
    console.error('Proxy Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
