const handleLogin = async () => {
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  if (loading) return;

  setLoading(true);

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ FIXED COOKIE FOR PRODUCTION
      document.cookie = `token=${data.token}; path=/; max-age=86400; samesite=None; secure`;

      alert("Login successful");

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "VENDOR") {
        router.push("/vendor");
      } else {
        router.push("/");
      }

    } else {
      alert(data.message || "Invalid credentials");
    }

  } catch (error) {
    console.error("Login error:", error);
    alert("Server error");
  } finally {
    setLoading(false);
  }
};