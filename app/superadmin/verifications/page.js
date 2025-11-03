"use client";

import { useEffect, useState, useMemo } from "react";
import { Filter, X, Loader2 } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function SuperAdminVerificationsPage() {
  const [loading, setLoading] = useState(false);
  const [verifications, setVerifications] = useState([]);
  const [summary, setSummary] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filters, setFilters] = useState({
    org: "",
    status: "",
    name: "",
    fromDate: "",
    toDate: "",
  });

  /* ---------------------- Fetch Verifications ---------------------- */
  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/secure/getVerifications`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch verifications");
      setSummary(data.candidatesSummary || []);
      setVerifications(data.verifications || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- Derived Filters ---------------------- */
  const filteredCandidates = useMemo(() => {
    return summary.filter((c) => {
      const matchOrg = filters.org
        ? c.organizationName?.toLowerCase() === filters.org.toLowerCase()
        : true;
      const matchStatus = filters.status
        ? c.overallStatus?.toLowerCase() === filters.status.toLowerCase()
        : true;
      const matchName = filters.name
        ? c.candidateName?.toLowerCase().includes(filters.name.toLowerCase())
        : true;
      const matchFromDate = filters.fromDate
        ? new Date(c.initiatedAt || c.createdAt || c.date) >=
          new Date(filters.fromDate)
        : true;
      const matchToDate = filters.toDate
        ? new Date(c.initiatedAt || c.createdAt || c.date) <=
          new Date(filters.toDate)
        : true;

      return (
        matchOrg && matchStatus && matchName && matchFromDate && matchToDate
      );
    });
  }, [filters, summary]);

  const getStatusBadge = (status) => {
    const base =
      "px-2 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap";
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <span className={`${base} bg-green-600`}>Completed</span>;
      case "FAILED":
        return <span className={`${base} bg-red-500`}>Failed</span>;
      case "PENDING":
        return <span className={`${base} bg-yellow-500`}>Pending</span>;
      case "IN_PROGRESS":
        return <span className={`${base} bg-blue-500`}>In Progress</span>;
      default:
        return (
          <span className={`${base} bg-gray-400`}>{status || "Unknown"}</span>
        );
    }
  };

  /* ---------------------- Drawer Details ---------------------- */
  const openCandidateDetails = (candidate) => {
    const details = verifications.find(
      (v) => v.candidateId === candidate.candidateId
    );
    setSelectedCandidate(details || candidate);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 text-black">
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-900 md:mr-4 whitespace-nowrap">
          Verification Management
        </h1>

        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Org Filter */}
          <div className="relative min-w-[150px]">
            <Filter
              className="absolute left-2 top-2.5 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Filter by Organization"
              value={filters.org}
              onChange={(e) => setFilters({ ...filters, org: e.target.value })}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="min-w-[140px]">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          {/* Name Filter */}
          <div className="min-w-[150px]">
            <input
              type="text"
              placeholder="Search Candidate"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Date Range */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters({ ...filters, fromDate: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-gray-600 text-sm">to</span>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) =>
                setFilters({ ...filters, toDate: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-10 text-center text-gray-600">
            <Loader2 className="mx-auto animate-spin mb-2" size={24} />
            Loading verifications...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">Candidate</th>
                  <th className="px-4 py-3 text-left">Organization</th>
                  <th className="px-4 py-3 text-left">Stage</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">
                    Completion
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((c) => (
                    <tr
                      key={c.candidateId}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => openCandidateDetails(c)}
                    >
                      <td className="px-4 py-3 font-medium">
                        {c.candidateName}
                      </td>
                      <td className="px-4 py-3">{c.organizationName}</td>
                      <td className="px-4 py-3 capitalize">{c.currentStage}</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(c.overallStatus)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {c.completionPercentage}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-6 text-gray-500 font-medium"
                    >
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
          <div className="w-full sm:w-3/4 md:w-1/2 lg:w-2/5 bg-gray-50 h-full shadow-xl overflow-y-auto p-6 relative text-black">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-4 right-4 text-gray-700 hover:text-black"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-bold mb-4">
              {selectedCandidate.candidateName}
            </h2>

            <p className="mb-2 text-sm text-gray-600">
              <span className="font-semibold">Organization:</span>{" "}
              {selectedCandidate.organizationName}
            </p>
            <p className="mb-2 text-sm text-gray-600">
              <span className="font-semibold">Current Stage:</span>{" "}
              {selectedCandidate.currentStage}
            </p>
            <p className="mb-2 text-sm text-gray-600">
              <span className="font-semibold">Status:</span>{" "}
              {getStatusBadge(selectedCandidate.overallStatus)}
            </p>
            <p className="mb-4 text-sm text-gray-600">
              <span className="font-semibold">Completion:</span>{" "}
              {selectedCandidate.progress?.completionPercentage ||
                selectedCandidate.completionPercentage}
              %
            </p>

            {/* Stage breakdown */}
            {selectedCandidate.stages && (
              <div className="mt-4 space-y-4">
                {Object.entries(selectedCandidate.stages).map(
                  ([stage, checks]) => (
                    <div
                      key={stage}
                      className="bg-white rounded-md p-4 shadow border"
                    >
                      <h3 className="font-semibold capitalize mb-2">
                        {stage} Stage
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {checks.map((chk, i) => (
                          <li key={i} className="flex justify-between">
                            <span className="capitalize">{chk.check}</span>
                            {getStatusBadge(chk.status)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
