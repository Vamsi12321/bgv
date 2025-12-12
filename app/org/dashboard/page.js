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
            .map((log) => {
              return {
                ...log,
                user: log.userName ?? "Unknown User",
                actionText: buildActivityMessage(log),
                time: timeAgo(log.timestamp),
                icon: getLogIcon(log.action).icon,
                iconColor: getLogIcon(log.action).color,
              };
            })
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
    const userName = log.userName || "Unknown User";
    const orgName = log.organizationName || "organization";
    const action = log.action || "performed action";
    const description = log.description || "";

    // Parse different types of activities
    if (action === "Verification Check Executed") {
      // Extract check name, stage, status, and candidate from description
      const checkMatch = description.match(/Check: ([^|]+)/);
      const stageMatch = description.match(/Stage: ([^|]+)/);
      const statusMatch = description.match(/Status: ([^|]+)/);
      const candidateMatch = description.match(/candidate: ([^|]+)/);

      const checkName = checkMatch ? checkMatch[1].trim().replace(/_/g, ' ') : 'verification';
      const stage = stageMatch ? stageMatch[1].trim() : '';
      const status = statusMatch ? statusMatch[1].trim() : '';
      const candidate = candidateMatch ? candidateMatch[1].trim() : '';

      // Format check name to be more readable
      const formattedCheckName = formatCheckName(checkName);
      
      // Add status-specific context
      let statusContext = '';
      if (status === 'FAILED') {
        statusContext = ' - requires attention';
      } else if (status === 'PENDING') {
        statusContext = ' - awaiting manual review';
      } else if (status === 'COMPLETED') {
        statusContext = ' - successfully verified';
      }

      return `${userName} executed ${formattedCheckName} for ${candidate} in ${stage} stage (${status})${statusContext}`;
    }

    if (action === "Add Candidate") {
      const candidateMatch = description.match(/candidate: ([^|]+)/);
      const orgMatch = description.match(/organization: ([^|]+)/);
      const candidate = candidateMatch ? candidateMatch[1].trim() : 'new candidate';
      const organization = orgMatch ? orgMatch[1].trim() : orgName;
      return `${userName} added candidate ${candidate} to ${organization}`;
    }

    if (action === "Edit Candidate") {
      const candidateMatch = description.match(/Updated candidate: ([^|]+)/);
      const candidate = candidateMatch ? candidateMatch[1].trim() : 'candidate';
      return `${userName} updated candidate ${candidate}'s information in ${orgName}`;
    }

    if (action === "New Verification Initiated") {
      const candidateMatch = description.match(/candidate: ([^|]+)/);
      const candidate = candidateMatch ? candidateMatch[1].trim() : '';
      return `${userName} initiated background verification process for ${candidate} at ${orgName}`;
    }

    if (action === "Stage Initialized") {
      const stageMatch = description.match(/Stage: ([^|]+)/);
      const candidateMatch = description.match(/candidate: ([^|]+)/);
      const stage = stageMatch ? stageMatch[1].trim() : '';
      const candidate = candidateMatch ? candidateMatch[1].trim() : '';
      return `${userName} started ${stage} verification stage for ${candidate} at ${orgName}`;
    }

    if (action === "Self Verification Email Sent") {
      const candidateMatch = description.match(/candidate: ([^|]+)/);
      const candidate = candidateMatch ? candidateMatch[1].trim() : '';
      return `${userName} sent self-verification email to ${candidate} for ${orgName} verification process`;
    }

    if (action === "Login") {
      return `${userName} logged into ${orgName} dashboard`;
    }

    if (action === "Logout") {
      return `${userName} logged out from ${orgName} dashboard`;
    }

    if (action === "Add User") {
      return `${userName} added a new team member to ${orgName}`;
    }

    if (action === "Delete Candidate") {
      const candidateMatch = description.match(/candidate: ([^|]+)/);
      const candidate = candidateMatch ? candidateMatch[1].trim() : '';
      return `${userName} removed candidate ${candidate} from ${orgName}`;
    }

    if (action === "Retry Check") {
      const checkMatch = description.match(/Check: ([^|]+)/);
      const candidateMatch = description.match(/candidate: ([^|]+)/);
      const checkName = checkMatch ? checkMatch[1].trim().replace(/_/g, ' ') : 'check';
      const candidate = candidateMatch ? candidateMatch[1].trim() : '';
      const formattedCheckName = formatCheckName(checkName);
      return `${userName} retried ${formattedCheckName} verification for ${candidate} at ${orgName}`;
    }

    if (action === "Run Stage Failed") {
      const candidateMatch = description.match(/candidate: ([^|]+)/);
      const stageMatch = description.match(/Stage: ([^|]+)/);
      const candidate = candidateMatch ? candidateMatch[1].trim() : '';
      const stage = stageMatch ? stageMatch[1].trim() : '';
      return `${userName} encountered issues running ${stage} stage for ${candidate} at ${orgName}`;
    }

    if (action === "Password Reset Failed") {
      return `${userName} attempted password reset for ${orgName} account - failed`;
    }

    if (action === "Updated Organization") {
      return `${userName} updated ${orgName} organization settings`;
    }

    if (action === "Added Helper User") {
      return `${userName} added a helper user to ${orgName} team`;
    }

    if (action === "Updated User") {
      return `${userName} updated user information in ${orgName}`;
    }

    // Generic fallback for other actions
    return `${userName} performed ${action.toLowerCase()} at ${orgName}`;
  }

  // Helper function to format check names
  function formatCheckName(checkName) {
    const checkNameMap = {
      'pan_verification': 'PAN Card verification',
      'pan_aadhaar_seeding': 'PAN-Aadhaar linking verification',
      'verify_pan_to_uan': 'PAN to UAN verification',
      'employment_history': 'Employment history verification',
      'credit_report': 'Credit report verification',
      'court_record': 'Court record verification',
      'address_verification': 'Address verification',
      'supervisory_check_1': 'Supervisory reference check #1',
      'supervisory_check_2': 'Supervisory reference check #2',
      'education_check_manual': 'Education verification',
      'employment_history_manual': 'Employment history verification',
      'employment_history_manual_2': 'Employment history verification #2',
      'ai_education_validation': 'AI-powered education validation',
      'ai_cv_validation': 'AI-powered CV validation'
    };

    return checkNameMap[checkName] || checkName.replace(/_/g, ' ');
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

    // Verification Check Executed - use status-based colors
    if (lower.includes("verification check executed")) {
      return { icon: "🔍", color: "text-blue-600" };
    }

    // Failed actions
    if (lower.includes("fail") || lower.includes("error")) {
      return { icon: "🔴", color: "text-red-600" };
    }

    // Add/Create actions
    if (lower.includes("add") || lower.includes("create") || lower.includes("new")) {
      return { icon: "➕", color: "text-green-600" };
    }

    // Update/Edit actions
    if (lower.includes("update") || lower.includes("edit")) {
      return { icon: "✏️", color: "text-orange-600" };
    }

    // Delete actions
    if (lower.includes("delete")) {
      return { icon: "🗑️", color: "text-red-600" };
    }

    // Login/Logout
    if (lower.includes("login")) {
      return { icon: "🔑", color: "text-green-600" };
    }
    if (lower.includes("logout")) {
      return { icon: "🚪", color: "text-gray-600" };
    }

    // Email/Communication
    if (lower.includes("email") || lower.includes("sent")) {
      return { icon: "📧", color: "text-blue-600" };
    }

    // Stage/Process actions
    if (lower.includes("stage") || lower.includes("initiat")) {
      return { icon: "🚀", color: "text-purple-600" };
    }

    // Retry actions
    if (lower.includes("retry")) {
      return { icon: "🔄", color: "text-yellow-600" };
    }

    // Default
    return { icon: "📋", color: "text-gray-600" };
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-3 sm:p-4">
      <PageHeader
        title={role === "ORG_HR" ? "HR Dashboard" : "Verifications Overview"}
        subtitle="Monitor and manage your verification activities in real-time"
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
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff004f] to-[#ff3366] rounded-lg flex items-center justify-center shadow-md">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
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
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Activity size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
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
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Activity size={20} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Recent Activity
          </h2>
        </div>

        {activityLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#ff004f] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium text-sm">Loading activities...</p>
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
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200"></div>
        {title}
        <div className="h-px flex-1 bg-gray-200"></div>
      </h3>

      <div className="space-y-2">
        {logs.map((a, i) => (
          <div
            key={i}
            className="flex justify-between items-start bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 p-4 rounded-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className={`text-base ${a.iconColor} flex-shrink-0`}>{a.icon}</span>

              <p className="text-sm text-gray-700 leading-relaxed font-medium">
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
