/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Clock,
  AlertCircle,
  Link as LinkIcon,
  RefreshCw,
  Bug,
  ChevronDown,
  Info,
  X,
  Settings,
  Check,
  ArrowLeft,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

/**
 * PCO ROOM AVAILABILITY DASHBOARD
 * Features:
 * 1. Updated ICS Link: Using the new technical calendar feed.
 * 2. FGAM Room Mapping: Matching technical names to friendly display labels.
 * 3. Navigation: "Today" reset button and a localized 8-hour shifting window.
 * 4. Timezone Sync: Accurate UTC to Local time conversion for Australia/Melbourne.
 */

const INITIAL_ROOMS = [
  { id: 'r1', matchName: 'FGA Melbourne - Sanctuary - 38 Lexton Rd, Box Hill North, VIC 31299', displayName: 'Sanctuary', category: 'Worship', capacity: 450 },
  { id: 'r2', matchName: 'FGAM Lobby', displayName: 'Lobby', category: 'Youth', capacity: 120 },
  { id: 'r3', matchName: 'http://fgam.org.au/zoom', displayName: 'Zoom', category: 'Admin', capacity: 15 },
  { id: 'r4', matchName: 'http://fgam.org.au/zoom2', displayName: 'Zoom 2', category: 'Kids', capacity: 80 },
  { id: 'r5', matchName: 'http://fgam.org.au/zoom3', displayName: 'Zoom 3', category: 'General', capacity: 60 },
  { id: 'r6', matchName: 'http://fgam.org.au/zoom4', displayName: 'Zoom 4', category: 'Tech', capacity: 8 },
  { id: 'r7', matchName: 'FGAM Multipurpose Room - 38 Lexton Rd, Box Hill North, VIC 3129', displayName: 'Multipurpose Room', category: 'Tech', capacity: 8 },
];

const App = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewStartHour, setViewStartHour] = useState(8); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRoomIds, setSelectedRoomIds] = useState(INITIAL_ROOMS.map(r => r.id));
  const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);
  
  // Updated ICS URL
  const [icsUrl, setIcsUrl] = useState('webcal://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2Q-J8pkxZVanF9QAhIozWROnGdixZbtqcSRmJPDZsXmGmLFXlbiqcQH5MaXZOamFrNZc4ZYcRckFiXmFlezW7EXJ2ayAcmUTDYAzjAXXg==548d76cc55f628c9489f7e3f18a127b99906f3d3');
  
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [discoveredLocations, setDiscoveredLocations] = useState([]);
  
  const visibleHoursCount = 8;
  const categories = ['All', ...new Set(INITIAL_ROOMS.map(r => r.category))];

  const parseICSDate = (icsDate) => {
    try {
      if (!icsDate) return null;
      const cleanDate = icsDate.split(':').pop().trim();
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1;
      const day = parseInt(cleanDate.substring(6, 8));
      
      if (cleanDate.includes('T')) {
        const hour = parseInt(cleanDate.substring(9, 11));
        const min = parseInt(cleanDate.substring(11, 13));
        const sec = parseInt(cleanDate.substring(13, 15));
        
        if (cleanDate.endsWith('Z')) {
          return new Date(Date.UTC(year, month, day, hour, min, sec)).toISOString();
        }
        return new Date(year, month, day, hour, min, sec).toISOString();
      }
      return new Date(year, month, day).toISOString();
    } catch (e) {
      return null;
    }
  };

  const parseICS = (data) => {
    const events = [];
    const lines = data.split(/\r?\n/);
    let currentEvent = null;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      while (i + 1 < lines.length && (lines[i+1].startsWith(' ') || lines[i+1].startsWith('\t'))) {
        line += lines[i+1].substring(1);
        i++;
      }

      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT')) {
        if (currentEvent && currentEvent.start && currentEvent.location) {
          events.push(currentEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (line.startsWith('SUMMARY')) currentEvent.title = line.split(':').slice(1).join(':').trim();
        if (line.startsWith('LOCATION')) currentEvent.location = line.split(':').slice(1).join(':').replace(/\\,/g, ',').trim();
        if (line.startsWith('DTSTART')) currentEvent.start = parseICSDate(line);
        if (line.startsWith('DTEND')) currentEvent.end = parseICSDate(line);
      }
    }
    return events;
  };

  const processCalendarData = useCallback((rawData) => {
    if (!rawData || !rawData.includes("BEGIN:VCALENDAR")) return false;

    const parsedEvents = parseICS(rawData);
    setDiscoveredLocations([...new Set(parsedEvents.map(e => e.location))]);

    const mappedBookings = parsedEvents.map((event, idx) => {
      const room = INITIAL_ROOMS.find(r => 
        event.location.toLowerCase().trim() === r.matchName.toLowerCase().trim() ||
        event.location.toLowerCase().includes(r.matchName.toLowerCase()) || 
        r.matchName.toLowerCase().includes(event.location.toLowerCase())
      );
      
      return {
        id: `pco-${idx}`,
        roomId: room ? room.id : null,
        title: event.title || "Untitled Event",
        start: event.start,
        end: event.end || event.start,
        rawLocation: event.location
      };
    });

    setBookings(mappedBookings);
    return true;
  }, []);

  const fetchCalendar = useCallback(async () => {
    if (!icsUrl) return;
    setIsLoading(true);
    setError(null);
    const cleanUrl = icsUrl.replace('webcal://', 'https://').trim();

    try {
      const response = await fetch(`/api/calendar?url=${encodeURIComponent(cleanUrl)}`);
      if (response.ok && processCalendarData(await response.text())) {
        setIsLoading(false);
        return;
      }
    } catch (e) {}

    try {
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`);
      if (response.ok && processCalendarData(await response.text())) {
        setIsLoading(false);
        return;
      }
    } catch (e) {}

    setError("Connection Error. Ensure your PCO link is active.");
    setIsLoading(false);
  }, [icsUrl, processCalendarData]);

  const resetToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const currentHour = now.getHours();
    const targetHour = Math.max(0, Math.min(24 - visibleHoursCount, currentHour));
    setViewStartHour(targetHour);
  };

  useEffect(() => {
    fetchCalendar();
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 0 && currentHour <= 24 - visibleHoursCount) {
      setViewStartHour(currentHour);
    }
  }, [fetchCalendar]);

  const toggleRoomVisibility = (roomId) => {
    setSelectedRoomIds(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const filteredRooms = INITIAL_ROOMS.filter(room => {
    const matchesSearch = room.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
    const isVisible = selectedRoomIds.includes(room.id);
    return matchesSearch && matchesCategory && isVisible;
  });

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const shiftTime = (amount) => {
    setViewStartHour(prev => Math.max(0, Math.min(24 - visibleHoursCount, prev + amount)));
  };

  const isSelectedDate = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return d.toDateString() === currentDate.toDateString();
  };

  const getNowIndicatorPosition = () => {
    const now = new Date();
    if (now.toDateString() !== currentDate.toDateString()) return null;
    const hour = now.getHours() + (now.getMinutes() / 60);
    if (hour < viewStartHour || hour > viewStartHour + visibleHoursCount) return null;
    return ((hour - viewStartHour) / visibleHoursCount) * 100;
  };

  const formatHour = (h) => {
    if (h === 0 || h === 24) return "12 AM";
    if (h === 12) return "12 PM";
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  const nowPos = getNowIndicatorPosition();
  const viewHours = Array.from({ length: visibleHoursCount }, (_, i) => viewStartHour + i);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Resource Planner</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`h-2 w-2 rounded-full ${bookings.length > 0 ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {bookings.filter(b => b.roomId).length} Active Assignments
              </p>
            </div>
          </div>
        </div>

        {/* Center: Date Navigation */}
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600" title="Previous Day"><ChevronLeft size={18} /></button>
                <span className="px-4 font-black text-slate-700 min-w-[160px] text-center text-xs uppercase tracking-tight">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600" title="Next Day"><ChevronRight size={18} /></button>
            </div>
            <button 
              onClick={resetToToday} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 transition-all flex items-center gap-2"
              title="Return to Today"
            >
              <RotateCcw size={14} /> Today
            </button>
        </div>

        {/* Right: View & Sync Controls */}
        <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-4">
          <button onClick={() => setIsRoomSelectorOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200">
            <Settings size={14} /> Filter
          </button>
          <button onClick={fetchCalendar} disabled={isLoading} className={`p-2 rounded-lg ${isLoading ? 'animate-spin text-indigo-500' : 'text-slate-400 hover:text-indigo-600'}`}>
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {error && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-center gap-2 text-amber-700 text-[10px] font-bold uppercase shrink-0">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="bg-white border-b border-slate-200 p-4 flex flex-wrap items-center gap-4 shrink-0">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by display name..." 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-100 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button onClick={() => setShowDebug(!showDebug)} className={`ml-auto p-2 rounded-lg border transition-all ${showDebug ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600'}`}>
            <Bug size={20} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden bg-slate-200/40">
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-1">
              {/* Sidebar with Shift Time controls in the header */}
              <div className="w-64 shrink-0 bg-slate-50/50 border-r border-slate-200 flex flex-col">
                <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-100/50">
                    <div className="flex flex-col">
                        <span className="uppercase tracking-widest text-[9px] font-black text-slate-400 leading-none">Resources</span>
                        <span className="text-[10px] font-bold text-slate-600 mt-1 whitespace-nowrap">
                            {formatHour(viewStartHour)} — {formatHour(viewStartHour + visibleHoursCount)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button 
                            onClick={() => shiftTime(-1)} 
                            disabled={viewStartHour === 0}
                            className="p-1 hover:bg-slate-50 rounded text-slate-600 disabled:opacity-20 transition-all"
                        >
                            <ArrowLeft size={14} />
                        </button>
                        <button 
                            onClick={() => shiftTime(1)} 
                            disabled={viewStartHour >= 24 - visibleHoursCount}
                            className="p-1 hover:bg-slate-50 rounded text-slate-600 disabled:opacity-20 transition-all"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {filteredRooms.map(room => (
                    <div key={room.id} className="h-28 border-b border-slate-100 px-6 flex flex-col justify-center bg-white/50">
                      <span className="font-extrabold text-slate-800 text-sm leading-tight">{room.displayName}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold bg-white border px-1.5 py-0.5 rounded text-slate-500 uppercase">{room.category}</span>
                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Users size={10}/> {room.capacity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                  <div className="flex h-14 border-b border-slate-200 bg-white z-20">
                    {viewHours.map(hour => (
                      <div key={hour} className="flex-1 border-r border-slate-100 flex items-center justify-center bg-slate-50/30 overflow-hidden">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                          {formatHour(hour)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 relative overflow-hidden bg-white">
                    {/* Centered Now Indicator */}
                    {nowPos !== null && (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 shadow-[0_0_10px_rgba(239,68,68,0.5)] flex flex-col items-center pointer-events-none" 
                        style={{ left: `${nowPos}%` }}
                      >
                        <div className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm mt-2 whitespace-nowrap uppercase tracking-tighter shadow-sm transform -translate-x-1/2">
                          NOW
                        </div>
                      </div>
                    )}

                    {filteredRooms.map(room => (
                      <div key={room.id} className="flex h-28 border-b border-slate-100 relative group overflow-hidden">
                        {viewHours.map(h => <div key={h} className="flex-1 border-r border-slate-50/50 group-hover:bg-slate-50/30 transition-colors"></div>)}
                        
                        {bookings
                          .filter(b => b.roomId === room.id && isSelectedDate(b.start))
                          .map(b => {
                            const startObj = new Date(b.start);
                            const endObj = new Date(b.end);
                            const startDecimal = startObj.getHours() + (startObj.getMinutes() / 60);
                            const endDecimal = endObj.getHours() + (endObj.getMinutes() / 60);
                            const windowEnd = viewStartHour + visibleHoursCount;

                            if (endDecimal < viewStartHour || startDecimal > windowEnd) return null;

                            const clippedStart = Math.max(viewStartHour, startDecimal);
                            const clippedEnd = Math.min(windowEnd, endDecimal);
                            const leftPercent = ((clippedStart - viewStartHour) / visibleHoursCount) * 100;
                            const widthPercent = ((clippedEnd - clippedStart) / visibleHoursCount) * 100;

                            return (
                              <div 
                                key={b.id} 
                                className="absolute top-4 h-20 rounded-2xl border-l-4 border-l-indigo-500 bg-white shadow-lg p-3 overflow-hidden border border-slate-100 z-10 hover:-translate-y-1 transition-all" 
                                style={{ left: `${leftPercent}%`, width: `calc(${widthPercent}% - 8px)` }}
                                title={`${b.title}\n${startObj.toLocaleTimeString()} - ${endObj.toLocaleTimeString()}`}
                              >
                                <div className="font-extrabold text-[11px] text-slate-800 truncate mb-1">{b.title}</div>
                                <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1.5 uppercase">
                                  <Clock size={10} className="text-indigo-400" /> {startObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          </div>
        </div>

        {isRoomSelectorOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Display Filter</h3>
                <button onClick={() => setIsRoomSelectorOpen(false)} className="p-2 hover:bg-white rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2 bg-white">
                {INITIAL_ROOMS.map(room => (
                  <button key={room.id} onClick={() => toggleRoomVisibility(room.id)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedRoomIds.includes(room.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-white border-slate-100 text-slate-400 opacity-60'}`}>
                    <div className="text-left">
                      <p className="text-sm">{room.displayName}</p>
                      <p className="text-[10px] font-black uppercase opacity-60 mt-1">PCO Match: {room.matchName.substring(0, 30)}...</p>
                    </div>
                    {selectedRoomIds.includes(room.id) && <Check size={18} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
              <div className="p-6 bg-slate-50 border-t flex gap-2">
                <button onClick={() => setSelectedRoomIds(INITIAL_ROOMS.map(r => r.id))} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase text-slate-600">Select All</button>
                <button onClick={() => setIsRoomSelectorOpen(false)} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase shadow-lg">Done</button>
              </div>
            </div>
          </div>
        )}

        {showDebug && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-amber-200 z-[100] h-80 overflow-hidden shadow-2xl flex flex-col p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-slate-800 font-black uppercase flex items-center gap-2"><Bug size={20} className="text-amber-600" /> Discovered Locations</h3><button onClick={() => setShowDebug(false)}><X size={20}/></button></div>
            <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-3">
              {discoveredLocations.map((loc, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-sm">
                  <code className="text-[10px] font-mono text-slate-600 truncate">{loc}</code>
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${INITIAL_ROOMS.some(r => loc.toLowerCase().includes(r.matchName.toLowerCase()) || r.matchName.toLowerCase().includes(loc.toLowerCase())) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>Status</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
