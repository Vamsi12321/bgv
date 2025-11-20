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
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/**
 * Logs Hybrid Page
 * - Client-side filters
 * - Pagination controls (page numbers)
 * - Infinite scroll (auto fetch more chunks)
 * - Download filtered logs (current client-filtered set)
 * - Download all logs (will fetch remaining pages first if needed)
 *
 * Backend expectations (compatible with your API):
 * GET `${API_BASE}/secure/activityLogs?page=1&limit=25`
 * returns JSON: { logs: [...], totalCount: 123 } or {data: [...], total: 123}
 *
 * Adjust DEFAULT_PAGE_SIZE to change chunk sizes fetched.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

const DEFAULT_PAGE_SIZE = 25;

export default function LogsHybridPage() {
  // raw dataset that we've fetched so far
  const [allLogs, setAllLogs] = useState([]);
  const [loadedPages, setLoadedPages] = useState(new Set()); // pages fetched
  const [totalCount, setTotalCount] = useState(null);

  // UI states
  const [loadingChunk, setLoadingChunk] = useState(false); // for chunk fetch
  const [loadingAll, setLoadingAll] = useState(false); // when fetching remaining for "Download All"
  const [loadingInitial, setLoadingInitial] = useState(false); // first page load
  const [error, setError] = useState("");

  // filters (applied client-side)
  const [filters, setFilters] = useState({
    role: "",
    fromDate: "",
    toDate: "",
    search: "",
  });

  // pagination & infinite scroll UI
  const [page, setPage] = useState(1); // visible page number
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [usePagination, setUsePagination] = useState(true);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(true);

  // intersection observer
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // debounce filter
  const debounceRef = useRef(null);

  /* -------------------------
     Helpers: fetch a single page chunk
  --------------------------*/
  const fetchChunk = useCallback(
    async (pageToFetch = 1, pageLimit = limit) => {
      // avoid refetching same page
      if (loadedPages.has(pageToFetch)) return { logs: [], total: totalCount };

      try {
        setLoadingChunk(true);
        const qs = new URLSearchParams({
          page: pageToFetch,
          limit: pageLimit,
        }).toString();

        const res = await fetch(`${API_BASE}/secure/activityLogs?${qs}`, {
          credentials: "include",
        });

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.detail || d.message || "Failed to fetch logs");
        }

        const data = await res.json();
        const fetched = data.logs || data.data || [];
        const total =
          typeof data.totalCount === "number"
            ? data.totalCount
            : typeof data.total === "number"
            ? data.total
            : null;

        // append to allLogs (preserve order by page)
        setAllLogs((prev) => {
          // naive but safe: append and dedupe by _id
          const combined = [...prev, ...fetched];
          const seen = new Set();
          const deduped = [];
          for (const item of combined) {
            const id = item._id || JSON.stringify(item);
            if (!seen.has(id)) {
              deduped.push(item);
              seen.add(id);
            }
          }
          return deduped;
        });

        setLoadedPages((prev) => new Set(prev).add(pageToFetch));
        if (total !== null) setTotalCount(total);

        return { logs: fetched, total };
      } catch (err) {
        console.error("fetchChunk error:", err);
        setError(err.message || "Error fetching logs");
        return { logs: [], total: null };
      } finally {
        setLoadingChunk(false);
      }
    },
    [API_BASE, limit, loadedPages, totalCount]
  );

  /* -------------------------
     Fetch initial page when component mounts
  --------------------------*/
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingInitial(true);
        await fetchChunk(1, limit);
        if (mounted) {
          // keep page at 1 (visible)
          setPage(1);
        }
      } finally {
        setLoadingInitial(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchChunk, limit]);

  /* -------------------------
     Infinite scroll: observe sentinel and auto-load next page
  --------------------------*/
  const hasMorePages = useCallback(() => {
    if (totalCount === null) return true; // unknown - assume more available
    return allLogs.length < totalCount;
  }, [allLogs.length, totalCount]);

  useEffect(() => {
    if (!infiniteScrollEnabled) {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }
    if (!sentinelRef.current) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && hasMorePages() && !loadingChunk) {
            // compute next page number to fetch = 1 + max(loadedPages)
            const loaded = Array.from(loadedPages);
            const maxLoaded = loaded.length ? Math.max(...loaded) : 0;
            const next = maxLoaded + 1;
            await fetchChunk(next, limit);
          }
        }
      },
      { root: null, rootMargin: "300px", threshold: 0.1 }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current && observerRef.current.disconnect();
  }, [
    infiniteScrollEnabled,
    sentinelRef.current,
    loadedPages,
    fetchChunk,
    limit,
    hasMorePages,
    loadingChunk,
  ]);

  /* -------------------------
     Client-side filtering (debounced)
     - filters are applied to allLogs and we create filteredLogs
  --------------------------*/
  const [filteredLogs, setFilteredLogs] = useState([]);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = (filters.search || "").trim().toLowerCase();
      const from = filters.fromDate ? new Date(filters.fromDate) : null;
      const to = filters.toDate ? new Date(filters.toDate) : null;

      const result = allLogs.filter((l) => {
        // role filter
        if (
          filters.role &&
          (l.role || "").toLowerCase() !== filters.role.toLowerCase()
        ) {
          return false;
        }
        // date range filter (uses timestamp)
        if (from || to) {
          const ts = l.timestamp ? new Date(l.timestamp) : null;
          if (!ts) return false;
          if (from && ts < from) return false;
          if (to) {
            // include the end day entirely
            const endOfDay = new Date(to);
            endOfDay.setHours(23, 59, 59, 999);
            if (ts > endOfDay) return false;
          }
        }
        // search filter across action, details, username, email
        if (q) {
          const hay = `${l.action || ""} ${l.details || ""} ${
            l.userName || ""
          } ${l.email || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      setFilteredLogs(result);
      // when filters change, reset visible page to 1
      setPage(1);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [filters, allLogs]);

  /* -------------------------
     Visible slice based on pagination
  --------------------------*/
  const pageCount =
    filteredLogs && limit ? Math.ceil(filteredLogs.length / limit) : 0;
  const visibleLogs = filteredLogs.slice((page - 1) * limit, page * limit);

  /* -------------------------
     Pagination helpers
  --------------------------*/
  const gotoPage = (p) => {
    if (p < 1) p = 1;
    if (pageCount && p > pageCount) p = pageCount;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* -------------------------
     Download CSV helpers
  --------------------------*/
  const logsToCsv = (rows) => {
    const headers = [
      "#",
      "Action",
      "Details",
      "User",
      "Email",
      "Role",
      "Status",
      "Timestamp",
    ];
    const dataRows = rows.map((l, i) => [
      i + 1,
      l.action || "",
      (l.details || "").replace(/\n/g, " "),
      l.userName || "",
      l.email || "",
      l.role || "",
      l.status || "",
      l.timestamp || "",
    ]);
    const csv = [headers, ...dataRows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    return csv;
  };

  // Download filtered logs (client-side only)
  const downloadFiltered = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      alert("No filtered logs to download.");
      return;
    }
    const csv = logsToCsv(filteredLogs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_logs_filtered_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Ensure all logs are loaded (fetch remaining pages)
  const fetchAllRemaining = async () => {
    if (!hasMorePages()) return; // already fully loaded (if totalCount known)
    setLoadingAll(true);
    try {
      // determine next page to fetch based on loadedPages
      let loaded = Array.from(loadedPages);
      let next = loaded.length ? Math.max(...loaded) + 1 : 1;
      // cap safety loop to avoid infinite loop
      let safety = 0;
      while (safety < 1000) {
        // fetch next
        const { logs: fetched, total } = await fetchChunk(next, limit);
        // if fetched is empty and total known, break
        if ((fetched?.length || 0) === 0) {
          // if total known and we've fetched enough, break
          if (total !== null && allLogs.length >= total) break;
          // else maybe backend returned empty page — break to avoid loop
          break;
        }
        // compute if we still have more
        loaded = Array.from(loadedPages);
        next = loaded.length ? Math.max(...loaded) + 1 : next + 1;
        safety += 1;
        // break if we've fetched all known total
        if (total !== null && allLogs.length >= total) break;
      }
    } catch (err) {
      console.error("fetchAllRemaining error", err);
      setError(err.message || "Failed fetching all logs");
    } finally {
      setLoadingAll(false);
    }
  };

  // Download ALL logs (will fetch remaining first if needed)
  const downloadAll = async () => {
    // if totalCount known and allLogs.length >= totalCount -> ready
    const needFetch =
      totalCount === null || allLogs.length < (totalCount || Infinity);

    if (needFetch) {
      if (
        !confirm(
          "Download All will fetch remaining logs from the server (may take time). Continue?"
        )
      )
        return;
      await fetchAllRemaining();
    }

    // after ensuring fetch, build csv from full dataset
    if (!allLogs || allLogs.length === 0) {
      alert("No logs available to download.");
      return;
    }
    const csv = logsToCsv(allLogs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_logs_all_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* -------------------------
     UI helpers
  --------------------------*/
  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const getIcon = (action) => {
    const lower = (action || "").toLowerCase();
    if (lower.includes("create"))
      return <UserPlus className="text-green-600" size={18} />;
    if (lower.includes("update"))
      return <Edit3 className="text-yellow-600" size={18} />;
    if (lower.includes("delete"))
      return <Trash2 className="text-red-600" size={18} />;
    if (lower.includes("approve"))
      return <Shield className="text-[#ff004f]" size={18} />;
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

  /* -------------------------
     Render
  --------------------------*/
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen text-gray-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#ff004f]">
            Activity Logs
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            View application activity. Filters are applied client-side for
            instant results.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {/* Mode toggles */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => {
                setUsePagination(true);
                setInfiniteScrollEnabled(true);
              }}
              className={`px-3 py-1 rounded-md text-sm ${
                infiniteScrollEnabled && usePagination
                  ? "bg-[#ff004f] text-white"
                  : "bg-white border"
              }`}
            >
              Pagination + Infinite
            </button>
            <button
              onClick={() => {
                setUsePagination(true);
                setInfiniteScrollEnabled(false);
              }}
              className={`px-3 py-1 rounded-md text-sm ${
                !infiniteScrollEnabled && usePagination
                  ? "bg-[#ff004f] text-white"
                  : "bg-white border"
              }`}
            >
              Pagination only
            </button>
            <button
              onClick={() => {
                setUsePagination(false);
                setInfiniteScrollEnabled(true);
              }}
              className={`px-3 py-1 rounded-md text-sm ${
                !usePagination && infiniteScrollEnabled
                  ? "bg-[#ff004f] text-white"
                  : "bg-white border"
              }`}
            >
              Infinite only
            </button>
          </div>

          {/* Download buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={downloadFiltered}
              className="px-3 py-2 bg-white border rounded-md text-sm flex items-center gap-2 hover:bg-gray-50"
            >
              <Download size={16} /> Download Filtered
            </button>

            <button
              onClick={downloadAll}
              disabled={loadingAll}
              className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                loadingAll
                  ? "bg-[#ffb3c7] cursor-not-allowed"
                  : "bg-[#ff004f] text-white hover:bg-[#e60047]"
              }`}
            >
              {loadingAll ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Preparing...
                </>
              ) : (
                <>
                  <Download size={16} /> Download All
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) =>
                setFilters((p) => ({ ...p, role: e.target.value }))
              }
              className="border rounded-lg w-full p-2.5 text-sm h-[42px] focus:ring-2 focus:ring-[#ff004f]"
            >
              <option value="">All</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="SUPER_ADMIN_HELPER">Super Admin Helper</option>
              <option value="ORG_HR">Org HR</option>
              <option value="HELPER">Helper</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              From
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, fromDate: e.target.value }))
              }
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
              onChange={(e) =>
                setFilters((p) => ({ ...p, toDate: e.target.value }))
              }
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
              placeholder="Action, user, email or details..."
              value={filters.search}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value }))
              }
              className="pl-8 border rounded-lg w-full p-2.5 text-sm h-[42px] focus:ring-2 focus:ring-[#ff004f]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFilters({ role: "", fromDate: "", toDate: "", search: "" });
              }}
              className="px-4 py-2 rounded-md border text-sm"
            >
              Clear Filters
            </button>
            <button
              onClick={() => {
                /* reapply (client-side already reactive) */ setPage(1);
              }}
              className="px-4 py-2 rounded-md bg-[#ff004f] text-white text-sm"
            >
              Apply
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Page size</div>
            <select
              value={limit}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLimit(v);
                setPage(1);
                // Also reset loadedPages so future chunk fetches align with new limit
                setLoadedPages(new Set());
                setAllLogs([]);
                // re-fetch first page with new limit
                fetchChunk(1, v);
              }}
              className="border rounded-md px-2 py-1"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-y-auto max-h-[64vh]">
          <table className="w-full text-sm text-gray-900 border-collapse">
            <thead className="sticky top-0 bg-[#ffeef3] text-[#ff004f] uppercase text-xs tracking-wide z-10">
              <tr>
                <th className="p-3 text-left w-10">#</th>
                <th className="p-3 text-left min-w-[160px]">Action</th>
                <th className="p-3 text-left min-w-[300px]">Details</th>
                <th className="p-3 text-left min-w-[160px]">User</th>
                <th className="p-3 text-left min-w-[200px]">Email</th>
                <th className="p-3 text-left min-w-[120px]">Role</th>
                <th className="p-3 text-left min-w-[110px]">Status</th>
                <th className="p-3 text-left min-w-[160px]">Date & Time</th>
              </tr>
            </thead>

            <tbody>
              {loadingInitial && allLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    <Loader2 className="animate-spin inline-block mr-2 text-[#ff004f]" />{" "}
                    Loading logs...
                  </td>
                </tr>
              ) : visibleLogs.length > 0 ? (
                visibleLogs.map((l, idx) => {
                  const globalIndex = (page - 1) * limit + idx + 1;
                  return (
                    <tr
                      key={l._id || globalIndex}
                      className={`border-t ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-[#fff6f8] transition`}
                    >
                      <td className="p-3">{globalIndex}</td>
                      <td className="p-3 flex items-center gap-2 font-semibold">
                        {getIcon(l.action)} {l.action}
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
                        {formatDate(l.timestamp)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="p-8 text-center text-gray-500 italic"
                  >
                    No logs found.
                  </td>
                </tr>
              )}

              {/* loading more row */}
              {loadingChunk && allLogs.length > 0 && (
                <tr>
                  <td colSpan="8" className="p-4 text-center">
                    <Loader2 className="animate-spin inline-block mr-2 text-[#ff004f]" />{" "}
                    Loading more...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {loadingInitial && allLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Loader2 className="animate-spin mr-2 inline-block text-[#ff004f]" />{" "}
            Loading logs...
          </div>
        ) : visibleLogs.length > 0 ? (
          visibleLogs.map((l, idx) => (
            <div
              key={l._id || idx}
              className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[#ff004f] font-semibold">
                  {getIcon(l.action)}
                  <span className="text-sm">{l.action}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(l.timestamp)}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-2">{l.details || "—"}</p>

              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-semibold">User:</span>{" "}
                  {l.userName || "—"}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {l.email || "—"}
                </p>
                <p>
                  <span className="font-semibold">Role:</span> {l.role || "—"}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    l.status
                  )}`}
                >
                  {l.status}
                </span>
                <button
                  onClick={() => {
                    // quick single-log CSV download
                    const csv = `"Action","Details","User","Email","Role","Status","Timestamp"\n"${(
                      l.action || ""
                    ).replace(/"/g, '""')}","${(l.details || "").replace(
                      /"/g,
                      '""'
                    )}","${(l.userName || "").replace(/"/g, '""')}","${(
                      l.email || ""
                    ).replace(/"/g, '""')}","${(l.role || "").replace(
                      /"/g,
                      '""'
                    )}","${(l.status || "").replace(/"/g, '""')}","${(
                      l.timestamp || ""
                    ).replace(/"/g, '""')}"`;
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `log_${l._id || idx}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-sm text-[#ff004f] hover:underline"
                >
                  Download
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic">No logs found.</p>
        )}
      </div>

      {/* Pagination controls */}
      {usePagination && pageCount > 1 && (
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => gotoPage(Math.max(1, page - 1))}
              className="px-3 py-1 border rounded-md"
              disabled={page === 1}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            {/* page numbers, show sliding window */}
            <div className="flex items-center gap-2 px-2">
              {(() => {
                const maxVisible = 7;
                let start = Math.max(1, page - Math.floor(maxVisible / 2));
                let end = Math.min(pageCount, start + maxVisible - 1);
                if (end - start + 1 < maxVisible)
                  start = Math.max(1, end - maxVisible + 1);
                const arr = [];
                for (let i = start; i <= end; i++) arr.push(i);
                return arr.map((p) => (
                  <button
                    key={p}
                    onClick={() => gotoPage(p)}
                    className={`px-3 py-1 rounded-md ${
                      p === page ? "bg-[#ff004f] text-white" : "border bg-white"
                    }`}
                  >
                    {p}
                  </button>
                ));
              })()}
            </div>

            <button
              onClick={() => gotoPage(Math.min(pageCount, page + 1))}
              className="px-3 py-1 border rounded-md"
              disabled={page === pageCount}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Showing <strong>{visibleLogs.length}</strong> logs (filtered{" "}
            <strong>{filteredLogs.length}</strong> total){" "}
            {totalCount ? ` — backend total ${totalCount}` : ""} — Page {page}
            {pageCount ? ` / ${pageCount}` : ""}
          </div>
        </div>
      )}

      {/* sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-8" />

      {/* error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-100 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
