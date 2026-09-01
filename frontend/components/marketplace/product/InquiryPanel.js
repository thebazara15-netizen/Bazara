"use client";

import { useState } from "react";
import QuantitySelector from "./QuantitySelector";

export default function InquiryPanel({ productName, initialQuantity, moq, open, onClose, onSubmit, submitting, status }) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [message, setMessage] = useState("");

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    const successful = await onSubmit({ quantity, message: message.trim() });
    if (successful) setMessage("");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="inquiry-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="marketplace-eyebrow">Supplier enquiry</p><h2 id="inquiry-title" className="mt-2 text-xl font-bold text-slate-950">Ask about {productName}</h2></div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Close inquiry form" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">×</button>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <QuantitySelector quantity={quantity} moq={moq} onChange={setQuantity} disabled={submitting} />
          <div>
            <label htmlFor="inquiry-message" className="text-sm font-bold text-slate-900">Requirement or message</label>
            <textarea id="inquiry-message" value={message} onChange={(event) => setMessage(event.target.value)} rows="5" maxLength="2000" disabled={submitting} placeholder="Describe specifications, intended use, or questions for the supplier." className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-100" />
            <p className="mt-1 text-right text-xs text-slate-400">{message.length}/2000</p>
          </div>
          {status?.message && <div role="status" className={`rounded-xl px-4 py-3 text-sm ${status.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{status.message}</div>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={submitting} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white hover:bg-orange-800 disabled:cursor-wait disabled:opacity-60">{submitting ? "Sending enquiry…" : "Send enquiry"}</button></div>
        </form>
      </div>
    </div>
  );
}
