/** Shared client for the Boards Cafe REST API. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://boards-cafe-api.onrender.com/api/v1").replace(/\/$/, "");
const TOKEN_KEY = "boards-cafe-access-token";
const REFRESH_TOKEN_KEY = "boards-cafe-refresh-token";
export const AUTH_REQUIRED_EVENT = "boards-cafe-auth-required";

export type ApiRecord = Record<string, unknown>;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  clearAccessToken();
  window.sessionStorage.removeItem("mugbean-demo-identity");
  window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
}

function findToken(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  for (const key of ["access", "access_token", "accessToken", "token", "key"]) {
    if (typeof obj[key] === "string" && obj[key]) return obj[key] as string;
  }
  for (const key of ["data", "tokens", "auth", "result"]) {
    const nested = findToken(obj[key]);
    if (nested) return nested;
  }
  return null;
}

function findMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  for (const key of ["detail", "message", "error", "non_field_errors"]) {
    const item = obj[key];
    if (typeof item === "string" && item.trim()) return item;
    if (Array.isArray(item) && item.length) return String(item[0]);
  }
  for (const key of ["data", "errors"]) {
    const nested = findMessage(obj[key]);
    if (nested) return nested;
  }
  return null;
}

export async function apiRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/${path.replace(/^\/+/, "")}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new Error("Cannot reach the Boards Cafe API. Check your internet connection and API server status.");
  }
  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try { payload = JSON.parse(raw); } catch { payload = raw; }
  }
  if (!response.ok) {
    if (response.status === 401 && path.replace(/^\/+/, "") !== "auth/login/") {
      clearAuthSession();
    }
    const message = findMessage(payload);
    throw new Error(message || `API request failed (${response.status} ${response.statusText}).`);
  }
  return payload as T;
}

export type LoginResult = { token: string; user: ApiRecord };

export async function loginWithApi(identifier: string, password: string): Promise<LoginResult> {
  // The OpenAPI schema defines exactly { email, password } and returns { access, refresh }.
  const payload = await apiRequest<unknown>("auth/login/", {
    method: "POST",
    body: JSON.stringify({ email: identifier, password }),
  });
  const token = findToken(payload);
  if (!token) throw new Error("Login response did not include an access token. Check the API login response.");
  setAccessToken(token);

  // Login intentionally returns tokens only; retrieve the signed-in staff profile separately.
  try {
    const profilePayload = await apiRequest<unknown>("auth/me/");
    const unwrappedProfile = unwrapApiData(profilePayload);
    const profile = unwrappedProfile && typeof unwrappedProfile === "object" ? unwrappedProfile as ApiRecord : {};
    const root = payload && typeof payload === "object" ? payload as ApiRecord : {};
    const unwrappedRoot = unwrapApiData(root);
    const tokenPayload = unwrappedRoot && typeof unwrappedRoot === "object" ? unwrappedRoot as ApiRecord : root;
    const refresh = typeof tokenPayload.refresh === "string" ? tokenPayload.refresh : undefined;
    if (refresh && typeof window !== "undefined") window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    return { token, user: profile };
  } catch (error) {
    clearAccessToken();
    throw error;
  }
}

export function getUserRole(user: ApiRecord, identifier: string): "admin" | "user" {
  const roleValue = user.role && typeof user.role === "object" ? (user.role as ApiRecord).name ?? (user.role as ApiRecord).code : user.role;
  const role = String(roleValue ?? user.user_type ?? user.account_type ?? "").toLowerCase();
  if (["admin", "administrator", "owner", "superuser", "manager"].includes(role) || user.is_staff === true || user.is_superuser === true) return "admin";
  // Some APIs return only a token. In that case retain the application's existing admin-email convention.
  return /^(admin|administrator)(@|$)/i.test(identifier.trim()) ? "admin" : "user";
}

export function getUserDisplayName(user: ApiRecord, identifier: string): string {
  for (const key of ["full_name", "name", "display_name", "username", "email"]) {
    if (typeof user[key] === "string" && user[key]) return user[key] as string;
  }
  const first = typeof user.first_name === "string" ? user.first_name : "";
  const last = typeof user.last_name === "string" ? user.last_name : "";
  if (`${first} ${last}`.trim()) return `${first} ${last}`.trim();
  return identifier.includes("@") ? identifier.split("@")[0] : identifier;
}

/** Read API payloads that may be wrapped in { data: ... } or Django REST pagination. */
export function unwrapApiData(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const obj = value as ApiRecord;
  return Object.prototype.hasOwnProperty.call(obj, "data") ? obj.data : value;
}

export function listApiRecords(value: unknown): ApiRecord[] {
  const unwrapped = unwrapApiData(value);
  if (Array.isArray(unwrapped)) return unwrapped.filter((item): item is ApiRecord => !!item && typeof item === "object");
  if (unwrapped && typeof unwrapped === "object") {
    const obj = unwrapped as ApiRecord;
    for (const key of ["results", "items", "records"]) {
      if (Array.isArray(obj[key])) return (obj[key] as unknown[]).filter((item): item is ApiRecord => !!item && typeof item === "object");
    }
  }
  return [];
}

/** Endpoint catalogue derived from Board's Cafe API OpenAPI schema. */
export const boardsApi = {
  health: () => apiRequest("health/"),
  profile: () => apiRequest<ApiRecord>("auth/me/"),
  dashboard: () => apiRequest<ApiRecord>("dashboard/"),
  roles: () => apiRequest("roles/"),
  staff: () => apiRequest("auth/"),
  createStaff: (body: ApiRecord) => apiRequest("auth/", { method: "POST", body: JSON.stringify(body) }),
  updateStaff: (id: string | number, body: ApiRecord) => apiRequest(`auth/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteStaff: (id: string | number) => apiRequest(`auth/${id}/`, { method: "DELETE" }),
  business: () => apiRequest("business/"),
  updateBusiness: (id: string | number, body: ApiRecord) => apiRequest(`business/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  floors: (businessId: number | string) => apiRequest(`business/${businessId}/floors/`),
  createFloor: (businessId: number | string, body: ApiRecord) => apiRequest(`business/${businessId}/floors/`, { method: "POST", body: JSON.stringify({ ...body, business: Number(businessId) }) }),
  updateFloor: (businessId: number | string, id: number | string, body: ApiRecord) => apiRequest(`business/${businessId}/floors/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteFloor: (businessId: number | string, id: number | string) => apiRequest(`business/${businessId}/floors/${id}/`, { method: "DELETE" }),
  paymentMethods: () => apiRequest("business/payment-methods/"),
  createPaymentMethod: (body: ApiRecord) => apiRequest("business/payment-methods/", { method: "POST", body: JSON.stringify(body) }),
  updatePaymentMethod: (id: number | string, body: ApiRecord) => apiRequest(`business/payment-methods/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePaymentMethod: (id: number | string) => apiRequest(`business/payment-methods/${id}/`, { method: "DELETE" }),
  orders: (query = "") => apiRequest(`sales/orders/${query}`),
  order: (id: number | string) => apiRequest(`sales/orders/${id}/`),
  createOrder: (body: ApiRecord) => apiRequest("sales/orders/", { method: "POST", body: JSON.stringify(body) }),
  updateOrder: (id: number | string, body: ApiRecord) => apiRequest(`sales/orders/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteOrder: (id: number | string) => apiRequest(`sales/orders/${id}/`, { method: "DELETE" }),
  expenseCategories: () => apiRequest("finance/expense-categories/"),
  expenses: (query = "") => apiRequest(`finance/expenses/${query}`),
  createExpense: (body: ApiRecord) => apiRequest("finance/expenses/", { method: "POST", body: JSON.stringify(body) }),
  updateExpense: (id: number | string, body: ApiRecord) => apiRequest(`finance/expenses/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteExpense: (id: number | string) => apiRequest(`finance/expenses/${id}/`, { method: "DELETE" }),
  purchases: (query = "") => apiRequest(`purchasing/purchases/${query}`),
  createPurchase: (body: ApiRecord) => apiRequest("purchasing/purchases/", { method: "POST", body: JSON.stringify(body) }),
  updatePurchase: (id: number | string, body: ApiRecord) => apiRequest(`purchasing/purchases/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePurchase: (id: number | string) => apiRequest(`purchasing/purchases/${id}/`, { method: "DELETE" }),
  suppliers: () => apiRequest("purchasing/suppliers/"),
  createSupplier: (body: ApiRecord) => apiRequest("purchasing/suppliers/", { method: "POST", body: JSON.stringify(body) }),
  updateSupplier: (id: number | string, body: ApiRecord) => apiRequest(`purchasing/suppliers/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteSupplier: (id: number | string) => apiRequest(`purchasing/suppliers/${id}/`, { method: "DELETE" }),
  inventoryItems: () => apiRequest("inventory/items/"),
  createInventoryItem: (body: ApiRecord) => apiRequest("inventory/items/", { method: "POST", body: JSON.stringify(body) }),
  updateInventoryItem: (id: number | string, body: ApiRecord) => apiRequest(`inventory/items/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  stockBalances: () => apiRequest("inventory/stock-balances/"),
  inventoryCategories: () => apiRequest("inventory/categories/"),
  createInventoryCategory: (body: ApiRecord) => apiRequest("inventory/categories/", { method: "POST", body: JSON.stringify(body) }),
  updateInventoryCategory: (id: number | string, body: ApiRecord) => apiRequest(`inventory/categories/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  inventoryUnits: () => apiRequest("inventory/units/"),
  createInventoryUnit: (body: ApiRecord) => apiRequest("inventory/units/", { method: "POST", body: JSON.stringify(body) }),
  updateInventoryUnit: (id: number | string, body: ApiRecord) => apiRequest(`inventory/units/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  menuProducts: () => apiRequest("menu/products/"),
  createMenuProduct: (body: ApiRecord) => apiRequest("menu/products/", { method: "POST", body: JSON.stringify(body) }),
  updateMenuProduct: (id: number | string, body: ApiRecord) => apiRequest(`menu/products/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteMenuProduct: (id: number | string) => apiRequest(`menu/products/${id}/`, { method: "DELETE" }),
  menuCategories: () => apiRequest("menu/categories/"),
  createMenuCategory: (body: ApiRecord) => apiRequest("menu/categories/", { method: "POST", body: JSON.stringify(body) }),
  updateMenuCategory: (id: number | string, body: ApiRecord) => apiRequest(`menu/categories/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteMenuCategory: (id: number | string) => apiRequest(`menu/categories/${id}/`, { method: "DELETE" }),
  reports: {
    sales: (query = "") => apiRequest(`reports/sales/${query}`),
    expenses: (query = "") => apiRequest(`reports/expenses/${query}`),
    purchases: (query = "") => apiRequest(`reports/purchases/${query}`),
    inventory: () => apiRequest("reports/inventory/"),
  },
};
