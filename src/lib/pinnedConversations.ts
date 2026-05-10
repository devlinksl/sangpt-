// Local pinned-conversation registry. Persists across sessions per device.
const KEY = 'sangpt-pinned-conversations';
type Listener = () => void;

let pinned: Set<string> = load();
const listeners = new Set<Listener>();

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify([...pinned])); } catch {}
}

function emit() { listeners.forEach((l) => l()); }

export const pinnedStore = {
  subscribe(l: Listener) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
  getSnapshot(): Set<string> { return pinned; },
  isPinned(id: string) { return pinned.has(id); },
  toggle(id: string) {
    const next = new Set(pinned);
    if (next.has(id)) next.delete(id); else next.add(id);
    pinned = next;
    persist();
    emit();
  },
  remove(id: string) {
    if (!pinned.has(id)) return;
    const next = new Set(pinned);
    next.delete(id);
    pinned = next;
    persist();
    emit();
  },
};

import { useSyncExternalStore } from 'react';
export function usePinned() {
  return useSyncExternalStore(
    pinnedStore.subscribe,
    pinnedStore.getSnapshot,
    pinnedStore.getSnapshot,
  );
}
