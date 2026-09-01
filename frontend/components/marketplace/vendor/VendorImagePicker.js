"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";

const MAX_SIZE = 5 * 1024 * 1024;
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function VendorImagePicker({ files, onChange, onError, disabled = false }) {
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);
  const select = (event) => {
    const next = Array.from(event.target.files || []);
    if (next.length > 10) return onError("Select no more than 10 images.");
    if (next.some((file) => !allowed.has(file.type))) return onError("Use JPEG, PNG, or WEBP images only.");
    if (next.some((file) => file.size > MAX_SIZE)) return onError("Each image must be 5 MB or smaller.");
    onError(null); onChange(next); event.target.value = "";
  };
  if (disabled) return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Existing images remain unchanged while editing. Safe media replacement and lifecycle cleanup are reserved for a later task.</div>;
  return <div><div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"><label className="block cursor-pointer text-center"><span className="block font-bold">Choose product images</span><span className="mt-1 block text-xs text-slate-500">JPEG, PNG or WEBP · max 5 MB each · up to 10 images</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={select}/></label></div><p className="mt-2 text-xs font-semibold text-slate-600">{files.length} image{files.length === 1 ? "" : "s"} selected</p>{previews.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">{previews.map(({ file, url }, index) => <div key={`${file.name}-${file.lastModified}`} className="relative"><Image unoptimized width={240} height={240} src={url} alt={`Selected preview ${index + 1}`} className="aspect-square w-full rounded-xl object-cover"/><button type="button" onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`} className="absolute right-1 top-1 h-8 w-8 rounded-full bg-slate-950/80 text-white">×</button></div>)}</div>}</div>;
}
