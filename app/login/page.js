"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("Maihoo");
  const [logoSrc, setLogoSrc] = useState("/logos/maihoo.png");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // 🧠 Detect subdomain (client-only)
  // inside useEffect (just after setLoaded(true))
  useEffect(() => {
    const host = window.location.hostname;
    const parts = host.split(".");
    if (parts.length > 2 && parts[0] !== "www") {
      setOrgName(parts[0].toUpperCase());
      // setLogoSrc(`/logos/${parts[0].toLowerCase()}.png`); for dynamic
    }

    // ✅ check for existing session
    const existingUser = localStorage.getItem("bgvUser");
    if (existingUser) {
      try {
        const user = JSON.parse(existingUser);
        const tokenCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("bgvTemp="));

        // if token missing → clear stale localStorage
        if (!tokenCookie) {
          localStorage.removeItem("bgvUser");
        } else {
          // optional: auto redirect valid user
          const role = user.role?.toUpperCase();
          if (["SUPER_ADMIN", "SUPER_ADMIN_HELPER"].includes(role))
            router.replace("/superadmin/dashboard");
          else if (["ORG_HR", "HELPER"].includes(role))
            router.replace("/org/dashboard");
        }
      } catch {
        localStorage.removeItem("bgvUser");
      }
    }

    setLoaded(true);
  }, []);

  // ⏳ Prevent SSR mismatch
  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Image src="/logos/maihooLogo.png" alt="logo" width={160} height={50} />
        <p className="text-gray-500 mt-4">Loading…</p>
      </div>
    );
  }

  // 🔐 Handle login
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("https://maihoo.onrender.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      // Save lightweight user info
      localStorage.setItem("bgvUser", JSON.stringify(data));

      // ⚡ Temporary visible cookie (1 hour)
      if (data.token) {
        document.cookie = `bgvTemp=${data.token}; path=/; max-age=${
          60 * 60
        }; samesite=lax; secure`;
      }

      setRedirecting(true);

      // Determine redirect path based on role
      const role = data.role?.toUpperCase();
      let redirectPath = "/";

      if (["SUPER_ADMIN", "SUPER_ADMIN_HELPER", "SPOC"].includes(role)) {
        redirectPath = "/superadmin/dashboard";
      } else if (["ORG_HR", "HELPER"].includes(role)) {
        redirectPath = "/org/dashboard";
      }

      // Small delay → ensure cookie persisted
      setTimeout(() => {
        router.replace(redirectPath);
      }, 800);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden relative">
      {/* Header */}
      <header className="w-full p-2 flex justify-start items-center">
        <Image
          src={logoSrc}
          alt={`${orgName} Logo`}
          width={160}
          height={50}
          priority
          className="bg-transparent hover:scale-105 transition-transform duration-300"
        />
      </header>

      {/* Body Section */}
      <div className="flex flex-1 items-center justify-center px-10 pb-10 md:pb-0 -mt-8">
        {/* Left Illustration (Desktop only) */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-transparent">
          <div className="w-full max-w-[420px] rounded-2xl overflow-hidden">
            <Image
              src="/logos/bgvImage.png"
              alt="Login Illustration"
              width={420}
              height={480}
              className="object-cover w-full h-[500px]"
            />
          </div>
        </div>

        {/* Login Form */}
        <div className="flex flex-1 items-center justify-center -mt-10">
          <div className="w-full max-w-md flex flex-col justify-center">
            <h2 className="text-4xl font-semibold text-gray-800 mb-8 text-center">
              Welcome to {orgName} 👋
            </h2>

            <form
              onSubmit={handleLogin}
              className="flex flex-col justify-center bg-white border border-gray-200 rounded-2xl p-12 shadow-sm"
            >
              <div className="mb-6">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full border border-gray-300 rounded-md p-4 text-black placeholder-gray-600 focus:ring-2 focus:ring-[#ff004f] outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-8">
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full border border-gray-300 rounded-md p-4 text-black placeholder-gray-600 focus:ring-2 focus:ring-[#ff004f] outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff004f] text-white py-4 rounded-md font-medium text-lg hover:bg-[#e60047] transition disabled:opacity-50"
              >
                {loading ? "Logging in…" : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Redirecting overlay */}
      {redirecting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ff004f] border-t-transparent mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-700 animate-pulse">
            Redirecting to your dashboard…
          </h3>
        </div>
      )}
    </div>
  );
}
