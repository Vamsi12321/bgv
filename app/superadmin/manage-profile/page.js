"use client";

import { useState, useEffect } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function ManageProfilePage() {
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // from phoneNumber in storage

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  /* Load user from localStorage */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bgvUser");
      if (stored) {
        const parsed = JSON.parse(stored);

        setUser(parsed);
        setEmail(parsed.email || "");
        setPhone(parsed.phoneNumber || ""); // ✔ FIXED: your user object uses phoneNumber
      }
    } catch (e) {
      console.warn("Error loading user:", e);
    }
  }, []);

  /* ============================
       UPDATE PROFILE (email/phone)
     ============================ */
  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_BASE}/api/superadmin/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phoneNumber: phone, // ✔ backend expects phoneNumber
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      const updatedUser = { ...user, email, phoneNumber: phone };
      localStorage.setItem("bgvUser", JSON.stringify(updatedUser));

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }

    setLoading(false);
  };

  /* ============================
           RESET PASSWORD
     ============================ */
  const handleResetPassword = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_BASE}/auth/resetPassword`, {
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

      setMessage({ type: "success", text: "Password updated successfully!" });

      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Manage Profile
      </h1>

      {message.text && (
        <div
          className={`p-3 rounded mb-4 ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* PROFILE FORM */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">Profile Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">Email</label>
            <input
              className="w-full border p-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Phone Number</label>
            <input
              className="w-full border p-2 rounded"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="text"
            />
          </div>

          <button
            onClick={handleUpdateProfile}
            className="bg-[#ff004f] text-white px-4 py-2 rounded hover:bg-red-600 transition"
            disabled={loading}
          >
            {loading ? "Saving..." : "Update Profile"}
          </button>
        </div>
      </section>

      {/* RESET PASSWORD */}
      <section>
        <h2 className="text-lg font-medium mb-3">Reset Password</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">Current Password</label>
            <input
              className="w-full border p-2 rounded"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">New Password</label>
            <input
              className="w-full border p-2 rounded"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleResetPassword}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </div>
      </section>
    </div>
  );
}
