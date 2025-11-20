"use client";
import React, { useState, useEffect } from "react";
import {
  Edit2,
  X,
  Loader2,
  Building2,
  Mail,
  User,
  Globe,
  Hash,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function OrganizationProfilePage() {
  const [org, setOrg] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ---------------------- Fetch Org Profile ---------------------- */
  useEffect(() => {
    fetchOrganizationProfile();
  }, []);

  const fetchOrganizationProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/secure/getOrganizations`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch organization details");

      // ✅ Use the first organization from array
      const orgData = data.organizations?.[0];
      if (!orgData) throw new Error("No organization found");

      setOrg(orgData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- Update Org ---------------------- */
  const handleSave = async () => {
    if (!org.organizationName?.trim()) {
      setError("Organization name is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        `${API_BASE}/secure/updateOrganization/${org._id || org.orgId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(org),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setSuccess("✅ Organization details updated successfully!");
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------- Utilities ---------------------- */
  const updateField = (key, value) =>
    setOrg((prev) => ({ ...prev, [key]: value }));

  const updateService = (i, field, value) =>
    setOrg((prev) => {
      const updated = [...(prev.services || [])];
      updated[i][field] = value;
      return { ...prev, services: updated };
    });

  const addService = () =>
    setOrg((prev) => ({
      ...prev,
      services: [...(prev.services || []), { serviceName: "", price: "" }],
    }));

  const removeService = (i) =>
    setOrg((prev) => ({
      ...prev,
      services: prev.services.filter((_, idx) => idx !== i),
    }));

  const getLogoSrc = (url) =>
    !url || !url.trim()
      ? "/default-logo.png"
      : url.startsWith("http")
      ? url
      : `/logos/${url}`;

  /* ---------------------- Render ---------------------- */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="animate-spin text-[#ff004f] mb-3" size={36} />
        <p className="font-semibold">Fetching organization details...</p>
      </div>
    );

  if (!org)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        No organization data available.
      </div>
    );

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen text-gray-900">
      {/* Header */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#ff004f] flex items-center gap-2">
            <Building2 /> Organization Profile
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and update your organization’s information.
          </p>
        </div>

        <div className="flex gap-2">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#ff004f] text-white px-5 py-2 rounded-lg hover:bg-[#e60047] font-medium flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-[#ff004f] text-white px-5 py-2 rounded-lg hover:bg-[#e60047] font-medium flex items-center gap-2"
            >
              <Edit2 size={18} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError("")} />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />
      )}

      {/* Card */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={getLogoSrc(org.logoUrl)}
            alt="Org Logo"
            className="w-24 h-24 rounded-full border shadow-md object-cover"
          />
        </div>

        {/* Info Fields */}
        <div className="grid md:grid-cols-2 gap-6">
          <InputField
            label="Organization Name"
            value={org.organizationName}
            editable={editMode}
            icon={<Building2 size={18} />}
            onChange={(v) => updateField("organizationName", v)}
          />
          <InputField
            label="SPOC Name"
            value={org.spocName}
            editable={editMode}
            icon={<User size={18} />}
            onChange={(v) => updateField("spocName", v)}
          />
          <InputField
            label="Email"
            value={org.email}
            editable={editMode}
            icon={<Mail size={18} />}
            onChange={(v) => updateField("email", v)}
          />
          <InputField
            label="Sub Domain"
            value={org.subDomain}
            editable={editMode}
            icon={<Globe size={18} />}
            onChange={(v) => updateField("subDomain", v)}
          />
          <InputField
            label="Main Domain"
            value={org.mainDomain}
            editable={editMode}
            icon={<Globe size={18} />}
            onChange={(v) => updateField("mainDomain", v)}
          />
          <InputField
            label="GST Number"
            value={org.gstNumber}
            editable={editMode}
            icon={<Hash size={18} />}
            onChange={(v) => updateField("gstNumber", v)}
          />
          <InputField
            label="Logo URL"
            value={org.logoUrl}
            editable={editMode}
            icon={<Globe size={18} />}
            onChange={(v) => updateField("logoUrl", v)}
          />
        </div>

        {/* Services */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-[#ff004f] mb-2">
            Services Offered
          </h3>
          {org.services?.map((s, i) => (
            <div
              key={i}
              className="grid sm:grid-cols-2 gap-3 mb-3 items-center"
            >
              <input
                type="text"
                disabled={!editMode}
                value={s.serviceName}
                onChange={(e) =>
                  updateService(i, "serviceName", e.target.value)
                }
                placeholder="Service Name"
                className={`border rounded-md p-2 ${
                  editMode
                    ? "focus:ring-2 focus:ring-[#ff004f]"
                    : "bg-gray-100 text-gray-700"
                }`}
              />
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  disabled={!editMode}
                  value={s.price}
                  onChange={(e) => updateService(i, "price", e.target.value)}
                  placeholder="Price"
                  className={`border rounded-md p-2 w-full ${
                    editMode
                      ? "focus:ring-2 focus:ring-[#ff004f]"
                      : "bg-gray-100 text-gray-700"
                  }`}
                />
                {editMode && (
                  <button
                    onClick={() => removeService(i)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {editMode && (
            <button
              onClick={addService}
              className="text-[#ff004f] flex items-center gap-1 mt-2 text-sm font-medium hover:underline"
            >
              <Plus size={16} /> Add Service
            </button>
          )}
        </div>

        {/* Credentials */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-[#ff004f] mb-2">
            Organization Credentials
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <InputField
              label="Total Allowed"
              value={org.credentials?.totalAllowed || 0}
              editable={editMode}
              onChange={(v) =>
                setOrg((prev) => ({
                  ...prev,
                  credentials: {
                    ...prev.credentials,
                    totalAllowed: Number(v),
                  },
                }))
              }
            />
            <InputField
              label="Used"
              value={org.credentials?.used || 0}
              editable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- Input & Alert Components ---------------------- */
function InputField({ label, value, editable, onChange, icon }) {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {icon && <span className="text-gray-500">{icon}</span>}
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={!editable}
          className={`border rounded-md w-full p-2 text-gray-800 ${
            editable
              ? "focus:ring-2 focus:ring-[#ff004f]"
              : "bg-gray-100 cursor-not-allowed"
          }`}
        />
      </div>
    </div>
  );
}

function Alert({ type, message, onClose }) {
  const styles =
    type === "error"
      ? "bg-red-50 text-red-600 border border-red-200"
      : "bg-green-50 text-green-700 border border-green-200";
  const Icon = type === "error" ? AlertCircle : CheckCircle2;

  return (
    <div
      className={`max-w-5xl mx-auto mb-4 p-4 rounded-lg flex items-start gap-2 ${styles}`}
    >
      <Icon size={20} />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-gray-500 hover:text-gray-700"
      >
        <X size={16} />
      </button>
    </div>
  );
}
