import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAppPermissions } from "./lib/notification-setup";

// Initialize native permissions (notifications, etc.)
initializeAppPermissions();

// Force env reload - build timestamp: 2025-12-08

if (import.meta.env.DEV) {
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('[Diagnostics] React version:', React.version);
  const renderersCount = hook?.renderers ? (hook.renderers.size ?? (hook.renderers as any).length ?? 0) : 'n/a';
  console.log('[Diagnostics] DevTools renderers count:', renderersCount);
  if (typeof renderersCount === 'number' && renderersCount > 1) {
    console.warn('[Diagnostics] Multiple React renderers detected. This can cause invalid hook calls.');
  }
}
// Enable dark mode by default
document.documentElement.classList.add('dark');

// Service Worker: only register in production; in dev, aggressively unregister and clear caches
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    } else {
      // In dev, remove any existing service workers and clear caches to avoid stale chunk mismatches
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      console.log('SW unregistered and caches cleared for dev to avoid stale chunks.');
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
