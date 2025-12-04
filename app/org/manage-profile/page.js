"use client";

import { useState, useEffect } from "react";



export default function ManageProfilePage() {
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  /* ------------------------------ */
  /* SUCCESS POPUP COMPONENT        */
  /* ------------------------------ */
  const SuccessPopup = ({ text, onClose }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm text-center border">
        <h2 className="text-xl font-semibold text-green-600 mb-3">Success!</h2>
        <p className="text-gray-700 mb-5">{text}</p>

        <button
          onClick={onClose}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
        >
          OK
        </button>
      </div>
    </div>
  );

  /* Load user */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bgvUser");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setEmail(parsed.email || "");
        setPhone(parsed.phoneNumber || "");
      }
    } catch (e) {
      console.warn("Error loading user:", e);
    }
  }, []);

  /* Reset Password */
  const handleResetPassword = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`/api/proxy/auth/resetPassword`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password reset failed");

      setMessage({
        type: "success",
        text: "Password updated successfully!",
      });

      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* ------------------------------ */}
      {/* SUCCESS POPUP (TOP OF PAGE)   */}
      {/* ------------------------------ */}
      {message.type === "success" && (
        <SuccessPopup
          text={message.text}
          onClose={() => setMessage({ type: "", text: "" })}
        />
      )}

      {/* PAGE HEADER */}
      <div className="bg-[#ff004f] text-white px-6 py-5 rounded-xl shadow-md mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-wide">Manage Profile</h1>
        <p className="text-sm opacity-90 mt-2 sm:mt-0">
          Update your email, phone & password
        </p>
      </div>

      {/* MESSAGE BANNER */}
      {message.text && message.type !== "success" && (
        <div
          className={`p-4 rounded-lg mb-5 text-sm font-medium border-l-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border-green-500"
              : "bg-red-50 text-red-700 border-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* PROFILE SECTION */}
      <div className="bg-white rounded-xl shadow border p-6 mb-8 transition hover:shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Profile Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              Email
            </label>
            <input
              className="w-full border p-2.5 rounded-lg text-gray-900 bg-gray-50 focus:ring-2 focus:ring-[#ff004f] outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              Phone Number
            </label>
            <input
              className="w-full border p-2.5 rounded-lg text-gray-900 bg-gray-50 focus:ring-2 focus:ring-[#ff004f] outline-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="text"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          (Profile details update is not enabled for now)
        </p>
      </div>

      {/* RESET PASSWORD SECTION */}
      <div className="bg-white rounded-xl shadow border p-6 transition hover:shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Reset Password
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              Current Password
            </label>
            <input
              className="w-full border p-2.5 rounded-lg text-gray-900 bg-gray-50 focus:ring-2 focus:ring-[#ff004f] outline-none"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              New Password
            </label>
            <input
              className="w-full border p-2.5 rounded-lg text-gray-900 bg-gray-50 focus:ring-2 focus:ring-[#ff004f] outline-none"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className={`px-6 py-2.5 text-white rounded-lg transition font-medium shadow-md ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } w-full sm:w-auto`}
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
