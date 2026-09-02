"use client";

import { useState } from "react";

const emptyForm = {
  label: "", contactName: "", companyName: "", phoneCountryCode: "+91", phone: "",
  addressLine1: "", addressLine2: "", landmark: "", city: "", district: "",
  state: "", stateCode: "", postalCode: "", countryCode: "IN", gstin: "",
  isDefaultShipping: false, isDefaultBilling: false
};
const inputClass = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100";
const fields = [
  ["label", "Label", 50], ["contactName", "Contact name", 120, true], ["companyName", "Company name", 200, true],
  ["phone", "Phone", 20, true], ["addressLine1", "Address line 1", 255, true], ["addressLine2", "Address line 2", 255],
  ["landmark", "Landmark", 150], ["city", "City", 100, true], ["district", "District", 100],
  ["state", "State", 100, true], ["stateCode", "State code", 2, true], ["postalCode", "PIN code", 6, true], ["gstin", "GSTIN", 15]
];

function AddressForm({ address, saving, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({ ...emptyForm, ...(address || {}) }));
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit(form); }} className="mt-5">
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(([name, label, maxLength, required]) => <label key={name} className={`text-sm font-semibold ${name.startsWith("addressLine") ? "sm:col-span-2" : ""}`}>{label}{required && <span className="text-rose-600"> *</span>}<input name={name} required={required} maxLength={maxLength} value={form[name] || ""} onChange={(event) => update(name, event.target.value)} inputMode={name === "phone" || name === "stateCode" || name === "postalCode" ? "numeric" : undefined} pattern={name === "postalCode" ? "[0-9]{6}" : name === "stateCode" ? "[0-9]{2}" : undefined} className={inputClass}/></label>)}
      <label className="text-sm font-semibold">Country<input value="India (IN)" readOnly className={`${inputClass} bg-slate-100 text-slate-600`}/></label>
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-4 text-sm font-semibold"><input type="checkbox" checked={form.isDefaultShipping} onChange={(event) => update("isDefaultShipping", event.target.checked)} className="h-4 w-4 accent-orange-600"/>Default shipping address</label>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-4 text-sm font-semibold"><input type="checkbox" checked={form.isDefaultBilling} onChange={(event) => update("isDefaultBilling", event.target.checked)} className="h-4 w-4 accent-orange-600"/>Default billing address</label>
      </div>
    </div>
    <p className="mt-4 text-xs leading-5 text-slate-500">GSTIN validation checks format only and does not verify registration status. State code must be entered explicitly.</p>
    <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="marketplace-button-secondary">Cancel</button><button disabled={saving} className="marketplace-button-primary disabled:opacity-60">{saving ? "Saving…" : address ? "Save changes" : "Add address"}</button></div>
  </form>;
}

export default function AccountAddresses({ addresses, saving, onCreate, onUpdate, onDelete }) {
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const save = async (values) => {
    const succeeded = editor?.id ? await onUpdate(editor.id, values) : await onCreate(values);
    if (succeeded) setEditor(null);
  };
  const setDefault = (address, field) => onUpdate(address.id, { [field]: true });
  return <section>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="marketplace-eyebrow">Buyer address book</p><h2 className="mt-2 text-3xl font-bold">Addresses</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Maintain shipping and billing contacts for future business purchases.</p></div><button type="button" onClick={() => setEditor({})} className="marketplace-button-primary">Add Address</button></div>
    {!addresses.length ? <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h3 className="text-lg font-bold">No saved addresses</h3><p className="mt-2 text-sm text-slate-600">Add a business address to prepare your buyer account for future checkout.</p></div> : <div className="mt-7 grid gap-5 xl:grid-cols-2">{addresses.map((address) => <article key={address.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2">{address.label && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{address.label}</span>}{address.isDefaultShipping && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">Default Shipping</span>}{address.isDefaultBilling && <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">Default Billing</span>}</div><h3 className="mt-3 text-lg font-bold">{address.companyName}</h3><p className="mt-1 text-sm font-semibold text-slate-700">{address.contactName} · {address.phoneCountryCode} {address.phone}</p></div></div>
      <address className="mt-4 not-italic text-sm leading-6 text-slate-600"><p>{address.addressLine1}</p>{address.addressLine2 && <p>{address.addressLine2}</p>}{address.landmark && <p>Landmark: {address.landmark}</p>}<p>{[address.city, address.district, address.state].filter(Boolean).join(", ")} – {address.postalCode}</p><p>India · State code {address.stateCode}</p>{address.gstin && <p className="mt-2 font-semibold text-slate-700">GSTIN: {address.gstin}</p>}</address>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setEditor(address)} className="marketplace-button-secondary">Edit</button><button type="button" onClick={() => setDeleting(address)} className="min-h-11 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50">Delete</button>{!address.isDefaultShipping && <button type="button" disabled={saving} onClick={() => setDefault(address, "isDefaultShipping")} className="min-h-11 rounded-xl px-3 text-sm font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-50">Set default shipping</button>}{!address.isDefaultBilling && <button type="button" disabled={saving} onClick={() => setDefault(address, "isDefaultBilling")} className="min-h-11 rounded-xl px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">Set default billing</button>}</div>
    </article>)}</div>}
    {editor && <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditor(null)}><div role="dialog" aria-modal="true" aria-labelledby="address-editor-title" className="my-6 w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="marketplace-eyebrow">Address book</p><h3 id="address-editor-title" className="mt-1 text-2xl font-bold">{editor.id ? "Edit address" : "Add address"}</h3></div><button type="button" onClick={() => setEditor(null)} aria-label="Close address form" className="h-10 w-10 rounded-full bg-slate-100 text-xl">×</button></div><AddressForm key={editor.id || "new"} address={editor.id ? editor : null} saving={saving} onCancel={() => setEditor(null)} onSubmit={save}/></div></div>}
    {deleting && <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDeleting(null)}><div role="dialog" aria-modal="true" aria-labelledby="delete-address-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h3 id="delete-address-title" className="text-xl font-bold">Delete this address?</h3><p className="mt-3 text-sm leading-6 text-slate-600">{deleting.companyName} at {deleting.city} will be removed from your address book.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeleting(null)} className="marketplace-button-secondary">Cancel</button><button type="button" disabled={saving} onClick={async () => { if (await onDelete(deleting.id)) setDeleting(null); }} className="min-h-11 rounded-xl bg-rose-700 px-5 text-sm font-bold text-white disabled:opacity-50">Delete address</button></div></div></div>}
  </section>;
}
