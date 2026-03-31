{\rtf1\ansi\ansicpg1252\cocoartf2869
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 Menlo-Regular;}
{\colortbl;\red255\green255\blue255;\red111\green14\blue195;\red236\green241\blue247;\red0\green0\blue0;
\red164\green69\blue11;\red24\green112\blue43;\red77\green80\blue85;}
{\*\expandedcolortbl;;\cssrgb\c51765\c18824\c80784;\cssrgb\c94118\c95686\c97647;\cssrgb\c0\c0\c0;
\cssrgb\c70980\c34902\c3137;\cssrgb\c9412\c50196\c21961;\cssrgb\c37255\c38824\c40784;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs28 \cf2 \cb3 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 export\cf0 \strokec4  \cf2 \strokec2 default\cf0 \strokec4  \cf2 \strokec2 async\cf0 \strokec4  \cf2 \strokec2 function\cf0 \strokec4  handler(req, res) \{\cb1 \
\pard\pardeftab720\partightenfactor0
\cf0 \cb3   \cf2 \strokec2 const\cf0 \strokec4  \{ url \} = req.query;\cb1 \
\
\cb3   \cf2 \strokec2 if\cf0 \strokec4  (!url) \{\cb1 \
\cb3     \cf2 \strokec2 return\cf0 \strokec4  res.status(\cf5 \strokec5 400\cf0 \strokec4 ).json(\{ error: \cf6 \strokec6 'Missing URL parameter'\cf0 \strokec4  \});\cb1 \
\cb3   \}\cb1 \
\
\cb3   \cf2 \strokec2 try\cf0 \strokec4  \{\cb1 \
\cb3     \cf7 \strokec7 // Fetch the webcal data from Planning Center\cf0 \cb1 \strokec4 \
\cb3     \cf2 \strokec2 const\cf0 \strokec4  response = \cf2 \strokec2 await\cf0 \strokec4  fetch(url.replace(\cf6 \strokec6 'webcal://'\cf0 \strokec4 , \cf6 \strokec6 'https://'\cf0 \strokec4 ));\cb1 \
\cb3     \cf2 \strokec2 const\cf0 \strokec4  data = \cf2 \strokec2 await\cf0 \strokec4  response.text();\cb1 \
\
\cb3     \cf7 \strokec7 // Set headers to allow your frontend to read it\cf0 \cb1 \strokec4 \
\cb3     res.setHeader(\cf6 \strokec6 'Content-Type'\cf0 \strokec4 , \cf6 \strokec6 'text/calendar'\cf0 \strokec4 );\cb1 \
\cb3     res.setHeader(\cf6 \strokec6 'Access-Control-Allow-Origin'\cf0 \strokec4 , \cf6 \strokec6 '*'\cf0 \strokec4 );\cb1 \
\cb3     \cb1 \
\cb3     \cf2 \strokec2 return\cf0 \strokec4  res.status(\cf5 \strokec5 200\cf0 \strokec4 ).send(data);\cb1 \
\cb3   \} \cf2 \strokec2 catch\cf0 \strokec4  (error) \{\cb1 \
\cb3     \cf2 \strokec2 return\cf0 \strokec4  res.status(\cf5 \strokec5 500\cf0 \strokec4 ).json(\{ error: \cf6 \strokec6 'Failed to fetch calendar data'\cf0 \strokec4  \});\cb1 \
\cb3   \}\cb1 \
\cb3 \}}