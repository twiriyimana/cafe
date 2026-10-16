"use client";

import { useEffect, useState, type FormEvent } from "react";

import { VENDORS_KEY, useContactList, type CustomerType, type Vendor } from "../../../../lib/contacts-store";
import { boardsApi, getAccessToken, listApiRecords } from "../../../../lib/api-client";
import { ContactDrawer, ContactsLayout, ContactsTable, TypeRadio, contactField, contactLabel, formatContactMoney, type ContactsRole } from "./ContactsLayout";

function VendorForm({ editing, onClose, onSave }: { editing: Vendor | null; onClose: () => void; onSave: (vendor: Vendor) => void }) {
  const [type, setType] = useState<CustomerType>(editing?.type ?? "Business");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      id: editing?.id ?? Date.now(),
      type,
      company: String(form.get("company") || "").trim(),
      contactName: String(form.get("contactName") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      tin: String(form.get("tin") || "").trim(),
      address: String(form.get("address") || "").trim(),
      balance: editing?.balance ?? 0,
    });
  }

  return (
    <ContactDrawer
      title={editing ? "Update Vendor" : "Create New Vendor"}
      description="Enter a vendor's details to add them to your contacts."
      submitLabel={editing ? "Save Vendor" : "Create Vendor"}
      onClose={onClose}
      onSubmit={submit}
    >
      <TypeRadio label="Vendor Type" value={type} onChange={setType} />
      <label className={contactLabel}>Company Name *<input required name="company" defaultValue={editing?.company ?? ""} placeholder="e.g., Kigali Roasters" className={contactField} /></label>
      <label className={contactLabel}>Contact Name *<input required name="contactName" defaultValue={editing?.contactName ?? ""} placeholder="e.g., John Doe" className={contactField} /></label>
      <label className={contactLabel}>Email Address<input name="email" type="email" defaultValue={editing?.email ?? ""} placeholder="e.g., orders@example.com" className={contactField} /></label>
      <label className={contactLabel}>Phone Number *<input required name="phone" type="tel" defaultValue={editing?.phone ?? ""} placeholder="e.g., +250 788 123 456" className={contactField} /></label>
      <label className={contactLabel}>TIN Number<input name="tin" inputMode="numeric" defaultValue={editing?.tin ?? ""} placeholder="Enter TIN" className={contactField} /></label>
      <label className={contactLabel}>Address<textarea name="address" defaultValue={editing?.address ?? ""} placeholder="Vendor address" className="min-h-16 rounded-md border border-[#e2d6c6] bg-white p-2 text-[10px] outline-none placeholder:text-[#a09286] focus:border-[#805336]" /></label>
      <p className="m-0 text-[9px] text-[#8e8074]">Required fields are marked with *.</p>
    </ContactDrawer>
  );
}

export default function VendorsPage({ role }: { role: ContactsRole }) {
  const [vendors, setVendors] = useContactList<Vendor>(VENDORS_KEY);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [apiMode, setApiMode] = useState(false);
  const [, setBusy] = useState(false);

  async function loadFromApi() {
    if (!getAccessToken()) return;
    try {
      const rows = listApiRecords(await boardsApi.suppliers());
      setVendors(rows.map((r) => ({ id: Number(r.id), type: "Business", company: String(r.name ?? ""), contactName: String(r.contact_person ?? ""), email: String(r.email ?? ""), phone: String(r.phone ?? ""), tin: String(r.tax_id ?? ""), address: String(r.address ?? ""), balance: Number(r.balance ?? 0) })));
      setApiMode(true);
    } catch (e) { console.error("Could not load suppliers from API", e); }
  }
  useEffect(() => { void loadFromApi(); }, []);

  const visible = vendors.filter((vendor) => JSON.stringify(vendor).toLowerCase().includes(search.toLowerCase()));

  function close() { setOpen(false); setEditing(null); }
  function save(vendor: Vendor) {
    void (async () => {
      setBusy(true);
      try {
        if (apiMode) {
          const body = { name: vendor.company, contact_person: vendor.contactName, email: vendor.email, phone: vendor.phone, tax_id: vendor.tin, address: vendor.address, status: "active" };
          if (editing) await boardsApi.updateSupplier(editing.id, body);
          else await boardsApi.createSupplier(body);
          await loadFromApi();
        } else setVendors((current) => (editing ? current.map((item) => (item.id === vendor.id ? vendor : item)) : [vendor, ...current]));
        close();
      } catch (e) { window.alert(e instanceof Error ? e.message : "Could not save vendor."); }
      finally { setBusy(false); }
    })();
  }
  function removeVendor(id: number) {
    void (async () => {
      if (!window.confirm("Delete this vendor?")) return;
      try { if (apiMode) await boardsApi.deleteSupplier(id); setVendors((current) => current.filter((item) => item.id !== id)); }
      catch (e) { window.alert(e instanceof Error ? e.message : "Could not delete vendor."); }
    })();
  }

  return (
    <ContactsLayout role={role} title="Vendors" search={search} onSearchChange={setSearch} onCreate={() => { setEditing(null); setOpen(true); }}>
      <ContactsTable
        rows={visible}
        columns={[
          { header: "Vendor Type", render: (v: Vendor) => v.type },
          { header: "Company Name", render: (v: Vendor) => v.company, className: "font-medium" },
          { header: "Contact Name", render: (v: Vendor) => v.contactName },
          { header: "Email Address", render: (v: Vendor) => v.email || "-" },
          { header: "Phone Number", render: (v: Vendor) => v.phone },
          { header: "TIN Number", render: (v: Vendor) => v.tin || "-" },
          { header: "Address", render: (v: Vendor) => v.address || "-", className: "max-w-[180px] truncate" },
          { header: "Balance (RWF)", render: (v: Vendor) => formatContactMoney(v.balance) },
        ]}
        emptyTitle="No vendors yet"
        emptyHint="Click Create New to add your first vendor."
        onEdit={(vendor) => { setEditing(vendor); setOpen(true); }}
        onDelete={removeVendor}
      />
      {open && <VendorForm editing={editing} onClose={close} onSave={save} />}
    </ContactsLayout>
  );
}
