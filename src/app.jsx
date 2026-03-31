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
  Info
} from 'lucide-react';

/**
 * PCO ROOM AVAILABILITY DASHBOARD
 * Improved parsing and mapping logic to handle various ICS formats.
 */

const INITIAL_ROOMS = [
  { id: 'r1', name: 'Main Sanctuary', category: 'Worship', capacity: 450 },
  { id: 'r2', name: 'Youth Center', category: 'Youth', capacity: 120 },
  { id: 'r3', name: 'Conference Room A', category: 'Admin', capacity: 15 },
  { id: 'r4', name: 'Kids Theater', category: 'Kids', capacity: 80 },
  { id: 'r5', name: 'Cafe Lobby', category: 'General', capacity: 60 },
  { id: 'r6', name: 'Production Suite', category: 'Tech', capacity: 8 },
];

const App = () => {
  // Default to today's date instead of a hardcoded past/future date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [icsUrl, setIcsUrl] = useState('webcal://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2Q-J8pkxZVanF9QAhIozWROnGdixZbtqcSRmJPDZsXmGmLFXlbiqcQH5MaXZOamFrNZc4ZYcRckFiXmFgP1sBcnZrIByRQwmZfJBgBf8xjw938709825ac6df76089393a1f8c561d56705a7e4');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [discoveredLocations, setDiscoveredLocations] = useState([]);

  const hours = Array.from({ length: 16 }, (_, i) => i + 7); 
  const categories = ['All', ...new Set(INITIAL_ROOMS.map(r => r.category))];

  // Improved ICS Date Parser to handle UTC and Z formats
  const parseICSDate = (icsDate) => {
    try {
      if (!icsDate) return null;
      // Clean up metadata prefixes like VALUE=DATE:
      const cleanDate = icsDate.split(':').pop();
      const year = cleanDate.substring(0, 4);
      const month = parseInt(cleanDate.substring(4, 6)) - 1;
      const day = cleanDate.substring(6, 8);
      
      if (cleanDate.includes('T')) {
        const hour = cleanDate.substring(9, 11);
        const min = cleanDate.substring(11, 13);
        // Treat as UTC
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
      
      // Handle folded lines (PCO often wraps long location strings)
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

  const fetchCalendar = useCallback(async () => {
    if (!icsUrl) return;
    setIsLoading(true);
    setError(null);

    try {
      const targetUrl = icsUrl.replace('webcal://', 'https://');
      let rawData = "";
      
      try {
        const response = await fetch(`/api/calendar?url=${encodeURIComponent(targetUrl)}`);
        if (!response.ok) throw new Error('Backend failed');
        rawData = await response.text();
      } catch (e) {
        // Fallback proxy for preview environments
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&timestamp=${Date.now()}`;
        const proxyRes = await fetch(proxyUrl);
        const json = await proxyRes.json();
        rawData = json.contents || "";
      }

      if (!rawData || !rawData.includes("BEGIN:VCALENDAR")) {
        throw new Error("Invalid calendar data received");
      }
      
      const parsedEvents = parseICS(rawData);
      setDiscoveredLocations([...new Set(parsedEvents.map(e => e.location))]);

      const mappedBookings = parsedEvents.map((event, idx) => {
        const room = INITIAL_ROOMS.find(r => 
          event.location.toLowerCase().includes(r.name.toLowerCase()) || 
          r.name.toLowerCase().includes(event.location.toLowerCase())
        );
        
        return {
          id: `pco-${idx}`,
          roomId: room ? room.id : null,
          title: event.title || "Untitled Event",
          start: event.start,
          end: event.end || event.start, // Fallback if no end time
          rawLocation: event.location
        };
      });

      setBookings(mappedBookings);
    } catch (err) {
      console.error(err);
      setError("Could not load calendar. Check your link or deployment.");
    } finally {
      setIsLoading(false);
    }
  }, [icsUrl]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const filteredRooms = INITIAL_ROOMS.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return d.toDateString() === currentDate.toDateString();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Resource Planner</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`h-2 w-2 rounded-full ${bookings.length > 0 ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                {bookings.length} Events Total | {bookings.filter(b => b.roomId).length} Mapped
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
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="ICS Link..." 
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs w-48 focus:w-80 transition-all outline-none"
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
            />
          </div>
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
              placeholder="Search rooms..." 
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
                  selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button onClick={() => setShowDebug(!showDebug)} className={`ml-auto p-2 rounded-lg border transition-all ${showDebug ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-400'}`}>
            <Bug size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-200/40 relative">
          <div className="min-w-max p-8">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex">
                <div className="w-72 shrink-0 bg-slate-50/50 border-r border-slate-200">
                  <div className="h-16 border-b border-slate-200 flex items-center px-6 bg-slate-100/50 uppercase tracking-widest text-[10px] font-black text-slate-400">Room Status</div>
                  {filteredRooms.map(room => (
                    <div key={room.id} className="h-28 border-b border-slate-100 px-6 flex flex-col justify-center">
                      <span className="font-extrabold text-slate-800 text-base">{room.name}</span>
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
                        .filter(b => b.roomId === room.id && isToday(b.start))
                        .map(b => {
                          const startObj = new Date(b.start);
                          const endObj = new Date(b.end);
                          const start = startObj.getHours() + (startObj.getMinutes() / 60);
                          const end = endObj.getHours() + (endObj.getMinutes() / 60);
                          const leftOffset = (start - 7) * 160;
                          const width = Math.max((end - start) * 160, 40); // Min width 40px

                          return (
                            <div 
                              key={b.id} 
                              className="absolute top-4 h-20 rounded-2xl border-l-4 border-l-indigo-500 bg-white shadow-xl p-4 overflow-hidden border border-slate-100 z-10 hover:-translate-y-1 transition-all cursor-default" 
                              style={{ left: `${leftOffset + 8}px`, width: `${width - 16}px` }}
                              title={`${b.title}\n${startObj.toLocaleTimeString()} - ${endObj.toLocaleTimeString()}`}
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
        </div>

        {/* IMPROVED DEBUG PANEL */}
        {showDebug && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-amber-200 z-[100] h-80 overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-3">
                <Bug size={20} className="text-amber-600" />
                <h3 className="text-slate-800 font-black text-sm uppercase">PCO Connection Debugger</h3>
              </div>
              <button onClick={() => setShowDebug(false)} className="p-2 hover:bg-slate-200 rounded-full"><ChevronDown size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><Info size={12}/> Locations found in feed</h4>
                <div className="space-y-2">
                  {discoveredLocations.length > 0 ? discoveredLocations.map((loc, i) => {
                    const isMapped = INITIAL_ROOMS.some(r => loc.toLowerCase().includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(loc.toLowerCase()));
                    return (
                      <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                        <code className="text-[11px] font-mono text-slate-600">{loc}</code>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isMapped ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {isMapped ? 'Mapped' : 'No Match'}
                        </span>
                      </div>
                    );
                  }) : <p className="text-xs text-slate-400 italic">No locations found. Verify the ICS link.</p>}
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 h-fit">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3">Troubleshooting</h4>
                <ul className="text-[11px] space-y-3 text-slate-600">
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-600">1.</span>
                    <span>If no locations appear, your ICS link is likely returning 0 events. Check the date range in Planning Center.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-600">2.</span>
                    <span>If locations appear but are "Red" (No Match), you must copy that exact text into the <code className="bg-white px-1 border rounded text-pink-600">name</code> property in <code className="bg-white px-1 border rounded">INITIAL_ROOMS</code>.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-600">3.</span>
                    <span>We are currently filtering for events on <span className="font-bold">{currentDate.toDateString()}</span>. Change the date above to see other bookings.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
