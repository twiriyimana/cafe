"use client";

import { useState, type FormEvent } from "react";

import { useContactList } from "../../../../lib/contacts-store";
import { ACCOUNTS_KEY, ACCOUNT_TYPES, DEFAULT_ACCOUNTS, type Account, type AccountType } from "../../../../lib/reports-store";
import { ContactsTable, contactField, contactLabel, formatContactMoney } from "../contacts/ContactsLayout";
import { ReportsLayout, type ReportsRole } from "./ReportsLayout";

function AccountDialog({ editing, accounts, onClose, onSave }: { editing: Account | null; accounts: Account[]; onClose: () => void; onSave: (account: Account) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      id: editing?.id ?? Date.now(),
      name: String(form.get("name") || "").trim(),
      code: String(form.get("code") || "").trim(),
      type: String(form.get("type") || "Asset") as AccountType,
      parent: String(form.get("parent") || ""),
      description: String(form.get("description") || "").trim(),
      balance: editing?.balance ?? 0,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#21130f]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" className="max-h-[90svh] w-full max-w-sm overflow-y-auto rounded-xl border border-[#e5dacd] bg-[#fcf9f4] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="account-dialog-title" className="m-0 text-sm font-semibold">{editing ? "Update Account" : "Create New Account"}</h2>
          <button type="button" onClick={onClose} aria-label="Close form" className="rounded-md px-2 text-lg leading-none text-[#817367] hover:bg-[#f0e5d4]">×</button>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <label className={contactLabel}>Account Name<input required name="name" defaultValue={editing?.name ?? ""} placeholder="e.g., Petty Cash" className={contactField} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className={contactLabel}>Account Code<input required name="code" defaultValue={editing?.code ?? ""} placeholder="e.g., 1010" className={contactField} /></label>
            <label className={contactLabel}>Account Type
              <select name="type" defaultValue={editing?.type ?? "Asset"} className={contactField}>
                {ACCOUNT_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
          </div>
          <label className={contactLabel}>Parent Account
            <select name="parent" defaultValue={editing?.parent ?? ""} className={contactField}>
              <option value="">None</option>
              {accounts.filter((account) => account.id !== editing?.id).map((account) => <option key={account.id} value={account.name}>{account.name}</option>)}
            </select>
          </label>
          <label className={contactLabel}>Description<textarea name="description" defaultValue={editing?.description ?? ""} placeholder="What is this account used for?" className="min-h-16 rounded-md border border-[#e2d6c6] bg-white p-2 text-[10px] outline-none placeholder:text-[#a09286] focus:border-[#805336]" /></label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-8 rounded-md border border-[#e2d6c6] bg-white px-4 text-[10px]">Cancel</button>
            <button type="submit" className="h-8 rounded-md bg-[#805336] px-4 text-[10px] font-medium text-white hover:bg-[#6a4229]">{editing ? "Save Account" : "Create Account"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function ChartOfAccountsPage({ role }: { role: ReportsRole }) {
  const [accounts, setAccounts] = useContactList<Account>(ACCOUNTS_KEY, DEFAULT_ACCOUNTS);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const visible = accounts.filter((account) => JSON.stringify(account).toLowerCase().includes(search.toLowerCase()));

  function close() { setOpen(false); setEditing(null); }
  function downloadReport() {
    const headers = ["Account Name", "Account Code", "Description", "Parent Account", "Type", "Balance (RWF)"];
    const rows = visible.map((a) => [a.name, a.code, a.description, a.parent, a.type, a.balance]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "chart-of-accounts-report.csv"; link.click(); URL.revokeObjectURL(url);
  }

  function save(account: Account) {
    setAccounts((current) => (editing ? current.map((item) => (item.id === account.id ? account : item)) : [...current, account]));
    close();
  }

  return (
    <ReportsLayout role={role} title="Chart of Accounts" search={search} onSearchChange={setSearch} createLabel="Create New" onCreate={() => { setEditing(null); setOpen(true); }} actionLabel="Download Report" onAction={downloadReport} actionDisabled={visible.length === 0}>
      <ContactsTable
        rows={visible}
        columns={[
          {
            header: "Account Name",
            render: (a: Account) => (
              <div className="py-1.5 leading-tight">
                <div className="font-medium">{a.name}</div>
                <div className="text-[9px] text-[#9b8d81]">{a.code}</div>
              </div>
            ),
          },
          { header: "Description", render: (a: Account) => a.description || "-", className: "max-w-[260px] truncate" },
          { header: "Parent Account", render: (a: Account) => a.parent || "-" },
          { header: "Type", render: (a: Account) => a.type },
          { header: "Balance (RWF)", render: (a: Account) => formatContactMoney(a.balance) },
        ]}
        emptyTitle="No accounts yet"
        emptyHint="Click Create New to add an account."
        onEdit={(account) => { setEditing(account); setOpen(true); }}
        onDelete={(id) => setAccounts((current) => current.filter((item) => item.id !== id))}
      />
      {open && <AccountDialog editing={editing} accounts={accounts} onClose={close} onSave={save} />}
    </ReportsLayout>
  );
}
