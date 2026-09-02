"use client";

import { useState } from "react";
import Icon from "../Icons";

function ImageFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] text-slate-400">
      <Icon name="package" className="h-12 w-12" />
      <span className="text-xs font-bold uppercase tracking-[0.16em]">Image unavailable</span>
    </div>
  );
}

export default function ProductGallery({ productName, images }) {
  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(new Set());
  const activeImage = validImages[activeIndex];
  const activeFailed = !activeImage || failedImages.has(activeImage);

  const markFailed = (image) => setFailedImages((current) => new Set([...current, image]));
  const move = (direction) => setActiveIndex((current) => (current + direction + validImages.length) % validImages.length);

  return (
    <section aria-label="Product images" className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white sm:aspect-[4/3] lg:aspect-square">
        {activeFailed ? <ImageFallback /> : (
          // Product images can originate from the configured API host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activeImage} alt={productName || "Product"} onError={() => markFailed(activeImage)} className="h-full w-full object-contain p-4 sm:p-7" />
        )}
        {validImages.length > 1 && <>
          <button type="button" onClick={() => move(-1)} aria-label="Previous product image" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl font-bold text-slate-800 shadow-lg hover:bg-slate-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">‹</button>
          <button type="button" onClick={() => move(1)} aria-label="Next product image" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl font-bold text-slate-800 shadow-lg hover:bg-slate-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">›</button>
          <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold text-white">{activeIndex + 1} / {validImages.length}</span>
        </>}
      </div>

      {validImages.length > 1 && (
        <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2" aria-label="Choose product image">
          {validImages.map((image, index) => (
            <button key={`${image}-${index}`} type="button" onClick={() => setActiveIndex(index)} aria-label={`Show product image ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} className={`h-20 w-20 shrink-0 snap-start overflow-hidden rounded-xl border-2 bg-white p-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${index === activeIndex ? "border-orange-600" : "border-slate-200 hover:border-slate-400"}`}>
              {failedImages.has(image) ? <ImageFallback /> : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" onError={() => markFailed(image)} className="h-full w-full rounded-lg object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
