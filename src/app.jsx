/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Clock, Users, AlertCircle, Bug, RefreshCw,
  Zap, RotateCcw, CheckCircle2, ArrowLeft, ArrowRight, ShieldAlert,
  ListFilter, LayoutGrid, ChevronDown, ChevronUp, X, List, CalendarDays, Copy, User,
  FileText, ExternalLink, Mail
} from 'lucide-react';

const BOOKING_FORMS = [
  {
    id: 'general',
    title: 'General Booking Form',
    color: '#2563eb',
    description: (
      <>
        For booking events at FGAM that <strong>do not require</strong> use of the Sanctuary or the Commercial Kitchen.
        This form covers general-purpose bookings for rooms or resources, and online or hybrid meetings that may
        require access to media equipment or the FGAM Zoom accounts.
      </>
    ),
    buttonLabel: 'Open General Booking Form',
    url: 'https://fgamelbourne.churchcenter.com/calendar/forms/17124'
  },
  {
    id: 'kitchen-sanctuary',
    title: 'Booking Form (incl. Kitchen / Sanctuary)',
    color: '#059669',
    description: (
      <>
        For events at FGAM that <strong>do require</strong> use of the Sanctuary and/or the Commercial Kitchen.
      </>
    ),
    buttonLabel: 'Open Kitchen / Sanctuary Form',
    url: 'https://fgamelbourne.churchcenter.com/calendar/forms/17859'
  }
];

const ROOM_GROUPS = [
  {
    id: 'level2',
    label: 'Level 2',
    rooms: [
      { id: 'r1', resourceId: '725944', pcoRoomId: 'Level 2 - Sanctuary', displayName: 'Sanctuary', shortName: 'Sanct.' },
      { id: 'r2', resourceId: '746771', pcoRoomId: 'Level 2 - Main Lobby', displayName: 'Main Lobby', shortName: 'Lobby' },
      { id: 'r3', resourceId: '746776', pcoRoomId: 'Level 2 - Multipurpose Room', displayName: 'Multipurpose Room', shortName: 'MP Room' },
      { id: 'r4', resourceId: '746772', pcoRoomId: 'Level 2 - Meeting Room 1', displayName: 'Meeting Room 1', shortName: 'MR 1' },
      { id: 'r5', resourceId: '746773', pcoRoomId: 'Level 2 - Meeting Room 2', displayName: 'Meeting Room 2', shortName: 'MR 2' },
      { id: 'r6', resourceId: '746774', pcoRoomId: 'Level 2 - Meeting Room 3', displayName: 'Meeting Room 3', shortName: 'MR 3' },
      { id: 'r7', resourceId: '746775', pcoRoomId: 'Level 2 - Meeting Room 5', displayName: 'Meeting Room 5', shortName: 'MR 5' },
      { id: 'r8', resourceId: '746769', pcoRoomId: 'Level 2 - Commercial Kitchen', displayName: 'Commercial Kitchen', shortName: 'Kitchen' },
      { id: 'r9', resourceId: '746768', pcoRoomId: 'Level 2 - Backstage Area', displayName: 'Backstage Area', shortName: 'Bkstage' },
      { id: 'r10', resourceId: '746770', pcoRoomId: 'Level 2 - Guest Central', displayName: 'Guest Central', shortName: 'Guest' },
    ]
  },
  {
    id: 'level1',
    label: 'Level 1',
    rooms: [
      { id: 'r11', resourceId: '746764', pcoRoomId: 'Level 1 - Large Meeting Room ', displayName: 'Large Meeting Room', shortName: 'Large MR' },
      { id: 'r12', resourceId: '746765', pcoRoomId: 'Level 1 - Open Office Area', displayName: 'Open Office Area', shortName: 'Open Off.' },
      { id: 'r13', resourceId: '746763', pcoRoomId: "Level 1 - Chris' Office", displayName: "Chris' Office", shortName: "Chris'" },
      { id: 'r14', resourceId: '746767', pcoRoomId: 'Level 1 - Staff Kitchen', displayName: 'Staff Kitchen', shortName: 'St. Kit.' },
      { id: 'r15', resourceId: '746766', pcoRoomId: 'Level 1 - REACH Office', displayName: 'REACH Office', shortName: 'REACH' },
      { id: 'r16', resourceId: '817137', pcoRoomId: 'Covered rooftop carpark', displayName: 'Rooftop Carpark', shortName: 'Rooftop' },
    ]
  },
  {
    id: 'online',
    label: 'Online',
    rooms: [
      { id: 'r17', resourceId: '746778', pcoRoomId: '/zoom', displayName: 'Zoom 1', shortName: 'Z1' },
      { id: 'r18', resourceId: '746779', pcoRoomId: '/zoom2', displayName: 'Zoom 2', shortName: 'Z2' },
      { id: 'r19', resourceId: '746780', pcoRoomId: '/zoom3', displayName: 'Zoom 3', shortName: 'Z3' },
      { id: 'r20', resourceId: '746781', pcoRoomId: '/zoom4', displayName: 'Zoom 4', shortName: 'Z4' },
    ]
  }
];

const GROUP_COLORS = {
  level2: '#2563eb',
  level1: '#059669',
  online: '#4f46e5',
};

const TZ = 'Australia/Melbourne';

// Rooms that require the Kitchen/Sanctuary booking form
const KITCHEN_SANCTUARY_IDS = new Set(['725944', '746769']); // Sanctuary, Commercial Kitchen

const TIME_OPTIONS = Array.from({ length: 35 }, (_, i) => 6 + i * 0.5); // 6:00am – 11:00pm
const fmtHourLabel = (h) => {
  const hh = Math.floor(h);
  const mm = h % 1 ? '30' : '00';
  return `${hh % 12 || 12}:${mm} ${hh >= 12 ? 'pm' : 'am'}`;
};

// PCO room name (trimmed) -> friendly display name, and resource ID lookups.
// Matching is by PCO resource ID (rename-proof); names are a fallback.
const PCO_NAME_TO_DISPLAY = {};
const PCO_ID_TO_DISPLAY = {};
ROOM_GROUPS.forEach(g => g.rooms.forEach(r => {
  PCO_NAME_TO_DISPLAY[r.pcoRoomId.trim()] = r.displayName;
  if (r.resourceId) PCO_ID_TO_DISPLAY[r.resourceId] = r.displayName;
}));
const displayRoomName = (pcoName) => PCO_NAME_TO_DISPLAY[(pcoName || '').trim()] || pcoName;
const KNOWN_ROOM_KEYS = new Set(Object.keys(PCO_NAME_TO_DISPLAY));
const KNOWN_ROOM_IDS = new Set(Object.keys(PCO_ID_TO_DISPLAY));

// Friendly labels for a booking's rooms (prefer ID lookup, fall back to names)
const bookingRoomLabels = (b) => {
  if (b.rooms && b.rooms.length > 0) {
    return b.rooms.map(r => PCO_ID_TO_DISPLAY[r.id] || displayRoomName(r.name) || r.name).filter(Boolean);
  }
  return (b.roomNames || []).map(displayRoomName);
};

const bookingInKnownRoom = (b) =>
  (b.rooms || []).some(r => KNOWN_ROOM_IDS.has(r.id)) ||
  (b.roomNames || []).some(n => KNOWN_ROOM_KEYS.has(n));

const bookingMatchesRoom = (b, room) =>
  (b.rooms || []).some(r => r.id === room.resourceId) ||
  (room.pcoRoomId.trim() !== '' && (b.roomNames || []).includes(room.pcoRoomId.trim()));

const getMelbHour = (date) => {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: TZ, hour: 'numeric', minute: 'numeric', hour12: false
  }).formatToParts(new Date(date));
  const h = parseInt(parts.find(p => p.type === 'hour').value);
  const m = parseInt(parts.find(p => p.type === 'minute').value);
  return h + m / 60;
};

const getMelbDate = (date) => {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: TZ });
};

const todayMelbString = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
};

const shiftDateString = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().split('T')[0];
};

// Hour-of-day of `iso` relative to a given Melbourne day.
// Clamps to 0/24 when the timestamp falls on an earlier/later day,
// so events spanning midnight render correctly on every day they touch.
const getHourForDay = (iso, day) => {
  const d = getMelbDate(iso);
  if (d < day) return 0;
  if (d > day) return 24;
  return getMelbHour(iso);
};

const occursOnDay = (b, day) => getHourForDay(b.start, day) < getHourForDay(b.end, day);

// Assign overlapping events in a room to stacked lanes
const assignLanes = (events) => {
  const sorted = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
  const laneEnds = [];
  const out = sorted.map(ev => {
    let lane = laneEnds.findIndex(end => new Date(ev.start).getTime() >= end);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = new Date(ev.end).getTime();
    return { ...ev, lane };
  });
  return { events: out, laneCount: Math.max(1, laneEnds.length) };
};

const darkenHex = (hex, amount = 0.4) => {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * (1 - amount));
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * (1 - amount));
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
};

const hexToRgba = (hex, alpha = 0.85) => {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-AU', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const fmtDay = (iso) => new Date(iso).toLocaleDateString('en-AU', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });

// Responsive room column width
const ROOM_COL_MOBILE = 64;
const ROOM_COL_DESKTOP = 192;

const AUTO_REFRESH_MS = 5 * 60 * 1000;

// Hidden admin portal (/admin): preview + send the weekly reminder emails.
// History lives in the Gmail account's Sent folder.
const AdminPortal = () => {
  const [key, setKey] = useState(() => sessionStorage.getItem('fgam_admin_key') || '');
  const [input, setInput] = useState('');
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [error, setError] = useState(null);

  const loadPreview = useCallback(async (k) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/reminders?preview=1', { headers: { 'x-admin-key': k } });
      if (r.status === 401) {
        sessionStorage.removeItem('fgam_admin_key');
        setKey('');
        setError('Wrong passcode.');
        return;
      }
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `Error ${r.status}`);
      setDigest(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (key) loadPreview(key); }, [key, loadPreview]);

  const unlock = () => {
    const k = input.trim();
    if (!k) return;
    sessionStorage.setItem('fgam_admin_key', k);
    setKey(k);
  };

  const sendNow = async () => {
    if (!window.confirm('Send reminder emails to everyone listed now?')) return;
    setSending(true);
    setSendResult(null);
    setError(null);
    try {
      const r = await fetch('/api/reminders', { method: 'POST', headers: { 'x-admin-key': key } });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `Error ${r.status}`);
      setSendResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const emailable = digest ? digest.owners.filter(o => o.email).length : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Mail size={20} /></div>
          <div>
            <h1 className="text-base md:text-xl font-black uppercase tracking-tight italic text-slate-800 leading-none">Reminder Admin</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Weekly booking reminder emails</p>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-3 md:px-6 py-6 space-y-4 pb-16">
        {!key ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-5 max-w-sm mx-auto">
            <h2 className="font-black text-slate-800 text-[15px] uppercase tracking-tight">Enter passcode</h2>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') unlock(); }}
              className="mt-3 block w-full text-sm font-bold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Admin passcode"
              autoFocus
            />
            <button onClick={unlock} className="mt-3 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md">Unlock</button>
            {error && <p className="mt-3 text-[11px] font-bold text-rose-600">{error}</p>}
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 text-[12px] font-bold text-rose-800">{error}</div>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                <RefreshCw size={18} className="animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-widest">Loading this week…</span>
              </div>
            )}
            {digest && !loading && (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-black text-slate-800 text-[15px] uppercase tracking-tight">
                      Week of {new Date(digest.monday + 'T12:00:00Z').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {new Date(digest.sunday + 'T12:00:00Z').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </h2>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">{digest.owners.length} owner{digest.owners.length !== 1 ? 's' : ''} with bookings · {emailable} with an email address</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => loadPreview(key)} aria-label="Reload preview" className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600"><RefreshCw size={16} /></button>
                    <button
                      onClick={sendNow}
                      disabled={sending || emailable === 0}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-2"
                    >
                      <Mail size={14} /> {sending ? 'Sending…' : `Send ${emailable} email${emailable !== 1 ? 's' : ''} now`}
                    </button>
                  </div>
                </div>

                {sendResult && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                    <p className="text-[13px] font-black text-emerald-800">{sendResult.sent} email{sendResult.sent !== 1 ? 's' : ''} sent.</p>
                    <ul className="mt-2 space-y-1">
                      {sendResult.results.map((r, i) => (
                        <li key={i} className="text-[11px] font-bold text-slate-600">
                          {r.status === 'sent' ? '✅' : '⚠️'} {r.name} {r.email ? `(${r.email})` : ''} — {r.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  {digest.owners.map(o => (
                    <div key={o.ownerId} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-black text-slate-800 text-[14px] uppercase tracking-tight">{o.name}</h3>
                        {o.email
                          ? <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">{o.email}</span>
                          : o.emailIssue === 'email blocked in PCO'
                            ? <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Email blocked in PCO — unblock it on their profile</span>
                            : <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">{o.emailIssue || 'No email in PCO'}</span>}
                      </div>
                      <table className="mt-3 w-full text-left">
                        <thead>
                          <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                            <th className="py-1 pr-3 font-black">Event</th>
                            <th className="py-1 pr-3 font-black">Date</th>
                            <th className="py-1 pr-3 font-black">Time</th>
                            <th className="py-1 font-black">Rooms</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.events.map((ev, i) => (
                            <tr key={i} className="border-b border-slate-50 last:border-0 align-top">
                              <td className="py-1.5 pr-3 text-[12px] font-black text-slate-700">{ev.title}</td>
                              <td className="py-1.5 pr-3 text-[12px] font-bold text-slate-500 whitespace-nowrap">{ev.day}</td>
                              <td className="py-1.5 pr-3 text-[12px] font-bold text-slate-500 whitespace-nowrap">{ev.time}</td>
                              <td className="py-1.5 text-[12px] font-bold text-slate-500">{ev.rooms.join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                  {digest.owners.length === 0 && (
                    <p className="text-center text-[12px] font-bold text-slate-400 py-8">No room bookings this week.</p>
                  )}
                </div>

                {digest.skippedEvents && digest.skippedEvents.length > 0 && (
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4">
                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-tight">Excluded recurring events ({digest.skippedEvents.length})</p>
                    <ul className="mt-2 space-y-1">
                      {digest.skippedEvents.map((ev, i) => (
                        <li key={i} className="text-[11px] font-bold text-slate-500">{ev.when} — {ev.title}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[10px] font-bold text-slate-400">Edit the exclusion list via the REMINDER_SKIP_EVENTS environment variable in Vercel (comma-separated, matches event names containing the text).</p>
                  </div>
                )}

                {digest.skippedOwners && digest.skippedOwners.length > 0 && (
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4">
                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-tight">Skipped owners</p>
                    <ul className="mt-2 space-y-1">
                      {digest.skippedOwners.map(o => (
                        <li key={o.ownerId} className="text-[11px] font-bold text-slate-500">{o.name} — {o.events.length} event{o.events.length !== 1 ? 's' : ''}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[10px] font-bold text-slate-400">Controlled by the REMINDER_SKIP_OWNERS environment variable in Vercel.</p>
                  </div>
                )}

                {digest.unassigned && digest.unassigned.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                    <p className="text-[12px] font-black text-amber-900 uppercase tracking-tight">No owner set in PCO ({digest.unassigned.length}) — nobody will be emailed for these:</p>
                    <ul className="mt-2 space-y-1">
                      {digest.unassigned.map((ev, i) => (
                        <li key={i} className="text-[11px] font-bold text-amber-800">{ev.when} — {ev.title} ({ev.rooms.join(', ')})</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-center text-[10px] font-bold text-slate-400 pt-2">
                  Reminders also send automatically every Monday morning. Full send history: the Gmail account's Sent folder.
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const App = () => {
  // Hidden admin portal for weekly reminder emails
  const isAdmin = window.location.pathname.replace(/\/$/, '') === '/admin';

  // Kiosk mode (/kiosk or ?kiosk=1): lobby TV display — chrome hidden, grid only,
  // larger type, auto-refresh + auto-follow keep it live with zero interaction
  const isKiosk = window.location.pathname.replace(/\/$/, '') === '/kiosk'
    || new URLSearchParams(window.location.search).get('kiosk') === '1';

  const [currentDate, setCurrentDate] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('date');
    return /^\d{4}-\d{2}-\d{2}$/.test(p || '') ? p : todayMelbString();
  });
  const [viewStartHour, setViewStartHour] = useState(8);
  const [activeView, setActiveView] = useState(() => window.location.hash === '#book' ? 'booking' : 'grid');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [apiRooms, setApiRooms] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Room-discovery panel now lives behind ?debug=1 (no header button)
  const [showDebug, setShowDebug] = useState(() => new URLSearchParams(window.location.search).get('debug') === '1');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDeptFilters, setActiveDeptFilters] = useState([]);
  const [activeTypeFilters, setActiveTypeFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [hideEmptyRooms, setHideEmptyRooms] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [daySummary, setDaySummary] = useState({});
  const [findFrom, setFindFrom] = useState(18);
  const [findTo, setFindTo] = useState(21);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const visibleHoursCount = isMobile ? 8 : 12;
  const roomColWidth = isKiosk ? 268 : (isMobile ? ROOM_COL_MOBILE : ROOM_COL_DESKTOP);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep the visible window valid when hour count changes (mobile <-> desktop)
  useEffect(() => {
    setViewStartHour(prev => Math.max(0, Math.min(prev, 24 - visibleHoursCount)));
  }, [visibleHoursCount]);

  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleDeptFilter = (tagId) => {
    setActiveDeptFilters(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleTypeFilter = (tagId) => {
    setActiveTypeFilters(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setActiveDeptFilters([]);
    setActiveTypeFilters([]);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`/api/calendar?date=${currentDate}`, { signal: controller.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server Error ${response.status}`);
      setApiRooms(result.rooms || []);
      setAllTags(result.tags || []);
      const mappedBookings = (result.instances || []).map(instance => {
        const eventId = instance.relationships?.event?.data?.id;
        const eventData = (result.included || []).find(inc => inc.type === 'Event' && inc.id === eventId);
        return {
          id: instance.id,
          title: eventData?.attributes?.name || instance.attributes?.name || "Untitled Event",
          start: instance.attributes?.starts_at,
          end: instance.attributes?.ends_at,
          roomNames: (instance.resolvedRooms || []).map(n => (n || '').trim()),
          rooms: instance.resolvedRoomObjs || [],
          owner: instance.eventOwner || null,
          tags: instance.resolvedTags || [],
          departmentTags: instance.departmentTags || [],
          eventTypeTags: instance.eventTypeTags || [],
          eventColor: instance.eventColor || '#94a3b8'
        };
      });
      setBookings(mappedBookings);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.name === 'AbortError' ? 'Request timed out — please try again.' : err.message);
    } finally {
      clearTimeout(timeout);
      // Let the spinner complete at least half a turn so the refresh reads as "done"
      const remaining = Math.max(0, 500 - (Date.now() - started));
      setTimeout(() => setIsLoading(false), remaining);
    }
  }, [currentDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Shareable day links: keep ?date= in the URL as the user browses
  useEffect(() => {
    if (isKiosk) return;
    const url = new URL(window.location.href);
    if (currentDate === todayMelbString()) url.searchParams.delete('date');
    else url.searchParams.set('date', currentDate);
    window.history.replaceState({}, '', url);
  }, [currentDate, isKiosk]);

  // Strip dots: which of the next 14 days have tracked-room bookings
  const fetchSummary = useCallback(async () => {
    try {
      const r = await fetch(`/api/calendar?date=${todayMelbString()}&summary=14`);
      if (!r.ok) return;
      const json = await r.json();
      const map = {};
      for (const day of (json.days || [])) {
        const tracked = (day.roomIds || []).filter(id => KNOWN_ROOM_IDS.has(id));
        if (tracked.length > 0) map[day.date] = tracked.length;
      }
      setDaySummary(map);
    } catch (e) { /* dots are decorative — fail silently */ }
  }, []);
  useEffect(() => {
    if (isKiosk) return;
    fetchSummary();
    const id = setInterval(fetchSummary, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchSummary, isKiosk]);

  // Auto-refresh: poll while visible, refetch on wake (kiosk & mobile)
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) fetchData();
    }, AUTO_REFRESH_MS);
    const onVisible = () => { if (!document.hidden) fetchData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchData]);

  // Kiosk: keep the visible window following the current time (now-line stays ~2h in)
  useEffect(() => {
    if (!isKiosk) return;
    const follow = () => {
      if (currentDate === todayMelbString()) {
        setViewStartHour(Math.max(0, Math.min(24 - visibleHoursCount, Math.floor(getMelbHour(new Date())) - 2)));
      }
    };
    follow();
    const id = setInterval(follow, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [isKiosk, visibleHoursCount, currentDate]);

  // Roll over to the new day at midnight when viewing "today"
  const viewingTodayRef = useRef(true);
  useEffect(() => {
    viewingTodayRef.current = currentDate === todayMelbString();
  }, [currentDate]);
  useEffect(() => {
    const id = setInterval(() => {
      if (viewingTodayRef.current) {
        const t = todayMelbString();
        setCurrentDate(prev => (prev === t ? prev : t));
      }
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Trackpad/mouse-wheel horizontal swipe pans the time window.
  // Native (non-passive) listener so we can preventDefault and block
  // the browser's back/forward swipe gesture.
  const gridRef = useRef(null);
  const wheelAccum = useRef(0);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const PX_PER_HOUR = 50;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical scroll: leave alone
      e.preventDefault();
      wheelAccum.current += e.deltaX;
      const hours = Math.trunc(wheelAccum.current / PX_PER_HOUR);
      if (hours !== 0) {
        wheelAccum.current -= hours * PX_PER_HOUR;
        setViewStartHour(prev => Math.max(0, Math.min(24 - visibleHoursCount, prev + hours)));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [activeView, visibleHoursCount]);

  // Escape closes modal / date picker
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedEvent(null);
        setShowDatePicker(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const shiftTime = (amount) => {
    setViewStartHour(prev => Math.max(0, Math.min(24 - visibleHoursCount, prev + amount)));
  };

  const resetToToday = () => {
    setCurrentDate(todayMelbString());
    const now = new Date();
    setViewStartHour(Math.max(0, Math.min(24 - visibleHoursCount, Math.floor(getMelbHour(now)) - 1)));
  };

  const getEventStyle = (event) => {
    const startHour = getHourForDay(event.start, currentDate);
    const endHour = getHourForDay(event.end, currentDate);
    const effectiveStart = Math.max(startHour, viewStartHour);
    const effectiveEnd = Math.min(endHour, viewStartHour + visibleHoursCount);
    if (effectiveEnd <= effectiveStart) return { display: 'none' };
    const left = ((effectiveStart - viewStartHour) / visibleHoursCount) * 100;
    const width = ((effectiveEnd - effectiveStart) / visibleHoursCount) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const nowPos = useMemo(() => {
    const now = new Date();
    if (getMelbDate(now) !== currentDate) return null;
    const hour = getMelbHour(now);
    if (hour < viewStartHour || hour > viewStartHour + visibleHoursCount) return null;
    return ((hour - viewStartHour) / visibleHoursCount) * 100;
  }, [currentDate, viewStartHour, visibleHoursCount, lastUpdated]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (activeDeptFilters.length > 0) {
        const bookingDeptIds = b.departmentTags.map(t => t.id);
        if (!activeDeptFilters.some(id => bookingDeptIds.includes(id))) return false;
      }
      if (activeTypeFilters.length > 0) {
        const bookingTypeIds = b.eventTypeTags.map(t => t.id);
        if (!activeTypeFilters.some(id => bookingTypeIds.includes(id))) return false;
      }
      return true;
    });
  }, [bookings, activeDeptFilters, activeTypeFilters]);

  // Bookings that actually occur (fully or partly) on the selected day
  // and occupy at least one tracked room (physical or Zoom)
  const dayBookings = useMemo(
    () => filteredBookings.filter(b =>
      occursOnDay(b, currentDate) && bookingInKnownRoom(b)
    ),
    [filteredBookings, currentDate]
  );

  // Per-room events with overlap lanes assigned
  const roomData = useMemo(() => {
    const map = {};
    ROOM_GROUPS.forEach(group => group.rooms.forEach(room => {
      map[room.id] = assignLanes(dayBookings.filter(b => bookingMatchesRoom(b, room)));
    }));
    return map;
  }, [dayBookings]);

  const visibleRooms = useCallback((group) => (
    hideEmptyRooms
      ? group.rooms.filter(r => roomData[r.id].events.length > 0)
      : group.rooms
  ), [hideEmptyRooms, roomData]);

  const feedBookings = useMemo(
    () => [...dayBookings].sort((a, b) => new Date(a.start) - new Date(b.start)),
    [dayBookings]
  );

  const deptTags = useMemo(() => allTags.filter(t => t.groupName === 'Department/Ministries'), [allTags]);
  const eventTypeTags = useMemo(() => allTags.filter(t => t.groupName === 'Event Type'), [allTags]);

  // Kiosk (lobby TV) gets taller rows and larger type for distance viewing
  const rowHeight = isKiosk ? 88 : 64;
  const groupHeaderHeight = isKiosk ? 44 : 36;
  const totalHeight = ROOM_GROUPS.reduce((acc, group) => {
    acc += groupHeaderHeight;
    if (!collapsedGroups[group.id]) acc += visibleRooms(group).length * rowHeight;
    return acc;
  }, 0);

  const handleTimeHeaderDrag = (e) => {
    const isTouch = e.type === 'touchstart';
    const getX = (event) => isTouch ? event.touches[0].clientX : event.clientX;

    const startX = getX(e);
    const startHour = viewStartHour;
    const headerWidth = e.currentTarget.getBoundingClientRect().width;
    const hoursPerPixel = visibleHoursCount / headerWidth;

    const onMove = (moveEvent) => {
      const x = isTouch ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const dx = x - startX;
      const hourDelta = -(dx * hoursPerPixel);
      const newHour = Math.round(startHour + hourDelta);
      setViewStartHour(Math.max(0, Math.min(24 - visibleHoursCount, newHour)));
    };

    const onUp = () => {
      if (isTouch) {
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      } else {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }
    };

    if (isTouch) {
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onUp);
    } else {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
  };

  // Open the browser's native calendar immediately on tap;
  // fall back to the popover where showPicker() isn't supported
  const dateInputRef = useRef(null);
  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (el && typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch (e) { /* fall through to popover */ }
    }
    setShowDatePicker(prev => !prev);
  };

  const copyRoomId = (res) => {
    navigator.clipboard.writeText(res.name || res.id);
    setCopiedId(res.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const displayDate = new Date(currentDate + 'T12:00:00Z').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  const totalActiveFilters = activeDeptFilters.length + activeTypeFilters.length;
  const nowMs = Date.now();

  // Free-room finder: is this room booked during the chosen window on currentDate?
  // Uses unfiltered bookings so dept/type filters don't hide conflicts.
  const isRoomBusy = (room) => bookings.some(b =>
    bookingMatchesRoom(b, room) &&
    getHourForDay(b.start, currentDate) < findTo &&
    getHourForDay(b.end, currentDate) > findFrom
  );
  const formUrlForRoom = (room) =>
    KITCHEN_SANCTUARY_IDS.has(room.resourceId) ? BOOKING_FORMS[1].url : BOOKING_FORMS[0].url;
  const effectiveView = isKiosk ? 'grid' : activeView;

  // Next 14 days for the quick-browse strip
  const today = todayMelbString();
  const stripDays = Array.from({ length: 14 }, (_, i) => shiftDateString(today, i));
  const stripLabel = (ds) => {
    const d = new Date(ds + 'T12:00:00Z');
    return {
      weekday: d.toLocaleDateString('en-AU', { weekday: 'short' }),
      day: d.getUTCDate()
    };
  };

  if (isAdmin) return <AdminPortal />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 shadow-sm shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Zap size={20} /></div>
            <div>
              <h1 className="text-base md:text-xl font-black uppercase tracking-tight italic text-slate-800 leading-none">FGAM Calendar</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                {dayBookings.length} Events
                {totalActiveFilters > 0 && <span className="text-indigo-500">· {totalActiveFilters} filter{totalActiveFilters > 1 ? 's' : ''}</span>}
                {lastUpdated && <span className="text-slate-400 normal-case tracking-normal">· Updated {fmtTime(lastUpdated)}</span>}
              </p>
            </div>
          </div>
          {!isKiosk && <div className="flex items-center gap-2">
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button onClick={() => setActiveView('grid')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                <LayoutGrid size={14} /> Grid
              </button>
              <button onClick={() => setActiveView('feed')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'feed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                <List size={14} /> Feed
              </button>
            </div>
            <button
              onClick={() => setShowFilters(prev => !prev)}
              aria-label="Toggle filters"
              className={`p-2 rounded-xl border transition-all relative ${showFilters || totalActiveFilters > 0 ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}
            >
              <ListFilter size={18} />
              {totalActiveFilters > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{totalActiveFilters}</span>
              )}
            </button>
            <button onClick={fetchData} aria-label="Refresh" className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600">
              <RefreshCw size={18} className={isLoading ? 'animate-spin text-indigo-500' : ''} />
            </button>
          </div>}
        </div>

        {isKiosk ? (
          <div className="text-center font-black text-slate-700 uppercase tracking-tight text-2xl">{displayDate}</div>
        ) : (
        <>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 flex-1 max-w-xs mx-auto md:mx-0">
            <button onClick={() => setCurrentDate(shiftDateString(currentDate, -1))} aria-label="Previous day"
              className="p-2.5 hover:bg-white rounded-xl transition-all shrink-0"><ChevronLeft size={18} /></button>
            <div className="relative flex-1">
              <button
                onClick={openDatePicker}
                aria-label="Choose date"
                className="w-full font-black text-slate-700 text-center text-sm uppercase tracking-tight hover:text-indigo-600 transition-colors py-1.5"
              >
                {displayDate}
              </button>
              <input
                ref={dateInputRef}
                type="date"
                value={currentDate}
                onChange={(e) => { if (e.target.value) setCurrentDate(e.target.value); }}
                tabIndex={-1}
                aria-hidden="true"
                className="absolute left-1/2 top-full w-px h-px opacity-0 pointer-events-none"
              />
              {showDatePicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-64">
                    <input
                      type="date"
                      value={currentDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setCurrentDate(e.target.value);
                          setShowDatePicker(false);
                        }
                      }}
                      className="block w-full text-sm text-slate-700 font-bold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button onClick={() => setShowDatePicker(false)}
                      className="mt-2 w-full text-[10px] font-black uppercase text-slate-500 hover:text-slate-700">Close</button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setCurrentDate(shiftDateString(currentDate, 1))} aria-label="Next day"
              className="p-2.5 hover:bg-white rounded-xl transition-all shrink-0"><ChevronRight size={18} /></button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={resetToToday} className="px-3 py-2.5 bg-white hover:bg-slate-50 text-indigo-600 rounded-2xl text-xs font-black uppercase border border-indigo-100 shadow-sm transition-all flex items-center gap-1.5 shrink-0">
              <RotateCcw size={12} /> Today
            </button>
            <button
              onClick={() => setActiveView('booking')}
              className={`px-4 md:px-5 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm font-black uppercase tracking-wide transition-all flex items-center gap-2 shrink-0 shadow-md hover:shadow-lg hover:scale-[1.02] ${activeView === 'booking' ? 'bg-indigo-800 text-white ring-2 ring-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
              <FileText size={16} />
              <span className="hidden md:inline">Book a Room</span>
              <span className="md:hidden">Book</span>
            </button>
          </div>
        </div>

        {/* 14-day quick-browse strip */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          {stripDays.map(ds => {
            const { weekday, day } = stripLabel(ds);
            const isSelected = ds === currentDate;
            const isToday = ds === today;
            return (
              <button
                key={ds}
                onClick={() => setCurrentDate(ds)}
                aria-label={`Go to ${ds}`}
                className={`flex flex-col items-center min-w-[48px] px-2 py-1.5 rounded-xl border transition-all shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : isToday
                      ? 'bg-white border-indigo-300 text-indigo-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">{weekday}</span>
                <span className="text-sm font-black leading-tight mt-0.5">{day}</span>
                <span className={`w-1 h-1 rounded-full mt-0.5 ${daySummary[ds] ? (isSelected ? 'bg-white' : 'bg-indigo-500') : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>
        </>
        )}
      </header>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 shrink-0 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Department / Ministry</span>
                {activeDeptFilters.length > 0 && (
                  <button onClick={() => setActiveDeptFilters([])} className="text-[9px] font-black uppercase text-indigo-500">Clear</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {deptTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleDeptFilter(tag.id)}
                    aria-pressed={activeDeptFilters.includes(tag.id)}
                    className={`px-3 py-2 rounded-full text-[11px] font-black uppercase tracking-tight transition-all border-2 ${activeDeptFilters.includes(tag.id) ? 'border-transparent text-white shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
                    style={activeDeptFilters.includes(tag.id) ? { backgroundColor: darkenHex(tag.color, 0.3), borderColor: darkenHex(tag.color, 0.3) } : {}}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Event Type</span>
                {activeTypeFilters.length > 0 && (
                  <button onClick={() => setActiveTypeFilters([])} className="text-[9px] font-black uppercase text-indigo-500">Clear</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {eventTypeTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTypeFilter(tag.id)}
                    aria-pressed={activeTypeFilters.includes(tag.id)}
                    className={`px-3 py-2 rounded-full text-[11px] font-black uppercase tracking-tight transition-all border-2 ${activeTypeFilters.includes(tag.id) ? 'border-transparent text-white shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
                    style={activeTypeFilters.includes(tag.id) ? { backgroundColor: darkenHex(tag.color, 0.3), borderColor: darkenHex(tag.color, 0.3) } : {}}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHideEmptyRooms(prev => !prev)}
                aria-pressed={hideEmptyRooms}
                className={`px-3 py-2 rounded-full text-[11px] font-black uppercase tracking-tight transition-all border-2 ${hideEmptyRooms ? 'bg-slate-700 border-slate-700 text-white shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                Hide empty rooms
              </button>
              {totalActiveFilters > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-[11px] font-black uppercase text-slate-500 transition-all">
                  <X size={10} /> Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {error && (
          <div className="bg-rose-50 border-b border-rose-100 p-3 flex flex-col items-center gap-2 text-rose-800 shrink-0">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase"><AlertCircle size={14} /> Connection Error</div>
            <p className="text-[11px] font-bold text-center opacity-80 max-w-sm">
              {error.length > 150 ? `${error.substring(0, 150)}...` : error}
            </p>
            {bookings.length > 0 && (
              <p className="text-[10px] font-bold text-center opacity-60 max-w-sm">Showing previously loaded data — it may be out of date.</p>
            )}
            <button onClick={fetchData} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-[11px] font-black uppercase tracking-widest transition-all">
              Retry
            </button>
          </div>
        )}

        {effectiveView === 'grid' && (
          <div className="flex flex-1 overflow-hidden bg-slate-100/50 p-2 md:p-6 pb-16 md:pb-6">
            <div ref={gridRef} className={`bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-1 flex-col transition-opacity duration-300 ${isLoading ? 'opacity-50' : ''}`}>

              {/* Fixed header */}
              <div className="flex shrink-0 border-b border-slate-200">
                <div
                  className="shrink-0 bg-slate-100/50 border-r border-slate-200 h-12 flex items-center justify-between px-1 md:px-4"
                  style={{ width: `${roomColWidth}px` }}
                >
                  <span className="uppercase tracking-widest text-[9px] font-black text-slate-500 hidden md:block">Rooms</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => shiftTime(-1)} disabled={viewStartHour === 0} aria-label="Earlier hours" className="p-2 hover:bg-white rounded-lg text-slate-500 disabled:opacity-20"><ArrowLeft size={12} /></button>
                    <button onClick={() => shiftTime(1)} disabled={viewStartHour >= 24 - visibleHoursCount} aria-label="Later hours" className="p-2 hover:bg-white rounded-lg text-slate-500 disabled:opacity-20"><ArrowRight size={12} /></button>
                  </div>
                </div>
                <div
                  className="flex flex-1 bg-white cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleTimeHeaderDrag}
                  onTouchStart={handleTimeHeaderDrag}
                >
                  {Array.from({ length: visibleHoursCount }, (_, i) => viewStartHour + i).map(hour => (
                    <div key={hour} className={`flex-1 border-r border-slate-100 h-12 flex items-center justify-center font-black text-slate-500 uppercase italic pointer-events-none ${isKiosk ? 'text-[15px]' : 'text-[10px] md:text-[11px]'}`}>
                      {hour % 12 || 12}{hour >= 12 ? 'PM' : 'AM'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex overflow-y-auto scrollbar-hide" style={{ height: 'calc(100% - 3rem)' }}>

                {/* Left: room labels */}
                <div
                  className="shrink-0 border-r border-slate-200 bg-slate-50/50"
                  style={{ width: `${roomColWidth}px`, minHeight: `${totalHeight}px` }}
                >
                  {ROOM_GROUPS.map(group => (
                    <div key={group.id}>
                      <button
                        onClick={() => toggleGroup(group.id)}
                        aria-label={`Toggle ${group.label}`}
                        className="w-full flex items-center justify-between px-1 md:px-3 text-white font-black uppercase"
                        style={{ height: `${groupHeaderHeight}px`, backgroundColor: GROUP_COLORS[group.id], fontSize: isKiosk ? '13px' : (isMobile ? '9px' : '10px') }}
                      >
                        <span className="truncate">{isMobile ? group.label.split(' ')[1] || group.label : group.label}</span>
                        {collapsedGroups[group.id] ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                      </button>
                      {!collapsedGroups[group.id] && visibleRooms(group).map(room => (
                        <div
                          key={room.id}
                          className="border-b border-slate-100 px-1 md:px-3 flex items-center hover:bg-slate-100/50 transition-colors bg-white"
                          style={{ height: `${rowHeight}px` }}
                        >
                          <span className={`font-black text-slate-800 uppercase tracking-tight truncate leading-tight hidden md:block ${isKiosk ? 'text-[17px]' : 'text-[13px]'}`}>{room.displayName}</span>
                          <span className="font-black text-slate-800 uppercase tracking-tight truncate leading-tight md:hidden text-[10px]">{room.shortName}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Right: event grid */}
                <div className="flex-1 relative bg-white" style={{ minHeight: `${totalHeight}px` }}>
                  {nowPos !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 shadow-[0_0_15px_rgba(239,68,68,0.4)] pointer-events-none"
                      style={{ left: `${nowPos}%` }}
                    >
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full transform -translate-x-[4px] mt-1 shadow-sm" />
                    </div>
                  )}

                  {ROOM_GROUPS.map(group => (
                    <div key={group.id}>
                      <div
                        className="w-full opacity-20"
                        style={{ height: `${groupHeaderHeight}px`, backgroundColor: GROUP_COLORS[group.id] }}
                      />
                      {!collapsedGroups[group.id] && visibleRooms(group).map(room => {
                        const { events: lanedEvents, laneCount } = roomData[room.id];
                        const laneH = (rowHeight - 8) / laneCount;
                        return (
                          <div
                            key={room.id}
                            className="flex border-b border-slate-100 relative group overflow-hidden"
                            style={{ height: `${rowHeight}px` }}
                          >
                            {Array.from({ length: visibleHoursCount }).map((_, i) => (
                              <div key={i} className="flex-1 border-r border-slate-50/50 group-hover:bg-slate-50/10 transition-colors"></div>
                            ))}
                            {lanedEvents.map(b => (
                              <button
                                key={b.id}
                                onClick={() => setSelectedEvent(b)}
                                aria-label={`${b.title}, ${fmtTime(b.start)} to ${fmtTime(b.end)}`}
                                style={{
                                  ...getEventStyle(b),
                                  top: `${4 + b.lane * laneH}px`,
                                  height: `${laneH - (laneCount > 1 ? 2 : 0)}px`,
                                  backgroundColor: darkenHex(b.eventColor, 0.3),
                                  borderLeftColor: darkenHex(b.eventColor, 0.5)
                                }}
                                className="absolute rounded-lg md:rounded-xl px-1.5 md:px-2 py-0.5 shadow-lg border-l-4 text-white z-10 transition-transform hover:scale-[1.01] hover:z-20 flex flex-col justify-center overflow-hidden text-left cursor-pointer"
                              >
                                <p className={`font-black truncate uppercase leading-tight drop-shadow-sm ${isKiosk ? 'text-[15px]' : 'text-[10px] md:text-[11px]'}`}>{b.title}</p>
                                {laneH >= 40 && (
                                  <p className={`font-bold opacity-90 uppercase mt-0.5 flex items-center gap-1 ${isKiosk ? 'text-[13px]' : 'text-[9px]'}`}>
                                    <Clock size={isKiosk ? 13 : 9} className="shrink-0" />
                                    {fmtTime(b.start)}
                                  </p>
                                )}
                                {!isMobile && laneH >= 52 && b.departmentTags.length > 0 && (
                                  <p className="text-[9px] font-black opacity-90 uppercase mt-0.5 truncate">{b.departmentTags.map(t => t.name).join(', ')}</p>
                                )}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {effectiveView === 'feed' && (
          <div className={`flex-1 overflow-auto bg-slate-100/50 transition-opacity duration-300 ${isLoading ? 'opacity-50' : ''}`}>
            <div className="max-w-2xl mx-auto px-3 md:px-6 py-4 space-y-3 pb-24">
              {feedBookings.length > 0 ? feedBookings.map(b => {
                const isNow = new Date(b.start).getTime() <= nowMs && nowMs < new Date(b.end).getTime();
                const isPast = new Date(b.end).getTime() < nowMs;
                const startsOtherDay = getMelbDate(b.start) !== currentDate;
                const endsOtherDay = getMelbDate(b.end) !== currentDate;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedEvent(b)}
                    className={`w-full text-left bg-white rounded-2xl md:rounded-3xl border shadow-sm overflow-hidden relative transition-all hover:shadow-md ${isNow ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-slate-200'} ${isPast ? 'opacity-60' : ''}`}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: darkenHex(b.eventColor, 0.3) }} />
                    <div className="pl-5 pr-4 py-4 flex items-start gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 shrink-0">
                        <span className="text-[9px] font-black uppercase text-slate-500 leading-none">{new Date(b.start).toLocaleDateString('en-AU', { timeZone: TZ, weekday: 'short' })}</span>
                        <span className="text-base font-black text-slate-800 leading-none mt-0.5">{new Date(b.start).toLocaleDateString('en-AU', { timeZone: TZ, day: 'numeric' })}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-800 text-[15px] uppercase tracking-tight leading-tight">{b.title}</h3>
                          {isNow && <span className="text-[9px] font-black uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-full">Now</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Clock size={11} className="text-indigo-400 shrink-0" />
                            {startsOtherDay && `${new Date(b.start).toLocaleDateString('en-AU', { timeZone: TZ, weekday: 'short' })} `}
                            {fmtTime(b.start)}
                            {' – '}
                            {endsOtherDay && `${new Date(b.end).toLocaleDateString('en-AU', { timeZone: TZ, weekday: 'short' })} `}
                            {fmtTime(b.end)}
                          </span>
                          {bookingRoomLabels(b).length > 0 && (
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                              <Users size={11} className="text-indigo-400 shrink-0" />
                              {bookingRoomLabels(b).join(', ')}
                            </span>
                          )}
                        </div>
                        {(b.departmentTags.length > 0 || b.eventTypeTags.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {b.departmentTags.map(tag => (
                              <span
                                key={tag.id}
                                className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
                                style={{ backgroundColor: hexToRgba(tag.color, 0.15), color: darkenHex(tag.color, 0.4) }}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {b.eventTypeTags.map(tag => (
                              <span
                                key={tag.id}
                                className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase border"
                                style={{ borderColor: hexToRgba(tag.color, 0.5), color: darkenHex(tag.color, 0.4) }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="text-center py-20 opacity-50 flex flex-col items-center gap-4">
                  {isLoading ? (
                    <RefreshCw className="animate-spin text-slate-300" size={40} />
                  ) : (
                    <CalendarDays className="text-slate-300" size={40} />
                  )}
                  <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                    {isLoading ? 'Loading events…' : 'No events on this day'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {effectiveView === 'booking' && (
          <div className="flex-1 overflow-auto bg-slate-100/50">
            <div className="max-w-2xl mx-auto px-3 md:px-6 py-6 space-y-4 pb-24">
              <div className="text-center mb-2">
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight italic text-slate-800">FGAM Booking Forms</h2>
                <p className="text-[11px] font-bold text-slate-500 mt-1">Choose the form that matches your event.</p>
              </div>

              {/* Free-room finder */}
              <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm px-5 py-5">
                <h3 className="font-black text-slate-800 text-[15px] uppercase tracking-tight leading-tight">Check Room Availability</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-1">Pick a date and time — free rooms link straight to the right form.</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => { if (e.target.value) setCurrentDate(e.target.value); }}
                    className="text-xs font-bold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <select
                    value={findFrom}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setFindFrom(v);
                      if (v >= findTo) setFindTo(Math.min(23, v + 1));
                    }}
                    className="text-xs font-bold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {TIME_OPTIONS.map(h => <option key={h} value={h}>{fmtHourLabel(h)}</option>)}
                  </select>
                  <span className="text-[11px] font-black uppercase text-slate-400">to</span>
                  <select
                    value={findTo}
                    onChange={(e) => setFindTo(Number(e.target.value))}
                    className="text-xs font-bold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {TIME_OPTIONS.filter(h => h > findFrom).map(h => <option key={h} value={h}>{fmtHourLabel(h)}</option>)}
                  </select>
                  {isLoading && <RefreshCw size={14} className="animate-spin text-indigo-400" />}
                </div>
                <div className="mt-4 space-y-3">
                  {ROOM_GROUPS.map(group => (
                    <div key={group.id}>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: GROUP_COLORS[group.id] }}>{group.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.rooms.map(room => {
                          const busy = isRoomBusy(room);
                          return busy ? (
                            <span
                              key={room.id}
                              className="px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight bg-slate-100 text-slate-400 line-through"
                            >
                              {room.displayName}
                            </span>
                          ) : (
                            <a
                              key={room.id}
                              href={formUrlForRoom(room)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Book ${room.displayName}`}
                              className="px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                            >
                              {room.displayName} <ExternalLink size={9} />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-3">
                  Struck-through rooms are booked between {fmtHourLabel(findFrom)} and {fmtHourLabel(findTo)} on {displayDate}. Green rooms are free — tap to book.
                </p>
              </div>

              {BOOKING_FORMS.map(form => (
                <div key={form.id} className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: form.color }} />
                  <div className="pl-6 pr-5 py-5">
                    <h3 className="font-black text-slate-800 text-[15px] uppercase tracking-tight leading-tight">{form.title}</h3>
                    <p className="text-[13px] font-medium text-slate-600 mt-2 leading-relaxed">{form.description}</p>
                    <a
                      href={form.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-md transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: form.color }}
                    >
                      <ExternalLink size={13} /> {form.buttonLabel}
                    </a>
                  </div>
                </div>
              ))}

              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                <p className="text-[12px] font-bold text-amber-900">
                  📌 Please submit only <strong>one</strong> booking form per event to avoid duplication.
                </p>
              </div>

              <div className="text-center pt-2">
                <p className="text-[12px] font-bold text-slate-500">
                  Questions or inquiries? Contact Ruth:
                </p>
                <a
                  href="mailto:ruth.lara@fgam.org.au"
                  className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-black text-indigo-600 hover:text-indigo-800"
                >
                  <Mail size={13} /> ruth.lara@fgam.org.au
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label="Event details">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSelectedEvent(null)} />
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="h-2 shrink-0" style={{ backgroundColor: darkenHex(selectedEvent.eventColor, 0.3) }} />
            <div className="p-5 md:p-6 overflow-y-auto">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-black text-slate-800 text-lg uppercase tracking-tight leading-tight">{selectedEvent.title}</h2>
                <button onClick={() => setSelectedEvent(null)} aria-label="Close" className="p-2 -m-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0">
                  <X size={20} />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarDays size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                  <p className="text-sm font-bold text-slate-700">
                    {getMelbDate(selectedEvent.start) === getMelbDate(selectedEvent.end)
                      ? `${fmtDay(selectedEvent.start)} · ${fmtTime(selectedEvent.start)} – ${fmtTime(selectedEvent.end)}`
                      : `${fmtDay(selectedEvent.start)} ${fmtTime(selectedEvent.start)} – ${fmtDay(selectedEvent.end)} ${fmtTime(selectedEvent.end)}`}
                  </p>
                </div>
                {bookingRoomLabels(selectedEvent).length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                    <p className="text-sm font-bold text-slate-700">{bookingRoomLabels(selectedEvent).join(', ')}</p>
                  </div>
                )}
                {selectedEvent.owner && (
                  <div className="flex items-start gap-3">
                    <User size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                    <p className="text-sm font-bold text-slate-700">Booked by {selectedEvent.owner}</p>
                  </div>
                )}
                {(selectedEvent.departmentTags.length > 0 || selectedEvent.eventTypeTags.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedEvent.departmentTags.map(tag => (
                      <span key={tag.id} className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase"
                        style={{ backgroundColor: hexToRgba(tag.color, 0.15), color: darkenHex(tag.color, 0.4) }}>
                        {tag.name}
                      </span>
                    ))}
                    {selectedEvent.eventTypeTags.map(tag => (
                      <span key={tag.id} className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase border"
                        style={{ borderColor: hexToRgba(tag.color, 0.5), color: darkenHex(tag.color, 0.4) }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      {!isKiosk && <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around z-40 shadow-lg">
        <button
          onClick={() => setActiveView('feed')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all ${activeView === 'feed' ? 'text-indigo-600' : 'text-slate-500'}`}
        >
          <List size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Feed</span>
        </button>
        <button
          onClick={() => setActiveView('grid')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all ${activeView === 'grid' ? 'text-indigo-600' : 'text-slate-500'}`}
        >
          <LayoutGrid size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Grid</span>
        </button>
        <button
          onClick={() => setActiveView('booking')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all ${activeView === 'booking' ? 'text-indigo-600' : 'text-slate-500'}`}
        >
          <FileText size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Book</span>
        </button>
        <button
          onClick={() => setShowFilters(prev => !prev)}
          className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all relative ${showFilters || totalActiveFilters > 0 ? 'text-indigo-600' : 'text-slate-500'}`}
        >
          <ListFilter size={20} />
          {totalActiveFilters > 0 && (
            <span className="absolute top-1 right-2 bg-indigo-600 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">{totalActiveFilters}</span>
          )}
          <span className="text-[9px] font-black uppercase tracking-widest">Filter</span>
        </button>
        <button
          onClick={fetchData}
          className="flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all text-slate-500"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin text-indigo-500' : ''} />
          <span className="text-[9px] font-black uppercase tracking-widest">Refresh</span>
        </button>
      </div>}

      {showDebug && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-amber-400 z-[100] h-96 overflow-hidden shadow-2xl flex flex-col p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-amber-900 uppercase text-xs flex items-center gap-2"><Bug size={16} className="text-amber-500" /> Room Discovery</h2>
            <button onClick={() => setShowDebug(false)} className="text-amber-500 font-black hover:text-amber-700 text-xs uppercase">Close</button>
          </div>
          <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
            {apiRooms.length > 0 ? apiRooms.map(res => (
              <div key={res.id} className="p-3 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-between hover:border-amber-100 transition-all">
                <div className="overflow-hidden pr-3">
                  <p className="font-black text-[11px] text-slate-800 truncate uppercase tracking-tight">{res.name || 'Unnamed'}</p>
                  <code className="text-[10px] font-mono text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded mt-1 inline-block">{res.id}</code>
                </div>
                <button
                  onClick={() => copyRoomId(res)}
                  aria-label={`Copy ${res.name || res.id}`}
                  className={`p-2 rounded-xl transition-all ${copiedId === res.id ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500 hover:text-indigo-600'}`}
                >
                  {copiedId === res.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )) : (
              <div className="col-span-full py-12 flex flex-col items-center gap-3">
                <ShieldAlert className="text-amber-400" size={28} />
                <p className="text-[11px] font-black uppercase text-amber-900">No room data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
