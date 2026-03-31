export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    // Fetch the webcal data from Planning Center
    const response = await fetch(url.replace('webcal://', 'https://'));
    const data = await response.text();

    // Set headers to allow your frontend to read it
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
}
