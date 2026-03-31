export default async function handler(req, res) {
  const { url } = req.query;

  // Basic validation to ensure a URL was provided
  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    // Planning Center links often start with webcal://
    // We convert it to https:// so the server can fetch it normally
    const targetUrl = url.replace('webcal://', 'https://');
    
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`PCO responded with status: ${response.status}`);
    }

    const data = await response.text();

    // Set the correct content type for an iCalendar file
    res.setHeader('Content-Type', 'text/calendar');
    // Allow your frontend to access this data
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).send(data);
  } catch (error) {
    console.error('Calendar Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch calendar data from Planning Center' });
  }
}
