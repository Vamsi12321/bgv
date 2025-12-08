"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Trash2,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";
import { useSuperAdminState } from "../../context/SuperAdminStateContext";

/* -----------------------------------------------------------
   MODAL COMPONENTS
------------------------------------------------------------*/
function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ isOpen, onClose, message, results }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Success">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 size={64} className="text-green-500" />
        </div>
        <h4 className="text-2xl font-bold text-gray-900">{message}</h4>
        {results && (
          <div className="text-left bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Total Processed:</span>{" "}
              {results.total_resumes_processed || 0}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Top Results:</span>{" "}
              {results.top_resumes?.length || 0}
            </p>
          </div>
        )}
        <button
          onClick={onClose}
          className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition"
        >
          View Results
        </button>
      </div>
    </Modal>
  );
}

function ErrorModal({ isOpen, onClose, message, details }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Error">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <XCircle size={64} className="text-red-500" />
        </div>
        <h4 className="text-2xl font-bold text-gray-900">{message}</h4>
        {details && (
          <div className="text-left bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 font-mono">{details}</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

/* -----------------------------------------------------------
   HELPER COMPONENTS
------------------------------------------------------------*/
function ScoreCircle({ score }) {
  const pct = Math.round(score);
  const color = pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            className="text-gray-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            strokeWidth="8"
            fill="transparent"
            stroke={color}
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={2 * Math.PI * 40 * (1 - pct / 100)}
            strokeLinecap="round"
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-xl font-bold"
          style={{ color }}
        >
          {pct}%
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-2 font-medium">Match Score</p>
    </div>
  );
}

function RequirementBadge({ label, status }) {
  return (
    <div
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 shadow-sm transition
      ${
        status === "met"
          ? "bg-green-50 border-green-400 text-green-700"
          : "bg-red-50 border-red-400 text-red-700"
      }`}
    >
      {label}: {status === "met" ? "✓ Met" : "✗ Not Met"}
    </div>
  );
}

function RecommendationBadge({ recommendation }) {
  const config = {
    GOOD_FIT: { bg: "bg-green-100", text: "text-green-700", label: "Good Fit" },
    MODERATE_FIT: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Moderate Fit",
    },
    WEAK_FIT: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      label: "Weak Fit",
    },
    REJECT: { bg: "bg-red-100", text: "text-red-700", label: "Reject" },
  };

  const style = config[recommendation] || config.REJECT;

  return (
    <span
      className={`px-4 py-1.5 rounded-full text-sm font-bold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

/* -----------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------*/
export default function AIResumeScreeningPage() {
  // State management context
  const { aiScreeningState = {}, setAiScreeningState = () => {} } =
    useSuperAdminState();

  // Local state - Initialize from context
  const [jdFile, setJdFile] = useState(null);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [topN, setTopN] = useState(aiScreeningState.topN || 5);
  const [mustHave, setMustHave] = useState(aiScreeningState.mustHave || "");
  const [niceToHave, setNiceToHave] = useState(aiScreeningState.niceToHave || "");
  const [results, setResults] = useState(aiScreeningState.results || []);
  const [enhancedResults, setEnhancedResults] = useState(aiScreeningState.enhancedResults || []);
  const [expanded, setExpanded] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [enhancedLoading, setEnhancedLoading] = useState(false);

  // Modal state
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: "",
    results: null,
  });
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
    details: "",
  });

  // Use ref to always have latest values for cleanup
  const stateRef = useRef({ topN, mustHave, niceToHave, results, enhancedResults });
  
  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = { topN, mustHave, niceToHave, results, enhancedResults };
  }, [topN, mustHave, niceToHave, results, enhancedResults]);

  // Save state on unmount (when navigating away)
  useEffect(() => {
    return () => {
      setAiScreeningState(stateRef.current);
    };
  }, [setAiScreeningState]);

  /* -----------------------------------------------------------
     FILE HANDLERS
  ------------------------------------------------------------*/
  const handleJdUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setJdFile(file);
    } else {
      setErrorModal({
        isOpen: true,
        message: "Invalid File Type",
        details: "Please upload a PDF file for the job description.",
      });
    }
  };

  const handleResumeUpload = (e) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter((f) => f.type === "application/pdf");

    if (pdfFiles.length !== files.length) {
      setErrorModal({
        isOpen: true,
        message: "Some Files Skipped",
        details: "Only PDF files are accepted. Non-PDF files were skipped.",
      });
    }

    setResumeFiles((prev) => [...prev, ...pdfFiles]);
  };

  const removeResume = (name) => {
    setResumeFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const clearAll = () => {
    setJdFile(null);
    setResumeFiles([]);
    setResults([]);
    setEnhancedResults([]);
    setExpanded(null);
  };

  /* -----------------------------------------------------------
     BASIC AI SCREENING
  ------------------------------------------------------------*/
  const handleBasic = async () => {
    if (!jdFile) {
      setErrorModal({
        isOpen: true,
        message: "Missing Job Description",
        details: "Please upload a job description PDF file.",
      });
      return;
    }

    if (resumeFiles.length === 0) {
      setErrorModal({
        isOpen: true,
        message: "Missing Resumes",
        details: "Please upload at least one resume PDF file.",
      });
      return;
    }

    // Clear previous results
    setResults([]);
    setExpanded(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("jd_file", jdFile);
    resumeFiles.forEach((f) => fd.append("resume_files", f));
    fd.append("top_n", topN);

    try {
      const res = await fetch("/api/proxy/secure/ai_resume_screening", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setResults(data.results?.top_resumes || []);

      setSuccessModal({
        isOpen: true,
        message: "Basic Screening Complete!",
        results: data.results,
      });
    } catch (error) {
      console.error("API Error:", error);
      setErrorModal({
        isOpen: true,
        message: "Screening Failed",
        details: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------------
     ENHANCED AI SCREENING
  ------------------------------------------------------------*/
  const handleEnhanced = async () => {
    if (!jdFile) {
      setErrorModal({
        isOpen: true,
        message: "Missing Job Description",
        details: "Please upload a job description PDF file.",
      });
      return;
    }

    if (resumeFiles.length === 0) {
      setErrorModal({
        isOpen: true,
        message: "Missing Resumes",
        details: "Please upload at least one resume PDF file.",
      });
      return;
    }

    // Clear previous results
    setEnhancedResults([]);
    setExpanded(null);
    setEnhancedLoading(true);

    const fd = new FormData();
    fd.append("jd_file", jdFile);
    resumeFiles.forEach((f) => fd.append("resume_files", f));
    fd.append("top_n", topN);
    fd.append("must_have_requirements", mustHave);
    fd.append("nice_to_have", niceToHave);
    fd.append("min_embedding_score", "0.5");


    try {
      const res = await fetch(
        "/api/proxy/secure/ai_resume_screening_enhanced",
        {
          method: "POST",
          credentials: "include",
          body: fd,
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setEnhancedResults(data.results?.top_resumes || []);

      setSuccessModal({
        isOpen: true,
        message: "Enhanced Screening Complete!",
        results: data.results,
      });
    } catch (error) {
      console.error("API Error:", error);
      setErrorModal({
        isOpen: true,
        message: "Enhanced Screening Failed",
        details: error.message,
      });
    } finally {
      setEnhancedLoading(false);
    }
  };

  /* -----------------------------------------------------------
     DOWNLOAD RESUME FILES
  ------------------------------------------------------------*/
  const downloadResumes = (type) => {
    const data = type === "basic" ? results : enhancedResults;

    if (data.length === 0) {
      setErrorModal({
        isOpen: true,
        message: "No Results to Download",
        details: "Please run screening first to get results.",
      });
      return;
    }

    // Download each matching resume file
    data.forEach((result) => {
      const matchingFile = resumeFiles.find(
        (file) => file.name === result.filename
      );

      if (matchingFile) {
        const url = URL.createObjectURL(matchingFile);
        const a = document.createElement("a");
        a.href = url;
        a.download = matchingFile.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    // Also download the report
    downloadReport(type, data);
  };

  /* -----------------------------------------------------------
     DOWNLOAD REPORT
  ------------------------------------------------------------*/
  const downloadReport = (type, data) => {
    // Create a formatted text report
    let report = `AI RESUME SCREENING REPORT\n`;
    report += `Type: ${type.toUpperCase()}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Total Candidates: ${data.length}\n`;
    report += `\n${"=".repeat(80)}\n\n`;

    data.forEach((res, idx) => {
      report += `RANK #${res.rank || idx + 1}: ${res.filename}\n`;
      report += `${"-".repeat(80)}\n`;

      if (res.final_weighted_score !== undefined) {
        report += `Final Score: ${res.final_weighted_score}\n`;
      }
      if (res.match_score !== undefined) {
        report += `Match Score: ${res.match_score}%\n`;
      }
      if (res.recommendation) {
        report += `Recommendation: ${res.recommendation}\n`;
      }

      report += `\n`;

      if (res.summary) {
        report += `SUMMARY:\n${res.summary}\n\n`;
      }

      if (res.critical_requirements_status) {
        report += `CRITICAL REQUIREMENTS:\n`;
        Object.entries(res.critical_requirements_status).forEach(
          ([key, value]) => {
            report += `  ${
              value === "met" ? "✓" : "✗"
            } ${key}: ${value.toUpperCase()}\n`;
          }
        );
        report += `\n`;
      }

      if (res.strengths && res.strengths.length > 0) {
        report += `STRENGTHS:\n`;
        res.strengths.forEach((s) => {
          report += `  ✓ ${s}\n`;
        });
        report += `\n`;
      }

      if (res.weaknesses && res.weaknesses.length > 0) {
        report += `WEAKNESSES:\n`;
        res.weaknesses.forEach((w) => {
          report += `  ✗ ${w}\n`;
        });
        report += `\n`;
      }

      if (res.skills_match) {
        if (res.skills_match.matched && res.skills_match.matched.length > 0) {
          report += `MATCHED SKILLS: ${res.skills_match.matched.join(", ")}\n`;
        }
        if (res.skills_match.missing && res.skills_match.missing.length > 0) {
          report += `MISSING SKILLS: ${res.skills_match.missing.join(", ")}\n`;
        }
        report += `\n`;
      }

      if (res.experience_match) {
        const exp =
          typeof res.experience_match === "string"
            ? res.experience_match
            : res.experience_match.assessment;
        report += `EXPERIENCE: ${exp}\n\n`;
      }

      if (res.education_match) {
        report += `EDUCATION: ${res.education_match}\n\n`;
      }

      report += `${"=".repeat(80)}\n\n`;
    });

    // Download as text file
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-screening-${type}-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* -----------------------------------------------------------
     RENDER RESUME CARD
  ------------------------------------------------------------*/
  const renderResumeCard = (res, idx, type) => {
    const isExpanded = expanded === `${type}-${idx}`;

    return (
      <div
        key={idx}
        className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden transition-all hover:shadow-2xl"
      >
        {/* Header */}
        <div
          className="flex justify-between items-center p-5 cursor-pointer bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition"
          onClick={() => setExpanded(isExpanded ? null : `${type}-${idx}`)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="text-[#ff004f]" size={20} />
              <p className="font-bold text-lg text-gray-900">{res.filename}</p>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {res.rank && (
                <span className="px-3 py-1 bg-[#ff004f] text-white text-xs font-bold rounded-full">
                  Rank #{res.rank}
                </span>
              )}

              {res.recommendation && (
                <RecommendationBadge recommendation={res.recommendation} />
              )}

              {res.final_weighted_score !== undefined && (
                <span className="text-sm text-gray-600 font-semibold">
                  Score:{" "}
                  <span className="text-[#ff004f]">
                    {res.final_weighted_score}
                  </span>
                </span>
              )}

              {res.match_score !== undefined && (
                <span className="text-sm text-gray-600 font-semibold">
                  Match:{" "}
                  <span className="text-[#ff004f]">{res.match_score}%</span>
                </span>
              )}
            </div>
          </div>

          <div className="ml-4">
            {isExpanded ? (
              <ChevronUp className="text-gray-400" size={24} />
            ) : (
              <ChevronDown className="text-gray-400" size={24} />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-6 space-y-6 bg-gray-50 border-t">
            {/* Score Circle */}
            <div className="flex justify-center">
              <ScoreCircle
                score={res.final_weighted_score || res.match_score || 0}
              />
            </div>

            {/* Summary */}
            {res.summary && (
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={18} className="text-blue-500" />
                  Summary
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {res.summary}
                </p>
              </div>
            )}

            {/* Critical Requirements */}
            {res.critical_requirements_status && (
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h4 className="font-bold text-gray-900 mb-3">
                  Critical Requirements
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(res.critical_requirements_status).map(
                    ([key, value], i) => (
                      <RequirementBadge key={i} label={key} status={value} />
                    )
                  )}
                </div>
              </div>
            )}

            {/* Strengths */}
            {res.strengths && res.strengths.length > 0 && (
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {res.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-green-500 font-bold">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {res.weaknesses && res.weaknesses.length > 0 && (
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                  <XCircle size={18} />
                  Weaknesses
                </h4>
                <ul className="space-y-2">
                  {res.weaknesses.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-red-500 font-bold">✗</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills Match */}
            {res.skills_match && (
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h4 className="font-bold text-gray-900 mb-3">Skills Match</h4>

                {res.skills_match.matched &&
                  res.skills_match.matched.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-green-700 mb-2">
                        Matched Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {res.skills_match.matched.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {res.skills_match.missing &&
                  res.skills_match.missing.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-700 mb-2">
                        Missing Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {res.skills_match.missing.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Experience Match */}
            {res.experience_match && (
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h4 className="font-bold text-gray-900 mb-2">
                  Experience Match
                </h4>
                <p className="text-sm text-gray-700">
                  {typeof res.experience_match === "string"
                    ? res.experience_match
                    : res.experience_match.assessment}
                </p>
              </div>
            )}

            {/* Education Match */}
            {res.education_match && (
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h4 className="font-bold text-gray-900 mb-2">
                  Education Match
                </h4>
                <p className="text-sm text-gray-700">{res.education_match}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* -----------------------------------------------------------
     RETURN UI
  ------------------------------------------------------------*/
  return (
    <>
      {/* Modals */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() =>
          setSuccessModal({ isOpen: false, message: "", results: null })
        }
        message={successModal.message}
        results={successModal.results}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() =>
          setErrorModal({ isOpen: false, message: "", details: "" })
        }
        message={errorModal.message}
        details={errorModal.details}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={24} className="text-[#ff004f]" />
              AI Resume Screening
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Upload job descriptions and resumes to find best candidates
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Upload Files</h2>
              {(jdFile || resumeFiles.length > 0) && (
                <button
                  onClick={clearAll}
                  className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-2 transition"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}
            </div>

            {/* JD Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Job Description (PDF) <span className="text-red-500">*</span>
              </label>
              <label className="cursor-pointer flex items-center justify-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 p-6 rounded-xl hover:border-[#ff004f] hover:bg-gray-50 transition group">
                <Upload
                  size={24}
                  className="text-gray-400 group-hover:text-[#ff004f] transition"
                />
                <span className="text-gray-600 group-hover:text-[#ff004f] font-medium transition">
                  {jdFile ? jdFile.name : "Choose Job Description PDF"}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleJdUpload}
                />
              </label>
              {jdFile && (
                <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 size={16} />
                  <span className="font-medium">{jdFile.name}</span>
                </div>
              )}
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Resumes (PDF) <span className="text-red-500">*</span>
              </label>
              <label className="cursor-pointer flex items-center justify-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 p-6 rounded-xl hover:border-[#ff004f] hover:bg-gray-50 transition group">
                <Upload
                  size={24}
                  className="text-gray-400 group-hover:text-[#ff004f] transition"
                />
                <span className="text-gray-600 group-hover:text-[#ff004f] font-medium transition">
                  Choose Resume PDFs (Multiple)
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
              </label>

              {/* File List */}
              {resumeFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">
                    {resumeFiles.length} Resume
                    {resumeFiles.length > 1 ? "s" : ""} Uploaded
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {resumeFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border hover:border-gray-300 transition"
                      >
                        <span className="text-sm text-gray-700 truncate flex-1">
                          {f.name}
                        </span>
                        <button
                          onClick={() => removeResume(f.name)}
                          className="ml-2 text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Top N Results
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="w-full border-2 border-gray-300 p-3 rounded-xl focus:border-[#ff004f] focus:outline-none transition text-gray-900"
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Must Have Requirements (comma separated)
                </label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-300 p-3 rounded-xl focus:border-[#ff004f] focus:outline-none transition text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., Python 5+ years, AWS certification, Team leadership"
                  value={mustHave}
                  onChange={(e) => setMustHave(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nice to Have (comma separated)
              </label>
              <input
                type="text"
                className="w-full border-2 border-gray-300 p-3 rounded-xl focus:border-[#ff004f] focus:outline-none transition text-gray-900 placeholder:text-gray-500"
                placeholder="e.g., Docker, Kubernetes, Microservices"
                value={niceToHave}
                onChange={(e) => setNiceToHave(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <button
                className="bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] text-white py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 font-bold text-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBasic}
                disabled={loading || enhancedLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Basic Screening
                  </>
                )}
              </button>

              <button
                className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 font-bold text-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleEnhanced}
                disabled={loading || enhancedLoading}
              >
                {enhancedLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Enhanced Screening
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {(results.length > 0 || enhancedResults.length > 0) && (
            <div className="space-y-8">
              {/* Basic Results */}
              {results.length > 0 && (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Basic Screening Results
                    </h2>
                    <button
                      onClick={() => downloadResumes("basic")}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold"
                    >
                      <Download size={18} />
                      Download Resumes
                    </button>
                  </div>
                  <div className="space-y-4">
                    {results.map((res, idx) =>
                      renderResumeCard(res, idx, "basic")
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Results */}
              {enhancedResults.length > 0 && (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Enhanced Screening Results
                    </h2>
                    <button
                      onClick={() => downloadResumes("enhanced")}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold"
                    >
                      <Download size={18} />
                      Download Resumes
                    </button>
                  </div>
                  <div className="space-y-4">
                    {enhancedResults.map((res, idx) =>
                      renderResumeCard(res, idx, "enhanced")
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
