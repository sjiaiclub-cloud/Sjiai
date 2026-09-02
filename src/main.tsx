import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Best-effort only: registers the service worker so the app is installable where the
// hosting environment supports it. Wrapped defensively since some sandboxed/embedded
// viewers block service worker registration entirely — that should never break the app.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // installability just won't be available here — the rest of the app is unaffected
    });
  });
}
