"use client";

const fieldClass = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-100";

export default function RfqForm({ form, setForm, onSubmit, submitting }) {
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  return <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="rfq-form-title">
    <div className="border-b border-slate-200 pb-5"><p className="marketplace-eyebrow">Buyer requirement</p><h2 id="rfq-form-title" className="mt-2 text-2xl font-bold text-slate-950">Tell suppliers what you need</h2><p className="mt-2 text-sm leading-6 text-slate-600">Add enough commercial and technical context for suppliers to prepare a useful quotation.</p></div>
    <fieldset className="mt-6"><legend className="text-base font-bold text-slate-950">Requirement details</legend><div className="mt-3 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Requirement title <span className="text-rose-600">*</span><input required maxLength={255} value={form.title} onChange={update("title")} placeholder="e.g. Industrial water pump for processing plant" className={fieldClass}/></label>
      <label className="text-sm font-semibold text-slate-700">Category<input value={form.category} onChange={update("category")} placeholder="Product category" className={fieldClass}/></label>
      <label className="text-sm font-semibold text-slate-700">Delivery location<input value={form.deliveryLocation} onChange={update("deliveryLocation")} placeholder="City or region" className={fieldClass}/></label>
    </div></fieldset>
    <fieldset className="mt-7 border-t border-slate-200 pt-6"><legend className="text-base font-bold text-slate-950">Quantity and budget</legend><div className="mt-3 grid gap-4 sm:grid-cols-3">
      <label className="text-sm font-semibold text-slate-700">Quantity <span className="text-rose-600">*</span><input required min="1" step="1" type="number" inputMode="numeric" value={form.quantity} onChange={update("quantity")} className={fieldClass}/></label>
      <label className="text-sm font-semibold text-slate-700">Unit<input value={form.unit} onChange={update("unit")} placeholder="units" className={fieldClass}/></label>
      <label className="text-sm font-semibold text-slate-700">Target budget<input min="0.01" step="0.01" type="number" inputMode="decimal" value={form.budget} onChange={update("budget")} placeholder="Optional" className={fieldClass}/></label>
    </div><p className="mt-2 text-xs text-slate-500">Leave budget blank if you prefer suppliers to propose pricing.</p></fieldset>
    <fieldset className="mt-7 border-t border-slate-200 pt-6"><legend className="text-base font-bold text-slate-950">Additional information</legend><label className="mt-3 block text-sm font-semibold text-slate-700">Description<textarea value={form.description} onChange={update("description")} rows={5} placeholder="Specifications, grade, intended use, packing, or other requirements" className={`${fieldClass} py-3`}/></label></fieldset>
    <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Your requirement will be visible to approved suppliers.</p><button disabled={submitting} className="marketplace-button-primary disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Posting requirement…" : "Post requirement"}</button></div>
  </form>;
}
