"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import brandImage from "../../../images/ima.png";
import { usePersistedState } from "../../../../lib/use-persisted-state";
import { boardsApi, getAccessToken, listApiRecords } from "../../../../lib/api-client";
import AccountShell from "./AccountShell";
import { businessCategories, businessSeed, currencies, timezones, type BusinessDetails } from "./data";
import { Field, cardClass, darkButton, fieldClass, useToast } from "./ui";

export default function BusinessPage() {
  const [saved, setSaved] = usePersistedState("coffee-account-business", businessSeed);
  const [form, setForm] = useState<BusinessDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, notify] = useToast();
  const [apiId, setApiId] = useState<string | null>(null);
  const [apiMode, setApiMode] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) return;
    void (async () => {
      try {
        const rows = listApiRecords(await boardsApi.business());
        const r = rows[0];
        if (!r) return;
        setApiId(String(r.id)); setApiMode(true);
        setSaved({ ...saved, name: String(r.name ?? ""), category: String(r.category ?? "Cafe"), email: String(r.email ?? ""), phone: String(r.phone ?? ""), tin: String(r.tin ?? ""), address: String(r.address ?? ""), currency: String(r.currency ?? "RWF"), timezone: String(r.timezone ?? "Africa/Kigali") });
      } catch (e) { notify(e instanceof Error ? `API business profile: ${e.message}` : "Could not load business profile."); }
    })();
  // Load once after mount; persisted state is the fallback when the API is unavailable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const values = form ?? saved;
  const set = (patch: Partial<BusinessDetails>) => setForm({ ...values, ...patch });

  function saveDetails(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Business name is required.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) return;
    void (async () => {
      setBusy(true);
      try {
        const body = { name: values.name.trim(), category: values.category, email: values.email, phone: values.phone, tin: values.tin, address: values.address, currency: values.currency, timezone: values.timezone };
        if (apiMode && apiId) await boardsApi.updateBusiness(apiId, body);
        setSaved({ ...saved, ...body }); setForm(null); notify("Business details saved.");
      } catch (e) { notify(e instanceof Error ? e.message : "Could not save business details."); }
      finally { setBusy(false); }
    })();
  }

  function savePreferences(event: FormEvent) {
    event.preventDefault();
    void (async () => {
      setBusy(true);
      try {
        const body = { currency: values.currency, timezone: values.timezone };
        if (apiMode && apiId) await boardsApi.updateBusiness(apiId, body);
        setSaved({ ...saved, ...body, receiptNotes: values.receiptNotes }); setForm(null); notify("Preferences saved.");
      } catch (e) { notify(e instanceof Error ? e.message : "Could not save preferences."); }
      finally { setBusy(false); }
    })();
  }

  return (
    <AccountShell crumb="Business Settings">
      <div className="grid gap-4">
        <form onSubmit={saveDetails} noValidate className={cardClass}>
          <h2 className="m-0 mb-3 text-[15px] font-semibold text-[#2b1d15]">Details</h2>
          <div className="mb-3 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-[#eadcc8]"><Image src={brandImage} alt="Business logo" width={56} height={56} className="object-contain" /></span>
            <span className="text-[11px] text-[#3b2e26]">Logo / Icon</span>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Name" required error={errors.name}><input value={values.name} onChange={(e) => set({ name: e.target.value })} className={fieldClass} /></Field></div>
            <div className="sm:col-span-2"><Field label="Category"><select value={values.category} onChange={(e) => set({ category: e.target.value })} className={fieldClass}>{businessCategories.map((c) => <option key={c}>{c}</option>)}</select></Field></div>
            <Field label="Email" error={errors.email}><input type="email" value={values.email} onChange={(e) => set({ email: e.target.value })} placeholder="business@example.com" className={fieldClass} /></Field>
            <Field label="Phone"><input type="tel" value={values.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="25078..." className={fieldClass} /></Field>
            <div className="sm:col-span-2"><Field label="TIN"><input value={values.tin} onChange={(e) => set({ tin: e.target.value })} className={fieldClass} /></Field></div>
            <div className="sm:col-span-2"><Field label="Address"><input value={values.address} onChange={(e) => set({ address: e.target.value })} placeholder="Business address" className={fieldClass} /></Field></div>
          </div>
          <div className="mt-4 flex justify-end"><button disabled={busy} className={darkButton}>{busy ? "Saving…" : "Save Details"}</button></div>
        </form>

        <form onSubmit={savePreferences} className={cardClass}>
          <h2 className="m-0 mb-3 text-[15px] font-semibold text-[#2b1d15]">Preferences</h2>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Currency"><select value={values.currency} onChange={(e) => set({ currency: e.target.value })} className={fieldClass}>{currencies.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></Field>
            <Field label="Timezone"><select value={values.timezone} onChange={(e) => set({ timezone: e.target.value })} className={fieldClass}>{timezones.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <div className="sm:col-span-2"><Field label="Receipt Footer Notes"><input value={values.receiptNotes} onChange={(e) => set({ receiptNotes: e.target.value })} placeholder="Notes to display on receipts" className={fieldClass} /></Field></div>
          </div>
          <div className="mt-4 flex justify-end"><button disabled={busy} className={darkButton}>{busy ? "Saving…" : "Save Preferences"}</button></div>
        </form>
      </div>
      {toast}
    </AccountShell>
  );
}
