"use client";
import React, { useState, useEffect } from "react";
import { PlusCircle, Edit2, X, Info, Loader2 } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // 🔹 for button disabling
  const [drawer, setDrawer] = useState({ show: false, org: null, mode: "" });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // 🔹 Fetch all organizations
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/secure/getAllOrganizations`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch organizations");
      const data = await res.json();
      if (data.organizations) setOrgs(data.organizations);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch organizations — please log in again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Suspend / Activate organization
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
      if (!res.ok) throw new Error("Failed to update status");

      setOrgs((prev) =>
        prev.map((o) =>
          o._id === org._id ? { ...o, isActive: updatedStatus } : o
        )
      );

      setDrawer((prev) => ({
        ...prev,
        org: { ...prev.org, isActive: updatedStatus },
      }));

      await fetchOrganizations();

      alert(
        `Organization ${
          updatedStatus ? "activated" : "suspended"
        } successfully!`
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update organization status.");
    } finally {
      setActionLoading(false);
    }
  };

  // 🔹 Save (Add / Edit)
  const handleSave = async () => {
    const isEdit = drawer.mode === "edit";
    const url = isEdit
      ? `${API_BASE}/secure/updateOrganization/${
          drawer.org.orgId || drawer.org._id
        }`
      : `${API_BASE}/secure/registerOrganization`;
    const method = isEdit ? "PUT" : "POST";

    try {
      setActionLoading(true);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(drawer.org),
      });

      if (!res.ok) throw new Error("Save failed");

      setDrawer({ show: false, org: null, mode: "" });
      await fetchOrganizations();

      alert(isEdit ? "✅ Organization updated!" : "✅ Organization added!");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setActionLoading(false);
    }
  };

  const openAddDrawer = () => {
    setDrawer({
      show: true,
      mode: "add",
      org: {
        organizationName: "",
        spocName: "",
        email: "",
        subDomain: "",
        mainDomain: "",
        gstNumber: "",
        logoUrl: "",
        services: [{ serviceName: "", price: "" }],
        credentials: { totalAllowed: 0, used: 0 },
        isActive: true,
      },
    });
  };

  // 🔹 Fallback for invalid/missing logo URLs
  const getLogoSrc = (url) => {
    if (!url || url.trim() === "") return "/default-logo.png";
    if (url.startsWith("http")) return url;
    return `/logos/${url}`;
  };

  return (
    <div className="p-4 md:p-8 text-gray-900 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">
          Organizations
        </h1>
        <button
          onClick={openAddDrawer}
          disabled={loading || actionLoading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-md text-white text-sm md:text-base font-medium transition 
            ${
              loading || actionLoading
                ? "bg-green-600/60 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
        >
          <PlusCircle size={18} />
          Add Organization
        </button>
      </div>

      {/* 🔄 Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <Loader2 className="animate-spin mb-3 text-blue-600" size={32} />
          <p className="text-base font-semibold">Loading organizations...</p>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      ) : (
        <>
          {/* Table (Desktop) */}
          <div className="hidden md:block bg-white px-6 py-5 rounded-2xl shadow-md border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm md:text-base min-w-[800px]">
                <thead className="bg-gray-100">
                  <tr className="text-gray-700">
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
                        } hover:bg-blue-50/40 transition`}
                      >
                        <td className="p-3">
                          <img
                            src={getLogoSrc(org.logoUrl)}
                            className="w-10 h-10 rounded-full border object-cover"
                            alt="logo"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/default-logo.png";
                            }}
                          />
                        </td>
                        <td className="p-3 font-semibold text-gray-800">
                          {org.organizationName}
                        </td>
                        <td className="p-3 text-gray-700">{org.spocName}</td>
                        <td className="p-3 truncate max-w-[180px] text-gray-600">
                          {org.email}
                        </td>
                        <td className="p-3 text-gray-600">{org.subDomain}</td>
                        <td
                          className={`p-3 font-medium ${
                            org.isActive ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {org.isActive ? "Active" : "Inactive"}
                        </td>
                        <td className="p-3 flex justify-center gap-3">
                          <button
                            disabled={actionLoading}
                            onClick={() =>
                              setDrawer({ show: true, org, mode: "view" })
                            }
                            className={`${
                              actionLoading
                                ? "opacity-60 cursor-not-allowed"
                                : "text-gray-700 hover:text-black"
                            }`}
                          >
                            <Info size={18} />
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() =>
                              setDrawer({ show: true, org, mode: "edit" })
                            }
                            className={`${
                              actionLoading
                                ? "opacity-60 cursor-not-allowed"
                                : "text-blue-600 hover:text-blue-800"
                            }`}
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
          </div>

          {/* Mobile Cards */}
          <div className="grid md:hidden gap-4">
            {orgs.map((org) => (
              <div
                key={org._id}
                className="bg-white shadow-md rounded-xl p-4 space-y-2 border hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={getLogoSrc(org.logoUrl)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default-logo.png";
                      }}
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
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => setDrawer({ show: true, org, mode: "view" })}
                    className={`${
                      actionLoading
                        ? "opacity-60 cursor-not-allowed"
                        : "text-gray-700 hover:text-black"
                    }`}
                  >
                    <Info size={18} />
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => setDrawer({ show: true, org, mode: "edit" })}
                    className={`${
                      actionLoading
                        ? "opacity-60 cursor-not-allowed"
                        : "text-blue-600 hover:text-blue-800"
                    }`}
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
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setDrawer({ show: false, org: null, mode: "" })}
          ></div>

          <div className="w-full sm:w-[420px] md:w-[480px] lg:w-[520px] bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slideInLeft">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#ff004f]">
                {drawer.mode === "add"
                  ? "Add Organization"
                  : drawer.mode === "edit"
                  ? "Edit Organization"
                  : drawer.org.organizationName}
              </h2>
              <button
                disabled={actionLoading}
                onClick={() => setDrawer({ show: false, org: null, mode: "" })}
                className={`text-gray-500 hover:text-gray-800 ${
                  actionLoading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4 text-sm md:text-base">
              {/* Fields */}
              {[
                ["Organization Name", "organizationName"],
                ["SPOC Name", "spocName"],
                ["Email", "email"],
                ["Domain", "subDomain"],
                ["Main URL", "mainDomain"],
                ["GST Number", "gstNumber"],
                ["Logo URL", "logoUrl"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-gray-700 font-semibold mb-1">
                    {label}
                  </label>
                  <input
                    disabled={drawer.mode === "view" || actionLoading}
                    value={drawer.org[key] || ""}
                    onChange={(e) =>
                      setDrawer((prev) => ({
                        ...prev,
                        org: { ...prev.org, [key]: e.target.value },
                      }))
                    }
                    className={`border rounded-md w-full p-2.5 text-gray-800 ${
                      drawer.mode !== "view"
                        ? "focus:ring-2 focus:ring-blue-500"
                        : "bg-gray-100"
                    }`}
                  />
                </div>
              ))}

              {/* Credentials */}
              <div className="border-t pt-3">
                <h3 className="font-semibold text-gray-700 mb-1 text-base">
                  Credentials
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    disabled
                    value={drawer.org.credentials?.used || 0}
                    className="border rounded p-2 w-full sm:w-1/2 bg-gray-100 text-gray-600"
                  />
                  <input
                    type="number"
                    disabled={drawer.mode === "view" || actionLoading}
                    value={drawer.org.credentials?.totalAllowed || 0}
                    onChange={(e) =>
                      setDrawer((prev) => ({
                        ...prev,
                        org: {
                          ...prev.org,
                          credentials: {
                            ...prev.org.credentials,
                            totalAllowed: e.target.value,
                          },
                        },
                      }))
                    }
                    className="border rounded p-2 w-full sm:w-1/2"
                  />
                </div>
              </div>

              {/* Services */}
              <div className="border-t pt-3">
                <h3 className="font-semibold text-gray-700 mb-2 text-base">
                  Services Offered
                </h3>
                {drawer.org.services?.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row gap-2 mb-2 w-full"
                  >
                    <input
                      disabled={drawer.mode === "view" || actionLoading}
                      value={s.serviceName}
                      onChange={(e) =>
                        setDrawer((prev) => {
                          const newS = [...prev.org.services];
                          newS[i].serviceName = e.target.value;
                          return {
                            ...prev,
                            org: { ...prev.org, services: newS },
                          };
                        })
                      }
                      className="border rounded-md p-2 w-full sm:w-1/2"
                    />
                    <input
                      disabled={drawer.mode === "view" || actionLoading}
                      type="number"
                      value={s.price}
                      onChange={(e) =>
                        setDrawer((prev) => {
                          const newS = [...prev.org.services];
                          newS[i].price = e.target.value;
                          return {
                            ...prev,
                            org: { ...prev.org, services: newS },
                          };
                        })
                      }
                      className="border rounded-md p-2 w-full sm:w-1/2"
                    />
                  </div>
                ))}
                {drawer.mode !== "view" && !actionLoading && (
                  <button
                    onClick={() =>
                      setDrawer((prev) => ({
                        ...prev,
                        org: {
                          ...prev.org,
                          services: [
                            ...(prev.org.services || []),
                            { serviceName: "", price: "" },
                          ],
                        },
                      }))
                    }
                    className="text-blue-600 mt-1 text-sm hover:underline"
                  >
                    + Add Service
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3">
                {drawer.mode === "edit" && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusToggle(drawer.org)}
                    className={`w-full sm:w-auto px-4 py-2 rounded-md text-white font-semibold transition ${
                      actionLoading
                        ? "opacity-60 cursor-not-allowed"
                        : drawer.org.isActive
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {actionLoading
                      ? "Processing..."
                      : drawer.org.isActive
                      ? "Suspend"
                      : "Activate"}
                  </button>
                )}
                {drawer.mode !== "view" && (
                  <button
                    disabled={actionLoading}
                    onClick={handleSave}
                    className={`w-full sm:w-auto px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition ${
                      actionLoading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {actionLoading
                      ? "Saving..."
                      : drawer.mode === "add"
                      ? "Add Organization"
                      : "Save Changes"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
