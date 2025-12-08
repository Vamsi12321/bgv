"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    email: "",
    organizationId: "",
    new_password: "",
    confirm_password: "",
  });

  // -----------------------------------------
  // INVALID LINK UI
  // -----------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white shadow-lg border border-red-200 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600">
            Invalid Reset Link
          </h2>
          <p className="text-gray-800 mt-3">
            Your reset link is missing or expired.
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // SUBMIT PASSWORD RESET
  // -----------------------------------------
  const submit = async () => {
    if (!form.email.trim()) {
      return setMessage({ error: "Email is required" });
    }
    if (!form.organizationId.trim()) {
      return setMessage({ error: "Organization ID is required" });
    }
    if (form.new_password !== form.confirm_password) {
      return setMessage({ error: "Passwords do not match" });
    }

    setSubmitting(true);
    setMessage(null);

    const fd = new FormData();
    fd.append("token", token);
    fd.append("email", form.email);
    fd.append("organizationId", form.organizationId);
    fd.append("new_password", form.new_password);
    fd.append("confirm_password", form.confirm_password);

    const res = await fetch(`/api/proxy/public/reset-password`, {
      method: "POST",
      body: fd,
    });

    const json = await res.json();
    setMessage(json);
    setSubmitting(false);
  };

  // -----------------------------------------
  // SUCCESS UI
  // -----------------------------------------
  if (message?.message && !message.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white shadow-lg border border-green-200 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-green-600">Success</h2>
          <p className="text-gray-800 mt-3">{message.message}</p>

          <a
            href="/login"
            className="inline-block mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // MAIN FORM UI
  // -----------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-xl border border-gray-200 rounded-2xl p-10 max-w-lg w-full space-y-8">
        <h1 className="text-3xl font-bold text-[#ff004f] text-center">
          Reset Password
        </h1>

        <div className="space-y-6 text-black">
          {/* EMAIL INPUT */}
          <div>
            <label className="block text-gray-900 mb-1 font-medium">
              Registered Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="
                w-full border-2 border-gray-200 p-3 rounded-lg 
                focus:border-[#ff004f] focus:ring-2 focus:ring-[#ff004f]/20 
                text-black placeholder-gray-500
              "
              placeholder="Enter your email"
            />
          </div>

          {/* ORGANIZATION ID */}
          <div>
            <label className="block text-gray-900 mb-1 font-medium">
              Organization ID
            </label>
            <input
              type="text"
              value={form.organizationId}
              onChange={(e) =>
                setForm({ ...form, organizationId: e.target.value })
              }
              className="
                w-full border-2 border-gray-200 p-3 rounded-lg 
                focus:border-[#ff004f] focus:ring-2 focus:ring-[#ff004f]/20 
                text-black placeholder-gray-500
              "
              placeholder="Enter your Organization ID"
            />
          </div>

          {/* NEW PASSWORD */}
          <div>
            <label className="block text-gray-900 mb-1 font-medium">
              New Password
            </label>
            <input
              type="password"
              value={form.new_password}
              onChange={(e) =>
                setForm({ ...form, new_password: e.target.value })
              }
              className="
                w-full border-2 border-gray-200 p-3 rounded-lg 
                focus:border-[#ff004f] focus:ring-2 focus:ring-[#ff004f]/20 
                text-black placeholder-gray-500
              "
              placeholder="Enter new password"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-gray-900 mb-1 font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              value={form.confirm_password}
              onChange={(e) =>
                setForm({ ...form, confirm_password: e.target.value })
              }
              className="
                w-full border-2 border-gray-200 p-3 rounded-lg 
                focus:border-[#ff004f] focus:ring-2 focus:ring-[#ff004f]/20 
                text-black placeholder-gray-500
              "
              placeholder="Re-enter new password"
            />
          </div>

          {message?.error && (
            <p className="text-center text-red-600 font-medium">
              {message.error}
            </p>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          disabled={submitting}
          onClick={submit}
          className="
            w-full bg-[#ff004f] hover:bg-red-600 text-white py-3 rounded-lg text-lg font-semibold
            flex items-center justify-center gap-2 
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Resetting Password...
            </>
          ) : (
            <>Reset Password</>
          )}
        </button>
      </div>
    </div>
  );
}
