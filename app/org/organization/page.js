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
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useOrgState } from "../../context/OrgStateContext";



export default function OrganizationProfilePage() {
  const { organizationData: org, setOrganizationData: setOrg } = useOrgState();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  /* Modal Messages */
  const [errorModal, setErrorModal] = useState("");
  const [successModal, setSuccessModal] = useState("");

  /* Inline validation errors */
  const [formErrors, setFormErrors] = useState({
    organizationName: "",
    email: "",
    gstNumber: "",
  });
  const router = useRouter();
  useEffect(() => {
    const stored = localStorage.getItem("bgvUser");
    if (!stored) {
      router.replace("/");
      return;
    }

    const user = JSON.parse(stored);
    const role = user.role?.toUpperCase();

    // ❌ SUPER_ADMIN_HELPER cannot access invoices
    if (role === "HELPER") {
      router.replace("/org/dashboard");
    }
  }, []);
  /* ---------------------- Fetch Org Profile ---------------------- */
  useEffect(() => {
    // Only fetch if we don't have data
    if (!org) {
      fetchOrganizationProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrganizationProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/proxy/secure/getOrganizations`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch organization details");

      const orgData = data.organizations?.[0];
      if (!orgData) throw new Error("No organization found");

      setOrg(orgData);
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- Validations ---------------------- */
  const validateForm = () => {
    const errors = {
      organizationName: "",
      email: "",
      gstNumber: "",
    };

    if (!org.organizationName?.trim()) {
      errors.organizationName = "Organization name is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(org.email || "")) {
      errors.email = "Invalid email format";
    }

    if (org.gstNumber && org.gstNumber.length !== 15) {
      errors.gstNumber = "GST number must be 15 characters";
    }

    setFormErrors(errors);

    return !errors.organizationName && !errors.email && !errors.gstNumber;
  };

  /* ---------------------- Update Org ---------------------- */
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const res = await fetch(
        `/api/proxy/secure/updateOrganization/${org._id || org.orgId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(org),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message);

      setSuccessModal("Organization updated successfully!");
      setEditMode(false);
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------- Field Updaters ---------------------- */
  const updateField = (key, value) =>
    setOrg((prev) => ({ ...prev, [key]: value }));

  const updateServicePrice = (i, value) =>
    setOrg((prev) => {
      const updated = [...(prev.services || [])];
      updated[i].price = value;
      return { ...prev, services: updated };
    });

  /* ---------------------- Upload Logo ---------------------- */
  const handleLogoUpload = async (file) => {
    if (!file) return;

    try {
      setUploadingLogo(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "imageName",
        org.organizationName?.replace(/\s+/g, "_").toLowerCase() || "logo"
      );

      const res = await fetch(`/api/proxy/secure/uploadLogo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.message);

      // Update logo preview
      setOrg((prev) => ({
        ...prev,
        logoUrl: data.logoUrl,
      }));

      setSuccessModal("Logo uploaded successfully!");
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  /* ---------------------- Render Loading ---------------------- */
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

  /* ---------------------- Main UI ---------------------- */
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

        {/* EDIT / SAVE BUTTONS */}
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#ff004f] text-white px-5 py-2 rounded-lg hover:bg-[#e60047] font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Save
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

      {/* MAIN CARD */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <img
            src={org.logoUrl || "/default-logo.png"}
            alt="Org Logo"
            className="w-28 h-28 rounded-full border shadow-md object-cover"
          />

          {editMode && (
            <label className="mt-4 cursor-pointer flex items-center gap-2 text-[#ff004f] font-medium hover:underline">
              <UploadCloud size={18} />
              Upload Logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoUpload(e.target.files[0])}
              />
            </label>
          )}

          {uploadingLogo && (
            <p className="text-sm mt-2 text-gray-600 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Uploading logo...
            </p>
          )}
        </div>

        {/* ORG DETAILS */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* ORG NAME */}
          <InputField
            label="Organization Name"
            value={org.organizationName}
            editable={editMode}
            icon={<Building2 size={18} />}
            onChange={(v) => updateField("organizationName", v)}
            error={formErrors.organizationName}
          />

          {/* SPOC NAME (DISABLED) */}
          <InputField
            label="SPOC Name"
            value={org.spocName}
            editable={false}
            icon={<User size={18} />}
          />

          {/* EMAIL */}
          <InputField
            label="Email"
            value={org.email}
            editable={editMode}
            icon={<Mail size={18} />}
            onChange={(v) => updateField("email", v)}
            error={formErrors.email}
          />

          {/* SUB DOMAIN (DISABLED ALWAYS) */}
          <InputField
            label="Sub Domain"
            value={org.subDomain}
            editable={false}
            icon={<Globe size={18} />}
          />

          {/* MAIN DOMAIN (DISABLED ALWAYS) */}
          <InputField
            label="Main Domain"
            value={org.mainDomain}
            editable={false}
            icon={<Globe size={18} />}
          />

          {/* GST */}
          <InputField
            label="GST Number"
            value={org.gstNumber}
            editable={editMode}
            icon={<Hash size={18} />}
            onChange={(v) => updateField("gstNumber", v)}
            error={formErrors.gstNumber}
          />

          {/* LOGO URL (editable) */}
          <InputField
            label="Logo URL"
            value={org.logoUrl}
            editable={editMode}
            icon={<Globe size={18} />}
            onChange={(v) => updateField("logoUrl", v)}
          />
        </div>

        {/* SERVICES */}
        {/* SERVICES */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-[#ff004f] mb-3">
            Services Offered
          </h3>

          {org.services?.map((s, i) => (
            <div
              key={i}
              className="grid sm:grid-cols-2 gap-3 mb-3 items-center"
            >
              {/* Service Name — Disabled */}
              <input
                type="text"
                disabled={true}
                value={s.serviceName}
                className="border rounded-md p-2 bg-gray-100 text-gray-700 cursor-not-allowed"
              />

              {/* Service Price — Disabled */}
              <input
                type="number"
                disabled={true}
                value={s.price}
                className="border rounded-md p-2 bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>
          ))}
        </div>

        {/* CREDENTIALS */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-[#ff004f] mb-3">
            Organization Credentials
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <InputField
              label="Total Allowed"
              value={org.credentials?.totalAllowed || 0}
              editable={false}
            />
            <InputField
              label="Used"
              value={org.credentials?.used || 0}
              editable={false}
            />
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {successModal && (
        <Modal
          type="success"
          message={successModal}
          onClose={() => setSuccessModal("")}
        />
      )}

      {/* ERROR MODAL */}
      {errorModal && (
        <Modal
          type="error"
          message={errorModal}
          onClose={() => setErrorModal("")}
        />
      )}
    </div>
  );
}

/* ---------------------- Input Component ---------------------- */
function InputField({ label, value, editable, onChange, icon, error }) {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {icon && <span className="text-gray-500">{icon}</span>}

        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          disabled={!editable}
          className={`border rounded-md w-full p-2 text-gray-800 ${
            editable
              ? "focus:ring-2 focus:ring-[#ff004f]"
              : "bg-gray-100 cursor-not-allowed"
          }`}
        />
      </div>

      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}

/* ---------------------- Modal Component ---------------------- */
function Modal({ type, message, onClose }) {
  const Icon = type === "error" ? AlertCircle : CheckCircle2;
  const color =
    type === "error"
      ? "text-red-600 border-red-300 bg-red-50"
      : "text-green-600 border-green-300 bg-green-50";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div
        className={`w-[90%] max-w-md p-6 rounded-xl border shadow-xl ${color}`}
      >
        <div className="flex items-center gap-3 mb-3">
          <Icon size={24} />
          <h3 className="text-lg font-semibold">
            {type === "error" ? "Error" : "Success"}
          </h3>
        </div>

        <p className="text-gray-800 whitespace-pre-line">{message}</p>

        <button
          onClick={onClose}
          className="mt-4 bg-[#ff004f] text-white px-5 py-2 rounded-md hover:bg-[#e60047]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
