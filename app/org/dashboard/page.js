"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  Users,
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
import { useOrgState } from "../../context/OrgStateContext";



export default function OrgAdminDashboard() {
  const {
    dashboardData: data,
    setDashboardData: setData,
    dashboardLoading: loading,
    setDashboardLoading: setLoading,
  } = useOrgState();

  const [error, setError] = useState("");

  const [recentActivities, setRecentActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  /* ---------------------------------------------------
     FETCH RECENT ACTIVITY
  --------------------------------------------------- */
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setActivityLoading(true);

        const res = await fetch(
          `/api/proxy/secure/recentImportantActivity?noOfLogs=200`,
          { credentials: "include" }
        );

        const data = await res.json();

        if (res.ok && Array.isArray(data.logs)) {
          const formatted = data.logs
            .map((log) => ({
              ...log,
              user: log.userName ?? "Unknown User",
              actionText: buildActivityMessage(log),
              time: timeAgo(log.timestamp),
              icon: getLogIcon(log.action).icon,
              iconColor: getLogIcon(log.action).color,
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

  /* ---------------------------------------------------
     FETCH DASHBOARD DATA
  --------------------------------------------------- */
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Only fetch if we don't have cached data
      if (data) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/proxy/dashboard`, {
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.detail || "Failed to load data");
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  /* ---------------------------------------------------
     LOADING UI
  --------------------------------------------------- */
  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#ff004f] border-t-transparent"></div>
          <div className="absolute inset-0 rounded-full bg-[#ff004f]/20 animate-ping"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">Loading dashboard...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertCircle className="text-red-600 mb-3" size={38} />
        <h3 className="text-xl font-semibold text-gray-900 mb-1">
          Error Loading Dashboard
        </h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertCircle className="text-red-600 mb-3" size={38} />
        <h3 className="text-xl font-semibold text-gray-900 mb-1">
          No Data Available
        </h3>
        <p className="text-gray-600">Failed to load dashboard data.</p>
      </div>
    );

  /* ---------------------------------------------------
     PREPARE DATA
  --------------------------------------------------- */
  const { role, stats } = data;

  const COLORS = {
    completed: "#22c55e",
    ongoing: "#f59e0b",
    failed: "#ef4444",
    primary: "#3b82f6",
    secondary: "#f59e0b",
    final: "#22c55e",
  };

  const summaryStats = [
    {
      label: "Total Employees",
      value: stats?.totalEmployees || 0,
      color: "#5B6C8F",
      icon: Users,
    },
    {
      label: "Total Requests",
      value: stats?.totalRequests || 0,
      color: "#007BFF",
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

  const pieData = [
    {
      name: "Completed",
      value: stats?.completedVerifications || 0,
    },
    {
      name: "Ongoing",
      value: stats?.ongoingVerifications || 0,
    },
    {
      name: "Failed",
      value: stats?.failedVerifications || 0,
    },
  ];

  const stageData = [
    {
      stage: "Verification Stages",
      primary: stats?.stageBreakdown?.primary || 0,
      secondary: stats?.stageBreakdown?.secondary || 0,
      final: stats?.stageBreakdown?.final || 0,
    },
  ];

  /* ---------------------------------------------------
     ACTIVITY HELPERS
  --------------------------------------------------- */
  function buildActivityMessage(log) {
    const user = log.userEmail?.split("@")[0] || "Someone";
    const action = log.action || "did something";

    let desc = log.description || "";
    desc = desc.replace(/'/g, "").replace(/\|/g, " — ").trim();

    if (action === "Add Candidate") {
      return `${user} added candidate`;
    }

    return `${user} — ${action} — ${desc}`;
  }

  function timeAgo(input) {
    const now = new Date();
    const past = new Date(input);
    const diff = (now - past) / 1000;

    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

    return past.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getLogIcon(action) {
    const lower = action.toLowerCase();

    if (lower.includes("fail") || lower.includes("error")) {
      return { icon: "🔴", color: "text-red-600" };
    }

    if (lower.includes("add") || lower.includes("update")) {
      return { icon: "🟠", color: "text-orange-600" };
    }

    return { icon: "🟢", color: "text-green-600" };
  }

  function groupByDate(logs) {
    const today = [];
    const yesterday = [];
    const last7 = [];
    const older = [];

    const now = new Date();

    logs.forEach((log) => {
      const d = new Date(log.timestamp);
      const diffDays = (now - d) / (1000 * 60 * 60 * 24);

      if (diffDays < 1) today.push(log);
      else if (diffDays < 2) yesterday.push(log);
      else if (diffDays < 7) last7.push(log);
      else older.push(log);
    });

    return { today, yesterday, last7, older };
  }

  /* ---------------------------------------------------
     UI STARTS HERE
  --------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <PageHeader
        title={role === "ORG_HR" ? "HR Dashboard" : "Verifications Overview"}
        subtitle="Monitor and manage your verification activities"
        action={
          <Link href="/org/verifications">
            <Button variant="primary" icon={ArrowRight} iconPosition="right">
              View All Verifications
            </Button>
          </Link>
        }
      />

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        {summaryStats.map((s, idx) => (
          <StatsCard
            key={idx}
            title={s.label}
            value={s.value}
            color={s.color}
            icon={s.icon}
            iconSize={18} // ⬅️ Option B size
          />
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* STAGE BAR CHART */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#ff004f]" />
            <h2 className="text-base text-black font-semibold">
              Stage Breakdown
            </h2>
          </div>

          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="primary" fill="#3b82f6" radius={6} />
                <Bar dataKey="secondary" fill="#f59e0b" radius={6} />
                <Bar dataKey="final" fill="#22c55e" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[#ff004f]" />
            <h2 className="text-base text-black font-semibold">
              Status Overview
            </h2>
          </div>

          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-[#ff004f]" />
          <h2 className="text-base text-black font-semibold">
            Recent Activity
          </h2>
        </div>

        {activityLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin text-[#ff004f]" size={18} />
          </div>
        ) : (
          (() => {
            const grouped = groupByDate(recentActivities);

            return (
              <div className="space-y-6">
                {grouped.today.length > 0 && (
                  <ActivityGroup title="Today" logs={grouped.today} />
                )}
                {grouped.yesterday.length > 0 && (
                  <ActivityGroup title="Yesterday" logs={grouped.yesterday} />
                )}
                {grouped.last7.length > 0 && (
                  <ActivityGroup title="Last 7 Days" logs={grouped.last7} />
                )}
                {grouped.older.length > 0 && (
                  <ActivityGroup title="Older" logs={grouped.older} />
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   ACTIVITY GROUP COMPONENT
--------------------------------------------------- */
function ActivityGroup({ title, logs }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
        {title}
      </h3>

      <div className="space-y-2">
        {logs.map((a, i) => (
          <div
            key={i}
            className="flex justify-between items-start bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition"
          >
            <div className="flex items-start gap-2">
              <span className={`text-[14px] ${a.iconColor}`}>{a.icon}</span>

              <p className="text-sm text-gray-700 leading-snug">
                {a.actionText}
              </p>
            </div>

            <span className="text-gray-500 text-[11px]">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
