/**
 * api/reminders.mjs
 *
 * Weekly booking reminder emails, sent through Gmail.
 * - GET  ?preview=1  (x-admin-key header)  → dry run: who would receive what
 * - POST             (x-admin-key header)  → send this week's reminders now
 * - GET  from Vercel cron (Authorization: Bearer CRON_SECRET) → auto-send (Mondays)
 *
 * Required Vercel env vars:
 *   PCO_APP_ID, PCO_SECRET      (already set)
 *   GMAIL_USER                  e.g. bookings@fgam.org.au
 *   GMAIL_APP_PASSWORD          Google App Password (not the account password)
 *   ADMIN_KEY                   passcode for the /admin portal
 *   CRON_SECRET                 random string; lets the Monday cron authenticate
 *
 * Send history lives in the Gmail account's Sent folder.
 */
import nodemailer from 'nodemailer';

const PCO_BASE = 'https://api.planningcenteronline.com';
const TZ = 'Australia/Melbourne';

// Tracked rooms (id -> friendly name) — keep in sync with src/app.jsx ROOM_GROUPS
const TRACKED_ROOMS = {
  '725944': 'Sanctuary', '746771': 'Main Lobby', '746776': 'Multipurpose Room',
  '746772': 'Meeting Room 1', '746773': 'Meeting Room 2', '746774': 'Meeting Room 3',
  '746775': 'Meeting Room 5', '746769': 'Commercial Kitchen', '746768': 'Backstage Area',
  '746770': 'Guest Central', '746764': 'Large Meeting Room', '746765': 'Open Office Area',
  '746763': "Chris' Office", '746767': 'Staff Kitchen', '746766': 'REACH Office',
  '817137': 'Rooftop Carpark', '746778': 'Zoom 1', '746779': 'Zoom 2',
  '746780': 'Zoom 3', '746781': 'Zoom 4'
};

async function fetchAllPages(url, headers, maxPages = 10) {
  let data = [];
  let included = [];
  let next = url;
  let pages = 0;
  while (next && pages < maxPages) {
    const r = await fetch(next, { headers });
    if (!r.ok) {
      const text = await r.text();
      return { ok: false, status: r.status, errorText: text.slice(0, 500) };
    }
    const json = await r.json();
    data = data.concat(json.data || []);
    included = included.concat(json.included || []);
    next = json.links?.next || null;
    pages++;
  }
  return { ok: true, data, included };
}

const melbDate = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
const shiftDate = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().split('T')[0];
};
const fmtDay = (iso) => new Date(iso).toLocaleDateString('en-AU', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-AU', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const fmtDateStr = (ds) => new Date(ds + 'T12:00:00Z').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });

// Monday..Sunday of the current Melbourne week
function currentWeek() {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const dow = new Date(todayStr + 'T12:00:00Z').getUTCDay(); // 0=Sun..6=Sat
  const monday = shiftDate(todayStr, dow === 0 ? -6 : 1 - dow);
  return { monday, sunday: shiftDate(monday, 6) };
}

async function resolveEmail(personId, headers) {
  try {
    const r = await fetch(`${PCO_BASE}/people/v2/people/${personId}?include=emails`, { headers });
    if (!r.ok) return { address: null, reason: 'not found in People' };
    const json = await r.json();
    const emails = (json.included || []).filter(i => i.type === 'Email');
    const usable = emails.filter(e => !e.attributes?.blocked);
    const primary = usable.find(e => e.attributes?.primary) || usable[0];
    if (primary) return { address: primary.attributes.address };
    if (emails.length > 0) return { address: null, reason: 'email blocked in PCO' };
    return { address: null, reason: 'no email in PCO' };
  } catch (e) {
    return { address: null, reason: 'lookup failed' };
  }
}

// Optional: skip specific owners (e.g. staff) via REMINDER_SKIP_OWNERS="Name One,Name Two".
// Default: nobody skipped.
const skipOwnerNames = () =>
  (process.env.REMINDER_SKIP_OWNERS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// Recurring events that don't need reminders (title substring match, case-insensitive).
// Override with REMINDER_SKIP_EVENTS="Sunday Service,Preservice Prayer".
const skipEventPatterns = () =>
  (process.env.REMINDER_SKIP_EVENTS || 'Sunday Service')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// Build this week's digest: bookings in tracked rooms, grouped by event owner
async function buildDigest(headers) {
  const { monday, sunday } = currentWeek();
  const startWide = shiftDate(monday, -1) + 'T13:00:00Z';
  const endWide = shiftDate(sunday, 1) + 'T13:59:59Z';

  const include = 'include=event,event.owner,resource_bookings';
  const urls = [
    `${PCO_BASE}/calendar/v2/event_instances?${include}&where[starts_at][lte]=${endWide}&where[ends_at][gte]=${startWide}&order=starts_at&per_page=100`,
    `${PCO_BASE}/calendar/v2/event_instances?${include}&where[starts_at][gte]=${startWide}&where[starts_at][lte]=${endWide}&order=starts_at&per_page=100`
  ];
  let result = await fetchAllPages(urls[0], headers, 15);
  if (!result.ok) result = await fetchAllPages(urls[1], headers, 15);
  if (!result.ok) return { error: `PCO Error (${result.status}): ${result.errorText}` };

  const included = result.included;
  const owners = {}; // ownerId -> { name, events: [] }
  const unassigned = [];
  const skipEvents = skipEventPatterns();
  const skippedEvents = [];

  for (const instance of result.data) {
    const startsAt = instance.attributes?.starts_at;
    const endsAt = instance.attributes?.ends_at;
    if (!startsAt || !endsAt) continue;
    // Must overlap the week (Melbourne days)
    if (melbDate(endsAt) < monday || melbDate(startsAt) > sunday) continue;

    // Tracked rooms only
    const bookingRefs = instance.relationships?.resource_bookings?.data || [];
    const roomNames = [];
    for (const ref of bookingRefs) {
      const booking = included.find(inc => inc.type === 'ResourceBooking' && inc.id === ref.id);
      const resourceId = booking?.relationships?.resource?.data?.id;
      if (resourceId && TRACKED_ROOMS[resourceId] && !roomNames.includes(TRACKED_ROOMS[resourceId])) {
        roomNames.push(TRACKED_ROOMS[resourceId]);
      }
    }
    if (roomNames.length === 0) continue;

    const eventId = instance.relationships?.event?.data?.id;
    const eventData = eventId ? included.find(inc => inc.type === 'Event' && inc.id === eventId) : null;
    const title = eventData?.attributes?.name || instance.attributes?.name || 'Untitled Event';

    // Recurring events that don't need reminders (e.g. Sunday services)
    if (skipEvents.some(p => title.toLowerCase().includes(p))) {
      skippedEvents.push({ title, when: `${fmtDay(startsAt)}, ${fmtTime(startsAt)}` });
      continue;
    }

    const ownerId = eventData?.relationships?.owner?.data?.id;
    const owner = ownerId ? included.find(inc => inc.type === 'Person' && inc.id === ownerId) : null;
    const ownerName = owner
      ? (owner.attributes?.name || [owner.attributes?.first_name, owner.attributes?.last_name].filter(Boolean).join(' '))
      : null;

    const event = {
      title,
      day: fmtDay(startsAt),
      time: `${fmtTime(startsAt)} – ${fmtTime(endsAt)}`,
      when: `${fmtDay(startsAt)}, ${fmtTime(startsAt)} – ${fmtTime(endsAt)}`,
      startsAt,
      rooms: roomNames
    };

    if (!ownerId || !ownerName) {
      unassigned.push(event);
    } else {
      if (!owners[ownerId]) owners[ownerId] = { ownerId, name: ownerName, events: [] };
      owners[ownerId].events.push(event);
    }
  }

  // Separate admin/staff accounts (event creators, not real owners)
  const skip = skipOwnerNames();
  const allOwners = Object.values(owners);
  const skippedOwners = [];
  const ownerList = [];
  for (const o of allOwners) {
    o.events.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    if (skip.includes(o.name.trim().toLowerCase())) {
      skippedOwners.push(o);
    } else {
      ownerList.push(o);
    }
  }

  // Resolve email addresses (only for owners who will actually be emailed)
  for (const o of ownerList) {
    const resolved = await resolveEmail(o.ownerId, headers);
    o.email = resolved.address;
    o.emailIssue = resolved.address ? null : resolved.reason;
  }
  ownerList.sort((a, b) => a.name.localeCompare(b.name));
  skippedOwners.sort((a, b) => a.name.localeCompare(b.name));

  return { monday, sunday, owners: ownerList, skippedOwners, skippedEvents, unassigned };
}

function emailBody(owner, monday, sunday) {
  const firstName = owner.name.split(' ')[0];
  const lines = owner.events.map(ev => `  •  ${ev.when} — ${ev.title} (${ev.rooms.join(', ')})`);
  const text =
`Hi ${firstName},

A friendly reminder of your room booking${owner.events.length > 1 ? 's' : ''} at FGAM this week (${fmtDateStr(monday)} – ${fmtDateStr(sunday)}):

${lines.join('\n')}

If anything has changed or you no longer need a room, you can reply to this email or contact Ruth Lara (ruth.lara@fgam.org.au) so it can be freed up for others.

See the live room calendar: https://fgapcorooms.vercel.app

— FGAM Calendar (automated weekly reminder)`;

  const html = `<p>Hi ${firstName},</p>
<p>A friendly reminder of your room booking${owner.events.length > 1 ? 's' : ''} at FGAM this week (<strong>${fmtDateStr(monday)} – ${fmtDateStr(sunday)}</strong>):</p>
<ul>${owner.events.map(ev => `<li><strong>${ev.when}</strong> — ${ev.title} <em>(${ev.rooms.join(', ')})</em></li>`).join('')}</ul>
<p>If anything has changed or you no longer need a room, you can reply to this email or contact Ruth Lara (<a href="mailto:ruth.lara@fgam.org.au">ruth.lara@fgam.org.au</a>) so it can be freed up for others.</p>
<p><a href="https://fgapcorooms.vercel.app">See the live room calendar</a></p>
<p style="color:#64748b;font-size:12px">— FGAM Calendar (automated weekly reminder)</p>`;

  return { text, html };
}

export default async function handler(req, res) {
  const adminKey = process.env.ADMIN_KEY;
  const providedKey = req.headers['x-admin-key'];
  const cronOk = !!process.env.CRON_SECRET && req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`;
  const adminOk = !!adminKey && providedKey === adminKey;

  if (!adminOk && !cronOk) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const appId = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;
  if (!appId || !secret) {
    return res.status(500).json({ error: 'PCO credentials missing' });
  }
  const headers = {
    'Authorization': `Basic ${Buffer.from(`${appId}:${secret}`).toString('base64')}`,
    'Accept': 'application/json',
    'User-Agent': 'FGAM-Resource-Planner-v1'
  };

  try {
    const digest = await buildDigest(headers);
    if (digest.error) return res.status(502).json({ error: digest.error });

    const wantsSend = req.method === 'POST' || (cronOk && req.method === 'GET' && !req.query.preview);

    if (!wantsSend) {
      // Preview / dry run
      return res.status(200).json(digest);
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    if (!gmailUser || !gmailPass) {
      return res.status(500).json({ error: 'Gmail credentials missing — set GMAIL_USER and GMAIL_APP_PASSWORD in Vercel.' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass }
    });

    // POST { ownerId } sends to just that person (e.g. an updated reminder
    // after a booking change); no body sends to everyone.
    const onlyOwnerId = req.method === 'POST' && req.body && req.body.ownerId
      ? String(req.body.ownerId) : null;
    const targets = onlyOwnerId
      ? digest.owners.filter(o => String(o.ownerId) === onlyOwnerId)
      : digest.owners;
    if (onlyOwnerId && targets.length === 0) {
      return res.status(404).json({ error: "That person has no bookings in this week's digest." });
    }

    const results = [];
    for (const owner of targets) {
      if (!owner.email) {
        results.push({ name: owner.name, email: null, events: owner.events.length, status: 'skipped — no email found in PCO' });
        continue;
      }
      const { text, html } = emailBody(owner, digest.monday, digest.sunday);
      try {
        await transporter.sendMail({
          from: `"FGAM Calendar" <${gmailUser}>`,
          to: owner.email,
          subject: `Your FGAM room booking${owner.events.length > 1 ? 's' : ''} this week (${fmtDateStr(digest.monday)} – ${fmtDateStr(digest.sunday)})`,
          text,
          html
        });
        results.push({ name: owner.name, email: owner.email, events: owner.events.length, status: 'sent' });
      } catch (err) {
        results.push({ name: owner.name, email: owner.email, events: owner.events.length, status: `failed — ${err.message}` });
      }
    }

    return res.status(200).json({
      monday: digest.monday,
      sunday: digest.sunday,
      sent: results.filter(r => r.status === 'sent').length,
      results,
      unassigned: digest.unassigned
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
