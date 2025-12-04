"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Loader2,
  Sparkles,
  CheckCircle,
  XCircle,
  FileDown,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  Building2,
  User,
  FileText,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { safeHtml2Canvas } from "@/utils/safeHtml2Canvas";
import { useSuperAdminState } from "../../context/SuperAdminStateContext";

/* -------------------------------------------------------------
   MODAL COMPONENTS
------------------------------------------------------------- */
function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-gray-50 to-white">
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
      </motion.div>
    </div>
  );
}

function SuccessModal({ isOpen, onClose, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Success">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle size={64} className="text-green-500" />
        </div>
        <h4 className="text-2xl font-bold text-gray-900">{message}</h4>
        <button
          onClick={onClose}
          className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition"
        >
          Continue
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
            <p className="text-sm text-red-700">{details}</p>
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

/* -------------------------------------------------------------
   PDF CERTIFICATE COMPONENT
------------------------------------------------------------- */
function CertificateBase({ id, candidate, orgName, ai }) {
  const positives = ai?.positive_findings || [];
  const redflags = ai?.red_flags || [];

  return (
    <div
      id={id}
      style={{
        width: "860px",
        minHeight: "1120px",
        padding: "50px 60px",
        background: "#ffffff",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src="/logos/maihooMain.png"
          alt="logo"
          style={{
            height: "195px",
            objectFit: "contain",
            marginBottom: "10px",
          }}
        />
        <div
          style={{
            fontSize: "36px",
            fontWeight: "700",
            lineHeight: "42px",
            textDecoration: "underline",
          }}
        >
          AI CV Verification Report
        </div>
      </div>

      <div style={{ marginTop: "20px", fontSize: "20px", lineHeight: "30px" }}>
        <p><b>Candidate Name:</b> {candidate?.firstName} {candidate?.lastName}</p>
        <p><b>Candidate ID:</b> {candidate?._id}</p>
        <p><b>Organization:</b> {orgName}</p>
        <p><b>Verification Time:</b> {new Date().toLocaleString()}</p>
        <p><b>Score:</b> {ai?.authenticity_score}/100</p>
        <p><b>Recommendation:</b> {ai?.recommendation}</p>
      </div>

      <div style={{ height: "2px", width: "100%", background: "#000", marginTop: "18px", marginBottom: "26px" }} />

      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        <div style={{ width: "70px", height: "30px", background: "#6ac46a", borderRadius: "5px" }} />
        <div style={{ flexGrow: 1, height: "3px", background: "#6ac46a", marginLeft: "14px" }} />
      </div>

      <div style={{ marginTop: "16px", fontSize: "30px", fontWeight: "700", color: "#2c7a2c" }}>
        Positive Findings
      </div>

      <div style={{ marginTop: "10px", marginLeft: "40px" }}>
        {positives.map((item, i) => (
          <div key={i} style={{ display: "flex", marginBottom: "14px", fontSize: "24px", lineHeight: "32px" }}>
            <span style={{ marginRight: "10px" }}>✓</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      {redflags.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", marginTop: "26px" }}>
            <div style={{ width: "70px", height: "30px", background: "#d9534f", borderRadius: "5px" }} />
            <div style={{ flexGrow: 1, height: "3px", background: "#d9534f", marginLeft: "14px" }} />
          </div>

          <div style={{ marginTop: "16px", fontSize: "30px", fontWeight: "700", color: "#d9534f" }}>
            Red Flags
          </div>

          <div style={{ marginTop: "10px", marginLeft: "40px" }}>
            {redflags.map((rf, i) => (
              <div key={i} style={{ display: "flex", marginBottom: "14px", fontSize: "24px", lineHeight: "32px" }}>
                <span style={{ marginRight: "10px", color: "#d9534f" }}>✓</span>
                <span><b>{rf.severity}</b> – {rf.description}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <div style={{ width: "100%", height: "2px", background: "#d9534f" }} />
        <div style={{ fontSize: "20px", fontWeight: "600", color: "#d9534f", marginTop: "10px" }}>
          Maihoo Technologies Private Limited, Vaishnavi's Cynosure, 2-48/5/6,
          8th Floor, Opp RTCC, Telecom Nagar Extension, Gachibowli-500032
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   MAIN PAGE
------------------------------------------------------------- */
export default function SuperAdminAICVVerificationPage() {
  // State management context
  const {
    aiCVVerificationState = {},
    setAiCVVerificationState = () => {},
  } = useSuperAdminState();

  // Local state
  const [organizations, setOrganizations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [verificationId, setVerificationId] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [finalRemarks, setFinalRemarks] = useState("");
  
  // Loading states
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  
  // UI states
  const [expanded, setExpanded] = useState({});
  
  // Modal states
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: "" });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "", details: "" });
  
  const pdfRef = useRef(null);

  // Load state from context on mount
  useEffect(() => {
    if (aiCVVerificationState.selectedOrg) {
      setSelectedOrg(aiCVVerificationState.selectedOrg);
    }
    if (aiCVVerificationState.analysis) {
      setAnalysis(aiCVVerificationState.analysis);
    }
    if (aiCVVerificationState.finalRemarks) {
      setFinalRemarks(aiCVVerificationState.finalRemarks);
    }
  }, []);

  // Save state on unmount
  useEffect(() => {
    return () => {
      setAiCVVerificationState({
        selectedOrg,
        analysis,
        finalRemarks,
      });
    };
  }, [selectedOrg, analysis, finalRemarks]);

  /* ---------------- Load Organizations ---------------- */
  useEffect(() => {
    if (organizations.length === 0) {
      setLoadingOrgs(true);
      fetch(`/api/proxy/secure/getOrganizations`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setOrganizations(data.organizations || []);
        })
        .catch((err) => {
          setErrorModal({
            isOpen: true,
            message: "Failed to Load Organizations",
            details: err.message,
          });
        })
        .finally(() => setLoadingOrgs(false));
    }
  }, []);

  /* ---------------- Load Candidates ---------------- */
  useEffect(() => {
    if (!selectedOrg) {
      setCandidates([]);
      return;
    }
    
    setLoadingCandidates(true);
    fetch(`/api/proxy/secure/getCandidates?orgId=${selectedOrg}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data.candidates || []);
      })
      .catch((err) => {
        setErrorModal({
          isOpen: true,
          message: "Failed to Load Candidates",
          details: err.message,
        });
      })
      .finally(() => setLoadingCandidates(false));
  }, [selectedOrg]);

  /* ---------------- Fetch Verification ---------------- */
  const fetchVerification = async (candId) => {
    setAnalysis(null);
    setLoadingResults(true);
    
    try {
      const res = await fetch(
        `/api/proxy/secure/getVerifications?candidateId=${candId}`,
        { credentials: "include" }
      );
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      const ver = data.verifications?.[0];
      
      if (!ver) {
        setErrorModal({
          isOpen: true,
          message: "No Verification Found",
          details: "This candidate doesn't have any verification records.",
        });
        return;
      }

      setVerificationId(ver._id);

      const allChecks = [
        ...(ver.stages?.primary || []),
        ...(ver.stages?.secondary || []),
        ...(ver.stages?.final || []),
      ];

      const aiCheck = allChecks.find((c) => c.check === "ai_cv_validation");
      
      if (!aiCheck) {
        setErrorModal({
          isOpen: true,
          message: "AI CV Validation Not Configured",
          details: "This verification doesn't include AI CV validation check.",
        });
        return;
      }

      if (aiCheck.status !== "PENDING") {
        loadResults(ver._id);
      }
    } catch (err) {
      setErrorModal({
        isOpen: true,
        message: "Error Fetching Verification",
        details: err.message,
      });
    } finally {
      setLoadingResults(false);
    }
  };

  /* ---------------- Run Validation ---------------- */
  const runValidation = async () => {
    if (!selectedCandidate) {
      setErrorModal({
        isOpen: true,
        message: "No Candidate Selected",
        details: "Please select a candidate first.",
      });
      return;
    }
    
    if (!resumeFile && !selectedCandidate.resumePath) {
      setErrorModal({
        isOpen: true,
        message: "No Resume Available",
        details: "Please upload a resume or ensure candidate has an existing resume.",
      });
      return;
    }
    
    if (!verificationId) {
      setErrorModal({
        isOpen: true,
        message: "Verification ID Missing",
        details: "Please select a candidate with an active verification.",
      });
      return;
    }

    setLoadingValidation(true);
    setAnalysis(null);
    
    try {
      const fd = new FormData();
      fd.append("verificationId", verificationId);
      fd.append("panNumber", selectedCandidate.panNumber || "");
      if (resumeFile) fd.append("resume", resumeFile);

      const res = await fetch(`/api/proxy/secure/ai_cv_validation`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText}`);
      }

      const data = await res.json();

      if (data.verificationId) {
        loadResults(data.verificationId);
        setSuccessModal({
          isOpen: true,
          message: "Validation Complete!",
        });
      } else {
        throw new Error(data.message || "Validation failed");
      }
    } catch (error) {
      setErrorModal({
        isOpen: true,
        message: "Validation Failed",
        details: error.message,
      });
    } finally {
      setLoadingValidation(false);
    }
  };

  /* ---------------- Load Results ---------------- */
  const loadResults = async (vId) => {
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/proxy/secure/ai_cv_validation_results/${vId}`, {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      setErrorModal({
        isOpen: true,
        message: "Failed to Load Results",
        details: error.message,
      });
    } finally {
      setLoadingResults(false);
    }
  };

  /* ---------------- Submit Final Decision ---------------- */
  const submitDecision = async (status) => {
    if (!verificationId) {
      setErrorModal({
        isOpen: true,
        message: "Missing Verification ID",
        details: "Cannot submit decision without verification ID.",
      });
      return;
    }
    
    setSubmittingFinal(true);
    
    try {
      const body = new URLSearchParams();
      body.append("verificationId", verificationId);
      body.append("final_status", status);
      body.append("staff_remarks", finalRemarks);

      const res = await fetch(`/api/proxy/secure/submit_ai_cv_validation`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setSuccessModal({
        isOpen: true,
        message: `Decision Submitted: ${status}`,
      });
    } catch (error) {
      setErrorModal({
        isOpen: true,
        message: "Submission Failed",
        details: error.message,
      });
    } finally {
      setSubmittingFinal(false);
    }
  };

  /* ---------------- Export PDF ---------------- */
  const exportPDF = async () => {
    try {
      const input = pdfRef.current;
      if (!input) {
        setErrorModal({
          isOpen: true,
          message: "Nothing to Export",
          details: "No analysis results available to export.",
        });
        return;
      }

      const canvas = await safeHtml2Canvas(input, { scale: 2 });
      const canvasWidth = canvas?.width || 1;
      const canvasHeight = canvas?.height || 1;

      const jpeg = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvasHeight * pageWidth) / canvasWidth;

      pdf.addImage(jpeg, "JPEG", 0, 0, pageWidth, pageHeight);
      pdf.save(`AI-CV-${selectedCandidate?.firstName || "report"}.pdf`);
      
      setSuccessModal({
        isOpen: true,
        message: "PDF Exported Successfully!",
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      setErrorModal({
        isOpen: true,
        message: "PDF Generation Failed",
        details: err.message,
      });
    }
  };

  const ai = analysis?.aiAnalysis || analysis?.analysis;

  /* -------------------------------------------------------------
     MAIN JSX RETURN
  ------------------------------------------------------------- */
  return (
    <>
      {/* Modals */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: "" })}
        message={successModal.message}
      />
      
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: "", details: "" })}
        message={errorModal.message}
        details={errorModal.details}
      />

      {/* Hidden PDF element */}
      {analysis && selectedCandidate && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div ref={pdfRef}>
            <CertificateBase
              id="ai-cv-cert"
              candidate={selectedCandidate}
              orgName={organizations.find((o) => o._id === selectedOrg)?.organizationName}
              ai={ai}
            />
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] text-white p-6 md:p-8 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <Shield size={32} />
              <h1 className="text-3xl md:text-4xl font-bold">AI CV Verification</h1>
            </div>
            <p className="text-white/90 text-sm md:text-base">
              Validate candidate resumes using AI-powered analysis for authenticity and consistency
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ---------------- LEFT PANEL ---------------- */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-lg border space-y-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="text-[#ff004f]" />
                  Selection Panel
                </h2>

                {/* Organization Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Building2 size={16} />
                    Organization <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-[#ff004f] focus:outline-none transition text-gray-900"
                    value={selectedOrg}
                    onChange={(e) => {
                      setSelectedOrg(e.target.value);
                      setSelectedCandidate(null);
                      setAnalysis(null);
                      setResumeFile(null);
                      setVerificationId("");
                      setFinalRemarks("");
                      setExpanded({});
                    }}
                    disabled={loadingOrgs}
                  >
                    <option value="">-- Select Organization --</option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.organizationName}
                      </option>
                    ))}
                  </select>
                  {loadingOrgs && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" />
                      Loading organizations...
                    </p>
                  )}
                </div>

                {/* Candidate Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <User size={16} />
                    Candidate <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-[#ff004f] focus:outline-none transition text-gray-900"
                    value={selectedCandidate?._id || ""}
                    onChange={(e) => {
                      const cand = candidates.find((c) => c._id === e.target.value);
                      setSelectedCandidate(cand);
                      setAnalysis(null);
                      setResumeFile(null);
                      setVerificationId("");
                      setFinalRemarks("");
                      setExpanded({});
                      if (cand) fetchVerification(cand._id);
                    }}
                    disabled={!selectedOrg || loadingCandidates}
                  >
                    <option value="">-- Select Candidate --</option>
                    {candidates.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                  {loadingCandidates && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" />
                      Loading candidates...
                    </p>
                  )}
                </div>

                {/* Candidate Details */}
                {selectedCandidate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 border-2 border-gray-200 rounded-xl text-sm space-y-2"
                  >
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText size={16} className="text-[#ff004f]" />
                      Candidate Details
                    </h3>
                    <div className="space-y-1 text-gray-700">
                      <p><span className="font-semibold">Name:</span> {selectedCandidate.firstName} {selectedCandidate.lastName}</p>
                      <p><span className="font-semibold">PAN:</span> {selectedCandidate.panNumber || "—"}</p>
                      <p><span className="font-semibold">Aadhaar:</span> {selectedCandidate.aadhaarNumber || "—"}</p>
                      <p><span className="font-semibold">Resume:</span> {selectedCandidate.resumePath ? "✓ Uploaded" : "✗ Not Uploaded"}</p>
                      {verificationId && (
                        <p className="text-[#ff004f] font-semibold pt-2 border-t">
                          Verification ID: {verificationId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Resume Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Upload Resume (Optional)
                  </label>
                  <label className="cursor-pointer flex items-center justify-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 p-4 rounded-xl hover:border-[#ff004f] hover:bg-gray-50 transition group">
                    <Upload size={20} className="text-gray-400 group-hover:text-[#ff004f] transition" />
                    <span className="text-sm text-gray-600 group-hover:text-[#ff004f] font-medium transition">
                      {resumeFile ? resumeFile.name : "Choose Resume File"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                    />
                  </label>
                  {resumeFile && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle size={16} />
                      <span className="font-medium">{resumeFile.name}</span>
                    </div>
                  )}
                </div>

                {/* Run Validation Button */}
                <button
                  onClick={runValidation}
                  disabled={loadingValidation || !selectedCandidate}
                  className="bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] text-white font-bold w-full py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingValidation ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Run AI Validation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ---------------- RIGHT PANEL ---------------- */}
            <div className="lg:col-span-2">
              {loadingResults ? (
                <div className="bg-white p-12 rounded-2xl shadow-lg border flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="animate-spin text-[#ff004f]" size={48} />
                  <p className="text-gray-600 font-medium">Loading analysis results...</p>
                </div>
              ) : analysis && ai ? (
                <ResultsSection
                  ai={ai}
                  analysis={analysis}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  finalRemarks={finalRemarks}
                  setFinalRemarks={setFinalRemarks}
                  submitDecision={submitDecision}
                  exportPDF={exportPDF}
                  submittingFinal={submittingFinal}
                />
              ) : (
                <div className="bg-white p-12 rounded-2xl shadow-lg border flex flex-col items-center justify-center space-y-4 text-center">
                  <AlertCircle className="text-gray-300" size={64} />
                  <h3 className="text-xl font-bold text-gray-900">No Analysis Yet</h3>
                  <p className="text-gray-600 max-w-md">
                    Select an organization and candidate, then click "Run AI Validation" to see the analysis results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* --------------------------------------------------------------------
   RESULTS SECTION
-------------------------------------------------------------------- */
function ResultsSection({
  ai,
  analysis,
  expanded,
  setExpanded,
  finalRemarks,
  setFinalRemarks,
  submitDecision,
  exportPDF,
  submittingFinal,
}) {
  const toggle = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-lg border space-y-6"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">AI Analysis</h2>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          <FileDown size={18} />
          Export PDF
        </button>
      </div>

      {/* BADGES */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="px-3 py-1 rounded-full bg-gray-200 text-black font-semibold">
          Score: {ai.authenticity_score}/100
        </span>
        <span className="px-3 py-1 rounded-full bg-gray-200 text-black font-semibold">
          {ai.recommendation}
        </span>
      </div>

      <Separator />

      {/* SUMMARY */}
      {ai.summary && (
        <div className="bg-gray-50 p-4 rounded-lg border text-black">
          <h3 className="font-semibold mb-1">Summary</h3>
          <p className="text-sm leading-6">{ai.summary}</p>
        </div>
      )}

      {/* POSITIVE FINDINGS */}
      <CollapsibleSection
        title="Positive Findings"
        list={ai.positive_findings}
        keyName="positive"
        expanded={expanded}
        toggle={toggle}
        color="green"
      />

      {/* NEGATIVE FINDINGS */}
      <CollapsibleSection
        title="Negative Findings"
        list={ai.negative_findings}
        keyName="negative"
        expanded={expanded}
        toggle={toggle}
        color="red"
      />

      {/* RED FLAGS */}
      <CollapsibleSection
        title="Red Flags"
        list={ai.red_flags?.map((rf) => `${rf.severity} — ${rf.description}`)}
        keyName="redflags"
        expanded={expanded}
        toggle={toggle}
        color="red"
      />

      {/* EXTRA DETAILS */}
      <Separator />
      <h3 className="text-lg font-semibold text-black">Detailed Analysis</h3>

      {/* EDUCATION */}
      {ai.education_analysis && (
        <div className="border rounded-lg p-4 bg-gray-50 text-black text-sm">
          <h4 className="font-bold">Education Analysis</h4>
          <p>
            <b>Education Score:</b> {ai.education_analysis.education_score}/100
          </p>
          {ai.education_analysis.education_entries?.length > 0 && (
            <ul className="list-disc ml-5 mt-2">
              {ai.education_analysis.education_entries.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          {ai.education_analysis.overlaps_detected && (
            <p className="text-red-600 mt-2">
              ⚠ Overlaps detected in education timeline
            </p>
          )}
        </div>
      )}

      {/* EMPLOYMENT */}
      {ai.employment_analysis && (
        <div className="border rounded-lg p-4 bg-gray-50 text-black text-sm">
          <h4 className="font-bold">Employment Analysis</h4>
          <p>
            <b>Employment Score:</b> {ai.employment_analysis.employment_score}
            /100
          </p>
          {ai.employment_analysis.employment_entries?.length > 0 && (
            <ul className="list-disc ml-5 mt-2">
              {ai.employment_analysis.employment_entries.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          {ai.employment_analysis.gaps_detected && (
            <p className="text-red-600 mt-2">
              {ai.employment_analysis.gap_details[0]}
            </p>
          )}
        </div>
      )}

      {/* TIMELINE */}
      {ai.timeline_analysis && (
        <div className="border rounded-lg p-4 bg-gray-50 text-black text-sm">
          <h4 className="font-bold">Timeline Analysis</h4>
          <p>
            <b>Timeline Score:</b> {ai.timeline_analysis.timeline_score}/100
          </p>
          {!ai.timeline_analysis.timeline_consistent && (
            <p className="text-red-600 mt-2">
              ⚠ Timeline inconsistencies detected
            </p>
          )}
          {ai.timeline_analysis.timeline_issues?.length > 0 && (
            <ul className="list-disc ml-5 mt-2">
              {ai.timeline_analysis.timeline_issues.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* REMARKS */}
      <Separator />
      <div>
        <label className="font-semibold text-black">Admin Remarks</label>
        <textarea
          rows={3}
          className="w-full p-3 border rounded-lg text-black mt-2"
          value={finalRemarks}
          onChange={(e) => setFinalRemarks(e.target.value)}
          placeholder="Write your review notes…"
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <button
          onClick={() => submitDecision("COMPLETED")}
          disabled={submittingFinal}
          className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
        >
          {submittingFinal ? <Loader2 className="animate-spin mx-auto" /> : "Approve"}
        </button>
        <button
          onClick={() => submitDecision("FAILED")}
          disabled={submittingFinal}
          className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50"
        >
          {submittingFinal ? <Loader2 className="animate-spin mx-auto" /> : "Reject"}
        </button>
      </div>
    </motion.div>
  );
}

/* --------------------------------------------------------------------
   UTIL COMPONENTS
-------------------------------------------------------------------- */
function Separator() {
  return <div className="w-full h-[1px] bg-gray-300 my-3" />;
}

function CollapsibleSection({ title, list, expanded, toggle, keyName, color }) {
  if (!list || list.length === 0) return null;

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div
        className="flex justify-between cursor-pointer"
        onClick={() => toggle(keyName)}
      >
        <h3 className="font-semibold text-black">{title}</h3>
        {expanded[keyName] ? <ChevronUp /> : <ChevronDown />}
      </div>
      {expanded[keyName] && (
        <ul className="mt-3 space-y-2 text-sm">
          {list.map((item, i) => (
            <li
              key={i}
              className={`flex gap-2 ${
                color === "green"
                  ? "text-green-700"
                  : color === "red"
                  ? "text-red-700"
                  : "text-black"
              }`}
            >
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
