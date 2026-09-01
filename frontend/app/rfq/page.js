"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { decodeToken, getToken } from "../../utils/auth";
import MarketplaceFooter from "../../components/marketplace/MarketplaceFooter";
import BuyerRfqList from "../../components/marketplace/rfq/BuyerRfqList";
import OpenRfqList from "../../components/marketplace/rfq/OpenRfqList";
import RfqForm from "../../components/marketplace/rfq/RfqForm";
import { EmptyRfqState, Feedback, RfqSkeleton } from "../../components/marketplace/rfq/RfqUi";

const API = "/api";
const initialForm = { title: "", description: "", category: "", quantity: "", unit: "units", budget: "", deliveryLocation: "" };

export default function RfqPage() {
  const [{ token, user }] = useState(() => { const currentToken = getToken(); return { token: currentToken, user: currentToken ? decodeToken(currentToken) : null }; });
  const [rfqs, setRfqs] = useState([]);
  const [myRfqs, setMyRfqs] = useState([]);
  const [vendorQuotes, setVendorQuotes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingQuoteId, setSubmittingQuoteId] = useState(null);
  const [decisionId, setDecisionId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadRfqs = useCallback(async () => {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const requests = [fetch(`${API}/rfqs`, { headers })];
    if (user?.role === "CLIENT") requests.push(fetch(`${API}/rfqs/my`, { headers }));
    if (user?.role === "VENDOR") requests.push(fetch(`${API}/rfqs/vendor/quotes`, { headers }));
    const responses = await Promise.all(requests);
    const payloads = await Promise.all(responses.map(async (response) => ({ response, data: await response.json() })));
    if (!payloads[0].response.ok) throw new Error(payloads[0].data.message || "Unable to load sourcing requirements");
    setRfqs(Array.isArray(payloads[0].data) ? payloads[0].data : []);
    if (user?.role === "CLIENT") {
      if (!payloads[1].response.ok) throw new Error(payloads[1].data.message || "Unable to load your requirements");
      setMyRfqs(Array.isArray(payloads[1].data) ? payloads[1].data : []);
    }
    if (user?.role === "VENDOR") {
      if (!payloads[1].response.ok) throw new Error(payloads[1].data.message || "Unable to load your quotations");
      setVendorQuotes(Array.isArray(payloads[1].data) ? payloads[1].data : []);
    }
  }, [token, user?.role]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      loadRfqs().catch((error) => active && setFeedback({ type: "error", message: error.message })).finally(() => active && setLoading(false));
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [loadRfqs]);

  const submitRfq = async (event) => {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const budget = form.budget === "" ? null : Number(form.budget);
    if (!form.title.trim() || !Number.isInteger(quantity) || quantity <= 0) return setFeedback({ type: "error", message: "Enter a requirement title and a positive whole-number quantity." });
    if (budget !== null && (!Number.isFinite(budget) || budget <= 0)) return setFeedback({ type: "error", message: "Budget must be a positive number or left blank." });
    setSubmitting(true); setFeedback(null);
    try {
      const response = await fetch(`${API}/rfqs`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to post requirement");
      setForm(initialForm); setFeedback({ type: "success", message: "Requirement posted. Approved suppliers can now submit quotations." }); await loadRfqs();
    } catch (error) { setFeedback({ type: "error", message: error.message }); } finally { setSubmitting(false); }
  };

  const submitQuote = async (rfqId) => {
    const draft = drafts[rfqId] || {};
    const price = Number(draft.price);
    const deliveryDays = draft.deliveryDays === "" || draft.deliveryDays == null ? null : Number(draft.deliveryDays);
    if (!Number.isFinite(price) || price <= 0) return setFeedback({ type: "error", message: "Quotation price must be a positive number." });
    if (deliveryDays !== null && (!Number.isInteger(deliveryDays) || deliveryDays <= 0)) return setFeedback({ type: "error", message: "Delivery days must be a positive whole number." });
    setSubmittingQuoteId(rfqId); setFeedback(null);
    try {
      const response = await fetch(`${API}/rfqs/${rfqId}/quotes`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(draft) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to submit quotation");
      setDrafts((current) => ({ ...current, [rfqId]: {} })); setFeedback({ type: "success", message: "Quotation submitted to the buyer." }); await loadRfqs();
    } catch (error) { setFeedback({ type: "error", message: error.message }); } finally { setSubmittingQuoteId(null); }
  };

  const decideQuote = async (quoteId, status) => {
    setDecisionId(quoteId); setFeedback(null);
    try {
      const response = await fetch(`${API}/rfqs/quotes/${quoteId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to update quotation");
      setFeedback({ type: "success", message: status === "ACCEPTED" ? "Quotation accepted and requirement closed." : "Quotation rejected." }); await loadRfqs();
    } catch (error) { setFeedback({ type: "error", message: error.message }); } finally { setDecisionId(null); }
  };

  const isClient = user?.role === "CLIENT";
  const isVendor = user?.role === "VENDOR";
  const submittedRfqIds = new Set(vendorQuotes.map((quote) => quote.rfqId));

  return <main className="min-h-screen bg-slate-50 text-slate-950">
    <section className="border-b border-slate-200 bg-white"><div className="marketplace-container grid gap-8 py-10 lg:grid-cols-[1fr_auto] lg:items-end lg:py-14"><div><p className="marketplace-eyebrow">Request for quotation</p><h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Source the right product through one clear requirement</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Describe what your business needs, invite supplier quotations, and compare real commercial responses in one place.</p></div><Link href="/suppliers" className="marketplace-button-secondary">Browse suppliers</Link></div></section>
    <div className="marketplace-container py-8 sm:py-12"><Feedback feedback={feedback} onDismiss={() => setFeedback(null)}/>
      {!user && <section className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6"><div><h2 className="font-bold text-slate-950">Sign in to participate</h2><p className="mt-1 text-sm text-slate-600">Buyers can post requirements and suppliers can submit quotations.</p></div><Link href="/login" className="marketplace-button-primary mt-4 sm:mt-0">Sign in</Link></section>}
      {isClient && <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)]"><RfqForm form={form} setForm={setForm} onSubmit={submitRfq} submitting={submitting}/><aside className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-300">A useful RFQ includes</p><ol className="mt-6 space-y-5 text-sm"><li><strong className="block">1. A specific requirement</strong><span className="mt-1 block text-slate-400">Name the product or outcome clearly.</span></li><li><strong className="block">2. Commercial context</strong><span className="mt-1 block text-slate-400">Add quantity, unit, and an optional target budget.</span></li><li><strong className="block">3. Technical details</strong><span className="mt-1 block text-slate-400">Include specifications and intended use in the description.</span></li></ol></aside></div>}
      {isClient && <section className="mt-12"><div className="mb-5"><p className="marketplace-eyebrow">Buyer workspace</p><h2 className="mt-2 text-2xl font-bold">My requirements</h2></div>{loading ? <RfqSkeleton/> : myRfqs.length ? <BuyerRfqList rfqs={myRfqs} decisionId={decisionId} onDecision={decideQuote}/> : <EmptyRfqState title="No requirements posted yet" message="Your submitted sourcing requirements and supplier quotations will appear here."/>}</section>}
      <section className="mt-12"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="marketplace-eyebrow">Supplier opportunities</p><h2 className="mt-2 text-2xl font-bold">Open sourcing requirements</h2></div>{isVendor && <span className="text-sm text-slate-500">{vendorQuotes.length} quotation{vendorQuotes.length === 1 ? "" : "s"} submitted</span>}</div>{loading ? <RfqSkeleton/> : rfqs.length ? <OpenRfqList rfqs={rfqs} isVendor={isVendor} drafts={drafts} onDraftChange={(id, value) => setDrafts((current) => ({ ...current, [id]: value }))} onQuote={submitQuote} submittingId={submittingQuoteId} submittedRfqIds={submittedRfqIds}/> : <EmptyRfqState title="No open requirements right now" message="New buyer sourcing opportunities will appear here as they are posted."/>}</section>
    </div><MarketplaceFooter/>
  </main>;
}
