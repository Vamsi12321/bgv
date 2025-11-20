"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
} from "lucide-react";
import jsPDF from "jspdf";
import { safeHtml2Canvas } from "@/utils/safeHtml2Canvas";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function OrgReportsPage() {
  const [userOrgId, setUserOrgId] = useState("");
  const [orgName, setOrgName] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  /* ------------------- Detect Logged-in Org ------------------- */
  useEffect(() => {
    const stored = localStorage.getItem("bgvUser");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserOrgId(user.organizationId);
        setOrgName(user.organizationName || "Organization");
        fetchCandidates(user.organizationId);
      } catch {
        console.error("Failed to parse bgvUser");
      }
    }
  }, []);

  /* ------------------- Fetch Candidates & Verifications ------------------- */
  const fetchCandidates = async (orgId) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/secure/getCandidates?orgId=${orgId}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to fetch candidates");
      const list = data.candidates || [];

      // For each candidate, fetch their verification details
      const enriched = await Promise.all(
        list.map(async (c) => {
          const verRes = await fetch(
            `${API_BASE}/secure/getVerifications?candidateId=${c._id}`,
            { credentials: "include" }
          );
          const verData = await verRes.json();
          const verification = verData.verifications?.[0] || null;
          const overallStatus = verification?.overallStatus || "NOT_INITIATED";
          return {
            ...c,
            verification,
            overallStatus,
            completed: overallStatus === "COMPLETED",
          };
        })
      );

      // Only completed verifications
      const completedCandidates = enriched.filter((c) => c.completed);
      setCandidates(completedCandidates);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------- Expand Toggle ------------------- */
  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  /* ------------------- Download Certificate ------------------- */
  const downloadCertificate = async (candidate) => {
    const element = document.getElementById(`cert-${candidate._id}`);
    if (!element) return;

    try {
      const canvas = await safeHtml2Canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      const imgWidth = 595.28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.setFontSize(10);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 40, 820);
      pdf.save(`${candidate.firstName}_${candidate.lastName}_BGV_Report.pdf`);
    } catch (e) {
      alert("Error generating PDF: " + e.message);
    }
  };

  /* ------------------- Render ------------------- */
  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen text-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-[#ff004f]">
          <FileText /> BGV Reports
        </h1>

        <div className="flex items-center gap-2 text-gray-700">
          <Building2 size={18} />
          <span className="font-medium">{orgName}</span>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">
          <Loader2 className="animate-spin text-[#ff004f] mr-2" /> Fetching
          reports...
        </div>
      ) : candidates.length === 0 ? (
        <p className="text-center text-gray-500 mt-20 italic">
          No completed verifications found for this organization.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 divide-y">
          {candidates.map((c) => (
            <div key={c._id} className="p-4">
              {/* Candidate Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div
                  onClick={() => toggleExpand(c._id)}
                  className="flex items-center gap-2 cursor-pointer mb-2 sm:mb-0"
                >
                  {expanded[c._id] ? (
                    <ChevronDown className="text-gray-600" size={20} />
                  ) : (
                    <ChevronRight className="text-gray-600" size={20} />
                  )}
                  <div>
                    <h2 className="font-semibold text-lg text-gray-800">
                      {c.firstName} {c.lastName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Candidate ID: {c._id}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {c.overallStatus}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => downloadCertificate(c)}
                  disabled={!c.completed}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm self-start sm:self-auto ${
                    c.completed
                      ? "bg-[#ff004f] hover:bg-[#e60047] text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Download size={14} /> Download Certificate
                </button>
              </div>

              {/* Expanded Report */}
              {expanded[c._id] && c.verification && (
                <div className="mt-4 overflow-x-auto">
                  <div
                    id={`cert-${c._id}`}
                    className="w-full border rounded-lg shadow-sm overflow-hidden"
                  >
                    <div className="bg-[#007bff] text-white text-center py-3 font-bold text-lg md:text-xl">
                      Candidate Verification Report
                    </div>

                    <div className="p-4 text-center text-sm text-gray-600">
                      <p>
                        <strong>
                          {c.firstName} {c.lastName}
                        </strong>
                      </p>
                      <p>Candidate ID: {c._id}</p>
                    </div>

                    {/* Table Header */}
                    <div className="bg-[#007bff] text-white grid grid-cols-3 font-semibold text-center text-sm md:text-base">
                      <div className="py-2 col-span-2 border-r border-white">
                        Verification Check
                      </div>
                      <div className="py-2">Status</div>
                    </div>

                    {/* Verification Stages */}
                    {Object.entries(c.verification.stages || {}).map(
                      ([stage, checks]) =>
                        checks.map((v, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-3 border-b border-gray-200 text-sm md:text-base"
                            style={{
                              backgroundColor:
                                idx % 2 === 0 ? "#f8fbff" : "white",
                            }}
                          >
                            <div className="col-span-2 px-3 py-2 border-r text-gray-800">
                              {v.check} ({stage})
                            </div>
                            <div className="flex items-center justify-between px-3 py-2">
                              <span
                                className={`font-medium ${
                                  v.status === "FAILED"
                                    ? "text-red-500"
                                    : v.status === "COMPLETED"
                                    ? "text-green-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {v.status}
                              </span>
                              {v.status === "FAILED" ? (
                                <XCircle size={18} className="text-red-500" />
                              ) : v.status === "COMPLETED" ? (
                                <CheckCircle2
                                  size={18}
                                  className="text-green-500"
                                />
                              ) : (
                                <Clock size={18} className="text-yellow-500" />
                              )}
                            </div>
                          </div>
                        ))
                    )}

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-500 py-4">
                      Generated by <strong>{orgName}</strong> on{" "}
                      {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
