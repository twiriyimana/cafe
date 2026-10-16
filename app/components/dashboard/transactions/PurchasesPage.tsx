
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { boardsApi, getAccessToken, listApiRecords, type ApiRecord } from "../../../../lib/api-client";

import {
  actionButtonClassName,
  deleteButtonClassName,
  formatTransactionMoney,
  TransactionDialog,
  TransactionLayout,
  type TransactionRole,
} from "./TransactionLayout";

// ============================================================
// TYPES
// ============================================================

type Purchase = {
  id: number;
  date: string;
  expectedDate: string;
  supplier: string;
  supplierContact?: string;
  items: PurchaseItem[];
};

type PurchaseItem = {
  item: string;
  quantity: number;
  cost: number;
  price: number;
};

// ============================================================
// COMPONENT
// ============================================================

export default function PurchasesPage({
  role,
}: {
  role: TransactionRole;
}) {
  // ============================================================
  // STATE
  // ============================================================

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [supplier, setSupplier] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [showSupplierContact, setShowSupplierContact] = useState(false);
  const [apiMode, setApiMode] = useState(false);
  const [supplierRows, setSupplierRows] = useState<ApiRecord[]>([]);
  const [inventoryRows, setInventoryRows] = useState<ApiRecord[]>([]);
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadFromApi() {
    if (!getAccessToken()) return;
    try {
      const [purchasePayload, supplierPayload, inventoryPayload] = await Promise.all([boardsApi.purchases(), boardsApi.suppliers(), boardsApi.inventoryItems()]);
      const supplierList = listApiRecords(supplierPayload); const inventoryList = listApiRecords(inventoryPayload);
      setSupplierRows(supplierList); setInventoryRows(inventoryList);
      setPurchases(listApiRecords(purchasePayload).map((r) => ({ id: Number(r.id), date: String(r.purchase_date ?? ""), expectedDate: String(r.expected_delivery_date ?? ""), supplier: String(r.supplier_name ?? supplierList.find((s) => String(s.id) === String(r.supplier))?.name ?? "Unspecified vendor"), supplierContact: "", items: Array.isArray(r.items) ? (r.items as ApiRecord[]).map((it) => ({ item: String(it.inventory_item_name ?? "Inventory item"), quantity: Number(it.ordered_quantity ?? it.quantity ?? 1), cost: Number(it.unit_cost ?? 0), price: Number(it.unit_price ?? it.unit_cost ?? 0) })) : [] })));
      setApiMode(true); setApiError("");
    } catch (e) { setApiError(e instanceof Error ? e.message : "Could not load purchases from API."); }
  }
  useEffect(() => { void loadFromApi(); }, []);

  const total = items.reduce((sum, item) => sum + item.quantity * item.cost, 0);

  // ============================================================
  // FILTERED PURCHASES
  // ============================================================

  const visible = purchases.filter((purchase) =>
    JSON.stringify(purchase)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ============================================================
  // ============================================================
  // FORM HANDLERS
  // ============================================================

  function closeForm() {
    setEditing(null);
    setIsFormOpen(false);
    setStep(1);
    setItems([]);
    setSupplier("");
    setSupplierContact("");
    setShowSupplierContact(false);
  }

  function openCreateForm() {
    setEditing(null);
    setStep(1);
    setItems([]);
    setSupplier("");
    setSupplierContact("");
    setShowSupplierContact(false);
    setIsFormOpen(true);
  }

  function openEditForm(purchase: Purchase) {
    setEditing(purchase);
    setStep(1);
    setItems(purchase.items);
    setSupplier(purchase.supplier === "Unspecified vendor" ? "" : purchase.supplier);
    setSupplierContact(purchase.supplierContact ?? "");
    setShowSupplierContact(Boolean(purchase.supplierContact));
    setIsFormOpen(true);
  }

  function addItem(form: HTMLFormElement) {
    const data = new FormData(form);
    const item = String(data.get("item") ?? "").trim();
    const quantityValue = String(data.get("quantity") ?? "");
    const costValue = String(data.get("cost") ?? "");
    const priceValue = String(data.get("price") ?? "");
    const quantity = Number(quantityValue);
    const cost = Number(costValue);
    const price = Number(priceValue);

    if (!item || !quantityValue || !costValue || !priceValue || quantity <= 0 || cost < 0 || price < 0) return;

    setItems((current) => [...current, { item, quantity, cost, price }]);
    for (const field of ["item", "quantity", "cost", "price"]) {
      form.querySelector<HTMLInputElement>(`[name="${field}"]`)!.value = "";
    }
  }

  function deletePurchase(purchaseId: number) {
    void (async () => {
      if (!window.confirm("Delete this purchase?")) return;
      try { if (apiMode) await boardsApi.deletePurchase(purchaseId); setPurchases((current) => current.filter((purchase) => purchase.id !== purchaseId)); }
      catch (e) { setApiError(e instanceof Error ? e.message : "Could not delete purchase."); }
    })();
  }

  function savePurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 1) {
      if (items.length === 0) return;
      setStep(2);
      return;
    }

    const form = new FormData(event.currentTarget);
    const id = editing?.id ?? Date.now();

    const purchase: Purchase = {
      id,
      date: String(form.get("date")),
      expectedDate: String(form.get("expectedDate") ?? ""),
      supplier: supplier.trim() || "Unspecified vendor",
      supplierContact: supplierContact.trim(),
      items,
    };

    void (async () => {
      setBusy(true); setApiError("");
      try {
        if (apiMode) {
          const supplierMatch = supplierRows.find((r) => String(r.name ?? "").toLowerCase() === supplier.trim().toLowerCase());
          if (!supplierMatch?.id) throw new Error("Choose a supplier that already exists in Contacts → Vendors before saving this purchase.");
          const apiItems = items.map((row) => {
            const match = inventoryRows.find((r) => String(r.name ?? "").toLowerCase() === row.item.toLowerCase());
            if (!match?.id) throw new Error(`Inventory item "${row.item}" was not found. Add it in Inventory first.`);
            return { inventory_item: Number(match.id), ordered_quantity: String(row.quantity), unit_cost: String(row.cost), notes: "" };
          });
          const body = { supplier: Number(supplierMatch.id), purchase_date: purchase.date, expected_delivery_date: purchase.expectedDate || null, items: apiItems };
          if (editing) await boardsApi.updatePurchase(editing.id, body); else await boardsApi.createPurchase(body);
          await loadFromApi();
        } else setPurchases((current) => editing ? current.map((item) => item.id === id ? purchase : item) : [purchase, ...current]);
        closeForm();
      } catch (e) { setApiError(e instanceof Error ? e.message : "Could not save purchase."); }
      finally { setBusy(false); }
    })();
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <TransactionLayout
      role={role}
      title="Purchases"
      search={search}
      onSearchChange={setSearch}
      createLabel="Create New"
      onCreate={openCreateForm}
    >
      {apiError && <div role="alert" className="mx-3 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-900">{apiError}</div>}
      {/* ========================================================
          PURCHASES TABLE
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
                      aria-label="Select all purchases"
                      className="h-3 w-3 accent-[#805336]"
                    />
                  </th>
                  {[
                            "Purchase Date",
                            "Expected Delivery",
                            "Vendor",
                            "Item",
                            "Qty",
                            "Cost",
                            "Price",
                            "Total Cost",
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
                {visible.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="h-9 border-b border-[#eee6dc]"
                  >
                    <td className="w-8 px-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select purchase from ${purchase.supplier}`}
                        className="h-3 w-3 accent-[#805336]"
                      />
                    </td>

                    <td className="whitespace-nowrap px-2.5">
                      {purchase.date}
                    </td>

                    <td className="whitespace-nowrap px-2.5">{purchase.expectedDate || "—"}</td>

                    <td className="px-2.5">{purchase.supplier}</td>

                    <td className="px-2.5">
                      {purchase.items.map((item) => item.item).join(", ")}
                    </td>
                    <td className="px-2.5">{purchase.items.map((item) => item.quantity).join(", ")}</td>
                    <td className="whitespace-nowrap px-2.5">{purchase.items.map((item) => formatTransactionMoney(item.cost)).join(", ")}</td>
                    <td className="whitespace-nowrap px-2.5">{purchase.items.map((item) => formatTransactionMoney(item.price)).join(", ")}</td>

                    <td className="px-2.5 font-medium">
                      {formatTransactionMoney(purchase.items.reduce((sum, item) => sum + item.quantity * item.cost, 0))}
                    </td>

                    {/* Actions */}
                    <td className="px-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(purchase)
                          }
                          className={actionButtonClassName}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deletePurchase(purchase.id)
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
                {purchases.length
                  ? "No matching purchases"
                  : "No purchases recorded"}
              </p>

              <p className="mb-0 mt-1 text-[9px] text-[#a09387]">
                {purchases.length
                  ? "Try another supplier or item."
                  : "Record a supplier purchase to track stock and payment."}
              </p>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================
          CREATE / EDIT PURCHASE DIALOG
      ======================================================== */}

      {isFormOpen && (
        <TransactionDialog
          title={editing ? "Update Purchase Receive" : "Create Purchase Receive"}
          description={`${step} of 2: ${step === 1 ? "Configure purchase details" : "Review & payment"}`}
          labelledBy="purchase-form-title"
          onClose={closeForm}
        >
          <form
            key={editing?.id ?? "new-purchase"}
            onSubmit={savePurchase}
            className="grid gap-3"
          >
            <div aria-label="Purchase steps" className="mx-auto flex items-center gap-3 py-1 text-[10px]">
              <span className={`flex items-center gap-1.5 ${step === 1 ? "font-semibold text-[#4b3020]" : "text-[#998b7f]"}`}>
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#4b3020] text-[8px] text-white">1</span>
                Purchase Details
              </span>
              <span className="h-px w-10 bg-[#d7c9b8]" />
              <span className={`flex items-center gap-1.5 ${step === 2 ? "font-semibold text-[#4b3020]" : "text-[#998b7f]"}`}>
                <span className={`grid h-4 w-4 place-items-center rounded-full border text-[8px] ${step === 2 ? "border-[#4b3020] bg-[#4b3020] text-white" : "border-[#cbbdad]"}`}>2</span>
                Payment &amp; Review
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 text-[10px] font-medium text-[#55463a]">
                Purchase Date
                <input required name="date" type="date" defaultValue={editing?.date ?? new Date().toISOString().slice(0, 10)} readOnly={step === 2} className="h-8 min-w-0 rounded-md border border-[#e2d6c6] bg-white px-2 text-[11px] outline-none focus:border-[#805336]" />
              </label>
              <label className="grid gap-1 text-[10px] font-medium text-[#55463a]">
                Expected Delivery Date
                <input name="expectedDate" type="date" defaultValue={editing?.expectedDate ?? ""} readOnly={step === 2} className="h-8 min-w-0 rounded-md border border-[#e2d6c6] bg-white px-2 text-[11px] outline-none focus:border-[#805336]" />
              </label>
            </div>

            {step === 1 ? (
              <>
                <label className="grid gap-1 text-[10px] font-medium text-[#55463a]">
                  Vendor (Optional)
                  <span className="flex gap-1.5">
                    <input name="supplier" value={supplier} onChange={(event) => setSupplier(event.target.value)} placeholder="Search by name, phone, TIN, bank..." className="h-8 min-w-0 flex-1 rounded-md border border-[#e2d6c6] bg-white px-2 text-[11px] outline-none focus:border-[#805336]" />
                    <button type="button" aria-label={showSupplierContact ? "Hide vendor contact" : "Add vendor contact"} onClick={() => setShowSupplierContact((value) => !value)} className="h-8 w-8 shrink-0 rounded-md border border-[#e2d6c6] bg-white text-sm text-[#60442f]">{showSupplierContact ? "−" : "+"}</button>
                  </span>
                </label>
                {showSupplierContact && <label className="grid gap-1 text-[10px] font-medium text-[#55463a]">Vendor phone or email<input name="supplierContact" value={supplierContact} onChange={(event) => setSupplierContact(event.target.value)} placeholder="Phone number, email or TIN" className="h-8 rounded-md border border-[#e2d6c6] bg-white px-2 text-[11px] outline-none focus:border-[#805336]" /></label>}

                <fieldset className="grid gap-2 rounded-md border border-[#e6dbcd] bg-[#f8f3ec] p-2">
                  <legend className="px-1 text-[9px] font-medium text-[#55463a]">Search &amp; Select Item</legend>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-[minmax(0,1fr)_60px_70px_70px_auto]">
                    <input name="item" placeholder="Search for items..." className="col-span-2 h-8 min-w-0 rounded-md border border-[#e2d6c6] bg-white px-2 text-[10px] outline-none focus:border-[#805336] sm:col-span-1" />
                    <input name="quantity" type="number" min="1" step="1" placeholder="Qty" className="h-8 min-w-0 rounded-md border border-[#e2d6c6] bg-white px-2 text-[10px] outline-none focus:border-[#805336]" />
                    <input name="cost" type="number" min="0" step="any" placeholder="Cost" className="h-8 min-w-0 rounded-md border border-[#e2d6c6] bg-white px-2 text-[10px] outline-none focus:border-[#805336]" />
                    <input name="price" type="number" min="0" step="any" placeholder="Price" className="h-8 min-w-0 rounded-md border border-[#e2d6c6] bg-white px-2 text-[10px] outline-none focus:border-[#805336]" />
                    <button type="button" onClick={(event) => addItem(event.currentTarget.form!)} aria-label="Add purchase item" className="h-8 rounded-md bg-[#bca287] px-3 text-[11px] font-medium text-white hover:bg-[#a98b6e]">＋</button>
                  </div>
                </fieldset>

                {items.length === 0 ? (
                  <div className="flex min-h-28 flex-col items-center justify-center gap-2 text-center text-[10px] text-[#a09387]">
                    <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-md border border-[#d8cbbb] text-base">▢</span>
                    <span>No items added</span>
                  </div>
                ) : (
                  <div className="grid gap-1">
                    {items.map((item, index) => (
                      <div key={`${item.item}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded border border-[#e8ded2] bg-white px-2 py-1.5 text-[10px] text-[#55463a]">
                        <span className="truncate">{item.item} <span className="text-[#928477]">× {item.quantity}</span></span>
                        <span>{formatTransactionMoney(item.quantity * item.cost)} cost · {formatTransactionMoney(item.price)} price</span>
                        <button type="button" aria-label={`Remove ${item.item}`} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-[#9b5549]">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between border-t border-[#e6dbcd] pt-2 text-[10px] font-semibold text-[#4b3020]"><span>Total Cost</span><span>{formatTransactionMoney(total)}</span></div>
              </>
            ) : (
              <div className="grid gap-2 rounded-md border border-[#e6dbcd] bg-[#f8f3ec] p-3 text-[11px] text-[#55463a]">
                <div className="flex justify-between gap-3"><span>Vendor</span><strong>{supplier.trim() || "Unspecified vendor"}</strong></div>
                {supplierContact && <div className="flex justify-between gap-3"><span>Contact</span><span>{supplierContact}</span></div>}
                <div className="border-t border-[#e6dbcd] pt-2 font-medium">Items received</div>
                {items.map((item, index) => <div key={`${item.item}-${index}`} className="flex justify-between gap-3"><span>{item.item} × {item.quantity} @ {formatTransactionMoney(item.cost)} cost · {formatTransactionMoney(item.price)} price</span><span>{formatTransactionMoney(item.quantity * item.cost)}</span></div>)}
                <div className="flex justify-between border-t border-[#e6dbcd] pt-2 font-semibold text-[#4b3020]"><span>Total Cost</span><span>{formatTransactionMoney(total)}</span></div>
              </div>
            )}

            <div className="mt-1 flex justify-between gap-2">
              <button
                type="button"
                onClick={step === 2 ? () => setStep(1) : closeForm}
                className="h-8 rounded-md border border-[#e2d6c6] px-3 text-[10px] text-[#69594d]"
              >
                {step === 2 ? "Back" : "Cancel"}
              </button>

              <button
                type="submit"
                disabled={step === 1 && items.length === 0}
                className="h-8 rounded-md bg-[#bca287] px-4 text-[10px] font-medium text-white hover:bg-[#a98b6e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === 1 ? "Next ›" : editing ? "Save Purchase" : "Receive Purchase"}
              </button>
            </div>
          </form>
        </TransactionDialog>
      )}
    </TransactionLayout>
  );
}
