import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx'; 

/**
 * src/index.js
 * * This is the main entry point for the React application.
 * Note: The '.jsx' extension is required in the import statement
 * to satisfy the strict ESM requirements on Vercel.
 */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
