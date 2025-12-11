"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Filter,
  X,
  Loader2,
  CheckCheck,
  UserCircle2,
  RefreshCw,
} from "lucide-react";
import { useSuperAdminState } from "../../context/SuperAdminStateContext";

export default function SuperAdminVerificationsPage() {
  const {
    verificationsData: verifications,
    setVerificationsData: setVerifications,
    verificationsSummary: summary,
    setVerificationsSummary: setSummary,
    verificationsFilters: filters,
    setVerificationsFilters: setFilters,
  } = useSuperAdminState();

  /* -----------------------------------------------------------
     STATE
  ------------------------------------------------------------*/
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingCandidate, setLoadingCandidate] = useState(false);

  const [openOrgFilter, setOpenOrgFilter] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");

  /* -----------------------------------------------------------
     UNIQUE ORGS
  ------------------------------------------------------------*/
  const uniqueOrgs = useMemo(() => {
    return [...new Set(summary.map((s) => s.organizationName || ""))];
  }, [summary]);

  /* -----------------------------------------------------------
     UNIQUE INITIATORS (NEW)
  ------------------------------------------------------------*/
  const uniqueInitiators = useMemo(() => {
    return [
      ...new Set(
        verifications.map((v) => v.initiatedByName || v.initiatedBy || "")
      ),
    ].filter(Boolean);
  }, [verifications]);

  /* -----------------------------------------------------------
     FETCH
  ------------------------------------------------------------*/
  useEffect(() => {
    // Only fetch if we don't have data (check both verifications and summary)
    if (verifications.length === 0 && summary.length === 0) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/proxy/secure/getVerifications`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch verifications");
      }

      setSummary(data.candidatesSummary || []);
      setVerifications(data.verifications || []);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed fetching verifications: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------------
     SUMMARY CARDS
  ------------------------------------------------------------*/
  const total = summary.length;
  const completed = summary.filter(
    (x) => x.overallStatus === "COMPLETED"
  ).length;
  const failed = summary.filter((x) => x.overallStatus === "FAILED").length;
  const inProgress = summary.filter(
    (x) => x.overallStatus === "IN_PROGRESS"
  ).length;

  const overallPercentage =
    total === 0
      ? 0
      : Math.round(
          summary.reduce((sum, x) => sum + (x.completionPercentage || 0), 0) /
            total
        );

  /* -----------------------------------------------------------
     FILTERED RESULTS
  ------------------------------------------------------------*/
  const filteredCandidates = useMemo(() => {
    return summary.filter((c) => {
      const matchOrg = filters.org
        ? c.organizationName?.toLowerCase() === filters.org.toLowerCase()
        : true;

      const matchStatus = filters.status
        ? c.overallStatus === filters.status
        : true;

      const matchName = filters.name
        ? c.candidateName.toLowerCase().includes(filters.name.toLowerCase())
        : true;

      const verificationObj = verifications.find(
        (v) => v.candidateId === c.candidateId
      );

      const initiatorName =
        verificationObj?.initiatedByName || verificationObj?.initiatedBy || "";

      const matchInitiatedBy = filters.initiatedBy
        ? initiatorName.toLowerCase() === filters.initiatedBy.toLowerCase()
        : true;

      return matchOrg && matchStatus && matchName && matchInitiatedBy;
    });
  }, [filters, summary, verifications]);

  /* -----------------------------------------------------------
     HELPERS
  ------------------------------------------------------------*/
  const getStatusBadge = (status) => {
    const base =
      "px-2 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap";

    switch (status) {
      case "COMPLETED":
        return <span className={`${base} bg-green-600`}>Completed</span>;
      case "FAILED":
        return <span className={`${base} bg-red-600`}>Failed</span>;
      case "IN_PROGRESS":
        return <span className={`${base} bg-blue-600`}>In Progress</span>;
      default:
        return <span className={`${base} bg-gray-500`}>{status}</span>;
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  const openCandidateDetails = (c) => {
  setLoadingCandidate(true);

  setTimeout(() => {
    const full = verifications.find((v) => v.candidateId === c.candidateId);

    // summary object (source of aiCvValidationStatus)
    const summaryInfo = summary.find((s) => s.candidateId === c.candidateId);

    // merge full verification + summary and add AI fields
    setSelectedCandidate({
      ...(full || c),

     aiCvStatus: full?.aiCvValidation?.status 
              || summaryInfo?.aiCvValidationStatus 
              || "NOT_STARTED",

aiCvCompletion: summaryInfo?.aiCvValidationCompletion 
              || 0,

authenticityScore: full?.aiCvValidation?.authenticity_score 
              || null,

    });

    setLoadingCandidate(false);
  }, 300);
};


  /* ===================================================================
     RENDER
  =====================================================================*/
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 text-gray-900">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCheck size={24} className="text-[#ff004f]" />
            Verifications Summary
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Track verification progress across organizations
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold w-full sm:w-auto shadow transition-all hover:shadow-lg bg-[#ff004f] hover:bg-[#e60047]"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* SUPERB SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-semibold">
              Total Verifications
            </p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg
                className="w-5 h-5 text-gray-600"
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
          <p className="text-3xl font-extrabold text-gray-700">{total}</p>
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
            {overallPercentage}%
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
          <p className="text-3xl font-extrabold text-green-600">{completed}</p>
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
          <p className="text-3xl font-extrabold text-red-600">{failed}</p>
        </div>
      </div>

      {/* SUPERB FILTERS */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-[#ff004f]/10 to-[#ff3366]/10 rounded-lg">
            <svg
              className="w-5 h-5 text-[#ff004f]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            Filter Verifications
          </h3>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {/* ORG DROPDOWN */}
          <div className="relative w-full sm:min-w-[220px]">
            <div
              onClick={() => setOpenOrgFilter(!openOrgFilter)}
              className="px-4 py-3 bg-white rounded-xl text-sm shadow cursor-pointer flex justify-between items-center 
           hover:shadow-md transition w-full active:bg-gray-50"
            >
              <span className="text-gray-700">
                {filters.org || "All Organizations"}
              </span>
              <span className="text-gray-400 text-xs">▼</span>
            </div>

            {openOrgFilter && (
              <div
                className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-[100] max-h-64 overflow-y-auto w-full 
                border border-gray-100 sm:w-auto"
              >
                <div className="p-2 border-b bg-white sticky top-0">
                  <input
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-lg shadow-sm border border-gray-200 focus:ring-1 focus:ring-[#ff004f]"
                    placeholder="Search..."
                  />
                </div>

                <div
                  className="px-4 py-2 cursor-pointer text-sm hover:bg-gray-50 text-gray-700"
                  onClick={() => {
                    setFilters({ ...filters, org: "" });
                    setSelectedCandidate(null);
                    setOpenOrgFilter(false);
                  }}
                >
                  🌐 All Organizations
                </div>

                {uniqueOrgs
                  .filter((o) =>
                    o.toLowerCase().includes(orgSearch.toLowerCase())
                  )
                  .map((org, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 cursor-pointer text-sm hover:bg-gray-50 text-gray-700"
                      onClick={() => {
                        setFilters({ ...filters, org });
                        setSelectedCandidate(null);
                        setOpenOrgFilter(false);
                      }}
                    >
                      🏢 {org}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* STATUS FILTER */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setSelectedCandidate(null);
            }}
            className="px-4 py-2 bg-white rounded-xl text-sm shadow min-w-[160px] hover:shadow-md transition text-gray-700"
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>

          {/* SEARCH FIELD */}
          <input
            value={filters.name || ""}
            onChange={(e) => {
              setFilters({ ...filters, name: e.target.value });
              setSelectedCandidate(null);
            }}
            placeholder="Search Candidate..."
            className="px-4 py-2 bg-white rounded-xl text-sm shadow min-w-[200px] hover:shadow-md transition text-gray-700"
          />

          {/* INITIATED BY */}
          <select
            value={filters.initiatedBy}
            onChange={(e) => {
              setFilters({ ...filters, initiatedBy: e.target.value });
              setSelectedCandidate(null);
            }}
            className="px-4 py-2 bg-white rounded-xl text-sm shadow min-w-[180px] hover:shadow-md transition text-gray-700"
          >
            <option value="">Initiated By (All)</option>
            {uniqueInitiators.map((name, idx) => (
              <option key={idx} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUPERB TABLE */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2
              className="animate-spin mx-auto text-[#ff004f] mb-4"
              size={40}
            />
            <p className="text-gray-600 font-medium text-lg">
              Loading verifications...
            </p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                  👤 Candidate
                </th>
                <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                  🏢 Organization
                </th>
                <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                  📊 Stage
                </th>
                <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                  ✅ Status
                </th>
                <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                  📈 Progress
                </th>
                <th className="px-4 py-4 text-left font-semibold tracking-wide text-gray-700">
                  👨‍💼 Initiated By
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredCandidates.map((c, idx) => {
                const v = verifications.find(
                  (x) => x.candidateId === c.candidateId
                );

                return (
                  <tr
                    key={c.candidateId}
                    className={`transition-all cursor-pointer group hover:bg-gradient-to-r hover:from-[#fff5f8] hover:to-[#fff0f5] hover:shadow-md ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                    onClick={() => openCandidateDetails(c)}
                  >
                    <td className="px-4 py-4 font-semibold text-gray-800 group-hover:text-[#ff004f] transition-colors">
                      {c.candidateName}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {c.organizationName}
                    </td>
                    <td className="px-4 py-4">
                      <span className="capitalize px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {c.currentStage || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {getStatusBadge(c.overallStatus)}
                    </td>

                    <td className="px-4 py-4 w-[180px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                            style={{ width: `${c.completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600 min-w-[35px]">
                          {c.completionPercentage}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-600 font-medium">
                      {v?.initiatedByName || v?.initiatedBy || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MOBILE LOADING */}
      {loading && (
        <div className="md:hidden p-10 text-center">
          <Loader2 className="animate-spin mx-auto" size={32} />
          <p className="text-gray-600 mt-2">Loading verifications...</p>
        </div>
      )}

      {/* SUPERB MOBILE CARDS */}
      {!loading && (
        <div className="grid md:hidden gap-4 mt-4">
          {filteredCandidates.map((c) => {
            const v = verifications.find(
              (x) => x.candidateId === c.candidateId
            );

            return (
              <div
                key={c.candidateId}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-5 border-2 border-gray-100 hover:shadow-2xl transition-all transform hover:scale-[1.02] cursor-pointer"
                onClick={() => openCandidateDetails(c)}
              >
                <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-100">
                  <div className="p-3 bg-gradient-to-br from-[#ff004f] to-[#ff3366] rounded-xl shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">
                      {c.candidateName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      🏢 {c.organizationName}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">
                      Stage:
                    </span>
                    <span className="capitalize px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {c.currentStage}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">
                      Status:
                    </span>
                    {getStatusBadge(c.overallStatus)}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-600">
                        Progress:
                      </span>
                      <span className="text-sm font-bold text-gray-700">
                        {c.completionPercentage}%
                      </span>
                    </div>
                    <div className="bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${c.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">
                      👨‍💼 Initiated By:{" "}
                      <span className="text-gray-700 font-semibold">
                        {v?.initiatedByName || v?.initiatedBy || "-"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LOADING OVERLAY */}
      {loadingCandidate && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#ff004f]" size={48} />
          </div>
        </>
      )}

      {/* DRAWER */}
      {selectedCandidate && !loadingCandidate && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setSelectedCandidate(null)}
          />

          <div className="fixed right-0 top-0 w-full sm:w-[450px] bg-white h-full z-50 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Enhanced Drawer Header */}
            <div className="flex justify-between items-center px-6 py-5 bg-gradient-to-r from-[#ff004f] to-[#ff3366] sticky top-0 z-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <UserCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    👤 {selectedCandidate.candidateName}
                  </h2>
                  <p className="text-white/80 text-sm">Verification Details</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto h-full pb-6">
              <div className="p-6 space-y-6">
                {/* Candidate Details Card */}
                <div className="bg-[#fff5f8] border border-[#ffd1de] rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-600">Verification Overview</p>

                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="font-semibold text-gray-700">
                        Organization:
                      </span>{" "}
                      {selectedCandidate.organizationName}
                    </p>

                    <p>
                      <span className="font-semibold text-gray-700">
                        Stage:
                      </span>{" "}
                      <span className="capitalize">
                        {selectedCandidate.currentStage}
                      </span>
                    </p>

                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">
                        Status:
                      </span>
                      {getStatusBadge(selectedCandidate.overallStatus)}
                    </p>
<p>
  <span className="font-semibold text-gray-700">AI CV Validation:</span>{" "}
  <span
    className={
      selectedCandidate.aiCvStatus === "COMPLETED"
        ? "text-green-600 font-semibold"
        : selectedCandidate.aiCvStatus === "IN_PROGRESS"
        ? "text-blue-600 font-semibold"
        : selectedCandidate.aiCvStatus === "FAILED"
        ? "text-red-600 font-semibold"
        : "text-gray-600"
    }
  >
    {selectedCandidate.aiCvStatus}
  </span>
</p>

<p>
  <span className="font-semibold text-gray-700">
    AI CV Completion:
  </span>{" "}
  {selectedCandidate.aiCvCompletion || 0}%
</p>

                    <p>
                      <span className="font-semibold text-gray-700">
                        Initiated By:
                      </span>{" "}
                      {selectedCandidate.initiatedByName ||
                        selectedCandidate.initiatedBy ||
                        "-"}
                    </p>

                    <p>
                      <span className="font-semibold text-gray-700">
                        Initiated At:
                      </span>{" "}
                      {formatDate(selectedCandidate.initiatedAt)}
                    </p>
                  </div>
                </div>

                {/* Progress Card */}
                <div className="bg-white border shadow rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Completion Progress
                  </h3>

                  <div className="h-3 w-full bg-gray-200 rounded-full">
                    <div
                      className="h-3 rounded-full bg-[#ff004f]"
                      style={{
                        width: `${
                          selectedCandidate.progress?.completionPercentage ||
                          selectedCandidate.completionPercentage ||
                          0
                        }%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCandidate.progress?.completionPercentage ||
                      selectedCandidate.completionPercentage ||
                      0}
                    % completed
                  </p>
                </div>

                {/* Stages Section */}
                <div>
                  <h3 className="font-semibold text-xl text-[#ff004f] mb-3">
                    Verification Stages
                  </h3>

                  {selectedCandidate.stages &&
                    Object.entries(selectedCandidate.stages).map(
                      ([stage, list], idx) => (
                        <div
                          key={idx}
                          className="bg-white border rounded-xl p-4 mb-4 shadow-sm"
                        >
                          <h4 className="font-semibold text-gray-800 text-lg capitalize mb-3">
                            {stage} Stage
                          </h4>

                          {Array.isArray(list) && list.length > 0 ? (
                            <div className="space-y-2">
                              {list.map((chk, i) => (
                                <div
                                  key={i}
                                  className="flex justify-between items-center border-b pb-2"
                                >
                                  <span className="text-gray-700 capitalize text-sm">
                                    {chk.check}
                                  </span>
                                  {getStatusBadge(chk.status)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm italic">
                              No checks available
                            </p>
                          )}
                        </div>
                      )
                    )}
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="px-5 py-2 bg-[#ff004f] text-white rounded-lg shadow hover:bg-[#e60047] transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
