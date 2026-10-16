export type AccountType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";

export type Account = {
  id: number;
  name: string;
  code: string;
  type: AccountType;
  parent: string;
  description: string;
  balance: number;
};

export const ACCOUNT_TYPES: AccountType[] = ["Asset", "Liability", "Equity", "Income", "Expense"];
export const ACCOUNTS_KEY = "mugbean-demo-accounts";

/** Default chart of accounts, used until the user changes the list. */
export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 1, name: "Cash", code: "1000", type: "Asset", parent: "", description: "Cash on hand and in the till", balance: 0 },
  { id: 2, name: "Accounts Receivable", code: "1100", type: "Asset", parent: "", description: "Money owed by customers", balance: 0 },
  { id: 3, name: "Accounts Payable", code: "2000", type: "Liability", parent: "", description: "Money owed to vendors", balance: 0 },
  { id: 4, name: "Sales Revenue", code: "4000", type: "Income", parent: "", description: "Income from product and service sales", balance: 0 },
];

export type TaxRecord = {
  id: number;
  date: string;
  invoice: string;
  customer: string;
  tin: string;
  taxable: number;
  rate: number;
  tax: number;
  total: number;
};

export const SALES_KEY = "mugbean-demo-sales";
/** Standard VAT rate in Rwanda (category B). Sale prices are treated as VAT-inclusive. */
export const VAT_RATE = 18;

export type SaleLike = {
  id: number;
  date: string;
  customer: string;
  items: { product: string; quantity: number; price: number }[];
};

export function saleTotal(sale: SaleLike) {
  return sale.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

/** Split a VAT-inclusive total into taxable amount and tax. */
export function splitVat(total: number) {
  const tax = Math.round((total * VAT_RATE) / (100 + VAT_RATE));
  return { taxable: total - tax, tax };
}

/** Turn recorded sales into Sale Tax report rows. `tinByCustomer` maps lower-case customer name to TIN. */
export function buildTaxRecords(sales: SaleLike[], tinByCustomer: Record<string, string> = {}): TaxRecord[] {
  return [...sales]
    .sort((a, b) => a.id - b.id)
    .map((sale, index) => {
      const total = saleTotal(sale);
      const { taxable, tax } = splitVat(total);
      return {
        id: sale.id,
        date: sale.date,
        invoice: `INV-${String(index + 1).padStart(4, "0")}`,
        customer: sale.customer,
        tin: tinByCustomer[sale.customer.toLowerCase()] ?? "",
        taxable,
        rate: VAT_RATE,
        tax,
        total,
      };
    })
    .reverse();
}
