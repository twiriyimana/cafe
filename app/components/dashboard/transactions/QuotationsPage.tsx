
"use client";

import { useState, type FormEvent } from "react";

import {
  actionButtonClassName,
  deleteButtonClassName,
  fieldClassName,
  formatTransactionMoney,
  labelClassName,
  TransactionDialog,
  TransactionLayout,
  type TransactionRole,
} from "./TransactionLayout";

// ============================================================
// TYPES
// ============================================================

type Quotation = {
  id: number;
  date: string;
  customer: string;
  customerContact?: string;
  items: QuotationItem[];
};

type QuotationItem = {
  product: string;
  quantity: number;
  price: number;
};

// ============================================================
// COMPONENT
// ============================================================

export default function QuotationsPage({
  role,
}: {
  role: TransactionRole;
}) {
  // ============================================================
  // STATE
  // ============================================================

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [showCustomerContact, setShowCustomerContact] = useState(false);
  const [customer, setCustomer] = useState("");
  const [customerContact, setCustomerContact] = useState("");

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  // ============================================================
  // FILTERED QUOTATIONS
  // ============================================================

  const visible = quotations.filter((quote) =>
    JSON.stringify(quote)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  function closeForm() {
    setEditing(null);
    setIsFormOpen(false);
    setStep(1);
    setItems([]);
    setShowCustomerContact(false);
    setCustomer("");
    setCustomerContact("");
  }

  function openCreateForm() {
    setEditing(null);
    setItems([]);
    setStep(1);
    setShowCustomerContact(false);
    setCustomer("");
    setCustomerContact("");
    setIsFormOpen(true);
  }

  function openEditForm(quotation: Quotation) {
    setEditing(quotation);
    setItems(quotation.items);
    setStep(1);
    setShowCustomerContact(false);
    setCustomer(quotation.customer === "Walk-in customer" ? "" : quotation.customer);
    setCustomerContact(quotation.customerContact ?? "");
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
    form.querySelector<HTMLInputElement>('[name="product"]')!.value = "";
    form.querySelector<HTMLInputElement>('[name="quantity"]')!.value = "";
    form.querySelector<HTMLInputElement>('[name="price"]')!.value = "";
  }

  function deleteQuotation(quotationId: number) {
    setQuotations((current) =>
      current.filter(
        (quotation) => quotation.id !== quotationId
      )
    );
  }

  function saveQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 1) {
      if (items.length === 0) return;
      setStep(2);
      return;
    }

    const form = new FormData(event.currentTarget);
    const id = editing?.id ?? Date.now();

    const quotation: Quotation = {
      id,
      date: String(form.get("date")),
      customer: customer.trim() || "Walk-in customer",
      customerContact: customerContact.trim(),
      items,
    };

    setQuotations((current) =>
      editing
        ? current.map((item) =>
            item.id === id ? quotation : item
          )
        : [quotation, ...current]
    );

    closeForm();
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <TransactionLayout
      role={role}
      title="Quotations"
      search={search}
      onSearchChange={setSearch}
      createLabel=" Create New"
      onCreate={openCreateForm}
    >
      {/* ========================================================
          QUOTATIONS TABLE
      ======================================================== */}

      <section className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e5dacd] bg-[#fcf9f4]/95 shadow-[0_2px_10px_rgba(72,48,30,0.04)]">

          {/* Table */}
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-225 border-collapse text-left">
              <thead className="sticky top-0 bg-[#f0e5d4] text-[9px] font-medium text-[#4b3b2f]">
                <tr className="h-8 border-b border-[#e2d6c6]">
                  <th className="w-8 px-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all quotations"
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
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-2.5"
                    >
                      {heading}
                    </th>
                  ))}

                  <th scope="col" className="px-2.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="text-[10px] text-[#55463a]">
                {visible.map((quote) => (
                  <tr
                    key={quote.id}
                    className="h-9 border-b border-[#eee6dc]"
                  >
                    <td className="w-8 px-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select quotation for ${quote.customer}`}
                        className="h-3 w-3 accent-[#805336]"
                      />
                    </td>

                    {/* Created Date */}
                    <td className="whitespace-nowrap px-2.5">
                      {quote.date}
                    </td>
                    {/* Customer */}
                    <td className="px-2.5">
                      {quote.customer}
                    </td>

                    {/* Products and matching line-item values */}
                    <td className="px-2.5">
                      {quote.items.map((item) => item.product).join(", ")}
                    </td>
                    <td className="px-2.5">
                      {quote.items.map((item) => item.quantity).join(", ")}
                    </td>
                    <td className="whitespace-nowrap px-2.5">
                      {quote.items.map((item) => formatTransactionMoney(item.price)).join(", ")}
                    </td>

                    {/* Total */}
                    <td className="whitespace-nowrap px-2.5 font-medium">
                      {formatTransactionMoney(
                        quote.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(quote)
                          }
                          className={actionButtonClassName}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteQuotation(quote.id)
                          }
                          className={deleteButtonClassName}
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

          {/* Empty State */}
          {visible.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-14 text-center">
              <p className="m-0 text-[11px] font-medium text-[#897b6f]">
                {quotations.length
                  ? "No matching quotations"
                  : "No quotations prepared yet"}
              </p>

              <p className="mb-0 mt-1 text-[9px] text-[#a09387]">
                {quotations.length
                  ? "Try another search term."
                  : "Create a quotation to prepare a customer offer."}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex min-h-9 items-center justify-between border-t border-[#ebe2d7] px-2.5 text-[9px] text-[#817367] sm:px-3">
            <span>
              Showing {visible.length} of {quotations.length} quotations
            </span>

            <span>Quotation register</span>
          </div>
        </div>
      </section>

      {/* ========================================================
          CREATE / EDIT QUOTATION DIALOG
      ======================================================== */}

      {isFormOpen && (
        <TransactionDialog
          title={editing ? "Update quotation" : "Create Quotation"}
          description="Configure quotation details"
          labelledBy="quotation-form-title"
          onClose={closeForm}
        >
          <form
            key={editing?.id ?? "new-quotation"}
            onSubmit={saveQuotation}
            className="grid gap-3"
          >
            <div aria-label="Quotation steps" className="mx-auto flex items-center gap-3 py-1 text-[10px]">
              <span className={`flex items-center gap-1.5 ${step === 1 ? "font-semibold text-[#4b3020]" : "text-[#998b7f]"}`}>
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#4b3020] text-[8px] text-white">1</span>
                Quotation Details
              </span>
              <span className="h-px w-10 bg-[#d7c9b8]" />
              <span className={`flex items-center gap-1.5 ${step === 2 ? "font-semibold text-[#4b3020]" : "text-[#998b7f]"}`}>
                <span className={`grid h-4 w-4 place-items-center rounded-full border text-[8px] ${step === 2 ? "border-[#4b3020] bg-[#4b3020] text-white" : "border-[#cbbdad]"}`}>2</span>
                Review
              </span>
            </div>

            <label className={labelClassName}>
              Quotation Date
              <input
                required
                name="date"
                type="date"
                defaultValue={editing?.date ?? new Date().toISOString().slice(0, 10)}
                className={`${fieldClassName} h-8 text-[11px]`}
                readOnly={step === 2}
              />
            </label>

            {step === 1 ? (
              <>
                <label className={labelClassName}>
                  Customer (Optional)
                  <span className="flex gap-1.5">
                    <input
                      name="customer"
                      value={customer}
                      onChange={(event) => setCustomer(event.target.value)}
                      placeholder="Search by name, phone or email..."
                      className={`${fieldClassName} h-8 min-w-0 flex-1 text-[11px]`}
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
                  <label className={labelClassName}>
                    Customer phone or email (Optional)
                    <input
                      name="customerContact"
                      value={customerContact}
                      onChange={(event) => setCustomerContact(event.target.value)}
                      placeholder="Phone number or email address"
                      className={`${fieldClassName} h-8 text-[11px]`}
                    />
                  </label>
                )}

                <fieldset className="grid gap-2 rounded-md border border-[#e6dbcd] bg-[#f8f3ec] p-2">
                  <legend className="px-1 text-[9px] font-medium text-[#55463a]">Search &amp; Select Product</legend>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-[minmax(0,1fr)_70px_86px_auto]">
                    <input name="product" placeholder="Type to search products..." className={`${fieldClassName} col-span-2 h-8 min-w-0 text-[10px] sm:col-span-1`} />
                    <input name="quantity" type="number" min="1" step="1" placeholder="Qty" className={`${fieldClassName} h-8 min-w-0 text-[10px]`} />
                    <input name="price" type="number" min="0" step="1" placeholder="Price per unit" className={`${fieldClassName} h-8 min-w-0 text-[10px]`} />
                    <button
                      type="button"
                      onClick={(event) => addItem(event.currentTarget.form!)}
                      className="h-8 rounded-md bg-[#bca287] px-3 text-[10px] font-medium text-white hover:bg-[#a98b6e]"
                    >
                      + Add Item
                    </button>
                  </div>
                  {items.length > 0 && (
                    <ul className="m-0 grid list-none gap-1 p-0">
                      {items.map((item, index) => (
                        <li key={`${item.product}-${index}`} className="flex items-center justify-between gap-3 rounded border border-[#e8ded2] bg-white px-2 py-1.5 text-[10px] text-[#55463a]">
                          <span className="min-w-0 truncate">{item.product} <span className="text-[#928477]">× {item.quantity}</span></span>
                          <span className="flex shrink-0 items-center gap-2">
                            {formatTransactionMoney(item.quantity * item.price)}
                            <button type="button" aria-label={`Remove ${item.product}`} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-[#9b5549] hover:text-[#713a32]">×</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex justify-between border-t border-[#e6dbcd] pt-1.5 text-[10px] font-semibold text-[#4b3020]">
                    <span>Quotation total</span>
                    <span>{formatTransactionMoney(total)}</span>
                  </div>
                </fieldset>
              </>
            ) : (
              <div className="grid gap-2 rounded-md border border-[#e6dbcd] bg-[#f8f3ec] p-3 text-[11px] text-[#55463a]">
                <div className="flex justify-between gap-3"><span>Customer</span><strong>{customer.trim() || "Walk-in customer"}</strong></div>
                {customerContact && <div className="flex justify-between gap-3"><span>Phone / email</span><span>{customerContact}</span></div>}
                <div className="border-t border-[#e6dbcd] pt-2 font-medium">Quoted items</div>
                {items.map((item, index) => (
                  <div key={`${item.product}-${index}`} className="flex justify-between gap-3">
                    <span>{item.product} × {item.quantity} @ {formatTransactionMoney(item.price)}</span>
                    <span>{formatTransactionMoney(item.quantity * item.price)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[#e6dbcd] pt-2 font-semibold text-[#4b3020]"><span>Total</span><span>{formatTransactionMoney(total)}</span></div>
              </div>
            )}

            <div className="mt-1 flex justify-between gap-2">
              <button type="button" onClick={step === 2 ? () => setStep(1) : closeForm} className="h-8 rounded-md border border-[#e2d6c6] px-3 text-[10px] text-[#69594d] hover:bg-[#f4ecdf]">
                {step === 2 ? "Back" : "Cancel"}
              </button>
              <button type="submit" disabled={step === 1 && items.length === 0} className="h-8 rounded-md bg-[#28180f] px-4 text-[10px] font-medium text-white hover:bg-[#4a2d1b] disabled:cursor-not-allowed disabled:opacity-50">
                {step === 1 ? "Continue to Review" : editing ? "Save quotation" : "Create quotation"}
              </button>
            </div>
          </form>
        </TransactionDialog>
      )}
    </TransactionLayout>
  );
}