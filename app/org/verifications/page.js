"use client";

import { useEffect, useState, useMemo } from "react";
import { Filter, X, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOrgState } from "../../context/OrgStateContext";

export default function OrgVerificationsPage() {
  const {
    verificationsData: verifications,
    setVerificationsData: setVerifications,
    verificationsFilters: filters,
    setVerificationsFilters: setFilters,
    verificationsSummary,
    setVerificationsSummary,
  } = useOrgState();

  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingCandidate, setLoadingCandidate] = useState(false);

  const router = useRouter();

  /* ---------------------- Fetch Verifications ---------------------- */
  useEffect(() => {
    // Only fetch if we don't have data (check both verifications and summary)
    if (verifications.length === 0 && verificationsSummary.length === 0) {
      fetchVerifications();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/proxy/secure/getVerifications`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch verifications");

      setVerificationsSummary(data.candidatesSummary || []);
      setVerifications(data.verifications || []);
    } catch (err) {
      console.error("Fetch error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------
     Merge initiatedByName from verifications → summary
     --------------------------------------------------------------- */
  const mergedSummary = useMemo(() => {
    return verificationsSummary.map((c) => {
      const v = verifications.find((v) => v.candidateId === c.candidateId);
      return {
        ...c,
        initiatedByName: v?.initiatedByName || "",
      };
    });
  }, [verificationsSummary, verifications]);

  /* ---------------------------------------------------------------
     Override status → Completed if 100%
     --------------------------------------------------------------- */
  const getDisplayStatus = (c) => {
    if (c.completionPercentage === 100) return "COMPLETED";
    return c.overallStatus || "PENDING";
  };

  const getStatusBadge = (status) => {
    const base =
      "px-2 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap";
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <span className={`${base} bg-green-600`}>Completed</span>;
      case "FAILED":
        return <span className={`${base} bg-red-600`}>Failed</span>;
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

  /* ---------------------------------------------------------------
     Build dropdown list of unique initiators
     --------------------------------------------------------------- */
  const initiatorsList = useMemo(() => {
    return [
      ...new Set(
        verifications
          .map((v) => v.initiatedByName)
          .filter((n) => n && n.trim() !== "")
      ),
    ];
  }, [verifications]);

  /* ---------------------------------------------------------------
     Apply Filters
     --------------------------------------------------------------- */
  const filteredCandidates = useMemo(() => {
    return mergedSummary.filter((c) => {
      const matchStatus = filters.status
        ? getDisplayStatus(c).toLowerCase() === filters.status.toLowerCase()
        : true;

      const matchName = filters.name
        ? c.candidateName?.toLowerCase().includes(filters.name.toLowerCase())
        : true;

      const matchInitiator = filters.initiatedByName
        ? c.initiatedByName === filters.initiatedByName
        : true;

      const matchFromDate = filters.fromDate
        ? new Date(c.createdAt || c.date) >= new Date(filters.fromDate)
        : true;

      const matchToDate = filters.toDate
        ? new Date(c.createdAt || c.date) <= new Date(filters.toDate)
        : true;

      return (
        matchStatus &&
        matchName &&
        matchInitiator &&
        matchFromDate &&
        matchToDate
      );
    });
  }, [filters, mergedSummary]);

  /* --------------------------------------------------------------- */
  const openCandidateDetails = (candidate) => {
    setLoadingCandidate(true);
    // Simulate loading for better UX
    setTimeout(() => {
      const details = verifications.find(
        (v) => v.candidateId === candidate.candidateId
      );

      // merge summary info (completionPercentage, overallStatus, initiatedByName)
      const summaryInfo = mergedSummary.find(
        (s) => s.candidateId === candidate.candidateId
      );

    setSelectedCandidate({
  ...(details || candidate),
  completionPercentage: summaryInfo?.completionPercentage || 0,
  overallStatus: summaryInfo?.overallStatus || details?.overallStatus,
  initiatedByName: summaryInfo?.initiatedByName || details?.initiatedByName,

  // 🔥 NEW: AI CV Validation status & % 
  aiCvStatus:
    details?.aiCvValidation?.status ||
    summaryInfo?.aiCvValidationStatus ||
    "NOT_STARTED",

  aiCvCompletion:
    details?.aiCvValidation?.aiCvValidationCompletion ||
    summaryInfo?.aiCvValidationCompletion ||
    0,
});

      setLoadingCandidate(false);
    }, 300);
  };

  /* ---------------------- UI ---------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900 transition-all">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 size={24} /> Organization Verifications
          </h1>
          <p className="text-gray-600 text-sm">
            Manage and track your candidates’ background verifications.
          </p>
        </div>
        <button
          onClick={fetchVerifications}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center gap-2"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-700 text-sm font-semibold">
              Total Verifications
            </p>
            <div className="p-2 bg-blue-200 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-700">
            {filteredCandidates.length}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-700 text-sm font-semibold">
              Overall Completion
            </p>
            <div className="p-2 bg-orange-200 rounded-lg">
              <svg
                className="w-5 h-5 text-orange-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-orange-600">
            {filteredCandidates.length > 0
              ? Math.round(
                  filteredCandidates.reduce(
                    (sum, c) => sum + (c.completionPercentage || 0),
                    0
                  ) / filteredCandidates.length
                )
              : 0}
            %
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-700 text-sm font-semibold">Completed</p>
            <div className="p-2 bg-green-200 rounded-lg">
              <svg
                className="w-5 h-5 text-green-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-green-600">
            {
              filteredCandidates.filter(
                (c) => getDisplayStatus(c) === "COMPLETED"
              ).length
            }
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-red-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-700 text-sm font-semibold">Failed</p>
            <div className="p-2 bg-red-200 rounded-lg">
              <svg
                className="w-5 h-5 text-red-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-red-600">
            {
              filteredCandidates.filter((c) => getDisplayStatus(c) === "FAILED")
                .length
            }
          </p>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-[#ff004f]/10 to-[#ff3366]/10 rounded-lg">
            <Filter size={20} className="text-[#ff004f]" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            Filter Verifications
          </h3>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Status Filter */}
          <div className="min-w-[140px]">
            <select
              value={filters.status || ""}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setSelectedCandidate(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          {/* Candidate Name */}
          <div className="flex-1 min-w-[160px] max-w-[200px]">
            <input
              type="text"
              placeholder="Search Candidate"
              value={filters.name || ""}
              onChange={(e) => {
                setFilters({ ...filters, name: e.target.value });
                setSelectedCandidate(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Initiated By Filter (NEW) */}
          <div className="min-w-[160px]">
            <select
              value={filters.initiatedByName || ""}
              onChange={(e) => {
                setFilters({ ...filters, initiatedByName: e.target.value });
                setSelectedCandidate(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500"
            >
              <option value="">Initiated By</option>
              {initiatorsList.map((name, idx) => (
                <option key={idx} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={filters.fromDate || ""}
              onChange={(e) => {
                setFilters({ ...filters, fromDate: e.target.value });
                setSelectedCandidate(null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500"
            />
            <span className="text-gray-600 text-sm">to</span>
            <input
              type="date"
              value={filters.toDate || ""}
              onChange={(e) => {
                setFilters({ ...filters, toDate: e.target.value });
                setSelectedCandidate(null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow rounded-xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-10 text-center text-gray-600">
            <Loader2 className="mx-auto animate-spin mb-2" size={24} />
            Loading verifications...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                    👤 Candidate
                  </th>
                  <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                    📊 Stage
                  </th>
                  <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                    👨‍💼 Initiated By
                  </th>
                  <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                    ✅ Status
                  </th>
                  <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                    📈 Progress
                  </th>
                  <th className="px-4 py-4 text-right font-semibold tracking-wide text-gray-700">
                    ⚙️ Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((c) => (
                    <tr
                      key={c.candidateId}
                      className="border-t hover:bg-red-50/40 transition cursor-pointer"
                      onClick={() => openCandidateDetails(c)}
                    >
                      <td className="px-4 py-3 font-medium">
                        {c.candidateName}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {c.currentStage || "-"}
                      </td>
                      <td className="px-4 py-3">{c.initiatedByName || "-"}</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(getDisplayStatus(c))}
                      </td>
                      <td className="px-4 py-3 w-[120px]">
                        <div className="bg-gray-200 h-2 rounded-full">
                          <div
                            className={`h-2 rounded-full ${
                              c.completionPercentage === 100
                                ? "bg-green-600"
                                : c.completionPercentage >= 60
                                ? "bg-red-500"
                                : "bg-yellow-500"
                            }`}
                            style={{ width: `${c.completionPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">
                          {c.completionPercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/org/verifications/${c.candidateId}`);
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold"
                        >
                          View Verification
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

      {/* Mobile Cards */}
      <div className="grid md:hidden gap-4">
        {loading ? (
          <div className="text-center py-10 text-gray-600">
            <Loader2 className="animate-spin mx-auto mb-2" /> Loading...
          </div>
        ) : filteredCandidates.length > 0 ? (
          filteredCandidates.map((c) => (
            <div
              key={c.candidateId}
              onClick={() => openCandidateDetails(c)}
              className="bg-white shadow border border-gray-200 rounded-xl p-4 hover:border-red-400 transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800 text-base">
                  {c.candidateName}
                </h3>
                {getStatusBadge(getDisplayStatus(c))}
              </div>

              <p className="text-sm text-gray-600">
                <span className="font-semibold">Stage:</span>{" "}
                {c.currentStage || "-"}
              </p>

              <p className="text-sm text-gray-600">
                <span className="font-semibold">Initiated By:</span>{" "}
                {c.initiatedByName || "-"}
              </p>

              <div className="mt-2">
                <div className="bg-gray-200 h-2 rounded-full">
                  <div
                    className={`h-2 rounded-full ${
                      c.completionPercentage === 100
                        ? "bg-green-600"
                        : c.completionPercentage >= 60
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                    style={{ width: `${c.completionPercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {c.completionPercentage}% Complete
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic py-6">
            No matching records found.
          </p>
        )}
      </div>

      {/* LOADING OVERLAY */}
      {loadingCandidate && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#ff004f]" size={48} />
          </div>
        </>
      )}

      {/* Drawer */}
      {selectedCandidate && !loadingCandidate && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setSelectedCandidate(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] md:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto p-6 border-l-4 border-red-600">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-bold mb-2 text-red-600">
              {selectedCandidate.candidateName}
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Candidate verification details overview
            </p>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Stage:</span>{" "}
                {selectedCandidate.currentStage}
              </p>
              <p>
                <span className="font-semibold">Initiated By:</span>{" "}
                {selectedCandidate.initiatedByName}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {getStatusBadge(getDisplayStatus(selectedCandidate))}
              </p>
              <p>
                <span className="font-semibold">Completion:</span>{" "}
                {selectedCandidate.completionPercentage || 0}%
              </p>

              <p>
  <span className="font-semibold">AI CV Validation:</span>{" "}
  <span className={
    selectedCandidate.aiCvStatus === "COMPLETED"
      ? "text-green-600 font-semibold"
      : selectedCandidate.aiCvStatus === "IN_PROGRESS"
      ? "text-blue-600 font-semibold"
      : selectedCandidate.aiCvStatus === "FAILED"
      ? "text-red-600 font-semibold"
      : "text-gray-600"
  }>
    {selectedCandidate.aiCvStatus}
  </span>
</p>

<p>
  <span className="font-semibold">AI CV Completion:</span>{" "}
  {selectedCandidate.aiCvCompletion || 0}%
</p>

            </div>

            {selectedCandidate.stages && (
              <div className="mt-5 space-y-4">
                {Object.entries(selectedCandidate.stages)
                  .filter(([key, value]) => Array.isArray(value))
                  .map(([stage, checks]) => (
                    <div
                      key={stage}
                      className="bg-red-50 border border-red-100 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-red-700 mb-2 capitalize">
                        {stage} Stage
                      </h3>

                      <ul className="space-y-1 text-sm">
                        {checks.map((chk, i) => (
                          <li
                            key={i}
                            className="flex justify-between text-gray-700"
                          >
                            <span>{chk.check}</span>
                            {getStatusBadge(chk.status)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
