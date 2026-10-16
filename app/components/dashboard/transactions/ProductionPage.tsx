
"use client";

import { useState, type FormEvent } from "react";

import {
  actionButtonClassName,
  deleteButtonClassName,
  fieldClassName,
  labelClassName,
  TransactionDialog,
  TransactionLayout,
  type TransactionRole,
} from "./TransactionLayout";

// ============================================================
// TYPES
// ============================================================

type ProductionRun = {
  id: number;
  batch: string;
  date: string;
  status: "Stock-In" | "Damage";
  items: ProductionItem[];
  notes: string;
};

type ProductionItem = {
  product: string;
  quantity: number;
  cost: number;
};

// ============================================================
// COMPONENT
// ============================================================

export default function ProductionPage({
  role,
}: {
  role: TransactionRole;
}) {
  // ============================================================
  // STATE
  // ============================================================

  const [runs, setRuns] = useState<ProductionRun[]>([]);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionRun | null>(null);
  const [status, setStatus] = useState<ProductionRun["status"]>("Stock-In");
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [preview, setPreview] = useState(false);

  const total = items.reduce((sum, item) => sum + item.quantity * item.cost, 0);

  // ============================================================
  // FILTERED PRODUCTION RUNS
  // ============================================================

  const visible = runs.filter((run) =>
    JSON.stringify(run)
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
    setItems([]);
    setStatus("Stock-In");
    setPreview(false);
  }

  function openCreateForm() {
    setEditing(null);
    setItems([]);
    setStatus("Stock-In");
    setPreview(false);
    setIsFormOpen(true);
  }

  function openEditForm(run: ProductionRun) {
    setEditing(run);
    setItems(run.items);
    setStatus(run.status);
    setPreview(false);
    setIsFormOpen(true);
  }

  function addItem(form: HTMLFormElement) {
    const data = new FormData(form);
    const product = String(data.get("product") ?? "").trim();
    const quantityValue = String(data.get("itemQuantity") ?? "");
    const costValue = String(data.get("cost") ?? "");
    const quantity = Number(quantityValue);
    const cost = Number(costValue);

    if (!product || !quantityValue || quantity <= 0 || !costValue || cost < 0 || !Number.isFinite(cost)) return;

    setItems((current) => [...current, { product, quantity, cost }]);
    form.querySelector<HTMLInputElement>('[name="product"]')!.value = "";
    form.querySelector<HTMLInputElement>('[name="itemQuantity"]')!.value = "";
    form.querySelector<HTMLInputElement>('[name="cost"]')!.value = "";
  }

  function deleteRun(runId: number) {
    setRuns((current) =>
      current.filter((run) => run.id !== runId)
    );
  }

  function saveRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const id = editing?.id ?? Date.now();

    const run: ProductionRun = {
      id,
      batch: String(form.get("batch") || `BATCH-${id}`),
      date: String(form.get("date")),
      status,
      items,
      notes: String(form.get("notes") ?? ""),
    };

    setRuns((current) =>
      editing
        ? current.map((item) =>
            item.id === id ? run : item
          )
        : [run, ...current]
    );

    closeForm();
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <TransactionLayout
      role={role}
      title="Production"
      search={search}
      onSearchChange={setSearch}
      createLabel="Create New"
      onCreate={openCreateForm}
    >
      {/* ========================================================
          PRODUCTION TABLE
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
                      aria-label="Select all production runs"
                      className="h-3 w-3 accent-[#805336]"
                    />
                  </th>
                  {[
                    "Date",
                    "Reference#",
                    "Status",
                    "Products",
                    "Quantity",
                    "Cost",
                    "Amount",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-2.5"
                    >
                      <span className="inline-flex items-center gap-1">
                        {heading}
                        <span aria-hidden="true" className="text-[#806f60]">↕</span>
                      </span>
                    </th>
                  ))}

                  <th scope="col" className="px-2.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="text-[10px] text-[#55463a]">
                {visible.map((run) => (
                  <tr
                    key={run.id}
                    className="h-9 border-b border-[#eee6dc]"
                  >
                    <td className="w-8 px-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select production run ${run.batch}`}
                        className="h-3 w-3 accent-[#805336]"
                      />
                    </td>

                    <td className="whitespace-nowrap px-2.5">
                      {run.date}
                    </td>

                    <td className="px-2.5 font-medium">
                      {run.batch}
                    </td>

                    <td className="px-2.5">
                      {run.status}
                    </td>

                    <td className="px-2.5">
                      {run.items.map((item) => item.product).join(", ")}
                    </td>

                    <td className="whitespace-nowrap px-2.5">
                      {run.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                    </td>

                    <td className="whitespace-nowrap px-2.5">
                      {run.items.map((item) => item.cost.toLocaleString()).join(", ")}
                    </td>

                    <td className="whitespace-nowrap px-2.5 font-medium">
                      {run.items.reduce((sum, item) => sum + item.quantity * item.cost, 0).toLocaleString()} RWF
                    </td>

                    {/* Actions */}
                    <td className="px-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(run)}
                          className={actionButtonClassName}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRun(run.id)}
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
                {runs.length
                  ? "No matching production runs"
                  : "No production runs logged"}
              </p>

              <p className="mb-0 mt-0.5 text-[8px] text-[#a09387]">
                {runs.length
                  ? "Try another batch, product, or status."
                  : "Log a batch to keep production output visible."}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex min-h-9 items-center justify-between border-t border-[#ebe2d7] px-2.5 text-[9px] text-[#817367] sm:px-3">
            <span>
              Showing {visible.length} of {runs.length} batches
            </span>

            <span>Production log</span>
          </div>
        </div>
      </section>

      {/* ========================================================
          CREATE / EDIT PRODUCTION DIALOG
      ======================================================== */}

      {isFormOpen && (
        <TransactionDialog
          title={editing ? "Update Production" : "Create New Production"}
          description="Create a new production record"
          labelledBy="production-form-title"
          onClose={closeForm}
        >
          <form
            key={editing?.id ?? "new-production"}
            onSubmit={saveRun}
            className="grid max-h-[78vh] gap-1.5 overflow-y-auto pr-1"
          >
            <div className="flex items-start justify-between gap-2">
              <div aria-label="Production steps" className="flex items-center gap-1.5 py-0.5 text-[9px] text-[#8f8175]">
                <span className="font-semibold text-[#4b3020]">● Production Details</span>
                <span className="h-px w-5 bg-[#d7c9b8]" />
                <span>② Payment &amp; Review</span>
              </div>
              <div className="text-right text-[8px] text-[#78695c]">
                <strong className="block text-[#4b3020]">Production #{editing?.batch ?? "New"}</strong>
                <span>Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="grid gap-1.5 sm:grid-cols-2">
              <label className={labelClassName}>Production Date
                <input required name="date" type="date" defaultValue={editing?.date ?? new Date().toISOString().slice(0, 10)} className={`${fieldClassName} h-7 text-[9px]`} />
              </label>
              <label className={labelClassName}>Reference #
                <input name="batch" defaultValue={editing?.batch ?? ""} placeholder="Auto-generated" className={`${fieldClassName} h-7 text-[9px]`} />
              </label>
            </div>

            <section className="grid gap-1.5">
              <div>
                <h3 className="m-0 text-[11px] font-semibold text-[#4b3b2f]">Production Status</h3>
                <p className="mb-0 mt-0.5 text-[8px] text-[#8e8074]">Select status for all products in this production</p>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {(["Stock-In", "Damage"] as const).map((option) => (
                  <label key={option} className={`flex cursor-pointer items-start gap-1.5 rounded-md border p-2 ${status === option ? "border-[#d5c3ae] bg-[#fbf6ed]" : "border-[#e6dbcd] bg-white/70"}`}>
                    <input type="radio" name="status" value={option} checked={status === option} onChange={() => setStatus(option)} className="mt-0 accent-[#805336]" />
                    <span><strong className="block text-[10px] text-[#4b3b2f]">{option}</strong><span className="text-[9px] text-[#8e8074]">{option === "Stock-In" ? "Add to inventory" : "Report damaged items"}</span></span>
                  </label>
                ))}
              </div>
            </section>

            <section className="grid gap-1.5">
              <div>
                <h3 className="m-0 text-[11px] font-semibold text-[#4b3b2f]">Product Information</h3>
                <p className="mb-0 mt-0.5 text-[8px] text-[#8e8074]">Select the product and quantity</p>
              </div>
              <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_65px_75px_75px_26px] sm:items-end">
                <label className={labelClassName}>Product<input name="product" placeholder="Select product" className={`${fieldClassName} h-7 text-[9px]`} /></label>
                <label className={labelClassName}>Quantity<input name="itemQuantity" type="number" min="1" step="1" placeholder="1" className={`${fieldClassName} h-7 text-[9px]`} /></label>
                <label className={labelClassName}>Cost<input name="cost" type="number" min="0" step="0.01" placeholder="0.00" className={`${fieldClassName} h-7 text-[9px]`} /></label>
                <label className={labelClassName}>Amount<input readOnly value={items.length ? "Calculated" : "—"} className={`${fieldClassName} h-7 text-[9px]`} /></label>
                <button type="button" aria-label="Add production product" onClick={(event) => addItem(event.currentTarget.form!)} className="h-7 rounded-md border border-[#e2d6c6] bg-white text-[12px] text-[#60442f] hover:bg-[#f4ecdf]">+</button>
              </div>
              {items.length > 0 ? (
                <div className="grid gap-0.5 rounded-md border border-[#e6dbcd] bg-white/70 p-1.5">
                  {items.map((item, index) => (
                    <div key={`${item.product}-${index}`} className="grid grid-cols-[minmax(0,1fr)_50px_70px_70px_24px] items-center gap-2 border-b border-[#eee6dc] py-1 text-[9px] text-[#55463a] last:border-0">
                      <span className="truncate">{item.product}</span><span>{item.quantity}</span><span>{item.cost.toFixed(2)}</span><span>{(item.quantity * item.cost).toFixed(2)}</span>
                      <button type="button" aria-label={`Remove ${item.product}`} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-[#9b5549]">×</button>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 pt-1 text-[9px] font-semibold text-[#4b3020]">Total: {total.toLocaleString()} RWF</div>
                </div>
              ) : (
                <div className="grid min-h-14 place-content-center justify-items-center gap-1 text-[9px] text-[#9a8b7d]"><span className="text-lg">▢</span><span>No items added</span></div>
              )}
              <button type="button" onClick={() => document.querySelector<HTMLInputElement>('[name="product"]')?.focus()} className="w-fit rounded-md border border-[#e2d6c6] bg-white px-2 py-0.5 text-[8px] text-[#60442f] hover:bg-[#f4ecdf]">+ Add New Product</button>
            </section>

            <label className={labelClassName}>Notes
              <textarea name="notes" defaultValue={editing?.notes ?? ""} placeholder="Add any additional notes here..." className="min-h-8 rounded-md border border-[#e2d6c6] bg-white px-2 py-1 text-[9px] outline-none focus:border-[#805336]" />
            </label>

            {preview && (
              <section aria-label="Production preview" className="grid gap-1 rounded-md border border-[#d9c8b4] bg-[#f8f3ec] p-2.5 text-[10px] text-[#55463a]">
                <strong className="text-[#4b3020]">Production preview</strong>
                <span>Status: {status} · {items.length} {items.length === 1 ? "product" : "products"}</span>
                <span>{items.map((item) => `${item.product} × ${item.quantity}`).join(", ") || "No products added"}</span>
                <span className="font-semibold">Total: {total.toLocaleString()} RWF</span>
              </section>
            )}

            <div className="mt-0.5 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={closeForm}
                className="h-7 flex-1 rounded-md border border-[#e2d6c6] px-4 text-[10px] text-[#69594d]"
              >
                Cancel
              </button>

              <button type="button" onClick={() => setPreview((current) => !current)} className="h-7 rounded-md border border-[#e2d6c6] bg-white px-4 text-[10px] text-[#4b3020] hover:bg-[#f4ecdf]">{preview ? "Edit" : "Preview"}</button>
              <button
                type="submit"
                disabled={items.length === 0}
                className="h-7 flex-1 rounded-md bg-[#28180f] px-4 text-[10px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editing ? "Save Production" : "Save Production"}
              </button>
            </div>
          </form>
        </TransactionDialog>
      )}
    </TransactionLayout>
  );
}
