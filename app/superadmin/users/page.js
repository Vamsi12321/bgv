"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, Edit, X, Loader2, User } from "lucide-react";

/* 🔹 Base API */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

/* 🔹 All Permissions */
const allPermissions = [
  { key: "organization:create", label: "Organization Create" },
  { key: "organization:view", label: "Organization View" },
  { key: "organization:update", label: "Organization Update" },
  { key: "organization:delete", label: "Organization Delete" },
  { key: "users:manage", label: "Users Manage" },
  { key: "users:view", label: "Users View" },
  { key: "employee:create", label: "Employee Create" },
  { key: "candidate:create", label: "Candidate Create" },
  { key: "candidate:view", label: "Candidate View" },
  { key: "verification:view", label: "Verification View" },
  { key: "verification:assign", label: "Verification Assign" },
  { key: "dashboard:view", label: "Dashboard View" },
];

/* 🔹 Role Presets */
const rolePermissionPresets = {
  ORG_HR: allPermissions.map((p) => p.key),
  HELPER: [
    "dashboard:view",
    "verification:view",
    "verification:assign",
    "candidate:view",
    "candidate:create",
  ],
  SUPER_ADMIN_HELPER: allPermissions.map((p) => p.key),
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [filterRole, setFilterRole] = useState("All");
  const [filterOrgId, setFilterOrgId] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizedOrganizations = useMemo(
    () =>
      (organizations || []).map((o) => ({
        organizationId: o.organizationId || o._id || o.id,
        organizationName: o.organizationName || o.name || "Unnamed Org",
      })),
    [organizations]
  );

  /* Fetch users + orgs */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [usersRes, orgsRes] = await Promise.all([
          fetch(`${API_BASE}/secure/getUsers`, { credentials: "include" }),
          fetch(`${API_BASE}/secure/getOrganizations`, {
            credentials: "include",
          }),
        ]);
        const [usersData, orgsData] = await Promise.all([
          usersRes.json(),
          orgsRes.json(),
        ]);
        if (!usersRes.ok)
          throw new Error(usersData.detail || "Failed to load users");
        if (!orgsRes.ok)
          throw new Error(orgsData.detail || "Failed to load organizations");
        setUsers(usersData.users || []);
        setOrganizations(orgsData.organizations || []);
      } catch (e) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(`${API_BASE}/secure/getUsers`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load users");
    setUsers(data.users || []);
  };

  const handleSaveUser = async (payload, mode, userId) => {
    try {
      let url = `${API_BASE}/secure/addHelper`;
      let method = "POST";
      if (mode === "edit" && userId) {
        url = `${API_BASE}/secure/updateUser/${userId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");

      alert(mode === "edit" ? "User updated!" : "User added!");
      setShowModal(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert("Error saving user: " + err.message);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const byRole = filterRole === "All" ? true : u.role === filterRole;
      const byOrg =
        filterOrgId === "All"
          ? true
          : (u.organizationId && u.organizationId === filterOrgId) ||
            (u.accessibleOrganizations || []).includes(filterOrgId);
      return byRole && byOrg;
    });
  }, [users, filterRole, filterOrgId]);

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
  }, [showModal]);

  /* =================== UI =================== */
  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen text-gray-900 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#ff004f]">Users & Roles</h1>
        <button
          onClick={() => {
            setEditUser(null);
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#ff004f] text-white px-5 py-2.5 rounded-lg hover:bg-[#e60047] shadow-md w-full sm:w-auto transition-all"
        >
          <PlusCircle size={18} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-xl shadow border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <label className="text-sm text-gray-600">Role</label>
          <select
            className="border rounded-lg px-3 py-2 bg-gray-50 text-sm focus:ring-2 focus:ring-[#ff004f] w-full sm:w-48"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="ORG_HR">Organization HR</option>
            <option value="HELPER">Organization Helper</option>
            <option value="SUPER_ADMIN_HELPER">Super Admin Helper</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <label className="text-sm text-gray-600">Organization</label>
          <select
            className="border rounded-lg px-3 py-2 bg-gray-50 text-sm focus:ring-2 focus:ring-[#ff004f] w-full sm:w-48"
            value={filterOrgId}
            onChange={(e) => setFilterOrgId(e.target.value)}
          >
            <option value="All">All Organizations</option>
            {normalizedOrganizations.map((org) => (
              <option key={org.organizationId} value={org.organizationId}>
                {org.organizationName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex justify-center items-center h-64 text-[#ff004f]">
          <Loader2 className="animate-spin" size={28} /> Loading...
        </div>
      ) : (
        <>
          {/* 🖥️ Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 text-left font-semibold">Name</th>
                  <th className="p-3 text-left font-semibold">Email</th>
                  <th className="p-3 text-left font-semibold">Role</th>
                  <th className="p-3 text-left font-semibold">Organization</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length ? (
                  filteredUsers.map((u) => (
                    <tr
                      key={u._id}
                      className={`border-t hover:bg-red-50 transition-all duration-200 ${
                        u.role === "SUPER_ADMIN" ? "bg-[#ffeef3]" : ""
                      }`}
                    >
                      <td className="p-3 font-medium">{u.userName}</td>
                      <td className="p-3 text-gray-700">{u.email}</td>
                      <td className="p-3 text-gray-800">
                        {u.role === "HELPER"
                          ? "Organization Helper"
                          : u.role === "ORG_HR"
                          ? "Organization HR"
                          : u.role === "SUPER_ADMIN_HELPER"
                          ? "Super Admin Helper"
                          : u.role}
                      </td>
                      <td className="p-3">
                        {u.organizationName ||
                          (u.role === "SUPER_ADMIN_HELPER" ? "Multiple" : "—")}
                      </td>
                      <td className="p-3 flex justify-center">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setShowModal(true);
                          }}
                          className="p-2 rounded hover:bg-[#ffeff3] text-[#ff004f] transition"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-6 text-gray-500 italic"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 📱 Mobile Cards */}
          <div className="grid md:hidden gap-4">
            {filteredUsers.map((u) => (
              <div
                key={u._id}
                className="bg-white border rounded-xl shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#ff004f]/10 p-2 rounded-full">
                      <User className="text-[#ff004f]" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {u.userName}
                      </p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditUser(u);
                      setShowModal(true);
                    }}
                    className="p-1 text-[#ff004f] hover:bg-[#ffeff3] rounded"
                  >
                    <Edit size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Role:</strong>{" "}
                  {u.role === "HELPER"
                    ? "Organization Helper"
                    : u.role === "ORG_HR"
                    ? "Organization HR"
                    : u.role === "SUPER_ADMIN_HELPER"
                    ? "Super Admin Helper"
                    : u.role}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Organization:</strong>{" "}
                  {u.organizationName ||
                    (u.role === "SUPER_ADMIN_HELPER" ? "Multiple" : "—")}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <AddEditUserModal
          onClose={() => {
            setShowModal(false);
            setEditUser(null);
          }}
          onSave={handleSaveUser}
          editData={editUser}
          organizations={normalizedOrganizations}
        />
      )}
    </div>
  );
}

/* ==========================================================
   ADD / EDIT MODAL
========================================================== */
function AddEditUserModal({ onClose, onSave, editData, organizations }) {
  const isEdit = !!editData;
  const initialRole = editData?.role || "HELPER";

  const [form, setForm] = useState({
    userName: editData?.userName || "",
    email: editData?.email || "",
    phoneNumber: editData?.phoneNumber || "",
    role: initialRole,
    organizationId: editData?.organizationId || "",
    accessibleOrganizations: editData?.accessibleOrganizations || [],
    permissions:
      editData?.permissions?.length > 0
        ? editData.permissions
        : rolePermissionPresets[initialRole],
    isActive:
      typeof editData?.isActive === "boolean" ? editData.isActive : true,
    password: "Welcome1",
  });

  const setField = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const isHelper = form.role === "HELPER";
  const isOrgHR = form.role === "ORG_HR";
  const isSuperHelper = form.role === "SUPER_ADMIN_HELPER";

  const togglePermission = (perm) => {
    if (isHelper) return; // ❌ disable toggle for helpers
    setField({
      permissions: form.permissions.includes(perm)
        ? form.permissions.filter((p) => p !== perm)
        : [...form.permissions, perm],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      userName: form.userName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      role: form.role,
      permissions: isHelper
        ? rolePermissionPresets.HELPER // ✅ enforce fixed helper perms
        : form.permissions,
      isActive: form.isActive,
      password: "Welcome1",
    };

    if (isSuperHelper)
      payload.accessibleOrganizations = form.accessibleOrganizations;
    else if (isOrgHR || isHelper) payload.organizationId = form.organizationId;

    onSave(payload, isEdit ? "edit" : "add", editData?._id);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh] transition-transform animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#ff004f]"
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-semibold text-[#ff004f] mb-5 text-center">
          {isEdit ? "Edit User" : "Add New User"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Full Name"
              value={form.userName}
              onChange={(e) => setField({ userName: e.target.value })}
              className="border p-3 rounded-lg text-sm focus:ring-2 focus:ring-[#ff004f]"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setField({ email: e.target.value })}
              className="border p-3 rounded-lg text-sm focus:ring-2 focus:ring-[#ff004f]"
              required
            />
          </div>

          {/* Phone + Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="tel"
              pattern="[0-9]{10}"
              placeholder="Phone Number (10 digits)"
              value={form.phoneNumber}
              onChange={(e) =>
                setField({
                  phoneNumber: e.target.value.replace(/[^0-9]/g, ""),
                })
              }
              className="border p-3 rounded-lg text-sm focus:ring-2 focus:ring-[#ff004f]"
              required
            />
            <input
              type="text"
              value="Welcome1"
              disabled
              className="border p-3 rounded-lg text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Role + Active */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={form.role}
              onChange={(e) => {
                const newRole = e.target.value;
                setField({
                  role: newRole,
                  permissions: rolePermissionPresets[newRole] || [],
                });
              }}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#ff004f]"
            >
              <option value="HELPER">Organization Helper</option>
              <option value="ORG_HR">Organization HR</option>
              <option value="SUPER_ADMIN_HELPER">Super Admin Helper</option>
            </select>

            <label className="inline-flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm w-fit">
              <span
                className={`flex items-center gap-2 ${
                  form.isActive ? "text-green-600" : "text-red-500"
                }`}
              >
                {form.isActive ? "Active" : "Inactive"}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={form.isActive}
                onChange={(e) => setField({ isActive: e.target.checked })}
              />
              <div
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                  form.isActive ? "bg-[#ff004f]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    form.isActive ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </div>
            </label>
          </div>

          {/* Organization */}
          {(isHelper || isOrgHR) && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Select Organization
              </label>
              <select
                value={form.organizationId}
                onChange={(e) => setField({ organizationId: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#ff004f] w-full"
                required
              >
                <option value="">Select an organization</option>
                {organizations.map((org) => (
                  <option key={org.organizationId} value={org.organizationId}>
                    {org.organizationName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isSuperHelper && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Accessible Organizations
              </label>
              <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto space-y-2">
                {organizations.map((org) => (
                  <label
                    key={org.organizationId}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.accessibleOrganizations.includes(
                        org.organizationId
                      )}
                      onChange={() => {
                        setField({
                          accessibleOrganizations:
                            form.accessibleOrganizations.includes(
                              org.organizationId
                            )
                              ? form.accessibleOrganizations.filter(
                                  (id) => id !== org.organizationId
                                )
                              : [
                                  ...form.accessibleOrganizations,
                                  org.organizationId,
                                ],
                        });
                      }}
                      className="accent-[#ff004f] h-4 w-4"
                    />
                    {org.organizationName}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Permissions
            </label>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-3 ${
                isHelper ? "bg-gray-100 opacity-80" : "bg-gray-50"
              } max-h-60 overflow-y-auto`}
            >
              {allPermissions.map((perm) => (
                <label
                  key={perm.key}
                  className={`flex items-center gap-2 text-sm text-gray-700 ${
                    isHelper && !form.permissions.includes(perm.key)
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(perm.key)}
                    disabled={isHelper} // ✅ disable checkboxes for helpers
                    onChange={() => togglePermission(perm.key)}
                    className="accent-[#ff004f] h-4 w-4"
                  />
                  {perm.label}
                </label>
              ))}
            </div>
            {isHelper && (
              <p className="text-xs text-gray-500 mt-1 italic">
                Organization Helper permissions are fixed.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#ff004f] hover:bg-[#e60047] text-white font-medium shadow transition"
            >
              {isEdit ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
