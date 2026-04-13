"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const formatPrice = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // ✅ Get token
  const getToken = () => {
    if (typeof document === "undefined") return null;

    return document.cookie
      .split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1];
  };

  // ✅ Protect page
  useEffect(() => {
    const token = getToken();

    if (!token) {
      localStorage.setItem("redirect", "/cart");
      router.push("/login");
      return;
    }

    fetchCart(token);
  }, []);

  // ✅ FETCH CART
  const fetchCart = async (token) => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to load cart");
        return;
      }

      const items = Array.isArray(data) ? data : [];

      setCart(
        items.map((item) => {
          const quantity = Number(item?.quantity || 0);
          const linePrice = Number(item?.price || 0);
          const fallbackUnitPrice =
            quantity > 0 ? linePrice / quantity : 0;

          return {
            ...item,
            product: {
              name: item?.product?.name || "Product unavailable",
              image: item?.product?.image || "/industrial.jpg",
              finalPrice: Number(
                item?.product?.finalPrice ??
                  item?.product?.basePrice ??
                  fallbackUnitPrice
              ),
              ...item?.product
            }
          };
        })
      );
    } catch (error) {
      console.error(error);
      alert("Error loading cart");
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATE QUANTITY
  const updateQuantity = async (cartId, quantity) => {
    if (quantity <= 0) return;

    const token = getToken();

    try {
      const res = await fetch(`${API}/api/cart/${cartId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to update quantity");
        return;
      }

      fetchCart(token);
    } catch (error) {
      console.error(error);
      alert("Error updating cart");
    }
  };

  // ✅ REMOVE ITEM
  const removeItem = async (cartId) => {
    const token = getToken();

    try {
      const res = await fetch(`${API}/api/cart/${cartId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to remove item");
        return;
      }

      fetchCart(token);
    } catch (error) {
      console.error(error);
      alert("Error removing item");
    }
  };

  // ✅ PLACE ORDER
  const placeOrder = async () => {
    const token = getToken();

    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Order failed");
        return;
      }

      alert("Order placed successfully");
      fetchCart(token);
    } catch (error) {
      console.error(error);
      alert("Error placing order");
    }
  };

  // ✅ TOTAL
  const getUnitPrice = (item) => {
    const productPrice = Number(item?.product?.finalPrice ?? item?.product?.basePrice);

    if (Number.isFinite(productPrice)) {
      return productPrice;
    }

    const linePrice = Number(item?.price);
    const quantity = Number(item?.quantity);

    if (Number.isFinite(linePrice) && Number.isFinite(quantity) && quantity > 0) {
      return linePrice / quantity;
    }

    return 0;
  };

  const total = cart.reduce((sum, item) => sum + Number(item?.price || 0), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      {/* Cart Items */}
      {loading ? (
        <p>Loading cart...</p>
      ) : cart.length === 0 ? (
        <p>No items in cart</p>
      ) : (
        cart.map(item => (
          <div
            key={item.id}
            className="flex items-center bg-gray-800 p-4 rounded-lg mb-4"
          >

            {/* Image */}
            <img
              src={item.product?.image || "/industrial.jpg"}
              alt={item.product?.name || "Product image"}
              className="w-24 h-24 object-cover rounded mr-4"
            />

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {item.product?.name || "Product unavailable"}
              </h2>

              <p className="text-gray-400">
                ₹{item.product.finalPrice}
              </p>

              <p className="text-gray-400">
                Unit Price: {formatPrice(getUnitPrice(item))}
              </p>

              <p className="text-gray-400">
                Line Total: {formatPrice(item.price)}
              </p>

              {/* Quantity */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 10)}
                  className="bg-gray-600 px-3 py-1 rounded"
                >
                  -
                </button>

                <span>{item.quantity}</span>

                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 10)}
                  className="bg-gray-600 px-3 py-1 rounded"
                >
                  +
                </button>
              </div>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeItem(item.id)}
              className="bg-red-600 px-4 py-2 rounded ml-4"
            >
              Remove
            </button>

          </div>
        ))
      )}

      {/* Total */}
      <div className="mt-10 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold">
          Total: ₹{total}
        </h2>

        <p className="mt-2 text-gray-300">
          Grand Total: {formatPrice(total)}
        </p>

        <button
          onClick={placeOrder}
          disabled={cart.length === 0}
          className="mt-4 bg-orange-600 px-6 py-3 rounded hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Place Order
        </button>
      </div>

    </div>
  );
}
