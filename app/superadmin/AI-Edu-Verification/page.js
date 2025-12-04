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

// -------------------------------------------------
// MODALS
// -------------------------------------------------
function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}

function SuccessModal({ isOpen, onClose, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Success">
      <div className="text-center space-y-4">
        <CheckCircle size={70} className="text-green-500 mx-auto" />
        <p className="text-2xl font-semibold">{message}</p>
        <button
          onClick={onClose}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
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
        <XCircle size={70} className="text-red-500 mx-auto" />
        <p className="text-xl font-bold">{message}</p>
        {details && (
          <p className="text-sm bg-red-50 border p-3 rounded text-red-700 text-left">
            {details}
          </p>
        )}
        <button
          onClick={onClose}
          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

// -------------------------------------------------
// MAIN PAGE
// -------------------------------------------------
export default function SuperAdminAIEducationValidationPage() {
  const [organizations, setOrganizations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [verificationId, setVerificationId] = useState("");
  const [documentFile, setDocumentFile] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [finalRemarks, setFinalRemarks] = useState("");

  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);

  const [expanded, setExpanded] = useState({});

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: "",
  });
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
    details: "",
  });

  const pdfRef = useRef(null);

  // Load Organizations
  useEffect(() => {
    setLoadingOrgs(true);
    fetch(`/api/proxy/secure/getOrganizations`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setOrganizations(data.organizations || []))
      .catch((err) =>
        setErrorModal({
          isOpen: true,
          message: "Failed to load organizations",
          details: err.message,
        })
      )
      .finally(() => setLoadingOrgs(false));
  }, []);

  // Load Candidates
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
      .then((data) => setCandidates(data.candidates || []))
      .catch((err) =>
        setErrorModal({
          isOpen: true,
          message: "Failed to load candidates",
          details: err.message,
        })
      )
      .finally(() => setLoadingCandidates(false));
  }, [selectedOrg]);

  // -------------------------------------------------
  // FETCH VERIFICATION (TO GET verificationId)
  // -------------------------------------------------
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
          message: "No verification found",
          details: "This candidate has no active verification workflow.",
        });
        return;
      }

      setVerificationId(ver._id);

      // If a check already exists → load results
      const allChecks = [
        ...(ver.stages?.primary || []),
        ...(ver.stages?.secondary || []),
        ...(ver.stages?.final || []),
      ];

      const eduCheck = allChecks.find(
        (c) => c.check === "ai_education_validation"
      );

      if (eduCheck && eduCheck.status !== "PENDING") {
        loadResults(ver._id);
      }
    } catch (err) {
      setErrorModal({
        isOpen: true,
        message: "Failed to load verification",
        details: err.message,
      });
    } finally {
      setLoadingResults(false);
    }
  };

  // -------------------------------------------------
  // RUN VALIDATION
  // -------------------------------------------------
  const runValidation = async () => {
    if (!selectedCandidate) {
      return setErrorModal({
        isOpen: true,
        message: "No Candidate Selected",
        details: "Select candidate first.",
      });
    }

    if (!documentFile) {
      return setErrorModal({
        isOpen: true,
        message: "Upload Required",
        details: "Please upload the education document.",
      });
    }

    if (!verificationId) {
      return setErrorModal({
        isOpen: true,
        message: "Missing Verification",
        details: "No verification found for this candidate.",
      });
    }

    setLoadingValidation(true);

    try {
      const fd = new FormData();
      fd.append("verificationId", verificationId);
      fd.append("educationDocument", documentFile);

      const res = await fetch(`/api/proxy/secure/ai_education_validation`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();

      // 🔥 DO NOT CALL loadResults here
      // 🔥 Because backend returns CORRECT analysis already
      setAnalysis({ analysis: data.analysis });

      setSuccessModal({
        isOpen: true,
        message: "Education Validation Completed!",
      });
    } catch (err) {
      setErrorModal({
        isOpen: true,
        message: "Validation Failed",
        details: err.message,
      });
    } finally {
      setLoadingValidation(false);
    }
  };

  // -------------------------------------------------
  // LOAD RESULTS
  // -------------------------------------------------
  const loadResults = async (vId) => {
    setLoadingResults(true);

    try {
      const res = await fetch(
        `/api/proxy/secure/ai_education_validation_results/${vId}`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setErrorModal({
        isOpen: true,
        message: "Failed to load results",
        details: err.message,
      });
    } finally {
      setLoadingResults(false);
    }
  };

  // -------------------------------------------------
  // SUBMIT FINAL DECISION
  // -------------------------------------------------
  const submitDecision = async (status) => {
    if (!verificationId) {
      return setErrorModal({
        isOpen: true,
        message: "Missing Verification ID",
        details: "Cannot submit decision.",
      });
    }

    setSubmittingFinal(true);

    try {
      const body = new URLSearchParams();
      body.append("verificationId", verificationId);
      body.append("final_status", status);
      body.append("staff_remarks", finalRemarks);

      const res = await fetch(
        `/api/proxy/secure/submit_ai_education_validation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        }
      );

      if (!res.ok) throw new Error(await res.text());

      setSuccessModal({
        isOpen: true,
        message: `Education Validation Marked as ${status}`,
      });
    } catch (err) {
      setErrorModal({
        isOpen: true,
        message: "Submission Failed",
        details: err.message,
      });
    } finally {
      setSubmittingFinal(false);
    }
  };

  // -------------------------------------------------
  // EXPORT PDF
  // -------------------------------------------------
  const exportPDF = async () => {
    try {
      const input = pdfRef.current;
      if (!input) return;

      const canvas = await safeHtml2Canvas(input, { scale: 2 });
      const img = canvas.toDataURL("image/jpeg", 1.0);

      const pdf = new jsPDF("p", "pt", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(img, "JPEG", 0, 0, width, height);
      pdf.save("AI-Education-Report.pdf");

      setSuccessModal({
        isOpen: true,
        message: "PDF Exported Successfully!",
      });
    } catch (err) {
      setErrorModal({
        isOpen: true,
        message: "PDF Export Failed",
        details: err.message,
      });
    }
  };

  // -------------------------------------------------
  // JSX UI
  // -------------------------------------------------
  return (
    <>
      {/* MODALS */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: "" })}
        message={successModal.message}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() =>
          setErrorModal({ isOpen: false, message: "", details: "" })
        }
        message={errorModal.message}
        details={errorModal.details}
      />

      {/* MAIN PAGE */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] text-white p-6 md:p-8 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <Shield size={32} />
              <h1 className="text-3xl md:text-4xl font-bold">
                AI Education Validation
              </h1>
            </div>
            <p className="text-white/90 text-sm md:text-base">
              Validate education certificates and records using AI-powered
              analysis for authenticity
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT PANEL */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-lg border space-y-6 sticky top-6">
                <h2 className="text-xl font-bold text-black flex items-center gap-2">
                  <Sparkles className="text-[#ff004f]" />
                  Selection Panel
                </h2>
                {/* ORG DROPDOWN */}
                <div>
                  <label className="font-semibold flex items-center gap-2 mb-2 text-black">
                    <Building2 size={16} className="text-[#ff004f]" />
                    Organization
                  </label>

                  <select
                    value={selectedOrg}
                    onChange={(e) => {
                      setSelectedOrg(e.target.value);
                      setSelectedCandidate(null);
                      setAnalysis(null);
                      setVerificationId("");
                      setDocumentFile(null);
                    }}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#ff004f] focus:ring-2 focus:ring-[#ff004f]/20 transition"
                    disabled={loadingOrgs}
                  >
                    <option value="">
                      {loadingOrgs ? "Loading..." : "-- Select Organization --"}
                    </option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.organizationName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CANDIDATE DROPDOWN */}
                <div>
                  <label className="font-semibold flex items-center gap-2 mb-2 text-black">
                    <User size={16} className="text-[#ff004f]" />
                    Candidate
                  </label>

                  <select
                    value={selectedCandidate?._id || ""}
                    onChange={(e) => {
                      const c = candidates.find(
                        (x) => x._id === e.target.value
                      );
                      setSelectedCandidate(c);
                      setAnalysis(null);
                      setDocumentFile(null);
                      if (c) fetchVerification(c._id);
                    }}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#ff004f] focus:ring-2 focus:ring-[#ff004f]/20 transition"
                    disabled={!selectedOrg || loadingCandidates}
                  >
                    <option value="">
                      {loadingCandidates
                        ? "Loading..."
                        : "-- Select Candidate --"}
                    </option>
                    {candidates.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SELECTED CANDIDATE INFO */}
                {selectedCandidate && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                      Selected Candidate
                    </p>
                    <p className="font-bold text-black">
                      {selectedCandidate.firstName} {selectedCandidate.lastName}
                    </p>
                    {selectedCandidate.email && (
                      <p className="text-sm text-black mt-1">
                        {selectedCandidate.email}
                      </p>
                    )}
                  </div>
                )}

                {/* DOCUMENT UPLOAD */}
                <div>
                  <label className="font-semibold mb-3 flex items-center gap-2 text-black">
                    <FileText size={16} className="text-[#ff004f]" />
                    Upload Education Certificate
                  </label>

                  <label className="cursor-pointer flex flex-col gap-2 items-center p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#ff004f] hover:bg-pink-50 transition group">
                    <Upload
                      size={32}
                      className="text-gray-400 group-hover:text-[#ff004f] transition"
                    />
                    <span className="text-sm text-center text-black">
                      {documentFile ? (
                        <span className="font-semibold text-[#ff004f] break-all text-black">
                          {documentFile.name}
                        </span>
                      ) : (
                        <>
                          <span className="font-semibold block">
                            Click to upload
                          </span>
                          <span className="text-gray-500 text-xs">
                            PDF, JPG, PNG (Max 10MB)
                          </span>
                        </>
                      )}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.png,.jpeg"
                      className="hidden"
                      onChange={(e) => setDocumentFile(e.target.files[0])}
                    />
                  </label>

                  {documentFile && (
                    <button
                      onClick={() => setDocumentFile(null)}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Remove file
                    </button>
                  )}
                </div>

                {/* RUN VALIDATION */}
                <button
                  onClick={runValidation}
                  disabled={
                    loadingValidation || !selectedCandidate || !documentFile
                  }
                  className="w-full bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-[#e6003d] hover:to-[#ff5555] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
                >
                  {loadingValidation ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
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

            {/* RIGHT PANEL */}
            <div className="lg:col-span-2 space-y-6">
              {/* NO RESULTS */}
              {!analysis && !loadingResults && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-12 md:p-16 rounded-2xl shadow-lg border text-center"
                >
                  <div className="flex justify-center mb-6">
                    <div className="p-6 bg-gray-100 rounded-full">
                      <AlertCircle size={48} className="text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Analysis Available
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Select an organization and candidate, upload their education
                    certificate, then run the AI validation to see results here.
                  </p>
                </motion.div>
              )}

              {/* LOADING */}
              {loadingResults && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white p-12 md:p-16 rounded-2xl shadow-lg border flex flex-col items-center gap-6"
                >
                  <div className="relative">
                    <Loader2
                      size={64}
                      className="animate-spin text-[#ff004f]"
                    />
                    <div className="absolute inset-0 animate-ping">
                      <Loader2
                        size={64}
                        className="text-[#ff004f] opacity-20"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      Analyzing Education Certificate
                    </p>
                    <p className="text-sm text-gray-500">
                      AI is processing the document...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* RESULTS */}
              {analysis && (
                <ResultsSection
                  analysis={analysis}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  finalRemarks={finalRemarks}
                  setFinalRemarks={setFinalRemarks}
                  submitDecision={submitDecision}
                  exportPDF={exportPDF}
                  submittingFinal={submittingFinal}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// -------------------------------------------------
// RESULTS SECTION
// -------------------------------------------------
function ResultsSection({
  analysis,
  expanded,
  setExpanded,
  finalRemarks,
  setFinalRemarks,
  submitDecision,
  exportPDF,
  submittingFinal,
}) {
  // FIX: use ONLY the nested analysis object
  let ai;

  // CASE 1: results endpoint → aiAnalysis
  if (analysis?.aiAnalysis && typeof analysis.aiAnalysis === "object") {
    ai = analysis.aiAnalysis;
  }

  // CASE 2: validation endpoint → analysis
  else if (analysis?.analysis && typeof analysis.analysis === "object") {
    ai = analysis.analysis;
  }

  // CASE 3: fallback direct shape (rare)
  else if (typeof analysis === "object") {
    ai = analysis;
  }

  // INVALID FORMAT
  else {
    return (
      <div className="p-6 border rounded-xl bg-red-50 text-red-700">
        Invalid analysis response format.
      </div>
    );
  }

  const toggle = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // Map API response fields - show all fields even if UNKNOWN
  const authenticityScore = ai.authenticity_score ?? ai.score ?? 0;
  const verificationStatus = ai.verification_status || ai.status || "PENDING";
  const summary = ai.summary || ai.recommendation || "";
  const recommendation = ai.recommendation || "";
  const positiveFindings =
    ai.positive_findings || ai.verifiedDetails || ai.strengths || [];
  const redFlags = ai.red_flags || ai.weaknesses || [];
  const degreeType = ai.degree_type || "Not Specified";
  const fieldOfStudy = ai.field_of_study || "Not Specified";
  const institutionName = ai.institution_name || "Not Specified";
  const startDate = ai.start_date || "Not Specified";
  const endDate = ai.end_date || "Not Specified";
  const durationYears = ai.duration_years ?? 0;
  const grade = ai.grade || "Not Specified";
  const boardUniversity = ai.board_university || "Not Specified";
  const documentType = ai.document_type || "Not Specified";
  const extractedTextQuality = ai.extracted_text_quality || "Not Specified";

  // Status color - lighter backgrounds with black text
  const statusColor =
    verificationStatus === "VERIFIED"
      ? "bg-green-50 text-black border border-green-200"
      : verificationStatus === "FAILED" || verificationStatus === "REJECT"
      ? "bg-red-50 text-black border border-red-200"
      : "bg-yellow-50 text-black border border-yellow-200";

  // Score color - lighter backgrounds with black text
  const scoreColor =
    authenticityScore >= 80
      ? "bg-green-50 text-black border border-green-200"
      : authenticityScore >= 60
      ? "bg-yellow-50 text-black border border-yellow-200"
      : "bg-red-50 text-black border border-red-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border space-y-6"
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            <FileText className="text-[#ff004f]" />
            Education Analysis
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered validation results
          </p>
        </div>

        <button
          onClick={exportPDF}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition shadow-md"
        >
          <FileDown size={18} /> Export PDF
        </button>
      </div>

      {/* STATUS & SCORE BADGES */}
      <div className="flex flex-wrap gap-3">
        <span
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${scoreColor}`}
        >
          Authenticity Score: {authenticityScore}/100
        </span>
        <span
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${statusColor}`}
        >
          Status: {verificationStatus}
        </span>
        <span className="px-4 py-2 bg-blue-50 text-black border border-blue-200 rounded-lg font-semibold text-sm">
          Text Quality: {extractedTextQuality}
        </span>
        {recommendation && (
          <span className="px-4 py-2 bg-purple-50 text-black border border-purple-200 rounded-lg font-semibold text-sm">
            Recommendation: {recommendation}
          </span>
        )}
      </div>

      {/* EDUCATION DETAILS GRID - Always show all fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
        <h3 className="col-span-full font-bold text-lg text-black mb-2 flex items-center gap-2">
          <FileText size={18} className="text-[#ff004f]" />
          Education Details
        </h3>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Degree Type
          </p>
          <p className="font-semibold text-black">{degreeType}</p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Field of Study
          </p>
          <p className="font-semibold text-black">{fieldOfStudy}</p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Institution Name
          </p>
          <p className="font-semibold text-black">{institutionName}</p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Board/University
          </p>
          <p className="font-semibold text-black">{boardUniversity}</p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Start Date
          </p>
          <p className="font-semibold text-black">{startDate}</p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            End Date
          </p>
          <p className="font-semibold text-black">{endDate}</p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Duration (Years)
          </p>
          <p className="font-semibold text-black">
            {durationYears} {durationYears === 1 ? "year" : "years"}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Grade/Class
          </p>
          <p className="font-semibold text-black">{grade}</p>
        </div>

        <div className="col-span-full">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Document Type
          </p>
          <p className="font-semibold text-black">
            {documentType.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* SUMMARY */}
      {summary && (
        <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-bold text-black mb-2 flex items-center gap-2">
            <AlertCircle size={18} className="text-blue-600" />
            Summary & Recommendation
          </h3>
          <p className="text-sm text-black leading-relaxed">{summary}</p>
        </div>
      )}

      {/* POSITIVE FINDINGS */}
      {positiveFindings && positiveFindings.length > 0 && (
        <CollapsibleSection
          title="Positive Findings"
          list={positiveFindings}
          expanded={expanded}
          toggle={toggle}
          keyName="positiveFindings"
          color="green"
          icon={<CheckCircle size={18} />}
        />
      )}

      {/* RED FLAGS */}
      {redFlags && redFlags.length > 0 && (
        <CollapsibleSection
          title="Red Flags & Issues"
          list={redFlags.map((f) =>
            typeof f === "string"
              ? f
              : `[${f.severity}] ${f.issue || f.description}`
          )}
          expanded={expanded}
          toggle={toggle}
          keyName="redFlags"
          color="red"
          icon={<XCircle size={18} />}
        />
      )}

      {/* FINAL REMARKS */}
      <div className="space-y-2">
        <label className="font-bold text-black flex items-center gap-2">
          <FileText size={16} className="text-[#ff004f]" />
          Admin Remarks
        </label>
        <textarea
          rows={4}
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#ff004f] focus:ring-2 focus:ring-[#ff004f]/20 transition text-black"
          placeholder="Add your remarks here..."
          value={finalRemarks}
          onChange={(e) => setFinalRemarks(e.target.value)}
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          onClick={() => submitDecision("COMPLETED")}
          disabled={submittingFinal}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-bold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {submittingFinal ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <CheckCircle size={20} />
              Approve & Complete
            </>
          )}
        </button>

        <button
          onClick={() => submitDecision("FAILED")}
          disabled={submittingFinal}
          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 rounded-xl font-bold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {submittingFinal ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <XCircle size={20} />
              Reject
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// -------------------------------------------------
// UTIL COMPONENT
// -------------------------------------------------
function CollapsibleSection({
  title,
  list,
  expanded,
  toggle,
  keyName,
  color,
  icon,
}) {
  if (!list || list.length === 0) return null;

  const bgColor =
    color === "red"
      ? "bg-red-50 border-red-200"
      : "bg-green-50 border-green-200";

  const iconColor = color === "red" ? "text-red-500" : "text-green-500";
  const badgeBg = color === "red" ? "bg-red-100" : "bg-green-100";

  return (
    <div className={`border rounded-xl p-5 ${bgColor} transition-all`}>
      <div
        className="flex justify-between items-center cursor-pointer group"
        onClick={() => toggle(keyName)}
      >
        <h3 className="font-bold text-black flex items-center gap-2">
          {icon && <span className={iconColor}>{icon}</span>}
          {title}
          <span
            className={`text-xs text-black font-semibold px-2 py-0.5 rounded ${badgeBg}`}
          >
            {list.length}
          </span>
        </h3>
        <div className="text-gray-500 group-hover:text-black transition">
          {expanded[keyName] ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>
      </div>

      {expanded[keyName] && (
        <ul className="mt-4 space-y-2">
          {list.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm text-black bg-white p-3 rounded-lg border border-gray-200"
            >
              <span className="mt-0.5 font-bold">•</span>
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
