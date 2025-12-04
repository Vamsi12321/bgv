"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import {
  PlusCircle,
  Edit,
  X,
  Loader2,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

/* -------------------- API -------------------- */


/* -------------------- ALL PERMISSIONS -------------------- */
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

/* -------------------- ROLE PRESETS -------------------- */
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
  SUPER_ADMIN: [], // CANNOT BE EDITED
  SUPER_SPOC: [], // CANNOT BE EDITED
};

/* ============================================================
   SUCCESS / ERROR MESSAGE MODAL
============================================================ */
function MessageModal({ modal, onClose }) {
  if (!modal.show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 text-black">
      <div className="bg-white rounded-xl p-6 max-w-md w-full text-center shadow-xl">
        {modal.type === "error" ? (
          <AlertCircle size={48} className="mx-auto mb-3 text-red-500" />
        ) : (
          <CheckCircle size={48} className="mx-auto mb-3 text-green-600" />
        )}

        <h2 className="text-xl font-semibold mb-2">
          {modal.type === "error" ? "Operation Failed" : "Success"}
        </h2>

        <p className="mb-4 whitespace-pre-wrap">{modal.message}</p>

        <button
          onClick={onClose}
          className={`px-5 py-2.5 text-white rounded-lg ${
            modal.type === "error"
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   CONFIRMATION MODAL BEFORE ADDING / EDITING USERS
============================================================ */
function ConfirmModal({ confirm, onYes, onNo }) {
  if (!confirm.show) return null;

  const [loading, setLoading] = useState(false);

  const handleYes = async () => {
    setLoading(true);
    await onYes();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center px-4 text-black">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-3 text-[#ff004f]">
          Confirm Action
        </h2>

        {!loading ? (
          <>
            <p className="text-sm mb-4 leading-relaxed">
              Are you sure you want to{" "}
              <strong>{confirm.action === "add" ? "add" : "update"}</strong>{" "}
              this user with the selected permissions & role?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onNo}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleYes}
                className="px-4 py-2 rounded-lg bg-[#ff004f] text-white hover:bg-[#e60047]"
              >
                Yes, Confirm
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="animate-spin text-[#ff004f] mb-3" size={32} />
            <p className="text-sm font-medium text-gray-700">
              Saving… Please wait
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   USERS PAGE
============================================================ */
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("All");
  const [filterOrgId, setFilterOrgId] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [modal, setModal] = useState({
    show: false,
    type: "error",
    message: "",
  });

  const [confirm, setConfirm] = useState({
    show: false,
    action: null,
    payload: null,
    userId: null,
    mode: null,
  });

  const [showOrgFilterMenu, setShowOrgFilterMenu] = useState(false);
  const [orgSearchFilter, setOrgSearchFilter] = useState("");

  /* Show error & success */
  const showError = (msg) =>
    setModal({ show: true, type: "error", message: msg });

  const showSuccess = (msg) =>
    setModal({ show: true, type: "success", message: msg });

  const closeModal = () =>
    setModal({ show: false, type: "error", message: "" });

  /* Load from cache (after hydration) */
  useEffect(() => {
    try {
      const cachedUsers = localStorage.getItem("users_cache");
      const cachedOrgs = localStorage.getItem("orgs_cache_userspage");

      if (cachedUsers) setUsers(JSON.parse(cachedUsers));
      if (cachedOrgs) setOrganizations(JSON.parse(cachedOrgs));
    } catch {}
  }, []);
  /* Get logged-in user's role */
  const currentUserRole =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("bgvUser"))?.role
      : null;

  /* Build allowed role list based on rules */
  const getAllowedRoles = () => {
    if (!currentUserRole) return ["HELPER", "ORG_HR"];

    switch (currentUserRole) {
      case "SUPER_SPOC":
        return [
          "SUPER_ADMIN",
          "SUPER_SPOC",
          "SUPER_ADMIN_HELPER",
          "ORG_HR",
          "HELPER",
        ];

      case "SUPER_ADMIN":
        return ["SUPER_ADMIN_HELPER", "ORG_HR", "HELPER"];

      case "SUPER_ADMIN_HELPER":
        return ["ORG_HR", "HELPER"];

      default:
        return ["HELPER"]; // fallback
    }
  };

  const allowedRoles = getAllowedRoles();

  /* Normalize org structure */
  const normalizedOrgs = useMemo(
    () =>
      (organizations || []).map((o) => ({
        organizationId: o.organizationId || o._id || o.id,
        organizationName: o.organizationName || o.name || "Unnamed Org",
      })),
    [organizations]
  );

  /* Fetch users + orgs */
  const fetchAll = async () => {
    try {
      const [uRes, oRes] = await Promise.all([
        fetch(`/api/proxy/secure/getUsers`, { credentials: "include" }),
        fetch(`/api/proxy/secure/getOrganizations`, {
          credentials: "include",
        }),
      ]);

      const [uData, oData] = await Promise.all([uRes.json(), oRes.json()]);

      if (!uRes.ok) return showError(uData.detail || uData.message);
      if (!oRes.ok) return showError(oData.detail || oData.message);

      setUsers(uData.users || []);
      setOrganizations(oData.organizations || []);

      localStorage.setItem("users_cache", JSON.stringify(uData.users));
      localStorage.setItem(
        "orgs_cache_userspage",
        JSON.stringify(oData.organizations)
      );
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* Fetch users only */
  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/proxy/secure/getUsers`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) return showError(data.detail || data.message);

      setUsers(data.users || []);
      localStorage.setItem("users_cache", JSON.stringify(data.users));
    } catch (e) {
      showError(e.message);
    }
  };

  /* Add/Edit User API Handler */
  const handleSaveUser = async (payload, mode, userId) => {
    setConfirm({
      show: true,
      action: mode === "edit" ? "edit" : "add",
      payload,
      userId,
      mode,
    });
  };

  /* ---------------- CONFIRMATION YES ---------------- */
  const confirmYes = async () => {
    const { payload, mode, userId } = confirm;

    try {
      let url = `/api/proxy/secure/addHelper`;
      let method = "POST";

      if (mode === "edit") {
        url = `/api/proxy/secure/updateUser/${userId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setConfirm((c) => ({ ...c, show: false }));
        return showError(data.detail || data.message);
      }

      // SUCCESS → close confirm modal
      setConfirm((c) => ({ ...c, show: false }));

      // ⭐ CLOSE MAIN MODAL PROPERLY ⭐
      setShowModal(false);
      setEditUser(null);

      showSuccess(
        mode === "edit"
          ? "User Updated Successfully!"
          : "User Created Successfully!"
      );

      fetchUsers();
    } catch (e) {
      setConfirm((c) => ({ ...c, show: false }));
      showError(e.message);
    }
  };

  const confirmNo = () =>
    setConfirm({ show: false, payload: null, mode: null, userId: null });

  /* ---------------- FILTERED USERS ---------------- */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const byRole = filterRole === "All" ? true : u.role === filterRole;
      const byOrg =
        filterOrgId === "All"
          ? true
          : u.organizationId === filterOrgId ||
            (u.accessibleOrganizations || []).includes(filterOrgId);

      return byRole && byOrg;
    });
  }, [users, filterRole, filterOrgId]);

  /* Lock scroll when modal open */
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
  }, [showModal]);

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen space-y-6 text-black">
      {/* SUCCESS & ERROR MODALS */}
      <MessageModal modal={modal} onClose={closeModal} />

      {/* CONFIRMATION MODAL */}
      <ConfirmModal confirm={confirm} onYes={confirmYes} onNo={confirmNo} />

      {/* ----- PAGE HEADER ----- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-[#ff004f]">Users & Roles</h1>

        <button
          onClick={() => {
            setEditUser(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#ff004f] text-white px-5 py-2.5 rounded-lg hover:bg-[#e60047] shadow-md w-full sm:w-auto"
        >
          <PlusCircle size={18} />
          Add User
        </button>
      </div>

      {/* -------- FILTERS -------- */}
      {/* -------- FILTERS -------- */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* 🔥 Improved Role Dropdown */}
        <div className="w-full sm:w-60">
          <label className="text-sm font-semibold text-gray-700 mb-1 block">
            Filter by Role
          </label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border px-4 py-2 rounded-xl bg-gray-50 text-sm w-full shadow-sm 
  focus:ring-2 focus:ring-[#ff004f] transition"
          >
            <option value="All">All Roles</option>
            <option value="HELPER">Organization Helper</option>
            <option value="ORG_HR">Organization HR</option>
            <option value="SUPER_ADMIN_HELPER">Super Admin Helper</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="SUPER_SPOC">Super SPOC</option>
          </select>
        </div>

        {/* 🔥 Searchable Organization Dropdown */}
        <div className="w-full sm:w-72 relative">
          <label className="text-sm font-semibold text-gray-700 mb-1 block">
            Filter by Organization
          </label>

          <div
            className="border px-4 py-2 rounded-xl bg-gray-50 shadow-sm cursor-pointer
        flex justify-between items-center focus:ring-2 focus:ring-[#ff004f]"
            onClick={() => setShowOrgFilterMenu(!showOrgFilterMenu)}
          >
            <span className="text-sm">
              {normalizedOrgs.find((o) => o.organizationId === filterOrgId)
                ?.organizationName || "All Organizations"}
            </span>
            <span className="text-gray-500">▾</span>
          </div>

          {/* Dropdown */}
          {showOrgFilterMenu && (
            <div
              className="absolute left-0 right-0 bg-white border rounded-xl shadow-xl 
        mt-2 z-30 max-h-72 overflow-y-auto animate-fadeIn"
            >
              {/* Search Box */}
              <div className="p-2 sticky top-0 bg-white border-b">
                <input
                  type="text"
                  placeholder="Search organization..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 
              focus:ring-[#ff004f]"
                  value={orgSearchFilter}
                  onChange={(e) => setOrgSearchFilter(e.target.value)}
                />
              </div>

              {/* All */}
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  setFilterOrgId("All");
                  setShowOrgFilterMenu(false);
                }}
              >
                🌐 All Organizations
              </div>

              {/* Filtered orgs */}
              {normalizedOrgs
                .filter((o) =>
                  o.organizationName
                    .toLowerCase()
                    .includes(orgSearchFilter.toLowerCase())
                )
                .map((org) => (
                  <div
                    key={org.organizationId}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => {
                      setFilterOrgId(org.organizationId);
                      setShowOrgFilterMenu(false);
                    }}
                  >
                    🏢 {org.organizationName}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------ LOADING ------------------ */}
      {loading && users.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-[#ff004f]">
          <Loader2 className="animate-spin" size={28} /> Loading...
        </div>
      ) : (
        <>
          {/* ------------------ DESKTOP TABLE ------------------ */}
          <div className="hidden md:block bg-white rounded-xl shadow border border-gray-200 overflow-x-auto text-black">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#ffeef3] text-[#ff004f] uppercase text-xs">
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
                      className={`border-t transition text-black
    ${
      u.role === "SUPER_ADMIN" || u.role === "SUPER_SPOC" || u.role === "SPOC"
        ? "bg-gray-50 cursor-not-allowed hover:bg-gray-100"
        : "hover:bg-[#ffeff3] cursor-pointer"
    }
  `}
                    >
                      <td className="p-3 font-medium">{u.userName}</td>
                      <td className="p-3">{u.email}</td>

                      <td className="p-3">
                        {u.role === "HELPER"
                          ? "Organization Helper"
                          : u.role === "ORG_HR"
                          ? "Organization HR"
                          : u.role === "SUPER_ADMIN_HELPER"
                          ? "Super Admin Helper"
                          : u.role === "SUPER_ADMIN"
                          ? "Super Admin (Locked)"
                          : u.role === "SUPER_SPOC"
                          ? "Super SPOC (Locked)"
                          : u.role}
                      </td>

                      <td className="p-3">
                        {u.organizationName ||
                          (u.role === "SUPER_ADMIN_HELPER" ? "Multiple" : "—")}
                      </td>

                      <td className="p-3 flex justify-center">
                        {(u.role === "SUPER_ADMIN" ||
                          u.role === "SUPER_SPOC" ||
                          u.role === "SPOC") && (
                          <span className="text-gray-400 text-xs">
                            Cannot Edit
                          </span>
                        )}

                        {u.role !== "SUPER_ADMIN" &&
                          u.role !== "SUPER_SPOC" &&
                          u.role !== "SPOC" && (
                            <button
                              onClick={() => {
                                setEditUser(u);
                                setShowModal(true);
                              }}
                              className="p-2 rounded hover:bg-[#ffeff3] text-[#ff004f] transition"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="p-4 text-black/70 italic text-center"
                      colSpan="5"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ------------------ MOBILE CARDS ------------------ */}
          <div className="grid md:hidden gap-4 text-black">
            {filteredUsers.map((u) => (
              <div
                key={u._id}
                className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#ff004f]/10 p-2 rounded-full">
                      <User className="text-[#ff004f]" size={20} />
                    </div>

                    <div>
                      <p className="font-semibold">{u.userName}</p>
                      <p className="text-sm">{u.email}</p>
                    </div>
                  </div>

                  {u.role !== "SUPER_ADMIN" && u.role !== "SUPER_SPOC" && (
                    <button
                      onClick={() => {
                        setEditUser(u);
                        setShowModal(true);
                      }}
                      className="p-1 text-[#ff004f] hover:bg-[#ffeff3] rounded"
                    >
                      <Edit size={16} />
                    </button>
                  )}

                  {(u.role === "SUPER_ADMIN" ||
                    u.role === "SUPER_SPOC" ||
                    u.role === "SPOC") && (
                    <span className="text-gray-400 text-xs">Locked</span>
                  )}
                </div>

                <p className="text-sm">
                  <strong>Role:</strong>{" "}
                  {u.role === "HELPER"
                    ? "Organization Helper"
                    : u.role === "ORG_HR"
                    ? "Organization HR"
                    : u.role === "SUPER_ADMIN_HELPER"
                    ? "Super Admin Helper"
                    : u.role === "SUPER_ADMIN"
                    ? "Super Admin (Locked)"
                    : u.role === "SUPER_SPOC"
                    ? "Super SPOC (Locked)"
                    : u.role}
                </p>

                <p className="text-sm">
                  <strong>Organization:</strong>{" "}
                  {u.organizationName ||
                    (u.role === "SUPER_ADMIN_HELPER" ? "Multiple" : "—")}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---- ADD/EDIT MODAL ---- */}
      {showModal && (
        <AddEditUserModal
          onClose={() => {
            setShowModal(false);
            setEditUser(null);
          }}
          onSave={handleSaveUser}
          editData={editUser}
          organizations={normalizedOrgs}
          allPermissions={allPermissions}
          rolePermissionPresets={rolePermissionPresets}
          currentUserRole={currentUserRole}
        />
      )}
    </div>
  );
}
/* ============================================================
   ADD / EDIT USER MODAL (FULL ENHANCED VERSION)
============================================================ */
function AddEditUserModal({
  onClose,
  onSave,
  editData,
  organizations,
  allPermissions,
  rolePermissionPresets,
  currentUserRole,
}) {
  const isEdit = !!editData;
  const isLockedRole =
    editData?.role === "SUPER_ADMIN" ||
    editData?.role === "SUPER_SPOC" ||
    editData?.role === "SPOC";

  const initialRole = editData?.role || "HELPER";

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showOrgModalMenu, setShowOrgModalMenu] = useState(false);
  const [orgSearchModal, setOrgSearchModal] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /* -------------------- VALIDATION -------------------- */
  const validateField = (key, value) => {
    let msg = "";

    if (key === "userName") {
      if (!value.trim() || value.trim().length < 3)
        msg = "Full Name must be at least 3 characters.";
    }

    if (key === "email") {
      const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!reg.test(value)) msg = "Enter a valid email address.";
    }

    if (key === "phoneNumber") {
      if (value.length !== 10) msg = "Phone number must be exactly 10 digits.";
    }

    if (key === "organizationId") {
      if (!value.trim()) msg = "Please select an organization.";
    }

    setErrors((prev) => ({ ...prev, [key]: msg }));
    return msg === "";
  };

  /* -------------------- FORM STATE -------------------- */
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
        : rolePermissionPresets[initialRole] || [],

    isActive:
      typeof editData?.isActive === "boolean" ? editData.isActive : true,

    password: "Welcome1",
  });

  const setField = (patch) => setForm((p) => ({ ...p, ...patch }));

  const isHelper = form.role === "HELPER";
  const isOrgHR = form.role === "ORG_HR";
  const isSuperHelper = form.role === "SUPER_ADMIN_HELPER";

  /* -------------------- PERMISSION TOGGLE -------------------- */
  const togglePermission = (perm) => {
    if (isHelper) return;
    setField({
      permissions: form.permissions.includes(perm)
        ? form.permissions.filter((p) => p !== perm)
        : [...form.permissions, perm],
    });
  };

  /* -------------------- SUBMIT HANDLER -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const required = ["userName", "email", "phoneNumber"];
    if (isHelper || isOrgHR) required.push("organizationId");

    let allValid = true;
    required.forEach((f) => {
      if (!validateField(f, form[f])) allValid = false;
    });

    if (!allValid) return;

    const payload = {
      userName: form.userName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      role: form.role,
      isActive: form.isActive,
      password: "Welcome1",
    };

    if (isSuperHelper) {
      payload.accessibleOrganizations = form.accessibleOrganizations;
      payload.permissions = form.permissions;
    } else {
      payload.organizationId = form.organizationId;
      payload.permissions = isHelper
        ? rolePermissionPresets.HELPER
        : form.permissions;
    }

    setSaving(true);

    // ❌ DO NOT CLOSE MODAL HERE
    // onClose();

    // ⬇ Only trigger confirmation modal
    await onSave(payload, isEdit ? "edit" : "add", editData?._id);

    setSaving(false);
  };

  // Detect unsaved changes
  useEffect(() => {
    if (!editData) return; // for add mode, changes always allowed
    const edited = {
      userName: editData.userName || "",
      email: editData.email || "",
      phoneNumber: editData.phoneNumber || "",
      role: editData.role,
      organizationId: editData.organizationId || "",
      permissions: editData.permissions || [],
      isActive: editData.isActive,
    };

    const current = {
      userName: form.userName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      role: form.role,
      organizationId: form.organizationId,
      permissions: form.permissions,
      isActive: form.isActive,
    };

    setHasChanges(JSON.stringify(edited) !== JSON.stringify(current));
  }, [form, editData]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh] text-black">
        {/* Close Button */}
        <button
          onClick={() => {
            if (hasChanges) setConfirmClose(true);
            else onClose();
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-[#ff004f]"
        >
          <X size={22} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-[#ff004f] mb-5 text-center">
          {isEdit ? "Edit User" : "Add New User"}
        </h2>

        {/* LOCKED MESSAGE */}
        {isLockedRole && (
          <p className="text-center text-red-600 font-medium mb-3">
            This user role cannot be modified.
          </p>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NAME + EMAIL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NAME */}
            <div>
              <input
                placeholder="Full Name"
                disabled={isLockedRole}
                value={form.userName}
                onChange={(e) => {
                  setField({ userName: e.target.value });
                  validateField("userName", e.target.value);
                }}
                className={`border p-3 rounded-lg text-sm w-full focus:ring-2 ${
                  errors.userName
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-[#ff004f]"
                }`}
              />
              {errors.userName && (
                <p className="text-xs text-red-500 mt-1">{errors.userName}</p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <input
                type="email"
                disabled={isLockedRole}
                placeholder="Email"
                value={form.email}
                onChange={(e) => {
                  setField({ email: e.target.value });
                  validateField("email", e.target.value);
                }}
                className={`border p-3 rounded-lg text-sm w-full focus:ring-2 ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-[#ff004f]"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* PHONE + PASSWORD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PHONE */}
            <div>
              <input
                type="tel"
                disabled={isLockedRole}
                placeholder="Phone Number (10 digits)"
                maxLength={10}
                value={form.phoneNumber}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, "");
                  setField({ phoneNumber: cleaned });
                  validateField("phoneNumber", cleaned);
                }}
                className={`border p-3 rounded-lg text-sm w-full focus:ring-2 ${
                  errors.phoneNumber
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-[#ff004f]"
                }`}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* PASSWORD (DISABLED) */}
            <input
              value="Welcome1"
              disabled
              className="border p-3 rounded-lg text-sm bg-gray-100 text-black/60 cursor-not-allowed"
            />
          </div>

          {/* ROLE SELECT */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              disabled={isLockedRole}
              value={form.role}
              onChange={(e) => {
                const newRole = e.target.value;
                setField({
                  role: newRole,
                  permissions: rolePermissionPresets[newRole] || [],
                });
              }}
              className="border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-[#ff004f]"
            >
              <option value="HELPER">Organization Helper</option>
              <option value="ORG_HR">Organization HR</option>

              {/* SUPER_SPOC can create SUPER_ADMIN */}
              {currentUserRole === "SUPER_SPOC" && (
                <option value="SUPER_ADMIN">Super Admin</option>
              )}

              {/* SUPER_SPOC and SUPER_ADMIN can create SUPER_ADMIN_HELPER */}
              {(currentUserRole === "SUPER_SPOC" ||
                currentUserRole === "SUPER_ADMIN") && (
                <option value="SUPER_ADMIN_HELPER">Super Admin Helper</option>
              )}
            </select>

            {/* ACTIVE SWITCH (GREEN) */}
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <span
                className={form.isActive ? "text-green-600" : "text-red-500"}
              >
                {form.isActive ? "Active" : "Inactive"}
              </span>

              <input
                type="checkbox"
                disabled={isLockedRole}
                className="sr-only"
                checked={form.isActive}
                onChange={(e) => setField({ isActive: e.target.checked })}
              />

              <div
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                  form.isActive ? "bg-green-500" : "bg-red-400"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 bg-white rounded-full transform transition ${
                    form.isActive ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </div>
            </label>
          </div>

          {/* ORG SELECT */}
          {(isHelper || isOrgHR) && (
            <div>
              {/* 🔥 Searchable Organization Dropdown */}
              <div className="relative">
                <div
                  className={`border px-3 py-2 rounded-lg text-sm bg-white cursor-pointer shadow-sm flex justify-between items-center
      ${errors.organizationId ? "border-red-500" : ""}
    `}
                  onClick={() => setShowOrgModalMenu(!showOrgModalMenu)}
                >
                  <span>
                    {organizations.find(
                      (o) => o.organizationId === form.organizationId
                    )?.organizationName || "Select organization"}
                  </span>
                  <span className="text-gray-500">▾</span>
                </div>

                {/* Dropdown */}
                {showOrgModalMenu && (
                  <div className="absolute left-0 right-0 bg-white border rounded-xl shadow-xl mt-2 z-[100] max-h-64 overflow-y-auto">
                    {/* Search box */}
                    <div className="p-2 sticky top-0 bg-white border-b">
                      <input
                        type="text"
                        placeholder="Search organization..."
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#ff004f]"
                        value={orgSearchModal}
                        onChange={(e) => setOrgSearchModal(e.target.value)}
                      />
                    </div>

                    {/* Filtered results */}
                    {organizations
                      .filter((org) =>
                        org.organizationName
                          .toLowerCase()
                          .includes(orgSearchModal.toLowerCase())
                      )
                      .map((org) => (
                        <div
                          key={org.organizationId}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => {
                            setField({ organizationId: org.organizationId });
                            validateField("organizationId", org.organizationId);
                            setShowOrgModalMenu(false);
                          }}
                        >
                          🏢 {org.organizationName}
                        </div>
                      ))}
                  </div>
                )}

                {errors.organizationId && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.organizationId}
                  </p>
                )}
              </div>

              {errors.organizationId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.organizationId}
                </p>
              )}
            </div>
          )}

          {/* SUPER HELPER — MULTIPLE ORGANIZATIONS */}
          {isSuperHelper && (
            <div>
              <label className="text-sm font-semibold block mb-1">
                Accessible Organizations
              </label>
              <div className="border rounded-lg bg-gray-50 p-3 max-h-40 overflow-y-auto space-y-2">
                {organizations.map((org) => (
                  <label
                    key={org.organizationId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      disabled={isLockedRole}
                      checked={form.accessibleOrganizations.includes(
                        org.organizationId
                      )}
                      className="accent-[#ff004f]"
                      onChange={() => {
                        const exists = form.accessibleOrganizations.includes(
                          org.organizationId
                        );

                        setField({
                          accessibleOrganizations: exists
                            ? form.accessibleOrganizations.filter(
                                (id) => id !== org.organizationId
                              )
                            : [
                                ...form.accessibleOrganizations,
                                org.organizationId,
                              ],
                        });
                      }}
                    />
                    {org.organizationName}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* PERMISSIONS */}
          <div>
            <label className="text-sm font-semibold mb-1 block">
              Permissions
            </label>

            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-3 max-h-60 overflow-y-auto ${
                isHelper ? "bg-gray-100 opacity-70" : "bg-gray-50"
              }`}
            >
              {allPermissions.map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    disabled={isHelper || isLockedRole}
                    checked={form.permissions.includes(perm.key)}
                    className="accent-[#ff004f]"
                    onChange={() => togglePermission(perm.key)}
                  />
                  {perm.label}
                </label>
              ))}
            </div>

            {isHelper && (
              <p className="text-xs text-gray-500 italic mt-1">
                Helper permissions are fixed.
              </p>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                if (hasChanges) setConfirmClose(true);
                else onClose();
              }}
              className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || isLockedRole}
              className={`px-5 py-2 rounded-lg flex items-center gap-2 text-white font-medium shadow
                ${
                  saving
                    ? "bg-[#ff004f]/60 cursor-not-allowed"
                    : "bg-[#ff004f] hover:bg-[#e60047]"
                }
                ${isLockedRole ? "cursor-not-allowed opacity-50" : ""}
              `}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update User"
              ) : (
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
      {/* CONFIRM UNSAVED CHANGES MODAL */}
      {confirmClose && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center px-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-lg text-center">
            <h2 className="text-lg font-semibold text-[#ff004f] mb-3">
              Unsaved Changes
            </h2>
            <p className="text-sm mb-4">
              You have unsaved changes. Are you sure you want to close this
              form?
            </p>

            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => setConfirmClose(false)}
                className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200"
              >
                No, Continue Editing
              </button>

              <button
                onClick={() => {
                  setConfirmClose(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-[#ff004f] text-white hover:bg-[#e60047]"
              >
                Yes, Close Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
