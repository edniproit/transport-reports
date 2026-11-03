import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { DialogProvider } from './Dialogs.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <DialogProvider>
    <App />
  </DialogProvider>,
);
