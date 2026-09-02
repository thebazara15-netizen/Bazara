"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../utils/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const money = (paise) => paise == null ? "Not finalized" : `INR ${(Number(paise) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const addressText = (address) => [address.addressLine1, address.addressLine2, address.landmark, address.city, address.state, address.postalCode].filter(Boolean).join(", ");

function AddressOption({ address, selected, onSelect, name }) {
  return (
    <label className={`block cursor-pointer rounded-2xl border p-5 transition ${selected ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"}`}>
      <div className="flex gap-3">
        <input type="radio" name={name} checked={selected} onChange={onSelect} className="mt-1 h-4 w-4 accent-orange-600" />
        <div>
          <p className="font-bold text-gray-950">{address.label || address.companyName}</p>
          <p className="mt-1 text-sm font-semibold text-gray-700">{address.contactName} · {address.companyName}</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">{addressText(address)}</p>
          <p className="mt-1 text-sm text-gray-600">{address.phoneCountryCode} {address.phone}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-orange-700">
            {address.isDefaultShipping && <span>Default shipping</span>}
            {address.isDefaultBilling && <span>Default billing</span>}
          </div>
        </div>
      </div>
    </label>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [shippingId, setShippingId] = useState(null);
  const [billingId, setBillingId] = useState(null);
  const [sameBilling, setSameBilling] = useState(true);
  const [draft, setDraft] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (authToken) => {
    try {
      setError("");
      const headers = { Authorization: `Bearer ${authToken}` };
      const [cartRes, addressRes] = await Promise.all([fetch(`${API}/api/cart`, { headers }), fetch(`${API}/api/account/addresses`, { headers })]);
      const cartData = await cartRes.json();
      const addressData = await addressRes.json();
      if (!cartRes.ok) throw new Error(cartData.message || "Unable to load cart");
      if (!addressRes.ok) throw new Error(addressData.message || "Unable to load addresses");
      const nextAddresses = Array.isArray(addressData) ? addressData : [];
      setCart(Array.isArray(cartData.items) ? cartData.items : []);
      setAddresses(nextAddresses);
      setShippingId((nextAddresses.find((item) => item.isDefaultShipping) || nextAddresses[0])?.id || null);
      setBillingId((nextAddresses.find((item) => item.isDefaultBilling) || nextAddresses[0])?.id || null);
    } catch (loadError) {
      setError(loadError.message || "Unable to load checkout");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const authToken = getToken();
    if (!authToken) {
      localStorage.setItem("redirect", "/checkout");
      router.replace("/login");
      return;
    }
    setToken(authToken);
    load(authToken);
  }, [load, router]);

  useEffect(() => {
    setDraft(null);
    setIdempotencyKey(null);
  }, [shippingId, billingId, sameBilling]);
  const subtotalPaise = useMemo(() => Math.round(cart.reduce((sum, item) => sum + Number(item.lineSubtotal || 0), 0) * 100), [cart]);

  async function createDraft() {
    if (!shippingId || (!sameBilling && !billingId)) return setError("Choose shipping and billing addresses.");
    setCreating(true);
    setError("");
    try {
      const requestKey = idempotencyKey || crypto.randomUUID();
      setIdempotencyKey(requestKey);
      const response = await fetch(`${API}/api/checkout/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shippingAddressId: shippingId, billingAddressId: sameBilling ? shippingId : billingId, idempotencyKey: requestKey })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to create checkout draft");
      setDraft(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (draftError) {
      setError(draftError.message || "Unable to create checkout draft");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-gray-50 px-4 py-20 text-center font-semibold text-gray-600">Loading secure checkout…</main>;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-widest text-orange-600">Pre-payment review</p><h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Secure checkout draft</h1><p className="mt-2 max-w-2xl text-gray-600">Confirm saved addresses and review the authoritative product subtotal. Payment follows only after shipping, GST, and the final total are validated.</p></div>
          <Link href="/cart" className="rounded-full border border-gray-300 px-5 py-3 text-sm font-bold hover:border-orange-500 hover:text-orange-600">Back to cart</Link>
        </div>
        {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</div>}
        {!cart.length ? <EmptyCart /> : !addresses.length ? <NoAddress /> : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <section className="space-y-8">
              {!draft ? <AddressChooser addresses={addresses} shippingId={shippingId} setShippingId={setShippingId} billingId={billingId} setBillingId={setBillingId} sameBilling={sameBilling} setSameBilling={setSameBilling} /> : <DraftReview draft={draft} onChange={() => setDraft(null)} />}
            </section>
            <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-extrabold">Pricing status</h2>
              <div className="mt-6 space-y-4 text-sm"><div className="flex justify-between"><span>Product subtotal</span><strong>{money(draft?.subtotalPaise ?? subtotalPaise)}</strong></div><div className="flex justify-between"><span>Shipping</span><strong>To be calculated</strong></div><div className="flex justify-between"><span>GST</span><strong>To be calculated</strong></div><div className="flex justify-between border-t pt-4 text-base"><span>Final total</span><strong>Not finalized</strong></div></div>
              {!draft ? <button onClick={createDraft} disabled={creating} className="mt-7 w-full rounded-full bg-orange-600 px-6 py-4 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60">{creating ? "Creating draft…" : "Create checkout draft"}</button> : <button disabled className="mt-7 w-full cursor-not-allowed rounded-full bg-gray-200 px-6 py-4 font-extrabold text-gray-600">Final pricing not ready</button>}
              <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800"><strong>Payment ready: No.</strong> Payment becomes available after shipping, GST, inventory, and final order validation.</div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyCart() { return <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center"><h2 className="text-xl font-bold">Your cart is empty</h2><Link href="/products" className="mt-5 inline-block rounded-full bg-orange-600 px-6 py-3 font-bold text-white">Browse products</Link></div>; }
function NoAddress() { return <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center"><h2 className="text-xl font-bold">Add a business address to continue</h2><p className="mt-2 text-gray-600">Checkout uses addresses saved in your buyer account.</p><Link href="/account" className="mt-5 inline-block rounded-full bg-orange-600 px-6 py-3 font-bold text-white">Manage addresses</Link></div>; }

function AddressChooser({ addresses, shippingId, setShippingId, billingId, setBillingId, sameBilling, setSameBilling }) {
  return <><div className="rounded-2xl border border-gray-200 bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Shipping address</h2><Link href="/account" className="text-sm font-bold text-orange-600">Add or manage</Link></div><div className="mt-5 grid gap-4 md:grid-cols-2">{addresses.map((address) => <AddressOption key={address.id} name="shipping" address={address} selected={shippingId === address.id} onSelect={() => setShippingId(address.id)} />)}</div></div><div className="rounded-2xl border border-gray-200 bg-white p-6"><label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={sameBilling} onChange={(event) => setSameBilling(event.target.checked)} className="h-4 w-4 accent-orange-600" />Use shipping address for billing</label>{!sameBilling && <div className="mt-5 grid gap-4 md:grid-cols-2">{addresses.map((address) => <AddressOption key={address.id} name="billing" address={address} selected={billingId === address.id} onSelect={() => setBillingId(address.id)} />)}</div>}</div></>;
}

function DraftReview({ draft, onChange }) {
  return <div className="rounded-2xl border border-green-200 bg-white p-6"><p className="text-sm font-bold uppercase tracking-wider text-green-700">Draft created</p><h2 className="mt-2 text-2xl font-extrabold">Review saved cart snapshot</h2><p className="mt-2 text-sm text-gray-600">Draft #{draft.draftId} · Expires {new Date(draft.expiresAt).toLocaleString("en-IN")}</p>{draft.stale && <p className="mt-4 rounded-xl bg-amber-50 p-4 font-semibold text-amber-800">This draft is stale or expired. Create a new draft.</p>}<div className="mt-6 space-y-4">{draft.sellerGroups?.map((group) => <div key={group.vendorId} className="rounded-xl border border-gray-200 p-4"><p className="font-bold">{group.sellerSnapshot?.displayName || `Seller ${group.vendorId}`}</p>{group.items?.map((item) => <div key={item.productId} className="mt-3 flex justify-between gap-4 text-sm"><span>{item.productName} × {item.quantity}</span><span className="font-bold">{money(item.lineSubtotalPaise)}</span></div>)}</div>)}</div><button onClick={onChange} className="mt-6 text-sm font-bold text-orange-600">Change addresses and create a new draft</button></div>;
}
