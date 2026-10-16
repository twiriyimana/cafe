"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import brandImage from "../../../images/ima.png";
import { usePersistedState } from "../../../../lib/use-persisted-state";
import AccountShell from "./AccountShell";
import { ecommerceSeed, type Ecommerce } from "./data";
import { Field, cardClass, darkButton, fieldClass, useToast } from "./ui";

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function EcommercePage() {
  const [saved, setSaved] = usePersistedState("coffee-account-ecommerce", ecommerceSeed);
  const [form, setForm] = useState<Ecommerce | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, notify] = useToast();

  const values = form ?? saved;
  const set = (patch: Partial<Ecommerce>) => setForm({ ...values, ...patch });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    const slug = slugify(values.slug);
    if (values.enabled && !values.shopName.trim()) next.shopName = "Shop name is required to enable e-commerce.";
    if (values.enabled && !slug) next.slug = "Shop domain is required to enable e-commerce.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaved({ ...values, slug });
    setForm(null);
    notify("E-commerce settings saved.");
  }

  return (
    <AccountShell crumb="E-commerce Settings">
      <form onSubmit={submit} noValidate className={cardClass}>
        <h2 className="m-0 mb-3 text-[15px] font-semibold text-[#2b1d15]">Online Shop</h2>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><div className="text-[12px] text-[#2b1d15]">Enable E-commerce</div><div className="mt-1 text-[10px] text-[#8b7d70]">Make your catalogue available online</div></div>
          <button type="button" role="switch" aria-checked={values.enabled} aria-label="Enable E-commerce" onClick={() => set({ enabled: !values.enabled })} className={`relative h-5 w-9 shrink-0 rounded-full border transition ${values.enabled ? "border-[#805336] bg-[#805336]" : "border-[#e6dccd] bg-[#efe6d8]"}`}>
            <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${values.enabled ? "left-[18px]" : "left-0.5"}`} />
          </button>
        </div>

        <div className="mb-4"><div className="mb-2 text-[11px] font-medium text-[#3b2e26]">Shop Logo</div><span className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-[#eadcc8]"><Image src={brandImage} alt="Shop logo" width={56} height={56} className="object-contain" /></span></div>

        <div className="grid gap-3.5">
          <Field label="Shop Name" error={errors.shopName}><input value={values.shopName} onChange={(e) => set({ shopName: e.target.value })} className={fieldClass} /></Field>
          <Field label="Shop Domain" error={errors.slug}>
            <span className="flex h-11 items-center gap-1 rounded-lg border border-[#e6dccd] bg-[#fffaf3] px-3.5 text-[12px] focus-within:border-[#805336] focus-within:ring-2 focus-within:ring-[#805336]/15">
              <span className="shrink-0 text-[#6f6054]">usekayko.com/shop/</span>
              <input value={values.slug} onChange={(e) => set({ slug: e.target.value })} aria-label="Shop slug" className="min-w-0 flex-1 bg-transparent outline-none" />
            </span>
          </Field>

          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2 p-0 text-[11px] font-medium text-[#3b2e26]">Catalogue Design</legend>
            <button type="button" onClick={() => set({ design: "default" })} aria-pressed={values.design === "default"} className="w-full max-w-[300px] rounded-xl border-2 border-[#3f7d57] bg-[#fffaf3] p-2 text-left">
              <span className="grid h-[132px] grid-cols-[1fr_88px_1fr] overflow-hidden rounded-md bg-[#0b0b0a]" aria-hidden="true">
                <span />
                <span className="grid content-start gap-1.5 bg-white p-2 text-[7px] text-[#30251f]"><b>kayko</b><span className="h-[58px] rounded bg-[#e3ded6]" /><span>Caramel Coffee</span><span className="text-[6px] text-[#6f6054]">5,000 RWF</span></span>
                <span />
              </span>
              <span className="mt-2.5 block px-1 text-[12px] text-[#2b1d15]">Default Catalogue</span>
              <span className="mb-1 block px-1 text-[10px] text-[#8b7d70]">Mobile-first clean product catalog</span>
            </button>
          </fieldset>

          <Field label="Footer"><input value={values.footer} onChange={(e) => set({ footer: e.target.value })} placeholder="© 2026 Your business name" className={fieldClass} /></Field>
        </div>
        <div className="mt-4 flex justify-end"><button className={darkButton}>Save E-commerce Settings</button></div>
      </form>
      {toast}
    </AccountShell>
  );
}
