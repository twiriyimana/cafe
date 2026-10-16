"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePersistedState } from "../../../../lib/use-persisted-state";
import { boardsApi, getAccessToken, listApiRecords } from "../../../../lib/api-client";
import AccountShell from "./AccountShell";
import { floorsSeed, uid, type Floor, type Status } from "./data";
import { DataTable, Dialog, Field, RadioGroup, fieldClass, hintClass, primaryButton, rowAction, secondaryButton, useToast, type Column } from "./ui";

type Draft = { id: string | null; name: string; tables: string; description: string; status: Status };
const freshDraft = (): Draft => ({ id: null, name: "", tables: "", description: "", status: "active" });

export default function FloorsPage() {
  const [floors, setFloors] = usePersistedState("coffee-account-floors", floorsSeed);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<{ name?: string; tables?: string }>({});
  const [toast, notify] = useToast();
  const [apiMode, setApiMode] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadFromApi() {
    if (!getAccessToken()) return;
    try {
      const businesses = listApiRecords(await boardsApi.business());
      const business = businesses[0];
      if (!business?.id) throw new Error("No business profile was returned by the API.");
      const id = String(business.id);
      setBusinessId(id);
      const rows = listApiRecords(await boardsApi.floors(id));
      setFloors(rows.map((r) => ({ id: String(r.id), name: String(r.name ?? ""), tables: Number(r.tables_count ?? 0), description: String(r.description ?? ""), status: r.is_active === false ? "inactive" : "active" })));
      setApiMode(true);
    } catch (e) { notify(e instanceof Error ? `API floors: ${e.message}` : "Could not load floors from API."); }
  }
  useEffect(() => { void loadFromApi(); }, []);

  const columns: Column<Floor>[] = [
    { key: "name", label: "Floor Name", sortValue: (f) => f.name, render: (f) => <><div>{f.name}</div><div className="mt-1.5 text-[#6f6054]">{f.description || "-"}</div></> },
    { key: "tables", label: "Table Quantity", sortValue: (f) => f.tables, render: (f) => f.tables },
    { key: "status", label: "Status", sortValue: (f) => f.status, render: (f) => f.status },
    { key: "actions", label: "Actions", render: (f) => <span className="flex gap-2"><button type="button" className={rowAction} onClick={() => { setErrors({}); setEditing({ id: f.id, name: f.name, tables: String(f.tables), description: f.description, status: f.status }); }}>Update</button><button type="button" className={`${rowAction} text-red-700`} onClick={() => { void (async () => { if (!window.confirm(`Delete floor ${f.name}?`)) return; try { if (apiMode && businessId) await boardsApi.deleteFloor(businessId, f.id); setFloors((rows) => rows.filter((r) => r.id !== f.id)); notify("Floor deleted."); } catch (e) { notify(e instanceof Error ? e.message : "Delete failed."); } })(); }}>Delete</button></span> },
  ];

  function openCreate() { setErrors({}); setEditing(freshDraft()); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const next: typeof errors = {};
    const name = editing.name.trim().toUpperCase();
    const count = Number(editing.tables);
    if (!name) next.name = "Floor name is required.";
    else if (floors.some((f) => f.id !== editing.id && f.name.toUpperCase() === name)) next.name = "A floor with this name already exists.";
    if (!Number.isInteger(count) || count < 0) next.tables = "Enter a valid table quantity.";
    setErrors(next);
    if (next.name || next.tables) return;
    setBusy(true);
    try {
      if (apiMode && businessId) {
        const body = { name, description: editing.description.trim(), is_active: editing.status === "active", display_order: 0 };
        if (editing.id) await boardsApi.updateFloor(businessId, editing.id, body);
        else await boardsApi.createFloor(businessId, body);
        await loadFromApi();
      } else {
        const row: Floor = { id: editing.id ?? uid(), name, tables: count, description: editing.description.trim(), status: editing.status };
        setFloors((rows) => editing.id ? rows.map((r) => r.id === editing.id ? row : r) : [...rows, row]);
      }
      notify(editing.id ? "Floor updated." : "Floor created."); setEditing(null);
    } catch (e) { notify(e instanceof Error ? e.message : "Could not save floor."); }
    finally { setBusy(false); }
  }

  return <AccountShell crumb="Floors" searchPlaceholder="Search floors or add filters..." search={query} onSearchChange={setQuery} onCreate={openCreate}>
    <DataTable rows={floors} columns={columns} query={query} searchText={(f) => `${f.name} ${f.tables} ${f.description} ${f.status}`} emptyText="No floors found." />
    {editing && <Dialog title={editing.id ? "Update Floor" : "Create New Floor"} description="Manage a seating area for this business." onClose={() => setEditing(null)}>
      <form onSubmit={submit} className="grid gap-3.5" noValidate>
        <Field label="Floor Name" required error={errors.name}><input autoFocus value={editing.name} onChange={(e) => setEditing((d) => d ? { ...d, name: e.target.value } : d)} placeholder="e.g., TERRACE" className={fieldClass} /></Field>
        <Field label="Table Quantity" required error={errors.tables}><input inputMode="numeric" value={editing.tables} onChange={(e) => setEditing((d) => d ? { ...d, tables: e.target.value } : d)} placeholder="e.g., 10" className={fieldClass} /></Field>
        <p className={`${hintClass} m-0`}>The API stores floor details and the table count is calculated from tables assigned to the floor.</p>
        <Field label="Description"><input value={editing.description} onChange={(e) => setEditing((d) => d ? { ...d, description: e.target.value } : d)} placeholder="Optional seating area details" className={fieldClass} /></Field>
        <RadioGroup<Status> legend="Status" name="floor-status" value={editing.status} onChange={(status) => setEditing((d) => d ? { ...d, status } : d)} options={[{ value: "active", label: "active" }, { value: "inactive", label: "inactive" }]} />
        <div className="mt-1 flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className={secondaryButton}>Cancel</button><button type="submit" disabled={busy} className={primaryButton}>{busy ? "Saving…" : editing.id ? "Save Changes" : "Create Floor"}</button></div>
      </form>
    </Dialog>}
    {toast}
  </AccountShell>;
}
