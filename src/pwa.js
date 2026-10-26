import { useSyncExternalStore } from 'react';

let installEvent = null;
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

/**
 * Registers the service worker in production builds only: in `npm run dev` it would cache Vite's
 * dev modules and hide changes. Chrome's install event is kept so the guide can offer a button.
 */
export function registerPwa() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
    });
  }
  window.addEventListener('beforeinstallprompt', (event) => {
    installEvent = event;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    emit();
  });
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True when the browser offers an install prompt (Chrome and Edge). */
export const useCanInstall = () => useSyncExternalStore(subscribe, () => installEvent !== null);

export async function promptInstall() {
  const event = installEvent;
  if (!event) return;
  installEvent = null;
  emit();
  await event.prompt();
}

/**
 * Home screen shortcuts open `?dial=<code>`. The code is read once and removed from the address,
 * so a reload doesn't dial it again.
 */
export function takeDialParam() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('dial');
  if (!code) return null;
  url.searchParams.delete('dial');
  window.history.replaceState(null, '', url);
  return code;
}
