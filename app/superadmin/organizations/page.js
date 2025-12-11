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
  Building2,
} from "lucide-react";
import { useSuperAdminState } from "../../context/SuperAdminStateContext";

/* ----------------------------------------------------
   UPDATED SERVICES LIST (ALL REAL SERVICES)
---------------------------------------------------- */
const AVAILABLE_SERVICES = [
  "pan_aadhaar_seeding",
  "pan_verification",
  "employment_history",
  "verify_pan_to_uan",
  "credit_report",
  "court_record",

  // ⭐ NEW SERVICES ADDED ⭐
  "address_verification",
  "education_check_manual",
  "employment_history_manual",
  "employment_history_manual_2",
  "supervisory_check_1",
  "supervisory_check_2",
  "ai_education_validation",
];

export default function OrganizationsPage() {
  const {
    organizationsData: orgs,
    setOrganizationsData: setOrgs,
    organizationsFilters,
    setOrganizationsFilters,
  } = useSuperAdminState();

  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [search, setSearch] = useState(organizationsFilters.search || "");
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
     LOAD Organizations
  ---------------------------------------------------- */
  useEffect(() => {
    // Only fetch if we don't have data
    if (orgs.length === 0) {
      fetchOrganizations();
    } else {
      setFilteredOrgs(orgs);
    }
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/proxy/secure/getOrganizations`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.detail || data.message || "Failed to fetch");

      if (data.organizations) {
        setOrgs(data.organizations);
        setFilteredOrgs(data.organizations);
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
        `/api/proxy/secure/updateOrganization/${org._id || org.orgId}`,
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
    <div className="text-gray-900 bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 overflow-x-hidden w-full max-w-full">
      {/* ----------------------------------------------------
           ENHANCED MODAL WITH ANIMATIONS
        ---------------------------------------------------- */}
      {modal.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-[90%] text-center transform animate-in slide-in-from-bottom-4 duration-300">
            <div
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                modal.type === "error" ? "bg-red-100" : "bg-green-100"
              }`}
            >
              {modal.type === "error" ? (
                <AlertCircle size={40} className="text-red-600 animate-pulse" />
              ) : (
                <CheckCircle
                  size={40}
                  className="text-green-600 animate-bounce"
                />
              )}
            </div>

            <h2 className="text-2xl font-bold mb-3 text-gray-900">
              {modal.type === "error" ? "⚠️ Operation Failed" : "✅ Success!"}
            </h2>

            <p className="text-gray-600 mb-6 leading-relaxed whitespace-pre-line">
              {modal.message}
            </p>

            <button
              onClick={() =>
                setModal({ show: false, type: "error", message: "" })
              }
              className={`px-8 py-3 rounded-xl text-white font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                modal.type === "error"
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              }`}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
         SUPERB ENHANCED HEADER WITH GRADIENT
      ---------------------------------------------------- */}
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-[#ff004f]" />
            Organizations
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage registered organizations
          </p>
        </div>

        <button
          onClick={openAddDrawer}
          disabled={loading || actionLoading}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold w-full sm:w-auto shadow transition-all hover:shadow-lg ${
            loading || actionLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#ff004f] hover:bg-[#e60047]"
          }`}
        >
          <PlusCircle size={18} />
          Add Organization
        </button>
      </div>

      {/* ----------------------------------------------------
         SUPERB ENHANCED SEARCH + SORT UI WITH GRADIENT
      ---------------------------------------------------- */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-gray-100 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-[#ff004f]/10 to-[#ff3366]/10 rounded-lg">
            <Search size={20} className="text-[#ff004f]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800">
            Search & Filter
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end">
          <div className="relative w-full flex-1 min-w-0">
            <input
              placeholder="🔍 Search by organization name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOrganizationsFilters({ search: e.target.value });
              }}
              className="w-full px-4 py-3 
                 rounded-xl border-2 border-gray-200 
                 bg-white shadow-sm 
                 focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f]
                 text-gray-800 placeholder-gray-500 font-medium
                 transition-all text-sm sm:text-base"
            />
          </div>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl border-2 border-gray-200 bg-white shadow-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#ff004f]/10 hover:to-[#ff3366]/10 hover:border-[#ff004f] transition-all font-medium whitespace-nowrap flex-shrink-0"
          >
            {sortAsc ? (
              <SortAsc size={18} className="text-[#ff004f]" />
            ) : (
              <SortDesc size={18} className="text-[#ff004f]" />
            )}
            <span className="text-sm font-semibold">
              {sortAsc ? "A → Z" : "Z → A"}
            </span>
          </button>
        </div>
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
          <div className="hidden md:block bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr className="text-sm text-gray-700">
                    {[
                      { label: "Logo", icon: "🖼️" },
                      { label: "Organization", icon: "🏢" },
                      { label: "SPOC", icon: "👤" },
                      { label: "Email", icon: "✉️" },
                      { label: "Domain", icon: "🌐" },
                      { label: "Status", icon: "✅" },
                      { label: "Actions", icon: "⚙️" },
                    ].map((header) => (
                      <th
                        key={header.label}
                        className="p-4 text-left font-bold tracking-wide"
                      >
                        {header.icon} {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredOrgs.length ? (
                    filteredOrgs.map((org, i) => (
                      <tr
                        key={org._id}
                        className={`transition-all group hover:bg-gradient-to-r hover:from-[#fff5f8] hover:to-[#fff0f5] hover:shadow-md ${
                          i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        } text-gray-800`}
                      >
                        <td className="p-3">
                          <img
                            src={getLogoSrc(org.logoUrl)}
                            alt="logo"
                            className="w-10 h-10 rounded-full border object-cover"
                          />
                        </td>

                        <td className="p-3 font-semibold truncate" style={{ maxWidth: '200px' }}>
                          {org.organizationName}
                        </td>

                        <td className="p-3 truncate" style={{ maxWidth: '150px' }}>{org.spocName || "—"}</td>

                        <td className="p-3 truncate" style={{ maxWidth: '180px' }}>
                          {org.email}
                        </td>

                        <td className="p-3 truncate" style={{ maxWidth: '120px' }}>{org.subDomain}</td>

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
                                <ToggleLeft
                                  size={28}
                                  className="text-red-500"
                                />
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
          </div>

          {/* ----------------------------------------------------
             ENHANCED MOBILE CARDS WITH GRADIENT
          ---------------------------------------------------- */}
          <div className="grid md:hidden gap-4 sm:gap-5 mt-6">
            {filteredOrgs.length > 0 ? (
              filteredOrgs.map((org) => (
                <div
                  key={org._id}
                  className="bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-2xl p-4 sm:p-5 border-2 border-gray-200 hover:border-[#ff004f] hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <img
                        src={getLogoSrc(org.logoUrl)}
                        alt="logo"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-gray-200 object-cover shadow-md flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base sm:text-lg text-gray-900 truncate">
                          {org.organizationName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {org.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStatusToggle(org)}
                      className="flex-shrink-0"
                    >
                      {org.isActive ? (
                        <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold whitespace-nowrap">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold whitespace-nowrap">
                          Inactive
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-700 min-w-[70px]">
                        Domain:
                      </span>
                      <span className="text-gray-600 truncate">
                        {org.subDomain || "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-700 min-w-[70px]">
                        SPOC:
                      </span>
                      <span className="text-gray-600 truncate">
                        {org.spocName || "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-700 min-w-[70px]">
                        Services:
                      </span>
                      <span className="text-gray-600">
                        {org.services?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() =>
                        setDrawer({ show: true, org, mode: "view" })
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                    >
                      <Info size={16} />
                      <span className="text-sm">View</span>
                    </button>

                    <button
                      onClick={() =>
                        setDrawer({ show: true, org, mode: "edit" })
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                      <Edit2 size={16} />
                      <span className="text-sm">Edit</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-semibold">No organizations found</p>
                <p className="text-sm mt-2">Try adjusting your search</p>
              </div>
            )}
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
    "verify_pan_to_uan",
    "credit_report",
    "court_record",
    "address_verification",
    "education_check_manual",
    "employment_history_manual",
    "employment_history_manual_2",
    "supervisory_check_1",
    "supervisory_check_2",
    "ai_education_validation",
  ];

  const offeredServices = org.services.map((s) => s.serviceName);
  const unusedServices = ALL_SERVICES.filter(
    (s) => !offeredServices.includes(s)
  );

  /* ----------------------------------------
      Enhanced Validation Rules
  ---------------------------------------- */
  const validators = {
    organizationName: (v) => {
      if (!v || v.trim().length < 3) return "Must be at least 3 characters";
      // Must start with a letter
      if (!/^[A-Za-z]/.test(v.trim()))
        return "Organization name must start with a letter";
      // Only letters, numbers, spaces, and basic punctuation allowed
      if (!/^[A-Za-z0-9\s.,&()-]+$/.test(v))
        return "Only letters, numbers, spaces, and basic punctuation (.,&()-) allowed";
      return "";
    },

    spocName: (v) => {
      if (!v || v.trim().length === 0) return "SPOC name is required";
      // Only letters and spaces allowed, no numbers or special characters
      if (!/^[A-Za-z\s]+$/.test(v))
        return "SPOC name must contain only letters and spaces, no numbers or special characters";
      return "";
    },

    email: (v) => {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(v))
        return "Invalid email format. Please enter a valid email address (e.g., user@example.com)";
      if (!v.includes("@") || !v.split("@")[1]?.includes("."))
        return "Email must include @ symbol and a valid domain";
      return "";
    },

    gstNumber: (v) =>
      v && !/^[A-Za-z0-9]{4,15}$/.test(v)
        ? "GST must be 4-15 alphanumeric characters"
        : "",

    subDomain: (v) => {
      if (!v || v.trim().length === 0) return "";
      // Must start with a letter or number
      if (!/^[A-Za-z0-9]/.test(v))
        return "Subdomain must start with a letter or number";
      // Only letters, numbers, hyphens, and dots allowed
      if (!/^[A-Za-z0-9.-]+$/.test(v))
        return "Subdomain can only contain letters, numbers, hyphens, and dots";
      return "";
    },

    mainDomain: (v) => {
      if (!v || v.trim().length === 0) return "";
      // Must start with a letter or number
      if (!/^[A-Za-z0-9]/.test(v))
        return "Main domain must start with a letter or number";
      // Only letters, numbers, hyphens, and dots allowed
      if (!/^[A-Za-z0-9.-]+$/.test(v))
        return "Main domain can only contain letters, numbers, hyphens, and dots";
      return "";
    },
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

    // Validate totalAllowed
    const totalAllowed = org.credentials?.totalAllowed;
    if (!totalAllowed || totalAllowed < 1) {
      newErrors.totalAllowed = "At least 1 user is required";
      hasError = true;
    } else if (totalAllowed > 20) {
      newErrors.totalAllowed = "Maximum 20 users allowed";
      hasError = true;
    }

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

      const res = await fetch(`/api/proxy/secure/uploadLogo`, {
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
        ? `/api/proxy/secure/updateOrganization/${org._id}`
        : `/api/proxy/secure/registerOrganization`;

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
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={() => setDrawer({ show: false, org: null, mode: "" })}
      ></div>

      <div
        className={`w-full sm:w-[420px] md:w-[480px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300
          ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}
        `}
      >
        {/* Enhanced Header */}
        <div className="flex justify-between items-center px-6 py-5 bg-gradient-to-r from-[#ff004f] to-[#ff3366] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isView
                  ? "🏢 Organization Details"
                  : isEdit
                  ? "✏️ Edit Organization"
                  : "➕ Add Organization"}
              </h2>
              <p className="text-white/80 text-sm">
                Manage organization details
              </p>
            </div>
          </div>
          <button
            onClick={() => setDrawer({ show: false, org: null, mode: "" })}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ maxHeight: "calc(100vh - 180px)" }}
        >
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
            <h3 className="font-semibold mb-2">Credentials (User Limits)</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-1">
                  Total Allowed Users <span className="text-red-500">*</span>
                </label>
                <input
                  disabled={isView}
                  type="number"
                  min="1"
                  max="20"
                  value={org.credentials.totalAllowed}
                  onChange={(e) => {
                    let value = e.target.value;

                    // Don't allow empty or 0
                    if (value === "" || value === "0") {
                      setErrors((prev) => ({
                        ...prev,
                        totalAllowed: "At least 1 user is required",
                      }));
                      setOrg((prev) => ({
                        ...prev,
                        credentials: {
                          ...prev.credentials,
                          totalAllowed: value === "" ? "" : 0,
                        },
                      }));
                      return;
                    }

                    const numValue = Number(value);

                    // Validate range
                    if (numValue < 1) {
                      setErrors((prev) => ({
                        ...prev,
                        totalAllowed: "Minimum 1 user required",
                      }));
                      return;
                    }

                    if (numValue > 20) {
                      setErrors((prev) => ({
                        ...prev,
                        totalAllowed: "Maximum 20 users allowed",
                      }));
                      return;
                    }

                    // Clear error if valid
                    setErrors((prev) => ({ ...prev, totalAllowed: "" }));

                    setOrg((prev) => ({
                      ...prev,
                      credentials: {
                        ...prev.credentials,
                        totalAllowed: numValue,
                      },
                    }));
                  }}
                  className={`border rounded-lg p-2 w-full ${
                    errors.totalAllowed
                      ? "border-red-500 bg-red-50"
                      : "focus:ring-2 focus:ring-[#ff004f]"
                  } ${isView ? "bg-gray-100" : ""}`}
                  placeholder="Enter 1-20"
                />
                {errors.totalAllowed && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.totalAllowed}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  💡 Enter number of users (1-20)
                </p>
              </div>

              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-1">
                  Used
                </label>
                <input
                  disabled
                  value={org.credentials.used}
                  className="border p-2 rounded-lg w-full bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  📊 Currently used slots
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS - FIXED STICKY FOOTER */}
        </div>

        {/* Sticky Action Footer */}
        <div className="flex-shrink-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg">
          <div className="flex gap-3">
            {!isView && (
              <button
                onClick={handleSave}
                disabled={actionLoading}
                className="flex-1 bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </span>
                ) : isEdit ? (
                  "💾 Save Changes"
                ) : (
                  "➕ Add Organization"
                )}
              </button>
            )}

            <button
              onClick={() => setDrawer({ show: false, org: null, mode: "" })}
              className={`px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-semibold ${
                isView ? "flex-1" : ""
              }`}
            >
              {isView ? "Close" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
