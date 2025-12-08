/* FULLY ENHANCED LOGS PAGE — TABLE CLEANED + DRAWER ADDED */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Loader2,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileBarChart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSuperAdminState } from "../../context/SuperAdminStateContext";

/* CONFIG */

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

export default function LogsOptimizedPage() {
  const {
    logsData: allLogs,
    setLogsData: setAllLogs,
    logsFilters: filters,
    setLogsFilters: setFilters,
    logsPagination,
    setLogsPagination,
  } = useSuperAdminState();

  /* STATE */
  const [totalCount, setTotalCount] = useState(null);
  const [page, setPage] = useState(logsPagination.currentPage || 1);
  const [limit, setLimit] = useState(
    logsPagination.pageSize || DEFAULT_PAGE_SIZE
  );
  const [loadingChunk, setLoadingChunk] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [error, setError] = useState("");

  const loadedPagesRef = useRef(new Set());
  const router = useRouter();

  /* Drawer State */
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const openDrawer = (log) => {
    setSelectedLog(log);
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setSelectedLog(null);
    setShowDrawer(false);
  };

  /* ACCESS CHECK */
  useEffect(() => {
    const stored = localStorage.getItem("bgvUser");
    if (!stored) return router.replace("/");

    const user = JSON.parse(stored);
    if (user.role?.toUpperCase() === "SUPER_ADMIN_HELPER") {
      router.replace("/superadmin/dashboard");
    }
  }, []);

  /* FETCH PAGE */
  const fetchPage = useCallback(
    async (pageToFetch) => {
      if (loadedPagesRef.current.has(pageToFetch)) return;

      loadedPagesRef.current.add(pageToFetch);

      if (pageToFetch === 1) setLoadingInitial(true);
      else setLoadingChunk(true);

      try {
        const qs = new URLSearchParams({
          page: pageToFetch,
          limit,
        }).toString();

        const res = await fetch(`/api/proxy/secure/activityLogs?${qs}`, {
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const logs = data.logs || [];

        setAllLogs((prev) => {
          const seen = new Set();
          return [...prev, ...logs].filter((l) => {
            if (seen.has(l._id)) return false;
            seen.add(l._id);
            return true;
          });
        });

        if (data.totalCount) setTotalCount(data.totalCount);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingInitial(false);
        setLoadingChunk(false);
      }
    },
    [limit]
  );

  /* SYNC PAGINATION STATE */
  useEffect(() => {
    setLogsPagination({ currentPage: page, pageSize: limit });
  }, [page, limit]);

  /* INITIAL LOAD */
  useEffect(() => {
    // Only clear and refetch if we don't have data
    if (allLogs.length === 0) {
      loadedPagesRef.current.clear();
      fetchPage(1);
      setPage(1);
    }
  }, [limit]);

  /* INFINITE SCROLL - DISABLED (using pagination instead) */
  // Removed to prevent continuous loading with pagination

  /* FILTERING LOGIC */
  const filteredLogs = allLogs.filter((log) => {
    const search = (filters.search || "").toLowerCase();

    if (filters.role && log.userRole !== filters.role) return false;

    if (search) {
      const hay = `${log.action} ${log.description} ${log.userEmail}`
        .toLowerCase()
        .replace(/\s+/g, " ");
      if (!hay.includes(search)) return false;
    }

    if (filters.fromDate) {
      if (new Date(log.timestamp) < new Date(filters.fromDate)) return false;
    }

    if (filters.toDate) {
      if (new Date(log.timestamp) > new Date(filters.toDate + "T23:59")) {
        return false;
      }
    }

    return true;
  });

  const pageCount = Math.ceil(filteredLogs.length / limit) || 1;
  const visibleLogs = filteredLogs.slice((page - 1) * limit, page * limit);

  /* Helpers */
  const getIcon = (action = "") => {
    const a = action.toLowerCase();
    if (a.includes("create"))
      return <UserPlus size={18} className="text-green-600" />;
    if (a.includes("update"))
      return <Edit3 size={18} className="text-yellow-600" />;
    if (a.includes("delete"))
      return <Trash2 size={18} className="text-red-600" />;
    if (a.includes("approve"))
      return <Shield size={18} className="text-blue-600" />;
    if (a.includes("fail") || a.includes("reject"))
      return <XCircle size={18} className="text-red-600" />;
    return <CheckCircle size={18} className="text-gray-500" />;
  };

  const getStatusColor = (status = "") => {
    const s = status.toLowerCase();
    if (s.includes("success")) return "bg-green-100 text-green-700";
    if (s.includes("error") || s.includes("fail"))
      return "bg-red-100 text-red-700";
    if (s.includes("warning")) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  const formatDate = (iso) => new Date(iso).toLocaleString();

  /* CSV */
  const downloadVisibleCSV = () => {
    if (!visibleLogs || visibleLogs.length === 0) {
      alert("No visible logs to download.");
      return;
    }

    const safe = (val) => {
      if (val === null || val === undefined) return "";
      return String(val).replace(/"/g, '""'); // escape quotes
    };

    const rows = [
      ["#", "Action", "Description", "Email", "Role", "Status", "Timestamp"],
      ...visibleLogs.map((log, i) => [
        (page - 1) * limit + (i + 1), // correct row numbering
        safe(log.action),
        safe(log.description || ""),
        safe(log.userEmail),
        safe(log.userRole),
        safe(log.status),
        safe(formatDate(log.timestamp)),
      ]),
    ];

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `logs_page_${page}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadAllCSV = async () => {
    try {
      const qs = new URLSearchParams({
        page: 1,
        limit: 50000,
        role: filters.role || "",
        fromDate: filters.fromDate || "",
        toDate: filters.toDate || "",
        search: filters.search || "",
      }).toString();

      const res = await fetch(`/api/proxy/secure/activityLogs?${qs}`, {
        credentials: "include",
      });

      const data = await res.json();
      const logs = data.logs || [];

      if (logs.length === 0) {
        alert("No logs available.");
        return;
      }

      const rows = [
        ["#", "Action", "Email", "Role", "Status", "Timestamp", "Description"],
        ...logs.map((log, i) => [
          i + 1,
          log.action,
          log.userEmail,
          log.userRole,
          log.status,
          formatDate(log.timestamp),
          (log.description || "").replace(/"/g, "'"), // sanitize
        ]),
      ];

      const csvString =
        "data:text/csv;charset=utf-8," +
        rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

      const link = document.createElement("a");
      link.href = encodeURI(csvString);
      link.download = "logs_all.csv";
      link.click();
    } catch (err) {
      console.error(err);
      alert("Failed to download all logs.");
    }
  };

  /* UI */
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen text-gray-900">
      {/* OUTER WRAPPER LIKE USERS & ROLES */}
      <div className="max-w-[1200px] mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileBarChart size={24} className="text-[#ff004f]" />
              Activity Logs
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Track system activities and user actions
            </p>
          </div>

          <button
            onClick={downloadVisibleCSV}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold w-full sm:w-auto shadow transition-all hover:shadow-lg bg-[#ff004f] hover:bg-[#e60047]"
          >
            <Download size={18} />
            Download
          </button>
        </div>

        {/* SUPERB FILTER PANEL */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-[#ff004f]/10 to-[#ff3366]/10 rounded-lg">
              <svg
                className="w-5 h-5 text-[#ff004f]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Filter Logs</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            {/* ROLE */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) =>
                  setFilters({ ...filters, role: e.target.value })
                }
                className="border border-gray-300 rounded-md w-full p-2 text-sm focus:ring-2 focus:ring-[#ff004f] transition md:p-2.5 text-[13px] md:text-sm"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="SUPER_SPOC">Super Spoc</option>
                <option value="ORG_HR">Org HR</option>
                <option value="HELPER">Helper</option>
              </select>
            </div>

            {/* FROM DATE */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                From
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters({ ...filters, fromDate: e.target.value })
                }
                className="border rounded-lg w-full p-2 text-sm"
              />
            </div>

            {/* TO DATE */}
            <div>
              <label className="text-xs font-semibold text-gray-600">To</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters({ ...filters, toDate: e.target.value })
                }
                className="border rounded-lg w-full p-2 text-sm"
              />
            </div>

            {/* SEARCH */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Search
              </label>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-2 top-3 text-gray-400"
                />
                <input
                  type="text"
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  placeholder="Search anything..."
                  className="pl-8 border rounded-lg w-full p-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE WRAPPER */}
        <div className="  overflow-hidden">
          {/* SUPERB DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-xl border-2 border-gray-100">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left w-[50px] font-semibold text-gray-700">
                    #
                  </th>
                  <th className="px-4 py-4 text-left w-[150px] font-semibold text-gray-700">
                    ⚡ Action
                  </th>
                  <th className="px-4 py-4 text-left w-[240px] font-semibold text-gray-700">
                    ✉️ Email
                  </th>
                  <th className="px-4 py-4 text-left w-[140px] font-semibold text-gray-700">
                    🎭 Role
                  </th>
                  <th className="px-4 py-4 text-left w-[120px] font-semibold text-gray-700">
                    ✅ Status
                  </th>
                  <th className="px-4 py-4 text-left w-[160px] font-semibold text-gray-700">
                    🕐 Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingInitial ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-600">
                      <Loader2
                        className="animate-spin inline mr-2 text-[#ff004f]"
                        size={32}
                      />
                      <p className="mt-2">Loading logs...</p>
                    </td>
                  </tr>
                ) : visibleLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  visibleLogs.map((log, i) => {
                    const idx = (page - 1) * limit + i + 1;

                    return (
                      <tr
                        key={log._id}
                        onClick={() => openDrawer(log)}
                        className={`transition-all cursor-pointer group hover:bg-gradient-to-r hover:from-[#fff5f8] hover:to-[#fff0f5] hover:shadow-md ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <td className="px-4 py-4 font-semibold text-gray-700">
                          {idx}
                        </td>
                        <td className="px-4 py-4 truncate flex items-center gap-2 group-hover:text-[#ff004f] transition-colors">
                          {getIcon(log.action)}
                          <span className="truncate font-medium">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-4 truncate text-gray-600">
                          {log.userEmail}
                        </td>
                        <td className="px-4 py-4 truncate text-gray-600">
                          {log.userRole}
                        </td>
                        <td className="px-4 py-4 truncate">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(
                              log.status
                            )}`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 truncate text-gray-600 text-xs">
                          {formatDate(log.timestamp)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE LIST (MODERN CLEAN CARD – FULL WIDTH) */}
          <div className="md:hidden space-y-4 px-0">
            {loadingInitial ? (
              <div className="text-center py-8 text-gray-600">
                <Loader2
                  className="animate-spin inline mr-2 text-[#ff004f]"
                  size={32}
                />
                <p className="mt-2">Loading logs...</p>
              </div>
            ) : visibleLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No logs found
              </div>
            ) : (
              visibleLogs.map((log) => (
                <div
                  key={log._id}
                  className="bg-white shadow-md rounded-xl p-4 w-full border border-gray-200"
                  onClick={() => openDrawer(log)}
                >
                  {/* STATUS + TIMESTAMP */}
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[12px] font-semibold ${getStatusColor(
                        log.status
                      )}`}
                    >
                      {log.status}
                    </span>

                    <span className="text-[12px] text-gray-500">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>

                  {/* ACTION */}
                  <div className="flex items-center gap-2 text-[#ff004f] font-bold text-sm mb-1">
                    {getIcon(log.action)}
                    <span className="truncate">{log.action}</span>
                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-[13px] text-gray-700 mb-3 line-clamp-2">
                    {log.description || "—"}
                  </p>

                  {/* EMAIL + ROLE */}
                  <div className="text-[13px] text-gray-700 space-y-0.5">
                    <p>
                      <b>Email:</b> {log.userEmail}
                    </p>
                    <p>
                      <b>Role:</b> {log.userRole}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PAGINATION WITH 5-PAGE WINDOW */}
        <div className="mt-6 flex justify-center items-center gap-2">
          {(() => {
            const windowSize = 5;
            const start = Math.floor((page - 1) / windowSize) * windowSize + 1;
            const end = Math.min(start + windowSize - 1, pageCount);
            const pages = [];
            for (let i = start; i <= end; i++) pages.push(i);

            return (
              <>
                {/* PREVIOUS BLOCK */}
                <button
                  disabled={page === 1}
                  onClick={() => setPage(Math.max(1, start - 1))}
                  className="px-3 py-2 border rounded-md disabled:opacity-40 bg-white"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* PAGE NUMBERS */}
                <div className="flex gap-2">
                  {pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        page === p
                          ? "bg-[#ff004f] text-white shadow"
                          : "border bg-white text-gray-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* NEXT BLOCK */}
                <button
                  disabled={page === pageCount}
                  onClick={() => setPage(Math.min(pageCount, end + 1))}
                  className="px-3 py-2 border rounded-md disabled:opacity-40 bg-white"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            );
          })()}
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 text-red-600 bg-red-100 border border-red-300 p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* DRAWER */}
      {showDrawer && selectedLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full sm:w-[380px] bg-white h-full shadow-xl p-5 overflow-y-auto slide-in-right">
            <button
              onClick={closeDrawer}
              className="text-gray-600 hover:text-black mb-4"
            >
              ✕ Close
            </button>

            <h2 className="text-xl font-bold text-[#ff004f] mb-4">
              Log Details
            </h2>

            <div className="space-y-3 text-sm">
              <p>
                <b>Action:</b> {selectedLog.action}
              </p>

              <p>
                <b>Status:</b>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(
                    selectedLog.status
                  )}`}
                >
                  {selectedLog.status}
                </span>
              </p>

              <p>
                <b>Email:</b> {selectedLog.userEmail}
              </p>
              <p>
                <b>Role:</b> {selectedLog.userRole}
              </p>
              <p>
                <b>Date:</b> {formatDate(selectedLog.timestamp)}
              </p>

              <div>
                <p className="font-semibold mb-1">Description:</p>
                <p className="p-3 bg-gray-100 rounded-md text-gray-700 whitespace-pre-line">
                  {selectedLog.description || "—"}
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">Raw Data:</p>
                <pre className="p-3 bg-gray-900 text-green-300 rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Animation CSS (insert in globals.css)

*/
