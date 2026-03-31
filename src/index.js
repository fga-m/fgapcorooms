import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx'; 

/**
 * ENTRY POINT (src/index.js)
 * This file connects your React dashboard logic to the HTML shell.
 * * 1. The import './app' matches your 'app.jsx' filename (lowercase).
 * 2. It points to the 'root' div defined in your public/index.html.
 */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
