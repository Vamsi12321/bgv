"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  LayoutDashboard
} from "lucide-react";
import StatsCard from "../../components/StatsCard";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/ui/Button";
import { useSuperAdminState } from "../../context/SuperAdminStateContext";



/* ================================================
   SEARCHABLE DROPDOWN
================================================ */
function SearchableDropdown({ orgs, selectedOrg, setSelectedOrg }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = orgs.filter((org) =>
    org.organizationName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-xs">
      <div
        onClick={() => setOpen(!open)}
        className="border border-gray-300 rounded-full px-4 py-2 bg-white shadow-sm cursor-pointer flex items-center justify-between text-black"
      >
        <span>
          {selectedOrg === "Global"
            ? "🌐 Global Overview"
            : `🏢 ${orgs.find((o) => o._id === selectedOrg)?.organizationName}`}
        </span>
        <span className="text-gray-500">▾</span>
      </div>

      {open && (
        <div className="absolute mt-2 w-full bg-white border border-gray-300 rounded-xl shadow-lg z-20 max-h-64 overflow-auto">
          {/* SEARCH */}
          <div className="p-2 sticky top-0 bg-white border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Search organization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#ff004f] text-black"
              />
              <svg
                className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 12.65z"
                />
              </svg>
            </div>
          </div>

          {/* OPTIONS */}
          <div className="max-h-48 overflow-y-auto">
            <div
              onClick={() => {
                setSelectedOrg("Global");
                setOpen(false);
              }}
              className="px-4 py-2 hover:bg-gray-100 text-black cursor-pointer"
            >
              🌐 Global Overview
            </div>

            {filtered.length > 0 ? (
              filtered.map((org) => (
                <div
                  key={org._id}
                  onClick={() => {
                    setSelectedOrg(org._id);
                    setOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 text-black cursor-pointer"
                >
                  🏢 {org.organizationName}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No matching organizations
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================
   MAIN DASHBOARD
================================================ */
export default function SuperAdminDashboard() {
  const {
    selectedOrg,
    setSelectedOrg,
    dashboardData: stats,
    setDashboardData: setStats,
    dashboardLoading: loading,
    setDashboardLoading: setLoading,
  } = useSuperAdminState();

  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState("");
  const [recentActivities, setRecentActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const COLORS = {
    total: "#5B6C8F",
    ongoing: "#007BFF",
    completed: "#28A745",
    failed: "#DC3545",
  };

  const STAGE_COLORS = {
    primary: "#6F42C1",
    secondary: "#FD7E14",
    final: "#20C997",
  };

  /* =============== FETCH ACTIVITY LOGS =============== */
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setActivityLoading(true);

        const res = await fetch(
          `/api/proxy/secure/recentImportantActivity?noOfLogs=200`,
          { credentials: "include" }
        );

        const json = await res.json();

        if (res.ok && Array.isArray(json.logs)) {
          const formatted = json.logs
            .map((log) => ({
              ...log,
              user: log.userName || log.userEmail || "Unknown User",
              actionText: buildReadableMessage(log),
              time: timeAgo(log.timestamp),
              ...getLogIcon(log.action, log.status),
            }))
            .slice(0, 10);

          setRecentActivities(formatted);
        }
      } catch (err) {
        console.error("Recent activity error:", err);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchRecent();
    const interval = setInterval(fetchRecent, 60000);
    return () => clearInterval(interval);
  }, []);

  /* =============== FETCH ORGS =============== */
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const res = await fetch(`/api/proxy/secure/getOrganizations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail);
        setOrgs(data.organizations || []);
      } catch (err) {
        setError(err.message);
      }
    };

    loadOrgs();
  }, []);

  /* =============== FETCH STATS =============== */
  const fetchStats = async (orgId = null) => {
    try {
      setLoading(true);
      setError("");

      const url = orgId
        ? `/api/proxy/dashboard?organizationId=${orgId}`
        : `/api/proxy/dashboard`;

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail);
      
      // Handle different response structures
      // For SUPER_ADMIN_HELPER: data has role, stats nested inside
      // For others: data.stats directly
      console.log("Dashboard API Response:", data);
      
      // Capture user role if present
      if (data.role) {
        setUserRole(data.role);
      }
      
      if (data.role === "SUPER_ADMIN_HELPER" && data.stats) {
        console.log("Setting stats for SUPER_ADMIN_HELPER:", data.stats);
        setStats(data.stats);
      } else if (data.stats) {
        console.log("Setting stats from data.stats:", data.stats);
        setStats(data.stats);
      } else {
        // Fallback: if data itself contains the stats properties
        console.log("Setting stats from data directly:", data);
        setStats(data);
      }
      
      console.log("Stats state after setting:", stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedOrg === "Global" ? null : selectedOrg);
  }, [selectedOrg]);

  /* ================================================
     ACTIVITY UTILITIES
  ================================================ */
  function buildReadableMessage(log) {
    const user = log.userName || log.userEmail || "Unknown User";
    const action = log.action || "";
    const desc = log.description || "";

    const check = desc.match(/Check:\s([^|]+)/)?.[1]?.trim();
    const stage = desc.match(/Stage:\s([^|]+)/)?.[1]?.trim();
    const status = desc.match(/Status:\s([^|]+)/)?.[1]?.trim();

    if (action === "Verification Check Executed") {
      return `${user} executed ${check || "a check"} (Stage: ${
        stage || "N/A"
      }, Status: ${status || "N/A"})`;
    }

    if (action && desc) return `${user} ${action} — ${desc}`;

    return `${user} ${action}`;
  }

  function timeAgo(input) {
    const diff = (Date.now() - new Date(input)) / 1000;

    if (diff < 60) return `${Math.floor(diff)} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;

    return new Date(input).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getLogIcon(action, status) {
    const a = (action || "").toLowerCase();
    const s = (status || "").toLowerCase();

    if (s === "failed" || a.includes("failed"))
      return { icon: "🔴", color: "text-red-600" };

    if (a.includes("executed")) return { icon: "🟢", color: "text-green-600" };

    if (a.includes("initiated") || a.includes("added") || a.includes("created"))
      return { icon: "🟠", color: "text-orange-600" };

    if (a.includes("login") || a.includes("logout"))
      return { icon: "🔵", color: "text-blue-600" };

    return { icon: "⚪", color: "text-gray-500" };
  }

  function groupByDate(logs) {
    const now = new Date();

    const groups = { today: [], yesterday: [], last7: [], older: [] };

    logs.forEach((log) => {
      const d = new Date(log.timestamp);
      const diffDays = (now - d) / (1000 * 60 * 60 * 24);

      if (diffDays < 1) groups.today.push(log);
      else if (diffDays < 2) groups.yesterday.push(log);
      else if (diffDays < 7) groups.last7.push(log);
      else groups.older.push(log);
    });

    return groups;
  }

  /* ================================================
     LOADING STATES
  ================================================ */
  if (loading && !stats)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="animate-spin h-16 w-16 border-4 border-[#ff004f] border-t-transparent rounded-full" />
        <p className="mt-6 text-gray-600">Loading dashboard...</p>
      </div>
    );

  if (error && !stats)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <AlertCircle size={48} className="text-red-600 mb-4" />
        <p className="text-gray-600">{error}</p>
      </div>
    );

  /* ================================================
     RENDER UI
  ================================================ */
  const statsData = [
    ...(selectedOrg === "Global"
      ? [
          {
            label: userRole === "SUPER_ADMIN_HELPER" 
              ? "Accessible Organizations" 
              : "Total Organizations",
            value: userRole === "SUPER_ADMIN_HELPER"
              ? stats?.accessibleOrganizations || 0
              : stats?.totalOrganizations || 0,
            color: "#ff004f",
            icon: Building2,
          },
        ]
      : []),
    {
      label: "Total Requests",
      value: stats?.totalRequests || 0,
      color: COLORS.total,
      icon: ClipboardList,
    },
    {
      label: "Ongoing",
      value: stats?.ongoingVerifications || 0,
      color: COLORS.ongoing,
      icon: Clock,
    },
    {
      label: "Completed",
      value: stats?.completedVerifications || 0,
      color: COLORS.completed,
      icon: CheckCircle2,
    },
    {
      label: "Failed",
      value: stats?.failedVerifications || 0,
      color: COLORS.failed,
      icon: XCircle,
    },
  ];

  const barData = [
    {
      stage: "Primary",
      value: stats?.stageBreakdown?.primary || 0,
      color: STAGE_COLORS.primary,
    },
    {
      stage: "Secondary",
      value: stats?.stageBreakdown?.secondary || 0,
      color: STAGE_COLORS.secondary,
    },
    {
      stage: "Final",
      value: stats?.stageBreakdown?.final || 0,
      color: STAGE_COLORS.final,
    },
  ];

  const pieData = [
    {
      name: "Total",
      value: stats?.totalRequests || 0,
      color: COLORS.total,
    },
    {
      name: "Ongoing",
      value: stats?.ongoingVerifications || 0,
      color: COLORS.ongoing,
    },
    {
      name: "Completed",
      value: stats?.completedVerifications || 0,
      color: COLORS.completed,
    },
    {
      name: "Failed",
      value: stats?.failedVerifications || 0,
      color: COLORS.failed,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Loading Overlay when switching organizations */}
      {loading && stats && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[#ff004f]" size={48} />
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Loading Dashboard</h3>
                <p className="text-sm text-gray-600">Fetching organization data...</p>
              </div>
            </div>
          </div>
        </>
      )}
      
      <div className="p-4 sm:p-6 lg:p-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutDashboard size={24} className="text-[#ff004f]" />
              Dashboard
            </h1>
            <p className="text-gray-600 text-sm mt-1">Monitor verification activities</p>
          </div>

          <Link href="/superadmin/verifications">
            <button 
              onClick={() => setNavigating(true)}
              disabled={navigating}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold w-full sm:w-auto shadow transition-all hover:shadow-lg bg-[#ff004f] hover:bg-[#e60047] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {navigating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Please wait...
                </>
              ) : (
                <>
                  View All
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </Link>
        </div>

        {/* SUPERB ORG DROPDOWN */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-white p-6 rounded-2xl shadow-xl border-2 border-gray-100 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-[#ff004f]/10 to-[#ff3366]/10 rounded-lg">
              <Building2 size={20} className="text-[#ff004f]" />
            </div>
            <label className="text-base font-bold text-gray-800">
              Select Organization
            </label>
          </div>
          <SearchableDropdown
            orgs={orgs}
            selectedOrg={selectedOrg}
            setSelectedOrg={setSelectedOrg}
          />
        </div>

        {/* STAT CARDS */}
        <div
          className={`grid gap-6 mb-8 ${
            selectedOrg === "Global"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {statsData.map((stat, idx) => (
            <StatsCard
              key={idx}
              title={stat.label}
              value={stat.value}
              color={stat.color}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* ENHANCED CHARTS WITH BETTER STYLING */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* BAR CHART - ENHANCED */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-6 shadow-2xl border-2 border-gray-100 hover:shadow-3xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff004f] to-[#ff3366] flex items-center justify-center shadow-lg">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Stage-wise Breakdown
                </h2>
                <p className="text-xs text-gray-600">Verification stages distribution</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-inner">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <defs>
                    {barData.map((e, i) => (
                      <linearGradient
                        key={i}
                        id={`barGrad${i}`}
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={e.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={e.color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="stage" 
                    tick={{ fill: "#374151", fontWeight: 600, fontSize: 13 }}
                    axisLine={{ stroke: "#d1d5db" }}
                  />
                  <YAxis 
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#d1d5db" }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
                      borderRadius: 12,
                      border: "2px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      fontWeight: 600,
                    }}
                    cursor={{ fill: "rgba(255, 0, 79, 0.05)" }}
                  />

                  <Bar dataKey="value" radius={[16, 16, 0, 0]} maxBarSize={80}>
                    {barData.map((e, i) => (
                      <Cell key={i} fill={`url(#barGrad${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PIE CHART - ENHANCED */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-6 shadow-2xl border-2 border-gray-100 hover:shadow-3xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff004f] to-[#ff3366] flex items-center justify-center shadow-lg">
                <Activity size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Status Overview
                </h2>
                <p className="text-xs text-gray-600">Current verification status</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-inner">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <defs>
                    {pieData.map((e, i) => (
                      <linearGradient
                        key={i}
                        id={`pieGrad${i}`}
                        x1="0"
                        x2="1"
                        y1="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={e.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={e.color} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={115}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value, percent }) => 
                      value > 0 ? `${value} (${(percent * 100).toFixed(0)}%)` : ""
                    }
                    labelLine={{ stroke: "#9ca3af", strokeWidth: 2 }}
                  >
                    {pieData.map((e, i) => (
                      <Cell
                        key={i}
                        fill={`url(#pieGrad${i})`}
                        stroke="#fff"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
                      borderRadius: 12,
                      border: "2px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      fontWeight: 600,
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ 
                      paddingTop: "20px",
                      fontWeight: 600,
                      fontSize: "13px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SUPERB ACTIVITY LOG */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff004f]/10 to-[#ff3366]/10 flex items-center justify-center shadow-sm">
              <Activity size={24} className="text-[#ff004f]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Recent Activity
            </h2>
          </div>

          {activityLoading ? (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="animate-spin mx-auto mb-3" size={24} />
              Loading recent activity...
            </div>
          ) : (
            <ActivitySection logs={recentActivities} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================
   ACTIVITY GROUPING COMPONENT
================================================ */
function ActivitySection({ logs }) {
  const groups = groupBy(logs);

  return (
    <div className="space-y-6">
      {groups.today.length > 0 && (
        <ActivityGroup title="Today" logs={groups.today} />
      )}
      {groups.yesterday.length > 0 && (
        <ActivityGroup title="Yesterday" logs={groups.yesterday} />
      )}
      {groups.last7.length > 0 && (
        <ActivityGroup title="Last 7 Days" logs={groups.last7} />
      )}
      {groups.older.length > 0 && (
        <ActivityGroup title="Older" logs={groups.older} />
      )}
    </div>
  );
}

function groupBy(logs) {
  const now = new Date();

  const groups = {
    today: [],
    yesterday: [],
    last7: [],
    older: [],
  };

  logs.forEach((log) => {
    const diff = (now - new Date(log.timestamp)) / (1000 * 60 * 60 * 24);

    if (diff < 1) groups.today.push(log);
    else if (diff < 2) groups.yesterday.push(log);
    else if (diff < 7) groups.last7.push(log);
    else groups.older.push(log);
  });

  return groups;
}

function ActivityGroup({ title, logs }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
        {title}
      </h3>

      <div className="space-y-2">
        {logs.map((a) => (
          <div
            key={a._id || a.timestamp || Math.random()}
            className="flex items-start justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="flex gap-3 items-start flex-1">
              <span className={`text-lg ${a.color}`}>{a.icon}</span>
              <span className="text-gray-700 text-sm">{a.actionText}</span>
            </div>

            <span className="text-gray-500 text-xs ml-4">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
