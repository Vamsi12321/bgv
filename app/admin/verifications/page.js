"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function VerificationDashboard() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const stats = [
    { title: "Total Verifications", value: 124 },
    { title: "Completed", value: 80 },
    { title: "In Progress", value: 30 },
    { title: "Failed", value: 14 },
  ];

  const verifications = [
    {
      id: "VERF12345",
      candidate: "Ravi Kumar",
      type: "Aadhaar Verification",
      status: "Completed",
      verifier: "Vamsi",
      date: "2025-10-09",
      details: {
        email: "ravi.kumar@example.com",
        mobile: "+91 9876543210",
        org: "ABC Corp",
        remarks: "Verification successful with full match.",
      },
    },
    {
      id: "VERF12346",
      candidate: "Neha Sharma",
      type: "PAN Verification",
      status: "In Progress",
      verifier: "Anita",
      date: "2025-10-08",
      details: {
        email: "neha.sharma@example.com",
        mobile: "+91 8765432190",
        org: "XYZ Pvt Ltd",
        remarks: "Awaiting PAN database response.",
      },
    },
    {
      id: "VERF12347",
      candidate: "Rohit Verma",
      type: "Address Verification",
      status: "Failed",
      verifier: "Kiran",
      date: "2025-10-07",
      details: {
        email: "rohit.verma@example.com",
        mobile: "+91 7654321098",
        org: "LMN Solutions",
        remarks: "Address mismatch found during field visit.",
      },
    },
  ];

  const [filters, setFilters] = useState({
    type: "",
    status: "",
    verifier: "",
    startDate: "",
    endDate: "",
  });

  const filteredData = verifications.filter((v) => {
    return (
      (!filters.type || v.type === filters.type) &&
      (!filters.status || v.status === filters.status) &&
      (!filters.verifier || v.verifier === filters.verifier)
    );
  });

  return (
    <div className="p-8 space-y-8 text-black relative">
      {/* Header */}
      <h1 className="text-2xl font-bold text-black">Verification Dashboard</h1>

      {/* Stats Cards - White theme with red highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-xl shadow-sm bg-white border border-gray-200"
          >
            <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
            <p className="text-2xl font-bold mt-2 text-red-600">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h2 className="font-semibold text-lg mb-4 text-black">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            className="border p-2 rounded text-black"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="Aadhaar Verification">Aadhaar</option>
            <option value="PAN Verification">PAN</option>
            <option value="Address Verification">Address</option>
          </select>
          <select
            className="border p-2 rounded text-black"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Failed">Failed</option>
          </select>
          <select
            className="border p-2 rounded text-black"
            value={filters.verifier}
            onChange={(e) =>
              setFilters({ ...filters, verifier: e.target.value })
            }
          >
            <option value="">All Verifiers</option>
            <option value="Vamsi">Vamsi</option>
            <option value="Anita">Anita</option>
            <option value="Kiran">Kiran</option>
          </select>
          <input
            type="date"
            className="border p-2 rounded text-black"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
          />
          <input
            type="date"
            className="border p-2 rounded text-black"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 overflow-x-auto">
        <table className="w-full border-collapse text-black">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3 border-b">Candidate Name</th>
              <th className="p-3 border-b">Verification ID</th>
              <th className="p-3 border-b">Type</th>
              <th className="p-3 border-b">Verifier</th>
              <th className="p-3 border-b">Status</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((v) => (
              <tr key={v.id} className="border-b hover:bg-gray-50">
                <td
                  className="p-3 text-red-600 cursor-pointer hover:underline"
                  onClick={() => setSelectedCandidate(v)}
                >
                  {v.candidate}
                </td>
                <td className="p-3">{v.id}</td>
                <td className="p-3">{v.type}</td>
                <td className="p-3">{v.verifier}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-white text-sm ${
                      v.status === "Completed"
                        ? "bg-green-600"
                        : v.status === "Failed"
                        ? "bg-red-600"
                        : "bg-yellow-500"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="p-3">
                  <button className="text-blue-600 hover:underline">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Candidate Drawer */}
      {selectedCandidate && (
        <div className="fixed top-0 right-0 h-full w-1/2 bg-white shadow-2xl border-l border-gray-300 z-50 transition-transform animate-slideIn">
          <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-xl font-bold text-black">Candidate Details</h2>
            <button
              onClick={() => setSelectedCandidate(null)}
              className="text-gray-500 hover:text-red-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-4 text-black">
            <p>
              <span className="font-semibold">Name:</span>{" "}
              {selectedCandidate.candidate}
            </p>
            <p>
              <span className="font-semibold">Verification ID:</span>{" "}
              {selectedCandidate.id}
            </p>
            <p>
              <span className="font-semibold">Type:</span>{" "}
              {selectedCandidate.type}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded text-white ${
                  selectedCandidate.status === "Completed"
                    ? "bg-green-600"
                    : selectedCandidate.status === "Failed"
                    ? "bg-red-600"
                    : "bg-yellow-500"
                }`}
              >
                {selectedCandidate.status}
              </span>
            </p>
            <p>
              <span className="font-semibold">Verifier:</span>{" "}
              {selectedCandidate.verifier}
            </p>
            <p>
              <span className="font-semibold">Organization:</span>{" "}
              {selectedCandidate.details.org}
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {selectedCandidate.details.email}
            </p>
            <p>
              <span className="font-semibold">Mobile:</span>{" "}
              {selectedCandidate.details.mobile}
            </p>
            <p>
              <span className="font-semibold">Remarks:</span>{" "}
              {selectedCandidate.details.remarks}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
