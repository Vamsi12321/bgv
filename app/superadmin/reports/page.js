"use client";
import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  FileText,
} from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  // 🧩 Simulate fetch from API
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setReports(sampleReports);
      setLoading(false);
    }, 1000); // simulate delay
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 🧩 Simulate report download (mock PDF)
  const downloadReport = (candidateId, type) => {
    const blob = new Blob(
      [
        `This is a mock ${type} verification report for Candidate ${candidateId}.\nGenerated for demo purposes.`,
      ],
      { type: "application/pdf" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidateId}_${type}_Report.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadAllReports = (candidateId) => {
    const blob = new Blob(
      [
        `Mock combined ZIP archive for Candidate ${candidateId}\nContains primary, secondary, and final reports.`,
      ],
      { type: "application/zip" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidateId}_All_Reports.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="p-4 sm:p-8 text-gray-900 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="text-[#ff004f]" />
          Candidate Reports
        </h1>
        {loading && (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="animate-spin" size={18} />
            Fetching reports...
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600 text-center mt-20">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500 text-center mt-20 italic">
          No completed verifications found.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 divide-y">
          {reports.map((r) => (
            <div key={r._id} className="p-4">
              <div className="flex items-center justify-between">
                <div
                  onClick={() => toggleExpand(r._id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {expanded[r._id] ? (
                    <ChevronDown className="text-gray-600" size={20} />
                  ) : (
                    <ChevronRight className="text-gray-600" size={20} />
                  )}
                  <div>
                    <h2 className="font-semibold text-lg text-gray-800">
                      {r.candidateName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Candidate ID: {r.candidateId} — {r.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadAllReports(r.candidateId)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                >
                  <Download size={14} /> All Reports
                </button>
              </div>

              {expanded[r._id] && (
                <div className="mt-4 pl-6 space-y-3">
                  {r.reports.map((type) => (
                    <div
                      key={type}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3"
                    >
                      <p className="capitalize font-medium text-gray-700">
                        {type} Verification Report
                      </p>
                      <button
                        onClick={() => downloadReport(r.candidateId, type)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                      >
                        <Download size={14} /> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 🧩 Mock sample data (like API response)
const sampleReports = [
  {
    _id: "r001",
    candidateId: "CAND123",
    candidateName: "Ravi Kumar",
    status: "Completed",
    reports: ["primary", "secondary", "final"],
  },
  {
    _id: "r002",
    candidateId: "CAND124",
    candidateName: "Ananya Sharma",
    status: "Completed",
    reports: ["primary", "final"],
  },
  {
    _id: "r003",
    candidateId: "CAND125",
    candidateName: "Vikram Singh",
    status: "Completed",
    reports: ["primary", "secondary"],
  },
];
