/**
 * api/calendar.js
 * PURE PROXY VERSION
 * This fetches raw data so the dashboard can handle the mapping.
 */
export default async function handler(req, res) {
  const { date } = req.query;
  const appId = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;

  if (!appId || !secret) {
    return res.status(401).json({ error: "Missing API Keys in Vercel Environment Variables." });
  }

  try {
    const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
    const headers = { 'Authorization': `Basic ${auth}` };

    // We use a broader fetch and include 'resource' data in one call
    // This avoids the "Not Found" error caused by complex where clauses
    const pcoUrl = `https://api.planningcenteronline.com/resources/v2/bookings?include=resource&per_page=100&filter=future,past`;
    
    const response = await fetch(pcoUrl, { headers });

    if (!response.ok) {
      throw new Error(`PCO API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Send the raw PCO response to the frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);

  } catch (error) {
    console.error("Proxy Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
