"use client";

import { useEffect, useState, useMemo } from "react";
import { Filter, X, Loader2 } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function SuperAdminVerificationsPage() {
  /* -----------------------------------------------------------
     STATE
  ------------------------------------------------------------*/
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [filters, setFilters] = useState({
    org: "",
    status: "",
    name: "",
    initiatedBy: "",
    fromDate: "",
    toDate: "",
  });

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/secure/getVerifications`, {
        credentials: "include",
      });

      const data = await res.json();

      setSummary(data.candidatesSummary || []);
      setVerifications(data.verifications || []);
    } catch (err) {
      alert("Failed fetching verifications");
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
    const full = verifications.find((v) => v.candidateId === c.candidateId);
    setSelectedCandidate(full || c);
  };

  /* ===================================================================
     RENDER
  =====================================================================*/
  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#ff004f]">
            Verifications Summary
          </h1>
          <p className="text-gray-600 text-sm">
            Track verification progress across all organizations.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#ff004f] hover:bg-[#e60047] text-white rounded-md flex items-center gap-2 shadow"
        >
          <Filter size={16} /> Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-2xl bg-white shadow hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Total Verifications</p>
          <p className="text-2xl font-extrabold mt-1 text-gray-500">{total}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white shadow hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Overall Completion</p>
          <p className="text-2xl font-extrabold mt-1 text-orange-600">
            {overallPercentage}%
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white shadow hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Completed</p>
          <p className="text-2xl font-extrabold mt-1 text-green-600">
            {completed}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white shadow hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Failed</p>
          <p className="text-2xl font-extrabold mt-1 text-red-600">{failed}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
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
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-white rounded-xl text-sm shadow min-w-[160px] hover:shadow-md transition text-gray-700"
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>

          {/* SEARCH FIELD */}
          <input
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            placeholder="Search Candidate..."
            className="px-4 py-2 bg-white rounded-xl text-sm shadow min-w-[200px] hover:shadow-md transition text-gray-700"
          />

          {/* INITIATED BY */}
          <select
            value={filters.initiatedBy}
            onChange={(e) =>
              setFilters({ ...filters, initiatedBy: e.target.value })
            }
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

      {/* TABLE */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="animate-spin mx-auto" size={28} />
            <p className="text-gray-600 mt-2">Loading verifications...</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-[#ffeef3] text-[#ff004f]">
              <tr>
                <th className="px-4 py-3 text-left">Candidate</th>
                <th className="px-4 py-3 text-left">Organization</th>
                <th className="px-4 py-3 text-left">Stage</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Progress</th>
                <th className="px-4 py-3 text-left">Initiated By</th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.map((c) => {
                const v = verifications.find(
                  (x) => x.candidateId === c.candidateId
                );

                return (
                  <tr
                    key={c.candidateId}
                    className="border-t hover:bg-[#fff0f5] cursor-pointer"
                    onClick={() => openCandidateDetails(c)}
                  >
                    <td className="px-4 py-3">{c.candidateName}</td>
                    <td className="px-4 py-3">{c.organizationName}</td>
                    <td className="px-4 py-3 capitalize">
                      {c.currentStage || "-"}
                    </td>

                    <td className="px-4 py-3">
                      {getStatusBadge(c.overallStatus)}
                    </td>

                    <td className="px-4 py-3 w-[150px]">
                      <div className="bg-gray-300 h-2 rounded-full">
                        <div
                          className="h-2 bg-green-600 rounded-full"
                          style={{ width: `${c.completionPercentage}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3">
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

      {/* MOBILE CARDS */}
      {!loading && (
        <div className="grid md:hidden gap-4 mt-4">
          {filteredCandidates.map((c) => {
            const v = verifications.find(
              (x) => x.candidateId === c.candidateId
            );

            return (
              <div
                key={c.candidateId}
                className="bg-white  rounded-xl shadow p-4"
                onClick={() => openCandidateDetails(c)}
              >
                <h3 className="font-bold text-lg">{c.candidateName}</h3>

                <p className="text-sm text-gray-600">{c.organizationName}</p>
                <p className="text-sm">Stage: {c.currentStage}</p>

                <div className="mt-1">{getStatusBadge(c.overallStatus)}</div>

                <div className="mt-2">
                  <div className="bg-gray-200 h-2 rounded-full">
                    <div
                      className="h-2 bg-green-600 rounded-full"
                      style={{ width: `${c.completionPercentage}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs mt-2 text-gray-500">
                  Initiated By: {v?.initiatedByName || v?.initiatedBy || "-"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER */}
      {selectedCandidate && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setSelectedCandidate(null)}
          />

          <div className="fixed right-0 top-0 w-full sm:w-[450px] bg-white h-full z-50 shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b sticky top-0 bg-white z-50">
              <h2 className="text-2xl font-bold text-[#ff004f]">
                {selectedCandidate.candidateName}
              </h2>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-gray-600 hover:text-red-600 transition"
              >
                <X size={26} />
              </button>
            </div>

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
                    <span className="font-semibold text-gray-700">Stage:</span>{" "}
                    <span className="capitalize">
                      {selectedCandidate.currentStage}
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Status:</span>
                    {getStatusBadge(selectedCandidate.overallStatus)}
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
        </>
      )}
    </div>
  );
}
