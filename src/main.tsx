import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'

// Add i18n guard in development
if (process.env.NODE_ENV === 'development') {
  import('./hooks/useI18nGuard').then(({ useI18nGuard }) => {
    // Guard will be activated when components using it are rendered
  });
}

createRoot(document.getElementById("root")!).render(<App />);
