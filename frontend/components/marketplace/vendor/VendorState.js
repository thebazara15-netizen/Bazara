export function VendorFeedback({ feedback, onDismiss }) {
  if (!feedback?.message) return null;
  const success = feedback.type === "success";
  return <div role={success ? "status" : "alert"} className={`mb-5 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><span>{feedback.message}</span><button type="button" onClick={onDismiss} aria-label="Dismiss message" className="font-bold">×</button></div>;
}

export function VendorLoading() { return <div className="grid gap-4 sm:grid-cols-2"><div className="h-32 animate-pulse rounded-2xl bg-white"/><div className="h-32 animate-pulse rounded-2xl bg-white"/></div>; }

export function VendorPending() { return <section className="rounded-3xl border border-amber-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">⌛</div><h1 className="mt-5 text-2xl font-bold">Your supplier account is awaiting admin approval.</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">Product management, buyer inquiries, and quotations will become available after approval.</p></section>; }

export function ConfirmDialog({ product, busy, onCancel, onConfirm }) {
  if (!product) return null;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-product-title" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel()}><section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="delete-product-title" className="text-xl font-bold">Remove {product.name}?</h2><p className="mt-3 text-sm leading-6 text-slate-600">This listing will be removed from your catalog and the public marketplace. This action cannot be undone.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold">Cancel</button><button type="button" disabled={busy} onClick={onConfirm} className="min-h-11 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white disabled:opacity-60">{busy ? "Removing…" : "Remove listing"}</button></div></section></div>;
}
