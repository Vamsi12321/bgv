"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/proxy/public/forgot-password", {
        method: "POST",
        credentials: "include",
        body: (() => {
          const fd = new FormData();
          fd.append("email", email);
          return fd;
        })(),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.detail || "Failed to send reset link.");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMsg("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-md w-full mx-auto bg-white shadow-xl border border-gray-200 rounded-2xl p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Image
            src="/logos/maihoo.png"
            width={120}
            height={40}
            alt="Maihoo"
            className="mx-auto"
          />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Forgot Password?
          </h1>
          <p className="text-gray-600 mt-1">
            Enter your email and we’ll send you a reset link.
          </p>
        </div>

        {/* Success Message */}
        {submitted ? (
          <div className="text-center py-10">
            <CheckCircle2 className="text-green-500 mx-auto" size={60} />
            <h2 className="text-2xl font-bold mt-4 text-gray-800">
              Email Sent!
            </h2>
            <p className="text-gray-600 mt-2">
              Check your inbox for a password reset link.
            </p>

            <button
              onClick={() => router.push("/login")}
              className="mt-6 bg-[#ff004f] text-white px-6 py-3 rounded-xl shadow hover:bg-red-600 transition font-semibold"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                <AlertCircle size={20} className="text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="
                      w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 
                      placeholder-gray-400 focus:border-[#ff004f] 
                      focus:ring-4 focus:ring-[#ff004f]/10 outline-none transition
                    "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full bg-gradient-to-r from-[#ff004f] to-[#e60047] text-white py-3.5 rounded-xl font-semibold
                  hover:shadow-lg hover:shadow-[#ff004f]/30 active:scale-95 transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="text-center mt-6">
              <button
                onClick={() => router.push("/login")}
                className="text-sm font-medium text-[#ff004f] hover:underline"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
