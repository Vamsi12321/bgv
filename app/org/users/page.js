// app/(whatever)/OrgUsersPage.jsx
"use client";
import { useState, useEffect } from "react";
import {
  PlusCircle,
  Edit,
  X,
  Loader2,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useOrgState } from "../../context/OrgStateContext";

/* 🔹 Base API */


/* 🔹 Updated Org-Level Permissions (as requested) */
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

/* 🔹 Default Role Permission Presets
   - HELPER must have candidate:view and verification view/assign as requested.
*/
const rolePermissionPresets = {
  ORG_HR: [
    "organization:view",
    "users:view",
    "employee:create",
    "candidate:create",
    "candidate:view",
    "verification:view",
    "verification:assign",
    "dashboard:view",
  ],
  HELPER: [
    "candidate:view",
    "verification:view",
    "verification:assign",
    "dashboard:view",
  ],
};

/* ==========================================================
   MAIN PAGE
========================================================== */
export default function OrgUsersPage() {
  const {
    usersData: users,
    setUsersData: setUsers,
    usersFilterRole: filterRole,
    setUsersFilterRole: setFilterRole,
  } = useOrgState();

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  /* 🔹 Fetch users for this organization */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/proxy/secure/getUsers`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load users");
      setUsers(data.users || []);
    } catch (e) {
      alert(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have data
    if (users.length === 0) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, []);

  /* 🔹 Add/Edit user */
  const handleSaveUser = async (payload, mode, userId) => {
    try {
      let url = `/api/proxy/secure/addHelper`;
      let method = "POST";
      if (mode === "edit" && userId) {
        url = `/api/proxy/secure/updateUser/${userId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMessage =
          data?.detail || data?.message || "Unknown server error occurred.";
        throw new Error(errMessage);
      }

      // refresh and close modal
      setShowModal(false);
      setEditUser(null);
      fetchUsers();

      return data;
    } catch (err) {
      // rethrow so modal handler can display
      throw err;
    }
  };

  const filteredUsers =
    filterRole === "All" ? users : users.filter((u) => u.role === filterRole);

  return (
    <div className="p-4 sm:p-6 md:p-8 text-gray-900 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShieldCheck className="text-[#ff004f]" /> Organization Users
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-[#ff004f] text-white px-5 py-2 rounded-lg hover:bg-[#e60047] shadow-md w-full sm:w-auto"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {/* 🔹 Filter */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow border border-gray-200">
        <select
          className="border rounded-lg px-3 py-2 bg-gray-50 text-sm focus:ring-2 focus:ring-[#ff004f]"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="ORG_HR">Org HR</option>
          <option value="HELPER">Helper</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-[#ff004f]">
          <Loader2 className="animate-spin" size={24} /> Loading...
        </div>
      ) : (
        <>
          {/* ✅ Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr className="text-gray-700">
                  <th className="p-3 text-left font-semibold">Name</th>
                  <th className="p-3 text-left font-semibold">Email</th>
                  <th className="p-3 text-left font-semibold">Phone</th>
                  <th className="p-3 text-left font-semibold">Role</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Created By</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length ? (
                  filteredUsers.map((u) => (
                    <tr
                      key={u._id}
                      className="border-t hover:bg-gray-50 transition-all duration-200"
                    >
                      <td className="p-3 font-medium">{u.userName}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.phoneNumber || "—"}</td>
                      <td className="p-3">{u.role}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            u.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="p-3">{u.createdBy || "—"}</td>
                      <td className="p-3 flex justify-center">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setShowModal(true);
                          }}
                          className="text-[#ff004f] hover:text-[#cc0040]"
                        >
                          <Edit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-6 text-gray-500 italic"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ Mobile Card View */}
          <div className="grid md:hidden gap-4">
            {filteredUsers.map((u) => (
              <div
                key={u._id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{u.userName}</p>
                    <p className="text-sm text-gray-600">{u.email}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      u.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.isActive ? "Active" : "Suspended"}
                  </span>
                </div>

                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-semibold">Role:</span> {u.role}
                  </p>
                  <p>
                    <span className="font-semibold">Phone:</span>{" "}
                    {u.phoneNumber || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Created By:</span>{" "}
                    {u.createdBy || "—"}
                  </p>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => {
                      setEditUser(u);
                      setShowModal(true);
                    }}
                    className="text-[#ff004f] hover:text-[#cc0040]"
                  >
                    <Edit size={18} />
                  </button>
                </div>
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
        />
      )}
    </div>
  );
}

/* ==========================================================
   ADD / EDIT MODAL (with updated red theme + new permissions)
========================================================== */
function AddEditUserModal({ onClose, onSave, editData }) {
  const isEdit = !!editData;

  const [form, setForm] = useState(
    editData
      ? {
          userName: editData.userName || "",
          email: editData.email || "",
          phoneNumber: editData.phoneNumber || "",
          role: editData.role || "HELPER",
          permissions: [...(editData.permissions || [])],
          isActive: editData.isActive ?? true,
          password: "",
        }
      : {
          userName: "",
          email: "",
          phoneNumber: "",
          role: "HELPER",
          permissions: [...rolePermissionPresets.HELPER],
          isActive: true,
          password: "Welcome1",
        }
  );

  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState(null);

  const handleInputChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const showPopup = (type, message, duration = 4000) => {
    setPopup({ type, message });
    setTimeout(() => setPopup(null), duration);
  };

  const handleRoleChange = (newRole) => {
    setForm((prev) => ({
      ...prev,
      role: newRole,
      permissions: [...(rolePermissionPresets[newRole] || [])],
    }));
  };

  const togglePermission = (perm) => {
    if (form.role === "HELPER") return; // disable editing for HELPER

    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      userName: form.userName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      role: form.role,
      permissions: form.permissions,
      isActive: form.isActive,
    };
    if (!isEdit) payload.password = form.password || "Welcome1";

    try {
      await onSave(
        payload,
        isEdit ? "edit" : "add",
        isEdit ? editData._id : undefined
      );

      showPopup("success", isEdit ? "User updated!" : "User added!");
      onClose();
    } catch (err) {
      showPopup("error", err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg p-6 relative shadow-lg">
          <button
            onClick={onClose}
            disabled={saving}
            className="absolute top-3 right-3 text-gray-500 hover:text-black"
          >
            <X size={20} />
          </button>

          <h2 className="text-lg font-semibold mb-4 text-[#ff004f]">
            {isEdit ? "Edit User" : "Add New User"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              placeholder="Full Name"
              value={form.userName}
              onChange={(e) => handleInputChange("userName", e.target.value)}
              className="w-full border p-2 rounded text-sm"
              required
            />

            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full border p-2 rounded text-sm"
              required
            />

            <input
              placeholder="Phone Number"
              value={form.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              className="w-full border p-2 rounded text-sm"
              required
            />

            {!isEdit && (
              <input
                placeholder="Password (default Welcome1)"
                value={form.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full border p-2 rounded text-sm"
              />
            )}

            <select
              value={form.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full border p-2 rounded text-sm"
            >
              {/* ALWAYS allow Helper */}
              <option value="HELPER">Organization Helper</option>

              {/* ORG_HR can only add HELPER → hide ORG_HR option */}
              {typeof window !== "undefined" &&
                JSON.parse(localStorage.getItem("bgvUser"))?.role !==
                  "ORG_HR" && <option value="ORG_HR">Organization HR</option>}

              {/* Remove SUPER_ADMIN_HELPER everywhere */}
              {/* (Do NOT include this option) */}
            </select>

            {/* Status toggle only if editing */}
            {isEdit && (
              <div className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                <span className="font-medium text-gray-700">
                  {form.isActive ? "Active" : "Suspended"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                  className={`relative inline-flex h-6 w-11 rounded-full transition ${
                    form.isActive ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      form.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Permissions */}
            <div className="border rounded-md p-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Permissions
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[200px] overflow-y-auto">
                {allPermissions.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-center gap-2 text-sm text-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(p.key)}
                      onChange={() => togglePermission(p.key)}
                      disabled={form.role === "HELPER" || saving}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded text-white bg-[#ff004f] hover:bg-[#e60047]"
              >
                {isEdit ? "Save Changes" : "Add User"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {popup && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/30">
          <div className="px-6 py-4 bg-white border rounded-lg shadow-lg">
            <p className="font-medium text-center">{popup.message}</p>
            <div className="flex justify-center mt-3">
              <button
                onClick={() => setPopup(null)}
                className="px-4 py-1 text-sm rounded-md bg-gray-800 text-white"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
