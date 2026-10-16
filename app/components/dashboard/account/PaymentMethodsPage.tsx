"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePersistedState } from "../../../../lib/use-persisted-state";
import { boardsApi, getAccessToken, listApiRecords } from "../../../../lib/api-client";
import AccountShell from "./AccountShell";
import { paymentTypes, paymentsSeed, uid, type PaymentMethod } from "./data";
import { DataTable, Dialog, Field, RadioGroup, fieldClass, hintClass, primaryButton, rowAction, secondaryButton, useToast, type Column } from "./ui";

type Draft = { name: string; type: string; description: string; featured: "yes" | "no" };
const emptyDraft: Draft = { name: "", type: "", description: "", featured: "yes" };

export default function PaymentMethodsPage() {
  const [methods, setMethods] = usePersistedState("coffee-account-payment-methods", paymentsSeed);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<{ name?: string; type?: string }>({});
  const [toast, notify] = useToast();
  const [apiMode, setApiMode] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadFromApi() {
    if (!getAccessToken()) return;
    try {
      const records = listApiRecords(await boardsApi.paymentMethods());
      setMethods(records.map((r) => ({ id: String(r.id), name: String(r.name ?? ""), type: String(r.payment_type ?? "CASH"), description: String(r.description ?? ""), featured: Boolean(r.is_default) })));
      setApiMode(true);
    } catch (e) { notify(e instanceof Error ? `API payment methods: ${e.message}` : "Could not load payment methods from API."); }
  }
  useEffect(() => { void loadFromApi(); }, []);

  const columns: Column<PaymentMethod>[] = [
    { key: "name", label: "Payment Method", sortValue: (m) => m.name, render: (m) => m.name },
    { key: "type", label: "Type", sortValue: (m) => m.type, render: (m) => m.type },
    { key: "description", label: "Description", sortValue: (m) => m.description, render: (m) => m.description },
    { key: "featured", label: "Featured", sortValue: (m) => (m.featured ? "Yes" : "No"), render: (m) => (m.featured ? "Yes" : "No") },
    {
      key: "actions", label: "Actions", sortValue: () => "",
      render: (m) => (
        <span className="flex gap-3">
          <button type="button" className={rowAction} onClick={() => { setErrors({}); setEditing({ id: m.id, draft: { name: m.name, type: m.type, description: m.description, featured: m.featured ? "yes" : "no" } }); }}>Edit</button>
          <button type="button" className={rowAction} onClick={() => { void (async () => { if (!window.confirm(`Delete ${m.name}?`)) return; try { if (apiMode) await boardsApi.deletePaymentMethod(m.id); setMethods((rows) => rows.filter((r) => r.id !== m.id)); notify("Payment method deleted."); } catch (e) { notify(e instanceof Error ? e.message : "Delete failed."); } })(); }}>Delete</button>
        </span>
      ),
    },
  ];

  const set = (patch: Partial<Draft>) => setEditing((current) => (current ? { ...current, draft: { ...current.draft, ...patch } } : current));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const { id, draft } = editing;
    const name = draft.name.trim();
    const next: typeof errors = {};
    if (!name) next.name = "Payment method name is required.";
    else if (methods.some((m) => m.id !== id && m.name.toLowerCase() === name.toLowerCase())) next.name = "Use a unique name for each payment method.";
    if (!draft.type) next.type = "Select a payment type.";
    setErrors(next);
    if (next.name || next.type) return;
    setBusy(true);
    try {
      const body = { name, payment_type: draft.type.toUpperCase().replaceAll(" ", "_"), description: draft.description.trim(), is_active: true, is_default: draft.featured === "yes", requires_reference: false };
      if (apiMode) {
        if (id) await boardsApi.updatePaymentMethod(id, body); else await boardsApi.createPaymentMethod(body);
        await loadFromApi();
      } else {
        const row: PaymentMethod = { id: id ?? uid(), name, type: draft.type, description: draft.description.trim(), featured: draft.featured === "yes" };
        setMethods((rows) => (id ? rows.map((r) => (r.id === id ? row : r)) : [...rows, row]));
      }
      notify(id ? "Payment method updated." : "Payment method created.");
      setEditing(null);
    } catch (e) { notify(e instanceof Error ? e.message : "Could not save payment method."); }
    finally { setBusy(false); }
  }

  return (
    <AccountShell crumb="Payment Methods" search={query} onSearchChange={setQuery} onCreate={() => { setErrors({}); setEditing({ id: null, draft: emptyDraft }); }}>
      <DataTable rows={methods} columns={columns} query={query} searchText={(m) => `${m.name} ${m.type} ${m.description}`} emptyText="No payment methods found." />
      {editing && (
        <Dialog title={editing.id ? "Edit Payment Method" : "Create Payment Method"} description="Add a payment option for your business." onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="grid gap-3.5" noValidate>
            <Field label="Payment Method Name" required error={errors.name}><input autoFocus value={editing.draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g., Gift Voucher" className={fieldClass} /></Field>
            <Field label="Type" required error={errors.type}>
              <select value={editing.draft.type} onChange={(e) => set({ type: e.target.value })} className={fieldClass}>
                <option value="">Select payment type</option>
                {paymentTypes.map((t) => <option key={t} value={t}>{({ BANK_TRANSFER: "Bank Transfer", CARD: "Card", CASH: "Cash", CHEQUE: "Cheque", CUSTOMER_CREDIT: "Customer Credit", MOBILE_MONEY: "Mobile Money" } as Record<string, string>)[t] ?? t}</option>)}
              </select>
            </Field>
            <Field label="Description"><input value={editing.draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Optional payment instructions" className={fieldClass} /></Field>
            <div className="grid gap-1.5">
              <RadioGroup<"yes" | "no"> legend="Featured" name="payment-featured" value={editing.draft.featured} onChange={(featured) => set({ featured })} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
              <p className={`${hintClass} m-0`}>Featured methods appear at checkout. Use a unique name for each payment method.</p>
            </div>
            <div className="mt-1 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>Cancel</button>
              <button type="submit" disabled={busy} className={primaryButton}>{busy ? "Saving…" : editing.id ? "Save Method" : "Create Method"}</button>
            </div>
          </form>
        </Dialog>
      )}
      {toast}
    </AccountShell>
  );
}
