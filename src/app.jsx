/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
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
  Check
} from 'lucide-react';

/**
 * PCO ROOM AVAILABILITY DASHBOARD
 * Features:
 * 1. Alias Matching: Match technical PCO names to friendly Display Names.
 * 2. Room Selector: Toggle visibility for a cleaner dashboard.
 * 3. Triple-Redundancy Fetch: Bypass CORS issues.
 */

// --- ROOM CONFIGURATION ---
// matchName: The EXACT text discovered in your PCO feed (use the Bug icon to find these).
// displayName: The friendly name you want displayed on the dashboard.
const INITIAL_ROOMS = [
  { id: 'r1', matchName: 'Main Sanctuary', displayName: 'Sanctuary', category: 'Worship', capacity: 450 },
  { id: 'r2', matchName: 'Youth Center (Room 201)', displayName: 'Youth Hub', category: 'Youth', capacity: 120 },
  { id: 'r3', matchName: 'Admin Conference A', displayName: 'Conf Room A', category: 'Admin', capacity: 15 },
  { id: 'r4', matchName: 'Kids Theater Area', displayName: 'Kids Theater', category: 'Kids', capacity: 80 },
  { id: 'r5', matchName: 'Main Lobby / Cafe', displayName: 'Cafe', category: 'General', capacity: 60 },
  { id: 'r6', matchName: 'Prod Suite 1', displayName: 'Production', category: 'Tech', capacity: 8 },
];

const App = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRoomIds, setSelectedRoomIds] = useState(INITIAL_ROOMS.map(r => r.id));
  const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);
  const [icsUrl, setIcsUrl] = useState('webcal://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2Q-J8pkxZVanF9QAhIozWROnGdixZbtqcSRmJPDZsXmGmLFXlbiqcQH5MaXZOamFrNZc4ZYcRckFiXmFgP1sBcnZrIByRQwmZfJBgBf8xjw938709825ac6df76089393a1f8c561d56705a7e4');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [discoveredLocations, setDiscoveredLocations] = useState([]);

  const hours = Array.from({ length: 16 }, (_, i) => i + 7); 
  const categories = ['All', ...new Set(INITIAL_ROOMS.map(r => r.category))];

  const parseICSDate = (icsDate) => {
    try {
      if (!icsDate) return null;
      const cleanDate = icsDate.split(':').pop().trim();
      const year = cleanDate.substring(0, 4);
      const month = parseInt(cleanDate.substring(4, 6)) - 1;
      const day = cleanDate.substring(6, 8);
      
      if (cleanDate.includes('T')) {
        const hour = cleanDate.substring(9, 11);
        const min = cleanDate.substring(11, 13);
        return new Date(Date.UTC(year, month, day, hour, min)).toISOString();
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
      // Logic: Match the 'location' from the feed to our 'matchName' configuration
      const room = INITIAL_ROOMS.find(r => 
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

    // Try API Middleman then Proxies
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

    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}&timestamp=${Date.now()}`);
      const json = await response.json();
      if (json.contents && processCalendarData(json.contents)) {
        setIsLoading(false);
        return;
      }
    } catch (e) {}

    setError("Failed to fetch calendar data.");
    setIsLoading(false);
  }, [icsUrl, processCalendarData]);

  useEffect(() => {
    fetchCalendar();
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

  const isSelectedDate = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return d.toDateString() === currentDate.toDateString();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
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

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronLeft size={20} /></button>
          <span className="px-6 font-bold text-slate-700 min-w-[200px] text-center text-sm">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronRight size={20} /></button>
        </div>

        <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-4">
          <button 
            onClick={() => setIsRoomSelectorOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200"
          >
            <Settings size={14} /> Filter View
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
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-100"
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
                  selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
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

        <div className="flex-1 overflow-auto bg-slate-200/40 relative">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Settings size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">View is empty</p>
              <button onClick={() => setIsRoomSelectorOpen(true)} className="mt-4 text-indigo-600 text-xs font-bold hover:underline">Adjust visibility settings</button>
            </div>
          ) : (
            <div className="min-w-max p-8">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="flex">
                  <div className="w-72 shrink-0 bg-slate-50/50 border-r border-slate-200">
                    <div className="h-16 border-b border-slate-200 flex items-center px-6 bg-slate-100/50 uppercase tracking-widest text-[10px] font-black text-slate-400">Room Status</div>
                    {filteredRooms.map(room => (
                      <div key={room.id} className="h-28 border-b border-slate-100 px-6 flex flex-col justify-center">
                        <span className="font-extrabold text-slate-800 text-base">{room.displayName}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold bg-white border px-2 py-0.5 rounded-lg text-slate-500 uppercase">{room.category}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Users size={12}/> {room.capacity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 relative">
                    <div className="flex h-16 border-b border-slate-200">
                      {hours.map(hour => (
                        <div key={hour} className="w-40 shrink-0 border-r border-slate-100 flex items-center justify-center bg-slate-50/30">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">
                            {hour > 12 ? `${hour-12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {filteredRooms.map(room => (
                      <div key={room.id} className="flex h-28 border-b border-slate-100 relative group">
                        {hours.map(h => <div key={h} className="w-40 shrink-0 border-r border-slate-50/50 group-hover:bg-slate-50/50 transition-colors"></div>)}
                        {bookings
                          .filter(b => b.roomId === room.id && isSelectedDate(b.start))
                          .map(b => {
                            const startObj = new Date(b.start);
                            const endObj = new Date(b.end);
                            const start = startObj.getHours() + (startObj.getMinutes() / 60);
                            const end = endObj.getHours() + (endObj.getMinutes() / 60);
                            const leftOffset = (start - 7) * 160;
                            const width = Math.max((end - start) * 160, 40);

                            return (
                              <div 
                                key={b.id} 
                                className="absolute top-4 h-20 rounded-2xl border-l-4 border-l-indigo-500 bg-white shadow-xl p-4 overflow-hidden border border-slate-100 z-10 hover:-translate-y-1 transition-all cursor-default" 
                                style={{ left: `${leftOffset + 8}px`, width: `${width - 16}px` }}
                              >
                                <div className="font-extrabold text-xs text-slate-800 truncate mb-1">{b.title}</div>
                                <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                                  <Clock size={12} className="text-indigo-400" /> 
                                  {startObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
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
          )}
        </div>

        {/* ROOM SELECTOR MODAL */}
        {isRoomSelectorOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Resource Filter</h3>
                <button onClick={() => setIsRoomSelectorOpen(false)} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-200"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2 bg-white">
                {INITIAL_ROOMS.map(room => (
                  <button 
                    key={room.id}
                    onClick={() => toggleRoomVisibility(room.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      selectedRoomIds.includes(room.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-sm">{room.displayName}</p>
                      <p className="text-[10px] font-black uppercase opacity-60 mt-1">Matched to: {room.matchName}</p>
                    </div>
                    {selectedRoomIds.includes(room.id) && <Check size={18} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
              <div className="p-6 bg-slate-50 border-t flex gap-2">
                <button onClick={() => setSelectedRoomIds(INITIAL_ROOMS.map(r => r.id))} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase text-slate-600">Select All</button>
                <button onClick={() => setIsRoomSelectorOpen(false)} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg">Done</button>
              </div>
            </div>
          </div>
        )}

        {showDebug && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-amber-200 z-[100] h-80 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <h3 className="text-slate-800 font-black text-sm uppercase flex items-center gap-2"><Bug size={20} className="text-amber-600" /> Discover PCO Match Names</h3>
              <button onClick={() => setShowDebug(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {discoveredLocations.map((loc, i) => {
                const isMapped = INITIAL_ROOMS.some(r => loc.toLowerCase().includes(r.matchName.toLowerCase()) || r.matchName.toLowerCase().includes(loc.toLowerCase()));
                return (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <code className="text-[11px] font-mono text-slate-600 truncate">{loc}</code>
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${isMapped ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isMapped ? 'Mapped' : 'Unmapped'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
