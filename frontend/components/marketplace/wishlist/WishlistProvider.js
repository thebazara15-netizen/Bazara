"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { decodeToken, getToken } from "../../../utils/auth";

const WishlistContext = createContext(null);
const subscribe = () => () => {};
const serverToken = () => null;

export function WishlistProvider({ children }) {
  const router = useRouter();
  const token = useSyncExternalStore(subscribe, getToken, serverToken);
  const role = token ? decodeToken(token)?.role || null : null;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(new Set());

  const load = useCallback(async () => {
    if (!token || role !== "CLIENT") { setItems([]); return; }
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/wishlist", { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load saved products");
      setItems(Array.isArray(data) ? data : []);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, [role, token]);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (product) => {
    if (!token || role !== "CLIENT") { router.push("/login"); return false; }
    const productId = Number(product.id);
    if (pending.has(productId)) return false;
    const existing = items.find((item) => Number(item.productId) === productId);
    const previous = items;
    setPending((current) => new Set(current).add(productId));
    setError(null);
    setItems(existing ? items.filter((item) => Number(item.productId) !== productId) : [{ id: `optimistic-${productId}`, productId, product }, ...items]);
    try {
      const response = await fetch(`/api/wishlist/${productId}`, { method: existing ? "DELETE" : "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update saved products");
      await load();
      return true;
    } catch (toggleError) { setItems(previous); setError(toggleError.message); return false; }
    finally { setPending((current) => { const next = new Set(current); next.delete(productId); return next; }); }
  }, [items, load, pending, role, router, token]);

  const value = useMemo(() => ({ items, savedIds: new Set(items.map((item) => Number(item.productId))), loading, error, pending, role, toggle, reload: load }), [error, items, load, loading, pending, role, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used within WishlistProvider");
  return value;
};
