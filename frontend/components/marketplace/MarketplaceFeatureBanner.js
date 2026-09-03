import Link from "next/link";
import Icon from "./Icons";

const formatPrice = (product) => {
  const value = product?.finalPrice ?? product?.basePrice;
  return Number.isFinite(Number(value)) ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value)) : null;
};

export default function MarketplaceFeatureBanner({ product }) {
  const image = Array.isArray(product?.images) ? product.images.find(Boolean) : null;
  const price = formatPrice(product);
  return <section className="pb-12 sm:pb-16"><div className="marketplace-container"><article className="relative grid min-h-72 overflow-hidden rounded-[1.75rem] border border-red-400/20 bg-[linear-gradient(115deg,#7f1019,#e91f2a)] text-white shadow-2xl shadow-red-950/30 lg:grid-cols-[1fr_.8fr]">
    <div className="relative z-10 flex flex-col justify-center p-7 sm:p-10 lg:p-12"><p className="text-xs font-bold uppercase tracking-[.2em] text-red-100">Recently added to Bazara</p><h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">{product?.name || "A direct path to business sourcing"}</h2>{product ? <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"><span className="font-bold">{price || "Contact supplier for price"}</span>{product.moq != null && <span className="text-red-100">MOQ {product.moq} units</span>}</div> : <p className="mt-4 max-w-xl text-red-100">Explore products, discover suppliers, and post requirements for supplier quotations.</p>}<Link href={product ? `/product/${product.id}` : "/products"} className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:bg-[#161616]">{product ? "View product" : "Explore marketplace"}<Icon name="arrow" className="h-4 w-4" /></Link></div>
    <div className="relative min-h-64 overflow-hidden"><div className="absolute -bottom-28 right-4 h-96 w-96 rounded-full bg-black/25" />{image ? <img src={image} alt={product.name || "Recently added product"} className="relative z-10 h-full w-full object-contain p-8 drop-shadow-2xl" /> : <Icon name="package" className="absolute left-1/2 top-1/2 z-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 text-white/80" />}</div>
  </article></div></section>;
}
