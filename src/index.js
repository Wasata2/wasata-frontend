import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';   {/* ← سطر جديد */}
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>        {/* ← سطر جديد */}
        <App />
      </AuthProvider>       {/* ← سطر جديد */}
    </BrowserRouter>
  </React.StrictMode>
);