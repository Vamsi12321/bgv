"use client";
import { useState } from "react";
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
import { ArrowRight } from "lucide-react";

export default function SuperAdminDashboard() {
  const orgStats = {
    ABC: {
      total: 37,
      ongoing: 15, // includes initiated + pending
      completed: 20,
      failed: 2,
      daily: [
        {
          date: "2025-10-01",
          total: 10,
          ongoing: 4,
          completed: 5,
          failed: 1,
        },
        {
          date: "2025-10-02",
          total: 12,
          ongoing: 5,
          completed: 6,
          failed: 1,
        },
        {
          date: "2025-10-03",
          total: 15,
          ongoing: 6,
          completed: 8,
          failed: 1,
        },
      ],
      recentActivity: [
        {
          user: "Vamsi",
          action: "completed BGV",
          candidate: "Ravi",
          time: "2 min ago",
        },
        {
          user: "Sita",
          action: "started new BGV",
          candidate: "Reddy",
          time: "5 min ago",
        },
      ],
    },
    XYZ: {
      total: 27,
      ongoing: 9,
      completed: 15,
      failed: 3,
      daily: [
        {
          date: "2025-10-01",
          total: 8,
          ongoing: 2,
          completed: 5,
          failed: 1,
        },
        {
          date: "2025-10-02",
          total: 9,
          ongoing: 3,
          completed: 5,
          failed: 1,
        },
        {
          date: "2025-10-03",
          total: 10,
          ongoing: 4,
          completed: 5,
          failed: 1,
        },
      ],
      recentActivity: [
        {
          user: "John",
          action: "completed BGV",
          candidate: "Doe",
          time: "1 min ago",
        },
        {
          user: "Jane",
          action: "failed BGV",
          candidate: "Smith",
          time: "3 min ago",
        },
      ],
    },
  };

  const globalStats = {
    totalOrgs: 20,
    total: 190,
    ongoing: 50,
    completed: 120,
    failed: 20,
    daily: [
      { date: "2025-10-01", total: 50, ongoing: 15, completed: 30, failed: 5 },
      { date: "2025-10-02", total: 60, ongoing: 20, completed: 35, failed: 5 },
      { date: "2025-10-03", total: 80, ongoing: 15, completed: 55, failed: 10 },
    ],
    recentActivity: [
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
    ],
  };

  const [selectedOrg, setSelectedOrg] = useState(null);
  const currentStats = selectedOrg ? orgStats[selectedOrg] : globalStats;

  const pieData = [
    { name: "Total Requests", value: currentStats.total },
    { name: "Ongoing", value: currentStats.ongoing },
    { name: "Completed", value: currentStats.completed },
    { name: "Failed", value: currentStats.failed },
  ];

  const COLORS = ["#3b82f6", "#f59e0b", "#16a34a", "#ff004f"]; // Blue, Yellow, Green, Red

  return (
    <div className="p-4 sm:p-8 bg-[#f9fafb] min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Super Admin Dashboard
        </h1>

        {/* Redirect button to Verifications */}
        <Link
          href="/superadmin/verifications"
          className="flex items-center gap-2 bg-[#2563eb] text-white px-4 py-2 rounded-xl shadow hover:bg-[#1d4ed8] transition-all"
        >
          <span>View All Verifications</span>
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Dropdown */}
      <div className="mb-6">
        <select
          className="border rounded p-2 text-black"
          value={selectedOrg || "Global"}
          onChange={(e) =>
            setSelectedOrg(e.target.value === "Global" ? null : e.target.value)
          }
        >
          <option value="Global">Global</option>
          {Object.keys(orgStats).map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </select>
      </div>

      {/* Info note */}
      <p className="text-gray-600 text-sm mb-4 italic">
        * Includes Self Verifications as part of total verification requests.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-10">
        {!selectedOrg && (
          <div className="bg-white p-5 rounded-xl shadow text-center border-l-4 border-blue-500">
            <h2 className="text-xl font-bold">{currentStats.totalOrgs}</h2>
            <p className="text-black text-sm">Total Organizations</p>
          </div>
        )}
        <div className="bg-white p-5 rounded-xl shadow text-center border-l-4 border-blue-500">
          <h2 className="text-xl font-bold">{currentStats.total}</h2>
          <p className="text-black text-sm">Total Requests</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow text-center border-l-4 border-yellow-500">
          <h2 className="text-xl font-bold">{currentStats.ongoing}</h2>
          <p className="text-black text-sm">Ongoing Verifications</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow text-center border-l-4 border-green-500">
          <h2 className="text-xl font-bold">{currentStats.completed}</h2>
          <p className="text-black text-sm">Completed Verifications</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow text-center border-l-4 border-red-500">
          <h2 className="text-xl font-bold">{currentStats.failed}</h2>
          <p className="text-black text-sm">Failed Verifications</p>
        </div>
      </div>

      {/* Charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Bar chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-black">
            Daily Verification Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentStats.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="date" stroke="#000" />
              <YAxis stroke="#000" />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#3b82f6" />
              <Bar dataKey="ongoing" fill="#f59e0b" />
              <Bar dataKey="completed" fill="#16a34a" />
              <Bar dataKey="failed" fill="#ff004f" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-black">
            Verification Status Overview
          </h2>
          <ResponsiveContainer width="100%" height={300}>
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
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value}`, `${name}`]}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  border: "1px solid #000",
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

      {/* Recent Activity logs */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4 text-black">
          Recent Activity
        </h2>
        <div className="flex flex-col gap-2">
          {currentStats.recentActivity.map((activity, idx) => (
            <div
              key={idx}
              className="flex justify-between bg-white p-3 rounded shadow text-black"
            >
              <span>
                {activity.user} {activity.action} for candidate{" "}
                {activity.candidate}
              </span>
              <span className="text-gray-600">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
