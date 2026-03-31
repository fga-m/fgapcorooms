/* api/calendar.js */
export default async function handler(req, res) {
  const { date } = req.query;
  const appId = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;

  if (!appId || !secret) {
    return res.status(500).json({ 
      error: "PCO Credentials missing in Vercel Environment Variables",
      debug: [] 
    });
  }

  try {
    const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
    
    // 1. Fetch all resources (rooms) first for the "Bug" discovery menu
    const resourcesRes = await fetch(
      'https://api.planningcenteronline.com/resources/v2/resources?per_page=100',
      { headers: { 'Authorization': `Basic ${auth}` } }
    );
    const resourcesData = await resourcesRes.json();
    
    const resourceList = resourcesData.data?.map(r => ({
      id: r.id,
      name: r.attributes.name,
      path: r.links.self
    })) || [];

    // 2. Fetch events for the specific date
    // We filter for events that are "shared" and occurring on the requested date
    const start = `${date}T00:00:00Z`;
    const end = `${date}T23:59:59Z`;
    
    const eventsRes = await fetch(
      `https://api.planningcenteronline.com/resources/v2/event_instances?include=event,resource_bookings&filter=occurring_between&starts=${start}&ends=${end}`,
      { headers: { 'Authorization': `Basic ${auth}` } }
    );
    const eventsData = await eventsRes.json();

    // 3. Flatten the PCO JSON relationship structure into a simple array for the dashboard
    const formattedEvents = [];
    
    if (eventsData.included) {
      const bookings = eventsData.included.filter(i => i.type === 'ResourceBooking');
      const eventDetails = eventsData.included.filter(i => i.type === 'Event');

      bookings.forEach(booking => {
        const parentInstance = eventsData.data.find(d => 
          d.relationships.resource_bookings.data.some(b => b.id === booking.id)
        );
        
        if (parentInstance) {
          const eventInfo = eventDetails.find(e => e.id === parentInstance.relationships.event.data.id);
          
          formattedEvents.push({
            id: booking.id,
            title: eventInfo?.attributes?.name || "
