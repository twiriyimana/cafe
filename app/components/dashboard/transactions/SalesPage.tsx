
"use client";

import { useState, type FormEvent } from "react";
import { SALES_KEY } from "../../../../lib/reports-store";
import { useContactList } from "../../../../lib/contacts-store";
import Image from "next/image";
import Link from "next/link";
import ProfileBadge from "../ProfileBadge";

import brandImage from "../../../images/ima.png";
import beansImage from "../../../images/image.png";

// ============================================================
// TYPES
// ============================================================

type Role = "admin" | "user";

type Sale = {
  id: number;
  date: string;
  customer: string;
  customerContact?: string;
  items: SaleItem[];
  paymentMethod: string;
  amountPaid: number;
};

type SaleItem = {
  product: string;
  quantity: number;
  price: number;
};

// ============================================================
// TRANSACTION NAVIGATION
// ============================================================

const transactionLinks = [
  { label: "Quotations", path: "" },
  { label: "Sales", path: "/sales" },
  { label: "Purchases", path: "/purchases" },
  { label: "Production", path: "/production" },
  { label: "Expenses", path: "/expenses" },
  { label: "Orders", path: "/orders" },
  { label: "Shifts", path: "/shifts" },
];

// ============================================================
// SALES PAGE
// ============================================================

export default function SalesPage({ role }: { role: Role }) {
  // ==========================================================
  // CONSTANTS
  // ==========================================================

  const base = `/dashboard/${role}/transactions`;

  // ==========================================================
  // STATE
  // ==========================================================

  const [sales, setSales] = useContactList<Sale>(SALES_KEY);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [showCustomerContact, setShowCustomerContact] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  // ==========================================================
  // FILTER SALES
  // ==========================================================

  const filteredSales = sales.filter((sale) =>
    JSON.stringify(sale).toLowerCase().includes(search.toLowerCase())
  );

  // ==========================================================
  // SAVE / UPDATE SALE
  // ==========================================================

  function saveSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 1) {
      if (items.length === 0) return;
      setAmountPaid((current) => current || String(total));
      setStep(2);
      return;
    }

    const form = new FormData(event.currentTarget);

    const id = editingSale?.id ?? event.timeStamp;

    const sale: Sale = {
      id,
      date: String(form.get("date")),
      customer: customer.trim() || "Walk-in customer",
      customerContact: customerContact.trim(),
      items,
      paymentMethod,
      amountPaid: Number(amountPaid || 0),
    };

    if (editingSale) {
      setSales((current) =>
        current.map((item) =>
          item.id === editingSale.id ? sale : item
        )
      );
    } else {
      setSales((current) => [sale, ...current]);
    }

    closeForm();
  }

  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  function closeForm() {
    setEditingSale(null);
    setIsFormOpen(false);
    setStep(1);
    setItems([]);
    setCustomer("");
    setCustomerContact("");
    setShowCustomerContact(false);
    setPaymentMethod("Cash");
    setAmountPaid("");
  }

  // ==========================================================
  // OPEN CREATE FORM
  // ==========================================================

  function openCreateForm() {
    setEditingSale(null);
    setStep(1);
    setItems([]);
    setCustomer("");
    setCustomerContact("");
    setShowCustomerContact(false);
    setPaymentMethod("Cash");
    setAmountPaid("");
    setIsFormOpen(true);
  }

  // ==========================================================
  // OPEN EDIT FORM
  // ==========================================================

  function openEditForm(sale: Sale) {
    setEditingSale(sale);
    setStep(1);
    setItems(sale.items);
    setCustomer(sale.customer === "Walk-in customer" ? "" : sale.customer);
    setCustomerContact(sale.customerContact ?? "");
    setShowCustomerContact(Boolean(sale.customerContact));
    setPaymentMethod(sale.paymentMethod);
    setAmountPaid(String(sale.amountPaid));
    setIsFormOpen(true);
  }

  function addItem(form: HTMLFormElement) {
    const data = new FormData(form);
    const product = String(data.get("product") ?? "").trim();
    const quantityValue = String(data.get("quantity") ?? "");
    const priceValue = String(data.get("price") ?? "");
    const quantity = Number(quantityValue);
    const price = Number(priceValue);

    if (!product || !quantityValue || !priceValue || quantity <= 0 || price < 0 || !Number.isFinite(price)) {
      return;
    }

    setItems((current) => [...current, { product, quantity, price }]);
    for (const name of ["product", "quantity", "price"]) {
      const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
      if (input) input.value = "";
    }
  }

  // ==========================================================
  // DELETE SALE
  // ==========================================================

  function deleteSale(id: number) {
    setSales((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="grid min-h-svh w-full bg-[#f7f0e7] text-[#392d26] md:grid-cols-[172px_156px_minmax(0,1fr)]">

      {/* ======================================================
          MAIN SIDEBAR
      ====================================================== */}

      <aside className="flex flex-col bg-[#2b180f] px-3.5 py-4 text-[#e9ddd1] md:sticky md:top-0 md:h-svh">

        {/* Brand */}
        <Link
          href="/"
          className="mb-5 flex items-center gap-2 px-1 text-white no-underline"
        >
          <Image
            src={brandImage}
            alt="Boards Café"
            width={32}
            height={32}
            className="rounded-full"
          />

          <strong className="text-base tracking-tight">
            BOARDS
          </strong>
        </Link>

        {/* Main Navigation */}
        <nav
          aria-label="Main navigation"
          className="grid content-start gap-1"
        >
          {[
            {
              label: "Home",
              href: `/dashboard/${role}`,
            },
            {
              label: "Transactions",
              href: base,
            },
            {
              label: "Inventory",
              href: base,
            },
            {
              label: "Contacts",
              href: `/dashboard/${role}/contacts`,
            },
            {
              label: "Reports",
              href: `/dashboard/${role}/reports`,
            },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              aria-current={
                label === "Transactions"
                  ? "page"
                  : undefined
              }
              className={`flex min-h-9 items-center gap-2.5 rounded-md px-2.5 text-xs no-underline transition ${
                label === "Transactions"
                  ? "bg-[#805336] text-white"
                  : "text-[#cbbcaf] hover:bg-[#805336] hover:text-white"
              }`}
            >
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Role */}
        <ProfileBadge role={role} />
      </aside>

      {/* ======================================================
          TRANSACTION SIDEBAR
      ====================================================== */}

      <aside className="flex flex-col border-b border-[#e9dfd3] bg-[#f1e7d7] px-3 py-3 md:sticky md:top-0 md:h-svh md:border-b-0 md:border-r md:px-3.5 md:py-4">

        {/* Transaction Title */}
        <Link
          href={`/dashboard/${role}`}
          className="mb-3 flex items-center gap-2 px-1.5 text-[13px] font-semibold text-[#432f22] no-underline"
        >
         

          Transactions
        </Link>

        {/* Transaction Navigation */}
        <nav
          aria-label="Transaction navigation"
          className="grid content-start gap-1"
        >
          {transactionLinks.map(({ label, path }) => (
            <Link
              key={label}
              href={`${base}${path}`}
              aria-current={
                label === "Sales" ? "page" : undefined
              }
              className={`flex min-h-8 items-center rounded-md px-2 text-[10px] no-underline transition ${
                label === "Sales"
                  ? "bg-[#eadcc8] font-medium text-[#4d3828]"
                  : "text-[#78695c] hover:bg-[#eadcc8] hover:text-[#4d3828]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main
        className="relative flex min-h-svh min-w-0 flex-col bg-cover bg-center"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(249, 244, 236, 0.78),
              rgba(249, 244, 236, 0.78)
            ),
            url("${beansImage.src}")
          `,
        }}
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="relative z-10 flex h-11.25 shrink-0 flex-wrap items-center gap-2 border-b border-[#e8ded2] bg-[#fbf6ed]/95 px-3 sm:flex-nowrap sm:px-4">

          {/* Breadcrumb */}
          <div className="flex min-w-fit items-center gap-2 text-[10px] text-[#918477]">
            <Link
              href={`/dashboard/${role}`}
              className="hover:text-[#5c3d28]"
            >
              Home
            </Link>

            <span className="text-[#c1b4a5]">
              ›
            </span>

            <span className="text-[#5a493d]">
              Sales
            </span>
          </div>

          {/* Search */}
          <label className="flex h-7 min-w-40 flex-1 items-center gap-2 rounded-md border border-[#e6dbcd] bg-white/90 px-2.5">
            <span
              aria-hidden="true"
              className="text-[#8e8074]"
            >
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search..................."
              aria-label="Search sales"
              className="min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-[#a09286]"
            />
          </label>

          {/* Create Sale */}
          <button
            type="button"
            onClick={openCreateForm}
            className="ml-auto flex h-7 items-center gap-1 rounded-md bg-[#28180f] px-2.5 text-[10px] font-medium text-white hover:bg-[#4a2d1b]"
          >
            ＋ Create New
          </button>
        </header>

        {/* ====================================================
            SALES TABLE SECTION
        ==================================================== */}

        <section className="relative z-10 flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e5dacd] bg-[#fcf9f4]/95 shadow-[0_2px_10px_rgba(72,48,30,0.04)]">

            {/* Table Container */}
            <div className="min-h-0 flex-1 overflow-auto">

              <table className="w-full min-w-225 border-collapse text-left">

                {/* Table Header */}
                <thead className="sticky top-0 bg-[#f0e5d4] text-[9px] font-medium text-[#4b3b2f]">
                  <tr className="h-8 border-b border-[#e2d6c6]">

                    <th className="w-8 px-2.5">
                      <input
                        type="checkbox"
                        aria-label="Select all sales"
                        className="h-3 w-3 accent-[#805336]"
                      />
                    </th>

                    {[
                      "Date",
                      "Customer",
                      "Product",
                      "Quantity",
                      "Price per unit",
                      "Total",
                      "Payment",
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="whitespace-nowrap px-2.5"
                      >
                        {heading}
                      </th>
                    ))}

                    <th
                      scope="col"
                      className="px-2.5 text-right"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="text-[10px] text-[#55463a]">

                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="h-9 border-b border-[#eee6dc]"
                    >
                      <td className="w-8 px-2.5">
                        <input
                          type="checkbox"
                          aria-label={`Select sale for ${sale.customer}`}
                          className="h-3 w-3 accent-[#805336]"
                        />
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-2.5">
                        {sale.date}
                      </td>

                      {/* Customer */}
                      <td className="px-2.5">
                        {sale.customer}
                      </td>

                      {/* Products and line-item values */}
                      <td className="px-2.5">
                        {sale.items.map((item) => item.product).join(", ")}
                      </td>
                      <td className="px-2.5">
                        {sale.items.map((item) => item.quantity).join(", ")}
                      </td>
                      <td className="whitespace-nowrap px-2.5">
                        {sale.items.map((item) => `Rwf ${item.price.toLocaleString()}`).join(", ")}
                      </td>
                      <td className="whitespace-nowrap px-2.5 font-medium">
                        Rwf {sale.items.reduce((sum, item) => sum + item.quantity * item.price, 0).toLocaleString()}
                      </td>
                      <td className="px-2.5">
                        {sale.paymentMethod}
                      </td>

                      {/* Actions */}
                      <td className="px-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(sale)}
                            className="rounded-md px-2 py-1 text-[#805336] hover:bg-[#f0e5d4]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSale(sale.id)}
                            className="rounded-md px-2 py-1 text-[#9b5549] hover:bg-[#f7e7e3]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>

            {/* ==================================================
                EMPTY STATE
            ================================================== */}

            {filteredSales.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-14 text-center">

                <p className="m-0 text-[11px] font-medium text-[#897b6f]">
                  {sales.length
                    ? "No matching sales"
                    : "No sales yet"}
                </p>

                <p className="mb-0 mt-1 text-[9px] text-[#a09387]">
                  {sales.length
                    ? "Try another search term."
                    : "Create a sale to see it in this table."}
                </p>

              </div>
            )}

            {/* ==================================================
                TABLE FOOTER
            ================================================== */}

            <div className="flex min-h-9 items-center justify-between border-t border-[#ebe2d7] px-2.5 text-[9px] text-[#817367] sm:px-3">

              <span>
                Showing {filteredSales.length}{" "}
                {filteredSales.length === 1
                  ? "sale"
                  : "sales"}
              </span>

              <span>
                Sales
              </span>
            </div>
          </div>
        </section>

        {/* ====================================================
            CREATE / EDIT SALE MODAL
        ==================================================== */}

        {isFormOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#21130f]/45 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeForm();
              }
            }}
          >

            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="sales-form-title"
              className="max-h-[90svh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#e5dacd] bg-[#fcf9f4] p-5 shadow-2xl sm:p-6"
            >

              {/* Modal Header */}
              <div className="mb-5 flex items-start justify-between gap-4">

                <div>
                  <h2
                    id="sales-form-title"
                    className="m-0 text-lg font-semibold"
                  >
                    {editingSale
                      ? "Update Sale"
                      : "Create Sale"}
                  </h2>

                  <p className="mb-0 mt-1 text-xs text-[#8e8074]">
                    Step {step} of 2: {step === 1 ? "Configure sale details" : "Confirm payment and sale"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close form"
                  className="rounded-md px-2 py-1 text-lg leading-none text-[#817367] hover:bg-[#f0e5d4]"
                >
                  ×
                </button>
              </div>

              {/* ==================================================
                  SALES FORM
              ================================================== */}

              <form
                key={editingSale?.id ?? "new-sale"}
                onSubmit={saveSale}
                className="grid gap-3"
              >
                <div aria-label="Sale steps" className="mx-auto flex items-center gap-3 py-1 text-[10px]">
                  <span className={`flex items-center gap-1.5 ${step === 1 ? "font-semibold text-[#4b3020]" : "text-[#998b7f]"}`}>
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-[#4b3020] text-[8px] text-white">1</span>
                    Sale Details
                  </span>
                  <span className="h-px w-10 bg-[#d7c9b8]" />
                  <span className={`flex items-center gap-1.5 ${step === 2 ? "font-semibold text-[#4b3020]" : "text-[#998b7f]"}`}>
                    <span className={`grid h-4 w-4 place-items-center rounded-full border text-[8px] ${step === 2 ? "border-[#4b3020] bg-[#4b3020] text-white" : "border-[#cbbdad]"}`}>2</span>
                    Payment &amp; Review
                  </span>
                </div>

                <label className="grid gap-1.5 text-[10px] font-medium text-[#55463a]">
                  Sale Date
                  <input
                    required
                    name="date"
                    type="date"
                    defaultValue={editingSale?.date ?? new Date().toISOString().slice(0, 10)}
                    readOnly={step === 2}
                    className="h-8 rounded-md border border-[#e2d6c6] bg-white px-2.5 text-[11px] outline-none focus:border-[#805336]"
                  />
                </label>

                {step === 1 ? (
                  <>
                    <label className="grid gap-1.5 text-[10px] font-medium text-[#55463a]">
                      Customer (Optional)
                      <span className="flex gap-1.5">
                        <input
                          name="customer"
                          value={customer}
                          onChange={(event) => setCustomer(event.target.value)}
                          placeholder="Search by name, phone, email, or TIN..."
                          className="h-8 min-w-0 flex-1 rounded-md border border-[#e2d6c6] bg-white px-2.5 text-[11px] outline-none focus:border-[#805336]"
                        />
                        <button
                          type="button"
                          aria-label={showCustomerContact ? "Hide customer contact" : "Add customer contact"}
                          onClick={() => setShowCustomerContact((visible) => !visible)}
                          className="h-8 w-8 shrink-0 rounded-md border border-[#e2d6c6] bg-white text-sm text-[#60442f] hover:bg-[#f4ecdf]"
                        >
                          {showCustomerContact ? "−" : "+"}
                        </button>
                      </span>
                    </label>
                    {showCustomerContact && (
                      <label className="grid gap-1.5 text-[10px] font-medium text-[#55463a]">
                        Customer phone or email (Optional)
                        <input
                          value={customerContact}
                          onChange={(event) => setCustomerContact(event.target.value)}
                          placeholder="Phone number or email address"
                          className="h-8 rounded-md border border-[#e2d6c6] bg-white px-2.5 text-[11px] outline-none focus:border-[#805336]"
                        />
                      </label>
                    )}

                    <fieldset className="grid gap-2 rounded-md border border-[#e6dbcd] bg-[#f8f3ec] p-2">
                      <legend className="px-1 text-[9px] font-medium text-[#55463a]">Type to search products</legend>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-[minmax(0,1fr)_70px_86px_auto]">
                        <input name="product" placeholder="Type to search products..." className="col-span-2 h-8 min-w-0 rounded-md border border-[#e2d6c6] bg-white px-2 text-[10px] outline-none focus:border-[#805336] sm:col-span-1" />
                        <input name="quantity" type="number" min="1" step="1" placeholder="Qty" className="h-8 min-w-0 rounded-md border border-[#e2d6c6] bg-white px-2 text-[10px] outline-none focus:border-[#805336]" />
                        <input name="price" type="number" min="0" step="1" placeholder="Price per unit" className="h-8 min-w-0 rounded-md border border-[#e2d6c6] bg-white px-2 text-[10px] outline-none focus:border-[#805336]" />
                        <button type="button" onClick={(event) => addItem(event.currentTarget.form!)} className="h-8 rounded-md bg-[#bca287] px-3 text-[10px] font-medium text-white hover:bg-[#a98b6e]">
                          + Add Item
                        </button>
                      </div>
                      {items.length > 0 && (
                        <ul className="m-0 grid list-none gap-1 p-0">
                          {items.map((item, index) => (
                            <li key={`${item.product}-${index}`} className="flex items-center justify-between gap-3 rounded border border-[#e8ded2] bg-white px-2 py-1.5 text-[10px] text-[#55463a]">
                              <span className="min-w-0 truncate">{item.product} <span className="text-[#928477]">× {item.quantity}</span></span>
                              <span className="flex shrink-0 items-center gap-2">
                                Rwf {(item.quantity * item.price).toLocaleString()}
                                <button type="button" aria-label={`Remove ${item.product}`} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-[#9b5549] hover:text-[#713a32]">×</button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex justify-between border-t border-[#e6dbcd] pt-1.5 text-[10px] font-semibold text-[#4b3020]">
                        <span>Sale total</span><span>Rwf {total.toLocaleString()}</span>
                      </div>
                    </fieldset>
                  </>
                ) : (
                  <div className="grid gap-3 rounded-md border border-[#e6dbcd] bg-[#f8f3ec] p-3">
                    <div className="grid gap-2 text-[11px] text-[#55463a]">
                      <div className="flex justify-between gap-3"><span>Customer</span><strong>{customer.trim() || "Walk-in customer"}</strong></div>
                      {customerContact && <div className="flex justify-between gap-3"><span>Phone / email</span><span>{customerContact}</span></div>}
                      <div className="border-t border-[#e6dbcd] pt-2 font-medium">Sale items</div>
                      {items.map((item, index) => (
                        <div key={`${item.product}-${index}`} className="flex justify-between gap-3">
                          <span>{item.product} × {item.quantity} @ Rwf {item.price.toLocaleString()}</span>
                          <span>Rwf {(item.quantity * item.price).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-[#e6dbcd] pt-2 font-semibold text-[#4b3020]"><span>Total</span><span>Rwf {total.toLocaleString()}</span></div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="grid gap-1.5 text-[10px] font-medium text-[#55463a]">
                        Payment method
                        <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="h-8 rounded-md border border-[#e2d6c6] bg-white px-2.5 text-[11px] outline-none focus:border-[#805336]">
                          <option>Cash</option><option>Mobile Money</option><option>Card</option><option>Bank Transfer</option>
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-[10px] font-medium text-[#55463a]">
                        Amount paid (Rwf)
                        <input type="number" min="0" step="1" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} className="h-8 rounded-md border border-[#e2d6c6] bg-white px-2.5 text-[11px] outline-none focus:border-[#805336]" />
                      </label>
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold text-[#4b3020]"><span>Balance due</span><span>Rwf {Math.max(0, total - Number(amountPaid || 0)).toLocaleString()}</span></div>
                  </div>
                )}

                <div className="mt-1 flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={step === 2 ? () => setStep(1) : closeForm}
                    className="h-8 rounded-md border border-[#e2d6c6] px-3 text-[10px] text-[#69594d] hover:bg-[#f4ecdf]"
                  >
                    {step === 2 ? "Back" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={step === 1 && items.length === 0}
                    className="h-8 rounded-md bg-[#28180f] px-4 text-[10px] font-medium text-white hover:bg-[#4a2d1b] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {step === 1 ? "Continue to Payment & Review" : editingSale ? "Save Sale" : "Complete Sale"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="relative z-10 flex min-h-7 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[#e8ded2] bg-[#fbf6ed]/95 px-3 text-[8px] text-[#9b8d81] sm:px-4">

          <span>
            © Boards Cafe Management System 2026
          </span>

          <nav
            aria-label="Footer links"
            className="flex items-center gap-3"
          >
            <a href="#">
              Support
            </a>

            <a href="#">
              Terms
            </a>

            <a href="#">
              Privacy policy
            </a>
          </nav>
        </footer>
      </main>
    </div>
  );
}
