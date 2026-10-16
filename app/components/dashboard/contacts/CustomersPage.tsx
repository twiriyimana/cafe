"use client";

import { useState, type FormEvent } from "react";

import { CUSTOMERS_KEY, useContactList, type Customer, type CustomerType } from "../../../../lib/contacts-store";
import { ContactDrawer, ContactsLayout, ContactsTable, TypeRadio, contactField, contactLabel, formatContactMoney, type ContactsRole } from "./ContactsLayout";

function CustomerForm({ editing, onClose, onSave }: { editing: Customer | null; onClose: () => void; onSave: (customer: Customer) => void }) {
  const [type, setType] = useState<CustomerType>(editing?.type ?? "Individual");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      id: editing?.id ?? Date.now(),
      type,
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      company: type === "Business" ? String(form.get("company") || "").trim() : "",
      tin: String(form.get("tin") || "").trim(),
      balance: editing?.balance ?? 0,
    });
  }

  return (
    <ContactDrawer
      title={editing ? "Update Customer" : "Create New Customer"}
      description="Enter a customer's details to add them to your contacts."
      submitLabel={editing ? "Save Customer" : "Create Customer"}
      onClose={onClose}
      onSubmit={submit}
    >
      <TypeRadio label="Customer Type" value={type} onChange={setType} />
      {type === "Business" && (
        <label className={contactLabel}>Company Name<input name="company" defaultValue={editing?.company ?? ""} placeholder="e.g., Mug & Bean Ltd" className={contactField} /></label>
      )}
      <label className={contactLabel}>Full Name<input required name="name" defaultValue={editing?.name ?? ""} placeholder="e.g., John Doe" className={contactField} /></label>
      <label className={contactLabel}>Email Address<input name="email" type="email" defaultValue={editing?.email ?? ""} placeholder="e.g., john@example.com" className={contactField} /></label>
      <label className={contactLabel}>Phone Number<input name="phone" type="tel" defaultValue={editing?.phone ?? ""} placeholder="e.g., +250 788 123 456" className={contactField} /></label>
      <label className={contactLabel}>TIN Number<input name="tin" inputMode="numeric" defaultValue={editing?.tin ?? ""} placeholder="Enter TIN" className={contactField} /></label>
    </ContactDrawer>
  );
}

export default function CustomersPage({ role }: { role: ContactsRole }) {
  const [customers, setCustomers] = useContactList<Customer>(CUSTOMERS_KEY);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const visible = customers.filter((customer) => JSON.stringify(customer).toLowerCase().includes(search.toLowerCase()));

  function close() { setOpen(false); setEditing(null); }
  function save(customer: Customer) {
    setCustomers((current) => (editing ? current.map((item) => (item.id === customer.id ? customer : item)) : [customer, ...current]));
    close();
  }

  return (
    <ContactsLayout role={role} title="Customers" search={search} onSearchChange={setSearch} onCreate={() => { setEditing(null); setOpen(true); }}>
      <ContactsTable
        rows={visible}
        columns={[
          { header: "Customer Type", render: (c: Customer) => c.type },
          { header: "Company Name", render: (c: Customer) => c.company || "-" },
          { header: "Full Name", render: (c: Customer) => c.name, className: "font-medium" },
          { header: "Email Address", render: (c: Customer) => c.email || "-" },
          { header: "Phone Number", render: (c: Customer) => c.phone || "-" },
          { header: "TIN Number", render: (c: Customer) => c.tin || "-" },
          { header: "Balance (RWF)", render: (c: Customer) => formatContactMoney(c.balance) },
        ]}
        emptyTitle="No customers yet"
        emptyHint="Click Create New to add your first customer."
        onEdit={(customer) => { setEditing(customer); setOpen(true); }}
        onDelete={(id) => setCustomers((current) => current.filter((item) => item.id !== id))}
      />
      {open && <CustomerForm editing={editing} onClose={close} onSave={save} />}
    </ContactsLayout>
  );
}
