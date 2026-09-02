"use client";

export default function QuoteForm({ value, onChange, onSubmit, submitting, dark = false }) {
  const inputClass = dark ? "border-slate-700 bg-slate-950/70 text-white placeholder:text-slate-500 focus:border-orange-500" : "border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-orange-600";
  const update = (field) => (event) => onChange({ ...value, [field]: event.target.value });
  return <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Submit quotation">
    <label className={`text-xs font-bold ${dark ? "text-slate-300" : "text-slate-700"}`}>Quotation price <span className="text-rose-500">*</span><input required min="0.01" step="0.01" type="number" inputMode="decimal" value={value.price || ""} onChange={update("price")} className={`mt-1 min-h-11 w-full rounded-lg border px-3 text-sm outline-none ${inputClass}`}/></label>
    <label className={`text-xs font-bold ${dark ? "text-slate-300" : "text-slate-700"}`}>Delivery days<input min="1" step="1" type="number" inputMode="numeric" value={value.deliveryDays || ""} onChange={update("deliveryDays")} placeholder="14" className={`mt-1 min-h-11 w-full rounded-lg border px-3 text-sm outline-none ${inputClass}`}/></label>
    <label className={`text-xs font-bold sm:col-span-2 ${dark ? "text-slate-300" : "text-slate-700"}`}>Message<textarea rows={3} value={value.message || ""} onChange={update("message")} placeholder="Commercial terms or notes supported by your quotation" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none ${inputClass}`}/></label>
    <button disabled={submitting} className="min-h-11 rounded-lg bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 sm:justify-self-start">{submitting ? "Submitting…" : "Submit quotation"}</button>
  </form>;
}
