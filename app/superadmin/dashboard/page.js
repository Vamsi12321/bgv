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
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

const API_BASE = "https://maihoo.onrender.com";

export default function SuperAdminDashboard() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("Global");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const COLORS = {
    total: "#5B6C8F",
    ongoing: "#007BFF",
    completed: "#28A745",
    failed: "#DC3545",
  };

  const STAGE_COLORS = {
    primary: "#6F42C1", // Purple
    secondary: "#FD7E14", // Orange
    final: "#20C997", // Aqua Green
  };

  /* -------------------- Fetch Organizations -------------------- */
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await fetch(`${API_BASE}/secure/getOrganizations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load orgs");
        setOrgs(data.organizations || []);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchOrganizations();
  }, []);

  /* -------------------- Fetch Stats -------------------- */
  const fetchStats = async (orgId = null) => {
    try {
      setLoading(true);
      setError("");
      const url = orgId
        ? `${API_BASE}/dashboard?organizationId=${orgId}`
        : `${API_BASE}/dashboard`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load stats");
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrg === "Global") fetchStats();
    else fetchStats(selectedOrg);
  }, [selectedOrg]);

  /* -------------------- Prepare Chart Data -------------------- */
  const pieData = stats
    ? [
        {
          name: "Total Requests",
          value: stats.totalRequests,
          color: COLORS.total,
        },
        {
          name: "Ongoing",
          value: stats.ongoingVerifications,
          color: COLORS.ongoing,
        },
        {
          name: "Completed",
          value: stats.completedVerifications,
          color: COLORS.completed,
        },
        {
          name: "Failed",
          value: stats.failedVerifications,
          color: COLORS.failed,
        },
      ]
    : [];

  const barData = stats
    ? [
        {
          stage: "Primary",
          value: stats.stageBreakdown?.primary || 0,
          color: STAGE_COLORS.primary,
        },
        {
          stage: "Secondary",
          value: stats.stageBreakdown?.secondary || 0,
          color: STAGE_COLORS.secondary,
        },
        {
          stage: "Final",
          value: stats.stageBreakdown?.final || 0,
          color: STAGE_COLORS.final,
        },
      ]
    : [];

  const recentActivity = [
    {
      user: "Alice",
      action: "completed BGV",
      candidate: "Bob",
      time: "2 min ago",
    },
    {
      user: "Bob",
      action: "started new BGV",
      candidate: "Charlie",
      time: "5 min ago",
    },
    {
      user: "Charlie",
      action: "failed BGV",
      candidate: "David",
      time: "10 min ago",
    },
  ];

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen text-gray-900 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold text-[#ff004f]">
          Super Admin Dashboard
        </h1>
        <Link
          href="/superadmin/verifications"
          className="flex items-center gap-2 bg-[#ff004f] text-white px-5 py-2.5 rounded-full shadow hover:shadow-lg hover:bg-[#e60047] transition-all"
        >
          <span>View All Verifications</span>
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Dropdown */}
      <div className="mb-6">
        <select
          className="border border-gray-300 rounded-full px-4 py-2 bg-white text-gray-800 shadow-sm hover:shadow-md transition focus:ring-2 focus:ring-[#5B6C8F] outline-none"
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
        >
          <option value="Global">🌐 Global Overview</option>
          {orgs.map((org) => (
            <option key={org._id} value={org._id}>
              🏢 {org.organizationName}
            </option>
          ))}
        </select>
      </div>

      {/* Info note */}
      <p className="text-gray-600 text-sm mb-4 italic">
        * Includes Self Verifications as part of total verification requests.
      </p>

      {/* Loader / Error */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <Loader2 className="animate-spin mb-2 text-[#ff004f]" size={34} />
          <p className="font-semibold">Loading Dashboard Data...</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-3 rounded-md mb-6 border border-red-200">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && stats && (
        <>
          {/* Stats Cards */}
          <div
            className={`grid gap-4 mb-10 ${
              selectedOrg === "Global"
                ? "grid-cols-1 sm:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {selectedOrg === "Global" && (
              <Card
                color="#ff004f"
                title="Total Organizations"
                value={stats.totalOrganizations || 0}
              />
            )}
            <Card
              color={COLORS.total}
              title="Total Requests"
              value={stats.totalRequests || 0}
            />
            <Card
              color={COLORS.ongoing}
              title="Ongoing"
              value={stats.ongoingVerifications || 0}
            />
            <Card
              color={COLORS.completed}
              title="Completed"
              value={stats.completedVerifications || 0}
            />
            <Card
              color={COLORS.failed}
              title="Failed"
              value={stats.failedVerifications || 0}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Bar chart */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Stage-wise Verification Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="stage" stroke="#333" />
                  <YAxis stroke="#333" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Verification Status Overview
              </h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "12px",
                      color: "#000",
                      paddingTop: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Recent Activity
            </h2>
            <div className="flex flex-col gap-2">
              {recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex justify-between bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition text-gray-900"
                >
                  <span>
                    {activity.user} {activity.action} for candidate{" "}
                    {activity.candidate}
                  </span>
                  <span className="text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------- Card Component -------------------- */
function Card({ color, title, value }) {
  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1 border-l-8 flex flex-col items-center justify-center p-5 min-h-[120px]"
      style={{ borderColor: color }}
    >
      <h2 className="text-2xl font-bold text-gray-800">{value}</h2>
      <p className="text-gray-700 font-medium mt-2 text-sm sm:text-base">
        {title}
      </p>
    </div>
  );
}
