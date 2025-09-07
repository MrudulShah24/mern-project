import React from 'react';
import ReactDOM from 'react-dom/client'; // ✅ this line changed
import App from './App';
import './index.css'; // ✅ import your CSS file

const root = ReactDOM.createRoot(document.getElementById('root')); // ✅ createRoot instead of render
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
