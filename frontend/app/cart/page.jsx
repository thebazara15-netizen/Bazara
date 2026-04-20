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
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">

      <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8">Your Cart</h1>

      {/* Cart Items */}
      {loading ? (
        <p className="text-sm md:text-base">Loading cart...</p>
      ) : cart.length === 0 ? (
        <p className="text-sm md:text-base">No items in cart</p>
      ) : (
        <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
          {cart.map(item => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-start bg-gray-800 p-4 md:p-6 rounded-lg gap-4 sm:gap-4"
            >

              {/* Image */}
              <img
                src={item.product?.image || "/industrial.jpg"}
                alt={item.product?.name || "Product image"}
                className="w-full sm:w-24 md:w-32 h-32 sm:h-24 md:h-32 object-cover rounded flex-shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-lg font-semibold truncate">
                  {item.product?.name || "Product unavailable"}
                </h2>

                <p className="text-gray-400 text-sm md:text-base mt-1">
                  ₹{item.product.finalPrice}
                </p>

                <p className="text-gray-400 text-xs md:text-sm">
                  Unit Price: {formatPrice(getUnitPrice(item))}
                </p>

                <p className="text-gray-400 text-xs md:text-sm">
                  Line Total: {formatPrice(item.price)}
                </p>

                {/* Quantity */}
                <div className="flex items-center gap-2 md:gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 10)}
                    className="bg-gray-600 hover:bg-gray-700 px-2 md:px-3 py-1 rounded text-sm md:text-base transition"
                  >
                    −
                  </button>

                  <span className="text-sm md:text-base font-medium">{item.quantity}</span>

                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 10)}
                    className="bg-gray-600 hover:bg-gray-700 px-2 md:px-3 py-1 rounded text-sm md:text-base transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.id)}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 px-3 md:px-4 py-2 rounded transition text-sm md:text-base font-medium"
              >
                Remove
              </button>

            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div className="sticky bottom-0 left-0 right-0 bg-gray-800 p-4 md:p-6 rounded-lg border-t-2 border-gray-700">
        <h2 className="text-lg md:text-2xl font-bold">
          Total: ₹{total.toFixed(2)}
        </h2>

        <p className="mt-1 md:mt-2 text-gray-300 text-sm md:text-base">
          Grand Total: {formatPrice(total)}
        </p>

        <button
          onClick={placeOrder}
          disabled={cart.length === 0}
          className="w-full mt-3 md:mt-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 md:px-6 py-2 md:py-3 rounded hover:disabled:opacity-60 transition text-sm md:text-base font-medium"
        >
          Place Order
        </button>
      </div>

    </div>
  );
}
