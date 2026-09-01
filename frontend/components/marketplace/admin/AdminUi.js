export const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "—";
export const formatMoney = (value) => value == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value));
export const displayName = (record) => record?.companyName || [record?.firstName, record?.lastName].filter(Boolean).join(" ") || "—";

export function StatusBadge({ value }) {
  const normalized = String(value ?? "Unknown").toUpperCase();
  const positive = ["ADMIN", "VERIFIED", "DELIVERED", "ACCEPTED", "CLOSED"].includes(normalized);
  const warning = ["PENDING", "OPEN", "QUOTED", "VENDOR"].includes(normalized);
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${positive ? "bg-emerald-50 text-emerald-700" : warning ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{String(value ?? "Unknown").replaceAll("_", " ")}</span>;
}

export function EmptyState({ title, description }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center"><h3 className="font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm text-slate-600">{description}</p></div>;
}

export function SectionTitle({ eyebrow, title, description }) {
  return <div><p className="marketplace-eyebrow">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}</div>;
}
