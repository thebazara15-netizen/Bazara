const badgeStyles = {
  OPEN: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  QUOTED: "bg-sky-50 text-sky-700 ring-sky-200",
  CLOSED: "bg-slate-100 text-slate-700 ring-slate-200",
  SENT: "bg-amber-50 text-amber-700 ring-amber-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function StatusBadge({ status }) {
  const label = String(status || "PENDING").toUpperCase();
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${badgeStyles[label] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>{label}</span>;
}

export function Feedback({ feedback, onDismiss }) {
  if (!feedback?.message) return null;
  const success = feedback.type === "success";
  return <div role={success ? "status" : "alert"} className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><span>{feedback.message}</span>{onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss message" className="font-bold">×</button>}</div>;
}

export function RfqSkeleton() {
  return <div aria-label="Loading requirements" className="grid gap-4 lg:grid-cols-2">{[1, 2].map((item) => <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"><div className="h-5 w-2/3 rounded bg-slate-200"/><div className="mt-4 h-4 w-full rounded bg-slate-100"/><div className="mt-2 h-4 w-4/5 rounded bg-slate-100"/></div>)}</div>;
}

export function EmptyRfqState({ title, message }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><h3 className="text-lg font-bold text-slate-950">{title}</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{message}</p></div>;
}

export const formatMoney = (value) => value == null || value === "" ? "Open budget" : `₹${Number(value).toLocaleString("en-IN")}`;
export const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : null;
export const supplierName = (vendor) => vendor?.companyName || [vendor?.firstName, vendor?.lastName].filter(Boolean).join(" ") || "Supplier";
