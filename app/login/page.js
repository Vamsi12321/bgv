"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [orgName, setOrgName] = useState("Maihoo");
  const [logoSrc, setLogoSrc] = useState("/logos/maihoo.png");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    const parts = host.split(".");
    if (parts.length > 2 && parts[0] !== "www") {
      setOrgName(parts[0].toUpperCase());
    }

    const existingUser = localStorage.getItem("bgvUser");
    const sessionCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bgvSession="));

    // ❌ Stale localStorage but no cookie → clear everything
    if (!sessionCookie && existingUser) {
      localStorage.removeItem("bgvUser");
      clearStaleCookies();
    }

    // Logged in → auto redirect
    if (sessionCookie && existingUser) {
      try {
        const user = JSON.parse(existingUser);
        const role = user.role?.toUpperCase();

        if (["SUPER_ADMIN", "SUPER_ADMIN_HELPER", "SUPER_SPOC"].includes(role))
          router.replace("/superadmin/dashboard");
        else if (["ORG_HR", "HELPER", "SPOC", "ORG_SPOC"].includes(role))
          router.replace("/org/dashboard");
      } catch {
        localStorage.removeItem("bgvUser");
        clearStaleCookies();
      }
    }

    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff004f] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  function clearStaleCookies() {
    document.cookie = "bgvUser=; Path=/; Max-Age=0;";
    document.cookie = "bgvSession=; Path=/; Max-Age=0;";
    document.cookie = "bgvTemp=; Path=/; Max-Age=0;";
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/proxy/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.detail || "Login failed");
        return;
      }
      // SUCCESS LOGIN
      localStorage.setItem("bgvUser", JSON.stringify(data));

      // set bgvUser cookie (required for middleware RBAC)
      document.cookie = `bgvUser=${encodeURIComponent(
        JSON.stringify({
          role: data.role,
          userName: data.userName,
          email: data.email,
          organizationId: data.organizationId,
        })
      )}; Path=/; Max-Age=${60 * 60 * 2}; SameSite=Lax; Secure`;

      // session cookie
      document.cookie = `bgvSession=${data.token}; Path=/; Max-Age=${
        60 * 60 * 2
      }; SameSite=Lax; Secure`;

      setRedirecting(true);

      // role-based redirect
      const role = data.role?.toUpperCase();
      let redirectPath = "/";

      if (["SUPER_ADMIN", "SUPER_ADMIN_HELPER", "SUPER_SPOC"].includes(role)) {
        redirectPath = "/superadmin/dashboard";
      } else if (["ORG_HR", "HELPER", "SPOC", "ORG_SPOC"].includes(role)) {
        redirectPath = "/org/dashboard";
      }

      setTimeout(() => {
        router.replace(redirectPath);
      }, 300);
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Left Side - Branding & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#ff004f] to-[#cc0040] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 inline-block">
            <Image
              src={logoSrc}
              alt={`${orgName} Logo`}
              width={140}
              height={40}
              priority
              className="brightness-0 invert"
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-white">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Welcome to
            <br />
            <span className="text-white/90">{orgName}</span>
          </h1>
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            Enterprise Background Verification Platform
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              "Secure & Compliant Verification",
              "Real-time Status Tracking",
              "AI-Powered Screening",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Illustration */}
        <div className="absolute bottom-12 right-12 opacity-20">
          <div className="w-64 h-64 rounded-full bg-white/10"></div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Image
              src={logoSrc}
              alt={`${orgName} Logo`}
              width={140}
              height={40}
              priority
              className="mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
            <p className="text-gray-600">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    emailFocused ? "text-[#ff004f]" : "text-gray-400"
                  }`}
                >
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 
                    focus:border-[#ff004f] focus:ring-4 focus:ring-[#ff004f]/10 outline-none transition-all duration-200
                    hover:border-gray-300"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    passwordFocused ? "text-[#ff004f]" : "text-gray-400"
                  }`}
                >
                  <Lock size={20} />
                </div>
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 
                    focus:border-[#ff004f] focus:ring-4 focus:ring-[#ff004f]/10 outline-none transition-all duration-200
                    hover:border-gray-300"
                />
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
                <AlertCircle
                  size={20}
                  className="text-red-600 flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-red-800">{errorMsg}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ff004f] to-[#e60047] text-white py-3.5 rounded-xl font-semibold text-base
                hover:shadow-lg hover:shadow-[#ff004f]/30 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Secured by enterprise-grade encryption</p>
          </div>
        </div>
      </div>

      {/* Redirecting Overlay */}
      {redirecting && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fadeIn">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ff004f] border-t-transparent mx-auto"></div>
              <div className="absolute inset-0 rounded-full bg-[#ff004f]/20 animate-ping"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}
