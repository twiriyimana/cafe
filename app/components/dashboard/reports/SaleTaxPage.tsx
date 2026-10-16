"use client";

import { useState } from "react";

import { CUSTOMERS_KEY, useContactList, type Customer } from "../../../../lib/contacts-store";
import { SALES_KEY, buildTaxRecords, type SaleLike, type TaxRecord } from "../../../../lib/reports-store";
import { ContactsTable, formatContactMoney } from "../contacts/ContactsLayout";
import { ReportsLayout, type ReportsRole } from "./ReportsLayout";

function toCsv(rows: TaxRecord[]) {
  const header = ["Date", "Invoice No.", "Customer", "Customer TIN", "Taxable Amount", "Tax Rate (%)", "Tax Amount", "Total Amount"];
  const lines = rows.map((r) => [r.date, r.invoice, r.customer, r.tin, r.taxable, r.rate, r.tax, r.total].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  return [header.join(","), ...lines].join("\n");
}

export default function SaleTaxPage({ role }: { role: ReportsRole }) {
  const [sales] = useContactList<SaleLike>(SALES_KEY);
  const [customers] = useContactList<Customer>(CUSTOMERS_KEY);
  const tinByCustomer = Object.fromEntries(customers.filter((c) => c.tin).map((c) => [c.name.toLowerCase(), c.tin]));
  const records = buildTaxRecords(sales, tinByCustomer);
  const [search, setSearch] = useState("");

  const visible = records.filter((record) => JSON.stringify(record).toLowerCase().includes(search.toLowerCase()));

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([toCsv(visible)], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "sale-tax-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ReportsLayout role={role} title="Sale Tax" search={search} onSearchChange={setSearch} actionLabel="Export" onAction={exportCsv} actionDisabled={visible.length === 0}>
      <ContactsTable
        rows={visible}
        columns={[
          { header: "Date", render: (r: TaxRecord) => r.date },
          { header: "Invoice No.", render: (r: TaxRecord) => r.invoice, className: "font-medium" },
          { header: "Customer", render: (r: TaxRecord) => r.customer || "-" },
          { header: "Customer TIN", render: (r: TaxRecord) => r.tin || "-" },
          { header: "Taxable Amount", render: (r: TaxRecord) => formatContactMoney(r.taxable) },
          { header: "Tax Rate", render: (r: TaxRecord) => `${r.rate}%` },
          { header: "Tax Amount", render: (r: TaxRecord) => formatContactMoney(r.tax) },
          { header: "Total Amount", render: (r: TaxRecord) => formatContactMoney(r.total) },
        ]}
        emptyTitle="No tax records found"
        emptyHint="Record a sale under Transactions › Sales and it will appear here."
      />
    </ReportsLayout>
  );
}
