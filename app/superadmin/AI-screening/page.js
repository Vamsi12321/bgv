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
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import { useSuperAdminState } from "../../context/SuperAdminStateContext";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { safeHtml2Canvas } from "@/utils/safeHtml2Canvas";

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
   CERTIFICATE COMPONENT FOR PDF GENERATION
------------------------------------------------------------*/
function CertificateComponent({ id, result, type, timestamp }) {
  const isPositive = ["GOOD_FIT", "MODERATE_FIT"].includes(result.recommendation);
  
  return (
    <div
      id={id}
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: "10px 50px 60px 50px",
        background: "#ffffff",
        fontFamily: "Arial, sans-serif",
        position: "relative",
        color: "#000",
        overflow: "hidden",
      }}
    >
      {/* Watermark */}
      <img
        src="/logos/maihooMain.png"
        alt="watermark"
        style={{
          position: "absolute",
          top: "300px",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.08,
          width: "750px",
          height: "750px",
          objectFit: "contain",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, marginTop: "-10px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "35px",
            marginBottom: "25px",
            marginTop: "0",
          }}
        >
          <div style={{ flexShrink: 0, marginTop: "5px" }}>
            <img
              src="/logos/maihooMain.png"
              alt="logo"
              style={{
                maxHeight: "180px",
                maxWidth: "450px",
                height: "auto",
                width: "auto",
                display: "block",
                objectFit: "contain",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              gap: "2px",
              marginTop: "55px",
            }}
          >
            <h1
              style={{
                fontSize: "26px",
                fontWeight: "900",
                margin: 0,
                lineHeight: "1",
                fontFamily: "Arial Black, Arial, sans-serif",
              }}
            >
              AI Resume Screening
            </h1>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: "900",
                margin: 0,
                lineHeight: "1",
                fontFamily: "Arial Black, Arial, sans-serif",
              }}
            >
              {type === "basic" ? "Basic" : "Enhanced"} Report
            </h2>
          </div>
        </div>

        {/* Candidate Details */}
        <div
          style={{
            fontSize: "15px",
            lineHeight: "28px",
            marginBottom: "25px",
            marginTop: "-20px",
          }}
        >
          <p>
            <b>Candidate:</b> {result.filename}
          </p>
          <p>
            <b>Rank:</b> #{result.rank}
          </p>
          <p>
            <b>Score:</b> {result.final_weighted_score || result.match_score}
          </p>
          <p>
            <b>Recommendation:</b> {result.recommendation}
          </p>
          <p>
            <b>Screening Type:</b> {type === "basic" ? "Basic Screening" : "Enhanced Screening"}
          </p>
          <p>
            <b>Generated:</b> {timestamp}
          </p>
          <p style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <b>Status:</b>
            <span
              style={{
                color: isPositive ? "#5cb85c" : "#d9534f",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              {isPositive ? "✓ Recommended" : "✗ Not Recommended"}
            </span>
          </p>
        </div>

        {/* Separator */}
        <div
          style={{
            width: "100%",
            height: "3px",
            background: "#000",
            margin: "20px 0 30px 0",
          }}
        />
       

        {/* Strengths */}
        {result.strengths && result.strengths.length > 0 && (
          <>
            {/* Green Status Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "35px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "28px",
                  background: "#5cb85c",
                  borderRadius: "5px",
                }}
              />
              <div
                style={{
                  width:"25%",
                  height: "2px",
                  background: "#5cb85c",
                  marginLeft: "10px",
                }}
              />
            </div>

           {/* strengths */}
            <div style={{ marginBottom: "30px" }}>
              {result.strengths.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "18px", marginRight: "10px" }}>✓</span>
                  <span style={{ fontSize: "14px" }}>{item}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Weaknesses */}
        {result.weaknesses && result.weaknesses.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "28px",
                  background: "#d9534f",
                  borderRadius: "5px",
                }}
              />
              <div
                style={{
                  width:"25%",
                  height: "2px",
                  background: "#d9534f",
                  marginLeft: "10px",
                }}
              />
            </div>

            {/* weakness */}
            {result.weaknesses.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    marginRight: "10px",
                    fontSize: "18px",
                    color: "#d9534f",
                  }}
                >
                  ✓
                </span>
                <span style={{ fontSize: "14px" }}>{item}</span>
              </div>
            ))}
          </>
        )}

        {/* Skills Match */}
        {result.skills_match && (
          <>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#333",
                marginBottom: "10px",
                marginTop: "30px",
              }}
            >
              Skills Analysis
            </h3>
            {result.skills_match.matched && result.skills_match.matched.length > 0 && (
              <div style={{ marginBottom: "15px" }}>
                <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                  Matched Skills:
                </p>
                <p style={{ fontSize: "14px" }}>
                  {result.skills_match.matched.join(", ")}
                </p>
              </div>
            )}
            {result.skills_match.missing && result.skills_match.missing.length > 0 && (
              <div style={{ marginBottom: "15px" }}>
                <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                  Missing Skills:
                </p>
                <p style={{ fontSize: "14px", color: "#d9534f" }}>
                  {result.skills_match.missing.join(", ")}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50px",
          right: "50px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            height: "2px",
            background: "#dc3545",
            width: "100%",
            marginBottom: "10px",
          }}
        />
        <p
          style={{
            fontSize: "12px",
            color: "#dc3545",
            fontWeight: "600",
            margin: 0,
            lineHeight: "1.4",
          }}
        >
          Maihoo Technologies Private Limited, Vaishnavi's Cynosure, 2-48/5/6,
          <br />
          8th Floor, Opp RTCC, Telecom Nagar Extension, Gachibowli-500032
        </p>
      </div>
    </div>
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
    const validFiles = files.filter(
      (f) => 
        f.type === "application/pdf" || 
        f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        f.type === "application/msword"
    );

    if (validFiles.length !== files.length) {
      setErrorModal({
        isOpen: true,
        message: "Some Files Skipped",
        details: "Only PDF and DOCX files are accepted. Other files were skipped.",
      });
    }

    setResumeFiles((prev) => [...prev, ...validFiles]);
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
     DOWNLOAD ALL RESUMES
  ------------------------------------------------------------*/
  const downloadResumes = async (type) => {
    const data = type === "basic" ? results : enhancedResults;

    if (data.length === 0) {
      setErrorModal({
        isOpen: true,
        message: "No Results to Download",
        details: "Please run screening first to get results.",
      });
      return;
    }

    setLoading(true);

    try {
      // Download each matching resume file
      for (const result of data) {
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
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      setSuccessModal({
        isOpen: true,
        message: `Downloaded ${data.length} resume(s) successfully!`,
      });
    } catch (error) {
      setErrorModal({
        isOpen: true,
        message: "Download Failed",
        details: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------------
     DOWNLOAD TEXT REPORT
  ------------------------------------------------------------*/
  const downloadReport = (type, data) => {
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

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-screening-${type}-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* -----------------------------------------------------------
     DOWNLOAD EXCEL/CSV REPORT
  ------------------------------------------------------------*/
  const downloadExcelReport = (type) => {
    const data = type === "basic" ? results : enhancedResults;

    if (data.length === 0) {
      setErrorModal({
        isOpen: true,
        message: "No Results to Download",
        details: "Please run screening first to get results.",
      });
      return;
    }

    // Prepare data for Excel
    const excelData = data.map((res) => ({
      "Rank": res.rank || "-",
      "Candidate Name": res.filename,
      "Score": res.final_weighted_score || res.match_score || "-",
      "Recommendation": res.recommendation || "-",
      "Matched Skills": res.skills_match?.matched?.join(", ") || "-",
      "Missing Skills": res.skills_match?.missing?.join(", ") || "-",
      "Strengths": res.strengths?.join("; ") || "-",
      "Weaknesses": res.weaknesses?.join("; ") || "-",
      "Experience Match": typeof res.experience_match === "string" 
        ? res.experience_match 
        : res.experience_match?.assessment || "-",
      "Education Match": res.education_match || "-",
      "Summary": res.summary || "-",
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 6 },  // Rank
      { wch: 30 }, // Candidate Name
      { wch: 10 }, // Score
      { wch: 15 }, // Recommendation
      { wch: 40 }, // Matched Skills
      { wch: 40 }, // Missing Skills
      { wch: 50 }, // Strengths
      { wch: 50 }, // Weaknesses
      { wch: 40 }, // Experience Match
      { wch: 40 }, // Education Match
      { wch: 60 }, // Summary
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AI Screening Results");

    // Download as Excel file
    XLSX.writeFile(wb, `ai-screening-${type}-report-${Date.now()}.xlsx`);

    setSuccessModal({
      isOpen: true,
      message: "Excel Report Downloaded Successfully!",
    });
  };

  /* -----------------------------------------------------------
     DOWNLOAD PDF CERTIFICATES FOR ALL CANDIDATES
  ------------------------------------------------------------*/
  const downloadPDFCertificates = async (type) => {
    const data = type === "basic" ? results : enhancedResults;

    if (data.length === 0) {
      setErrorModal({
        isOpen: true,
        message: "No Results to Download",
        details: "Please run screening first to get results.",
      });
      return;
    }

    setLoading(true);

    try {
      const timestamp = new Date().toLocaleString();

      for (let i = 0; i < data.length; i++) {
        const result = data[i];
        
        // Create a temporary container for the certificate
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "794px";
        container.style.minHeight = "1123px";
        container.style.zIndex = "-9999";
        container.style.opacity = "0";
        container.style.pointerEvents = "none";
        document.body.appendChild(container);

        // Render certificate component
        const certId = `cert-${i}`;
        container.innerHTML = `
          <div id="${certId}">
            ${renderCertificateHTML(result, type, timestamp)}
          </div>
        `;

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate PDF
        const certElement = document.getElementById(certId);
        const canvas = await safeHtml2Canvas(certElement, { scale: 2 });
        const canvasWidth = canvas?.width || 1;
        const canvasHeight = canvas?.height || 1;

        const jpeg = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jsPDF("p", "pt", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = (canvasHeight * pageWidth) / canvasWidth;

        pdf.addImage(jpeg, "JPEG", 0, 0, pageWidth, pageHeight);
        pdf.save(`AI-Screening-Certificate-${result.filename.replace('.pdf', '')}-${Date.now()}.pdf`);

        // Clean up
        document.body.removeChild(container);

        // Small delay between PDFs
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setSuccessModal({
        isOpen: true,
        message: `Downloaded ${data.length} PDF certificate(s) successfully!`,
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      setErrorModal({
        isOpen: true,
        message: "PDF Generation Failed",
        details: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------------
     RENDER CERTIFICATE HTML (Helper for PDF generation)
  ------------------------------------------------------------*/
  const renderCertificateHTML = (result, type, timestamp) => {
    const isPositive = ["GOOD_FIT", "MODERATE_FIT"].includes(result.recommendation);
    
    return `
      <div style="width: 794px; min-height: 1123px; padding: 10px 50px 60px 50px; background: #ffffff; font-family: Arial, sans-serif; position: relative; color: #000; overflow: hidden;">
        <img src="/logos/maihooMain.png" alt="watermark" style="position: absolute; top: 300px; left: 50%; transform: translateX(-50%); opacity: 0.08; width: 750px; height: 750px; object-fit: contain; z-index: 1; pointer-events: none;" />
        
        <div style="position: relative; z-index: 2; margin-top: -10px;">
          <div style="display: flex; align-items: flex-start; gap: 35px; margin-bottom: 25px; margin-top: 0;">
            <div style="flex-shrink: 0; margin-top: 5px;">
              <img src="/logos/maihooMain.png" alt="logo" style="max-height: 180px; max-width: 450px; height: auto; width: auto; display: block; object-fit: contain;" />
            </div>
            <div style="display: flex; flex-direction: column; justify-content: flex-start; gap: 2px; margin-top: 55px;">
              <h1 style="font-size: 26px; font-weight: 900; margin: 0; line-height: 1; font-family: Arial Black, Arial, sans-serif;">AI Resume Screening</h1>
              <h2 style="font-size: 26px; font-weight: 900; margin: 0; line-height: 1; font-family: Arial Black, Arial, sans-serif;">${type === "basic" ? "Basic" : "Enhanced"} Report</h2>
            </div>
          </div>
          
          <div style="font-size: 15px; line-height: 28px; margin-bottom: 25px; margin-top: -20px;">
            <p><b>Candidate:</b> ${result.filename}</p>
            <p><b>Rank:</b> #${result.rank}</p>
            <p><b>Score:</b> ${result.final_weighted_score || result.match_score}</p>
            <p><b>Recommendation:</b> ${result.recommendation}</p>
            <p><b>Screening Type:</b> ${type === "basic" ? "Basic Screening" : "Enhanced Screening"}</p>
            <p><b>Generated:</b> ${timestamp}</p>
            <p style="display: flex; align-items: center; gap: 10px;">
              <b>Status:</b>
              <span style="color: ${isPositive ? "#5cb85c" : "#d9534f"}; font-weight: bold; font-size: 16px;">
                ${isPositive ? "✓ Recommended" : "✗ Not Recommended"}
              </span>
            </p>
          </div>
          
          <div style="width: 100%; height: 3px; background: #000; margin: 20px 0 30px 0;"></div>
          
          
          ${result.strengths && result.strengths.length > 0 ? `
            <div style="display: flex; align-items: center; margin-bottom: 35px;">
              <div style="width: 60px; height: 28px; background: #5cb85c; border-radius: 5px;"></div>
              <div style=" width:25%; height: 2px; background: #5cb85c; margin-left: 10px;"></div>
            </div>
            

            <div style="margin-bottom: 10px;">
              ${result.strengths.map(item => `
                <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                  <span style="font-size: 18px; margin-right: 10px;">✓</span>
                  <span style="font-size: 14px;">${item}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${result.weaknesses && result.weaknesses.length > 0 ? `
            <div style="display: flex; align-items: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 28px; background: #d9534f; border-radius: 5px;"></div>
              <div style=" width:25%; height: 2px; background: #d9534f; margin-left: 10px;"></div>
            </div>
    
            ${result.weaknesses.map(item => `
              <div style="display: flex; margin-bottom: 5px;">
                <span style="margin-right: 10px; font-size: 18px; color: #d9534f;">✓</span>
                <span style="font-size: 14px;">${item}</span>
              </div>
            `).join('')}
          ` : ''}
          
         
        </div>
        
        <div style="position: absolute; bottom: 10px; left: 50px; right: 50px; text-align: center;">
          <div style="height: 2px; background: #dc3545; width: 100%; margin-bottom: 10px;"></div>
          <p style="font-size: 12px; color: #dc3545; font-weight: 600; margin: 0; line-height: 1.4;">
            Maihoo Technologies Private Limited, Vaishnavi's Cynosure, 2-48/5/6,<br/>
            8th Floor, Opp RTCC, Telecom Nagar Extension, Gachibowli-500032
          </p>
        </div>
      </div>
    `;
  };

  /* -----------------------------------------------------------
     DOWNLOAD ALL (Resumes + Reports + Certificates + Excel)
  ------------------------------------------------------------*/
  const downloadAll = async (type) => {
    const data = type === "basic" ? results : enhancedResults;

    if (data.length === 0) {
      setErrorModal({
        isOpen: true,
        message: "No Results to Download",
        details: "Please run screening first to get results.",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Download all resumes
      await downloadResumes(type);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Download text report
      downloadReport(type, data);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Download Excel report
      downloadExcelReport(type);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Download PDF certificates
      await downloadPDFCertificates(type);

      setSuccessModal({
        isOpen: true,
        message: "All files downloaded successfully!",
      });
    } catch (error) {
      setErrorModal({
        isOpen: true,
        message: "Download Failed",
        details: error.message,
      });
    } finally {
      setLoading(false);
    }
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

      {/* Loading Overlay for Downloads */}
      {(loading || enhancedLoading) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-md">
            <div className="relative">
              <Loader2 className="animate-spin text-[#ff004f]" size={48} />
              <div className="absolute inset-0 rounded-full bg-[#ff004f]/20 animate-ping"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {loading ? "Basic Screening AI Please Wait..." : "Enhanced Screening AI Please Wait..."}
              </h3>
              <p className="text-sm text-gray-600">
                Please wait while we process your screening
              </p>
            </div>
          </div>
        </div>
      )}

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
                  accept=".pdf,.doc,.docx"
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
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Basic Screening Results
                      </h2>
                      <span className="text-sm text-gray-600 font-semibold">
                        {results.length} Candidate{results.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    
                    {/* Download Options */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => downloadResumes("basic")}
                        disabled={loading}
                        className="group relative flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Download size={18} className="relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10">Resume PDFs</span>
                      </button>
                      
                      <button
                        onClick={() => downloadPDFCertificates("basic")}
                        disabled={loading}
                        className="group relative flex items-center gap-2 bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white px-5 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#e60047] to-[#ff004f] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <FileDown size={18} className="relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10">Certificates</span>
                      </button>
                      
                      <button
                        onClick={() => downloadExcelReport("basic")}
                        disabled={loading}
                        className="group relative flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <FileSpreadsheet size={18} className="relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10">Excel Report</span>
                      </button>
                      
                      <button
                        onClick={() => downloadReport("basic", results)}
                        disabled={loading}
                        className="group relative flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-5 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <FileText size={18} className="relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10">Text Summary</span>
                      </button>
                      
                      <button
                        onClick={() => downloadAll("basic")}
                        disabled={loading}
                        className="group relative flex items-center gap-2 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white px-5 py-3 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden border-2 border-purple-400"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Download size={20} className="relative z-10 group-hover:animate-pulse" />
                        <span className="relative z-10">Complete Package</span>
                      </button>
                    </div>
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
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Enhanced Screening Results
                      </h2>
                      <span className="text-sm text-gray-600 font-semibold">
                        {enhancedResults.length} Candidate{enhancedResults.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    
                    {/* Download Options */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => downloadResumes("enhanced")}
                        disabled={loading || enhancedLoading}
                        className="group relative flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Download size={18} className="relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10">Resume PDFs</span>
                      </button>
                      
                      <button
                        onClick={() => downloadPDFCertificates("enhanced")}
                        disabled={loading || enhancedLoading}
                        className="group relative flex items-center gap-2 bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white px-5 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#e60047] to-[#ff004f] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <FileDown size={18} className="relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10">Certificates</span>
                      </button>
                      
                      <button
                        onClick={() => downloadExcelReport("enhanced")}
                        disabled={loading || enhancedLoading}
                        className="group relative flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <FileSpreadsheet size={18} className="relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10">Excel Report</span>
                      </button>
                      
                      <button
                        onClick={() => downloadReport("enhanced", enhancedResults)}
                        disabled={loading || enhancedLoading}
                        className="group relative flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-5 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <FileText size={18} className="relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10">Text Summary</span>
                      </button>
                      
                      <button
                        onClick={() => downloadAll("enhanced")}
                        disabled={loading || enhancedLoading}
                        className="group relative flex items-center gap-2 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white px-5 py-3 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden border-2 border-purple-400"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Download size={20} className="relative z-10 group-hover:animate-pulse" />
                        <span className="relative z-10">Complete Package</span>
                      </button>
                    </div>
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