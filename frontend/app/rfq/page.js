"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { decodeToken, getToken } from "../../utils/auth";

const API = "/api";
const formatPrice = (value) => value ? `Rs. ${Number(value).toLocaleString("en-IN")}` : "Open budget";

export default function RfqPage() {
  const [rfqs, setRfqs] = useState([]);
  const [myRfqs, setMyRfqs] = useState([]);
  const [message, setMessage] = useState("");
  const [quoteDrafts, setQuoteDrafts] = useState({});
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    quantity: "",
    unit: "units",
    budget: "",
    deliveryLocation: ""
  });

  const token = getToken();
  const user = token ? decodeToken(token) : null;

  const loadRfqs = async () => {
    const [openRes, myRes] = await Promise.all([
      fetch(`${API}/rfqs`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
      token && user?.role === "CLIENT"
        ? fetch(`${API}/rfqs/my`, { headers: { Authorization: `Bearer ${token}` } })
        : Promise.resolve(null)
    ]);

    const openData = await openRes.json();
    setRfqs(Array.isArray(openData) ? openData : []);

    if (myRes) {
      const myData = await myRes.json();
      setMyRfqs(Array.isArray(myData) ? myData : []);
    }
  };

  useEffect(() => {
    loadRfqs().catch(() => setMessage("Unable to load RFQs"));
  }, [token]);

  const submitRfq = async (event) => {
    event.preventDefault();
    if (!token || user?.role !== "CLIENT") {
      setMessage("Login as a client to post an RFQ");
      return;
    }

    const res = await fetch(`${API}/rfqs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Unable to post RFQ");
      return;
    }

    setMessage("RFQ posted. Vendors can quote now.");
    setForm({ title: "", description: "", category: "", quantity: "", unit: "units", budget: "", deliveryLocation: "" });
    loadRfqs();
  };

  const sendQuote = async (rfqId) => {
    if (!token || user?.role !== "VENDOR") {
      setMessage("Login as a vendor to quote RFQs");
      return;
    }

    const draft = quoteDrafts[rfqId] || {};
    const res = await fetch(`${API}/rfqs/${rfqId}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(draft)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Unable to send quote");
      return;
    }

    setMessage("Quote sent to buyer.");
    setQuoteDrafts((prev) => ({ ...prev, [rfqId]: {} }));
    loadRfqs();
  };

  return (
    <main className="min-h-screen bg-[#0d1422] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white md:text-5xl">Request for Quotation</h1>
            <p className="mt-2 text-sm text-slate-400">Post requirements, compare vendor quotes, and close bulk deals faster.</p>
          </div>
          <Link href="/suppliers" className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-sky-300 transition hover:bg-white/10">
            Browse Suppliers
          </Link>
        </div>

        {message && <div className="mb-5 rounded-lg border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">{message}</div>}

        {user?.role === "CLIENT" && (
          <form onSubmit={submitRfq} className="mb-8 rounded-lg border border-white/10 bg-white/[0.04] p-5 md:p-6">
            <h2 className="mb-4 text-lg font-bold">Post a Buying Requirement</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Product required" className="rounded-lg border border-white/10 bg-[#172234] px-4 py-3 text-sm outline-none focus:border-orange-400" />
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="rounded-lg border border-white/10 bg-[#172234] px-4 py-3 text-sm outline-none focus:border-orange-400" />
              <input value={form.deliveryLocation} onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })} placeholder="Delivery city" className="rounded-lg border border-white/10 bg-[#172234] px-4 py-3 text-sm outline-none focus:border-orange-400" />
              <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity" type="number" className="rounded-lg border border-white/10 bg-[#172234] px-4 py-3 text-sm outline-none focus:border-orange-400" />
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unit" className="rounded-lg border border-white/10 bg-[#172234] px-4 py-3 text-sm outline-none focus:border-orange-400" />
              <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="Target budget" type="number" className="rounded-lg border border-white/10 bg-[#172234] px-4 py-3 text-sm outline-none focus:border-orange-400" />
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Specs, grade, usage, packing, delivery notes" className="mt-3 h-24 w-full rounded-lg border border-white/10 bg-[#172234] px-4 py-3 text-sm outline-none focus:border-orange-400" />
            <button className="mt-4 rounded-full bg-orange-600 px-6 py-3 text-sm font-extrabold transition hover:bg-orange-700">Post RFQ</button>
          </form>
        )}

        {user?.role === "CLIENT" && myRfqs.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">My RFQs</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {myRfqs.map((rfq) => (
                <div key={rfq.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold">{rfq.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{rfq.quantity} {rfq.unit} · {formatPrice(rfq.budget)}</p>
                    </div>
                    <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-300">{rfq.status}</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {(rfq.quotes || []).map((quote) => (
                      <div key={quote.id} className="rounded-md border border-white/10 bg-[#172234] p-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <span>{quote.vendor?.companyName || quote.vendor?.email || "Vendor"}</span>
                          <strong className="text-orange-300">{formatPrice(quote.price)}</strong>
                        </div>
                        <p className="mt-1 text-slate-400">{quote.deliveryDays} days · {quote.message || "No message"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-xl font-bold">Open RFQs</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">{rfq.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{rfq.category || "General"} · {rfq.deliveryLocation || "Delivery TBD"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{rfq.status}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{rfq.description || "No description added."}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-[#172234] px-3 py-2"><span className="text-slate-400">Qty</span><p className="font-bold">{rfq.quantity} {rfq.unit}</p></div>
                  <div className="rounded-md bg-[#172234] px-3 py-2"><span className="text-slate-400">Budget</span><p className="font-bold">{formatPrice(rfq.budget)}</p></div>
                </div>

                {user?.role === "VENDOR" && (
                  <div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <input placeholder="Quote price" type="number" value={quoteDrafts[rfq.id]?.price || ""} onChange={(e) => setQuoteDrafts((prev) => ({ ...prev, [rfq.id]: { ...prev[rfq.id], price: e.target.value } }))} className="rounded-lg border border-white/10 bg-[#172234] px-3 py-2 text-sm outline-none focus:border-orange-400" />
                    <input placeholder="Message" value={quoteDrafts[rfq.id]?.message || ""} onChange={(e) => setQuoteDrafts((prev) => ({ ...prev, [rfq.id]: { ...prev[rfq.id], message: e.target.value } }))} className="rounded-lg border border-white/10 bg-[#172234] px-3 py-2 text-sm outline-none focus:border-orange-400" />
                    <button onClick={() => sendQuote(rfq.id)} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold hover:bg-orange-700">Quote</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
