"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeToken, getToken } from "../../utils/auth";
import VendorShell from "../../components/marketplace/vendor/VendorShell";
import VendorOverview from "../../components/marketplace/vendor/VendorOverview";
import VendorProducts from "../../components/marketplace/vendor/VendorProducts";
import VendorProductForm from "../../components/marketplace/vendor/VendorProductForm";
import VendorInquiries from "../../components/marketplace/vendor/VendorInquiries";
import VendorRfqs from "../../components/marketplace/vendor/VendorRfqs";
import VendorQuotes from "../../components/marketplace/vendor/VendorQuotes";
import VendorPricingConfig from "../../components/marketplace/vendor/VendorPricingConfig";
import { ConfirmDialog, VendorFeedback, VendorLoading, VendorPending } from "../../components/marketplace/vendor/VendorState";

const API = "/api";

export default function VendorDashboard() {
  const router = useRouter();
  const [active, setActive] = useState("overview");
  const [token, setToken] = useState(null);
  const [products, setProducts] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [inquiryBusyId, setInquiryBusyId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [submittingQuoteId, setSubmittingQuoteId] = useState(null);

  const request = useCallback(async (url, options = {}) => {
    const response = await fetch(`${API}${url}`, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || "Unable to load seller workspace");
      error.status = response.status;
      throw error;
    }
    return data;
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [productData, inquiryData, rfqData, quoteData, pricingData] = await Promise.all([
        request("/products/vendor/my-products"), request("/inquiries/vendor"),
        request("/rfqs"), request("/rfqs/vendor/quotes"), request("/vendor/pricing-config")
      ]);
      setProducts(Array.isArray(productData) ? productData : []);
      setInquiries(Array.isArray(inquiryData) ? inquiryData : []);
      setRfqs(Array.isArray(rfqData) ? rfqData : []);
      setQuotes(Array.isArray(quoteData) ? quoteData : []);
      setPricingConfig(pricingData);
      setPending(false);
    } catch (error) {
      if (error.status === 403 && error.message.toLowerCase().includes("awaiting")) setPending(true);
      else setFeedback({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [request, token]);

  useEffect(() => {
    const current = getToken();
    const user = current ? decodeToken(current) : null;
    if (!current) { localStorage.setItem("redirect", "/vendor"); router.push("/login"); return; }
    if (user?.role !== "VENDOR") { router.push("/"); return; }
    setToken(current);
  }, [router]);

  useEffect(() => { if (token) load(); }, [load, token]);

  const saveProduct = async (form, files) => {
    setBusy(true); setFeedback(null);
    try {
      if (editing) {
        await request(`/products/vendor/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        const body = new FormData();
        Object.entries(form).forEach(([key, value]) => body.append(key, key === "pricingTiers" ? JSON.stringify(value) : value));
        files.forEach((file) => body.append("images", file));
        await request("/products", { method: "POST", body });
      }
      setFeedback({ type: "success", message: editing ? "Product updated successfully." : "Product published successfully." });
      setEditing(null); setActive("products"); await load();
    } catch (error) { setFeedback({ type: "error", message: error.message }); }
    finally { setBusy(false); }
  };

  const deleteProduct = async () => {
    setBusy(true);
    try { await request(`/products/${deleting.id}`, { method: "DELETE" }); setFeedback({ type: "success", message: `${deleting.name} was removed.` }); setDeleting(null); await load(); }
    catch (error) { setFeedback({ type: "error", message: error.message }); }
    finally { setBusy(false); }
  };

  const updateInquiry = async (id, status) => {
    setInquiryBusyId(id);
    try { await request(`/inquiries/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); await load(); setFeedback({ type: "success", message: "Inquiry status updated." }); }
    catch (error) { setFeedback({ type: "error", message: error.message }); }
    finally { setInquiryBusyId(null); }
  };

  const submitQuote = async (rfqId) => {
    const draft = drafts[rfqId] || {};
    const price = Number(draft.price);
    const days = draft.deliveryDays === "" || draft.deliveryDays == null ? null : Number(draft.deliveryDays);
    if (!Number.isFinite(price) || price <= 0 || (days !== null && (!Number.isInteger(days) || days <= 0))) return setFeedback({ type: "error", message: "Enter a positive quotation price and valid delivery days." });
    setSubmittingQuoteId(rfqId);
    try { await request(`/rfqs/${rfqId}/quotes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) }); setDrafts((current) => ({ ...current, [rfqId]: {} })); setFeedback({ type: "success", message: "Quotation submitted to the buyer." }); await load(); }
    catch (error) { setFeedback({ type: "error", message: error.message }); }
    finally { setSubmittingQuoteId(null); }
  };

  const navigate = (section) => { setActive(section); if (section !== "add") setEditing(null); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const savePricing = async (value) => { setBusy(true); setFeedback(null); try { const saved = await request("/vendor/pricing-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) }); setPricingConfig(saved); setFeedback({ type: "success", message: "Tax and shipping configuration saved." }); } catch (error) { setFeedback({ type: "error", message: error.message }); } finally { setBusy(false); } };
  const submittedIds = new Set(quotes.map((quote) => quote.rfqId));
  const content = active === "overview" ? <VendorOverview counts={{ products: products.length, inquiries: inquiries.length, rfqs: rfqs.length, quotes: quotes.length }} onNavigate={navigate}/>
    : active === "products" ? <VendorProducts products={products} onAdd={() => navigate("add")} onEdit={(product) => { setEditing(product); setActive("add"); }} onDelete={setDeleting}/>
    : active === "add" ? <VendorProductForm product={editing} busy={busy} onCancel={() => navigate("products")} onSubmit={saveProduct} onError={(message) => setFeedback(message ? { type: "error", message } : null)}/>
    : active === "pricing" ? <VendorPricingConfig config={pricingConfig} busy={busy} onSave={savePricing} onError={(message) => setFeedback({ type: "error", message })}/>
    : active === "inquiries" ? <VendorInquiries inquiries={inquiries} busyId={inquiryBusyId} onStatus={updateInquiry}/>
    : active === "rfqs" ? <VendorRfqs rfqs={rfqs} drafts={drafts} onDraftChange={(id, value) => setDrafts((current) => ({ ...current, [id]: value }))} onQuote={submitQuote} submittingId={submittingQuoteId} submittedRfqIds={submittedIds}/>
    : <VendorQuotes quotes={quotes}/>;

  return <VendorShell active={active} onNavigate={navigate}><VendorFeedback feedback={feedback} onDismiss={() => setFeedback(null)}/>{loading ? <VendorLoading/> : pending ? <VendorPending/> : content}<ConfirmDialog product={deleting} busy={busy} onCancel={() => setDeleting(null)} onConfirm={deleteProduct}/></VendorShell>;
}
