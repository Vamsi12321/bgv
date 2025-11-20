"use client";
import React, { useState, useEffect } from "react";
import { PlusCircle, Edit2, X, Info, Loader2, AlertCircle } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [drawer, setDrawer] = useState({ show: false, org: null, mode: "" });
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });

  useEffect(() => {
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
        throw new Error(data.detail || "Failed to fetch organizations");
      if (data.organizations) setOrgs(data.organizations);
    } catch (err) {
      showError(err.message || "Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg) => setErrorModal({ show: true, message: msg });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const alphaNum = /^[a-zA-Z0-9\s]+$/;
  const gstRegex = /^[a-zA-Z0-9]+$/;

  const handleStatusToggle = async (org) => {
    const updatedStatus = !org.isActive;
    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_BASE}/secure/updateOrganization/${org.orgId || org._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...org, isActive: updatedStatus }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update status");
      await fetchOrganizations();
      alert(
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

  const handleSave = async () => {
    const org = drawer.org;
    if (!org.organizationName.trim())
      return showError("Organization name is required.");
    if (!emailRegex.test(org.email))
      return showError("Please enter a valid email address.");
    if (org.spocName && !alphaNum.test(org.spocName))
      return showError("SPOC name can only contain letters and numbers.");
    if (org.gstNumber && !gstRegex.test(org.gstNumber))
      return showError("GST Number must be alphanumeric.");

    const isEdit = drawer.mode === "edit";
    const url = isEdit
      ? `${API_BASE}/secure/updateOrganization/${org.orgId || org._id}`
      : `${API_BASE}/secure/registerOrganization`;
    const method = isEdit ? "PUT" : "POST";

    try {
      setActionLoading(true);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(org),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.detail || data.message || "Save failed");
      setDrawer({ show: false, org: null, mode: "" });
      await fetchOrganizations();
      alert(isEdit ? "✅ Organization updated!" : "✅ Organization added!");
    } catch (err) {
      showError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

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
        services: [{ serviceName: "", price: "" }],
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold text-[#ff004f]">Organizations</h1>
        <button
          onClick={openAddDrawer}
          disabled={loading || actionLoading}
          className={`flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-lg shadow-md text-white font-medium transition ${
            loading || actionLoading
              ? "bg-[#ff004f]/60 cursor-not-allowed"
              : "bg-[#ff004f] hover:bg-[#e60047]"
          }`}
        >
          <PlusCircle size={18} />
          Add Organization
        </button>
      </div>

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-[90%] text-center">
            <AlertCircle
              size={48}
              className="mx-auto text-[#ff004f] mb-3 animate-pulse"
            />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Operation Failed
            </h2>
            <p className="text-gray-600 mb-5">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ show: false, message: "" })}
              className="px-5 py-2.5 bg-[#ff004f] text-white rounded-lg hover:bg-[#e60047] transition shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Loader */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <Loader2 className="animate-spin mb-3 text-[#ff004f]" size={32} />
          <p className="font-semibold">Loading organizations...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white px-6 py-5 rounded-2xl shadow-md border border-gray-200 overflow-x-auto">
            <table className="w-full border-collapse text-sm md:text-base min-w-[800px]">
              <thead className="bg-[#ff004f]/10">
                <tr className="text-gray-700">
                  {[
                    "Logo",
                    "Organization",
                    "SPOC",
                    "Email",
                    "Domain",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="p-3 text-left font-semibold text-xs uppercase tracking-wide"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.length ? (
                  orgs.map((org, i) => (
                    <tr
                      key={org._id}
                      className={`border-b ${
                        i % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-[#ff004f]/10 transition`}
                    >
                      <td className="p-3">
                        <img
                          src={getLogoSrc(org.logoUrl)}
                          alt="logo"
                          className="w-10 h-10 rounded-full border object-cover"
                        />
                      </td>
                      <td className="p-3 font-semibold text-gray-800 truncate max-w-[200px]">
                        {org.organizationName}
                      </td>
                      <td className="p-3 text-gray-700">{org.spocName}</td>
                      <td className="p-3 text-gray-600 truncate max-w-[180px]">
                        {org.email}
                      </td>
                      <td className="p-3 text-gray-600">{org.subDomain}</td>
                      <td className="p-3 flex justify-center gap-3">
                        <button
                          onClick={() =>
                            setDrawer({ show: true, org, mode: "view" })
                          }
                          className="text-gray-700 hover:text-[#ff004f]"
                        >
                          <Info size={18} />
                        </button>
                        <button
                          onClick={() =>
                            setDrawer({ show: true, org, mode: "edit" })
                          }
                          className="text-[#ff004f] hover:text-[#d90044]"
                        >
                          <Edit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center p-4 text-gray-500 italic"
                    >
                      No organizations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid md:hidden gap-4 mt-4">
            {orgs.map((org) => (
              <div
                key={org._id}
                className="bg-white shadow-md rounded-xl p-4 space-y-2 border hover:border-[#ff004f]/40 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={getLogoSrc(org.logoUrl)}
                      alt="logo"
                      className="w-10 h-10 rounded-full border object-cover"
                    />
                    <div>
                      <p className="font-semibold text-base text-gray-800">
                        {org.organizationName}
                      </p>
                      <p className="text-sm text-gray-600">{org.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      org.isActive ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {org.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-sm text-gray-700 truncate">
                  <span className="font-medium">Domain:</span> {org.subDomain}
                </p>
                <p className="text-sm text-gray-700 truncate">
                  <span className="font-medium">SPOC:</span> {org.spocName}
                </p>

                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={() => setDrawer({ show: true, org, mode: "view" })}
                    className="text-gray-700 hover:text-[#ff004f]"
                  >
                    <Info size={18} />
                  </button>
                  <button
                    onClick={() => setDrawer({ show: true, org, mode: "edit" })}
                    className="text-[#ff004f] hover:text-[#d90044]"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Drawer */}
      {drawer.show && (
        <OrganizationDrawer
          drawer={drawer}
          setDrawer={setDrawer}
          actionLoading={actionLoading}
          handleSave={handleSave}
          handleStatusToggle={handleStatusToggle}
        />
      )}
    </div>
  );
}

/* Drawer Component */
function OrganizationDrawer({
  drawer,
  setDrawer,
  handleSave,
  handleStatusToggle,
  actionLoading,
}) {
  const org = drawer.org;
  const getLogoSrc = (url) =>
    !url || !url.trim()
      ? "/default-logo.png"
      : url.startsWith("http")
      ? url
      : `/logos/${url}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:flex-row">
      <div
        className="flex-1 bg-black/40"
        onClick={() => setDrawer({ show: false, org: null, mode: "" })}
      ></div>

      <div className="w-full sm:w-[420px] md:w-[480px] lg:w-[520px] bg-white h-full shadow-2xl p-6 overflow-y-auto border-l-4 border-[#ff004f]">
        {org.logoUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={getLogoSrc(org.logoUrl)}
              alt="Logo"
              className="w-20 h-20 rounded-full border shadow-md object-cover"
            />
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#ff004f]">
            {drawer.mode === "add"
              ? "Add Organization"
              : drawer.mode === "edit"
              ? "Edit Organization"
              : org.organizationName}
          </h2>
          <button
            onClick={() => setDrawer({ show: false, org: null, mode: "" })}
            className="text-gray-500 hover:text-[#ff004f]"
          >
            <X size={22} />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-sm md:text-base">
          {[
            ["Organization Name", "organizationName", "text"],
            ["SPOC Name", "spocName", "text"],
            ["Email", "email", "email"],
            ["Sub Domain", "subDomain", "text"],
            ["Main Domain", "mainDomain", "text"],
            ["GST Number", "gstNumber", "text"],
            ["Logo URL", "logoUrl", "text"],
          ].map(([label, key, type]) => (
            <div key={key}>
              <label className="block text-gray-700 font-semibold mb-1">
                {label}
              </label>
              <input
                type={type}
                disabled={drawer.mode === "view" || actionLoading}
                value={org[key] || ""}
                onChange={(e) =>
                  setDrawer((prev) => ({
                    ...prev,
                    org: { ...prev.org, [key]: e.target.value },
                  }))
                }
                className={`border rounded-md w-full p-2.5 text-gray-800 ${
                  drawer.mode !== "view"
                    ? "focus:ring-2 focus:ring-[#ff004f]"
                    : "bg-gray-100"
                }`}
              />
            </div>
          ))}

          {/* Services */}
          {/* Services */}
          <div className="border-t pt-3">
            <h3 className="font-semibold text-gray-700 mb-2 text-base">
              Services Offered
            </h3>

            {/* Fixed master service list */}
            {[
              "aadhaar",
              "pan",
              "bankAccount",
              "uan",
              "fir",
              "passport",
              "education",
              "employment",
              "cibil",
            ].map((service) => {
              const isChecked =
                org.services?.some((s) => s.serviceName === service) || false;

              return (
                <label
                  key={service}
                  className="flex items-center gap-2 mb-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    disabled={drawer.mode === "view" || actionLoading}
                    checked={isChecked}
                    onChange={(e) => {
                      setDrawer((prev) => {
                        let updated = [...(prev.org.services || [])];

                        if (e.target.checked) {
                          // add service
                          updated.push({ serviceName: service, price: "" });
                        } else {
                          // remove service
                          updated = updated.filter(
                            (s) => s.serviceName !== service
                          );
                        }

                        return {
                          ...prev,
                          org: { ...prev.org, services: updated },
                        };
                      });
                    }}
                    className="w-4 h-4 text-[#ff004f] rounded"
                  />
                  <span className="capitalize">{service}</span>
                </label>
              );
            })}

            {/* Price Inputs auto shown ONLY for checked services */}
            {org.services?.length > 0 && (
              <div className="mt-4 space-y-2">
                {org.services.map((s, i) => (
                  <div key={i} className="flex flex-col">
                    <label className="text-sm text-gray-700 font-semibold capitalize">
                      {s.serviceName} Price
                    </label>
                    <input
                      type="number"
                      disabled={drawer.mode === "view" || actionLoading}
                      value={s.price}
                      onChange={(e) =>
                        setDrawer((prev) => {
                          const updated = [...prev.org.services];
                          updated[i].price = e.target.value;
                          return {
                            ...prev,
                            org: { ...prev.org, services: updated },
                          };
                        })
                      }
                      className="border rounded-md p-2 focus:ring-2 focus:ring-[#ff004f]"
                      placeholder="Enter price"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Credentials */}
          <div className="border-t pt-3">
            <h3 className="font-semibold text-gray-700 mb-2 text-base">
              Organization Credentials
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-1">
                  Total Allowed
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={drawer.mode === "view" || actionLoading}
                  value={org.credentials?.totalAllowed || 0}
                  onChange={(e) =>
                    setDrawer((prev) => ({
                      ...prev,
                      org: {
                        ...prev.org,
                        credentials: {
                          ...prev.org.credentials,
                          totalAllowed: Number(e.target.value),
                        },
                      },
                    }))
                  }
                  className={`border rounded-md w-full p-2.5 text-gray-800 ${
                    drawer.mode !== "view"
                      ? "focus:ring-2 focus:ring-[#ff004f]"
                      : "bg-gray-100"
                  }`}
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-1">
                  Used
                </label>
                <input
                  type="number"
                  disabled
                  value={org.credentials?.used || 0}
                  className="border rounded-md w-full p-2.5 bg-gray-100 text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          {drawer.mode === "view" && (
            <div className="border-t pt-3">
              <h3 className="font-semibold text-gray-700 mb-2 text-base">
                Status
              </h3>
              <p
                className={`font-semibold ${
                  org.isActive ? "text-green-600" : "text-red-500"
                }`}
              >
                {org.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3">
            {drawer.mode === "edit" && (
              <button
                disabled={actionLoading}
                onClick={() => handleStatusToggle(org)}
                className={`w-full sm:w-auto px-4 py-2 rounded-md text-white font-semibold transition ${
                  actionLoading
                    ? "opacity-60 cursor-not-allowed"
                    : org.isActive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {org.isActive ? "Suspend" : "Activate"}
              </button>
            )}
            {drawer.mode !== "view" && (
              <button
                disabled={actionLoading}
                onClick={handleSave}
                className={`w-full sm:w-auto px-4 py-2 rounded-md bg-[#ff004f] hover:bg-[#e60047] text-white font-semibold transition ${
                  actionLoading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Saving...
                  </span>
                ) : drawer.mode === "add" ? (
                  "Add Organization"
                ) : (
                  "Save Changes"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
