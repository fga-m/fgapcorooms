export default async function handler(req, res) {
  // We use Environment Variables to keep your PCO credentials secret
  const PCO_APP_ID = process.env.PCO_APP_ID;
  const PCO_SECRET = process.env.PCO_SECRET;

  if (!PCO_APP_ID || !PCO_SECRET) {
    return res.status(500).json({ 
      error: 'PCO Credentials missing. Add PCO_APP_ID and PCO_SECRET to Vercel Environment Variables.' 
    });
  }

  const { date } = req.query; // Expecting YYYY-MM-DD
  const auth = Buffer.from(`${PCO_APP_ID}:${PCO_SECRET}`).toString('base64');

  try {
    /**
     * We fetch "Bookings" for the specific date.
     * filter=future,past ensures we get all events for that day.
     * include=resource allows us to see which room is attached to the booking.
     */
    const url = `https://api.planningcenteronline.com/resources/v2/bookings?filter=future,past&include=resource&where[starts_at]=${date}T00:00:00Z&where[ends_at]=${date}T23:59:59Z&per_page=100`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PCO API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Set headers for security and performance
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('PCO API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
