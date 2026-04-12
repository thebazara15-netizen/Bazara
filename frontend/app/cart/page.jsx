"use client";

import { useEffect, useState } from "react";

export default function CartPage() {
  const [cart, setCart] = useState([]);

  const token = typeof document !== "undefined"
    ? document.cookie
        .split("; ")
        .find(row => row.startsWith("token="))
        ?.split("=")[1]
    : null;

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    const res = await fetch("process.env.NEXT_PUBLIC_API_URL/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const updateQuantity = async (cartId, quantity) => {
    if (quantity <= 0) return;

    await fetch(`process.env.NEXT_PUBLIC_API_URL/api/cart/${cartId}`, {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
    });

    fetchCart();
    };

    const removeItem = async (cartId) => {
    await fetch(`process.env.NEXT_PUBLIC_API_URL/api/cart/${cartId}`, {
        method: "DELETE",
        headers: {
        Authorization: `Bearer ${token}`
        }
    });

    fetchCart();
    };

    const data = await res.json();
    setCart(data);
  };

  const placeOrder = async () => {
    const res = await fetch("process.env.NEXT_PUBLIC_API_URL/api/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      alert("Order placed successfully");
      fetchCart();
    } else {
      alert("Order failed");
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.product.finalPrice * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      {/* Cart Items */}
        {cart.map(item => (
        <div
            key={item.id}
            className="flex items-center bg-gray-800 p-4 rounded-lg"
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

            {/* 🔥 QUANTITY CONTROLS */}
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

            {/* 🔥 REMOVE BUTTON */}
            <button
            onClick={() => removeItem(item.id)}
            className="bg-red-600 px-4 py-2 rounded ml-4"
            >
            Remove
            </button>

        </div>
        ))}

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