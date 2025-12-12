"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  User,
  FileText,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { safeHtml2Canvas } from "@/utils/safeHtml2Canvas";
import { useOrgState } from "../../context/OrgStateContext";

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
export default function OrgAIEducationValidationPage() {
  const router = useRouter();
  const { aiEduVerificationState = {}, setAiEduVerificationState = () => {} } = useOrgState();

  const [currentOrg, setCurrentOrg] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [verificationId, setVerificationId] = useState("");
  const [documentFile, setDocumentFile] = useState(null);

  const [analysis, setAnalysis] = useState(aiEduVerificationState.analysis || null);
  const [finalRemarks, setFinalRemarks] = useState(aiEduVerificationState.finalRemarks || "");
  const [checkStatus, setCheckStatus] = useState("PENDING"); // Track verification status

  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

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

  // Save state on unmount
  useEffect(() => {
    return () => {
      setAiEduVerificationState({
        analysis,
        finalRemarks,
      });
    };
  }, [analysis, finalRemarks, setAiEduVerificationState]);

  // Load Current Organization
  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await fetch(`/api/proxy/secure/getOrganizations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.organizations?.length) {
          setCurrentOrg(data.organizations[0]);
        }
      } catch (err) {
        console.error("Org fetch error:", err);
      }
    };
    fetchOrg();
  }, []);

  // Load Candidates
  useEffect(() => {
    setLoadingCandidates(true);
    fetch(`/api/proxy/secure/getCandidates`, {
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
  }, []);

  // Fetch Verification
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

      const allChecks = [
        ...(ver.stages?.primary || []),
        ...(ver.stages?.secondary || []),
        ...(ver.stages?.final || []),
      ];

      const eduCheck = allChecks.find(
        (c) => c.check === "ai_education_validation"
      );

      if (eduCheck) {
        setCheckStatus(eduCheck.status); // Store the check status
        if (eduCheck.status !== "PENDING") {
          loadResults(ver._id);
        }
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

  // Run Validation
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

  // Load Results
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

  // Submit Final Decision
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

      setCheckStatus(status); // Update status after approval
      setSuccessModal({
        isOpen: true,
        message: `Education Validation Marked as ${status}`,
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        setNavigating(true);
        router.push("/org/bgv-requests");
      }, 1500);
      
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

  // Export PDF
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

  // JSX UI
  return (
    <>
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

      {/* NAVIGATING OVERLAY */}
      {navigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-[#ff004f]" size={48} />
            <p className="text-lg font-semibold text-gray-900">Please wait...</p>
            <p className="text-sm text-gray-600">Redirecting to BGV Requests</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap size={24} />
              AI Education Validation
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Validate education certificates using AI-powered analysis
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-lg border space-y-6 sticky top-6">
                <h2 className="text-xl font-bold text-black flex items-center gap-2">
                  <Sparkles className="text-[#ff004f]" />
                  Selection Panel
                </h2>

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
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#ff004f] focus:ring-2 focus:ring-[#ff004f]/20 transition text-black bg-white"
                    disabled={loadingCandidates}
                  >
                    <option value="" className="text-gray-500">
                      {loadingCandidates
                        ? "Loading..."
                        : "-- Select Candidate --"}
                    </option>
                    {candidates.map((c) => (
                      <option key={c._id} value={c._id} className="text-black">
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>

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

            <div className="lg:col-span-2 space-y-6">
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
                    Select a candidate, upload their education certificate, then run the AI validation to see results here.
                  </p>
                </motion.div>
              )}

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

              {/* Hidden Certificate for PDF Generation */}
              {analysis && selectedCandidate && (
                <div style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "794px",
                  minHeight: "1123px",
                  opacity: 0,
                  pointerEvents: "none",
                  zIndex: -9999,
                }}>
                  <div ref={pdfRef}>
                    <EducationCertificateBase
                      id="edu-cert"
                      candidate={selectedCandidate}
                      orgName={currentOrg?.organizationName || "Organization"}
                      ai={
                        analysis?.analysis ||
                        analysis?.aiAnalysis ||
                        analysis
                      }
                    />
                  </div>
                </div>
              )}

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
                  generatingPDF={generatingPDF}
                  checkStatus={checkStatus}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Results Section Component
function ResultsSection({
  analysis,
  expanded,
  setExpanded,
  finalRemarks,
  setFinalRemarks,
  submitDecision,
  exportPDF,
  submittingFinal,
  generatingPDF,
  checkStatus,
}) {
  let ai;

  if (analysis?.aiAnalysis && typeof analysis.aiAnalysis === "object") {
    ai = analysis.aiAnalysis;
  } else if (analysis?.analysis && typeof analysis.analysis === "object") {
    ai = analysis.analysis;
  } else if (typeof analysis === "object") {
    ai = analysis;
  } else {
    return (
      <div className="p-6 border rounded-xl bg-red-50 text-red-700">
        Invalid analysis response format.
      </div>
    );
  }

  const toggle = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

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

  const statusColor =
    verificationStatus === "VERIFIED"
      ? "bg-green-50 text-black border border-green-200"
      : verificationStatus === "FAILED" || verificationStatus === "REJECT"
      ? "bg-red-50 text-black border border-red-200"
      : "bg-yellow-50 text-black border border-yellow-200";

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

        {/* Show Download Report button only after approval */}
        {checkStatus === "COMPLETED" && (
          <button
            onClick={exportPDF}
            disabled={generatingPDF}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white px-4 py-2.5 rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {generatingPDF ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Generating PDF...
              </>
            ) : (
              <>
                <FileDown size={18} />
                Download Report
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <span
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${scoreColor} block text-center`}
        >
          Authenticity Score: {authenticityScore}/100
        </span>
        <span
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${statusColor} block text-center`}
        >
          Status: {verificationStatus}
        </span>
        <span className="px-4 py-2 bg-blue-50 text-black border border-blue-200 rounded-lg font-semibold text-sm block text-center">
          Text Quality: {extractedTextQuality}
        </span>
        {recommendation && (
          <span className="px-4 py-2 bg-purple-50 text-black border border-purple-200 rounded-lg font-semibold text-sm block text-center">
            Recommendation: {recommendation}
          </span>
        )}
      </div>

      <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
        <h3 className="font-bold text-lg text-black mb-4 flex items-center gap-2">
          <FileText size={18} className="text-[#ff004f]" />
          Education Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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

        <div className="sm:col-span-2">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Document Type
          </p>
          <p className="font-semibold text-black">
            {documentType.replace(/_/g, " ")}
          </p>
        </div>
        </div>
      </div>

      {summary && (
        <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-bold text-black mb-2 flex items-center gap-2">
            <AlertCircle size={18} className="text-blue-600" />
            Summary & Recommendation
          </h3>
          <p className="text-sm text-black leading-relaxed">{summary}</p>
        </div>
      )}

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

// Collapsible Section Component
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

// Education Certificate Component for PDF Generation
function EducationCertificateBase({ id, candidate, orgName, ai }) {
  const degree = ai.degree_type || "Not Specified";
  const field = ai.field_of_study || "Not Specified";
  const institution = ai.institution_name || "Not Specified";
  const board = ai.board_university || "Not Specified";
  const startDate = ai.start_date || "-";
  const endDate = ai.end_date || "-";
  const durationYears = ai.duration_years || "N/A";

  const positives = ai.positive_findings || [];
  const redflags = ai.red_flags || [];

  return (
    <div
      id={id}
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: "10px 50px 80px 50px", // ⬅ Increased bottom padding for footer visibility
        background: "#fff",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        position: "relative",
      }}
    >
      {/* WATERMARK */}
      <img
        src="/logos/maihooMain.png"
        alt="watermark"
        style={{
          position: "absolute",
          top: "320px",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.08,
          width: "750px",
          height: "750px",
          objectFit: "contain",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* MAIN CONTENT */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            gap: "35px",
            alignItems: "flex-start",
            marginBottom: "25px",
          }}
        >
          <img
            src="/logos/maihooMain.png"
            alt="logo"
            style={{
              maxHeight: "180px",
              maxWidth: "450px",
              objectFit: "contain",
              marginTop: "10px",
            }}
          />

          <div style={{ marginTop: "55px" }}>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 900,
                margin: 0,
                fontFamily: "Arial Black",
              }}
            >
              Education
            </h1>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 900,
                margin: 0,
                fontFamily: "Arial Black",
              }}
            >
              Verification Report
            </h2>
          </div>
        </div>

        {/* CANDIDATE DETAILS */}
        <div style={{ fontSize: "15px", lineHeight: "28px", marginBottom: "40px" }}>
          <p><b>Candidate Name:</b> {candidate.firstName} {candidate.lastName}</p>
          <p><b>Candidate ID:</b> {candidate._id}</p>
          <p><b>Organization:</b> {orgName}</p>

          <p><b>Degree:</b> {degree}</p>
          <p><b>Field of Study:</b> {field}</p>
          <p><b>Institution:</b> {institution}</p>
          <p><b>Board/University:</b> {board}</p>

          <p><b>Start Date:</b> {startDate}</p>
          <p><b>End Date:</b> {endDate}</p>
          <p><b>Duration:</b> {durationYears} years</p>

          <p style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <b>Status:</b>
            <span style={{ color: "#5cb85c", fontWeight: "bold" }}>✓ Completed</span>
          </p>
        </div>

       {/* SHORT GREEN BAR (Indicator Bar) */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    marginBottom: "18px", // reduced gap
  }}
>
  <div
    style={{
      width: "38px",
      height: "18px", // increased thickness
      background: "#5cb85c",
      borderRadius: "5px",
    }}
  />
  <div
    style={{
      height: "4px", // thicker line
      background: "#5cb85c",
      width: "22%",  // shorter length
      marginLeft: "10px",
      borderRadius: "2px",
    }}
  />
</div>

{/* POSITIVE FINDINGS (NO HEADING) */}
{positives.length > 0 && (
  <div style={{ marginBottom: "35px" }}>
    {positives.map((item, i) => (
      <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <span style={{ fontSize: "18px" }}>✓</span>
        <span>{item}</span>
      </div>
    ))}
  </div>
)}

{/* SHORT RED BAR (Indicator Bar) */}
{redflags.length > 0 && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "18px",
    }}
  >
    <div
      style={{
        width: "38px",
        height: "18px", // thicker
        background: "#d9534f",
        borderRadius: "5px",
      }}
    />
    <div
      style={{
        height: "4px",
        background: "#d9534f",
        width: "22%",   // shorter line
        marginLeft: "10px",
        borderRadius: "2px",
      }}
    />
  </div>
)}

{/* RED FLAGS (NO HEADING) */}
{redflags.length > 0 &&
  redflags.map((rf, i) => (
    <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
      <span style={{ color: "#d9534f", fontSize: "18px" }}>•</span>
      <span>{rf.issue || rf.description}</span>
    </div>
  ))}

      </div>

      {/* FOOTER - ALWAYS VISIBLE */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50px",
          right: "50px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            height: "2px",
            background: "#dc3545",
            marginBottom: "10px",
          }}
        />

        <p
          style={{
            fontSize: "12px",
            color: "#dc3545",
            fontWeight: 600,
          }}
        >
          Maihoo Technologies Pvt Ltd, Vaishnavi's Cynosure, Gachibowli - 500032
        </p>
      </div>
    </div>
  );
}