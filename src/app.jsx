{\rtf1\ansi\ansicpg1252\cocoartf2869
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 Menlo-Regular;}
{\colortbl;\red255\green255\blue255;\red111\green14\blue195;\red236\green241\blue247;\red0\green0\blue0;
\red14\green110\blue109;\red24\green112\blue43;\red77\green80\blue85;\red164\green69\blue11;\red107\green0\blue1;
}
{\*\expandedcolortbl;;\cssrgb\c51765\c18824\c80784;\cssrgb\c94118\c95686\c97647;\cssrgb\c0\c0\c0;
\cssrgb\c0\c50196\c50196;\cssrgb\c9412\c50196\c21961;\cssrgb\c37255\c38824\c40784;\cssrgb\c70980\c34902\c3137;\cssrgb\c50196\c0\c0;
}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs28 \cf2 \cb3 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 import\cf0 \strokec4  \cf5 \strokec5 React\cf0 \strokec4 , \{ useState, useEffect, useCallback \} \cf2 \strokec2 from\cf0 \strokec4  \cf6 \strokec6 'react'\cf0 \strokec4 ;\cb1 \
\cf2 \cb3 \strokec2 import\cf0 \strokec4  \{ \cb1 \
\pard\pardeftab720\partightenfactor0
\cf0 \cb3   \cf5 \strokec5 Calendar\cf0 \strokec4 , \cb1 \
\cb3   \cf5 \strokec5 Search\cf0 \strokec4 , \cb1 \
\cb3   \cf5 \strokec5 ChevronLeft\cf0 \strokec4 , \cb1 \
\cb3   \cf5 \strokec5 ChevronRight\cf0 \strokec4 , \cb1 \
\cb3   \cf5 \strokec5 Users\cf0 \strokec4 , \cb1 \
\cb3   \cf5 \strokec5 Clock\cf0 \strokec4 ,\cb1 \
\cb3   \cf5 \strokec5 Filter\cf0 \strokec4 ,\cb1 \
\cb3   \cf5 \strokec5 AlertCircle\cf0 \strokec4 ,\cb1 \
\cb3   \cf5 \strokec5 Link\cf0 \strokec4  \cf2 \strokec2 as\cf0 \strokec4  \cf5 \strokec5 LinkIcon\cf0 \strokec4 ,\cb1 \
\cb3   \cf5 \strokec5 RefreshCw\cf0 \strokec4 ,\cb1 \
\cb3   \cf5 \strokec5 Wifi\cf0 \strokec4 ,\cb1 \
\cb3   \cf5 \strokec5 WifiOff\cf0 \strokec4 ,\cb1 \
\cb3   \cf5 \strokec5 Bug\cf0 \strokec4 ,\cb1 \
\cb3   \cf5 \strokec5 ChevronDown\cf0 \cb1 \strokec4 \
\cb3 \} \cf2 \strokec2 from\cf0 \strokec4  \cf6 \strokec6 'lucide-react'\cf0 \strokec4 ;\cb1 \
\
\pard\pardeftab720\partightenfactor0
\cf7 \cb3 \strokec7 /**\cf0 \cb1 \strokec4 \
\cf7 \cb3 \strokec7  * PCO ROOM AVAILABILITY DASHBOARD\cf0 \cb1 \strokec4 \
\cf7 \cb3 \strokec7  * This file handles the UI and the logic for parsing the Planning Center .ics feed.\cf0 \cb1 \strokec4 \
\cf7 \cb3 \strokec7  * It attempts to use /api/calendar (the Vercel function) to bypass CORS.\cf0 \cb1 \strokec4 \
\cf7 \cb3 \strokec7  */\cf0 \cb1 \strokec4 \
\
\cf7 \cb3 \strokec7 // UPDATE THIS LIST: The 'name' must match the 'LOCATION' field in your PCO Calendar events.\cf0 \cb1 \strokec4 \
\pard\pardeftab720\partightenfactor0
\cf2 \cb3 \strokec2 const\cf0 \strokec4  \cf5 \strokec5 INITIAL_ROOMS\cf0 \strokec4  = [\cb1 \
\pard\pardeftab720\partightenfactor0
\cf0 \cb3   \{ id: \cf6 \strokec6 'r1'\cf0 \strokec4 , name: \cf6 \strokec6 'Main Sanctuary'\cf0 \strokec4 , category: \cf6 \strokec6 'Worship'\cf0 \strokec4 , capacity: \cf8 \strokec8 450\cf0 \strokec4  \},\cb1 \
\cb3   \{ id: \cf6 \strokec6 'r2'\cf0 \strokec4 , name: \cf6 \strokec6 'Youth Center'\cf0 \strokec4 , category: \cf6 \strokec6 'Youth'\cf0 \strokec4 , capacity: \cf8 \strokec8 120\cf0 \strokec4  \},\cb1 \
\cb3   \{ id: \cf6 \strokec6 'r3'\cf0 \strokec4 , name: \cf6 \strokec6 'Conference Room A'\cf0 \strokec4 , category: \cf6 \strokec6 'Admin'\cf0 \strokec4 , capacity: \cf8 \strokec8 15\cf0 \strokec4  \},\cb1 \
\cb3   \{ id: \cf6 \strokec6 'r4'\cf0 \strokec4 , name: \cf6 \strokec6 'Kids Theater'\cf0 \strokec4 , category: \cf6 \strokec6 'Kids'\cf0 \strokec4 , capacity: \cf8 \strokec8 80\cf0 \strokec4  \},\cb1 \
\cb3   \{ id: \cf6 \strokec6 'r5'\cf0 \strokec4 , name: \cf6 \strokec6 'Cafe Lobby'\cf0 \strokec4 , category: \cf6 \strokec6 'General'\cf0 \strokec4 , capacity: \cf8 \strokec8 60\cf0 \strokec4  \},\cb1 \
\cb3   \{ id: \cf6 \strokec6 'r6'\cf0 \strokec4 , name: \cf6 \strokec6 'Production Suite'\cf0 \strokec4 , category: \cf6 \strokec6 'Tech'\cf0 \strokec4 , capacity: \cf8 \strokec8 8\cf0 \strokec4  \},\cb1 \
\cb3 ];\cb1 \
\
\pard\pardeftab720\partightenfactor0
\cf2 \cb3 \strokec2 const\cf0 \strokec4  \cf5 \strokec5 App\cf0 \strokec4  = () => \{\cb1 \
\pard\pardeftab720\partightenfactor0
\cf0 \cb3   \cf2 \strokec2 const\cf0 \strokec4  [currentDate, setCurrentDate] = useState(\cf2 \strokec2 new\cf0 \strokec4  \cf5 \strokec5 Date\cf0 \strokec4 ());\cb1 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  [searchTerm, setSearchTerm] = useState(\cf6 \strokec6 ''\cf0 \strokec4 );\cb1 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  [selectedCategory, setSelectedCategory] = useState(\cf6 \strokec6 'All'\cf0 \strokec4 );\cb1 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  [icsUrl, setIcsUrl] = useState(\cf6 \strokec6 'webcal://calendar.planningcenteronline.com/icals/eJxj4ajmsGLLz2Q-J8pkxZVanF9QAhIozWROnGdixZbtqcSRmJPDZsXmGmLFXlbiqcQH5MaXZOamFrNZc4ZYcRckFiXmFgP1sBcnZrIByRQwmZfJBgBf8xjw938709825ac6df76089393a1f8c561d56705a7e4'\cf0 \strokec4 );\cb1 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  [bookings, setBookings] = useState([]);\cb1 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  [isLoading, setIsLoading] = useState(\cf2 \strokec2 false\cf0 \strokec4 );\cb1 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  [error, setError] = useState(\cf2 \strokec2 null\cf0 \strokec4 );\cb1 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  [showDebug, setShowDebug] = useState(\cf2 \strokec2 false\cf0 \strokec4 );\cb1 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  [discoveredLocations, setDiscoveredLocations] = useState([]);\cb1 \
\
\cb3   \cf2 \strokec2 const\cf0 \strokec4  hours = \cf5 \strokec5 Array\cf0 \strokec4 .\cf2 \strokec2 from\cf0 \strokec4 (\{ length: \cf8 \strokec8 16\cf0 \strokec4  \}, (_, i) => i + \cf8 \strokec8 7\cf0 \strokec4 ); \cf7 \strokec7 // 7 AM to 10 PM\cf0 \cb1 \strokec4 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  categories = [\cf6 \strokec6 'All'\cf0 \strokec4 , ...\cf2 \strokec2 new\cf0 \strokec4  \cf5 \strokec5 Set\cf0 \strokec4 (\cf5 \strokec5 INITIAL_ROOMS\cf0 \strokec4 .map(r => r.category))];\cb1 \
\
\cb3   \cf7 \strokec7 // --- ICS HELPER: PARSE DATES ---\cf0 \cb1 \strokec4 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  parseICSDate = (icsDate) => \{\cb1 \
\cb3     \cf2 \strokec2 const\cf0 \strokec4  year = icsDate.substring(\cf8 \strokec8 0\cf0 \strokec4 , \cf8 \strokec8 4\cf0 \strokec4 );\cb1 \
\cb3     \cf2 \strokec2 const\cf0 \strokec4  month = parseInt(icsDate.substring(\cf8 \strokec8 4\cf0 \strokec4 , \cf8 \strokec8 6\cf0 \strokec4 )) - \cf8 \strokec8 1\cf0 \strokec4 ;\cb1 \
\cb3     \cf2 \strokec2 const\cf0 \strokec4  day = icsDate.substring(\cf8 \strokec8 6\cf0 \strokec4 , \cf8 \strokec8 8\cf0 \strokec4 );\cb1 \
\cb3     \cf2 \strokec2 if\cf0 \strokec4  (icsDate.includes(\cf6 \strokec6 'T'\cf0 \strokec4 )) \{\cb1 \
\cb3       \cf2 \strokec2 const\cf0 \strokec4  hour = icsDate.substring(\cf8 \strokec8 9\cf0 \strokec4 , \cf8 \strokec8 11\cf0 \strokec4 );\cb1 \
\cb3       \cf2 \strokec2 const\cf0 \strokec4  min = icsDate.substring(\cf8 \strokec8 11\cf0 \strokec4 , \cf8 \strokec8 13\cf0 \strokec4 );\cb1 \
\cb3       \cf2 \strokec2 return\cf0 \strokec4  \cf2 \strokec2 new\cf0 \strokec4  \cf5 \strokec5 Date\cf0 \strokec4 (\cf5 \strokec5 Date\cf0 \strokec4 .\cf5 \strokec5 UTC\cf0 \strokec4 (year, month, day, hour, min)).toISOString();\cb1 \
\cb3     \}\cb1 \
\cb3     \cf2 \strokec2 return\cf0 \strokec4  \cf2 \strokec2 new\cf0 \strokec4  \cf5 \strokec5 Date\cf0 \strokec4 (year, month, day).toISOString();\cb1 \
\cb3   \};\cb1 \
\
\cb3   \cf7 \strokec7 // --- ICS HELPER: PARSE ENTIRE FILE ---\cf0 \cb1 \strokec4 \
\cb3   \cf2 \strokec2 const\cf0 \strokec4  parseICS = (data) => \{\cb1 \
\cb3     \cf2 \strokec2 const\cf0 \strokec4  events = [];\cb1 \
\cb3     \cf2 \strokec2 const\cf0 \strokec4  lines = data.split(\cf9 \strokec9 /\\r?\\n/\cf0 \strokec4 );\cb1 \
\cb3     \cf2 \strokec2 let\cf0 \strokec4  currentEvent = \cf2 \strokec2 null\cf0 \strokec4 ;\cb1 \
\
\cb3     \cf2 \strokec2 for\cf0 \strokec4  (\cf2 \strokec2 let\cf0 \strokec4  line \cf2 \strokec2 of\cf0 \strokec4  lines) \{\cb1 \
\cb3       \cf2 \strokec2 if\cf0 \strokec4  (line.startsWith(\cf6 \strokec6 'BEGIN:VEVENT'\cf0 \strokec4 )) \{\cb1 \
\cb3         currentEvent = \{\};\cb1 \
\cb3       \} \cf2 \strokec2 else\cf0 \strokec4  \cf2 \strokec2 if\cf0 \strokec4  (line.startsWith(\cf6 \strokec6 'END:VEVENT'\cf0 \strokec4 )) \{\cb1 \
\cb3         \cf2 \strokec2 if\cf0 \strokec4  (currentEvent.start && currentEvent.end && currentEvent.location) \{\cb1 \
\cb3           events.push(currentEvent);\cb1 \
\cb3         \}\cb1 \
\cb3         currentEvent = \cf2 \strokec2 null\cf0 \strokec4 ;\cb1 \
\cb3       \} \cf2 \strokec2 else\cf0 \strokec4  \cf2 \strokec2 if\cf0 \strokec4  (currentEvent) \{\cb1 \
\cb3         \cf2 \strokec2 if\cf0 \strokec4  (line.startsWith(\cf6 \strokec6 'SUMMARY:'\cf0 \strokec4 )) currentEvent.title = line.substring(\cf8 \strokec8 8\cf0 \strokec4 );\cb1 \
\cb3         \cf2 \strokec2 if\cf0 \strokec4  (line.startsWith(\cf6 \strokec6 'LOCATION:'\cf0 \strokec4 )) currentEvent.location = line.substring(\cf8 \strokec8 9\cf0 \strokec4 ).replace(\cf9 \strokec9 /\\\\,/\cf2 \strokec2 g\cf0 \strokec4 , \cf6 \strokec6 ','\cf0 \strokec4 ).trim();\cb1 \
\cb3         \cf2 \strokec2 if\cf0 \strokec4  (line.startsWith(\cf6 \strokec6 'DTSTART:'\cf0 \strokec4 )) currentEvent.start = parseICSDate(line.substring(\cf8 \strokec8 8\cf0 \strokec4 ));\cb1 \
\cb3         \cf2 \strokec2 if\cf0 \strokec4  (line.startsWith(\cf6 \strokec6 'DTEND:'\cf0 \strokec4 )) currentEvent.end = parseICSDate(line.substring(\cf8 \strokec8 6\cf0 \strokec4 ));\cb1 \
\cb3       \}\cb1 \
\cb3     \}\cb1 \
\cb3     \cf2 \strokec2 return\cf0 \strokec4  events;\cb1 \
\cb3   \};\cb1 \
\
\cb3   \cf2 \strokec2 const\cf0 \strokec4  fetchCalendar = useCallback(\cf2 \strokec2 async\cf0 \strokec4  () => \{\cb1 \
\cb3     \cf2 \strokec2 if\cf0 \strokec4  (!icsUrl) \cf2 \strokec2 return\cf0 \strokec4 ;\cb1 \
\cb3     setIsLoading(\cf2 \strokec2 true\cf0 \strokec4 );\cb1 \
\cb3     setError(\cf2 \strokec2 null\cf0 \strokec4 );\cb1 \
\
\cb3     \cf2 \strokec2 try\cf0 \strokec4  \{\cb1 \
\cb3       \cf2 \strokec2 const\cf0 \strokec4  targetUrl = icsUrl.replace(\cf6 \strokec6 'webcal://'\cf0 \strokec4 , \cf6 \strokec6 'https://'\cf0 \strokec4 );\cb1 \
\cb3       \cf2 \strokec2 let\cf0 \strokec4  response;\cb1 \
\cb3       \cb1 \
\cb3       \cf2 \strokec2 try\cf0 \strokec4  \{\cb1 \
\cb3         \cf7 \strokec7 // First try the Vercel Serverless Function\cf0 \cb1 \strokec4 \
\cb3         response = \cf2 \strokec2 await\cf0 \strokec4  fetch(\cf6 \strokec6 `/api/calendar?url=\cf0 \strokec4 $\{encodeURIComponent(targetUrl)\}\cf6 \strokec6 `\cf0 \strokec4 );\cb1 \
\cb3         \cf2 \strokec2 if\cf0 \strokec4  (!response.ok) \cf2 \strokec2 throw\cf0 \strokec4  \cf2 \strokec2 new\cf0 \strokec4  \cf5 \strokec5 Error\cf0 \strokec4 (\cf6 \strokec6 'Local API not available'\cf0 \strokec4 );\cb1 \
\cb3       \} \cf2 \strokec2 catch\cf0 \strokec4  (e) \{\cb1 \
\cb3         \cf7 \strokec7 // Fallback to a public proxy for local development/previews\cf0 \cb1 \strokec4 \
\cb3         \cf2 \strokec2 const\cf0 \strokec4  proxyUrl = \cf6 \strokec6 `https://api.allorigins.win/get?url=\cf0 \strokec4 $\{encodeURIComponent(targetUrl)\}\cf6 \strokec6 &timestamp=\cf0 \strokec4 $\{\cf5 \strokec5 Date\cf0 \strokec4 .now()\}\cf6 \strokec6 `\cf0 \strokec4 ;\cb1 \
\cb3         \cf2 \strokec2 const\cf0 \strokec4  proxyRes = \cf2 \strokec2 await\cf0 \strokec4  fetch(proxyUrl);\cb1 \
\cb3         \cf2 \strokec2 const\cf0 \strokec4  json = \cf2 \strokec2 await\cf0 \strokec4  proxyRes.json();\cb1 \
\cb3         \cf2 \strokec2 if\cf0 \strokec4  (!json.contents) \cf2 \strokec2 throw\cf0 \strokec4  \cf2 \strokec2 new\cf0 \strokec4  \cf5 \strokec5 Error\cf0 \strokec4 (\cf6 \strokec6 "Proxy failed"\cf0 \strokec4 );\cb1 \
\cb3         response = \{ text: () => \cf5 \strokec5 Promise\cf0 \strokec4 .resolve(json.contents) \};\cb1 \
\cb3       \}\cb1 \
\cb3       \cb1 \
\cb3       \cf2 \strokec2 const\cf0 \strokec4  rawData = \cf2 \strokec2 await\cf0 \strokec4  response.text();\cb1 \
\cb3       \cf2 \strokec2 const\cf0 \strokec4  parsedEvents = parseICS(rawData);\cb1 \
\cb3       \cb1 \
\cb3       setDiscoveredLocations([...\cf2 \strokec2 new\cf0 \strokec4  \cf5 \strokec5 Set\cf0 \strokec4 (parsedEvents.map(e => e.location))]);\cb1 \
\
\cb3       \cf2 \strokec2 const\cf0 \strokec4  mappedBookings = parsedEvents.map((event, idx) => \{\cb1 \
\cb3         \cf7 \strokec7 // Try to find a room match in our list\cf0 \cb1 \strokec4 \
\cb3         \cf2 \strokec2 const\cf0 \strokec4  room = \cf5 \strokec5 INITIAL_ROOMS\cf0 \strokec4 .find(r => \cb1 \
\cb3           event.location.toLowerCase().includes(r.name.toLowerCase()) || \cb1 \
\cb3           r.name.toLowerCase().includes(event.location.toLowerCase())\cb1 \
\cb3         );\cb1 \
\cb3         \cb1 \
\cb3         \cf2 \strokec2 return\cf0 \strokec4  \{\cb1 \
\cb3           id: \cf6 \strokec6 `pco-\cf0 \strokec4 $\{idx\}\cf6 \strokec6 `\cf0 \strokec4 ,\cb1 \
\cb3           roomId: room ? room.id : \cf2 \strokec2 null\cf0 \strokec4 ,\cb1 \
\cb3           title: event.title,\cb1 \
\cb3           start: event.start,\cb1 \
\cb3           end: event.end,\cb1 \
\cb3           rawLocation: event.location\cb1 \
\cb3         \};\cb1 \
\cb3       \});\cb1 \
\
\cb3       setBookings(mappedBookings);\cb1 \
\cb3     \} \cf2 \strokec2 catch\cf0 \strokec4  (err) \{\cb1 \
\cb3       console.error(err);\cb1 \
\cb3       setError(\cf6 \strokec6 "Calendar Sync Error. Ensure your /api/calendar route is deployed on Vercel."\cf0 \strokec4 );\cb1 \
\cb3     \} \cf2 \strokec2 finally\cf0 \strokec4  \{\cb1 \
\cb3       setIsLoading(\cf2 \strokec2 false\cf0 \strokec4 );\cb1 \
\cb3     \}\cb1 \
\cb3   \}, [icsUrl]);\cb1 \
\
\cb3   useEffect(() => \{\cb1 \
\cb3     fetchCalendar();\cb1 \
\cb3   \}, [fetchCalendar]);\cb1 \
\
\cb3   \cf2 \strokec2 const\cf0 \strokec4  filteredRooms = \cf5 \strokec5 INITIAL_ROOMS\cf0 \strokec4 .filter(room => \{\cb1 \
\cb3     \cf2 \strokec2 const\cf0 \strokec4  matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());\cb1 \
\cb3     \cf2 \strokec2 const\cf0 \strokec4  matchesCategory = selectedCategory === \cf6 \strokec6 'All'\cf0 \strokec4  || room.category === selectedCategory;\cb1 \
\cb3     \cf2 \strokec2 return\cf0 \strokec4  matchesSearch && matchesCategory;\cb1 \
\cb3   \});\cb1 \
\
\cb3   \cf2 \strokec2 const\cf0 \strokec4  changeDate = (days) => \{\cb1 \
\cb3     \cf2 \strokec2 const\cf0 \strokec4  newDate = \cf2 \strokec2 new\cf0 \strokec4  \cf5 \strokec5 Date\cf0 \strokec4 (currentDate);\cb1 \
\cb3     newDate.setDate(newDate.getDate() + days);\cb1 \
\cb3     setCurrentDate(newDate);\cb1 \
\cb3   \};\cb1 \
\
\cb3   \cf2 \strokec2 return\cf0 \strokec4  (\cb1 \
\cb3     <div className=\cf6 \strokec6 "flex flex-col h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100"\cf0 \strokec4 >\cb1 \
\cb3       <header className=\cf6 \strokec6 "bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0"\cf0 \strokec4 >\cb1 \
\cb3         <div className=\cf6 \strokec6 "flex items-center gap-3"\cf0 \strokec4 >\cb1 \
\cb3           <div className=\cf6 \strokec6 "bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg"\cf0 \strokec4 >\cb1 \
\cb3             <\cf5 \strokec5 Calendar\cf0 \strokec4  size=\{\cf8 \strokec8 24\cf0 \strokec4 \} />\cb1 \
\cb3           </div>\cb1 \
\cb3           <div>\cb1 \
\cb3             <h1 className=\cf6 \strokec6 "text-xl font-extrabold tracking-tight text-slate-800"\cf0 \strokec4 >\cf5 \strokec5 Resource\cf0 \strokec4  \cf5 \strokec5 Planner\cf0 \strokec4 </h1>\cb1 \
\cb3             <div className=\cf6 \strokec6 "flex items-center gap-2 mt-0.5"\cf0 \strokec4 >\cb1 \
\cb3               <div className=\{\cf6 \strokec6 `h-2 w-2 rounded-full \cf0 \strokec4 $\{bookings.length > \cf8 \strokec8 0\cf0 \strokec4  ? \cf6 \strokec6 'bg-green-500'\cf0 \strokec4  : \cf6 \strokec6 'bg-amber-500 animate-pulse'\cf0 \strokec4 \}\cf6 \strokec6 `\cf0 \strokec4 \}></div>\cb1 \
\cb3               <p className=\cf6 \strokec6 "text-[10px] text-slate-500 font-bold uppercase tracking-widest"\cf0 \strokec4 >\cb1 \
\cb3                 \{bookings.filter(b => b.roomId).length\} \cf5 \strokec5 Rooms\cf0 \strokec4  \cf5 \strokec5 Active\cf0 \cb1 \strokec4 \
\cb3               </p>\cb1 \
\cb3             </div>\cb1 \
\cb3           </div>\cb1 \
\cb3         </div>\cb1 \
\
\cb3         <div className=\cf6 \strokec6 "flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200"\cf0 \strokec4 >\cb1 \
\cb3           <button onClick=\{() => changeDate(-\cf8 \strokec8 1\cf0 \strokec4 )\} className=\cf6 \strokec6 "p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"\cf0 \strokec4 ><\cf5 \strokec5 ChevronLeft\cf0 \strokec4  size=\{\cf8 \strokec8 20\cf0 \strokec4 \} /></button>\cb1 \
\cb3           <span className=\cf6 \strokec6 "px-6 font-bold text-slate-700 min-w-[200px] text-center text-sm"\cf0 \strokec4 >\cb1 \
\cb3             \{currentDate.toLocaleDateString(\cf6 \strokec6 'en-US'\cf0 \strokec4 , \{ weekday: \cf6 \strokec6 'long'\cf0 \strokec4 , month: \cf6 \strokec6 'short'\cf0 \strokec4 , day: \cf6 \strokec6 'numeric'\cf0 \strokec4  \})\}\cb1 \
\cb3           </span>\cb1 \
\cb3           <button onClick=\{() => changeDate(\cf8 \strokec8 1\cf0 \strokec4 )\} className=\cf6 \strokec6 "p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"\cf0 \strokec4 ><\cf5 \strokec5 ChevronRight\cf0 \strokec4  size=\{\cf8 \strokec8 20\cf0 \strokec4 \} /></button>\cb1 \
\cb3         </div>\cb1 \
\
\cb3         <div className=\cf6 \strokec6 "hidden lg:flex items-center gap-2 border-l border-slate-200 pl-4"\cf0 \strokec4 >\cb1 \
\cb3           <div className=\cf6 \strokec6 "relative"\cf0 \strokec4 >\cb1 \
\cb3             <\cf5 \strokec5 LinkIcon\cf0 \strokec4  className=\cf6 \strokec6 "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"\cf0 \strokec4  size=\{\cf8 \strokec8 14\cf0 \strokec4 \} />\cb1 \
\cb3             <input \cb1 \
\cb3               \cf2 \strokec2 type\cf0 \strokec4 =\cf6 \strokec6 "text"\cf0 \strokec4  \cb1 \
\cb3               placeholder=\cf6 \strokec6 "PCO .ics Link..."\cf0 \strokec4  \cb1 \
\cb3               className=\cf6 \strokec6 "pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs w-64 outline-none focus:ring-2 focus:ring-indigo-100"\cf0 \cb1 \strokec4 \
\cb3               value=\{icsUrl\}\cb1 \
\cb3               onChange=\{(e) => setIcsUrl(e.target.value)\}\cb1 \
\cb3             />\cb1 \
\cb3           </div>\cb1 \
\cb3           <button onClick=\{fetchCalendar\} disabled=\{isLoading\} className=\{\cf6 \strokec6 `p-2 rounded-lg \cf0 \strokec4 $\{isLoading ? \cf6 \strokec6 'animate-spin text-indigo-500'\cf0 \strokec4  : \cf6 \strokec6 'text-slate-400'\cf0 \strokec4 \}\cf6 \strokec6 `\cf0 \strokec4 \}>\cb1 \
\cb3             <\cf5 \strokec5 RefreshCw\cf0 \strokec4  size=\{\cf8 \strokec8 18\cf0 \strokec4 \} />\cb1 \
\cb3           </button>\cb1 \
\cb3         </div>\cb1 \
\cb3       </header>\cb1 \
\
\cb3       <main className=\cf6 \strokec6 "flex-1 overflow-hidden flex flex-col"\cf0 \strokec4 >\cb1 \
\cb3         \{error && (\cb1 \
\cb3           <div className=\cf6 \strokec6 "bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-center gap-2 text-amber-700 text-[10px] font-bold uppercase"\cf0 \strokec4 >\cb1 \
\cb3             <\cf5 \strokec5 AlertCircle\cf0 \strokec4  size=\{\cf8 \strokec8 14\cf0 \strokec4 \} /> \{error\}\cb1 \
\cb3           </div>\cb1 \
\cb3         )\}\cb1 \
\
\cb3         <div className=\cf6 \strokec6 "bg-white border-b border-slate-200 p-4 flex flex-wrap items-center gap-4 shrink-0"\cf0 \strokec4 >\cb1 \
\cb3           <div className=\cf6 \strokec6 "relative flex-1 min-w-[280px]"\cf0 \strokec4 >\cb1 \
\cb3             <\cf5 \strokec5 Search\cf0 \strokec4  className=\cf6 \strokec6 "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"\cf0 \strokec4  size=\{\cf8 \strokec8 18\cf0 \strokec4 \} />\cb1 \
\cb3             <input \cb1 \
\cb3               \cf2 \strokec2 type\cf0 \strokec4 =\cf6 \strokec6 "text"\cf0 \strokec4  \cb1 \
\cb3               placeholder=\cf6 \strokec6 "Search rooms..."\cf0 \strokec4  \cb1 \
\cb3               className=\cf6 \strokec6 "w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"\cf0 \cb1 \strokec4 \
\cb3               value=\{searchTerm\}\cb1 \
\cb3               onChange=\{(e) => setSearchTerm(e.target.value)\}\cb1 \
\cb3             />\cb1 \
\cb3           </div>\cb1 \
\cb3           <div className=\cf6 \strokec6 "flex gap-2"\cf0 \strokec4 >\cb1 \
\cb3             \{categories.map(cat => (\cb1 \
\cb3               <button\cb1 \
\cb3                 key=\{cat\}\cb1 \
\cb3                 onClick=\{() => setSelectedCategory(cat)\}\cb1 \
\cb3                 className=\{\cf6 \strokec6 `px-4 py-2 text-xs font-bold rounded-xl border transition-all \cf0 \strokec4 $\{\cb1 \
\cb3                   selectedCategory === cat ? \cf6 \strokec6 'bg-indigo-600 text-white shadow-md'\cf0 \strokec4  : \cf6 \strokec6 'bg-white text-slate-500 hover:bg-slate-50'\cf0 \cb1 \strokec4 \
\cb3                 \}\cf6 \strokec6 `\cf0 \strokec4 \}\cb1 \
\cb3               >\cb1 \
\cb3                 \{cat\}\cb1 \
\cb3               </button>\cb1 \
\cb3             ))\}\cb1 \
\cb3           </div>\cb1 \
\cb3           <button onClick=\{() => setShowDebug(!showDebug)\} className=\{\cf6 \strokec6 `ml-auto p-2 rounded-lg border transition-all \cf0 \strokec4 $\{showDebug ? \cf6 \strokec6 'bg-amber-100 border-amber-300 text-amber-700'\cf0 \strokec4  : \cf6 \strokec6 'bg-white border-slate-200 text-slate-400'\cf0 \strokec4 \}\cf6 \strokec6 `\cf0 \strokec4 \}>\cb1 \
\cb3             <\cf5 \strokec5 Bug\cf0 \strokec4  size=\{\cf8 \strokec8 20\cf0 \strokec4 \} />\cb1 \
\cb3           </button>\cb1 \
\cb3         </div>\cb1 \
\
\cb3         <div className=\cf6 \strokec6 "flex-1 overflow-auto bg-slate-200/40 relative"\cf0 \strokec4 >\cb1 \
\cb3           <div className=\cf6 \strokec6 "min-w-max p-8 pb-32"\cf0 \strokec4 >\cb1 \
\cb3             <div className=\cf6 \strokec6 "bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"\cf0 \strokec4 >\cb1 \
\cb3               <div className=\cf6 \strokec6 "flex"\cf0 \strokec4 >\cb1 \
\cb3                 <div className=\cf6 \strokec6 "w-72 shrink-0 bg-slate-50/50 border-r border-slate-200"\cf0 \strokec4 >\cb1 \
\cb3                   <div className=\cf6 \strokec6 "h-16 border-b border-slate-200 flex items-center px-6 bg-slate-100/50 uppercase tracking-widest text-[10px] font-black text-slate-400"\cf0 \strokec4 >\cf5 \strokec5 Rooms\cf0 \strokec4 </div>\cb1 \
\cb3                   \{filteredRooms.map(room => (\cb1 \
\cb3                     <div key=\{room.id\} className=\cf6 \strokec6 "h-28 border-b border-slate-100 px-6 flex flex-col justify-center"\cf0 \strokec4 >\cb1 \
\cb3                       <span className=\cf6 \strokec6 "font-extrabold text-slate-800 text-base"\cf0 \strokec4 >\{room.name\}</span>\cb1 \
\cb3                       <div className=\cf6 \strokec6 "flex items-center gap-2 mt-1"\cf0 \strokec4 >\cb1 \
\cb3                         <span className=\cf6 \strokec6 "text-[10px] font-bold bg-white border px-2 py-0.5 rounded-lg text-slate-500 uppercase"\cf0 \strokec4 >\{room.category\}</span>\cb1 \
\cb3                         <span className=\cf6 \strokec6 "text-[10px] font-bold text-slate-400 flex items-center gap-1"\cf0 \strokec4 ><\cf5 \strokec5 Users\cf0 \strokec4  size=\{\cf8 \strokec8 12\cf0 \strokec4 \}/> \{room.capacity\}</span>\cb1 \
\cb3                       </div>\cb1 \
\cb3                     </div>\cb1 \
\cb3                   ))\}\cb1 \
\cb3                 </div>\cb1 \
\
\cb3                 <div className=\cf6 \strokec6 "flex-1 relative"\cf0 \strokec4 >\cb1 \
\cb3                   <div className=\cf6 \strokec6 "flex h-16 border-b border-slate-200"\cf0 \strokec4 >\cb1 \
\cb3                     \{hours.map(hour => (\cb1 \
\cb3                       <div key=\{hour\} className=\cf6 \strokec6 "w-40 shrink-0 border-r border-slate-100 flex items-center justify-center bg-slate-50/30"\cf0 \strokec4 >\cb1 \
\cb3                         <span className=\cf6 \strokec6 "text-xs font-black text-slate-400 uppercase"\cf0 \strokec4 >\cb1 \
\cb3                           \{hour > \cf8 \strokec8 12\cf0 \strokec4  ? \cf6 \strokec6 `\cf0 \strokec4 $\{hour-\cf8 \strokec8 12\cf0 \strokec4 \}\cf6 \strokec6  PM`\cf0 \strokec4  : hour === \cf8 \strokec8 12\cf0 \strokec4  ? \cf6 \strokec6 '12 PM'\cf0 \strokec4  : \cf6 \strokec6 `\cf0 \strokec4 $\{hour\}\cf6 \strokec6  AM`\cf0 \strokec4 \}\cb1 \
\cb3                         </span>\cb1 \
\cb3                       </div>\cb1 \
\cb3                     ))\}\cb1 \
\cb3                   </div>\cb1 \
\
\cb3                   \{filteredRooms.map(room => (\cb1 \
\cb3                     <div key=\{room.id\} className=\cf6 \strokec6 "flex h-28 border-b border-slate-100 relative group"\cf0 \strokec4 >\cb1 \
\cb3                       \{hours.map(h => <div key=\{h\} className=\cf6 \strokec6 "w-40 shrink-0 border-r border-slate-50/50 group-hover:bg-slate-50/50"\cf0 \strokec4 ></div>)\}\cb1 \
\cb3                       \cb1 \
\cb3                       \{bookings\cb1 \
\cb3                         .filter(b => b.roomId === room.id && b.start.startsWith(currentDate.toISOString().split(\cf6 \strokec6 'T'\cf0 \strokec4 )[\cf8 \strokec8 0\cf0 \strokec4 ]))\cb1 \
\cb3                         .map(b => \{\cb1 \
\cb3                           \cf2 \strokec2 const\cf0 \strokec4  startObj = \cf2 \strokec2 new\cf0 \strokec4  \cf5 \strokec5 Date\cf0 \strokec4 (b.start);\cb1 \
\cb3                           \cf2 \strokec2 const\cf0 \strokec4  endObj = \cf2 \strokec2 new\cf0 \strokec4  \cf5 \strokec5 Date\cf0 \strokec4 (b.end);\cb1 \
\cb3                           \cf2 \strokec2 const\cf0 \strokec4  start = startObj.getHours() + (startObj.getMinutes() / \cf8 \strokec8 60\cf0 \strokec4 );\cb1 \
\cb3                           \cf2 \strokec2 const\cf0 \strokec4  end = endObj.getHours() + (endObj.getMinutes() / \cf8 \strokec8 60\cf0 \strokec4 );\cb1 \
\cb3                           \cf2 \strokec2 const\cf0 \strokec4  leftOffset = (start - \cf8 \strokec8 7\cf0 \strokec4 ) * \cf8 \strokec8 160\cf0 \strokec4 ;\cb1 \
\cb3                           \cf2 \strokec2 const\cf0 \strokec4  width = (end - start) * \cf8 \strokec8 160\cf0 \strokec4 ;\cb1 \
\
\cb3                           \cf2 \strokec2 return\cf0 \strokec4  (\cb1 \
\cb3                             <div key=\{b.id\} className=\cf6 \strokec6 "absolute top-4 h-20 rounded-2xl border-l-4 border-l-indigo-500 bg-white shadow-xl p-4 overflow-hidden border border-slate-100 z-10 hover:-translate-y-1 transition-all"\cf0 \strokec4  style=\{\{ left: \cf6 \strokec6 `\cf0 \strokec4 $\{leftOffset + \cf8 \strokec8 8\cf0 \strokec4 \}\cf6 \strokec6 px`\cf0 \strokec4 , width: \cf6 \strokec6 `\cf0 \strokec4 $\{width - \cf8 \strokec8 16\cf0 \strokec4 \}\cf6 \strokec6 px`\cf0 \strokec4  \}\}>\cb1 \
\cb3                               <div className=\cf6 \strokec6 "font-extrabold text-xs text-slate-800 truncate mb-1"\cf0 \strokec4 >\{b.title\}</div>\cb1 \
\cb3                               <div className=\cf6 \strokec6 "text-[10px] text-slate-500 font-bold flex items-center gap-1.5"\cf0 \strokec4 >\cb1 \
\cb3                                 <\cf5 \strokec5 Clock\cf0 \strokec4  size=\{\cf8 \strokec8 12\cf0 \strokec4 \} className=\cf6 \strokec6 "text-indigo-400"\cf0 \strokec4  /> \cb1 \
\cb3                                 \{startObj.toLocaleTimeString([], \{ hour: \cf6 \strokec6 'numeric'\cf0 \strokec4 , minute: \cf6 \strokec6 '2-digit'\cf0 \strokec4  \})\}\cb1 \
\cb3                               </div>\cb1 \
\cb3                             </div>\cb1 \
\cb3                           );\cb1 \
\cb3                         \})\}\cb1 \
\cb3                     </div>\cb1 \
\cb3                   ))\}\cb1 \
\cb3                 </div>\cb1 \
\cb3               </div>\cb1 \
\cb3             </div>\cb1 \
\cb3           </div>\cb1 \
\cb3         </div>\cb1 \
\
\cb3         \{showDebug && (\cb1 \
\cb3           <div className=\cf6 \strokec6 "absolute bottom-0 left-0 right-0 bg-amber-50 border-t-2 border-amber-200 z-50 p-4 max-h-64 overflow-auto"\cf0 \strokec4 >\cb1 \
\cb3             <h3 className=\cf6 \strokec6 "text-amber-800 font-black text-[10px] uppercase mb-2"\cf0 \strokec4 >\cf5 \strokec5 Locations\cf0 \strokec4  \cf5 \strokec5 Discovered\cf0 \strokec4  \cf2 \strokec2 in\cf0 \strokec4  \cf5 \strokec5 ICS\cf0 \strokec4 :</h3>\cb1 \
\cb3             <div className=\cf6 \strokec6 "flex flex-wrap gap-2"\cf0 \strokec4 >\cb1 \
\cb3               \{discoveredLocations.map((loc, i) => (\cb1 \
\cb3                 <code key=\{i\} className=\cf6 \strokec6 "bg-white border border-amber-200 px-2 py-1 rounded text-[10px] font-mono"\cf0 \strokec4 >\{loc\}</code>\cb1 \
\cb3               ))\}\cb1 \
\cb3             </div>\cb1 \
\cb3           </div>\cb1 \
\cb3         )\}\cb1 \
\cb3       </main>\cb1 \
\cb3     </div>\cb1 \
\cb3   );\cb1 \
\cb3 \};\cb1 \
\
\pard\pardeftab720\partightenfactor0
\cf2 \cb3 \strokec2 export\cf0 \strokec4  \cf2 \strokec2 default\cf0 \strokec4  \cf5 \strokec5 App\cf0 \strokec4 ;\cb1 \
}