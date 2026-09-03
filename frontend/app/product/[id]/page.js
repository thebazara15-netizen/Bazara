"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import MarketplaceFooter from "../../../components/marketplace/MarketplaceFooter";
import InquiryPanel from "../../../components/marketplace/product/InquiryPanel";
import PriceTierTable from "../../../components/marketplace/product/PriceTierTable";
import ProductBuyBox from "../../../components/marketplace/product/ProductBuyBox";
import ProductGallery from "../../../components/marketplace/product/ProductGallery";
import ProductInfo from "../../../components/marketplace/product/ProductInfo";
import { ProductLoadingState, ProductUnavailableState } from "../../../components/marketplace/product/ProductPageState";
import ProductSupplierCard from "../../../components/marketplace/product/ProductSupplierCard";
import RelatedProducts from "../../../components/marketplace/product/RelatedProducts";
import { formatPrice, getUnitPrice, hasPrice } from "../../../components/marketplace/product/pricing";
import { decodeToken, getToken } from "../../../utils/auth";
import WishlistButton from "../../../components/marketplace/wishlist/WishlistButton";

const API = "/api";
const subscribeToAuthCookie = () => () => {};
const getServerToken = () => null;

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const rawProductId = Array.isArray(params.id) ? params.id[0] : params.id;
  const productId = Number(rawProductId);
  const invalidProductId = !Number.isInteger(productId) || productId <= 0;
  const token = useSyncExternalStore(subscribeToAuthCookie, getToken, getServerToken);
  const viewerRole = token ? decodeToken(token)?.role || null : null;

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [pageState, setPageState] = useState("loading");
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartProducts, setCartProducts] = useState(new Set());
  const [cartLoading, setCartLoading] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (invalidProductId) return;
    let cancelled = false;
    const loadProduct = async () => {
      try {
        const response = await fetch(`${API}/products/${productId}`);
        if (response.status === 404) {
          if (!cancelled) setPageState("not-found");
          return;
        }
        if (!response.ok) throw new Error("Product request failed");
        const found = await response.json();
        if (cancelled) return;
        const moq = Math.max(1, Number(found.moq) || 1);
        setProduct(found);
        setQuantity(moq);
        setPageState("ready");

        if (found.category) {
          const relatedQuery = new URLSearchParams({ category: found.category, page: "1", limit: "5" });
          fetch(`${API}/products?${relatedQuery.toString()}`)
            .then((relatedResponse) => relatedResponse.ok ? relatedResponse.json() : null)
            .then((relatedData) => {
              if (!cancelled) setRelatedProducts(Array.isArray(relatedData?.products) ? relatedData.products.filter((item) => Number(item.id) !== productId).slice(0, 4) : []);
            })
            .catch(() => {});
        }
      } catch {
        if (!cancelled) setPageState("error");
      }
    };
    loadProduct();
    return () => { cancelled = true; };
  }, [invalidProductId, productId]);

  useEffect(() => {
    if (!product?.vendorId) return;
    let cancelled = false;
    setSupplierLoading(true);
    fetch(`${API}/suppliers/${product.vendorId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled) setSupplier(data?.id ? data : null); })
      .catch(() => { if (!cancelled) setSupplier(null); })
      .finally(() => { if (!cancelled) setSupplierLoading(false); });
    return () => { cancelled = true; };
  }, [product?.vendorId]);

  useEffect(() => {
    if (!token || viewerRole !== "CLIENT") return;
    let cancelled = false;
    fetch(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        const items = Array.isArray(data) ? data : data.items;
        if (!cancelled && Array.isArray(items)) setCartProducts(new Set(items.map((item) => item.productId)));
      })
      .catch(() => {})
    return () => { cancelled = true; };
  }, [token, viewerRole]);

  const showToast = (message, type = "success", actionLabel = null, action = null) => {
    setToast({ message, type, actionLabel, action });
    window.setTimeout(() => setToast(null), 5000);
  };

  const addToCart = async (targetProduct = product, requestedQuantity = quantity) => {
    if (!token || viewerRole !== "CLIENT") {
      router.push("/login");
      return;
    }
    const minimum = Math.max(1, Number(targetProduct.moq) || 1);
    const validQuantity = Math.max(minimum, Number(requestedQuantity) || minimum);
    setCartLoading(true);
    try {
      const response = await fetch(`${API}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: targetProduct.id, quantity: validQuantity }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || "This product could not be added to the cart.", "error");
        return;
      }
      setCartProducts((current) => new Set([...current, targetProduct.id]));
      window.dispatchEvent(new Event("cart:changed"));
      showToast("Product added to cart.", "success", "View cart", () => router.push("/cart"));
    } catch {
      showToast("This product could not be added to the cart.", "error");
    } finally {
      setCartLoading(false);
    }
  };

  const sendInquiry = async ({ quantity: inquiryQuantity, message }) => {
    if (!token || viewerRole !== "CLIENT") {
      router.push("/login");
      return false;
    }
    setInquiryLoading(true);
    setInquiryStatus(null);
    try {
      const response = await fetch(`${API}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, quantity: Number(inquiryQuantity), message }),
      });
      const data = await response.json();
      if (!response.ok) {
        setInquiryStatus({ type: "error", message: data.message || "The enquiry could not be sent." });
        return false;
      }
      setInquiryStatus({ type: "success", message: "Message sent to supplier.", conversationId: data.conversationId });
      showToast("Enquiry sent successfully.");
      return true;
    } catch {
      setInquiryStatus({ type: "error", message: "The enquiry could not be sent right now." });
      return false;
    } finally {
      setInquiryLoading(false);
    }
  };

  if (invalidProductId) return <ProductUnavailableState type="invalid" />;
  if (pageState === "loading") return <ProductLoadingState />;
  if (pageState === "error") return <ProductUnavailableState type="error" />;
  if (pageState === "not-found" || !product) return <ProductUnavailableState type="not-found" />;

  const moq = Math.max(1, Number(product.moq) || 1);
  const currentUnitPrice = getUnitPrice(product, quantity);
  const supplierName = supplier?.companyName || [supplier?.firstName, supplier?.lastName].filter(Boolean).join(" ") || null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <div className="marketplace-container py-5 sm:py-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><Link href="/" className="hover:text-orange-700">Marketplace</Link><span aria-hidden="true">/</span>{product.category && <><Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-orange-700">{product.category}</Link><span aria-hidden="true">/</span></>}<span className="max-w-64 truncate text-slate-700" aria-current="page">{product.name}</span></nav>

        <div className="mt-5 grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,.9fr)] lg:items-start">
          <ProductGallery key={product.id} productName={product.name} images={product.images} />
          <section className="min-w-0">
            {product.category && <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="marketplace-eyebrow hover:text-orange-800">{product.category}</Link>}
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4"><h1 className="min-w-0 flex-1 text-3xl font-bold leading-tight tracking-[-0.03em] text-slate-950 sm:text-4xl">{product.name}</h1><WishlistButton product={product} viewerRole={viewerRole}/></div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">{supplierName && product.vendorId && <Link href={`/suppliers/${product.vendorId}`} className="font-bold text-slate-800 hover:text-orange-700">Sold by {supplierName}</Link>}{Number.isFinite(Number(product.moq)) && <span>MOQ: <strong className="text-slate-900">{product.moq} units</strong></span>}{Number.isFinite(Number(product.stock)) && <span>Recorded availability: <strong className="text-slate-900">{product.stock} units</strong></span>}</div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#111113] p-5 sm:p-6"><p className="text-xs font-semibold text-slate-500">Current unit price</p>{hasPrice(currentUnitPrice) ? <p className="mt-1 text-3xl font-bold text-red-400">{formatPrice(currentUnitPrice)}</p> : <p className="mt-2 text-xl font-bold text-orange-700">Contact Supplier for Price</p>}{product.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{product.description}</p>}</div>
            <div className="mt-5"><ProductBuyBox product={product} quantity={quantity} onQuantityChange={setQuantity} viewerRole={viewerRole} cartLoading={cartLoading} onAddToCart={() => addToCart()} onOpenInquiry={() => { setInquiryStatus(null); setInquiryOpen(true); }} /></div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="space-y-6"><PriceTierTable product={product} /><ProductInfo product={product} /></div>
          <ProductSupplierCard supplier={supplier} vendorId={product.vendorId} loading={supplierLoading} />
        </div>
      </div>

      <RelatedProducts products={relatedProducts} viewerRole={viewerRole} cartProducts={cartProducts} onAddToCart={(relatedProduct) => addToCart(relatedProduct, relatedProduct.moq)} />
      <MarketplaceFooter />

      {inquiryOpen && <InquiryPanel productName={product.name} initialQuantity={quantity} moq={moq} open onClose={() => setInquiryOpen(false)} onSubmit={sendInquiry} submitting={inquiryLoading} status={inquiryStatus} />}
      {toast && <div role="status" className={`fixed bottom-5 left-1/2 z-[80] w-[min(92vw,390px)] -translate-x-1/2 rounded-2xl px-5 py-4 text-white shadow-2xl ${toast.type === "error" ? "bg-rose-800" : "bg-slate-950"}`}><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium">{toast.message}</p>{toast.actionLabel && <button type="button" onClick={toast.action} className="shrink-0 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{toast.actionLabel}</button>}</div></div>}
    </main>
  );
}
