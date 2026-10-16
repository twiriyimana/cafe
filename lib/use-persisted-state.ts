"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Small localStorage-backed state hook built on useSyncExternalStore.
 * Pass a module-level constant as `initial` (it must be referentially stable).
 * Server render and first client render both use `initial`, so there is no hydration mismatch.
 */
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, unknown>();

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function read<T>(key: string, initial: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let value = initial;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) value = JSON.parse(raw) as T;
  } catch {
    /* storage unavailable or corrupt: fall back to the initial value */
  }
  cache.set(key, value);
  return value;
}

export function usePersistedState<T>(key: string, initial: T) {
  const subscribe = useCallback(
    (listener: () => void) => {
      let set = listeners.get(key);
      if (!set) listeners.set(key, (set = new Set()));
      set.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          cache.delete(key); // another tab changed it
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        set.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    () => read(key, initial),
    () => initial,
  );

  const setValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      const previous = read(key, initial);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(previous) : next;
      cache.set(key, resolved);
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* keep the value in memory for this session */
      }
      notify(key);
    },
    [key, initial],
  );

  return [value, setValue] as const;
}
