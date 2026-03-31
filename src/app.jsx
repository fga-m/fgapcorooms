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
 * * INSTRUCTIONS:
 * 1. Deploy this code to Vercel with your PCO_APP_ID and PCO_SECRET env vars.
 * 2. Once live, click the "Bug" icon in the top right.
 * 3. Copy the numerical IDs for your rooms and paste them into 'pcoResourceId' below.
 */

const INITIAL_ROOMS = [
  { 
    id: 'r1', 
    pcoResourceId: '', // Enter ID from Bug menu after deployment
    displayName: 'Sanctuary', 
    category: 'Worship', 
    capacity: 450 
  },
  { 
    id: 'r2', 
    pcoResourceId: '', 
    displayName: 'Lobby', 
    category: 'General', 
    capacity: 120 
  },
  { 
    id: 'r3', 
    pcoResourceId: '', 
    displayName: 'Zoom 1', 
    category: 'Digital', 
    capacity: 100 
  },
  { 
    id: 'r4', 
    pcoResourceId: '', 
    displayName: 'Zoom 2', 
    category: 'Digital', 
    capacity: 100 
  },
  { 
    id: 'r5', 
    pcoResourceId: '', 
    displayName: 'Zoom 3', 
    category: 'Digital', 
    capacity: 100 
  },
  { 
    id: 'r6', 
    pcoResourceId: '', 
    displayName: 'Zoom 4', 
    category: 'Digital', 
    capacity: 100 
  },
  { 
    id: 'r7', 
    pcoResourceId: '', 
    displayName: 'Multipurpose Room', 
    category: 'General', 
    capacity: 50 
  },
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [apiResources, setApiResources] = useState([]); 
  
  const visibleHoursCount = 8;
  const categories = ['All', ...new Set(INITIAL_ROOMS.map(r => r.category))];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dateString = currentDate.toISOString().split('T')[0];
      const response = await fetch(`/api/calendar?date=${dateString}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Sync Error');
      
      setBookings(data.events || []);
      setApiResources(data.resources || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Auto-refresh every 5 mins
    return () => clearInterval(interval);
  }, [fetchData]);

  const shiftTime = (amount) => {
    setViewStartHour(prev => Math.max(0, Math.min(24 - visibleHoursCount, prev + amount)));
  };

  const resetToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const currentHour = now.getHours();
    setViewStartHour(Math.max(0, Math.min(24 - visibleHoursCount, currentHour - 1)));
  };

  const filteredRooms = INITIAL_ROOMS.filter(room => {
    const matchesSearch = room.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
    const isVisible = selectedRoomIds.includes(room.id);
    return matchesSearch && matchesCategory && isVisible;
  });

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

  const nowPos = getNowIndicatorPosition();
  const viewHours = Array.from({ length: visibleHoursCount }, (_, i) => viewStartHour + i);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase italic">FGAM Resource Dash</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`h-2 w-2 rounded-full ${bookings.length > 0 ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                {bookings.filter(b => INITIAL_ROOMS.some(r => r.pcoResourceId === b.resourceId)).length} Active Assignments
                {lastUpdated && <span className="opacity-50 ml-1">· Sync {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() - 1);
                  setCurrentDate(d);
                }} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600"><ChevronLeft size={18} /></button>
                <span className="px-4 font-black text-slate-700 min-w-[160px] text-center text-xs uppercase tracking-tight">
                    {currentDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <button onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() + 1);
                  setCurrentDate(d);
                }} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600"><ChevronRight size={18} /></button>
            </div>
            <button onClick={resetToToday} className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-indigo-100 transition-all flex items-center gap-2 shadow-sm">
              <RotateCcw size={14} /> Today
            </button>
        </div>

        <div className="hidden lg:flex items-center gap-3 border-l border-slate-200 pl-4">
          <button onClick={() => setIsRoomSelectorOpen(true)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 shadow-sm transition-all">
            <Settings size={20} />
          </button>
          <button onClick={() => setShowDebug(!showDebug)} className={`p-2 rounded-xl border transition-all ${showDebug ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm'}`}>
            <Bug size={20} />
          </button>
          <button onClick={fetchData} disabled={isLoading} className={`p-2 bg-white rounded-xl border border-slate-200 shadow-sm ${isLoading ? 'animate-spin text-indigo-500' : 'text-slate-400 hover:text-indigo-600'}`}>
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {error && (
          <div className="bg-rose-50 border-b border-rose-100 p-3 flex items-center justify-center gap-2 text-rose-800 text-[10px] font-black uppercase shrink-0">
            <AlertCircle size={14} /> System Notice: {error}
          </div>
        )}

        {/* Local Filter Bar */}
        <div className="bg-white border-b border-slate-200 p-4 flex flex-wrap items-center gap-4 shrink-0">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Quick search display names..." 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-100 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 text-xs font-black rounded-xl border transition-all uppercase tracking-widest ${selectedCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 flex overflow-hidden bg-slate-100/50">
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-1">
              
              {/* Room Labels Sidebar */}
              <div className="w-64 shrink-0 bg-slate-50/50 border-r border-slate-200 flex flex-col">
                <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-100/50">
                    <div className="flex flex-col">
                        <span className="uppercase tracking-widest text-[9px] font-black text-slate-400 leading-none">Resources</span>
                        <span className="text-[10px] font-bold text-slate-600 mt-1 whitespace-nowrap">
                            {formatHour(viewStartHour)} — {formatHour(viewStartHour + visibleHoursCount)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm scale-90">
                        <button onClick={() => shiftTime(-1)} disabled={viewStartHour === 0} className="p-1 hover:bg-slate-50 rounded text-slate-600 disabled:opacity-20 transition-all"><ArrowLeft size={14} /></button>
                        <button onClick={() => shiftTime(1)} disabled={viewStartHour >= 24 - visibleHoursCount} className="p-1 hover:bg-slate-50 rounded text-slate-600 disabled:opacity-20 transition-all"><ArrowRight size={14} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {filteredRooms.map(room => (
                    <div key={room.id} className="h-28 border-b border-slate-100 px-6 flex flex-col justify-center bg-white/50 group">
                      <span className="font-black text-slate-800 text-sm leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{room.displayName}</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded text-white uppercase ${CATEGORY_COLORS[room.category] || 'bg-slate-400'}`}>{room.category}</span>
                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Users size={10}/> {room.capacity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Grid */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                  {/* Time Header */}
                  <div className="flex h-16 border-b border-slate-200 bg-white z-20">
                    {viewHours.map(hour => (
                      <div key={hour} className="flex-1 border-r border-slate-100 flex items-center justify-center bg-slate-50/30">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatHour(hour)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Events Grid */}
                  <div className="flex-1 relative overflow-y-auto scrollbar-hide bg-white">
                    {/* Current Time Indicator */}
                    {nowPos !== null && (
                      <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 shadow-[0_0_15px_rgba(239,68,68,0.4)] flex flex-col items-center pointer-events-none" style={{ left: `${nowPos}%` }}>
                        <div className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm mt-2 whitespace-nowrap uppercase tracking-tighter shadow-sm transform -translate-x-1/2">NOW</div>
                      </div>
                    )}

                    {filteredRooms.map(room => (
                      <div key={room.id} className="flex h-28 border-b border-slate-100 relative group overflow-hidden">
                        {viewHours.map(h => <div key={h} className="flex-1 border-r border-slate-50/30 group-hover:bg-slate-50/20 transition-colors"></div>)}
                        
                        {bookings
                          .filter(b => b.resourceId === room.pcoResourceId && room.pcoResourceId !== "")
                          .map(b => (
                            <div 
                                key={b.id} 
                                className={`absolute top-4 h-20 rounded-2xl border-l-4 border-white/30 shadow-lg p-4 overflow-hidden z-10 hover:-translate-y-1 transition-all cursor-default flex flex-col justify-center ${CATEGORY_COLORS[room.category] || 'bg-indigo-600'} text-white`} 
                                style={getEventStyle(b)}
                            >
                                <div className="font-black text-[11px] truncate mb-1 leading-tight uppercase tracking-tight">{b.title}</div>
                                <div className="text-[9px] font-bold flex items-center gap-1.5 uppercase opacity-90">
                                  <Clock size={10} /> {new Date(b.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {isRoomSelectorOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-8 border-b flex items-center justify-between bg-slate-50">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Visible Resources</h3>
                <button onClick={() => setIsRoomSelectorOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-auto p-6 space-y-2 bg-white">
                {INITIAL_ROOMS.map(room => (
                  <button key={room.id} onClick={() => {
                    const newIds = selectedRoomIds.includes(room.id) 
                      ? selectedRoomIds.filter(id => id !== room.id)
                      : [...selectedRoomIds, room.id];
                    setSelectedRoomIds(newIds);
                  }} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedRoomIds.includes(room.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-400 opacity-60'}`}>
                    <div className="text-left">
                        <p className="font-black text-xs uppercase tracking-tight">{room.displayName}</p>
                        <p className="text-[9px] font-bold opacity-60 uppercase">{room.category}</p>
                    </div>
                    {selectedRoomIds.includes(room.id) && <div className="bg-indigo-600 p-1 rounded-full text-white"><Check size={12} strokeWidth={4} /></div>}
                  </button>
                ))}
              </div>
              <div className="p-8 bg-slate-50 border-t">
                <button onClick={() => setIsRoomSelectorOpen(false)} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all">Close & Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Discovery Debug Panel */}
        {showDebug && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-amber-400 z-[100] h-96 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.1)] flex flex-col p-8 animate-in slide-in-from-bottom-full duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                  <h3 className="text-slate-800 font-black uppercase tracking-widest text-sm flex items-center gap-2"><Bug size={20} className="text-amber-500" /> Resource Discovery</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Copy these numerical IDs into your INITIAL_ROOMS mapping</p>
              </div>
              <button onClick={() => setShowDebug(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {apiResources.length > 0 ? apiResources.map((res, i) => {
                const isMapped = INITIAL_ROOMS.some(r => r.pcoResourceId === res.id);
                return (
                  <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isMapped ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                    <div className="flex flex-col overflow-hidden pr-4">
                        <span className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tighter">{res.attributes.name}</span>
                        <code className="text-[10px] font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 w-fit">ID: {res.id}</code>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(res.id);
                                // Optional: add a temporary success state
                            }}
                            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-indigo-600"
                            title="Copy ID"
                        >
                            <RefreshCw size={14} />
                        </button>
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${isMapped ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100' : 'bg-rose-100 text-rose-600'}`}>
                            {isMapped ? 'Active' : 'Unmapped'}
                        </span>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                    <RefreshCw className="text-slate-200 animate-spin mb-4" size={48} />
                    <p className="text-sm text-slate-400 font-black uppercase tracking-widest">Awaiting API Data...</p>
                    <p className="text-[10px] text-slate-300 uppercase font-bold mt-2 italic">Ensure your PCO_APP_ID and PCO_SECRET are active in Vercel</p>
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
