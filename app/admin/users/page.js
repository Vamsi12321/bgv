"use client";
import { useState } from "react";
import { Plus, Edit, Trash2, Filter, X } from "lucide-react";

export default function OrgUsersPage() {
  // ✅ This org-level admin belongs to this organization
  const orgName = "ABC Corp";

  const [users, setUsers] = useState([
    {
      id: 1,
      name: "John HR",
      email: "john@abc.com",
      role: "HR Admin",
      status: "Active",
      access: "Create/Edit",
    },
    {
      id: 2,
      name: "Priya Singh",
      email: "priya@abc.com",
      role: "Employer",
      status: "Inactive",
      access: "Read Only",
    },
  ]);

  const [filterRole, setFilterRole] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "Active").length,
    inactive: users.filter((u) => u.status === "Inactive").length,
    suspended: users.filter((u) => u.status === "Suspended").length,
  };

  const filteredUsers = users.filter(
    (u) => filterRole === "All" || u.role === filterRole
  );

  const handleDelete = (id) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const handleAddUser = (newUser) => {
    setUsers([...users, { id: Date.now(), org: orgName, ...newUser }]);
    setShowModal(false);
  };

  return (
    <div className="p-8 text-black">
      <h1 className="text-2xl font-bold mb-6">Users Management ({orgName})</h1>

      {/* 🔹 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card title="Total Users" value={stats.total} />
        <Card title="Active Users" value={stats.active} color="green" />
        <Card title="Inactive Users" value={stats.inactive} color="yellow" />
        <Card title="Suspended Users" value={stats.suspended} color="red" />
      </div>

      {/* 🔹 Filters & Add */}
      <div className="flex flex-wrap items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} />
          <select
            className="border px-3 py-1 rounded-md"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="HR Admin">HR Admin</option>
            <option value="Employer">Employer</option>
          </select>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus size={16} className="mr-1" /> Add User
        </button>
      </div>

      {/* 🔹 User Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Access Type</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.access}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      u.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : u.status === "Inactive"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800">
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Add User Modal */}
      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSave={handleAddUser}
          orgName={orgName}
        />
      )}
    </div>
  );
}

/* -------------------------------------- */
/* ✅ Card Component */
function Card({ title, value, color }) {
  const colorClass =
    color === "green"
      ? "text-green-600"
      : color === "yellow"
      ? "text-yellow-600"
      : color === "red"
      ? "text-red-600"
      : "text-blue-600";

  return (
    <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
      <h2 className="text-sm text-gray-500">{title}</h2>
      <p className={`text-2xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}

/* -------------------------------------- */
/* ✅ Add User Modal (Org level: orgName auto-filled) */
function AddUserModal({ onClose, onSave, orgName }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "HR Admin",
    status: "Active",
    access: "Read Only",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add New User - {orgName}</h2>
          <button onClick={onClose}>
            <X size={20} className="text-gray-500 hover:text-black" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border rounded-md px-3 py-2"
            >
              <option>HR Admin</option>
              <option>Employer</option>
            </select>

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="border rounded-md px-3 py-2"
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">
              Type of Access
            </label>
            <select
              value={form.access}
              onChange={(e) => setForm({ ...form, access: e.target.value })}
              className="w-full border rounded-md px-3 py-2 mt-1"
            >
              <option>Read Only</option>
              <option>Create/Edit</option>
              <option>Admin Access</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 mt-3"
          >
            Save User
          </button>
        </form>
      </div>
    </div>
  );
}
