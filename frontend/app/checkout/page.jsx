"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const formatINR = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

export default function CheckoutPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [step, setStep] = useState("address");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [rememberCard, setRememberCard] = useState(true);
  const [form, setForm] = useState({
    country: "India",
    fullName: "",
    phone: "",
    street: "",
    apartment: "",
    state: "",
    city: "",
    postalCode: "",
    defaultAddress: false
  });

  const getToken = () => {
    if (typeof document === "undefined") return null;

    return document.cookie
      .split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1];
  };

  const normalizeImage = (image) => {
    if (!image) return "/industrial.jpg";
    if (String(image).startsWith("http") || String(image).startsWith("/")) return image;
    return `${API}/uploads/${image}`;
  };

  const getProductImage = (product) => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return normalizeImage(product.images[0]);
    }

    return normalizeImage(product?.image);
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      localStorage.setItem("redirect", "/checkout");
      router.push("/login");
      return;
    }

    fetchCart(token);
  }, []);

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
        alert(data.message || "Unable to load checkout");
        return;
      }

      const items = Array.isArray(data) ? data : [];

      setCart(
        items.map((item) => ({
          ...item,
          quantity: Number(item?.quantity || 0),
          price: Number(item?.price || 0),
          product: {
            name: item?.product?.name || "Product unavailable",
            ...item?.product
          }
        }))
      );
    } catch (error) {
      console.error(error);
      alert("Error loading checkout");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const itemSubtotal = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const shippingFee = cart.length > 0 ? Math.max(250, itemSubtotal * 0.03) : 0;
    const processingFee = cart.length > 0 ? (itemSubtotal + shippingFee) * 0.018 : 0;
    const payTotal = itemSubtotal + shippingFee + processingFee;
    const totalQuantity = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    return {
      itemSubtotal,
      shippingFee,
      processingFee,
      payTotal,
      totalQuantity
    };
  }, [cart]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const useCurrentLocation = () => {
    updateField("street", "Current location selected");
  };

  const continueToPayment = () => {
    const requiredFields = ["fullName", "phone", "street", "state", "city", "postalCode"];
    const missingField = requiredFields.find((field) => !String(form[field] || "").trim());

    if (missingField) {
      alert("Please complete the required shipping address fields");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const payNow = async () => {
    const token = getToken();

    try {
      setPlacingOrder(true);
      setPaymentError("");

      const loaded = await loadRazorpayScript();

      if (!loaded) {
        setPaymentError("Unable to load the secure payment window. Please check your connection and try again.");
        return;
      }

      const orderRes = await fetch(`${API}/api/payments/checkout-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ address: form })
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setPaymentError(orderData.message || "Unable to create payment order");
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Bazara",
        description: `B2B marketplace order (${totals.totalQuantity} items)`,
        order_id: orderData.order.id,
        prefill: {
          name: form.fullName,
          contact: form.phone
        },
        notes: {
          city: form.city,
          postalCode: form.postalCode
        },
        theme: {
          color: "#ea580c"
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/api/payments/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(response)
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              setPaymentError(verifyData.message || "Payment verification failed");
              return;
            }

            alert("Payment successful. Order placed.");
            router.push("/#featured-products");
          } catch (error) {
            console.error(error);
            setPaymentError("Payment completed, but verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentError("Payment was cancelled before completion.");
          }
        }
      });

      razorpay.open();
    } catch (error) {
      console.error(error);
      setPaymentError("Unable to start payment. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const shippingLine = [
    form.street,
    form.apartment,
    form.city,
    form.state,
    form.postalCode,
    form.country
  ].filter(Boolean).join(", ");

  const OrderSummary = ({ showPayButton = false }) => (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
        <h2 className="text-2xl font-extrabold">Order summary ({totals.totalQuantity} items)</h2>

        <div className="mt-6 flex -space-x-4 overflow-hidden">
          {cart.slice(0, 5).map((item) => (
            <img
              key={item.id}
              src={getProductImage(item.product)}
              alt={item.product?.name || "Cart item"}
              className="h-16 w-16 rounded-lg border-2 border-white bg-gray-100 object-cover"
            />
          ))}
          {cart.length > 5 && (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-white bg-gray-950 text-sm font-bold text-white">
              +{cart.length - 5}
            </div>
          )}
        </div>

        <div className="mt-8 space-y-5 text-base">
          <div className="flex items-center justify-between gap-4">
            <span>Item subtotal</span>
            <span className="font-bold">{formatINR(totals.itemSubtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>{showPayButton ? "Shipping fee" : "Estimated shipping fee"}</span>
            <span className="font-bold">{formatINR(totals.shippingFee)}</span>
          </div>
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between gap-4">
              <span>Payment processing fee</span>
              <span className="font-bold">{formatINR(totals.processingFee)}</span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between gap-4 text-xl">
              <span className="font-bold">Pay in INR</span>
              <span className="font-extrabold">{formatINR(totals.payTotal)}</span>
            </div>
          </div>
        </div>

        {showPayButton && (
          <>
            <button
              onClick={payNow}
              disabled={placingOrder}
              className="mt-6 w-full rounded-full bg-orange-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            >
              {placingOrder ? "Paying..." : "Pay now"}
            </button>
            <p className="mt-4 text-xs leading-5 text-gray-500">
              By clicking above, you agree to Bazara&apos;s terms and privacy policy.
            </p>
            {paymentError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                {paymentError}
              </p>
            )}
          </>
        )}

        <div className="mt-7 space-y-5 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-extrabold">Bazara order protection</h3>
            <span className="text-2xl">&gt;</span>
          </div>

          <div className="grid gap-5 text-sm leading-6 text-gray-700">
            <div className="grid grid-cols-[24px_1fr] gap-3">
              <span className="font-bold text-green-700">OK</span>
              <div>
                <p className="font-bold text-gray-950">Secure payments</p>
                <p>Every payment is secured with SSL encryption and strict data protection protocols.</p>
              </div>
            </div>

            <div className="grid grid-cols-[24px_1fr] gap-3">
              <span className="font-bold text-green-700">OK</span>
              <div>
                <p className="font-bold text-gray-950">Delivery via Bazara Logistics</p>
                <p>Expect delivery updates and order tracking from your account.</p>
              </div>
            </div>

            <div className="grid grid-cols-[24px_1fr] gap-3">
              <span className="font-bold text-green-700">OK</span>
              <div>
                <p className="font-bold text-gray-950">Money-back protection</p>
                <p>Claim support if an order does not ship, is missing, or arrives with product issues.</p>
              </div>
            </div>
          </div>

          <p className="text-xs leading-5 text-gray-500">
            Only orders placed and paid through Bazara can enjoy free order protection.
          </p>
        </div>
      </div>
    </aside>
  );

  return (
    <main className="min-h-screen bg-white text-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <button
          onClick={() => (step === "payment" ? setStep("address") : router.push("/cart"))}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-500 hover:text-orange-600"
        >
          <span aria-hidden="true">&lt;-</span>
          {step === "payment" ? "Back to shipping" : "Back to cart"}
        </button>

        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Checkout</h1>
        <div className="mt-8 border-t border-gray-200" />

        {loading ? (
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-gray-600">Loading checkout...</p>
          </div>
        ) : cart.length === 0 ? (
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <button
              onClick={() => router.push("/#featured-products")}
              className="mt-6 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
            >
              Browse products
            </button>
          </div>
        ) : step === "address" ? (
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="min-w-0">
              <div className="mx-auto max-w-4xl">
                <h2 className="text-2xl font-extrabold">Shipping address</h2>

                <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-green-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-green-200 bg-green-50">LOCK</span>
                  Your information is encrypted and secure
                </div>

                <div className="mt-6 rounded-lg border border-gray-200 px-4 py-3">
                  <label className="block text-xs font-medium text-gray-500">Country / region <span className="text-red-500">*</span></label>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-base font-semibold">India</span>
                    <span className="text-xl text-gray-400">v</span>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="rounded-lg border border-gray-200 px-4 py-3">
                    <span className="block text-xs font-medium text-gray-500">First name and Last name <span className="text-red-500">*</span></span>
                    <input
                      value={form.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      placeholder="Rohit Sharma"
                      className="mt-1 w-full bg-transparent text-base outline-none"
                    />
                  </label>

                  <div>
                    <div className="flex rounded-lg border border-gray-200">
                      <div className="flex items-center border-r border-gray-200 px-4 text-sm font-semibold">+91</div>
                      <label className="min-w-0 flex-1 px-4 py-3">
                        <span className="block text-xs font-medium text-gray-500">Phone number <span className="text-red-500">*</span></span>
                        <input
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          placeholder="Phone number"
                          className="mt-1 w-full bg-transparent text-base outline-none"
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Only used to contact you for delivery updates</p>
                  </div>
                </div>

                <div className="mt-7 rounded-lg bg-gradient-to-r from-gray-100 to-white px-4 py-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">SEARCH</span>
                    <div>
                      <p className="font-bold">Find your address</p>
                      <p className="text-sm text-gray-500">Search by your street address or pin on map</p>
                    </div>
                  </div>
                </div>

                <label className="mt-6 flex items-center gap-4 rounded-lg border border-gray-200 px-4 py-4">
                  <input
                    value={form.street}
                    onChange={(e) => updateField("street", e.target.value)}
                    placeholder="Street address or P.O. box *"
                    className="min-w-0 flex-1 bg-transparent text-base outline-none"
                  />
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className="hidden text-sm font-semibold underline transition hover:text-orange-600 sm:inline"
                  >
                    Use my current location
                  </button>
                </label>

                <input
                  value={form.apartment}
                  onChange={(e) => updateField("apartment", e.target.value)}
                  placeholder="Apartment, suite, unit, building, floor (optional)"
                  className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-orange-500"
                />

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <input
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="State / province *"
                    className="rounded-lg border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-orange-500"
                  />
                  <input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="City *"
                    className="rounded-lg border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-orange-500"
                  />
                  <input
                    value={form.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    placeholder="Postal code *"
                    className="rounded-lg border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-orange-500"
                  />
                </div>

                <label className="mt-7 flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.defaultAddress}
                    onChange={(e) => updateField("defaultAddress", e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300"
                  />
                  Set as default shipping address
                </label>

                <button
                  onClick={continueToPayment}
                  className="mt-10 rounded-full bg-orange-600 px-9 py-4 text-base font-extrabold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
                >
                  Continue to payment
                </button>
              </div>
            </section>

            <OrderSummary />
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="min-w-0">
              <div className="mx-auto max-w-4xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold">Shipping address</h2>
                    <div className="mt-5 space-y-2 text-sm">
                      <p>
                        <span className="font-bold">{form.fullName}</span>
                        <span className="ml-5">(+91) {form.phone}</span>
                      </p>
                      <p>{shippingLine}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep("address")}
                    className="text-sm font-bold underline transition hover:text-orange-600"
                  >
                    Change
                  </button>
                </div>

                <div className="my-8 border-t border-gray-200" />

                <h2 className="text-xl font-extrabold">Payment method</h2>

                <div className="mt-7 rounded-lg border border-gray-950 p-5">
                  <label className="flex items-center gap-4">
                    <input
                      type="radio"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="h-5 w-5"
                    />
                    <span className="rounded bg-gray-100 px-3 py-2 text-sm font-bold">CARD</span>
                    <span className="font-bold">Pay securely with card</span>
                    <span className="hidden text-xs font-bold text-blue-700 md:inline">Visa Mastercard RuPay Amex</span>
                    <span className="hidden rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 md:inline">Razorpay secured</span>
                  </label>

                  <div className="mt-5 grid gap-4 pl-0 md:pl-14">
                    <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-4 text-sm leading-6 text-green-800">
                      Card details open inside Razorpay&apos;s secure payment window after you click Pay now.
                      Bazara never stores card numbers or CVV.
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={rememberCard}
                        onChange={(e) => setRememberCard(e.target.checked)}
                        className="h-4 w-4"
                      />
                      Remember this card
                    </label>
                  </div>
                </div>

                {[
                  ["upi", "UPI", "Instant bank transfer"],
                  ["netbanking", "Netbanking", "NEW"],
                  ["wallet", "Wallet", "Fast checkout"],
                  ["emi", "EMI", "Eligible cards"]
                ].map(([id, label, badge]) => (
                  <label key={id} className="mt-6 flex items-center gap-4 px-6">
                    <input
                      type="radio"
                      checked={paymentMethod === id}
                      onChange={() => setPaymentMethod(id)}
                      className="h-5 w-5"
                    />
                    <span className="w-20 rounded bg-gray-100 px-3 py-2 text-center text-sm font-bold">{label.split(" ")[0]}</span>
                    <span className="font-bold">{label}</span>
                    {badge && <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">{badge}</span>}
                  </label>
                ))}

                <button className="mx-auto mt-9 block text-sm font-medium hover:text-orange-600">
                  More options v
                </button>
              </div>
            </section>

            <OrderSummary showPayButton />
          </div>
        )}
      </div>
    </main>
  );
}
