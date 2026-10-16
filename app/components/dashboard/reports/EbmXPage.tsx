"use client";

import { useState } from "react";

import { useContactList } from "../../../../lib/contacts-store";
import { SALES_KEY, VAT_RATE, saleTotal, splitVat, type SaleLike } from "../../../../lib/reports-store";
import { formatContactMoney } from "../contacts/ContactsLayout";
import { ReportsLayout, type ReportsRole } from "./ReportsLayout";

type Line = [label: string, value: string];

function localDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function EbmXPage({ role }: { role: ReportsRole }) {
  const [sales] = useContactList<SaleLike>(SALES_KEY);
  const [search, setSearch] = useState("");

  const now = new Date();
  const today = localDate(now);
  const todays = sales.filter((sale) => sale.date === today);
  const totalSales = todays.reduce((sum, sale) => sum + saleTotal(sale), 0);
  const { taxable, tax } = splitVat(totalSales);
  const money = formatContactMoney;

  const sections: { title: string; lines: Line[] }[] = [
    { title: "Sales", lines: [["Number of sales (NS)", String(todays.length)], ["Total sales amount", money(totalSales)], ["Total discounts", money(0)], ["Net sales amount", money(totalSales)]] },
    { title: "Refunds", lines: [["Number of refunds (NR)", "0"], ["Total refund amount", money(0)]] },
    {
      title: "Sales by Tax Rate",
      lines: [
        ["A-EX taxable amount", money(0)], ["A-EX tax amount", money(0)],
        [`B-${VAT_RATE}% taxable amount`, money(taxable)], [`B-${VAT_RATE}% tax amount`, money(tax)],
        ["C taxable amount", money(0)], ["C tax amount", money(0)],
        ["D taxable amount", money(0)], ["D tax amount", money(0)],
      ],
    },
    { title: "Total Tax", lines: [["Total taxable amount", money(taxable)], ["Total tax amount", money(tax)]] },
  ];

  const q = search.toLowerCase();
  const shown = sections
    .map((section) => ({ ...section, lines: section.lines.filter(([label]) => `${section.title} ${label}`.toLowerCase().includes(q)) }))
    .filter((section) => section.lines.length > 0);

  return (
    <ReportsLayout role={role} title="EBM X" search={search} onSearchChange={setSearch} actionLabel="Download Report" onAction={() => { const csv = ["Section,Item,Value", ...sections.flatMap((section) => section.lines.map(([label, value]) => `"${section.title}","${label.replace(/"/g, '""')}","${value.replace(/"/g, '""')}"`))].join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "ebm-x-report.csv"; link.click(); URL.revokeObjectURL(url); }}>
      <section className="relative z-10 min-h-0 flex-1 overflow-auto p-3 sm:p-4">
        <article className="mx-auto max-w-4xl rounded-lg border border-[#e5dacd] bg-[#fcf9f4]/95 p-5 shadow-[0_2px_10px_rgba(72,48,30,0.04)]">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ebe2d7] pb-4">
            <div>
              <h1 className="m-0 text-base font-semibold tracking-tight">Mug &amp; Bean Cafe Ltd</h1>
              <p className="mb-0 mt-1 text-[10px] text-[#8e8074]">Kigali, Rwanda</p>
            </div>
            <div className="text-right text-[10px] text-[#8e8074]">
              <p className="m-0 text-sm font-semibold text-[#392d26]">X Report</p>
              <p className="mb-0 mt-1">{now.toLocaleDateString()}</p>
              <p className="mb-0 mt-0.5">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </header>

          {shown.length === 0 && <p className="mt-6 text-center text-[10px] text-[#8e8074]">No matching lines.</p>}
          {shown.map((section) => (
            <div key={section.title} className="mt-4">
              <h2 className="m-0 mb-1 text-[11px] font-semibold text-[#4b3b2f]">{section.title}</h2>
              <dl className="m-0">
                {section.lines.map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-[#eee6dc] py-1.5 text-[10px] text-[#55463a]">
                    <dt>{label}</dt>
                    <dd className="m-0 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          <p className="mb-0 mt-5 text-[9px] text-[#a09387]">Totals cover today&apos;s recorded sales ({today}). Sale prices are treated as VAT-inclusive at {VAT_RATE}%.</p>
        </article>
      </section>
    </ReportsLayout>
  );
}
