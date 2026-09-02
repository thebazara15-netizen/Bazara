"use client";

export default function QuantitySelector({ quantity, moq, onChange, disabled = false }) {
  const step = Math.max(1, Number(moq) || 1);
  const update = (value) => {
    const parsed = Number(value);
    onChange(Number.isFinite(parsed) && parsed >= step ? Math.floor(parsed) : step);
  };

  return (
    <div>
      <label htmlFor="product-quantity" className="text-sm font-bold text-slate-900">Order quantity</label>
      <div className="mt-2 flex h-12 max-w-xs items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-orange-600 focus-within:ring-2 focus-within:ring-orange-100">
        <button type="button" disabled={disabled || quantity <= step} onClick={() => update(quantity - step)} aria-label={`Decrease quantity by ${step}`} className="w-12 shrink-0 text-xl font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35">−</button>
        <input id="product-quantity" type="number" inputMode="numeric" min={step} step="1" value={quantity} disabled={disabled} onChange={(event) => update(event.target.value)} onBlur={(event) => update(event.target.value)} className="min-w-0 flex-1 border-x border-slate-200 px-2 text-center text-sm font-bold text-slate-950 outline-none" />
        <button type="button" disabled={disabled} onClick={() => update(quantity + step)} aria-label={`Increase quantity by ${step}`} className="w-12 shrink-0 text-xl font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35">+</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Minimum order: <strong className="text-slate-700">{step} units</strong></p>
    </div>
  );
}
