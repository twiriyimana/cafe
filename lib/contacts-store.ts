import { useCallback, useSyncExternalStore } from "react";

export type CustomerType = "Individual" | "Business";

export type Customer = {
  id: number;
  type: CustomerType;
  name: string;
  email: string;
  phone: string;
  company: string;
  tin: string;
  balance: number;
};

export type Vendor = {
  id: number;
  type: CustomerType;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  tin: string;
  address: string;
  balance: number;
};

export const CUSTOMERS_KEY = "mugbean-demo-customers";
export const VENDORS_KEY = "mugbean-demo-vendors";
const CONTACTS_CHANGE_EVENT = "mugbean-contacts-storage-change";
const EMPTY = "[]";

function subscribe(onChange: () => void) {
  window.addEventListener(CONTACTS_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONTACTS_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readSnapshot(key: string, fallbackRaw: string = EMPTY) {
  try {
    return window.localStorage.getItem(key) ?? fallbackRaw;
  } catch {
    return fallbackRaw;
  }
}

/**
 * Persisted list stored in localStorage (same approach as lib/demo-workspace.ts).
 * Returns [rows, setRows]; setRows accepts a new array or an updater function.
 */
export function useContactList<T>(key: string, fallback: T[] = []) {
  const fallbackRaw = JSON.stringify(fallback);
  const raw = useSyncExternalStore(subscribe, () => readSnapshot(key, fallbackRaw), () => fallbackRaw);

  let rows: T[] = [];
  try {
    const parsed: unknown = JSON.parse(raw);
    rows = Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    rows = [];
  }

  const setRows = useCallback(
    (next: T[] | ((current: T[]) => T[])) => {
      let current: T[] = [];
      try {
        const parsed: unknown = JSON.parse(readSnapshot(key, fallbackRaw));
        current = Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        current = [];
      }
      const value = typeof next === "function" ? (next as (c: T[]) => T[])(current) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage unavailable: ignore */
      }
      window.dispatchEvent(new Event(CONTACTS_CHANGE_EVENT));
    },
    [key, fallbackRaw],
  );

  return [rows, setRows] as const;
}
