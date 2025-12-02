"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Edit2,
  X,
  Info,
  Search,
  SortAsc,
  SortDesc,
  Loader2,
  AlertCircle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

/* ----------------------------------------------------
   UPDATED SERVICES LIST (ALL REAL SERVICES)
---------------------------------------------------- */
const AVAILABLE_SERVICES = [
  "pan_aadhaar_seeding",
  "pan_verification",
  "employment_history",
  "aadhaar_to_uan",
  "credit_report",
  "court_record",

  // ⭐ NEW SERVICES ADDED ⭐
  "address_verification",
  "education_check_manual",
  "supervisory_check",
  "resume_validation",
  "education_check_ai",
];

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [drawer, setDrawer] = useState({ show: false, org: null, mode: "" });

  const [modal, setModal] = useState({
    show: false,
    type: "error",
    message: "",
  });

  const showError = (msg) =>
    setModal({ show: true, type: "error", message: msg });

  const showSuccess = (msg) =>
    setModal({ show: true, type: "success", message: msg });

  /* ----------------------------------------------------
     LOAD Cached then fetch fresh
  ---------------------------------------------------- */
  useEffect(() => {
    const cached = localStorage.getItem("orgs_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      setOrgs(parsed);
      setFilteredOrgs(parsed);
    }

    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/secure/getOrganizations`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.detail || data.message || "Failed to fetch");

      if (data.organizations) {
        setOrgs(data.organizations);
        setFilteredOrgs(data.organizations);
        localStorage.setItem("orgs_cache", JSON.stringify(data.organizations));
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();
  useEffect(() => {
    const stored = localStorage.getItem("bgvUser");
    if (!stored) {
      router.replace("/");
      return;
    }

    const user = JSON.parse(stored);
    const role = user.role?.toUpperCase();

    if (role === "SUPER_ADMIN_HELPER") {
      router.replace("/superadmin/dashboard");
    }
  }, []);

  /* ----------------------------------------------------
     SEARCH + SORT
  ---------------------------------------------------- */
  useEffect(() => {
    const filtered = orgs.filter((o) =>
      o.organizationName.toLowerCase().includes(search.toLowerCase())
    );

    const sorted = filtered.sort((a, b) => {
      const A = a.organizationName.toLowerCase();
      const B = b.organizationName.toLowerCase();
      return sortAsc ? A.localeCompare(B) : B.localeCompare(A);
    });

    setFilteredOrgs([...sorted]);
  }, [search, sortAsc, orgs]);

  /* ----------------------------------------------------
     Toggle active/inactive (RESTORED)
  ---------------------------------------------------- */
  const handleStatusToggle = async (org) => {
    const updatedStatus = !org.isActive;

    try {
      setActionLoading(true);

      const res = await fetch(
        `${API_BASE}/secure/updateOrganization/${org._id || org.orgId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...org, isActive: updatedStatus }),
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.detail || data.message || "Update failed");

      await fetchOrganizations();

      showSuccess(
        `Organization ${
          updatedStatus ? "activated" : "suspended"
        } successfully!`
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* ----------------------------------------------------
     Add Drawer
  ---------------------------------------------------- */
  const openAddDrawer = () =>
    setDrawer({
      show: true,
      mode: "add",
      org: {
        organizationName: "",
        spocName: "",
        mainDomain: "",
        subDomain: "",
        email: "",
        gstNumber: "",
        logoUrl: "",
        services: [],
        credentials: { totalAllowed: 0, used: 0 },
        isActive: true,
      },
    });

  const getLogoSrc = (url) =>
    !url || !url.trim()
      ? "/default-logo.png"
      : url.startsWith("http")
      ? url
      : `/logos/${url}`;

  return (
    <div className="p-4 md:p-8 text-gray-900 bg-gray-50 min-h-screen">
      {/* ----------------------------------------------------
         MODAL
      ---------------------------------------------------- */}
      {modal.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-[90%] text-center">
            {modal.type === "error" ? (
              <AlertCircle
                size={48}
                className="mx-auto text-red-500 mb-3 animate-pulse"
              />
            ) : (
              <CheckCircle size={48} className="mx-auto text-green-600 mb-3" />
            )}

            <h2 className="text-xl font-semibold mb-2">
              {modal.type === "error" ? "Operation Failed" : "Success"}
            </h2>

            <p className="text-gray-700 mb-5 whitespace-pre-line">
              {modal.message}
            </p>

            <button
              onClick={() =>
                setModal({ show: false, type: "error", message: "" })
              }
              className={`px-5 py-2.5 rounded-lg text-white shadow-md ${
                modal.type === "error"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
         HEADER
      ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold text-[#ff004f]">Organizations</h1>

        <button
          onClick={openAddDrawer}
          disabled={loading || actionLoading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium w-full sm:w-auto shadow-md transition 
            ${
              loading || actionLoading
                ? "bg-[#ff004f]/60 cursor-not-allowed"
                : "bg-[#ff004f] hover:bg-[#e60047]"
            }`}
        >
          <PlusCircle size={18} />
          Add Organization
        </button>
      </div>

      {/* ----------------------------------------------------
         SEARCH + SORT UI
      ---------------------------------------------------- */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex flex-col sm:flex-row gap-3 items-center mb-6">
        <div className="relative w-full">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 
               rounded-full border border-gray-300 
               bg-white shadow-sm 
               focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f]
               text-gray-800 placeholder-gray-500"
          />
        </div>

        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center gap-2 px-2 py-2 rounded-full border border-gray-300 bg-white shadow-sm text-gray-700 hover:bg-gray-100 transition-all"
        >
          {sortAsc ? (
            <SortAsc size={14} className="text-gray-600" />
          ) : (
            <SortDesc size={14} className="text-gray-600" />
          )}
          <span className="text-sm">{sortAsc ? "A → Z" : "Z → A"}</span>
        </button>
      </div>

      {/* ----------------------------------------------------
         DESKTOP TABLE
      ---------------------------------------------------- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <Loader2 className="animate-spin mb-3 text-[#ff004f]" size={32} />
          <p className="font-semibold">Loading organizations...</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white px-6 py-5 rounded-2xl shadow-md border border-gray-200 overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="bg-[#ff004f]/10">
                <tr className="text-gray-700 text-sm">
                  {[
                    "Logo",
                    "Organization",
                    "SPOC",
                    "Email",
                    "Domain",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="p-3 text-left font-semibold uppercase tracking-wide"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredOrgs.length ? (
                  filteredOrgs.map((org, i) => (
                    <tr
                      key={org._id}
                      className={`border-b ${
                        i % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-[#ff004f]/10 transition text-gray-800`}
                    >
                      <td className="p-3">
                        <img
                          src={getLogoSrc(org.logoUrl)}
                          alt="logo"
                          className="w-10 h-10 rounded-full border object-cover"
                        />
                      </td>

                      <td className="p-3 font-semibold truncate max-w-[200px]">
                        {org.organizationName}
                      </td>

                      <td className="p-3">{org.spocName || "—"}</td>

                      <td className="p-3 truncate max-w-[180px]">
                        {org.email}
                      </td>

                      <td className="p-3">{org.subDomain}</td>

                      {/* STATUS TOGGLE RESTORED */}
                      <td className="p-3">
                        <button
                          onClick={() => handleStatusToggle(org)}
                          className="flex items-center gap-2"
                        >
                          {org.isActive ? (
                            <>
                              <ToggleRight
                                size={28}
                                className="text-green-600"
                              />
                              <span className="text-green-700 font-medium">
                                Active
                              </span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={28} className="text-red-500" />
                              <span className="text-red-600 font-medium">
                                Inactive
                              </span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-3 flex items-center gap-4">
                        <button
                          onClick={() =>
                            setDrawer({ show: true, org, mode: "view" })
                          }
                          className="text-gray-700 hover:text-[#ff004f] transition"
                        >
                          <Info size={18} />
                        </button>

                        <button
                          onClick={() =>
                            setDrawer({
                              show: true,
                              org,
                              mode: "edit",
                            })
                          }
                          className="text-[#ff004f] hover:text-[#d90044] transition"
                        >
                          <Edit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center p-4 text-gray-500 italic"
                    >
                      No matching organizations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ----------------------------------------------------
             MOBILE CARDS
          ---------------------------------------------------- */}
          <div className="grid md:hidden gap-4 mt-4">
            {filteredOrgs.map((org) => (
              <div
                key={org._id}
                className="bg-white shadow-md rounded-xl p-4 border hover:border-[#ff004f]/40 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={getLogoSrc(org.logoUrl)}
                      alt="logo"
                      className="w-10 h-10 rounded-full border object-cover"
                    />

                    <div>
                      <p className="font-semibold text-base">
                        {org.organizationName}
                      </p>
                      <p className="text-sm text-gray-600">{org.email}</p>
                    </div>
                  </div>

                  <button onClick={() => handleStatusToggle(org)}>
                    {org.isActive ? (
                      <span className="text-green-600 font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-500 font-semibold">
                        Inactive
                      </span>
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-700 mt-2 truncate">
                  <span className="font-medium">Domain:</span>{" "}
                  {org.subDomain || "—"}
                </p>

                <p className="text-sm text-gray-700 truncate">
                  <span className="font-medium">SPOC:</span>{" "}
                  {org.spocName || "—"}
                </p>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setDrawer({ show: true, org, mode: "view" })}
                    className="text-gray-700 hover:text-[#ff004f]"
                  >
                    <Info size={18} />
                  </button>

                  <button
                    onClick={() => setDrawer({ show: true, org, mode: "edit" })}
                    className="text-[#ff004f] hover:text-[#d90044] transition"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Drawer Component */}
      {drawer.show && (
        <OrganizationDrawer
          drawer={drawer}
          setDrawer={setDrawer}
          showError={showError}
          showSuccess={showSuccess}
          fetchOrganizations={fetchOrganizations}
          actionLoading={actionLoading}
          setActionLoading={setActionLoading}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   PART 3 — ORGANIZATION DRAWER (ADD, EDIT, VIEW)
------------------------------------------------------------------ */
function OrganizationDrawer({
  drawer,
  setDrawer,
  showError,
  showSuccess,
  fetchOrganizations,
  actionLoading,
  setActionLoading,
}) {
  const isView = drawer.mode === "view";
  const isEdit = drawer.mode === "edit";
  const isAdd = drawer.mode === "add";

  const [org, setOrg] = useState(drawer.org);
  const [logoFile, setLogoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [shake, setShake] = useState(false);

  /* ----------------------------------------
    🔥 UPDATED SERVICE LIST INCLUDING NEW ONES
  ---------------------------------------- */
  const ALL_SERVICES = [
    "pan_aadhaar_seeding",
    "pan_verification",
    "employment_history",
    "aadhaar_to_uan",
    "credit_report",
    "court_record",
    "address_verification",
    "education_check_manual",
    "supervisory_check",
    "resume_validation",
    "education_check_ai",
  ];

  const offeredServices = org.services.map((s) => s.serviceName);
  const unusedServices = ALL_SERVICES.filter(
    (s) => !offeredServices.includes(s)
  );

  /* ----------------------------------------
      Validation Rules (unchanged)
  ---------------------------------------- */
  const validators = {
    organizationName: (v) =>
      v.trim().length < 3 ? "Must be at least 3 characters" : "",

    spocName: (v) =>
      v && !/^[A-Za-z\s]+$/.test(v) ? "Only alphabets allowed" : "",

    email: (v) =>
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email" : "",

    gstNumber: (v) =>
      v && !/^[A-Za-z0-9]{4,15}$/.test(v)
        ? "GST must be 4-15 alphanumeric characters"
        : "",

    subDomain: (v) =>
      v && !/^[A-Za-z0-9.-]+$/.test(v) ? "Invalid domain" : "",
  };

  const validatePrice = (price) => {
    if (price === "" || price === null) return "Price required";
    if (Number(price) < 0) return "Price cannot be negative";
    if (Number(price) > 500) return "Price cannot exceed ₹500";
    return "";
  };

  const validateField = (key, value) => {
    const msg = validators[key] ? validators[key](value) : "";
    setErrors((prev) => ({ ...prev, [key]: msg }));
    return msg;
  };

  const validateAll = () => {
    const newErrors = {};
    let hasError = false;

    Object.keys(validators).forEach((key) => {
      const msg = validateField(key, org[key] || "");
      if (msg) hasError = true;
      newErrors[key] = msg;
    });

    org.services.forEach((s, i) => {
      const msg = validatePrice(s.price);
      if (msg) hasError = true;
      newErrors[`price_${i}`] = msg;
    });

    setErrors(newErrors);
    return !hasError;
  };

  /* ----------------------------------------
      Upload Logo
  ---------------------------------------- */
  const uploadLogo = async () => {
    if (!logoFile) return null;

    try {
      const formData = new FormData();
      formData.append("file", logoFile);
      formData.append(
        "imageName",
        `${org.organizationName.replace(/\s+/g, "_").toLowerCase()}_logo`
      );

      const res = await fetch(`${API_BASE}/secure/uploadLogo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Logo upload failed");

      return data.logoUrl;
    } catch (err) {
      showError(err.message);
      return null;
    }
  };

  /* ----------------------------------------
      Save Handler
  ---------------------------------------- */
  const handleSave = async () => {
    if (!validateAll()) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    try {
      setActionLoading(true);

      let uploadedLogoUrl = org.logoUrl;
      if (logoFile) {
        const newLogo = await uploadLogo();
        if (newLogo) uploadedLogoUrl = newLogo;
      }

      const payload = { ...org, logoUrl: uploadedLogoUrl };

      const url = isEdit
        ? `${API_BASE}/secure/updateOrganization/${org._id}`
        : `${API_BASE}/secure/registerOrganization`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");

      showSuccess(isEdit ? "Organization updated!" : "Organization added!");

      setDrawer({ show: false, org: null, mode: "" });
      fetchOrganizations();
    } catch (err) {
      showError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* ----------------------------------------
      Toggle Services
  ---------------------------------------- */
  const toggleService = (service) => {
    if (offeredServices.includes(service)) {
      const updated = org.services.filter((s) => s.serviceName !== service);
      setOrg((prev) => ({ ...prev, services: updated }));
    } else {
      setOrg((prev) => ({
        ...prev,
        services: [...prev.services, { serviceName: service, price: "" }],
      }));
    }
  };

  /* ----------------------------------------
      Drawer UI
  ---------------------------------------- */
  return (
    <div className="fixed inset-0 z-[2000] flex">
      <div
        className="flex-1 bg-black/40"
        onClick={() => setDrawer({ show: false, org: null, mode: "" })}
      ></div>

      <div
        className={`w-full sm:w-[420px] md:w-[480px] bg-white h-full shadow-2xl p-6 overflow-y-auto
          transition-all duration-300
          ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}
        `}
      >
        {/* Title */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#ff004f]">
            {isView
              ? "Organization Details"
              : isEdit
              ? "Edit Organization"
              : "Add Organization"}
          </h2>

          <button
            onClick={() => setDrawer({ show: false, org: null, mode: "" })}
            className="text-gray-600 hover:text-[#ff004f]"
          >
            <X size={22} />
          </button>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src={org.logoUrl || "/default-logo.png"}
            className="w-24 h-24 rounded-full border object-cover shadow"
          />
        </div>

        {!isView && (
          <div className="mb-5">
            <label className="block font-semibold text-gray-700 mb-1">
              Upload Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files[0])}
              className="border p-2 rounded-lg w-full"
            />
          </div>
        )}

        {/* Inputs */}
        {[
          ["Organization Name", "organizationName"],
          ["SPOC Name", "spocName"],
          ["Email", "email"],
          ["Sub Domain", "subDomain"],
          ["Main Domain", "mainDomain"],
          ["GST Number", "gstNumber"],
        ].map(([label, key]) => (
          <div key={key} className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">
              {label}
            </label>

            <input
              disabled={isView}
              value={org[key] || ""}
              onChange={(e) => {
                let value = e.target.value;
                setOrg((prev) => ({ ...prev, [key]: value }));
                validateField(key, value);
              }}
              className={`border rounded-lg p-2 w-full ${
                errors[key]
                  ? "border-red-500 bg-red-50"
                  : "focus:ring-2 focus:ring-[#ff004f]"
              } ${isView ? "bg-gray-100" : ""}`}
            />

            {errors[key] && (
              <p className="text-red-500 text-sm mt-1">{errors[key]}</p>
            )}
          </div>
        ))}

        {/* Services */}
        <div className="mt-4 border-t pt-4">
          <h3 className="font-semibold mb-2">Offered Services</h3>

          {org.services.map((s, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              {!isView && (
                <input
                  type="checkbox"
                  checked
                  onChange={() => toggleService(s.serviceName)}
                  className="accent-[#ff004f]"
                />
              )}

              <span className="capitalize flex-1">{s.serviceName}</span>

              {!isView ? (
                <div className="flex flex-col">
                  <input
                    type="number"
                    value={s.price}
                    placeholder="Price"
                    onChange={(e) => {
                      const updated = [...org.services];
                      updated[i].price = e.target.value;
                      setOrg((prev) => ({ ...prev, services: updated }));
                      const msg = validatePrice(e.target.value);
                      setErrors((prev) => ({
                        ...prev,
                        [`price_${i}`]: msg,
                      }));
                    }}
                    className={`border p-1 rounded w-24 ${
                      errors[`price_${i}`] ? "border-red-500 bg-red-50" : ""
                    }`}
                  />
                  {errors[`price_${i}`] && (
                    <p className="text-red-500 text-xs">
                      {errors[`price_${i}`]}
                    </p>
                  )}
                </div>
              ) : (
                <span>₹{s.price}</span>
              )}
            </div>
          ))}

          {!isView && (
            <>
              <h3 className="font-semibold mt-4 mb-2">Available Services</h3>
              {unusedServices.map((s) => (
                <label key={s} className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    onChange={() => toggleService(s)}
                    className="accent-[#ff004f]"
                  />
                  <span className="capitalize">{s}</span>
                </label>
              ))}
            </>
          )}
        </div>

        {/* Credentials */}
        <div className="border-t mt-5 pt-4">
          <h3 className="font-semibold mb-2">Credentials</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <label>Total Allowed</label>
              <input
                disabled={isView}
                type="number"
                value={org.credentials.totalAllowed}
                onChange={(e) =>
                  setOrg((prev) => ({
                    ...prev,
                    credentials: {
                      ...prev.credentials,
                      totalAllowed: Number(e.target.value),
                    },
                  }))
                }
                className={`border p-2 rounded-lg w-full ${
                  isView ? "bg-gray-100" : ""
                }`}
              />
            </div>

            <div className="flex-1">
              <label>Used</label>
              <input
                disabled
                value={org.credentials.used}
                className="border p-2 rounded-lg w-full bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between mt-6">
          {!isView && (
            <button
              onClick={handleSave}
              disabled={actionLoading}
              className="bg-[#ff004f] text-white px-4 py-2 rounded-lg hover:bg-[#e60047] transition"
            >
              {actionLoading
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Add Organization"}
            </button>
          )}

          <button
            onClick={() => setDrawer({ show: false, org: null, mode: "" })}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
