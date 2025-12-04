"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  PlusCircle,
  Loader2,
  X,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  RotateCcw,
  XCircle,
  Circle,
  ChevronDown,
  Cpu,
  FileCheck,
  FileSearch,
  Brain,
  Shield,
  AlertCircle,
  Info,
  FileText,
  UserPlus,
  User,
  Mail,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConsentSection from "@/app/components/ConsentSection";
import { useOrgState } from "../../context/OrgStateContext";

export default function OrgBGVRequestsPage() {
  /* ---------------------------------------------------------------------
      STATE
  --------------------------------------------------------------------- */
  // State management context
  const { bgvState = {}, setBgvState = () => {} } = useOrgState();

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(bgvState.selectedCandidate || "");
  const [candidateVerification, setCandidateVerification] = useState(null);

  const [userOrgId, setUserOrgId] = useState("");
  const [userServices, setUserServices] = useState([]);

  const [loading, setLoading] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [startLoading, setStartLoading] = useState({});
  const [reinitLoading, setReinitLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const stepNames = ["Primary", "Secondary", "Final"];
  const [currentStep, setCurrentStep] = useState(bgvState.currentStep || 0);
  const [visibleStage, setVisibleStage] = useState(bgvState.visibleStage || "primary");
  const [manualVerifyModal, setManualVerifyModal] = useState({
    open: false,
    check: "",
    remarks: "",
    status: "COMPLETED",
  });

  const API_SERVICES = [
    "pan_aadhaar_seeding",
    "pan_verification",
    "employment_history",
    "aadhaar_to_uan",
    "credit_report",
    "court_record",
  ];

  const MANUAL_SERVICES = [
    { id: "address_verification", name: "Address Verification" },
    { id: "education_check_manual", name: "Education Manual Check" },
    { id: "supervisory_check", name: "Supervisory Check" },
  ];

  const AI_SERVICES = [
    { id: "ai_cv_validation", name: "Resume Validation" },
    { id: "ai_education_validation", name: "Education AI Check" },
  ];

  const emptyCandidate = {
    firstName: "",
    middleName: "",
    lastName: "",
    fatherName: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
    aadhaarNumber: "",
    panNumber: "",
    uanNumber: "",
    passportNumber: "",
    bankAccountNumber: "",
    district: "",
    state: "",
    pincode: "",
    address: "",
  };

  const [newCandidate, setNewCandidate] = useState(emptyCandidate);
  const [fieldErrors, setFieldErrors] = useState({});

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = ({ title, message, type }) =>
    setModal({ open: true, title, message, type });

  const closeModal = () => setModal((p) => ({ ...p, open: false }));

  const DEFAULTS = {
    primary: [],
    secondary: [],
    final: [],
  };

  const [stages, setStages] = useState(bgvState.stages || { ...DEFAULTS });

  const [lastRunStage, setLastRunStage] = useState(null);

  // Use ref to always have latest values for state persistence
  const stateRef = useRef({ selectedCandidate, stages, currentStep, visibleStage });
  
  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = { selectedCandidate, stages, currentStep, visibleStage };
  }, [selectedCandidate, stages, currentStep, visibleStage]);

  // Save state on unmount (when navigating away)
  useEffect(() => {
    return () => {
      setBgvState(stateRef.current);
    };
  }, [setBgvState]);

  /* ---------------------------------------------------------------------
      LOAD ORG FROM LOCALSTORAGE + FETCH CANDIDATES
  --------------------------------------------------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem("bgvUser");
    if (!stored) return;

    try {
      const user = JSON.parse(stored);
      setUserOrgId(user.organizationId);
      setUserServices(user.services || []);
      fetchCandidates(user.organizationId);
    } catch (e) {
      console.error("Invalid local bgvUser");
    }
  }, []);

  /* ---------------------------------------------------------------------
      FETCH CANDIDATES
  --------------------------------------------------------------------- */
  const fetchCandidates = async (orgId) => {
    try {
      setCandidateLoading(true);
      const res = await fetch(
        `/api/proxy/secure/getCandidates?orgId=${orgId}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || data.error || "Failed fetching");

      setCandidates(data.candidates || []);
    } catch (err) {
      showModal({ title: "Error", message: err.message, type: "error" });
    } finally {
      setCandidateLoading(false);
    }
  };

  /* ---------------------------------------------------------------------
      FETCH VERIFICATION
  --------------------------------------------------------------------- */
  const fetchCandidateVerification = async (candidateId) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/proxy/secure/getVerifications?candidateId=${candidateId}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || data.error || "Failed fetching");

      setCandidateVerification(data.verifications?.[0] || null);
    } catch (err) {
      showModal({ title: "Error", message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------
      ON CANDIDATE SELECT
  --------------------------------------------------------------------- */
  const handleCandidateSelect = (id) => {
    setSelectedCandidate(id);
    setCandidateVerification(null);

    setStages({ ...DEFAULTS });
    setCurrentStep(0);
    setVisibleStage("primary");
    setLastRunStage(null);

    if (id) fetchCandidateVerification(id);
  };

  /* ---------------------------------------------------------------------
      AVAILABLE SERVICES
  --------------------------------------------------------------------- */
  const servicesOffered = useMemo(() => {
    return userServices
      .map((s) => s.serviceName?.trim()?.toLowerCase())
      .filter(Boolean);
  }, [userServices]);

  /* ---------------------------------------------------------------------
      STATUS HELPERS
  --------------------------------------------------------------------- */
  const getCheckStatus = (check) => {
    if (!candidateVerification?.stages) return null;

    for (const arr of Object.values(candidateVerification.stages)) {
      if (!Array.isArray(arr)) continue;
      const found = arr.find((c) => c.check === check);
      if (found) return found.status;
    }
    return null;
  };

  const isStageCompleted = (stage) => {
    const arr = candidateVerification?.stages?.[stage];
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every((c) => c.status === "COMPLETED");
  };

  const isCheckCompletedAnywhere = (check) => {
    if (!candidateVerification?.stages) return false;

    for (const arr of Object.values(candidateVerification.stages)) {
      if (!Array.isArray(arr)) continue;
      const found = arr.find(
        (c) => c.check === check && c.status === "COMPLETED"
      );
      if (found) return true;
    }
    return false;
  };

  const failedChecksExist = useMemo(() => {
    if (!candidateVerification?.stages) return false;
    for (const arr of Object.values(candidateVerification.stages)) {
      if (!Array.isArray(arr)) continue;
      if (arr.some((c) => c.status === "FAILED")) return true;
    }
    return false;
  }, [candidateVerification]);

  const isStageLocked = (stage) => {
    const arr = candidateVerification?.stages?.[stage];
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.some((c) => c.status !== "FAILED");
  };

  /* ---------------------------------------------------------------------
      TOGGLE CHECK
  --------------------------------------------------------------------- */
  const handleStageToggle = (checkKey, stageKey) => {
    if (isStageLocked(stageKey)) return;

    setStages((prev) => {
      const copy = { ...prev };

      if (copy[stageKey].includes(checkKey)) {
        copy[stageKey] = copy[stageKey].filter((c) => c !== checkKey);
        return copy;
      }

      Object.keys(copy).forEach((s) => {
        copy[s] = copy[s].filter((c) => c !== checkKey);
      });

      copy[stageKey] = [...copy[stageKey], checkKey];
      return copy;
    });
  };
  /* ---------------------------------------------------------------------
      NEXT / BACK
  --------------------------------------------------------------------- */
  const goNext = () => {
    if (currentStep === 0 && !isStageCompleted("primary")) return;
    if (currentStep === 1 && !isStageCompleted("secondary")) return;

    const next = Math.min(currentStep + 1, 2);
    setCurrentStep(next);
    setVisibleStage(stepNames[next].toLowerCase());
  };

  const goBack = () => {
    const prev = Math.max(currentStep - 1, 0);
    setCurrentStep(prev);
    setVisibleStage(stepNames[prev].toLowerCase());
  };

  /* ---------------------------------------------------------------------
      INITIATE STAGE
  --------------------------------------------------------------------- */
  const handleInitiateStage = async (stageKey) => {
    try {
      setInitLoading(true);

      const res = await fetch(`/api/proxy/secure/initiateStageVerification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedCandidate,
          organizationId: userOrgId,
          stages: { [stageKey]: stages[stageKey] },
        }),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || data.error || data.detail || "Failed");

      showModal({
        title: "Success",
        message: `${stageKey} stage initiated.`,
        type: "success",
      });

      await fetchCandidateVerification(selectedCandidate);

      // Final stage → lock remaining checks
      if (stageKey === "final") {
        const remaining = servicesOffered.filter(
          (c) =>
            !stages.primary.includes(c) &&
            !stages.secondary.includes(c) &&
            !stages.final.includes(c)
        );

        setStages((p) => ({
          ...p,
          final: [...p.final, ...remaining],
        }));
      }
    } catch (err) {
      showModal({ title: "Error", message: err.message, type: "error" });
    } finally {
      setInitLoading(false);
    }
  };

  /* ---------------------------------------------------------------------
      RUN STAGE
  --------------------------------------------------------------------- */
  const handleRunStage = async (stageKey) => {
    try {
      setRunLoading(true);

      const res = await fetch(`/api/proxy/secure/runStage`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: candidateVerification._id,
          stage: stageKey,
        }),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || data.error || data.detail || "Failed");

      setLastRunStage(stageKey);

      if (data.status === "COMPLETED") {
        showModal({
          title: "Completed",
          message: `${stageKey} stage completed successfully.`,
          type: "success",
        });
      }

      await fetchCandidateVerification(selectedCandidate);
    } catch (err) {
      showModal({ title: "Error", message: err.message, type: "error" });
    } finally {
      setRunLoading(false);
    }
  };

  /* ---------------------------------------------------------------------
      RETRY FAILED CHECKS
  --------------------------------------------------------------------- */
  const handleRetryFailed = async () => {
    try {
      setReinitLoading(true);

      const failed = [];

      for (const [stage, arr] of Object.entries(
        candidateVerification?.stages || {}
      )) {
        if (!Array.isArray(arr)) continue;
        arr.forEach((c) => {
          if (c.status === "FAILED") failed.push({ stage, check: c.check });
        });
      }

      for (const entry of failed) {
        await fetch(`/api/proxy/secure/retryCheck`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationId: candidateVerification._id,
            stage: entry.stage,
            check: entry.check,
          }),
        });
      }

      await fetchCandidateVerification(selectedCandidate);

      showModal({
        title: "Retried",
        message: "All failed checks have been retried successfully.",
        type: "success",
      });
    } catch (err) {
      showModal({ title: "Error", message: err.message, type: "error" });
    } finally {
      setReinitLoading(false);
    }
  };
  const handleManualVerificationSubmit = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/proxy/secure/updateInternalVerification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: candidateVerification._id,
          stage: visibleStage,
          checkName: manualVerifyModal.check,
          status: manualVerifyModal.status,

          remarks: manualVerifyModal.remarks,
        }),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Failed to submit manual check");

      showModal({
        type: "success",
        title: "Manual Check Updated",
        message: `${manualVerifyModal.check} marked as completed.`,
      });

      setManualVerifyModal({
        open: false,
        check: "",
        remarks: "",
        status: "COMPLETED",
      });

      fetchCandidateVerification(selectedCandidate);
    } catch (err) {
      showModal({ type: "error", title: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------
      START INDIVIDUAL CHECK
  --------------------------------------------------------------------- */
  const handleStartVerification = async (check) => {
    const stageKey = visibleStage;

    try {
      setStartLoading((p) => ({ ...p, [check]: true }));

      const res = await fetch(`/api/proxy/secure/startCheck`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: candidateVerification._id,
          stage: stageKey,
          check,
        }),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || data.error || data.detail || "Failed");

      await fetchCandidateVerification(selectedCandidate);

      if (data.status === "FAILED") {
        showModal({
          title: "Failed",
          message: `${check} failed.`,
          type: "error",
        });
      } else if (data.status === "COMPLETED") {
        showModal({
          title: "Completed",
          message: `${check} completed successfully.`,
          type: "success",
        });
      }
    } catch (err) {
      showModal({ title: "Error", message: err.message, type: "error" });
    } finally {
      setStartLoading((p) => ({ ...p, [check]: false }));
    }
  };
  const finalizedChecks = useMemo(() => {
    if (!candidateVerification?.stages) return DEFAULTS;

    return {
      primary: candidateVerification.stages.primary?.map((c) => c.check) || [],
      secondary:
        candidateVerification.stages.secondary?.map((c) => c.check) || [],
      final: candidateVerification.stages.final?.map((c) => c.check) || [],
    };
  }, [candidateVerification]);

  /* ---------------------------------------------------------------------
      FINAL COMPLETION CHECK
  --------------------------------------------------------------------- */
  const allCompleted =
    isStageCompleted("primary") &&
    isStageCompleted("secondary") &&
    isStageCompleted("final");

  function SearchableDropdown({ label, value, onChange, options, disabled }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filtered = options.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );

    return (
      <div className="w-full relative">
        {label && (
          <label className="text-sm font-bold text-gray-700 mb-2 block">{label}</label>
        )}

        {/* Input Box - Enhanced */}
        <div
          className={`
          border-2 rounded-xl px-4 py-3 bg-white 
          flex justify-between items-center cursor-pointer
          transition-all duration-200 shadow-sm
          ${
            disabled
              ? "bg-gray-100 cursor-not-allowed border-gray-300"
              : "hover:border-[#ff004f] hover:shadow-md border-gray-300"
          }
        `}
          onClick={() => !disabled && setOpen(!open)}
        >
          <span className={`text-sm font-medium truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
            {options.find((o) => o.value === value)?.label || "Select..."}
          </span>
          <ChevronDown size={20} className={`text-gray-600 flex-shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>

        {/* DROPDOWN - Enhanced */}
        {open && !disabled && (
          <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-3">
            {/* Search input */}
            <input
              type="text"
              placeholder="🔍 Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none transition"
            />

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 && (
                <div className="p-4 text-gray-500 text-sm text-center">
                  No results found
                </div>
              )}

              {filtered.map((item) => (
                <div
                  key={item.value}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="px-4 py-3 text-sm rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-[#ff004f] transition-all duration-150 font-medium"
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderServiceCard(key, label, type) {
    const stageKey = visibleStage;
    const status = getCheckStatus(key);
    const selected = stages[stageKey]?.includes(key);
    const completed = isCheckCompletedAnywhere(key);
    const locked = isStageLocked(stageKey);

    const icon =
      type === "api" ? (
        <Cpu size={24} className="text-blue-600" />
      ) : type === "manual" ? (
        <FileSearch size={24} className="text-orange-600" />
      ) : (
        <Brain size={24} className="text-purple-600" />
      );

    const typeBadge =
      type === "api"
        ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300"
        : type === "manual"
        ? "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300"
        : "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300";

    const cardGradient =
      selected
        ? "border-[#ff004f] bg-gradient-to-br from-red-50 to-pink-50 shadow-lg"
        : completed
        ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50"
        : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-lg";

    return (
      <motion.div
        key={key}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`rounded-2xl p-6 shadow-md border-2 ${cardGradient} transition-all duration-200 transform hover:scale-105`}
      >
        {/* TOP ROW — ICON + TITLE */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-3 items-start flex-1">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              {icon}
            </div>
            <div className="flex-1">
              <div className="text-base font-bold capitalize text-gray-900 leading-tight">
                {label}
              </div>
              {type === "manual" && (
                <p className="text-xs text-gray-600 mt-1">
                  Requires manual verification on this page
                </p>
              )}
            </div>
          </div>

          {/* STATUS ICON */}
          <div className="flex-shrink-0">
            {status === "COMPLETED" && (
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="text-green-600" size={20} />
              </div>
            )}
            {status === "FAILED" && (
              <div className="bg-red-100 p-2 rounded-full">
                <XCircle className="text-red-600" size={20} />
              </div>
            )}
            {status === "IN_PROGRESS" && (
              <div className="bg-yellow-100 p-2 rounded-full">
                <Loader2 className="text-yellow-600 animate-spin" size={20} />
              </div>
            )}
          </div>
        </div>

        {/* TYPE BADGE */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-bold ${typeBadge}`}>
            {type === "api" && "⚡"}
            {type === "manual" && "✍️"}
            {type === "ai" && "🤖"}
            {type.toUpperCase()} Check
          </span>
          {status && (
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
              status === "COMPLETED" ? "bg-green-200 text-green-800" :
              status === "FAILED" ? "bg-red-200 text-red-800" :
              "bg-yellow-200 text-yellow-800"
            }`}>
              {status}
            </span>
          )}
        </div>

        <div className="border-t border-gray-200 my-3" />

        {/* CHECKBOX */}
        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            checked={selected}
            disabled={completed || locked}
            onChange={() => handleStageToggle(key, stageKey)}
            className="w-5 h-5 accent-[#ff004f] cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">
            {completed
              ? "✓ Already Verified"
              : locked
              ? "🔒 Locked"
              : "Add to Current Stage"}
          </span>
        </div>

        {/* MANUAL VERIFY BUTTON */}
        {type === "manual" && isStageLocked(stageKey) && !completed && (
          <button
            onClick={() =>
              setManualVerifyModal({
                open: true,
                check: key,
                remarks: "",
                status: "COMPLETED",
              })
            }
            className="mt-2 w-full px-4 py-3 text-sm bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FileCheck size={16} />
            Verify Manually Here
          </button>
        )}

        {/* INFO FOR AI CHECKS */}
        {type === "ai" && !completed && (
          <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-xs text-purple-800 flex items-center gap-1">
              <Info size={12} />
              Can be performed from AI-CV-Verification page
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  /* ---------------------------------------------------------------------
      RETURN UI
  --------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* PAGE HEADER — ENHANCED WITH GRADIENT */}
        <div className="bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] text-white p-6 md:p-8 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                <Shield size={36} className="text-white" />
                Background Verification Services
              </h1>
              <p className="text-white/90 mt-2 text-sm md:text-base">
                Comprehensive verification workflows with AI-powered validation and manual checks
              </p>
            </div>
          </div>
        </div>

        {/* INFORMATIVE BANNER */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 shadow-md overflow-hidden">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-2">Important Information</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p className="flex items-center gap-2">
                  <span className="font-semibold">📋 Manual Verification:</span>
                  <span>Education and employment checks require manual verification on this page itself. Click "Verify Manually" button on respective check cards.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">🎓 Education Validation:</span>
                  <span>Use AI-CV-Verification page for automated education analysis or verify manually here.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">💼 Employment History:</span>
                  <span>Both API-based and manual employment verification available. Manual checks provide detailed supervisory validation.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">🤖 AI Checks:</span>
                  <span>AI-powered CV and education validation can be performed from dedicated AI pages or initiated here.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS ROW */}
        <div className="flex justify-end gap-3 flex-wrap">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() =>
                selectedCandidate &&
                fetchCandidateVerification(selectedCandidate)
              }
              disabled={!selectedCandidate || loading}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center gap-2 text-gray-700"
            >
              <RefreshCcw size={16} /> Refresh
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
            >
              <PlusCircle size={16} />
              Add Candidate
            </button>
          </div>
        </div>

        {/* STEPPER - ENHANCED */}
        <div className="bg-white border-2 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Verification Progress</h3>
            <span className="text-sm text-gray-600">
              {isStageCompleted("primary") && isStageCompleted("secondary") && isStageCompleted("final") 
                ? "All Stages Complete ✓" 
                : `Stage ${currentStep + 1} of 3`}
            </span>
          </div>
          <div className="flex justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-500"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
            
            {stepNames.map((name, i) => {
              const active = i === currentStep;
              const done = isStageCompleted(name.toLowerCase());
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 relative">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg transition-all duration-300 transform ${
                      done
                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white scale-110"
                        : active
                        ? "bg-gradient-to-br from-[#ff004f] to-[#ff6f6f] text-white scale-110 ring-4 ring-red-200"
                        : "bg-white border-2 border-gray-300 text-gray-500"
                    }`}
                  >
                    {done ? <CheckCircle size={20} /> : i + 1}
                  </div>
                  <div className="text-center">
                    <div
                      className={`font-bold text-sm ${
                        active ? "text-[#ff004f]" : done ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      {name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {done ? "✓ Completed" : active ? "In Progress" : "Pending"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <ConsentSection candidateId={selectedCandidate} />
        </div>

        {/* CANDIDATE & STATUS - Enhanced */}
        <div className="bg-white border-2 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Selection Panel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CANDIDATE */}
            <div>
              <SearchableDropdown
                label="Candidate"
                loading={candidateLoading}
                options={candidates.map((c) => ({
                  label: c.firstName + " " + c.lastName,
                  value: c._id,
                }))}
                value={selectedCandidate}
                onChange={(v) => handleCandidateSelect(v)}
              />
            </div>

            {/* STATUS */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Verification Status</label>
              <div className="border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                <div className={`font-bold text-sm ${
                  candidateVerification?.overallStatus === "COMPLETED" ? "text-green-600" :
                  candidateVerification?.overallStatus === "IN_PROGRESS" ? "text-yellow-600" :
                  candidateVerification?.overallStatus === "FAILED" ? "text-red-600" :
                  "text-gray-600"
                }`}>
                  {candidateVerification?.overallStatus || "Not Initiated"}
                </div>
              </div>
            </div>

            {/* Service Pricing */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-2">Service Pricing</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {userServices.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-xs text-gray-700 border-b border-gray-300 py-1"
                  >
                    <span className="truncate flex-1">{s.serviceName}</span>
                    <span className="font-semibold ml-2">₹{s.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            MAIN GRID — LEFT (controls) + RIGHT (cards)
        ----------------------------------------------------------------- */}
        <div className="bg-white border p-6 rounded-xl shadow grid md:grid-cols-3 gap-6">
          {/* --------------------- LEFT PANEL --------------------- */}
          <div className="space-y-6">
            {/* Stage Info */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border-2 border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-2">
                {stepNames[currentStep]} Stage
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {currentStep === 0 &&
                  "Choose initial verification checks for primary stage."}
                {currentStep === 1 &&
                  "Select from remaining checks not used in Primary."}
                {currentStep === 2 &&
                  "Final stage with all remaining checks."}
              </p>
            </div>

            {/* Selected Checks */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="text-xs font-bold text-blue-900 mb-2">Selected Checks</div>
              <div className="text-sm font-medium text-gray-900 break-words">
                {[
                  ...new Set([
                    ...stages.primary,
                    ...stages.secondary,
                    ...stages.final,
                  ]),
                ].length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {[
                      ...new Set([
                        ...stages.primary,
                        ...stages.secondary,
                        ...stages.final,
                      ]),
                    ].map((check, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-200 text-blue-900 rounded-md text-xs font-semibold">
                        {check.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">None selected</span>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2">
              <button
                disabled={currentStep === 0}
                onClick={goBack}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Back
              </button>

              <button
                disabled={
                  currentStep === 2 ||
                  (currentStep === 0 && !isStageCompleted("primary")) ||
                  (currentStep === 1 && !isStageCompleted("secondary"))
                }
                onClick={goNext}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>

            {/* Stage Action Buttons */}
            <div className="space-y-3">
              {/* PRIMARY BUTTONS */}
              {currentStep === 0 && (
                <>
                  <button
                    disabled={
                      isStageLocked("primary") ||
                      initLoading ||
                      candidateVerification?.stages?.primary?.length > 0
                    }
                    onClick={() => handleInitiateStage("primary")}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {initLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Initiating...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Finalize Checks
                      </>
                    )}
                  </button>

                  <button
                    disabled={
                      !candidateVerification ||
                      isStageCompleted("primary") ||
                      runLoading
                    }
                    onClick={() => handleRunStage("primary")}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center gap-2 disabled:bg-blue-300"
                  >
                    {runLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Running...
                      </>
                    ) : (
                      "Execute Verification"
                    )}
                  </button>
                </>
              )}

              {/* SECONDARY BUTTONS */}
              {currentStep === 1 && (
                <>
                  <button
                    disabled={
                      !isStageCompleted("primary") ||
                      isStageLocked("secondary") ||
                      initLoading
                    }
                    onClick={() => handleInitiateStage("secondary")}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {initLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Initiating...
                      </>
                    ) : (
                      "Finalize Checks"
                    )}
                  </button>

                  <button
                    disabled={
                      !isStageCompleted("primary") ||
                      isStageCompleted("secondary") ||
                      runLoading ||
                      !candidateVerification
                    }
                    onClick={() => handleRunStage("secondary")}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center gap-2 disabled:bg-blue-300"
                  >
                    {runLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Running...
                      </>
                    ) : (
                      "Execute Verifications"
                    )}
                  </button>
                </>
              )}

              {/* FINAL BUTTONS */}
              {currentStep === 2 && (
                <>
                  <button
                    disabled={
                      !isStageCompleted("secondary") ||
                      isStageLocked("final") ||
                      initLoading ||
                      candidateVerification?.stages?.final?.length > 0
                    }
                    onClick={() => handleInitiateStage("final")}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {initLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Initiating...
                      </>
                    ) : (
                      "Finalize Checks"
                    )}
                  </button>

                  <button
                    disabled={
                      !isStageCompleted("secondary") ||
                      isStageCompleted("final") ||
                      runLoading
                    }
                    onClick={() => handleRunStage("final")}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center gap-2 disabled:bg-blue-300"
                  >
                    {runLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Running...
                      </>
                    ) : (
                      "Execute Verifications"
                    )}
                  </button>
                </>
              )}

              {/* RETRY FAILED CHECKS */}
              {failedChecksExist && (
                <button
                  disabled={reinitLoading}
                  onClick={handleRetryFailed}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md flex items-center justify-center gap-2"
                >
                  {reinitLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      Retry Failed Checks
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* --------------------- RIGHT PANEL (CARDS) --------------------- */}
          <div className="md:col-span-2">
            {/* ALL COMPLETED BANNER */}
            {allCompleted && (
              <div className="p-6 bg-green-50 border border-green-300 rounded-xl text-center mb-6">
                <h3 className="text-xl font-bold text-green-700">
                  🎉 All Verifications Completed!
                </h3>
                <p className="text-green-700 mt-2">
                  All background verification checks have been successfully
                  completed.
                </p>
              </div>
            )}

            {/* Stage Title */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {stepNames[currentStep]} Verification
                </h2>
                <p className="text-sm text-gray-500">
                  Select checks and run verification.
                </p>
              </div>

              <div>
                <label className="text-sm mr-2">View:</label>
                <select
                  value={visibleStage}
                  disabled
                  className="border rounded-md p-2 bg-gray-200 text-gray-600 cursor-not-allowed"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="final">Final</option>
                </select>
              </div>
            </div>

            {/* Stage Completed Message */}
            {isStageCompleted(visibleStage) && (
              <div className="p-6 bg-blue-50 border border-blue-300 rounded-xl text-center mb-6">
                <h3 className="text-xl font-bold text-blue-700">
                  {visibleStage.toUpperCase()} Stage Completed
                </h3>
                <p className="text-blue-700 mt-2">
                  All checks in this stage are completed.
                </p>
              </div>
            )}

            {/* Verification Cards */}
            {!isStageCompleted(visibleStage) && (
              <div className="space-y-8">
                {/* API CHECKS SECTION */}
                <div>
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-blue-200">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Cpu className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">API-Based Checks</h3>
                      <p className="text-xs text-gray-600">Automated verification through external APIs</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {API_SERVICES.filter(
                        (s) =>
                          servicesOffered.includes(s) &&
                          (!isStageLocked(visibleStage) ||
                            finalizedChecks[visibleStage].includes(s))
                      ).map((s) =>
                        renderServiceCard(s, s.replace(/_/g, " "), "api")
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* MANUAL CHECKS SECTION */}
                <div>
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-orange-200">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileSearch className="text-orange-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Manual Verification Checks</h3>
                      <p className="text-xs text-gray-600">Requires manual verification on this page - Click "Verify Manually Here" button</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {MANUAL_SERVICES.filter(
                        (s) =>
                          servicesOffered.includes(s.id) &&
                          (!isStageLocked(visibleStage) ||
                            finalizedChecks[visibleStage].includes(s.id))
                      ).map((s) => renderServiceCard(s.id, s.name, "manual"))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* AI CHECKS SECTION */}
                <div>
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-purple-200">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Brain className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">AI-Powered Validation</h3>
                      <p className="text-xs text-gray-600">Advanced AI analysis for CV and education verification</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {AI_SERVICES.filter(
                        (s) =>
                          servicesOffered.includes(s.id) &&
                          (!isStageLocked(visibleStage) ||
                            finalizedChecks[visibleStage].includes(s.id))
                      ).map((s) => renderServiceCard(s.id, s.name, "ai"))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY TABLE - Enhanced & Responsive */}
        {candidateVerification && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] rounded-lg">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {visibleStage.charAt(0).toUpperCase() + visibleStage.slice(1)} Stage Summary
                </h2>
                <p className="text-sm text-gray-600">Detailed verification results</p>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto bg-white border-2 rounded-2xl shadow-lg">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <tr>
                    <th className="p-4 text-left font-bold text-gray-900">Check</th>
                    <th className="p-4 text-left font-bold text-gray-900">Status</th>
                    <th className="p-4 text-left font-bold text-gray-900">Remarks</th>
                    <th className="p-4 text-left font-bold text-gray-900">Submitted At</th>
                    <th className="p-4 text-left font-bold text-gray-900">Stage</th>
                  </tr>
                </thead>

                <tbody>
                  {candidateVerification.stages?.[visibleStage]?.length ? (
                    candidateVerification.stages[visibleStage].map(
                      (item, i) => (
                        <tr key={i} className="border-t hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-colors">
                          <td className="p-4 capitalize font-medium text-gray-900">{item.check.replace(/_/g, " ")}</td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                item.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800 border border-green-300"
                                  : item.status === "FAILED"
                                  ? "bg-red-100 text-red-800 border border-red-300"
                                  : item.status === "IN_PROGRESS"
                                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                  : "bg-gray-100 text-gray-800 border border-gray-300"
                              }`}
                            >
                              {item.status === "COMPLETED" && "✓"}
                              {item.status === "FAILED" && "✗"}
                              {item.status === "IN_PROGRESS" && "⏳"}
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4 max-w-xs">
                            {item.remarks &&
                            typeof item.remarks === "object" ? (
                              <div className="text-xs text-gray-700 space-y-1">
                                {Object.entries(item.remarks).map(
                                  ([key, value]) => (
                                    <div key={key} className="break-words">
                                      <span className="font-semibold capitalize">
                                        {key}:{" "}
                                      </span>
                                      <span>
                                        {value === null || value === undefined
                                          ? "—"
                                          : value.toString()}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-700 break-words">{item.remarks || "—"}</span>
                            )}
                          </td>

                          <td className="p-4 text-gray-700 whitespace-nowrap">
                            {item.submittedAt
                              ? new Date(item.submittedAt).toLocaleString()
                              : "—"}
                          </td>
                          <td className="p-4 capitalize font-medium text-gray-900">{visibleStage}</td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td className="p-8 text-center text-gray-500" colSpan={5}>
                        No checks in this stage.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {candidateVerification.stages?.[visibleStage]?.length ? (
                candidateVerification.stages[visibleStage].map((item, i) => (
                  <div key={i} className="bg-white border-2 rounded-2xl shadow-lg p-5 space-y-3">
                    {/* Check Name */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-gray-900 capitalize text-base flex-1">
                        {item.check.replace(/_/g, " ")}
                      </h3>
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                          item.status === "COMPLETED"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : item.status === "FAILED"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : item.status === "IN_PROGRESS"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : "bg-gray-100 text-gray-800 border border-gray-300"
                        }`}
                      >
                        {item.status === "COMPLETED" && "✓ "}
                        {item.status === "FAILED" && "✗ "}
                        {item.status === "IN_PROGRESS" && "⏳ "}
                        {item.status}
                      </span>
                    </div>

                    {/* Stage */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-600">Stage:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium capitalize">
                        {visibleStage}
                      </span>
                    </div>

                    {/* Remarks */}
                    {item.remarks && (
                      <div className="bg-gray-50 p-3 rounded-lg border">
                        <div className="font-semibold text-gray-700 text-xs mb-2">Remarks:</div>
                        {typeof item.remarks === "object" ? (
                          <div className="text-xs text-gray-700 space-y-1">
                            {Object.entries(item.remarks).map(([key, value]) => (
                              <div key={key} className="break-words">
                                <span className="font-semibold capitalize">{key}: </span>
                                <span>
                                  {value === null || value === undefined ? "—" : value.toString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-700 break-words">{item.remarks}</div>
                        )}
                      </div>
                    )}

                    {/* Submitted At */}
                    {item.submittedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-semibold">Submitted:</span>
                        <span>{new Date(item.submittedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white border-2 rounded-2xl shadow-lg p-8 text-center">
                  <p className="text-gray-500">No checks in this stage.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* -----------------------------------------------------------------
          ADD CANDIDATE MODAL (FULL FORM)
      ----------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center p-4 overflow-y-auto">
          <div className="bg-white p-4 rounded-xl w-full max-w-lg shadow-xl border relative mt-10 mb-10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Candidate</h2>
              <button
                onClick={() => setShowConfirmClose(true)}
                className="text-gray-500 hover:text-black"
              >
                <X />
              </button>
            </div>

            {/* FORM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* FIRST NAME */}
              <div>
                <input
                  name="firstName"
                  value={newCandidate.firstName}
                  onChange={(e) =>
                    setNewCandidate((p) => ({
                      ...p,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="First Name *"
                  className={`border p-2 rounded w-full ${
                    fieldErrors.firstName ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.firstName && (
                  <p className="text-red-500 text-xs">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              {/* MIDDLE NAME */}
              <input
                name="middleName"
                value={newCandidate.middleName}
                onChange={(e) =>
                  setNewCandidate((p) => ({ ...p, middleName: e.target.value }))
                }
                placeholder="Middle Name"
                className="border p-2 rounded w-full"
              />

              {/* LAST NAME */}
              <div>
                <input
                  name="lastName"
                  value={newCandidate.lastName}
                  onChange={(e) =>
                    setNewCandidate((p) => ({ ...p, lastName: e.target.value }))
                  }
                  placeholder="Last Name *"
                  className={`border p-2 rounded w-full ${
                    fieldErrors.lastName ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.lastName && (
                  <p className="text-red-500 text-xs">{fieldErrors.lastName}</p>
                )}
              </div>

              {/* FATHER NAME */}
              <div>
                <input
                  name="fatherName"
                  value={newCandidate.fatherName}
                  onChange={(e) =>
                    setNewCandidate((p) => ({
                      ...p,
                      fatherName: e.target.value,
                    }))
                  }
                  placeholder="Father Name *"
                  className={`border p-2 rounded w-full ${
                    fieldErrors.fatherName ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.fatherName && (
                  <p className="text-red-500 text-xs">
                    {fieldErrors.fatherName}
                  </p>
                )}
              </div>

              {/* DOB */}
              <div>
                <input
                  name="dob"
                  type="date"
                  value={newCandidate.dob}
                  onChange={(e) =>
                    setNewCandidate((p) => ({ ...p, dob: e.target.value }))
                  }
                  className={`border p-2 rounded w-full ${
                    fieldErrors.dob ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.dob && (
                  <p className="text-red-500 text-xs">{fieldErrors.dob}</p>
                )}
              </div>

              {/* GENDER */}
              <div>
                <select
                  name="gender"
                  value={newCandidate.gender}
                  onChange={(e) =>
                    setNewCandidate((p) => ({ ...p, gender: e.target.value }))
                  }
                  className={`border p-2 rounded w-full ${
                    fieldErrors.gender ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Select Gender *</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {fieldErrors.gender && (
                  <p className="text-red-500 text-xs">{fieldErrors.gender}</p>
                )}
              </div>

              {/* PHONE */}
              <div>
                <input
                  name="phone"
                  value={newCandidate.phone}
                  onChange={(e) =>
                    setNewCandidate((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="Phone *"
                  className={`border p-2 rounded w-full ${
                    fieldErrors.phone ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-xs">{fieldErrors.phone}</p>
                )}
              </div>

              {/* EMAIL */}
              <div className="sm:col-span-2">
                <input
                  name="email"
                  value={newCandidate.email}
                  onChange={(e) =>
                    setNewCandidate((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="Email *"
                  className={`border p-2 rounded w-full ${
                    fieldErrors.email ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs">{fieldErrors.email}</p>
                )}
              </div>

              {/* AADHAAR */}
              <div>
                <input
                  name="aadhaarNumber"
                  value={newCandidate.aadhaarNumber}
                  onChange={(e) =>
                    setNewCandidate((p) => ({
                      ...p,
                      aadhaarNumber: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 12),
                    }))
                  }
                  placeholder="Aadhaar Number *"
                  className={`border p-2 rounded w-full ${
                    fieldErrors.aadhaarNumber ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.aadhaarNumber && (
                  <p className="text-red-500 text-xs">
                    {fieldErrors.aadhaarNumber}
                  </p>
                )}
              </div>

              {/* PAN */}
              <div>
                <input
                  name="panNumber"
                  value={newCandidate.panNumber}
                  onChange={(e) =>
                    setNewCandidate((p) => ({
                      ...p,
                      panNumber: e.target.value.toUpperCase().slice(0, 10),
                    }))
                  }
                  placeholder="PAN Number *"
                  className={`border p-2 rounded w-full uppercase ${
                    fieldErrors.panNumber ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.panNumber && (
                  <p className="text-red-500 text-xs">
                    {fieldErrors.panNumber}
                  </p>
                )}
              </div>

              {/* UAN (optional) */}
              <input
                name="uanNumber"
                value={newCandidate.uanNumber}
                onChange={(e) =>
                  setNewCandidate((p) => ({
                    ...p,
                    uanNumber: e.target.value.replace(/\D/g, "").slice(0, 12),
                  }))
                }
                placeholder="UAN Number (optional)"
                className="border p-2 rounded w-full"
              />

              {/* PASSPORT (optional) */}
              <input
                name="passportNumber"
                value={newCandidate.passportNumber}
                onChange={(e) =>
                  setNewCandidate((p) => ({
                    ...p,
                    passportNumber: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="Passport Number (optional)"
                className="border p-2 rounded w-full"
              />

              {/* BANK ACCOUNT (optional) */}
              <div className="sm:col-span-2">
                <input
                  name="bankAccountNumber"
                  value={newCandidate.bankAccountNumber}
                  onChange={(e) =>
                    setNewCandidate((p) => ({
                      ...p,
                      bankAccountNumber: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 18),
                    }))
                  }
                  placeholder="Bank Account Number (optional)"
                  className="border p-2 rounded w-full"
                />
              </div>

              {/* DISTRICT */}
              <div>
                <input
                  name="district"
                  value={newCandidate.district}
                  onChange={(e) =>
                    setNewCandidate((p) => ({ ...p, district: e.target.value }))
                  }
                  placeholder="District *"
                  className={`border p-2 rounded w-full ${
                    fieldErrors.district ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.district && (
                  <p className="text-red-500 text-xs">{fieldErrors.district}</p>
                )}
              </div>

              {/* STATE */}
              <div>
                <input
                  name="state"
                  value={newCandidate.state}
                  onChange={(e) =>
                    setNewCandidate((p) => ({ ...p, state: e.target.value }))
                  }
                  placeholder="State *"
                  className={`border p-2 rounded w-full ${
                    fieldErrors.state ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.state && (
                  <p className="text-red-500 text-xs">{fieldErrors.state}</p>
                )}
              </div>

              {/* PINCODE */}
              <div>
                <input
                  name="pincode"
                  value={newCandidate.pincode}
                  onChange={(e) =>
                    setNewCandidate((p) => ({
                      ...p,
                      pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                    }))
                  }
                  placeholder="Pincode *"
                  className={`border p-2 rounded w-full ${
                    fieldErrors.pincode ? "border-red-500" : ""
                  }`}
                />
                {fieldErrors.pincode && (
                  <p className="text-red-500 text-xs">{fieldErrors.pincode}</p>
                )}
              </div>
            </div>

            {/* ADDRESS */}
            <textarea
              name="address"
              value={newCandidate.address}
              onChange={(e) =>
                setNewCandidate((p) => ({ ...p, address: e.target.value }))
              }
              placeholder="Full Address *"
              className="border p-2 rounded w-full mt-4"
              rows={3}
            />
            {fieldErrors.address && (
              <p className="text-red-500 text-xs">{fieldErrors.address}</p>
            )}
            {/* RESUME UPLOAD (Optional) */}
            <div className="sm:col-span-2 mt-4">
              <label className="text-sm font-medium">
                Resume (PDF/DOC/DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setNewCandidate((p) => ({ ...p, resume: e.target.files[0] }))
                }
                className="border p-2 rounded w-full mt-1"
              />

              {newCandidate.resume && (
                <p className="text-xs text-gray-600 mt-1">
                  Selected: <strong>{newCandidate.resume.name}</strong>
                </p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowConfirmClose(true)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  // VALIDATION
                  const errors = {};

                  const required = [
                    "firstName",
                    "lastName",
                    "fatherName",
                    "dob",
                    "gender",
                    "phone",
                    "email",
                    "aadhaarNumber",
                    "panNumber",
                    "district",
                    "state",
                    "pincode",
                    "address",
                  ];

                  required.forEach((field) => {
                    if (!newCandidate[field]) {
                      errors[field] = "Required";
                    }
                  });

                  if (Object.keys(errors).length > 0) {
                    setFieldErrors(errors);
                    return;
                  }

                  try {
                    setLoading(true);

                    const formData = new FormData();

                    formData.append("organizationId", userOrgId);
                    formData.append("firstName", newCandidate.firstName);
                    formData.append("middleName", newCandidate.middleName);
                    formData.append("lastName", newCandidate.lastName);
                    formData.append("fatherName", newCandidate.fatherName);
                    formData.append("dob", newCandidate.dob);
                    formData.append("gender", newCandidate.gender);
                    formData.append("phone", newCandidate.phone);
                    formData.append("email", newCandidate.email);
                    formData.append(
                      "aadhaarNumber",
                      newCandidate.aadhaarNumber
                    );
                    formData.append("panNumber", newCandidate.panNumber);
                    formData.append("uanNumber", newCandidate.uanNumber);
                    formData.append(
                      "passportNumber",
                      newCandidate.passportNumber
                    );
                    formData.append(
                      "bankAccountNumber",
                      newCandidate.bankAccountNumber
                    );
                    formData.append("district", newCandidate.district);
                    formData.append("state", newCandidate.state);
                    formData.append("pincode", newCandidate.pincode);
                    formData.append("address", newCandidate.address);

                    // Optional Resume
                    if (newCandidate.resume) {
                      formData.append("resume", newCandidate.resume);
                    }

                    const res = await fetch(`/api/proxy/secure/addCandidate`, {
                      method: "POST",
                      credentials: "include",
                      body: formData, // 👈 IMPORTANT: No headers
                    });

                    const data = await res.json();

                    if (!res.ok)
                      throw new Error(
                        data.detail || data.message || "Failed to add"
                      );

                    showModal({
                      title: "Success",
                      message: "Candidate added successfully.",
                      type: "success",
                    });

                    setShowAddModal(false);
                    setNewCandidate(emptyCandidate);
                    setFieldErrors({});

                    fetchCandidates(userOrgId);
                  } catch (err) {
                    showModal({
                      title: "Error",
                      message: err.message,
                      type: "error",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Add Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          CONFIRM CLOSE MODAL
      ----------------------------------------------------------------- */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Discard Changes?</h3>
            <p className="text-sm text-gray-600">
              You have unsaved changes. Are you sure you want to close?
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="px-4 py-2 border rounded-md"
              >
                No
              </button>

              <button
                onClick={() => {
                  setShowConfirmClose(false);
                  setShowAddModal(false);
                  setNewCandidate(emptyCandidate);
                  setFieldErrors({});
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Yes, Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          GLOBAL MODAL
      ----------------------------------------------------------------- */}
      <AnimatePresence>
        {modal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-xl max-w-lg w-full shadow-xl"
            >
              <div className="flex gap-4">
                <div className="text-2xl">
                  {modal.type === "error" && (
                    <span className="text-red-600">✖</span>
                  )}
                  {modal.type === "success" && (
                    <span className="text-green-600">✓</span>
                  )}
                  {modal.type === "info" && (
                    <span className="text-gray-700">i</span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold">{modal.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                    {modal.message}
                  </p>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {manualVerifyModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold mb-4">
              Verify Manually — {manualVerifyModal.check.replace(/_/g, " ")}
            </h3>

            {/* STATUS SELECT */}
            <label className="text-sm font-medium">Verification Result</label>
            <select
              value={manualVerifyModal.status}
              onChange={(e) =>
                setManualVerifyModal((p) => ({
                  ...p,
                  status: e.target.value,
                }))
              }
              className="w-full border rounded-md p-2 mt-1 mb-4"
            >
              <option value="COMPLETED">Completed (Pass)</option>
              <option value="FAILED">Failed (Reject)</option>
            </select>

            {/* REMARKS */}
            <label className="text-sm font-medium">Remarks</label>
            <textarea
              value={manualVerifyModal.remarks}
              onChange={(e) =>
                setManualVerifyModal((p) => ({ ...p, remarks: e.target.value }))
              }
              placeholder="Add remarks..."
              rows={4}
              className="w-full border rounded-md p-2 mt-1"
            />

            {/* ACTION BUTTONS */}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() =>
                  setManualVerifyModal({
                    open: false,
                    check: "",
                    remarks: "",
                    status: "COMPLETED",
                  })
                }
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={handleManualVerificationSubmit}
                className={`px-4 py-2 rounded-md text-white ${
                  manualVerifyModal.status === "FAILED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Submit Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
