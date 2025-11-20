"use client";
import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Shield,
  UserPlus,
  Search,
  Filter,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function OrgLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    search: "",
  });

  useEffect(() => {
    fetchOrgLogs();
  }, []);

  // 🔹 Fetch org-level logs
  const fetchOrgLogs = async (customFilters = filters) => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (customFilters.fromDate)
        query.append("fromDate", customFilters.fromDate);
      if (customFilters.toDate) query.append("toDate", customFilters.toDate);
      if (customFilters.search) query.append("search", customFilters.search);

      const res = await fetch(`${API_BASE}/secure/activityLogs?${query}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch logs");
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch organization logs. Please log in again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleApplyFilters = () => {
    fetchOrgLogs(filters);
  };

  const getIcon = (action) => {
    const a = action?.toLowerCase() || "";
    if (a.includes("create"))
      return <UserPlus className="text-green-600" size={18} />;
    if (a.includes("update"))
      return <Edit3 className="text-yellow-600" size={18} />;
    if (a.includes("delete"))
      return <Trash2 className="text-red-600" size={18} />;
    if (a.includes("approve"))
      return <Shield className="text-[#ff004f]" size={18} />;
    if (a.includes("reject") || a.includes("fail"))
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
        <h1 className="text-3xl font-extrabold tracking-tight text-[#ff004f]">
          Organization Activity Logs
        </h1>
        {loading && (
          <div className="flex items-center gap-2 text-[#ff004f] font-medium text-sm">
            <Loader2 className="animate-spin" size={18} />
            Fetching latest logs...
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              From
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              className="border rounded-lg w-full p-2.5 text-sm h-[42px] focus:ring-2 focus:ring-[#ff004f]"
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
              className="border rounded-lg w-full p-2.5 text-sm h-[42px] focus:ring-2 focus:ring-[#ff004f]"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Search
            </label>
            <Search
              size={16}
              className="absolute top-[38px] left-3 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search by action or details..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-8 border rounded-lg w-full p-2.5 text-sm h-[42px] focus:ring-2 focus:ring-[#ff004f]"
            />
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium shadow transition ${
              loading
                ? "bg-[#ffb3c7] cursor-not-allowed"
                : "bg-[#ff004f] hover:bg-[#e60047]"
            }`}
          >
            <Filter size={16} />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-y-auto max-h-[70vh]">
          <table className="w-full text-sm text-gray-900 border-collapse">
            <thead className="sticky top-0 bg-[#ffeef3] text-[#ff004f] uppercase text-xs tracking-wide z-10">
              <tr>
                <th className="p-3 text-left w-10">#</th>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center p-6">
                    Loading...
                  </td>
                </tr>
              ) : logs.length ? (
                logs.map((l, i) => (
                  <tr
                    key={l._id}
                    className="border-t hover:bg-[#fff6f8] transition"
                  >
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 flex items-center gap-2 font-semibold">
                      {getIcon(l.action)} {l.action}
                    </td>
                    <td className="p-3">{l.details || "—"}</td>
                    <td className="p-3">{l.userName || "—"}</td>
                    <td className="p-3 break-all">{l.email || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          l.status
                        )}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-6">
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {logs.map((l, i) => (
          <div
            key={l._id}
            className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 text-[#ff004f] font-semibold text-base mb-1">
              {getIcon(l.action)}
              {l.action}
            </div>
            <p className="text-sm text-gray-700 mb-2">{l.details || "—"}</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-semibold">User:</span> {l.userName || "—"}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {l.email || "—"}
              </p>
            </div>
            <div className="flex justify-between mt-3">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  l.status
                )}`}
              >
                {l.status}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(l.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}

        {logs.length === 0 && !loading && (
          <p className="text-center text-gray-500 italic">No logs found.</p>
        )}
      </div>
    </div>
  );
}
