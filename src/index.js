import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx'; 

/**
 * src/index.js
 * * FINAL BUILD FIX:
 * The error "Module not found: Can't resolve './app'" in your Vercel logs 
 * is caused by the missing '.jsx' extension. 
 * * In ESM mode (which we are using), extensions are mandatory.
 */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
