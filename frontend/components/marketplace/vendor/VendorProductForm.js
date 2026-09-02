"use client";

import { useState } from "react";
import PricingTierEditor from "./PricingTierEditor";
import VendorImagePicker from "./VendorImagePicker";

const empty = { name: "", description: "", category: "", basePrice: "", moq: "", stock: "", pricingTiers: [] };
const input = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100";

export default function VendorProductForm({ product, busy, onCancel, onSubmit, onError }) {
  const [form, setForm] = useState(() => product ? { name: product.name || "", description: product.description || "", category: product.category || "", basePrice: String(product.basePrice ?? ""), moq: String(product.moq ?? ""), stock: String(product.stock ?? ""), pricingTiers: Array.isArray(product.pricingTiers) ? product.pricingTiers.map((tier) => ({ minQty: String(tier.minQty), price: String(tier.price) })) : [] } : empty);
  const [files, setFiles] = useState([]);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const moq = Number(form.moq), stock = Number(form.stock), basePrice = Number(form.basePrice);
    const tiers = form.pricingTiers.map((tier) => ({ minQty: Number(tier.minQty), price: Number(tier.price) }));
    const quantities = tiers.map((tier) => tier.minQty);
    if (!form.name.trim() || !Number.isInteger(moq) || moq <= 0 || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(basePrice) || basePrice < 0) return onError("Enter a name, positive whole-number MOQ, non-negative stock, and valid base price.");
    if (tiers.some((tier) => !Number.isInteger(tier.minQty) || tier.minQty < moq || !Number.isFinite(tier.price) || tier.price <= 0) || new Set(quantities).size !== quantities.length) return onError("Pricing tiers need unique whole-number quantities at or above MOQ and positive prices.");
    onSubmit({ ...form, name: form.name.trim(), moq, stock, basePrice, pricingTiers: tiers.sort((a, b) => a.minQty - b.minQty) }, files);
  };
  return <section><p className="marketplace-eyebrow">{product ? "Catalog update" : "New listing"}</p><h2 className="mt-2 text-3xl font-bold">{product ? `Edit ${product.name}` : "Add Product"}</h2><p className="mt-3 text-sm text-slate-600">Use supported marketplace fields only. Public pricing is calculated from these values.</p><form onSubmit={submit} className="mt-7 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><fieldset><legend className="text-lg font-bold">Basic Information</legend><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold sm:col-span-2">Product Name<input required maxLength={255} value={form.name} onChange={update("name")} className={input}/></label><label className="text-sm font-semibold">Category<input value={form.category} onChange={update("category")} className={input}/></label><label className="text-sm font-semibold">Base Price<input required type="number" min="0" step="0.01" value={form.basePrice} onChange={update("basePrice")} className={input}/></label><label className="text-sm font-semibold">MOQ<input required type="number" min="1" step="1" value={form.moq} onChange={update("moq")} className={input}/></label><label className="text-sm font-semibold">Inventory Stock<input required type="number" min="0" step="1" value={form.stock} onChange={update("stock")} className={input}/></label></div></fieldset><fieldset className="border-t border-slate-200 pt-6"><legend className="text-lg font-bold">Description</legend><textarea rows={6} value={form.description} onChange={update("description")} className={`${input} py-3`} placeholder="Describe specifications, intended use, and commercial context"/></fieldset><fieldset className="border-t border-slate-200 pt-6"><PricingTierEditor tiers={form.pricingTiers} onChange={(pricingTiers) => setForm((current) => ({ ...current, pricingTiers }))}/></fieldset><fieldset className="border-t border-slate-200 pt-6"><legend className="mb-4 text-lg font-bold">Product Images</legend><VendorImagePicker files={files} onChange={setFiles} onError={onError} disabled={Boolean(product)}/></fieldset><div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">{product && <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold">Cancel</button>}<button disabled={busy} className="marketplace-button-primary disabled:opacity-60">{busy ? "Saving…" : product ? "Save changes" : "Publish product"}</button></div></form></section>;
}
