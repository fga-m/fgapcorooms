import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx'; 

/**
 * src/index.js
 * Standard React 18 entry point.
 * We use the explicit .jsx extension for the App import 
 * to satisfy strict ESM requirements on Vercel.
 */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
