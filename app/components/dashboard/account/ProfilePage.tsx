"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePersistedState } from "../../../../lib/use-persisted-state";
import AccountShell from "./AccountShell";
import { languages, profileSeed, type Profile } from "./data";
import { Field, cardClass, darkButton, fieldClass, useToast } from "./ui";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "CD";

export default function ProfilePage() {
  const [saved, setSaved] = usePersistedState("coffee-account-profile", profileSeed);
  const [form, setForm] = useState<Profile | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const photoRef = useRef<string | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => () => { if (photoRef.current) URL.revokeObjectURL(photoRef.current); }, []);

  const values = form ?? saved;
  const lang = language ?? saved.language;
  const set = (patch: Partial<Profile>) => setForm({ ...values, ...patch });

  function saveDetails(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!values.fullName.trim()) next.fullName = "Full name is required.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaved({ ...saved, ...values, fullName: values.fullName.trim(), language: lang });
    setForm(null);
    notify("Profile details saved.");
  }

  function savePreferences(event: FormEvent) {
    event.preventDefault();
    setSaved({ ...saved, language: lang });
    notify("Preferences saved.");
  }

  function changePassword(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!passwords.current) next.current = "Enter your current password.";
    if (passwords.next.length < 8) next.next = "Use at least 8 characters.";
    if (passwords.confirm !== passwords.next) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    // No backend is connected yet: nothing is stored, the form is just validated and cleared.
    setPasswords({ current: "", next: "", confirm: "" });
    notify("Password updated.");
  }

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, photo: "Choose a JPG or PNG up to 5MB." }));
      return;
    }
    if (photoRef.current) URL.revokeObjectURL(photoRef.current);
    photoRef.current = URL.createObjectURL(file);
    setPhoto(photoRef.current);
    setErrors((e) => ({ ...e, photo: "" }));
  }

  return (
    <AccountShell crumb="Profile Settings">
      <div className="grid gap-4">
        <form onSubmit={saveDetails} noValidate className={cardClass}>
          <h2 className="m-0 mb-3 text-[15px] font-semibold text-[#2b1d15]">Details</h2>
          <div className="mb-3 flex items-center gap-4">
            <label className="relative grid h-16 w-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-[#eadcc8] text-2xl text-[#2b1d15]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photo ? <img src={photo} alt="Profile" className="h-full w-full object-cover" /> : initials(values.fullName)}
              <input type="file" accept="image/png,image/jpeg" className="sr-only" aria-label="Upload profile picture" onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </label>
            <div className="text-[10px] text-[#6f6054]"><div className="text-[11px] text-[#3b2e26]">Profile Picture</div><div className="mt-1">JPG or PNG, max 5MB</div>{errors.photo && <div className="mt-1 font-medium text-[#a8432f]">{errors.photo}</div>}</div>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Full Name" required error={errors.fullName}><input value={values.fullName} onChange={(e) => set({ fullName: e.target.value })} className={fieldClass} /></Field></div>
            <Field label="Email" error={errors.email}><input type="email" value={values.email} onChange={(e) => set({ email: e.target.value })} className={fieldClass} /></Field>
            <Field label="Phone Number"><input type="tel" value={values.phone} onChange={(e) => set({ phone: e.target.value })} className={fieldClass} /></Field>
            <Field label="Gender"><select value={values.gender} onChange={(e) => set({ gender: e.target.value })} className={fieldClass}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></Field>
            <Field label="Date of Birth"><input type="date" value={values.dob} onChange={(e) => set({ dob: e.target.value })} className={fieldClass} /></Field>
          </div>
          <div className="mt-4 flex justify-end"><button className={darkButton}>Save Changes</button></div>
        </form>

        <form onSubmit={savePreferences} className={cardClass}>
          <h2 className="m-0 mb-3 text-[15px] font-semibold text-[#2b1d15]">Preferences</h2>
          <Field label="Language"><select value={lang} onChange={(e) => setLanguage(e.target.value)} className={fieldClass}>{languages.map((l) => <option key={l}>{l}</option>)}</select></Field>
          <div className="mt-4 flex justify-end"><button className={darkButton}>Save Changes</button></div>
        </form>

        <form onSubmit={changePassword} noValidate className={cardClass}>
          <h2 className="m-0 mb-3 text-[15px] font-semibold text-[#2b1d15]">Change Password</h2>
          <div className="grid gap-3.5">
            <Field label="Current Password" error={errors.current}><input type="password" autoComplete="current-password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="Enter your current password" className={fieldClass} /></Field>
            <Field label="New Password" error={errors.next} hint="Use at least 8 characters."><input type="password" autoComplete="new-password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} placeholder="Enter a new password" className={fieldClass} /></Field>
            <Field label="Confirm New Password" error={errors.confirm}><input type="password" autoComplete="new-password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Re-enter the new password" className={fieldClass} /></Field>
          </div>
          <div className="mt-4 flex justify-end"><button className={darkButton}>Update Password</button></div>
        </form>
      </div>
      {toast}
    </AccountShell>
  );
}
