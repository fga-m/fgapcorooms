import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app'; // Matches your lowercase 'app.jsx' filename

/**
 * ENTRY POINT (src/index.js)
 * This file tells React to take the logic in app.jsx and 
 * inject it into the 'root' div in public/index.html.
 */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
