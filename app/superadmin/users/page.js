"use client";
import { useState, useEffect, useMemo } from "react";
import {
  PlusCircle,
  Edit,
  Trash2,
  X,
  Loader2,
  Info,
  Building2,
  ShieldCheck,
} from "lucide-react";

/* 🔹 Base API */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

/* 🔹 All available permissions */
const allPermissions = [
  { key: "dashboard:view", label: "Dashboard View" },
  { key: "organization:view", label: "Organization View" },
  { key: "organization:update", label: "Organization Update" },
  { key: "helper:add", label: "Add Helper" },
  { key: "verification:view", label: "Verification View" },
  { key: "verification:assign", label: "Verification Assign" },
  { key: "report:view", label: "Report View" },
  { key: "report:generate", label: "Report Generate" },
  { key: "logs:view", label: "Logs View" },
];

/* 🔹 Role-based default permissions */
const rolePermissionPresets = {
  SUPER_ADMIN: [
    "organization:view",
    "organization:update",
    "helper:add",
    "verification:view",
    "dashboard:view",
    "report:view",
    "report:generate",
  ],
  SUPER_ADMIN_HELPER: [
    "organization:view",
    "helper:add",
    "verification:view",
    "dashboard:view",
  ],
  ORG_HR: [
    "organization:view",
    "organization:update",
    "employee:create",
    "verification:view",
    "verification:assign",
    "dashboard:view",
  ],
  HELPER: ["verification:view", "dashboard:view"],
};

/* ==========================================================
   USERS PAGE
========================================================== */
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [filterRole, setFilterRole] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orgPopupFor, setOrgPopupFor] = useState(null);

  const normalizedOrganizations = useMemo(
    () =>
      (organizations || []).map((o) => ({
        organizationId: o.organizationId || o._id || o.id,
        organizationName: o.organizationName || o.name || "Unnamed Org",
      })),
    [organizations]
  );

  /* 🔹 Fetch Data */
  const fetchUsers = async () => {
    const res = await fetch(`${API_BASE}/secure/getUsers`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load users");
    setUsers(data.users || []);
  };

  const fetchOrganizations = async () => {
    const res = await fetch(`${API_BASE}/secure/getOrganizations`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load organizations");
    setOrganizations(data.organizations || []);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchOrganizations()]);
      } catch (e) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* 🔹 Delete User */
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`${API_BASE}/secure/deleteUser/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      alert("Failed to delete user.");
    }
  };

  /* 🔹 Add or Edit User */
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

  const filteredUsers =
    filterRole === "All" ? users : users.filter((u) => u.role === filterRole);

  /* ==========================================================
     UI Rendering
  ========================================================== */
  return (
    <div className="p-4 sm:p-6 md:p-8 text-gray-900 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Users & Roles</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow"
        >
          <PlusCircle size={18} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow border border-gray-200">
        <select
          className="border rounded-lg px-3 py-2 bg-gray-50 text-sm"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="SUPER_ADMIN_HELPER">Super Admin Helper</option>
          <option value="ORG_HR">Org HR</option>
          <option value="HELPER">Helper</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64 text-blue-600">
          <Loader2 className="animate-spin" size={24} /> Loading...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Organization</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{u.userName}</td>
                  <td className="p-3 text-gray-700">{u.email}</td>
                  <td className="p-3 flex items-center gap-2">
                    {u.role}
                    {u.role === "SUPER_ADMIN_HELPER" && (
                      <button
                        className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded"
                        onClick={() =>
                          setOrgPopupFor((prev) =>
                            prev === u._id ? null : u._id
                          )
                        }
                        title="Show accessible organizations"
                      >
                        <Info size={14} />
                        Orgs
                      </button>
                    )}
                  </td>
                  <td className="p-3">
                    {u.organizationName ||
                      (u.role === "SUPER_ADMIN_HELPER" ? "Multiple" : "—")}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        u.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="p-3 flex justify-center gap-3 relative">
                    <button
                      onClick={() => {
                        setEditUser(u);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>

                    {/* Accessible Orgs Popup */}
                    {orgPopupFor === u._id && (
                      <div className="absolute right-0 top-8 z-20 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                          <Building2 size={16} /> Accessible Organizations
                        </div>
                        <div className="space-y-1 max-h-56 overflow-auto pr-1">
                          {(u.accessibleOrganizations || []).length === 0 ? (
                            <p className="text-xs text-gray-600">None</p>
                          ) : (
                            (u.accessibleOrganizations || []).map((oid) => {
                              const org = normalizedOrganizations.find(
                                (o) => o.organizationId === oid
                              );
                              return (
                                <div
                                  key={`${u._id}-${oid}`}
                                  className="text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded px-2 py-1 flex items-center gap-1"
                                >
                                  <ShieldCheck size={12} />
                                  {org?.organizationName || oid}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddEditUserModal
          onClose={() => {
            setShowModal(false);
            setEditUser(null);
          }}
          onSave={handleSaveUser}
          editData={editUser}
          organizations={normalizedOrganizations}
          refreshUsers={fetchUsers}
        />
      )}
    </div>
  );
}

/* ==========================================================
   ADD / EDIT MODAL (with suspend toggle)
========================================================== */
function AddEditUserModal({
  onClose,
  onSave,
  editData,
  organizations,
  refreshUsers,
}) {
  const [form, setForm] = useState(
    editData
      ? {
          userName: editData.userName || "",
          email: editData.email || "",
          phoneNumber: editData.phoneNumber || "",
          role: editData.role || "HELPER",
          organizationId: editData.organizationId || "",
          accessibleOrganizations: editData.accessibleOrganizations || [],
          permissions: editData.permissions || [],
          isActive:
            typeof editData.isActive === "boolean" ? editData.isActive : true,
          password: "",
        }
      : {
          userName: "",
          email: "",
          password: "Welcome1",
          phoneNumber: "",
          role: "HELPER",
          organizationId: "",
          accessibleOrganizations: [],
          permissions: [...rolePermissionPresets.HELPER],
          isActive: true,
        }
  );

  const isEdit = !!editData;
  const setField = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const togglePermission = (perm) =>
    setField({
      permissions: form.permissions.includes(perm)
        ? form.permissions.filter((p) => p !== perm)
        : [...form.permissions, perm],
    });

  const toggleAccessibleOrg = (id) =>
    setField({
      accessibleOrganizations: form.accessibleOrganizations.includes(id)
        ? form.accessibleOrganizations.filter((x) => x !== id)
        : [...form.accessibleOrganizations, id],
    });

  const applyRoleDefaults = () =>
    setField({ permissions: [...(rolePermissionPresets[form.role] || [])] });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      userName: form.userName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      role: form.role,
      permissions: form.permissions,
      isActive: form.isActive,
    };
    if (!isEdit) payload.password = form.password || "Welcome1";
    if (form.role === "SUPER_ADMIN_HELPER")
      payload.accessibleOrganizations = form.accessibleOrganizations;
    else if (form.role === "ORG_HR" || form.role === "HELPER")
      payload.organizationId = form.organizationId;

    onSave(payload, isEdit ? "edit" : "add", isEdit ? editData._id : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative overflow-y-auto max-h-[92vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit User" : "Add New User"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Full Name"
              value={form.userName}
              onChange={(e) => setField({ userName: e.target.value })}
              className="border p-2 rounded text-sm"
              required
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setField({ email: e.target.value })}
              className="border p-2 rounded text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Phone Number"
              value={form.phoneNumber}
              onChange={(e) => setField({ phoneNumber: e.target.value })}
              className="border p-2 rounded text-sm"
              required
            />
            {!isEdit && (
              <input
                placeholder="Password (default Welcome1)"
                value={form.password}
                onChange={(e) => setField({ password: e.target.value })}
                className="border p-2 rounded text-sm"
              />
            )}
          </div>

          {/* Role + Suspend Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <select
              value={form.role}
              onChange={(e) => setField({ role: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm w-full"
            >
              <option value="HELPER">Helper</option>
              <option value="ORG_HR">Org HR</option>
              <option value="SUPER_ADMIN_HELPER">Super Admin Helper</option>
            </select>

            <label className="inline-flex items-center justify-between text-sm border rounded-md px-3 py-2 cursor-pointer w-full md:w-auto">
              <span className="flex items-center gap-2">
                {form.isActive ? (
                  <>
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
                    Active
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
                    Suspended
                  </>
                )}
              </span>

              <input
                type="checkbox"
                className="sr-only"
                checked={!!form.isActive}
                onChange={async (e) => {
                  const newStatus = e.target.checked;
                  setField({ isActive: newStatus });
                  if (isEdit && editData?._id) {
                    try {
                      const res = await fetch(
                        `${API_BASE}/secure/updateUser/${editData._id}`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ isActive: newStatus }),
                        }
                      );
                      if (!res.ok) throw new Error("Failed to update status");
                      await refreshUsers();
                    } catch {
                      alert("Failed to update user status");
                      setField({ isActive: !newStatus });
                    }
                  }
                }}
              />

              <div
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                  form.isActive ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    form.isActive ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </div>
            </label>
          </div>

          {/* Organization Fields */}
          {form.role === "ORG_HR" || form.role === "HELPER" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Organization
              </label>
              <select
                value={form.organizationId}
                onChange={(e) => setField({ organizationId: e.target.value })}
                className="border rounded-md px-3 py-2 text-sm w-full"
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
          ) : null}

          {form.role === "SUPER_ADMIN_HELPER" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accessible Organizations (Multi-select)
              </label>
              <div className="border rounded-md p-2 max-h-[180px] overflow-y-auto space-y-1">
                {organizations.map((org) => (
                  <label
                    key={org.organizationId}
                    className="flex items-center gap-2 text-sm text-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={form.accessibleOrganizations.includes(
                        org.organizationId
                      )}
                      onChange={() => toggleAccessibleOrg(org.organizationId)}
                    />
                    {org.organizationName}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {/* Permissions */}
          <div className="border rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Permissions</p>
              <button
                type="button"
                onClick={applyRoleDefaults}
                className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
              >
                Apply Role Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[220px] overflow-y-auto">
              {allPermissions.map((p) => (
                <label
                  key={p.key}
                  className="flex items-center gap-2 text-sm text-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(p.key)}
                    onChange={() => togglePermission(p.key)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {isEdit ? "Save Changes" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
