"use client";

import { useState, type FormEvent } from "react";
import { usePersistedState } from "../../../../lib/use-persisted-state";
import AccountShell from "./AccountShell";
import { stationCategories, stationsSeed, uid, type Station, type Status } from "./data";
import { DataTable, Dialog, Field, RadioGroup, fieldClass, primaryButton, rowAction, secondaryButton, useToast, type Column } from "./ui";

type Draft = { name: string; printer: string; category: string; description: string; status: Status };
const emptyDraft: Draft = { name: "", printer: "", category: stationCategories[0], description: "", status: "active" };

export default function StationsPage() {
  const [stations, setStations] = usePersistedState("coffee-account-stations", stationsSeed);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [error, setError] = useState("");
  const [toast, notify] = useToast();

  const columns: Column<Station>[] = [
    { key: "name", label: "Station Name", sortValue: (s) => s.name, render: (s) => <><div>{s.name}</div><div className="mt-1.5 text-[#6f6054]">{s.description || "-"}</div></> },
    { key: "printer", label: "Printer", sortValue: (s) => s.printer, render: (s) => s.printer },
    { key: "category", label: "Assigned Category", sortValue: (s) => s.category, render: (s) => s.category },
    { key: "status", label: "Status", sortValue: (s) => s.status, render: (s) => s.status },
    {
      key: "actions", label: "Actions", sortValue: () => "",
      render: (s) => (
        <span className="flex gap-3">
          <button type="button" className={rowAction} onClick={() => { setError(""); setEditing({ id: s.id, draft: { name: s.name, printer: s.printer, category: s.category, description: s.description, status: s.status } }); }}>Edit</button>
          <button type="button" className={rowAction} onClick={() => { if (window.confirm(`Delete station ${s.name}?`)) { setStations((rows) => rows.filter((r) => r.id !== s.id)); notify("Station deleted."); } }}>Delete</button>
        </span>
      ),
    },
  ];

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const { id, draft } = editing;
    const name = draft.name.trim().toUpperCase();
    if (!name) return setError("Station name is required.");
    if (stations.some((s) => s.id !== id && s.name === name)) return setError("A station with this name already exists.");
    const row: Station = { id: id ?? uid(), name, printer: draft.printer.trim(), category: draft.category, description: draft.description.trim(), status: draft.status };
    setStations((rows) => (id ? rows.map((r) => (r.id === id ? row : r)) : [...rows, row]));
    notify(id ? "Station updated." : "Station created.");
    setEditing(null);
  }

  const set = (patch: Partial<Draft>) => setEditing((current) => (current ? { ...current, draft: { ...current.draft, ...patch } } : current));

  return (
    <AccountShell crumb="Stations" searchPlaceholder="Search stations or add filters..." search={query} onSearchChange={setQuery} onCreate={() => { setError(""); setEditing({ id: null, draft: emptyDraft }); }}>
      <DataTable rows={stations} columns={columns} query={query} searchText={(s) => `${s.name} ${s.printer} ${s.category} ${s.description} ${s.status}`} emptyText="No stations found." />
      {editing && (
        <Dialog title={editing.id ? "Edit Station" : "Create New Station"} description="Set up a preparation or sales point and its printer." onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="grid gap-3.5" noValidate>
            <Field label="Station Name" required error={error}><input autoFocus value={editing.draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g., KITCHEN" className={fieldClass} /></Field>
            <Field label="Printer"><input value={editing.draft.printer} onChange={(e) => set({ printer: e.target.value })} placeholder="e.g., Kitchen printer" className={fieldClass} /></Field>
            <Field label="Assigned Category">
              <select value={editing.draft.category} onChange={(e) => set({ category: e.target.value })} className={fieldClass}>{stationCategories.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label="Description"><input value={editing.draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Optional station details" className={fieldClass} /></Field>
            <RadioGroup<Status> legend="Status" name="station-status" value={editing.draft.status} onChange={(status) => set({ status })} options={[{ value: "active", label: "active" }, { value: "inactive", label: "inactive" }]} />
            <div className="mt-1 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>Cancel</button>
              <button type="submit" className={primaryButton}>{editing.id ? "Save Station" : "Create Station"}</button>
            </div>
          </form>
        </Dialog>
      )}
      {toast}
    </AccountShell>
  );
}
