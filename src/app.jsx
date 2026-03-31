/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  AlertCircle, 
  Bug, 
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';

const INITIAL_ROOMS = [
  { id: 'r1', pcoResourceId: '', displayName: 'Sanctuary', category: 'Worship', capacity: 450 },
  { id: 'r2', pcoResourceId: '', displayName: 'Lobby', category: 'Youth', capacity: 120 },
  { id: 'r3', pcoResourceId: '', displayName: 'Zoom 1', category: 'Admin', capacity: 15 },
  { id: 'r4', pcoResourceId: '', displayName: 'Zoom 2', category: 'Kids', capacity: 80 },
  { id: 'r5', pcoResourceId: '', displayName: 'Zoom 3', category: 'General', capacity: 60 },
  { id: 'r6', pcoResourceId: '', displayName: 'Zoom 4', category: 'Tech', capacity: 8 },
  { id: 'r7', pcoResourceId: '', displayName: 'Multipurpose Room', category: 'Tech', capacity: 8 },
];

const CATEGORY_COLORS = {
  Worship: 'bg-blue-500',
  Youth: 'bg-purple-500',
  Admin: 'bg-gray-500',
  Kids: 'bg-orange-500',
  General: 'bg-green-500',
  Tech: 'bg-red-500'
};

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startHour, setStartHour] = useState(8);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugData, setDebugData] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const scrollContainerRef = useRef(null);

  const hours = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => (startHour + i) % 24),
    [startHour]
  );

  const fetchCalendar = async (date) => {
    setLoading(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const response = await fetch(`/api/calendar?date=${dateString}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setEvents(data.events || []);
      setDebugData(data.debug);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(currentDate);
    const interval = setInterval(() => fetchCalendar(currentDate), 300000);
    return () => clearInterval(interval);
  }, [currentDate]);

  const shiftTime = (amount) => {
    setStartHour((prev) => (prev + amount + 24) % 24);
  };

  const changeDate = (days) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + days);
    setCurrentDate(next);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setStartHour(Math.max(0, Math.min(now.getHours() - 2, 16)));
  };

  const getEventStyle = (event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    const viewStart = new Date(currentDate);
    viewStart.setHours(startHour, 0, 0, 0);
    const viewEnd = new Date(currentDate);
    viewEnd.setHours(startHour + 8, 0, 0, 0);

    const effectiveStart = Math.max(start, viewStart);
    const effectiveEnd = Math.min(end, viewEnd);
    
    if (effectiveEnd <= effectiveStart) return { display: 'none' };

    const left = ((effectiveStart - viewStart) / (8 * 3600000)) * 100;
    const width = ((effectiveEnd - effectiveStart) / (8 * 3600000)) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`,
      minWidth: '2px'
    };
  };

  const NowIndicator = () => {
    const [now, setNow] = useState(new Date());
    
    useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 60000);
      return () => clearInterval(timer);
    }, []);

    const viewStart = new Date(currentDate);
    viewStart.setHours(startHour, 0, 0, 0);
    const viewEnd = new Date(currentDate);
    viewEnd.setHours(startHour + 8, 0, 0, 0);

    if (now < viewStart || now > viewEnd) return null;

    const position = ((now - viewStart) / (8 * 3600000)) * 100;

    return (
      <div 
        className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-red-500 text-[10px] text-white px-1 rounded font-bold shadow-sm">
          NOW
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-900">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
            <Calendar className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">FGAM ROOMS</h1>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Planning Center Live</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={goToToday}
            className="px-4 py-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
          >
            TODAY
          </button>

          <div className="px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-100 min-w-[160px] text-center">
            <span className="font-bold text-slate-700">
              {currentDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className={`p-2 rounded-xl transition-all ${showDebug ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' : 'bg-white text-slate-400 hover:text-slate-600 shadow-sm border border-slate-200'}`}
          >
            <Bug className="w-5 h-5" />
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</p>
            <p className="text-xs font-mono text-slate-600">{lastUpdated?.toLocaleTimeString() || '--:--'}</p>
          </div>
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="max-w-7xl mx-auto relative bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        
        {/* Time Shift Controls In-Grid */}
        <div className="absolute top-0 left-0 z-40 bg-slate-900 text-white p-4 flex flex-col items-center justify-center border-b border-slate-800 h-20 w-48 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => shiftTime(-1)} className="p-1 hover:bg-white/10 rounded"><ChevronLeft size={16}/></button>
            <span className="text-[10px] font-black tracking-tighter opacity-70">SHIFT WINDOW</span>
            <button onClick={() => shiftTime(1)} className="p-1 hover:bg-white/10 rounded"><ChevronRight size={16}/></button>
          </div>
          <span className="text-xs font-bold text-blue-400">
            {startHour % 12 || 12}{startHour >= 12 ? 'PM' : 'AM'} — {(startHour + 8) % 12 || 12}{(startHour + 8) % 24 >= 12 ? 'PM' : 'AM'}
          </span>
        </div>

        <div className="overflow-x-auto select-none" ref={scrollContainerRef}>
          <div className="min-w-[1000px]">
            {/* Timeline Header */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <div className="w-48 p-4 shrink-0 font-bold text-slate-400 text-xs uppercase tracking-widest border-r border-slate-100 h-20 flex items-end">
                Resources
              </div>
              <div className="flex-1 flex relative h-20 items-end">
                {hours.map((hour) => (
                  <div key={hour} className="flex-1 border-l border-slate-100/50 p-4 text-center">
                    <span className="text-sm font-black text-slate-400 tracking-tighter">
                      {hour % 12 || 12}
                      <span className="text-[10px] ml-0.5 opacity-60">{hour >= 12 ? 'PM' : 'AM'}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Rows */}
            <div className="relative">
              {INITIAL_ROOMS.map((room) => (
                <div key={room.id} className="flex border-b border-slate-50 group hover:bg-slate-50/30 transition-colors">
                  <div className="w-48 p-5 shrink-0 border-r border-slate-100 bg-white group-hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wider ${CATEGORY_COLORS[room.category]}`}>
                        {room.category}
                      </span>
                      <div className="flex items-center gap-1 text-slate-300">
                        <Users size={10} />
                        <span className="text-[10px] font-bold">{room.capacity}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 leading-tight">{room.displayName}</h3>
                  </div>

                  <div className="flex-1 flex relative py-3 min-h-[85px]">
                    {/* Hour Markers */}
                    {hours.map((h) => (
                      <div key={h} className="flex-1 border-l border-slate-100/30 first:border-0" />
                    ))}
                    
                    {/* Events */}
                    {events
                      .filter(e => e.resourceId === room.pcoResourceId && room.pcoResourceId !== "")
                      .map((event, idx) => (
                        <div
                          key={event.id || idx}
                          style={getEventStyle(event)}
                          className={`absolute h-[calc(100%-1.5rem)] rounded-xl p-3 shadow-sm border-l-4 border-white/20 transition-all hover:scale-[1.01] hover:z-20 cursor-default flex flex-col justify-center overflow-hidden ${CATEGORY_COLORS[room.category] || 'bg-blue-500'} text-white`}
                        >
                          <p className="text-xs font-black leading-tight mb-0.5 truncate drop-shadow-sm">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-2 opacity-90">
                            <div className="flex items-center gap-0.5 text-[9px] font-bold">
                              <Clock size={8} />
                              {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              <NowIndicator />
            </div>
          </div>
        </div>
      </main>

      {/* Debug/Setup Panel */}
      {showDebug && (
        <div className="max-w-7xl mx-auto mt-6 bg-white rounded-2xl border-2 border-amber-200 overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="text-amber-600 w-5 h-5" />
              <h2 className="font-black text-amber-900 tracking-tight">RESOURCE DISCOVERY MODE</h2>
            </div>
            <button onClick={() => setShowDebug(false)} className="p-1 hover:bg-amber-200 rounded-lg text-amber-600 transition-colors">
              <ChevronLeft className="w-5 h-5 rotate-90" />
            </button>
          </div>
          <div className="p-6">
            {!debugData ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Fetching available resources from PCO...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {debugData.map(res => {
                  const isMapped = INITIAL_ROOMS.some(r => r.pcoResourceId === res.id);
                  return (
                    <div key={res.id} className={`p-4 rounded-xl border-2 transition-all ${isMapped ? 'border-green-100 bg-green-50/30' : 'border-slate-100 hover:border-amber-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono bg-slate-900 text-white px-2 py-0.5 rounded tracking-tighter">ID: {res.id}</span>
                        {isMapped ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-amber-500" />}
                      </div>
                      <p className="font-bold text-slate-800 mb-1">{res.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mb-3">{res.path}</p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(res.id)}
                        className="w-full py-1.5 text-[10px] font-black uppercase bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        Copy ID
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto mt-8 flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold tracking-widest uppercase">System Operational</span>
         </div>
         <span className="text-[10px] font-medium tracking-tighter">FGAM IT Operations Room Display v3.0</span>
      </footer>
    </div>
  );
};

export default Dashboard;
