import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx'; 

/**
 * ENTRY POINT (src/index.js)
 * This file connects your React dashboard logic to the HTML shell.
 * * CRITICAL FOR VERCEL:
 * 1. The import path './app.jsx' matches your lowercase filename exactly.
 * 2. Including the '.jsx' extension helps the build engine resolve the module.
 */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
