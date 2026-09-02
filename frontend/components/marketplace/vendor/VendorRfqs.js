"use client";

import OpenRfqList from "../rfq/OpenRfqList";

export default function VendorRfqs(props) {
  return <section><p className="marketplace-eyebrow">Sourcing opportunities</p><h2 className="mt-2 text-3xl font-bold">Open RFQs</h2><p className="mt-3 text-sm text-slate-600">Review live buyer requirements and submit quotations through the existing RFQ workflow.</p><div className="mt-7">{props.rfqs.length ? <OpenRfqList {...props} isVendor/> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">No open requirements right now.</div>}</div></section>;
}
