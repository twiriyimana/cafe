
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { boardsApi, getAccessToken, listApiRecords, type ApiRecord } from "../../../../lib/api-client";

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

type ExpenseItem = {
  description: string;
  quantity: number;
  unitAmount: number;
};

type Expense = {
  id: number;
  reference: string;
  date: string;
  category: string;
  payee: string;
  staff: string;
  amount: string;
  items: ExpenseItem[];
};

// ============================================================
// COMPONENT
// ============================================================

export default function ExpensesPage({
  role,
}: {
  role: TransactionRole;
}) {
  // ==========================================================
  // STATE
  // ==========================================================

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemUnitAmount, setItemUnitAmount] = useState("");
  const [apiMode, setApiMode] = useState(false);
  const [categoryRows, setCategoryRows] = useState<ApiRecord[]>([]);
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadFromApi() {
    if (!getAccessToken()) return;
    try {
      const [expensePayload, categoryPayload] = await Promise.all([boardsApi.expenses(), boardsApi.expenseCategories()]);
      const categories = listApiRecords(categoryPayload); setCategoryRows(categories);
      setExpenses(listApiRecords(expensePayload).map((r) => ({ id: Number(r.id), reference: String(r.reference ?? `EXP-${r.id}`), date: String(r.expense_date ?? ""), category: String(r.category_name ?? categories.find((c) => String(c.id) === String(r.category))?.name ?? ""), payee: String(r.vendor ?? ""), staff: "", amount: String(r.amount ?? "0"), items: [{ description: String(r.description ?? "Expense"), quantity: 1, unitAmount: Number(r.amount ?? 0) }] })));
      setApiMode(true); setApiError("");
    } catch (e) { setApiError(e instanceof Error ? e.message : "Could not load expenses from API."); }
  }
  useEffect(() => { void loadFromApi(); }, []);

  const itemTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitAmount,
    0,
  );

  // ==========================================================
  // FILTER EXPENSES
  // ==========================================================

  const visible = expenses.filter((expense) =>
    JSON.stringify(expense)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  function closeForm() {
    setEditing(null);
    setIsFormOpen(false);
    setStep(1);
    setItems([]);
    setItemDescription("");
    setItemQuantity("1");
    setItemUnitAmount("");
  }

  // ==========================================================
  // OPEN CREATE FORM
  // ==========================================================

  function openCreateForm() {
    setEditing(null);
    setStep(1);
    setItems([]);
    setItemDescription("");
    setItemQuantity("1");
    setItemUnitAmount("");
    setIsFormOpen(true);
  }

  // ==========================================================
  // OPEN EDIT FORM
  // ==========================================================

  function openEditForm(expense: Expense) {
    setEditing(expense);
    setStep(1);
    setItems(expense.items ?? []);
    setItemDescription("");
    setItemQuantity("1");
    setItemUnitAmount("");
    setIsFormOpen(true);
  }

  // ==========================================================
  // DELETE EXPENSE
  // ==========================================================

  function deleteExpense(id: number) {
    void (async () => {
      if (!window.confirm("Delete this expense?")) return;
      try { if (apiMode) await boardsApi.deleteExpense(id); setExpenses((items) => items.filter((item) => item.id !== id)); }
      catch (e) { setApiError(e instanceof Error ? e.message : "Could not delete expense."); }
    })();
  }

  // ==========================================================
  // SAVE / UPDATE EXPENSE
  // ==========================================================

  function addItem() {
    const description = itemDescription.trim();
    const quantity = Number(itemQuantity);
    const unitAmount = Number(itemUnitAmount);

    if (!description || !Number.isFinite(quantity) || quantity <= 0) return;
    if (!itemUnitAmount || !Number.isFinite(unitAmount) || unitAmount < 0) return;

    setItems((current) => [
      ...current,
      { description, quantity, unitAmount },
    ]);
    setItemDescription("");
    setItemQuantity("1");
    setItemUnitAmount("");
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 1) {
      if (items.length === 0) return;
      setStep(2);
      return;
    }

    const form = new FormData(event.currentTarget);
    const id = editing?.id ?? Date.now();

    const expense: Expense = {
      id,
      reference: String(form.get("reference") || `EXP-${id}`),
      date: String(form.get("date") || ""),
      category: String(form.get("category") || ""),
      payee: String(form.get("payee") || ""),
      staff: String(form.get("payee") || ""),
      amount: String(itemTotal),
      items,
    };

    void (async () => {
      setBusy(true); setApiError("");
      try {
        if (apiMode) {
          const category = categoryRows.find((c) => String(c.name ?? "").toLowerCase() === expense.category.toLowerCase());
          if (!category?.id) throw new Error("The category must already exist in Finance → Expense Categories in the API.");
          const body = { category: Number(category.id), description: items.map((item) => item.description).join(", ").slice(0, 255) || expense.category, amount: String(itemTotal), expense_date: expense.date, reference: expense.reference, vendor: expense.payee, notes: "" };
          if (editing) await boardsApi.updateExpense(editing.id, body); else await boardsApi.createExpense(body);
          await loadFromApi();
        } else if (editing) setExpenses((current) => current.map((item) => item.id === editing.id ? expense : item));
        else setExpenses((current) => [expense, ...current]);
        closeForm();
      } catch (e) { setApiError(e instanceof Error ? e.message : "Could not save expense."); }
      finally { setBusy(false); }
    })();
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <TransactionLayout
      role={role}
      title="Expenses"
      search={search}
      onSearchChange={setSearch}
      createLabel="Create New"
      onCreate={openCreateForm}
    >
      {apiError && <div role="alert" className="mx-3 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-900">{apiError}</div>}
      {/* ======================================================
          EXPENSE CONTENT
      ====================================================== */}

      <section className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">

        {/* ====================================================
            EXPENSE TABLE CARD
        ==================================================== */}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e5dacd] bg-[#fcf9f4]/95 shadow-[0_2px_10px_rgba(72,48,30,0.04)]">

          {/* ==================================================
              TABLE
          ================================================== */}

          <div className="min-h-0 flex-1 overflow-auto">

            <table className="w-full min-w-225 border-collapse text-left">

              {/* =================================================
                  TABLE HEADER
              ================================================= */}

              <thead className="sticky top-0 bg-[#f0e5d4] text-[9px] font-medium text-[#4b3b2f]">
                <tr className="h-8 border-b border-[#e2d6c6]">
                  <th className="w-8 px-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all expenses"
                      className="h-3 w-3 accent-[#805336]"
                    />
                  </th>

                  {[
                    "Date",
                    "Reference#",
                    "Payee",
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

                  <th
                    scope="col"
                    className="px-2.5 text-right"
                  >
                    Actions
                  </th>

                </tr>
              </thead>

              {/* =================================================
                  TABLE BODY
              ================================================= */}

              <tbody className="text-[10px] text-[#55463a]">

                {visible.map((expense) => (
                  <tr
                    key={expense.id}
                    className="h-9 border-b border-[#eee6dc]"
                  >
                    <td className="w-8 px-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select expense ${expense.reference}`}
                        className="h-3 w-3 accent-[#805336]"
                      />
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-2.5">
                      {expense.date}
                    </td>

                    {/* Reference */}
                    <td className="px-2.5 font-medium">
                      {expense.reference}
                    </td>

                    {/* Staff */}
                    <td className="px-2.5">
                      {expense.payee || expense.staff}
                    </td>

                    {/* Amount */}
                    <td className="whitespace-nowrap px-2.5 font-medium">
                      {formatTransactionMoney(
                        expense.amount
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-2.5 text-right">

                      <div className="inline-flex items-center gap-1">

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(expense)
                          }
                          className={actionButtonClassName}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteExpense(
                              expense.id
                            )
                          }
                          className={
                            deleteButtonClassName
                          }
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

          {visible.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-14 text-center">

              <p className="m-0 text-[11px] font-medium text-[#897b6f]">
                {expenses.length
                  ? "No matching expenses"
                  : "No expenses recorded"}
              </p>

              <p className="mb-0 mt-1 text-[9px] text-[#a09387]">
                {expenses.length
                  ? "Try a different category or payee."
                  : "Add a cost to keep track of business spending."}
              </p>

            </div>
          )}

          {/* ==================================================
              TABLE FOOTER
          ================================================== */}

          <div className="flex min-h-9 items-center justify-between border-t border-[#ebe2d7] px-2.5 text-[9px] text-[#817367] sm:px-3">

            <span>
              Showing {visible.length} of{" "}
              {expenses.length} expense entries
            </span>

            <span>
              Expense register
            </span>

          </div>
        </div>
      </section>

      {/* ======================================================
          CREATE / EDIT EXPENSE DIALOG
      ====================================================== */}

      {isFormOpen && (
        <TransactionDialog
          title={editing ? "Update Expense" : "Create Expense"}
          description={
            step === 1
              ? "Step 1 of 2: Configure expense details"
              : "Step 2 of 2: Payment & Review"
          }
          labelledBy="expense-form-title"
          onClose={closeForm}
        >
          <form
            key={editing?.id ?? "new-expense"}
            onSubmit={saveExpense}
            className="grid gap-3"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#eee4d7] pb-2">
              <span className="text-[10px] text-[#8d7e71]">
                Step {step} of 2: {step === 1 ? "Configure expense details" : "Payment & Review"}
              </span>
              <div className="flex items-center gap-2 text-[9px]">
                <span className={step === 1 ? "font-semibold text-[#34261e]" : "text-[#9a8b7e]"}>
                  ● Expense Details
                </span>
                <span className="h-px w-6 bg-[#d6c7b7]" />
                <span className={step === 2 ? "font-semibold text-[#34261e]" : "text-[#9a8b7e]"}>
                  ② Payment &amp; Review
                </span>
              </div>
            </div>

            {step === 1 ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className={labelClassName}>
                    Expense Date
                    <input
                      required
                      name="date"
                      type="date"
                      defaultValue={editing?.date ?? new Date().toISOString().slice(0, 10)}
                      className={`${fieldClassName} h-8 text-[10px]`}
                    />
                  </label>

                  <label className={labelClassName}>
                    Category
                    <input
                      required
                      name="category"
                      defaultValue={editing?.category ?? ""}
                      placeholder="e.g., Rent, Utilities"
                      className={`${fieldClassName} h-8 text-[10px]`}
                    />
                  </label>
                </div>

                <label className={labelClassName}>
                  Payee (Vendor/Customer)
                  <div className="flex gap-2">
                    <input
                      required
                      name="payee"
                      defaultValue={editing?.payee ?? editing?.staff ?? ""}
                      placeholder="Search by name or type (vendor/customer)..."
                      className={`${fieldClassName} h-8 min-w-0 flex-1 text-[10px]`}
                    />
                    <button
                      type="button"
                      aria-label="Add payee"
                      className="h-8 w-9 shrink-0 rounded-md border border-[#e2d6c6] bg-white text-[12px] text-[#60442f]"
                    >
                      +
                    </button>
                  </div>
                </label>

                <section className="rounded-md bg-[#f5eee5] p-2.5">
                  <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_92px_150px_112px] sm:items-end">
                    <label className={labelClassName}>
                      Description
                      <input
                        value={itemDescription}
                        onChange={(e) => setItemDescription(e.target.value)}
                        placeholder="Item description"
                        className={`${fieldClassName} h-8 text-[10px]`}
                      />
                    </label>

                    <label className={labelClassName}>
                      Quantity
                      <input
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        className={`${fieldClassName} h-8 text-[10px]`}
                      />
                    </label>

                    <label className={labelClassName}>
                      Amount per Unit (RWF)
                      <input
                        value={itemUnitAmount}
                        onChange={(e) => setItemUnitAmount(e.target.value)}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Amount"
                        className={`${fieldClassName} h-8 text-[10px]`}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={addItem}
                      className="h-8 rounded-md bg-[#c5a98a] px-3 text-[10px] font-medium text-white"
                    >
                      + &nbsp; Add Item
                    </button>
                  </div>

                  {items.length > 0 && (
                    <div className="mt-2 grid gap-1 rounded-md bg-white/60 p-2">
                      {items.map((item, index) => (
                        <div
                          key={`${item.description}-${index}`}
                          className="grid grid-cols-[minmax(0,1fr)_55px_95px_95px_22px] items-center gap-2 border-b border-[#eee6dc] py-1 text-[9px] text-[#55463a] last:border-0"
                        >
                          <span className="truncate">{item.description}</span>
                          <span>{item.quantity}</span>
                          <span>{item.unitAmount.toLocaleString()} RWF</span>
                          <span>{(item.quantity * item.unitAmount).toLocaleString()} RWF</span>
                          <button type="button" onClick={() => removeItem(index)} className="text-[#9b5549]">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {items.length === 0 ? (
                  <div className="flex min-h-24 flex-col items-center justify-center gap-1 text-center text-[10px] text-[#8e8074]">
                    <span className="text-3xl leading-none text-[#897a6c]">▱</span>
                    <span>No items added to the expense</span>
                  </div>
                ) : (
                  <div className="flex justify-end text-[10px] font-semibold text-[#4b3020]">
                    Total: {itemTotal.toLocaleString()} RWF
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={items.length === 0}
                    className="h-8 rounded-md bg-[#c5a98a] px-4 text-[10px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next ›
                  </button>
                </div>
              </>
            ) : (
              <>
                <section className="grid gap-2 rounded-md border border-[#e3d6c7] bg-[#faf6f0] p-3 text-[10px] text-[#55463a]">
                  <strong className="text-[12px] text-[#34261e]">Expense Review</strong>
                  <div className="grid gap-1 sm:grid-cols-2">
                    <span>Date: <strong>{editing?.date || "New expense"}</strong></span>
                    <span>Reference: <strong>{editing?.reference || "Auto-generated"}</strong></span>
                    <span>Category: <strong>{editing?.category || "Entered above"}</strong></span>
                    <span>Items: <strong>{items.length}</strong></span>
                  </div>
                  <div className="mt-1 border-t border-[#e5dacd] pt-2">
                    {items.map((item, index) => (
                      <div key={`${item.description}-review-${index}`} className="flex justify-between gap-3 py-1">
                        <span>{item.description} × {item.quantity}</span>
                        <span>{(item.quantity * item.unitAmount).toLocaleString()} RWF</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end border-t border-[#e5dacd] pt-2 font-semibold">
                    Total: {itemTotal.toLocaleString()} RWF
                  </div>
                </section>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-8 rounded-md border border-[#e2d6c6] px-4 text-[10px] text-[#69594d]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="h-8 rounded-md bg-[#28180f] px-4 text-[10px] font-medium text-white"
                  >
                    {editing ? "Save Expense" : "Create Expense"}
                  </button>
                </div>
              </>
            )}
          </form>
        </TransactionDialog>
      )}
    </TransactionLayout>
  );
}
