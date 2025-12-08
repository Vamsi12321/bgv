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
  SUPER_ADMIN: allPermissions.map((p) => p.key), // Full permissions
  SUPER_SPOC: allPermissions.map((p) => p.key), // Full permissions
};

/* ============================================================
   SUCCESS / ERROR MESSAGE MODAL
============================================================ */
function MessageModal({ modal, onClose }) {
  if (!modal.show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-[90%] text-center transform animate-in slide-in-from-bottom-4 duration-300">
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
          modal.type === "error" ? "bg-red-100" : "bg-green-100"
        }`}>
          {modal.type === "error" ? (
            <AlertCircle size={40} className="text-red-600 animate-pulse" />
          ) : (
            <CheckCircle size={40} className="text-green-600 animate-bounce" />
          )}
        </div>

        <h2 className="text-2xl font-bold mb-3 text-gray-900">
          {modal.type === "error" ? "⚠️ Operation Failed" : "✅ Success!"}
        </h2>

        <p className="text-gray-600 mb-6 leading-relaxed whitespace-pre-wrap">{modal.message}</p>

        <button
          onClick={onClose}
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
  const [filterStatus, setFilterStatus] = useState("All"); // Active/Inactive filter
  const [searchUsername, setSearchUsername] = useState(""); // Username search

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
  /* Get logged-in user's role and ID */
  const currentUserRole =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("bgvUser"))?.role
      : null;
  
  const currentUserId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("bgvUser"))?._id
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
      
      const byStatus = 
        filterStatus === "All" 
          ? true 
          : filterStatus === "Active" 
            ? u.isActive === true 
            : u.isActive === false;

      const byUsername = 
        searchUsername.trim() === ""
          ? true
          : (u.userName || "").toLowerCase().includes(searchUsername.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(searchUsername.toLowerCase());

      return byRole && byOrg && byStatus && byUsername;
    });
  }, [users, filterRole, filterOrgId, filterStatus, searchUsername]);

  /* Lock scroll when modal open */
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
  }, [showModal]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 text-black">
      {/* SUCCESS & ERROR MODALS */}
      <MessageModal modal={modal} onClose={closeModal} />

      {/* CONFIRMATION MODAL */}
      <ConfirmModal confirm={confirm} onYes={confirmYes} onNo={confirmNo} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User size={24} className="text-[#ff004f]" />
            Users & Roles
          </h1>
          <p className="text-gray-600 text-sm mt-1">Manage user accounts and permissions</p>
        </div>

        <button
          onClick={() => {
            setEditUser(null);
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold w-full sm:w-auto shadow transition-all hover:shadow-lg bg-[#ff004f] hover:bg-[#e60047]"
        >
          <PlusCircle size={18} />
          <span>Add User</span>
        </button>
      </div>

      {/* -------- SUPERB ENHANCED FILTERS -------- */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white p-6 rounded-2xl shadow-xl border border-gray-200 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-[#ff004f]/10 to-[#ff3366]/10 rounded-lg">
            <svg className="w-5 h-5 text-[#ff004f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Filter Users</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* 🔥 Username Search */}
          <div className="w-full sm:flex-1">
            <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Search by Username/Email
            </label>
            <input
              type="text"
              placeholder="🔍 Search username or email..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="border-2 border-gray-200 px-4 py-3 rounded-xl bg-white text-sm w-full shadow-sm 
    focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all hover:border-[#ff004f]/50"
            />
          </div>

          {/* 🔥 Improved Role Dropdown */}
          <div className="w-full sm:w-64">
            <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ff004f] rounded-full"></span>
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border-2 border-gray-200 px-4 py-3 rounded-xl bg-white text-sm w-full shadow-sm 
    focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all hover:border-[#ff004f]/50"
            >
              <option value="All">🌐 All Roles</option>
              <option value="HELPER">👤 Organization Helper</option>
              <option value="ORG_HR">👔 Organization HR</option>
              <option value="SUPER_ADMIN_HELPER">⚡ Super Admin Helper</option>
              <option value="SUPER_ADMIN">🔐 Super Admin</option>
              <option value="SUPER_SPOC">👑 Super SPOC</option>
            </select>
          </div>

          {/* 🔥 Status Filter (Active/Inactive) */}
          <div className="w-full sm:w-48">
            <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-2 border-gray-200 px-4 py-3 rounded-xl bg-white text-sm w-full shadow-sm 
    focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all hover:border-[#ff004f]/50"
            >
              <option value="All">🌐 All Status</option>
              <option value="Active">✅ Active</option>
              <option value="Inactive">❌ Inactive</option>
            </select>
          </div>

          {/* 🔥 Searchable Organization Dropdown */}
          <div className="w-full sm:w-80 relative">
            <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ff3366] rounded-full"></span>
              Filter by Organization
            </label>

            <div
              className="border-2 border-gray-200 px-4 py-3 rounded-xl bg-white shadow-sm cursor-pointer
          flex justify-between items-center hover:border-[#ff004f]/50 transition-all"
              onClick={() => setShowOrgFilterMenu(!showOrgFilterMenu)}
            >
              <span className="text-sm font-medium text-gray-700">
                {normalizedOrgs.find((o) => o.organizationId === filterOrgId)
                  ?.organizationName || "🌐 All Organizations"}
              </span>
              <span className="text-gray-400 text-lg">▾</span>
            </div>

            {/* Dropdown */}
            {showOrgFilterMenu && (
              <div
                className="absolute left-0 right-0 bg-white border-2 border-[#ff004f]/20 rounded-xl shadow-2xl 
          mt-2 z-30 max-h-80 overflow-hidden animate-in slide-in-from-top-2 duration-200"
              >
                {/* Search Box */}
                <div className="p-3 sticky top-0 bg-gradient-to-r from-[#ff004f]/5 to-[#ff3366]/5 border-b-2 border-gray-100">
                  <input
                    type="text"
                    placeholder="🔍 Search organization..."
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 
                focus:ring-[#ff004f] focus:border-[#ff004f] transition-all"
                    value={orgSearchFilter}
                    onChange={(e) => setOrgSearchFilter(e.target.value)}
                  />
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {/* All */}
                  <div
                    className="px-4 py-3 hover:bg-gradient-to-r hover:from-[#ff004f]/10 hover:to-[#ff3366]/10 cursor-pointer text-sm font-medium transition-all border-b border-gray-100"
                    onClick={() => {
                      setFilterOrgId("All");
                      setShowOrgFilterMenu(false);
                      setOrgSearchFilter("");
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
                        className="px-4 py-3 hover:bg-gradient-to-r hover:from-[#ff004f]/10 hover:to-[#ff3366]/10 cursor-pointer text-sm transition-all border-b border-gray-50 last:border-0"
                        onClick={() => {
                          setFilterOrgId(org.organizationId);
                          setShowOrgFilterMenu(false);
                          setOrgSearchFilter("");
                        }}
                      >
                        🏢 {org.organizationName}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------ LOADING ------------------ */}
      {loading && users.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-[#ff004f]">
          <Loader2 className="animate-spin" size={28} /> Loading...
        </div>
      ) : (
        <>
          {/* ------------------ SUPERB DESKTOP TABLE ------------------ */}
          <div className="hidden md:block bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden text-black">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 uppercase text-xs tracking-wide">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-700">👤 Name</th>
                  <th className="p-4 text-left font-semibold text-gray-700">✉️ Email</th>
                  <th className="p-4 text-left font-semibold text-gray-700">🎭 Role</th>
                  <th className="p-4 text-left font-semibold text-gray-700">🏢 Organization</th>
                  <th className="p-4 text-center font-semibold text-gray-700">📊 Status</th>
                  <th className="p-4 text-center font-semibold text-gray-700">⚙️ Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length ? (
                  filteredUsers.map((u, idx) => (
                    <tr
                      key={u._id}
                      className={`transition-all text-black group
    ${
      (u.role === "SUPER_ADMIN" || u.role === "SUPER_SPOC" || u.role === "SPOC") &&
      currentUserRole !== "SUPER_ADMIN" &&
      currentUserRole !== "SUPER_SPOC"
        ? "bg-gray-50/50 cursor-not-allowed hover:bg-gray-100/50"
        : "hover:bg-gradient-to-r hover:from-[#fff5f8] hover:to-[#fff0f5] cursor-pointer hover:shadow-md"
    }
    ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
  `}
                    >
                      <td className="p-4 font-semibold text-gray-800 group-hover:text-[#ff004f] transition-colors">
                        {u.userName}
                      </td>
                      <td className="p-4 text-gray-600">{u.email}</td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                          u.role === "HELPER"
                            ? "bg-blue-100 text-blue-700"
                            : u.role === "ORG_HR"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "SUPER_ADMIN_HELPER"
                            ? "bg-orange-100 text-orange-700"
                            : u.role === "SUPER_ADMIN"
                            ? "bg-red-100 text-red-700"
                            : u.role === "SUPER_SPOC"
                            ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {u.role === "HELPER"
                            ? "👤 Org Helper"
                            : u.role === "ORG_HR"
                            ? "👔 Org HR"
                            : u.role === "SUPER_ADMIN_HELPER"
                            ? "⚡ SA Helper"
                            : u.role === "SUPER_ADMIN"
                            ? "🔐 Super Admin"
                            : u.role === "SUPER_SPOC"
                            ? "👑 Super SPOC"
                            : u.role}
                        </span>
                      </td>

                      <td className="p-4 text-gray-600">
                        {u.organizationName ||
                          (u.role === "SUPER_ADMIN_HELPER" ? "🌐 Multiple" : "—")}
                      </td>

                      <td className="p-4">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                            u.isActive 
                              ? "bg-green-100 text-green-700" 
                              : "bg-red-100 text-red-700"
                          }`}>
                            {u.isActive ? "✅ Active" : "❌ Inactive"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-center">
                          {/* Show locked if user is editing themselves */}
                          {u._id === currentUserId && (
                            <span className="text-blue-400 text-xs font-medium px-3 py-1 bg-blue-50 rounded-full">
                              👤 You
                            </span>
                          )}
                          
                          {/* Show edit button if not editing self and has permission */}
                          {u._id !== currentUserId &&
                            (currentUserRole === "SUPER_SPOC" || currentUserRole === "SUPER_ADMIN") && (
                              <button
                                onClick={() => {
                                  setEditUser(u);
                                  setShowModal(true);
                                }}
                                className="p-2.5 rounded-lg hover:bg-gradient-to-r hover:from-[#ff004f] hover:to-[#ff3366] text-[#ff004f] hover:text-white transition-all transform hover:scale-110 shadow-sm hover:shadow-lg"
                                title="Edit User"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                          
                          {/* Show locked for users who cannot edit */}
                          {u._id !== currentUserId &&
                            (currentUserRole !== "SUPER_ADMIN" && currentUserRole !== "SUPER_SPOC") && (
                            <span className="text-gray-400 text-xs font-medium px-3 py-1 bg-gray-100 rounded-full">
                              🔒 Locked
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="p-8 text-center"
                      colSpan="5"
                    >
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <User size={48} className="opacity-30" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ------------------ SUPERB MOBILE CARDS ------------------ */}
          <div className="grid md:hidden gap-4 text-black">
            {filteredUsers.length ? (
              filteredUsers.map((u) => (
                <div
                  key={u._id}
                  className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-gradient-to-br from-[#ff004f] to-[#ff3366] p-3 rounded-xl shadow-md">
                        <User className="text-white" size={22} />
                      </div>

                      <div className="flex-1">
                        <p className="font-bold text-lg text-gray-800">{u.userName}</p>
                        <p className="text-sm text-gray-600 mt-0.5">✉️ {u.email}</p>
                      </div>
                    </div>

                    {/* SUPER_SPOC can edit all, SUPER_ADMIN can edit all except SUPER_SPOC */}
                    {u._id !== currentUserId && 
                     (currentUserRole === "SUPER_SPOC" || currentUserRole === "SUPER_ADMIN") && (
                      <button
                        onClick={() => {
                          setEditUser(u);
                          setShowModal(true);
                        }}
                        className="p-2.5 text-white bg-gradient-to-r from-[#ff004f] to-[#ff3366] hover:from-[#e60047] hover:to-[#e6005f] rounded-lg transition-all transform hover:scale-110 shadow-md"
                      >
                        <Edit size={18} />
                      </button>
                    )}

                    {/* Show locked for users who cannot edit */}
                    {u._id !== currentUserId && 
                     (currentUserRole !== "SUPER_ADMIN" && currentUserRole !== "SUPER_SPOC") && (
                      <span className="text-gray-400 text-xs font-medium px-3 py-1.5 bg-gray-100 rounded-full">
                        🔒 Locked
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600">Role:</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        u.role === "HELPER"
                          ? "bg-blue-100 text-blue-700"
                          : u.role === "ORG_HR"
                          ? "bg-purple-100 text-purple-700"
                          : u.role === "SUPER_ADMIN_HELPER"
                          ? "bg-orange-100 text-orange-700"
                          : u.role === "SUPER_ADMIN"
                          ? "bg-red-100 text-red-700"
                          : u.role === "SUPER_SPOC"
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {u.role === "HELPER"
                          ? "👤 Org Helper"
                          : u.role === "ORG_HR"
                          ? "👔 Org HR"
                          : u.role === "SUPER_ADMIN_HELPER"
                          ? "⚡ SA Helper"
                          : u.role === "SUPER_ADMIN"
                          ? "🔐 Super Admin"
                          : u.role === "SUPER_SPOC"
                          ? "👑 Super SPOC"
                          : u.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600">Organization:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {u.organizationName ||
                          (u.role === "SUPER_ADMIN_HELPER" ? "🌐 Multiple" : "—")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600">Status:</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        u.isActive 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {u.isActive ? "✅ Active" : "❌ Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center">
                <User size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-lg font-semibold text-gray-600">No users found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
              </div>
            )}
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
  
  // Only lock if current user doesn't have permission to edit this role
  const isLockedRole = false; // SUPER_ADMIN and SUPER_SPOC can edit all roles now

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

  /* -------------------- AUTO-SELECT ALL FOR SUPER_ADMIN AND SUPER_SPOC (ONLY ON ROLE CHANGE, NOT ON EDIT) -------------------- */
  useEffect(() => {
    // Only auto-select if role changed and not in edit mode with existing permissions
    if (form.role === "SUPER_ADMIN" || form.role === "SUPER_SPOC") {
      // Skip auto-selection if we're editing and already have permissions
      if (isEdit && editData?.permissions?.length > 0 && form.role === editData.role) {
        return; // Don't override existing permissions when editing
      }
      
      // Pre-check all organizations
      const allOrgIds = organizations.map(o => o.organizationId);
      // Pre-check all permissions
      const allPerms = allPermissions.map(p => p.key);
      
      setField({
        accessibleOrganizations: allOrgIds,
        permissions: allPerms,
      });
    }
  }, [form.role]);

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

    if (isSuperHelper || form.role === "SUPER_ADMIN" || form.role === "SUPER_SPOC") {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden text-black animate-in slide-in-from-bottom-4 duration-300">
        {/* Enhanced Header with Gradient */}
        <div className="bg-gradient-to-r from-[#ff004f] to-[#ff3366] px-6 py-4 relative">
          <button
            onClick={() => {
              if (hasChanges) setConfirmClose(true);
              else onClose();
            }}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-1 transition-all"
          >
            <X size={22} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isEdit ? "✏️ Edit User" : "➕ Add New User"}
              </h2>
              <p className="text-white/80 text-sm">
                {isEdit ? "Update user information" : "Create a new user account"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">

        {/* LOCKED MESSAGE */}
        {isLockedRole && (
          <p className="text-center text-red-600 font-medium mb-3">
            This user role cannot be modified.
          </p>
        )}

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

          {/* SUPER HELPER, SUPER_ADMIN, SUPER_SPOC — MULTIPLE ORGANIZATIONS */}
          {(isSuperHelper || form.role === "SUPER_ADMIN" || form.role === "SUPER_SPOC") && (
            <div>
              <label className="text-sm font-semibold block mb-1">
                Accessible Organizations
                {(form.role === "SUPER_ADMIN" || form.role === "SUPER_SPOC") && (
                  <span className="ml-2 text-xs text-gray-600">(All organizations by default)</span>
                )}
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
          <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => {
                if (hasChanges) setConfirmClose(true);
                else onClose();
              }}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-100 font-semibold transition-all hover:scale-105"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || isLockedRole}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 text-white font-bold shadow-lg transition-all transform hover:scale-105
                ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#ff004f] to-[#ff3366] hover:shadow-2xl hover:shadow-[#ff004f]/30"
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
                "💾 Update User"
              ) : (
                "✨ Create User"
              )}
            </button>
          </div>
        </form>
        </div>
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
