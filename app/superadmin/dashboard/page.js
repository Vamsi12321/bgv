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
      setStats(data.stats);
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
            label: "Total Organizations",
            value: stats?.totalOrganizations || 0,
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
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-8">
        {/* HEADER */}
        <PageHeader
          title="Verifications Overview"
          subtitle="Monitor and manage verification activities across all organizations"
         
          action={
            <Link href="/superadmin/verifications">
              <Button variant="primary" icon={ArrowRight} iconPosition="right">
                View All Verifications
              </Button>
            </Link>
          }
        />

        {/* ORG DROPDOWN */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Select Organization
          </label>
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

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* BAR CHART */}
          <div className="bg-white rounded-xl p-6 shadow border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#ff004f]/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-[#ff004f]" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Stage-wise Verification Breakdown
              </h2>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData}>
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
                      <stop offset="0%" stopColor={e.color} stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor={e.color}
                        stopOpacity={0.4}
                      />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="stage" tick={{ fill: "#444" }} />
                <YAxis tick={{ fill: "#444" }} />

                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid #eee",
                  }}
                />

                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {barData.map((e, i) => (
                    <Cell key={i} fill={`url(#barGrad${i})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* PIE CHART */}
          <div className="bg-white rounded-xl p-6 shadow border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#ff004f]/10 flex items-center justify-center">
                <Activity size={20} className="text-[#ff004f]" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Verification Status Overview
              </h2>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ value }) => value}
                >
                  {pieData.map((e, i) => (
                    <Cell
                      key={i}
                      fill={e.color}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid #eee",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ACTIVITY LOG */}
        <div className="bg-white rounded-xl p-6 shadow border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#ff004f]/10 flex items-center justify-center">
              <Activity size={20} className="text-[#ff004f]" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
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
