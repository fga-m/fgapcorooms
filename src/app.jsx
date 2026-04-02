/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Clock, Users, AlertCircle, Bug, RefreshCw,
  Zap, RotateCcw, CheckCircle2, ArrowLeft, ArrowRight, ShieldAlert,
  ListFilter, LayoutGrid, FileCode, ChevronDown, ChevronUp, X
} from 'lucide-react';

const ROOM_GROUPS = [
  {
    id: 'level2',
    label: 'Level 2',
    rooms: [
      { id: 'r1', pcoRoomId: 'Level 2 - Sanctuary', displayName: 'Sanctuary' },
      { id: 'r2', pcoRoomId: 'Level 2 - Main Lobby', displayName: 'Main Lobby' },
      { id: 'r3', pcoRoomId: 'Level 2 - Multipurpose Room', displayName: 'Multipurpose Room' },
      { id: 'r4', pcoRoomId: 'Level 2 - Meeting Room 1', displayName: 'Meeting Room 1' },
      { id: 'r5', pcoRoomId: 'Level 2 - Meeting Room 2', displayName: 'Meeting Room 2' },
      { id: 'r6', pcoRoomId: 'Level 2 - Meeting Room 3', displayName: 'Meeting Room 3' },
      { id: 'r7', pcoRoomId: 'Level 2 - Meeting Room 5', displayName: 'Meeting Room 5' },
      { id: 'r8', pcoRoomId: 'Level 2 - Commercial Kitchen', displayName: 'Commercial Kitchen' },
      { id: 'r9', pcoRoomId: 'Level 2 - Backstage Area', displayName: 'Backstage Area' },
      { id: 'r10', pcoRoomId: 'Level 2 - Guest Central', displayName: 'Guest Central' },
    ]
  },
  {
    id: 'level1',
    label: 'Level 1',
    rooms: [
      { id: 'r11', pcoRoomId: 'Level 1 - Large Meeting Room ', displayName: 'Large Meeting Room' },
      { id: 'r12', pcoRoomId: 'Level 1 - Open Office Area', displayName: 'Open Office Area' },
      { id: 'r13', pcoRoomId: "Level 1 - Chris' Office", displayName: "Chris' Office" },
      { id: 'r14', pcoRoomId: 'Level 1 - Staff Kitchen', displayName: 'Staff Kitchen' },
      { id: 'r15', pcoRoomId: 'Level 1 - REACH Office', displayName: 'REACH Office' },
      { id: 'r16', pcoRoomId: 'Covered rooftop carpark', displayName: 'Rooftop Carpark' },
    ]
  },
  {
    id: 'online',
    label: 'Online',
    rooms: [
      { id: 'r17', pcoRoomId: '/zoom', displayName: 'Zoom 1' },
      { id: 'r18', pcoRoomId: '/zoom2', displayName: 'Zoom 2' },
      { id: 'r19', pcoRoomId: '/zoom3', displayName: 'Zoom 3' },
      { id: 'r20', pcoRoomId: '/zoom4', displayName: 'Zoom 4' },
    ]
  }
];

const GROUP_COLORS = {
  level2: '#2563eb',
  level1: '#059669',
  online: '#4f46e5',
};

const TZ = 'Australia/Melbourne';

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

// Convert hex color to a slightly transparent version for event backgrounds
const hexToRgba = (hex, alpha = 0.85) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const App = () => {
  const [currentDate, setCurrentDate] = useState(todayMelbString());
  const [viewStartHour, setViewStartHour] = useState(8);
  const [activeView, setActiveView] = useState('grid');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [apiRooms, setApiRooms] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDeptFilters, setActiveDeptFilters] = useState([]);
  const [activeTypeFilters, setActiveTypeFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const visibleHoursCount = 12;

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
    setError(null);
    try {
      const response = await fetch(`/api/calendar?date=${currentDate}`);
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
          roomNames: instance.resolvedRooms || [],
          tags: instance.resolvedTags || [],
          departmentTags: instance.departmentTags || [],
          eventTypeTags: instance.eventTypeTags || [],
          eventColor: instance.eventColor || '#94a3b8'
        };
      });

      setBookings(mappedBookings);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const shiftTime = (amount) => {
    setViewStartHour(prev => Math.max(0, Math.min(24 - visibleHoursCount, prev + amount)));
  };

  const resetToToday = () => {
    setCurrentDate(todayMelbString());
    const now = new Date();
    setViewStartHour(Math.max(0, Math.min(24 - visibleHoursCount, Math.floor(getMelbHour(now)) - 1)));
  };

  const getEventStyle = (event) => {
    const startHour = getMelbHour(event.start);
    const endHour = getMelbHour(event.end);
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
  }, [currentDate, viewStartHour]);

  // Filter bookings based on active tag filters
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

  const deptTags = useMemo(() => allTags.filter(t => t.groupName === 'Department/Ministries'), [allTags]);
  const eventTypeTags = useMemo(() => allTags.filter(t => t.groupName === 'Event Type'), [allTags]);

  const rowHeight = 64;
  const groupHeaderHeight = 36;
  const totalHeight = ROOM_GROUPS.reduce((acc, group) => {
    acc += groupHeaderHeight;
    if (!collapsedGroups[group.id]) acc += group.rooms.length * rowHeight;
    return acc;
  }, 0);

  const handleTimeHeaderDrag = (e) => {
    const startX = e.clientX;
    const startHour = viewStartHour;
    const headerWidth = e.currentTarget.getBoundingClientRect().width;
    const hoursPerPixel = visibleHoursCount / headerWidth;
    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const hourDelta = -(dx * hoursPerPixel);
      const newHour = Math.round(startHour + hourDelta);
      setViewStartHour(Math.max(0, Math.min(24 - visibleHoursCount, newHour)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const displayDate = new Date(currentDate + 'T12:00:00Z').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  const totalActiveFilters = activeDeptFilters.length + activeTypeFilters.length;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg"><Zap size={24} /></div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight italic text-slate-800 leading-none">FGAM Calendar</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-1.5">
              {filteredBookings.length} Events
              {totalActiveFilters > 0 && <span className="text-indigo-500">· {totalActiveFilters} filter{totalActiveFilters > 1 ? 's' : ''} active</span>}
              {lastUpdated && <span className="opacity-40">· {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button onClick={() => setCurrentDate(shiftDateString(currentDate, -1))}
              className="p-2 hover:bg-white rounded-xl transition-all"><ChevronLeft size={18} /></button>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(prev => !prev)}
                className="px-4 font-black text-slate-700 min-w-[160px] text-center text-xs uppercase tracking-tight hover:text-indigo-600 transition-colors"
              >
                {displayDate}
              </button>
              {showDatePicker && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4">
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
                    className="mt-2 w-full text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Close</button>
                </div>
              )}
            </div>
            <button onClick={() => setCurrentDate(shiftDateString(currentDate, 1))}
              className="p-2 hover:bg-white rounded-xl transition-all"><ChevronRight size={18} /></button>
          </div>
          <button onClick={resetToToday} className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-600 rounded-2xl text-xs font-black uppercase border border-indigo-100 shadow-sm transition-all flex items-center gap-2">
            <RotateCcw size={14} /> Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
            <button onClick={() => setActiveView('grid')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutGrid size={14} /> Grid
            </button>
            <button onClick={() => setActiveView('feed')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'feed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <ListFilter size={14} /> Feed
            </button>
          </div>
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={`p-2 rounded-xl border transition-all relative ${showFilters || totalActiveFilters > 0 ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-400 shadow-sm'}`}
          >
            <ListFilter size={20} />
            {totalActiveFilters > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{totalActiveFilters}</span>
            )}
          </button>
          <button onClick={() => setShowDebug(!showDebug)} className={`p-2 rounded-xl border transition-all ${showDebug ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-400 shadow-sm'}`}><Bug size={20} /></button>
          <button onClick={fetchData} className={`p-2 bg-white rounded-xl border border-slate-200 shadow-sm ${isLoading ? 'animate-spin text-indigo-500' : 'text-slate-400 hover:text-indigo-600'}`}><RefreshCw size={20} /></button>
        </div>
      </header>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-sm">
          <div className="flex items-start gap-8 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Department / Ministry</span>
                {activeDeptFilters.length > 0 && (
                  <button onClick={() => setActiveDeptFilters([])} className="text-[8px] font-black uppercase text-indigo-500 hover:text-indigo-700">Clear</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {deptTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleDeptFilter(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all border-2 ${activeDeptFilters.includes(tag.id) ? 'border-transparent text-white shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    style={activeDeptFilters.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Event Type</span>
                {activeTypeFilters.length > 0 && (
                  <button onClick={() => setActiveTypeFilters([])} className="text-[8px] font-black uppercase text-indigo-500 hover:text-indigo-700">Clear</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {eventTypeTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTypeFilter(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all border-2 ${activeTypeFilters.includes(tag.id) ? 'border-transparent text-white shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    style={activeTypeFilters.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
            {totalActiveFilters > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-black uppercase text-slate-500 transition-all self-end mb-0.5">
                <X size={10} /> Clear All
              </button>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {error && (
          <div className="bg-rose-50 border-b border-rose-100 p-4 flex flex-col items-center justify-center gap-2 text-rose-800 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase"><AlertCircle size={14} /> Connection Error</div>
            <div className="max-w-2xl bg-white/50 rounded-xl p-3 border border-rose-100 flex items-start gap-3">
              <FileCode className="shrink-0 mt-1" size={16} />
              <p className="text-[10px] font-bold leading-relaxed italic opacity-80">
                {error.length > 200 ? `${error.substring(0, 200)}...` : error}
              </p>
            </div>
          </div>
        )}

        {activeView === 'grid' ? (
          <div className="flex-1 flex overflow-hidden bg-slate-100/50 p-6">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-1 flex-col">

              {/* Fixed header */}
              <div className="flex shrink-0 border-b border-slate-200">
                <div className="w-48 shrink-0 bg-slate-100/50 border-r border-slate-200 h-12 flex items-center justify-between px-4">
                  <span className="uppercase tracking-widest text-[9px] font-black text-slate-400">Rooms</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => shiftTime(-1)} disabled={viewStartHour === 0} className="p-1 hover:bg-white rounded-lg text-slate-400 disabled:opacity-20"><ArrowLeft size={12} /></button>
                    <button onClick={() => shiftTime(1)} disabled={viewStartHour >= 24 - visibleHoursCount} className="p-1 hover:bg-white rounded-lg text-slate-400 disabled:opacity-20"><ArrowRight size={12} /></button>
                  </div>
                </div>
                <div
                  className="flex flex-1 bg-white cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleTimeHeaderDrag}
                >
                  {Array.from({ length: visibleHoursCount }, (_, i) => viewStartHour + i).map(hour => (
                    <div key={hour} className="flex-1 border-r border-slate-100 h-12 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase italic pointer-events-none">
                      {hour % 12 || 12}{hour >= 12 ? 'PM' : 'AM'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex overflow-y-auto scrollbar-hide" style={{ height: 'calc(100% - 3rem)' }}>

                {/* Left: room labels */}
                <div className="w-48 shrink-0 border-r border-slate-200 bg-slate-50/50" style={{ minHeight: `${totalHeight}px` }}>
                  {ROOM_GROUPS.map(group => (
                    <div key={group.id}>
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between px-4 text-white text-[9px] font-black uppercase tracking-widest"
                        style={{ height: `${groupHeaderHeight}px`, backgroundColor: GROUP_COLORS[group.id] }}
                      >
                        <span>{group.label}</span>
                        {collapsedGroups[group.id] ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                      </button>
                      {!collapsedGroups[group.id] && group.rooms.map(room => (
                        <div
                          key={room.id}
                          className="border-b border-slate-100 px-4 flex items-center hover:bg-slate-100/50 transition-colors bg-white"
                          style={{ height: `${rowHeight}px` }}
                        >
                          <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight truncate">{room.displayName}</span>
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
                      {!collapsedGroups[group.id] && group.rooms.map(room => (
                        <div
                          key={room.id}
                          className="flex border-b border-slate-100 relative group overflow-hidden"
                          style={{ height: `${rowHeight}px` }}
                        >
                          {Array.from({ length: visibleHoursCount }).map((_, i) => (
                            <div key={i} className="flex-1 border-r border-slate-50/50 group-hover:bg-slate-50/10 transition-colors"></div>
                          ))}
                          {filteredBookings
                            .filter(b => {
                              if (!b.roomNames.includes(room.pcoRoomId) || room.pcoRoomId === "") return false;
                              return getMelbDate(b.start) === currentDate;
                            })
                            .map(b => (
                              <div
                                key={b.id}
                                style={{
                                  ...getEventStyle(b),
                                  backgroundColor: hexToRgba(b.eventColor),
                                  borderLeftColor: b.eventColor
                                }}
                                className="absolute top-1 h-14 rounded-xl p-2 shadow-lg border-l-4 text-white z-10 transition-transform hover:scale-[1.01] hover:z-20 flex flex-col justify-center overflow-hidden"
                              >
                                <p className="text-[9px] font-black truncate uppercase leading-tight drop-shadow-sm">{b.title}</p>
                                <p className="text-[7px] font-bold opacity-90 uppercase mt-0.5 flex items-center gap-1">
                                  <Clock size={8} className="shrink-0" />
                                  {new Date(b.start).toLocaleTimeString('en-AU', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })}
                                </p>
                                {b.departmentTags.length > 0 && (
                                  <p className="text-[7px] font-black opacity-90 uppercase mt-0.5 truncate">
                                    {b.departmentTags.map(t => t.name).join(', ')}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-6 bg-slate-100/50">
            <div className="max-w-4xl mx-auto space-y-4 pb-20">
              {filteredBookings.length > 0 ? filteredBookings
                .filter(b => getMelbDate(b.start) === currentDate)
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .map(b => (
                  <div key={b.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 transition-all hover:shadow-md overflow-hidden relative">
                    {/* Colour accent bar using event tag colour */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl" style={{ backgroundColor: b.eventColor }} />
                    <div className="flex items-center gap-4 min-w-0 pl-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 shrink-0">
                        <span className="text-[9px] font-black uppercase text-slate-400">{new Date(b.start).toLocaleDateString('en-AU', { timeZone: TZ, weekday: 'short' })}</span>
                        <span className="text-lg font-black text-slate-800 leading-none">{new Date(b.start).toLocaleDateString('en-AU', { timeZone: TZ, day: 'numeric' })}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">{b.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                            <Clock size={12} className="text-indigo-500" />
                            {new Date(b.start).toLocaleTimeString('en-AU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })}
                            {' – '}
                            {new Date(b.end).toLocaleTimeString('en-AU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {b.roomNames.length > 0 && (
                            <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                              <Users size={12} /> {b.roomNames.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {b.departmentTags.map(tag => (
                            <span
                              key={tag.id}
                              className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase"
                              style={{ backgroundColor: tag.color + '33', color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {b.eventTypeTags.map(tag => (
                            <span
                              key={tag.id}
                              className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase border"
                              style={{ borderColor: tag.color + '66', color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                <div className="text-center py-20 opacity-40 flex flex-col items-center gap-4">
                  <RefreshCw className="animate-spin text-slate-300" size={48} />
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No Events Found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showDebug && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-amber-400 z-[100] h-96 overflow-hidden shadow-2xl flex flex-col p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h2 className="font-black text-amber-900 uppercase text-xs flex items-center gap-3"><Bug size={18} className="text-amber-500" /> Calendar ID Discovery</h2>
              <p className="text-[9px] font-bold text-amber-600/70 uppercase tracking-widest mt-1 italic">Room names from PCO API</p>
            </div>
            <button onClick={() => setShowDebug(false)} className="text-amber-500 font-black hover:text-amber-700 text-xs uppercase">Close</button>
          </div>
          <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {apiRooms.length > 0 ? apiRooms.map(res => (
              <div key={res.id} className="p-4 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-between hover:border-amber-100 transition-all shadow-sm">
                <div className="overflow-hidden pr-4">
                  <p className="font-black text-[11px] text-slate-800 truncate uppercase tracking-tight leading-none">{res.name || 'Unnamed'}</p>
                  <code className="text-[10px] font-mono text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded mt-2 inline-block">{res.id}</code>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(res.name || res.id); alert(`Copied: ${res.name || res.id}`); }} className="p-2.5 bg-slate-50 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm"><CheckCircle2 size={18} /></button>
              </div>
            )) : (
              <div className="col-span-full py-16 flex flex-col items-center justify-center gap-4">
                <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-100 max-w-md text-center">
                  <ShieldAlert className="mx-auto text-amber-500 mb-2" size={32} />
                  <p className="text-[10px] font-black uppercase text-amber-900">No room data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
