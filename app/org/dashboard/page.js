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
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function OrgAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const COLORS = {
    completed: "#22c55e",
    ongoing: "#f59e0b",
    failed: "#ef4444",
    primary: "#3b82f6",
    secondary: "#f59e0b",
    final: "#22c55e",
  };

  /* -------------------- Fetch Dashboard Data -------------------- */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/dashboard`, {
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

  /* -------------------- Loading & Error States -------------------- */
  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-96 text-gray-600">
        <Loader2 className="animate-spin text-[#ff004f] mb-2" size={32} />
        <p>Loading dashboard...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-96 text-red-600 gap-2">
        <AlertCircle /> {error}
      </div>
    );

  if (!data)
    return (
      <div className="flex justify-center items-center h-96 text-red-600">
        Failed to load dashboard data.
      </div>
    );

  /* -------------------- Prepare Data -------------------- */
  const { role, stats } = data;

  const summaryStats = [
    {
      label: "Total Employees",
      value: stats?.totalEmployees || 0,
      color: "#5B6C8F",
    },
    {
      label: "Total Requests",
      value: stats?.totalRequests || 0,
      color: "#007BFF",
    },
    {
      label: "Ongoing Verifications",
      value: stats?.ongoingVerifications || 0,
      color: COLORS.ongoing,
    },
    {
      label: "Completed Verifications",
      value: stats?.completedVerifications || 0,
      color: COLORS.completed,
    },
    {
      label: "Failed Verifications",
      value: stats?.failedVerifications || 0,
      color: COLORS.failed,
    },
  ];

  const pieData = [
    {
      name: "Completed",
      value: stats?.completedVerifications || 0,
      color: COLORS.completed,
    },
    {
      name: "Ongoing",
      value: stats?.ongoingVerifications || 0,
      color: COLORS.ongoing,
    },
    {
      name: "Failed",
      value: stats?.failedVerifications || 0,
      color: COLORS.failed,
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

  const recentActivities = [
    {
      id: 1,
      user: "John HR",
      action: "Completed verification for Ravi Kumar",
      time: "2 hrs ago",
      status: "Completed",
    },
    {
      id: 2,
      user: "Alice Employer",
      action: "Added new employee Priya Sharma",
      time: "5 hrs ago",
      status: "Update",
    },
    {
      id: 3,
      user: "Sam Super",
      action: "Flagged a suspicious record",
      time: "1 day ago",
      status: "Redflag",
    },
  ];

  /* -------------------- UI -------------------- */
  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen text-gray-900 transition-all">
      {/* Header + Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-[#ff004f] mb-4 sm:mb-0">
          {role === "ORG_HR" ? "HR Dashboard" : "Organization Dashboard"}
        </h1>

        {/* 🔍 View Verifications Button */}
        <Link
          href="/org/verifications"
          className="flex items-center gap-2 bg-[#ff004f] text-white px-5 py-2 rounded-xl shadow hover:bg-[#e60045] transition"
        >
          <span>View Verifications</span>
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {summaryStats.map((s, idx) => (
          <Card key={idx} title={s.label} value={s.value} color={s.color} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Stage Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Stage-wise Verification Breakdown
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="stage" stroke="#555" />
                <YAxis allowDecimals={false} stroke="#555" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="primary"
                  fill={COLORS.primary}
                  name="Primary"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="secondary"
                  fill={COLORS.secondary}
                  name="Secondary"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="final"
                  fill={COLORS.final}
                  name="Final"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Verification Status Overview
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Recent Activity
        </h2>
        <div className="flex flex-col gap-2">
          {recentActivities.map((a) => (
            <div
              key={a.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg hover:shadow-md transition text-gray-900"
            >
              <span>
                {a.user} {a.action}
              </span>
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  a.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : a.status === "Update"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Card Component -------------------- */
function Card({ title, value, color }) {
  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1 border-l-8 flex flex-col items-center justify-center p-5 min-h-[120px]"
      style={{ borderColor: color }}
    >
      <h2 className="text-2xl font-bold text-gray-800">{value}</h2>
      <p className="text-gray-700 font-medium mt-2 text-center text-sm sm:text-base">
        {title}
      </p>
    </div>
  );
}
