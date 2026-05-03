"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setTokenCookie } from "../../../utils/auth";

export default function SocialCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");

    if (!token) {
      router.replace("/login?socialError=Social login did not return a token");
      return;
    }

    setTokenCookie(token);

    const redirect = localStorage.getItem("redirect");
    localStorage.removeItem("redirect");
    router.replace(redirect || "/");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 text-gray-950">
      <p className="text-sm font-semibold text-gray-600">Signing you in...</p>
    </main>
  );
}
