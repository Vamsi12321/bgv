"use client";
import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    role: "",
    fromDate: "",
    toDate: "",
    search: "",
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filters.role) query.append("role", filters.role);
      if (filters.fromDate) query.append("fromDate", filters.fromDate);
      if (filters.toDate) query.append("toDate", filters.toDate);
      if (filters.search) query.append("search", filters.search);

      const res = await fetch(
        `${API_BASE}/secure/activityLogs?${query.toString()}`,
        { method: "GET", credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch activity logs — please log in again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleApplyFilters = () => fetchLogs();

  const getIcon = (action) => {
    const lower = action.toLowerCase();
    if (lower.includes("create"))
      return <UserPlus className="text-green-600" size={18} />;
    if (lower.includes("update"))
      return <Edit3 className="text-yellow-600" size={18} />;
    if (lower.includes("delete"))
      return <Trash2 className="text-red-600" size={18} />;
    if (lower.includes("approve"))
      return <Shield className="text-blue-600" size={18} />;
    if (lower.includes("reject") || lower.includes("fail"))
      return <XCircle className="text-red-600" size={18} />;
    return <CheckCircle className="text-gray-500" size={18} />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Success":
        return "text-green-600 bg-green-50";
      case "Warning":
        return "text-yellow-700 bg-yellow-50";
      case "Error":
      case "Failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  return (
    <div className="p-4 md:p-8 text-gray-900 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">
          Activity Logs
        </h1>
        {loading && (
          <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
            <Loader2 className="animate-spin" size={18} />
            Fetching latest logs...
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="border rounded-md w-full p-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ORG_ADMIN">Org Admin</option>
              <option value="HR_ADMIN">HR Admin</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              From
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              className="border rounded-md w-full p-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              To
            </label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => handleFilterChange("toDate", e.target.value)}
              className="border rounded-md w-full p-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Search and Filter Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
          <div className="relative w-full sm:w-1/2">
            <Search
              size={16}
              className="absolute top-2.5 left-3 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search by action, user, or details..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-8 border rounded-md w-full p-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm font-medium transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Filter size={16} />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-y-auto max-h-[70vh]">
          <table className="w-full text-sm text-gray-900 border-collapse">
            <thead className="sticky top-0 bg-gray-100 text-gray-700 uppercase text-xs tracking-wide z-10">
              <tr>
                <th className="p-3 text-left w-10">#</th>
                <th className="p-3 text-left min-w-[120px]">Action</th>
                <th className="p-3 text-left min-w-[250px]">Details</th>
                <th className="p-3 text-left min-w-[120px]">User</th>
                <th className="p-3 text-left min-w-[180px]">Email</th>
                <th className="p-3 text-left min-w-[110px]">Role</th>
                <th className="p-3 text-left min-w-[90px]">Status</th>
                <th className="p-3 text-left min-w-[150px] whitespace-nowrap">
                  Date & Time
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">
                    <Loader2
                      className="animate-spin inline-block mr-2 text-blue-500"
                      size={20}
                    />
                    Loading activity logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((l, index) => (
                  <tr
                    key={l._id}
                    className={`border-t ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50/40 transition-all duration-100`}
                  >
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 flex items-center gap-2 font-semibold">
                      {getIcon(l.action)}
                      {l.action}
                    </td>
                    <td className="p-3 text-gray-700 whitespace-pre-wrap break-words">
                      {l.details || "—"}
                    </td>
                    <td className="p-3 font-medium">{l.userName || "—"}</td>
                    <td className="p-3 text-gray-600 break-all">
                      {l.email || "—"}
                    </td>
                    <td className="p-3 text-gray-600">{l.role || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          l.status
                        )}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center p-6 text-gray-500 italic"
                  >
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
