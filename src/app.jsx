/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  AlertCircle, 
  Bug, 
  RefreshCw,
  Zap,
  RotateCcw,
  CheckCircle2,
  Search,
  Settings,
  X,
  Check,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

/**
 * PCO RESOURCE DASHBOARD - FGAM VERSION
 * * SETUP INSTRUCTIONS:
 * 1. Ensure api/calendar.js is using the "Pure Proxy" version.
 * 2. Deploy and check for the "Bug" icon to find your Room IDs.
 * 3. Copy IDs into 'pcoResourceId' in the INITIAL_ROOMS array below.
 */

const INITIAL_ROOMS = [
  { id: 'r1', pcoResourceId: '', displayName: 'Sanctuary', category: 'Worship', capacity: 450 },
  { id: 'r2', pcoResourceId: '', displayName: 'Lobby', category: 'General', capacity: 120 },
  { id: 'r3', pcoResourceId: '', displayName: 'Zoom 1', category: 'Digital', capacity: 100 },
  { id: 'r4', pcoResourceId: '', displayName: 'Zoom 2', category: 'Digital', capacity: 100 },
  { id: 'r5', pcoResourceId: '', displayName: 'Zoom 3', category: 'Digital', capacity: 100 },
  { id: 'r6', pcoResourceId: '', displayName: 'Zoom 4', category: 'Digital', capacity: 100 },
  { id: 'r7', pcoResourceId: '', displayName: 'Multipurpose Room', category: 'General', capacity: 50 },
];

const CATEGORY_COLORS = {
  Worship: 'bg-blue-600',
  Youth: 'bg-purple-600',
  Admin: 'bg-slate-600',
  Kids: 'bg-orange-600',
  General: 'bg-emerald-600',
  Tech: 'bg-rose-600',
  Digital: 'bg-indigo-600'
};

const App = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewStartHour, setViewStartHour] = useState(8); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRoomIds, setSelectedRoomIds] = useState(INITIAL_ROOMS.map(r => r.id));
  const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [apiResources, setApiResources] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  const visibleHoursCount = 8;
  const categories = ['All', ...new Set(INITIAL_ROOMS.map(r => r.category))];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dateString = currentDate.toISOString().split('T')[0];
      // We fetch from our Vercel Proxy
      const response = await fetch(`/api/calendar?date=${dateString}`);
      const result = await response.json();
      
      if (!response.ok) {
        // If the proxy returned an error object, use that message
        throw new Error(result.error || `API Server returned ${response.status}`);
      }
      
      // 1. Process Resources (Found in 'included' if using ?include=resource)
      const rawResources = (result.included || []).filter(item => item.type === 'Resource');
      setApiResources(rawResources);

      // 2. Process Bookings (Found in 'data')
      const mappedBookings = (result.data || [])
        .filter(b => {
          // Double check the date matches (some API filters are loose)
          const bStart = b.attributes?.starts_at || "";
          return bStart.startsWith(dateString);
        })
        .map(b => ({
          id: b.id,
          title: b.attributes?.event_name || "Untitled Event",
          start: b.attributes?.starts_at,
          end: b.attributes?.ends_at,
          pcoResourceId: b.relationships?.resource?.data?.id
        }));

      setBookings(mappedBookings);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Auto-refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  const shiftTime = (amount) => {
    setViewStartHour(prev => Math.max(0, Math.min(24 - visibleHoursCount, prev + amount)));
  };

  const resetToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setViewStartHour(Math.max(0, Math.min(16, now.getHours() - 1)));
  };

  const filteredRooms = INITIAL_ROOMS.filter(room => {
    const matchesSearch = room.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
    const isVisible = selectedRoomIds.includes(room.id);
    return matchesSearch && matchesCategory && isVisible;
  });

  const getEventStyle = (event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const viewStart = new Date(currentDate);
    viewStart.setHours(viewStartHour, 0, 0, 0);
    const viewEnd = new Date(currentDate);
    viewEnd.setHours(viewStartHour + visibleHoursCount, 0, 0, 0);

    const effectiveStart = Math.max(start, viewStart);
    const effectiveEnd = Math.min(end, viewEnd);
    if (effectiveEnd <= effectiveStart) return { display: 'none' };

    const left = ((effectiveStart - viewStart) / (visibleHoursCount * 3600000)) * 100;
    const width = ((effectiveEnd - effectiveStart) / (visibleHoursCount * 3600000)) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const nowPos = useMemo(() => {
    const now = new Date();
    if (now.toDateString() !== currentDate.toDateString()) return null;
    const hour = now.getHours() + (now.getMinutes() / 60);
    if (hour < viewStartHour || hour > viewStartHour + visibleHoursCount) return null;
    return ((hour - viewStartHour) / visibleHoursCount) * 100;
  }, [currentDate, viewStartHour]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100/50"><Zap size={24} /></div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight italic text-slate-800">Resource Planner</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 leading-none mt-1">
              {bookings.length} Events Synced
              {lastUpdated && <span className="opacity-40">· {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button onClick={() => {
                    const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d);
                }} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronLeft size={18} /></button>
                <span className="px-4 font-black text-slate-700 min-w-[160px] text-center text-xs uppercase tracking-tight">
                    {currentDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <button onClick={() => {
                    const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d);
                }} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronRight size={18} /></button>
            </div>
            <button onClick={resetToToday} className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-600 rounded-2xl text-xs font-black uppercase border border-indigo-100 shadow-sm transition-all flex items-center gap-2">
              <RotateCcw size={14} /> Today
            </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsRoomSelectorOpen(true)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 shadow-sm transition-all"><Settings size={20}/></button>
          <button onClick={() => setShowDebug(!showDebug)} className={`p-2 rounded-xl border transition-all ${showDebug ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-inner' : 'bg-white border-slate-200 text-slate-400 shadow-sm'}`}><Bug size={20} /></button>
          <button onClick={fetchData} className={`p-2 bg-white rounded-xl border border-slate-200 shadow-sm ${isLoading ? 'animate-spin text-indigo-500' : 'text-slate-400 hover:text-indigo-600'}`}><RefreshCw size={20} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {error && (
          <div className="bg-rose-50 border-b border-rose-100 p-3 flex flex-col items-center justify-center gap-1 text-rose-800 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                <AlertCircle size={14} /> System Error
            </div>
            <p className="text-[9px] font-medium opacity-70 italic">{error}</p>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden bg-slate-100/50 p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-1">
            <div className="w-64 shrink-0 bg-slate-50/50 border-r border-slate-200 flex flex-col">
              <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-100/50">
                <span className="uppercase tracking-widest text-[9px] font-black text-slate-400">Resource List</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => shiftTime(-1)} disabled={viewStartHour === 0} className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 disabled:opacity-20"><ArrowLeft size={14}/></button>
                  <button onClick={() => shiftTime(1)} disabled={viewStartHour >= 16} className="p-1 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 disabled:opacity-20"><ArrowRight size={14}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {filteredRooms.map(room => (
                  <div key={room.id} className="h-28 border-b border-slate-100 px-6 flex flex-col justify-center transition-colors hover:bg-slate-50/50">
                    <span className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">{room.displayName}</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded text-white uppercase ${CATEGORY_COLORS[room.category] || 'bg-slate-400'}`}>{room.category}</span>
                      <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Users size={10}/> {room.capacity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="flex h-16 border-b border-slate-200 bg-white z-20">
                {Array.from({ length: visibleHoursCount }, (_, i) => viewStartHour + i).map(hour => (
                  <div key={hour} className="flex-1 border-r border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase italic">
                    {hour % 12 || 12}{hour >= 12 ? 'PM' : 'AM'}
                  </div>
                ))}
              </div>

              <div className="flex-1 relative overflow-y-auto bg-white scrollbar-hide">
                {nowPos !== null && (
                  <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 shadow-[0_0_15px_rgba(239,68,68,0.4)] flex flex-col items-center pointer-events-none" style={{ left: `${nowPos}%` }}>
                    <div className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm mt-2 transform -translate-x-1/2 uppercase tracking-tighter shadow-sm">NOW</div>
                  </div>
                )}

                {filteredRooms.map(room => (
                  <div key={room.id} className="flex h-28 border-b border-slate-100 relative group overflow-hidden">
                    {Array.from({ length: visibleHoursCount }).map((_, i) => <div key={i} className="flex-1 border-r border-slate-50/50 group-hover:bg-slate-50/10 transition-colors"></div>)}
                    {bookings
                      .filter(b => b.pcoResourceId === room.pcoResourceId && room.pcoResourceId !== "")
                      .map(b => (
                        <div key={b.id} style={getEventStyle(b)} className={`absolute top-4 h-20 rounded-2xl p-4 shadow-lg border-l-4 border-white/30 text-white z-10 transition-transform hover:scale-[1.01] hover:z-20 flex flex-col justify-center ${CATEGORY_COLORS[room.category] || 'bg-indigo-600'}`}>
                          <p className="text-[10px] font-black truncate uppercase leading-tight drop-shadow-sm">{b.title}</p>
                          <p className="text-[8px] font-bold opacity-80 uppercase mt-1.5 flex items-center gap-1.5"><Clock size={10} className="shrink-0"/> {new Date(b.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isRoomSelectorOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-8 border-b flex items-center justify-between bg-slate-50">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Room Visibility</h3>
                <button onClick={() => setIsRoomSelectorOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-auto p-6 space-y-2 bg-white">
                {INITIAL_ROOMS.map(room => (
                  <button key={room.id} onClick={() => {
                    const newIds = selectedRoomIds.includes(room.id) 
                      ? selectedRoomIds.filter(id => id !== room.id)
                      : [...selectedRoomIds, room.id];
                    setSelectedRoomIds(newIds);
                  }} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedRoomIds.includes(room.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-white border-slate-100 text-slate-400 opacity-60'}`}>
                    <div className="text-left font-black text-xs uppercase tracking-tight">{room.displayName}</div>
                    {selectedRoomIds.includes(room.id) && <div className="bg-indigo-600 p-1 rounded-full text-white"><Check size={12} strokeWidth={4} /></div>}
                  </button>
                ))}
              </div>
              <div className="p-8 bg-slate-50 border-t">
                <button onClick={() => setIsRoomSelectorOpen(false)} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all">Save Layout</button>
              </div>
            </div>
          </div>
        )}

        {showDebug && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-amber-400 z-[100] h-96 overflow-hidden shadow-2xl flex flex-col p-8 animate-in slide-in-from-bottom-full duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-amber-900 uppercase text-xs flex items-center gap-3"><Bug size={18} className="text-amber-500"/> PCO Room Discovery</h2>
              <button onClick={() => setShowDebug(false)} className="text-amber-500 font-black hover:text-amber-700 text-xs uppercase">Close</button>
            </div>
            <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {apiResources.length > 0 ? apiResources.map(res => (
                <div key={res.id} className="p-4 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-between hover:border-amber-100 transition-all shadow-sm">
                  <div className="overflow-hidden pr-4">
                    <p className="font-black text-[11px] text-slate-800 truncate uppercase">{res.attributes?.name || 'Unnamed Resource'}</p>
                    <code className="text-[10px] font-mono text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded mt-1 inline-block">ID: {res.id}</code>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(res.id); alert(`ID ${res.id} copied!`); }} className="p-2.5 bg-slate-50 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm"><CheckCircle2 size={18}/></button>
                </div>
              )) : (
                <div className="col-span-full py-20 flex flex-col items-center gap-3 opacity-40">
                    <RefreshCw className="animate-spin" size={32} />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Awaiting API Data...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
