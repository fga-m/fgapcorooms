# UX/UI Audit — FGAM Room Calendar

Audited 6 Jul 2026. Audience: congregation members checking who has booked which rooms, on their own phones/computers and possibly a wall-mounted kiosk. Findings are ordered by severity; each notes where it applies (Web / Mobile / Kiosk) and where in the code it lives.

---

## Critical

### 1. Events spanning midnight disappear or clip (Web · Mobile · Kiosk)
The grid and feed only show bookings where `getMelbDate(b.start) === currentDate` (`app.jsx` ~line 508, 545). An event running 11pm Saturday to 1am Sunday shows only on Saturday, and Sunday's view claims the room is free when it isn't. The API already fetches a widened window; the frontend throws that data away. Fix: include events where the event *overlaps* the current day, and clamp the rendered bar to the visible range (the `getEventStyle` clamping already handles this).

### 2. Overlapping bookings in the same room render on top of each other (Web · Mobile · Kiosk)
Event blocks are absolutely positioned at `top-1` with fixed height (~line 519). Two bookings in the same room at the same time visually stack, hiding one entirely — a member could double-book believing the slot is free. Fix: detect overlaps per room and split the row into lanes (half-height blocks), or at minimum show a visible "+1 more" badge.

### 3. No way to see event details — including "who booked it" (Web · Mobile · Kiosk)
Tapping an event block does nothing. On mobile the grid shows 8px truncated titles, so most information is unreadable and unreachable. Critically, the stated purpose of the app is to see *who* booked a room, but the booking owner is never shown — only department tags. Fix: make blocks tappable, opening a detail sheet/modal with full title, time range, all rooms, tags, and the event owner (available from PCO's event `owner` relationship — the API would need to include it). This is the single highest-value improvement.

### 4. Data silently truncates at 100 records (Web · Mobile · Kiosk)
All three PCO fetches use `per_page=100` with no pagination (`calendar.mjs` lines 39–44). A busy day (the query window spans ~2 days of instances), or growth past 100 tags/rooms, silently drops bookings with no warning — the calendar will show rooms as free that aren't. Fix: follow `links.next` pagination, or at least surface a warning when `meta.total_count` exceeds what was fetched.

---

## High

### 5. Single-day view doesn't match the "days/months ahead" use case (Web · Mobile)
Members browsing upcoming weeks must tap through one day at a time. Suggest: a week strip (7 tappable day chips with event-count dots) above the grid, and/or an "Upcoming" feed mode listing the next 7–14 days grouped by day. The feed view is the natural home for this.

### 6. Text sizes fail accessibility by a wide margin (Web · Mobile · Kiosk)
The UI is dominated by 7–10px all-caps italic text (event titles 8–9px, room names 8px on mobile, times 7px). WCAG and platform guidelines put minimum comfortable body text at 14–16px; older congregation members will find this unreadable, and on a kiosk viewed from a distance it's invisible. Also several `text-slate-400`-on-white labels sit below 4.5:1 contrast. Fix: rework the type scale (events ≥12px, room labels ≥13px, metadata ≥11px), reserve all-caps for short labels only, and lift low-contrast text to `slate-500`/`slate-600`.

### 7. Touch targets too small on mobile (Mobile)
The time-shift arrows (10px icons in ~24px buttons), group collapse chevrons, and date-picker button are well under the 44×44px minimum. The drag-to-pan time header is undiscoverable (no affordance, no hint). Fix: enlarge hit areas via padding, and add a subtle grab-handle or "drag to pan" hint on first load.

### 8. No loading or stale-data indication (Web · Mobile · Kiosk)
While fetching, the only signal is the spinning refresh icon; the grid keeps showing the previous day's events under the new date — actively misleading for a second or two. `lastUpdated` is tracked in state but never displayed anywhere. Fix: dim/skeleton the grid while loading, and show "Updated 2 min ago" in the header (essential on a kiosk).

### 9. Feed empty state is broken (Web · Mobile)
The empty state only renders when `filteredBookings` is empty *before* date filtering (~line 544). If there are bookings in state but none today, the feed renders blank with no message. And the empty state itself shows a permanently spinning `RefreshCw` icon, which reads as "stuck loading" rather than "no events". Fix: filter first, then check length; use a calm calendar icon and "No events on this day".

### 10. Tailwind CDN + runtime font import in production (Web · Mobile · Kiosk)
`cdn.tailwindcss.com` (index.html line 8) is explicitly not for production: it ships the full JIT engine to every visitor, causes a flash of unstyled content, and breaks entirely if the CDN is unreachable — bad for an unattended kiosk. Fix: install Tailwind properly via PostCSS in the CRA build, and self-host or `preconnect` the Inter font.

---

## Medium

### 11. Auto-refresh and day rollover missing (Kiosk · Mobile)
Data only updates on manual refresh or date change. A kiosk will show morning data all day and yesterday's date after midnight. Fix: poll every 3–5 minutes (pause when `document.hidden`), and when viewing "today", roll `currentDate` over at midnight. Consider a `?kiosk=1` URL mode: larger type, chrome hidden, auto-refresh on, auto-return to today after inactivity.

### 12. Rooms matched by name string, not ID (maintenance risk)
`pcoRoomId` values are display names — the trailing space in `'Level 1 - Large Meeting Room '` shows how fragile this is. A rename in PCO silently empties a row. Fix: match on PCO resource IDs (the debug panel already surfaces them), keeping display names local.

### 13. No caching on the API route (Web · Mobile · Kiosk)
Every page load makes 3–4 PCO API calls per visitor (`calendar.mjs`). With a congregation checking on Sunday morning plus a polling kiosk, this risks PCO rate limits and slow loads. Fix: add `Cache-Control: s-maxage=60, stale-while-revalidate=300` so Vercel's edge absorbs repeat requests.

### 14. Error state is dead-ended (Web · Mobile · Kiosk)
Errors show a raw message with no retry action and no automatic recovery (~line 410). On a kiosk, one failed fetch strands an error banner indefinitely. Fix: add a Retry button, auto-retry with backoff, and keep showing the last good data with a "may be out of date" note rather than nothing.

### 15. Mobile grid tries to show too much (Mobile)
12 hourly columns plus a 56px room column on a ~375px screen leaves ~26px per hour — event blocks become unreadable slivers, and 20 rooms means heavy vertical scrolling. Fix: show 6–8 hours on mobile, and add a "hide empty rooms" toggle (also useful on desktop). Consider making Feed the mobile default since it's far more legible.

### 16. Date picker popover rough edges (Web · Mobile)
No click-outside or Escape to close; the tiny date text is the only affordance that it's tappable. On iOS the native input inside a custom popover is awkward — consider triggering the native picker directly from the date button.

---

## Low / polish

### 17. Duplicate icons in mobile bottom nav (Mobile)
"Feed" and "Filter" both use `ListFilter` (~lines 613, 627) — two identical icons side by side. Use `List` or `Rows3` for Feed. Also the Refresh button spins its entire button including the label; spin only the icon.

### 18. Accessibility semantics (Web · Mobile)
Icon-only buttons (refresh, debug, filters, arrows) lack `aria-label`s; the now-line and color-coded groups convey meaning by color alone; `alert('Copied!')` in the debug panel is jarring — use a transient toast. Add `aria-pressed` to filter chips and keyboard focus styles throughout.

### 19. Branding and naming (Web · Mobile)
Header says "FGAM Calendar" with a generic Zap icon; the page title says "Resource Planner | FGAM"; the repo says "PCO Room Planner". Pick one name, use the church logo, add a proper favicon, `theme-color`, and web-app-manifest so members can pin it to their home screen like an app.

### 20. Feed lacks "happening now" cues (Web · Mobile · Kiosk)
The grid has a now-line but the feed gives no sense of current time. Highlight in-progress events ("Now · ends 3:30pm") and de-emphasize finished ones.

---

## Suggested order of attack

1. Event detail modal with booking owner (#3) — delivers the app's core promise.
2. Overlap lanes + midnight-spanning fix (#1, #2) — correctness of the room-availability picture.
3. Type scale / contrast pass (#6, #7) — biggest legibility win for the congregation.
4. Loading/stale/error states + last-updated (#8, #9, #14).
5. Week strip / upcoming feed (#5).
6. Kiosk mode: auto-refresh, rollover, `?kiosk=1` (#11).
7. Infrastructure: Tailwind build, pagination, caching, room IDs (#10, #4, #13, #12).
