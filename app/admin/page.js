"use client";
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

export default function SuperAdminDashboard() {
  // 🔹 Summary Stats
  const stats = [
    { label: "Total Admins", value: 12 },
    { label: "Total Employers", value: 38 },
    { label: "Completed Verifications", value: 124 },
    { label: "Pending Verifications", value: 17 },
    { label: "Redflag Cases", value: 5 },
  ];

  // 🔹 Daily Activity Data for Bar Chart
  const dailyActivity = [
    { date: "Oct 1", completed: 12, pending: 4, redflag: 1 },
    { date: "Oct 2", completed: 15, pending: 5, redflag: 0 },
    { date: "Oct 3", completed: 10, pending: 3, redflag: 2 },
    { date: "Oct 4", completed: 20, pending: 6, redflag: 1 },
    { date: "Oct 5", completed: 18, pending: 7, redflag: 0 },
    { date: "Oct 6", completed: 22, pending: 5, redflag: 1 },
    { date: "Oct 7", completed: 25, pending: 4, redflag: 2 },
  ];

  // 🔹 Pie Chart Data
  const pieData = [
    { name: "Completed", value: 124 },
    { name: "Pending", value: 17 },
    { name: "Redflag", value: 5 },
  ];

  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  // 🔹 Recent Activity Table Data
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
    {
      id: 4,
      user: "Nisha HR",
      action: "Verified degree for Sneha Rao",
      time: "2 days ago",
      status: "Completed",
    },
  ];

  return (
    <div className="p-8 text-black space-y-10">
      <h1 className="text-3xl font-bold mb-6"> Admin Dashboard</h1>

      {/* 🔹 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center"
          >
            <h2 className="text-2xl font-bold">{s.value}</h2>
            <p className="text-gray-600 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 🔹 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart - Daily Activity */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-black">
            Daily Verification Activity
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                <Bar dataKey="pending" fill="#facc15" name="Pending" />
                <Bar dataKey="redflag" fill="#ef4444" name="Redflag" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Status Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-black">
            Verification Status Overview
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 🔹 Recent Activity Table */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-black">
          Recent Activity
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-100">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{a.user}</td>
                  <td className="p-3">{a.action}</td>
                  <td className="p-3 text-gray-600">{a.time}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : a.status === "Update"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentActivities.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-4 text-gray-500 italic"
                  >
                    No recent activities.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
