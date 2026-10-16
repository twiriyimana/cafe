"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePersistedState } from "../../../../lib/use-persisted-state";
import { boardsApi, getAccessToken, listApiRecords } from "../../../../lib/api-client";
import AccountShell from "./AccountShell";
import { businessSeed, permissionTree, staffRoles, staffSeed, uid, type StaffMember, type Status } from "./data";
import { DataTable, Drawer, Field, RadioGroup, fieldClass, hintClass, labelClass, primaryButton, secondaryButton, useToast, type Column } from "./ui";

type Draft = { name: string; email: string; phone: string; role: string; permissions: string[]; password: string; status: Status };
const emptyDraft: Draft = { name: "", email: "", phone: "", role: "", permissions: [], password: "", status: "active" };
type Errors = Partial<Record<"name" | "email" | "role" | "password", string>>;

export default function StaffPage() {
  const [staff, setStaff] = usePersistedState("coffee-account-staff", staffSeed);
  const [business] = usePersistedState("coffee-account-business", businessSeed);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [mainNav, setMainNav] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [toast, notify] = useToast();
  const [apiMode, setApiMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>(staffRoles);

  async function loadFromApi() {
    if (!getAccessToken()) return;
    try {
      const staffPayload = await boardsApi.staff();
      const records = listApiRecords(staffPayload);
      try {
        const roleRecords = listApiRecords(await boardsApi.roles());
        if (roleRecords.length) setAvailableRoles(roleRecords.map((r) => String(r.name ?? r.code ?? "")).filter(Boolean));
      } catch { /* Keep the built-in role choices if the API role list is not permitted. */ }
      setStaff(records.map((r) => {
        const roleValue = r.role && typeof r.role === "object" ? (r.role as Record<string, unknown>).name : r.role_name ?? r.role;
        return { id: String(r.id), name: String(r.full_name ?? `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim()), email: String(r.email ?? ""), phone: String(r.phone ?? ""), role: String(roleValue ?? "Staff"), permissions: [], status: r.is_active === false ? "inactive" : "active" as Status };
      }));
      setApiMode(true);
    } catch (e) { notify(e instanceof Error ? `API staff: ${e.message}` : "Could not load staff accounts from API."); }
  }
  useEffect(() => { void loadFromApi(); }, []);

  const columns: Column<StaffMember>[] = [
    { key: "name", label: "Name", sortValue: (s) => s.name, render: (s) => s.name },
    { key: "email", label: "Email", sortValue: (s) => s.email, render: (s) => s.email },
    { key: "phone", label: "Phone Number", sortValue: (s) => s.phone, render: (s) => s.phone },
    { key: "role", label: "Role", sortValue: (s) => s.role, render: (s) => s.role },
    {
      key: "status", label: "Status", sortValue: (s) => s.status,
      render: (s) => <span className="inline-flex items-center gap-1.5 capitalize"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${s.status === "active" ? "bg-[#1f1a17]" : "bg-[#b9a999]"}`} />{s.status}</span>,
    },
    { key: "actions", label: "Actions", render: (s) => <span className="flex gap-2"><button type="button" className="rounded px-1.5 py-0.5 text-[11px] hover:bg-[#eadcc8]" onClick={() => { setErrors({}); setEditingId(s.id); setMainNav(""); setDraft({ name: s.name, email: s.email, phone: s.phone, role: s.role, permissions: s.permissions, password: "", status: s.status }); }}>Update</button><button type="button" className="rounded px-1.5 py-0.5 text-[11px] text-red-700 hover:bg-red-50" onClick={() => { void (async () => { if (!window.confirm(`Delete staff account ${s.name}?`)) return; try { if (apiMode) await boardsApi.deleteStaff(s.id); setStaff((rows) => rows.filter((r) => r.id !== s.id)); notify("Staff account deleted."); } catch (e) { notify(e instanceof Error ? e.message : "Delete failed."); } })(); }}>Delete</button></span> },
  ];

  const set = (patch: Partial<Draft>) => setDraft((current) => (current ? { ...current, ...patch } : current));
  const subOptions = mainNav ? permissionTree[mainNav] ?? [] : Object.entries(permissionTree).flatMap(([main, subs]) => subs.map((sub) => `${main} › ${sub}`));

  function addPermission(label: string) {
    if (!label) return;
    setDraft((current) => (current && !current.permissions.includes(label) ? { ...current, permissions: [...current.permissions, label] } : current));
  }

  function openCreate() {
    setDraft(emptyDraft); setEditingId(null); setMainNav(""); setErrors({});
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const next: Errors = {};
    if (!draft.name.trim()) next.name = "Full name is required.";
    if (!draft.email.trim()) next.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) next.email = "Enter a valid email address.";
    else if (staff.some((s) => s.id !== editingId && s.email.toLowerCase() === draft.email.trim().toLowerCase())) next.email = "A staff member with this email already exists.";
    if (!draft.role) next.role = "Select a role.";
    if (!editingId && draft.password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      if (apiMode) {
        const words = draft.name.trim().split(/\s+/);
        const body: Record<string, unknown> = { first_name: words.shift() ?? "", last_name: words.join(" "), phone: draft.phone.trim(), role_name: draft.role, is_active: draft.status === "active" };
        if (editingId) await boardsApi.updateStaff(editingId, body);
        else await boardsApi.createStaff({ ...body, email: draft.email.trim(), full_name: draft.name.trim(), password: draft.password, password_confirm: draft.password });
        await loadFromApi();
      } else {
        const row: StaffMember = { id: editingId ?? uid(), name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone.trim(), role: draft.role, permissions: draft.permissions, status: draft.status };
        setStaff((rows) => editingId ? rows.map((r) => r.id === editingId ? row : r) : [...rows, row]);
      }
      notify(editingId ? "Staff account updated." : "Staff account created."); setDraft(null); setEditingId(null);
    } catch (e) { notify(e instanceof Error ? e.message : "Could not save staff account."); }
    finally { setBusy(false); }
  }

  return (
    <AccountShell crumb="Staff" search={query} onSearchChange={setQuery} onCreate={openCreate}>
      <DataTable rows={staff} columns={columns} query={query} searchText={(s) => `${s.name} ${s.email} ${s.phone} ${s.role} ${s.status}`} emptyText="No staff accounts found." />
      {draft && (
        <Drawer title={editingId ? "Update Staff Account" : "Create New Staff Account"} description={`Manage a staff member for ${business.name}`} onClose={() => { setDraft(null); setEditingId(null); }}>
          <form onSubmit={submit} className="grid gap-4" noValidate>
            <Field label="Full Name" required error={errors.name}><input autoFocus value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g., Jane Doe" className={fieldClass} /></Field>
            <Field label="Email Address" required error={errors.email}><input type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} placeholder="e.g., jane@example.com" className={fieldClass} /></Field>
            <Field label="Phone Number"><input type="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="e.g., +250 788 123 456" className={fieldClass} /></Field>
            <div className="grid gap-1.5">
              <Field label="Role" required error={errors.role}>
                <select value={draft.role} onChange={(e) => set({ role: e.target.value })} className={fieldClass}>
                  <option value="">Select role</option>
                  {availableRoles.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <p className={`${hintClass} m-0`}>Available roles come from the API and determine staff permissions.</p>
            </div>

            <fieldset className="m-0 grid gap-2 border-0 p-0">
              <legend className="mb-2 p-0 text-[11px] font-medium text-[#3b2e26]">Permissions</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  <span>Main nav</span>
                  <select value={mainNav} onChange={(e) => { const v = e.target.value; setMainNav(v); if (v) addPermission(v); }} className={fieldClass}>
                    <option value="">Select permissions(or screens)</option>
                    {Object.keys(permissionTree).map((m) => <option key={m}>{m}</option>)}
                  </select>
                </label>
                <label className={labelClass}>
                  <span>Sub nav</span>
                  <select value="" onChange={(e) => { const v = e.target.value; addPermission(mainNav && !v.includes("›") ? `${mainNav} › ${v}` : v); }} className={fieldClass}>
                    <option value="">Select permissions(or screens)</option>
                    {subOptions.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <div aria-label="Selected permissions" className="flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-lg border border-[#e6dccd] bg-[#fffaf3] px-3 py-2 text-[12px]">
                {draft.permissions.length === 0 && <span className="text-[#9a8c80]">Selected permissions(Screen)</span>}
                {draft.permissions.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 rounded-md bg-[#eadcc8] px-2 py-1 text-[10px] text-[#3b2e26]">
                    {p}
                    <button type="button" aria-label={`Remove ${p}`} onClick={() => set({ permissions: draft.permissions.filter((x) => x !== p) })} className="text-sm leading-none">×</button>
                  </span>
                ))}
              </div>
            </fieldset>

            {!editingId ? <div className="grid gap-1.5">
              <Field label="Temporary Password" required error={errors.password}><input type="password" autoComplete="new-password" value={draft.password} onChange={(e) => set({ password: e.target.value })} placeholder="Enter a secure password" className={fieldClass} /></Field>
              <p className={`${hintClass} m-0`}>Use at least 8 characters. Staff must change their password on first sign in.</p>
            </div> : <p className={`${hintClass} m-0`}>Password changes are managed through the API password-change workflow.</p>}

            <RadioGroup<Status> legend="Status" name="staff-status" value={draft.status} onChange={(status) => set({ status })} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />

            <div className="mt-2 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setDraft(null)} className={`${secondaryButton} h-10`}>Cancel</button>
              <button type="submit" disabled={busy} className={`${primaryButton} h-10`}>{busy ? "Saving…" : editingId ? "Save Changes" : "Create Account"}</button>
            </div>
          </form>
        </Drawer>
      )}
      {toast}
    </AccountShell>
  );
}
