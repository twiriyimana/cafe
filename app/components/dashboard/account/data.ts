export type Status = "active" | "inactive";

export type Station = { id: string; name: string; printer: string; category: string; description: string; status: Status };
export type Floor = { id: string; name: string; tables: number; description: string; status: Status };
export type PaymentMethod = { id: string; name: string; type: string; description: string; featured: boolean };
export type StaffMember = { id: string; name: string; email: string; phone: string; role: string; permissions: string[]; status: Status };
export type Profile = { fullName: string; email: string; phone: string; gender: string; dob: string; language: string };
export type BusinessDetails = { name: string; category: string; email: string; phone: string; tin: string; address: string; currency: string; timezone: string; receiptNotes: string };
export type Ecommerce = { enabled: boolean; shopName: string; slug: string; design: string; footer: string };
export type Business = { id: string; name: string; category: string; role: string };

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const stationsSeed: Station[] = [
  { id: "st-1", name: "KITCHEN", printer: "Kitchen printer", category: "Food", description: "Food preparation", status: "active" },
  { id: "st-2", name: "BAR", printer: "Bar printer", category: "Beverages", description: "Drinks preparation", status: "active" },
  { id: "st-3", name: "CASHIER", printer: "Receipt printer", category: "All orders", description: "Sales and receipts", status: "active" },
];
export const stationCategories = ["Food", "Beverages", "All orders"];

export const floorsSeed: Floor[] = [
  { id: "fl-1", name: "INDOOR", tables: 10, description: "", status: "active" },
  { id: "fl-2", name: "OUTDOOR", tables: 10, description: "", status: "active" },
];

export const paymentTypes = ["BANK_TRANSFER", "CARD", "CASH", "CHEQUE", "CUSTOMER_CREDIT", "MOBILE_MONEY"];
export const paymentsSeed: PaymentMethod[] = [
  { id: "pm-1", name: "Bank Transfer", type: "BANK_TRANSFER", description: "", featured: true },
  { id: "pm-2", name: "Card", type: "CARD", description: "", featured: true },
  { id: "pm-3", name: "Cash", type: "CASH", description: "", featured: true },
  { id: "pm-4", name: "Cheque", type: "CHEQUE", description: "", featured: true },
  { id: "pm-5", name: "Customer Credit", type: "CUSTOMER_CREDIT", description: "", featured: true },
  { id: "pm-6", name: "Mobile Money", type: "MOBILE_MONEY", description: "", featured: true },
];

export const staffRoles = ["WAITER", "ADMIN", "CASHIER"];
export const staffSeed: StaffMember[] = [
  { id: "sf-1", name: "Waiter 1", email: "waiter1@boardscafe.example", phone: "", role: "WAITER", permissions: [], status: "active" },
  { id: "sf-2", name: "Admin 1", email: "admin1@boardscafe.example", phone: "", role: "ADMIN", permissions: [], status: "active" },
  { id: "sf-3", name: "Waiter 2", email: "waiter2@boardscafe.example", phone: "", role: "WAITER", permissions: [], status: "active" },
  { id: "sf-4", name: "Waiter 3", email: "waiter3@boardscafe.example", phone: "", role: "WAITER", permissions: [], status: "active" },
  { id: "sf-5", name: "Waiter 4", email: "waiter4@boardscafe.example", phone: "", role: "WAITER", permissions: [], status: "active" },
  { id: "sf-6", name: "Cashier 1", email: "cashier1@boardscafe.example", phone: "", role: "CASHIER", permissions: [], status: "active" },
  { id: "sf-7", name: "Waiter 5", email: "waiter5@boardscafe.example", phone: "", role: "WAITER", permissions: [], status: "active" },
  { id: "sf-8", name: "Waiter 6", email: "waiter6@boardscafe.example", phone: "", role: "WAITER", permissions: [], status: "active" },
  { id: "sf-9", name: "Waiter 7", email: "waiter7@boardscafe.example", phone: "", role: "WAITER", permissions: [], status: "active" },
];

/** Screens a staff member can be given access to (main nav -> sub nav). */
export const permissionTree: Record<string, string[]> = {
  Home: [],
  Transactions: ["Sales", "Orders", "Purchases", "Expenses", "Production", "Shifts"],
  Inventory: ["Categories", "Products", "Services", "Raw Materials", "Assets", "Add-ons", "Stock Count", "Stock Transfer"],
  Contacts: ["Customers", "Vendors"],
  Reports: ["Chart of Accounts", "Sale Tax", "EBM X"],
  Account: ["Stations", "Floors", "Payment Methods", "Staff Accounts"],
};

export const profileSeed: Profile = { fullName: "Cyubahiro David", email: "cyubahirodavidwerabe@gmail.com", phone: "0789323212", gender: "", dob: "", language: "English" };
export const languages = ["English", "Français", "Kinyarwanda"];

export const businessSeed: BusinessDetails = {
  name: "BOARDS CAFE Ltd", category: "HOSPITALITY", email: "", phone: "", tin: "", address: "",
  currency: "RWF", timezone: "Africa/Kigali", receiptNotes: "",
};
export const businessCategories = ["HOSPITALITY", "RETAIL", "SERVICES", "MANUFACTURING", "OTHER"];
export const currencies: [string, string][] = [["RWF", "Rwandan Franc [RWF]"], ["USD", "US Dollar [USD]"], ["EUR", "Euro [EUR]"], ["UGX", "Ugandan Shilling [UGX]"], ["KES", "Kenyan Shilling [KES]"]];
export const timezones = ["Africa/Kigali", "Africa/Nairobi", "Africa/Kampala", "Africa/Johannesburg", "Europe/London", "UTC"];

export const ecommerceSeed: Ecommerce = { enabled: false, shopName: "BOARDS CAFE Ltd", slug: "boards-cafe-ltd", design: "default", footer: "" };

export const businessesSeed: Business[] = [
  { id: "bz-1", name: "BOARDS CAFE Ltd", category: "HOSPITALITY", role: "Administrator" },
  { id: "bz-2", name: "BOARDS CAFE — Kiosk", category: "HOSPITALITY", role: "Administrator" },
];
export const activeBusinessSeed = "bz-1";
