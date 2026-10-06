export type DemoIdentity = {
  username: string;
  displayName: string;
  role: "admin" | "user";
};

export type DemoUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: string;
  passwordSalt?: string;
  passwordHash?: string;
};

export type DemoReport = {
  id: string;
  title: string;
  details: string;
  submittedBy: string;
  createdAt: string;
};

const IDENTITY_KEY = "mugbean-demo-identity";
const USERS_KEY = "mugbean-demo-users";
const REPORTS_KEY = "mugbean-demo-reports";
const DEMO_CHANGE_EVENT = "mugbean-demo-storage-change";
const PASSWORD_HASH_ITERATIONS = 120_000;

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function derivePasswordHash(password: string, salt: ArrayBuffer) {
  const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PASSWORD_HASH_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

export async function createDemoPasswordVerifier(password: string) {
  const salt = new ArrayBuffer(16);
  window.crypto.getRandomValues(new Uint8Array(salt));
  return { passwordSalt: toHex(salt), passwordHash: await derivePasswordHash(password, salt) };
}

export async function verifyDemoPassword(user: DemoUser, password: string) {
  if (!user.passwordSalt || !user.passwordHash) return false;
  if (!/^[a-f0-9]{32}$/i.test(user.passwordSalt)) return false;
  const salt = new ArrayBuffer(16);
  const saltBytes = new Uint8Array(salt);
  for (let index = 0; index < saltBytes.length; index += 1) {
    saltBytes[index] = Number.parseInt(user.passwordSalt.slice(index * 2, index * 2 + 2), 16);
  }
  return (await derivePasswordHash(password, salt)) === user.passwordHash;
}

export function subscribeToDemoChanges(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DEMO_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(DEMO_CHANGE_EVENT, onChange);
}

function notifyDemoChange() {
  window.dispatchEvent(new Event(DEMO_CHANGE_EVENT));
}

export function getDemoIdentitySnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(IDENTITY_KEY);
}

export function getDemoUsersSnapshot() {
  return typeof window === "undefined" ? "[]" : window.localStorage.getItem(USERS_KEY) ?? "[]";
}

export function getDemoReportsSnapshot() {
  return typeof window === "undefined" ? "[]" : window.localStorage.getItem(REPORTS_KEY) ?? "[]";
}

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(key);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export function getDemoIdentity(): DemoIdentity | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(IDENTITY_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<DemoIdentity>;
    if (typeof parsed.username !== "string" || typeof parsed.displayName !== "string") return null;
    if (parsed.role !== "admin" && parsed.role !== "user") return null;
    return { username: parsed.username, displayName: parsed.displayName, role: parsed.role };
  } catch {
    return null;
  }
}

export function setDemoIdentity(identity: DemoIdentity) {
  window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  notifyDemoChange();
}

export function clearDemoIdentity() {
  window.localStorage.removeItem(IDENTITY_KEY);
  notifyDemoChange();
}

export function getDemoUsers() {
  return readList<DemoUser>(USERS_KEY);
}

export function saveDemoUsers(users: DemoUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyDemoChange();
}

export function getDemoReports() {
  return readList<DemoReport>(REPORTS_KEY);
}

export function saveDemoReports(reports: DemoReport[]) {
  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  notifyDemoChange();
}
