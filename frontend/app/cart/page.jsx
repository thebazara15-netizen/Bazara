"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);

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
      const res = await fetch(`${API}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setCart(data);
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ UPDATE QUANTITY
  const updateQuantity = async (cartId, quantity) => {
    if (quantity <= 0) return;

    const token = getToken();

    await fetch(`${API}/api/cart/${cartId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ quantity })
    });

    fetchCart(token);
  };

  // ✅ REMOVE ITEM
  const removeItem = async (cartId) => {
    const token = getToken();

    await fetch(`${API}/api/cart/${cartId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    fetchCart(token);
  };

  // ✅ PLACE ORDER
  const placeOrder = async () => {
    const token = getToken();

    const res = await fetch(`${API}/api/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      alert("Order placed successfully");
      fetchCart(token);
    } else {
      alert("Order failed");
    }
  };

  // ✅ TOTAL
  const total = cart.reduce(
    (sum, item) => sum + item.product.finalPrice * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      {/* Cart Items */}
      {cart.length === 0 ? (
        <p>No items in cart</p>
      ) : (
        cart.map(item => (
          <div
            key={item.id}
            className="flex items-center bg-gray-800 p-4 rounded-lg mb-4"
          >

            {/* Image */}
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-24 h-24 object-cover rounded mr-4"
            />

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {item.product.name}
              </h2>

              <p className="text-gray-400">
                ₹{item.product.finalPrice}
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

        <button
          onClick={placeOrder}
          className="mt-4 bg-orange-600 px-6 py-3 rounded hover:bg-orange-700"
        >
          Place Order
        </button>
      </div>

    </div>
  );
}