"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Building,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConsentSection from "@/app/components/ConsentSection";
import { useOrgState } from "../../context/OrgStateContext";

export default function OrgBGVRequestsPage() {
  /* ---------------------------------------------------------------------
      STATE
  --------------------------------------------------------------------- */
  const router = useRouter();

  // State management context
  const { bgvState = {}, setBgvState = () => {} } = useOrgState();

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(
    bgvState.selectedCandidate || ""
  );
  const [candidateVerification, setCandidateVerification] = useState(null);

  const [userOrgId, setUserOrgId] = useState("");
  const [userServices, setUserServices] = useState([]);

  const [loading, setLoading] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [loadingCandidateStatus, setLoadingCandidateStatus] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [startLoading, setStartLoading] = useState({});
  const [reinitLoading, setReinitLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const stepNames = ["Primary", "Secondary", "Final"];
  const [currentStep, setCurrentStep] = useState(bgvState.currentStep || 0);
  const [visibleStage, setVisibleStage] = useState(
    bgvState.visibleStage || "primary"
  );
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
    "verify_pan_to_uan",
    "credit_report",
    "court_record",
  ];

  const MANUAL_SERVICES = [
    { id: "address_verification", name: "Address Verification" },
    { id: "education_check_manual", name: "Education Manual Check" },
    { id: "employment_history_manual", name: "Employment History Manual" },
    { id: "employment_history_manual_2", name: "Employment History Manual 2" },
    { id: "supervisory_check_1", name: "Supervisory Check 1" },
    { id: "supervisory_check_2", name: "Supervisory Check 2" },
  ];

  const AI_SERVICES = [
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
    
    // Supervisory Check 1 - FLAT STRUCTURE
    supervisory1_name: "",
    supervisory1_phone: "",
    supervisory1_email: "",
    supervisory1_relationship: "",
    supervisory1_company: "",
    supervisory1_designation: "",
    supervisory1_workingPeriod: "",

    // Supervisory Check 2 - FLAT STRUCTURE
    supervisory2_name: "",
    supervisory2_phone: "",
    supervisory2_email: "",
    supervisory2_relationship: "",
    supervisory2_company: "",
    supervisory2_designation: "",
    supervisory2_workingPeriod: "",

    // Employment History 1 - FLAT STRUCTURE
    employment1_company: "",
    employment1_designation: "",
    employment1_joiningDate: "",
    employment1_relievingDate: "",
    employment1_hrContact: "",
    employment1_hrEmail: "",
    employment1_hrName: "",
    employment1_address: "",
    relievingLetter1: null,
    experienceLetter1: null,
    salarySlips1: null,
    relievingLetterUrl1: "",
    experienceLetterUrl1: "",
    salarySlipsUrl1: "",

    // Employment History 2 - FLAT STRUCTURE
    employment2_company: "",
    employment2_designation: "",
    employment2_joiningDate: "",
    employment2_relievingDate: "",
    employment2_hrContact: "",
    employment2_hrEmail: "",
    employment2_hrName: "",
    employment2_address: "",
    relievingLetter2: null,
    experienceLetter2: null,
    salarySlips2: null,
    relievingLetterUrl2: "",
    experienceLetterUrl2: "",
    salarySlipsUrl2: "",

    // Education Check - FLAT STRUCTURE
    education_degree: "",
    education_specialization: "",
    education_universityName: "",
    education_collegeName: "",
    education_yearOfPassing: "",
    education_cgpa: "",
    education_universityContact: "",
    education_universityEmail: "",
    education_universityAddress: "",
    education_collegeContact: "",
    education_collegeEmail: "",
    education_collegeAddress: "",
    educationCertificate: null,
    marksheet: null,
    certificateUrl: "",
    marksheetUrl: "",
  };

  const [newCandidate, setNewCandidate] = useState(emptyCandidate);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationError, setValidationError] = useState("");
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    supervisory1: false,
    supervisory2: false,
    employment1: false,
    employment2: false,
    education: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Check if any form data has been entered
  const hasFormData = () => {
    // Check all text fields
    const textFields = [
      'firstName', 'middleName', 'lastName', 'fatherName', 'dob', 'gender',
      'phone', 'email', 'aadhaarNumber', 'panNumber', 'uanNumber', 
      'passportNumber', 'bankAccountNumber', 'district', 'state', 'pincode', 'address',
      'supervisory1_name', 'supervisory1_phone', 'supervisory1_email', 'supervisory1_relationship',
      'supervisory1_company', 'supervisory1_designation', 'supervisory1_workingPeriod',
      'supervisory2_name', 'supervisory2_phone', 'supervisory2_email', 'supervisory2_relationship',
      'supervisory2_company', 'supervisory2_designation', 'supervisory2_workingPeriod',
      'employment1_company', 'employment1_designation', 'employment1_joiningDate', 'employment1_relievingDate',
      'employment1_hrContact', 'employment1_hrEmail', 'employment1_hrName', 'employment1_address',
      'employment2_company', 'employment2_designation', 'employment2_joiningDate', 'employment2_relievingDate',
      'employment2_hrContact', 'employment2_hrEmail', 'employment2_hrName', 'employment2_address',
      'education_degree', 'education_specialization', 'education_universityName', 'education_collegeName',
      'education_yearOfPassing', 'education_cgpa', 'education_universityContact', 'education_universityEmail',
      'education_universityAddress', 'education_collegeContact', 'education_collegeEmail', 'education_collegeAddress'
    ];
    
    // Check if any text field has data
    const hasTextData = textFields.some(field => newCandidate[field]?.trim());
    
    // Check if any file has been selected
    const hasFileData = newCandidate.resume || newCandidate.relievingLetter1 || 
                       newCandidate.experienceLetter1 || newCandidate.salarySlips1 ||
                       newCandidate.relievingLetter2 || newCandidate.experienceLetter2 || 
                       newCandidate.salarySlips2 || newCandidate.educationCertificate || 
                       newCandidate.marksheet;
    
    return hasTextData || hasFileData;
  };

  // Handle modal close with smart confirmation
  const handleModalClose = () => {
    if (hasFormData()) {
      setShowConfirmClose(true);
    } else {
      // No data entered, close directly
      setShowAddModal(false);
      setNewCandidate(emptyCandidate);
      setValidationError("");
      setExpandedSections({
        supervisory1: false,
        supervisory2: false,
        employment1: false,
        employment2: false,
        education: false,
      });
    }
  };

  // Handle form changes including file uploads
  const handleAddChange = (e, isFile = false, fileField = null) => {
    if (isFile) {
      const file = e.target.files[0];
      
      // Handle file uploads with flat field names
      if (fileField) {
        setNewCandidate((p) => ({ ...p, [fileField]: file }));
        return;
      }
      
      // Handle top-level file (resume)
      setNewCandidate((p) => ({ ...p, resume: file }));
      return;
    }

    let { name, value } = e.target;

    // Auto-format specific fields based on field name
    if (name.includes('phone') || name.includes('hrContact') || name.includes('Contact')) {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    
    // Auto-format top-level fields
    if (name === "panNumber")
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (name === "aadhaarNumber") value = value.replace(/\D/g, "").slice(0, 12);
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);

    setNewCandidate((p) => ({ ...p, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError("");
    }
  };

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
  const stateRef = useRef({
    selectedCandidate,
    stages,
    currentStep,
    visibleStage,
  });

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
      RESTORE VERIFICATION STATUS ON MOUNT
  --------------------------------------------------------------------- */
  useEffect(() => {
    // If there's a persisted candidate selection and candidates are loaded
    if (selectedCandidate && candidates.length > 0 && !candidateVerification) {
      setLoadingCandidateStatus(true);
      fetchCandidateVerification(selectedCandidate);
    }
  }, [candidates]);

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
      setLoadingCandidateStatus(false);
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

    if (id) {
      setLoadingCandidateStatus(true);
      fetchCandidateVerification(id);
    }
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
          <label className="text-sm font-bold text-gray-700 mb-2 block">
            {label}
          </label>
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
          <span
            className={`text-sm font-medium truncate ${
              value ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {options.find((o) => o.value === value)?.label || "Select..."}
          </span>
          <ChevronDown
            size={20}
            className={`text-gray-600 flex-shrink-0 ml-2 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
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

    const cardGradient = selected
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
            <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
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
          <span
            className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-bold ${typeBadge}`}
          >
            {type === "api" && "⚡"}
            {type === "manual" && "✍️"}
            {type === "ai" && "🤖"}
            {type.toUpperCase()} Check
          </span>
          {status && (
            <span
              className={`text-xs px-2 py-1 rounded-full font-semibold ${
                status === "COMPLETED"
                  ? "bg-green-200 text-green-800"
                  : status === "FAILED"
                  ? "bg-red-200 text-red-800"
                  : "bg-yellow-200 text-yellow-800"
              }`}
            >
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

        {/* AI CHECK REDIRECT BUTTON - Only show after finalization */}
        {type === "ai" && !completed && isStageLocked(stageKey) && (
          <button
            onClick={() => {
              setNavigating(true);
              setTimeout(() => {
                if (key === "ai_cv_validation") {
                  router.push("/org/AI-CV-Verification");
                } else if (key === "ai_education_validation") {
                  router.push("/org/AI-Edu-Verification");
                }
              }, 100);
            }}
            disabled={navigating}
            className="mt-2 w-full px-4 py-3 text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {navigating ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Navigating...
              </>
            ) : (
              <>
                <ExternalLink size={16} />
                {key === "ai_cv_validation"
                  ? "Go to CV Verification"
                  : "Go to Education Verification"}
              </>
            )}
          </button>
        )}
      </motion.div>
    );
  }

  /* ---------------------------------------------------------------------
      RETURN UI
  --------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 p-4 md:p-8">
      {/* Loading Overlay - Candidate Status */}
      {loadingCandidateStatus && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[#ff004f]" size={48} />
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Loading Candidate Status
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we fetch verification details...
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Navigation Loading Overlay */}
      {navigating && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-purple-600" size={48} />
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Navigating
                </h3>
                <p className="text-sm text-gray-600">Please wait...</p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ENTERPRISE HEADER WITH ACTIONS */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff004f]/5 via-transparent to-purple-500/5"></div>
          <div className="relative p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    Background Verification Center
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base">
                    Enterprise verification management for your organization
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    selectedCandidate &&
                    fetchCandidateVerification(selectedCandidate)
                  }
                  disabled={!selectedCandidate || loading}
                  className="px-5 py-2.5 bg-white border border-gray-300 hover:border-[#ff004f] hover:bg-gray-50 rounded-xl flex items-center gap-2 text-gray-700 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
                >
                  <RefreshCcw size={18} /> Refresh
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#ff004f] to-purple-600 hover:from-purple-600 hover:to-[#ff004f] text-white rounded-xl flex items-center gap-2 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md"
                >
                  <PlusCircle size={20} />
                  Add Candidate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* VERIFICATION GUIDELINES - ENTERPRISE CARDS */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3 shadow-md">
              <FileText size={20} className="text-white" />
            </div>
            <h4 className="font-bold text-blue-900 mb-2 text-sm">
              Manual Verification
            </h4>
            <p className="text-xs text-blue-700">
              Click "Verify Manually" on check cards for validation
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-3 shadow-md">
              <Brain size={20} className="text-white" />
            </div>
            <h4 className="font-bold text-purple-900 mb-2 text-sm">
              AI Validation
            </h4>
            <p className="text-xs text-purple-700">
              Automated CV and education analysis available
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3 shadow-md">
              <Building size={20} className="text-white" />
            </div>
            <h4 className="font-bold text-green-900 mb-2 text-sm">
              Employment Check
            </h4>
            <p className="text-xs text-green-700">
              API-based and manual verification with supervisory validation
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-3 shadow-md">
              <Cpu size={20} className="text-white" />
            </div>
            <h4 className="font-bold text-orange-900 mb-2 text-sm">
              API Services
            </h4>
            <p className="text-xs text-orange-700">
              Automated checks for PAN, Aadhaar, and more
            </p>
          </div>
        </div>

        {/* ENTERPRISE WORKFLOW STEPPER */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6 pb-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Verification Workflow
                </h3>
                <p className="text-sm text-gray-500">
                  Track progress through all verification stages
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                {isStageCompleted("primary") &&
                isStageCompleted("secondary") &&
                isStageCompleted("final")
                  ? "✓ All Stages Complete"
                  : `Stage ${currentStep + 1} / 3`}
              </span>
            </div>
          </div>
          <div className="flex justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10">
              <div
                className="h-full bg-gradient-to-r from-[#ff004f] to-purple-600 transition-all duration-500"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>

            {stepNames.map((name, i) => {
              const active = i === currentStep;
              const done = isStageCompleted(name.toLowerCase());
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 flex-1 relative"
                >
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
                        active
                          ? "text-[#ff004f]"
                          : done
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {done
                        ? "✓ Completed"
                        : active
                        ? "In Progress"
                        : "Pending"}
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

        {/* ENTERPRISE SELECTION PANEL */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Candidate Selection
                </h3>
                <p className="text-xs text-gray-600">
                  Choose candidate to begin verification
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
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
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  Verification Status
                </label>
                <div className="border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                  <div
                    className={`font-bold text-sm ${
                      candidateVerification?.overallStatus === "COMPLETED"
                        ? "text-green-600"
                        : candidateVerification?.overallStatus === "IN_PROGRESS"
                        ? "text-yellow-600"
                        : candidateVerification?.overallStatus === "FAILED"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {candidateVerification?.overallStatus || "Not Initiated"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SERVICE CARDS - SHOW AVAILABLE SERVICES */}
        {userServices && userServices.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Available Services
                </h3>
                <p className="text-xs text-gray-600">
                  Services offered by your organization
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {userServices.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#ff004f] hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#ff004f]/10 to-purple-600/10 rounded-lg flex items-center justify-center">
                      <CheckCircle size={16} className="text-[#ff004f]" />
                    </div>
                    <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      ₹{service.price}
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1 capitalize">
                    {service.serviceName.replace(/_/g, " ")}
                  </h4>
                  <p className="text-xs text-gray-600">Per verification</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
                {currentStep === 2 && "Final stage with all remaining checks."}
              </p>
            </div>

            {/* Selected Checks */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="text-xs font-bold text-blue-900 mb-2">
                Selected Checks
              </div>
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
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-200 text-blue-900 rounded-md text-xs font-semibold"
                      >
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
                      <h3 className="text-xl font-bold text-gray-900">
                        API-Based Checks
                      </h3>
                      <p className="text-xs text-gray-600">
                        Automated verification through external APIs
                      </p>
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
                      <h3 className="text-xl font-bold text-gray-900">
                        Manual Verification Checks
                      </h3>
                      <p className="text-xs text-gray-600">
                        Requires manual verification on this page - Click
                        "Verify Manually Here" button
                      </p>
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
                      <h3 className="text-xl font-bold text-gray-900">
                        AI-Powered Validation
                      </h3>
                      <p className="text-xs text-gray-600">
                        Advanced AI analysis for CV and education verification
                      </p>
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
                  {visibleStage.charAt(0).toUpperCase() + visibleStage.slice(1)}{" "}
                  Stage Summary
                </h2>
                <p className="text-sm text-gray-600">
                  Detailed verification results
                </p>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto bg-white border-2 rounded-2xl shadow-lg">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <tr>
                    <th className="p-4 text-left font-bold text-gray-900">
                      Check
                    </th>
                    <th className="p-4 text-left font-bold text-gray-900">
                      Status
                    </th>
                    <th className="p-4 text-left font-bold text-gray-900">
                      Remarks
                    </th>
                    <th className="p-4 text-left font-bold text-gray-900">
                      Submitted At
                    </th>
                    <th className="p-4 text-left font-bold text-gray-900">
                      Stage
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {candidateVerification.stages?.[visibleStage]?.length ? (
                    candidateVerification.stages[visibleStage].map(
                      (item, i) => (
                        <tr
                          key={i}
                          className="border-t hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-colors"
                        >
                          <td className="p-4 capitalize font-medium text-gray-900">
                            {item.check.replace(/_/g, " ")}
                          </td>
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
                              <span className="text-gray-700 break-words">
                                {item.remarks || "—"}
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-gray-700 whitespace-nowrap">
                            {item.submittedAt
                              ? new Date(item.submittedAt).toLocaleString()
                              : "—"}
                          </td>
                          <td className="p-4 capitalize font-medium text-gray-900">
                            {visibleStage}
                          </td>
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
                  <div
                    key={i}
                    className="bg-white border-2 rounded-2xl shadow-lg p-5 space-y-3"
                  >
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
                      <span className="font-semibold text-gray-600">
                        Stage:
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium capitalize">
                        {visibleStage}
                      </span>
                    </div>

                    {/* Remarks */}
                    {item.remarks && (
                      <div className="bg-gray-50 p-3 rounded-lg border">
                        <div className="font-semibold text-gray-700 text-xs mb-2">
                          Remarks:
                        </div>
                        {typeof item.remarks === "object" ? (
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
                          <div className="text-xs text-gray-700 break-words">
                            {item.remarks}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submitted At */}
                    {item.submittedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-semibold">Submitted:</span>
                        <span>
                          {new Date(item.submittedAt).toLocaleString()}
                        </span>
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

      {/* ENHANCED ADD CANDIDATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border-2 border-gray-200 my-8 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] text-white p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserPlus size={28} />
                  <div>
                    <h2 className="text-2xl font-bold">Add New Candidate</h2>
                    <p className="text-white/90 text-sm">
                      Fill in candidate information
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleModalClose}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Validation Error Message */}
              {validationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    {validationError}
                  </p>
                </div>
              )}

              {/* FULL NAME */}
              <h3 className="font-semibold text-lg mb-3 text-[#ff004f]">
                Personal Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  name="firstName"
                  value={newCandidate.firstName}
                  onChange={handleAddChange}
                  placeholder="First Name*"
                  className="border p-2 rounded"
                />

                <input
                  name="middleName"
                  value={newCandidate.middleName}
                  onChange={handleAddChange}
                  placeholder="Middle Name (Optional)"
                  className="border p-2 rounded"
                />

                <input
                  name="lastName"
                  value={newCandidate.lastName}
                  onChange={handleAddChange}
                  placeholder="Last Name*"
                  className="border p-2 rounded"
                />
              </div>

              {/* FATHER NAME */}
              <input
                name="fatherName"
                value={newCandidate.fatherName}
                onChange={handleAddChange}
                placeholder="Father's Name*"
                className="border p-2 rounded w-full mt-4"
              />

              {/* DOB + GENDER PREMIUM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date of Birth*
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={newCandidate.dob}
                    onChange={handleAddChange}
                    className="border p-2 rounded w-full"
                  />
                </div>

                {/* 🔥 PREMIUM GENDER BUTTONS */}
                <div>
                  <label className="block text-sm font-medium mb-1">Gender*</label>
                  <div className="flex gap-3">
                    {["male", "female", "other"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          handleAddChange({ target: { name: "gender", value: g } })
                        }
                        className={`px-4 py-2 rounded-md border flex-1 capitalize ${
                          newCandidate.gender === g
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CONTACT */}
              <h3 className="font-semibold text-lg mt-6 mb-3 text-red-600">
                Contact Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="phone"
                  value={newCandidate.phone}
                  onChange={handleAddChange}
                  placeholder="Phone Number*"
                  className="border p-2 rounded"
                />

                <input
                  name="email"
                  value={newCandidate.email}
                  onChange={handleAddChange}
                  placeholder="Email*"
                  type="email"
                  className="border p-2 rounded"
                />
              </div>

              {/* IDENTITY */}
              <h3 className="font-semibold text-lg mt-6 mb-3 text-red-600">
                Identity Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  name="aadhaarNumber"
                  value={newCandidate.aadhaarNumber}
                  onChange={handleAddChange}
                  placeholder="Aadhaar* (12 digits)"
                  className="border p-2 rounded"
                />

                <input
                  name="panNumber"
                  value={newCandidate.panNumber}
                  onChange={handleAddChange}
                  placeholder="PAN* (ABCDE1234F)"
                  className="border p-2 rounded uppercase"
                />

                <input
                  name="uanNumber"
                  value={newCandidate.uanNumber}
                  onChange={handleAddChange}
                  placeholder="UAN Number"
                  className="border p-2 rounded"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <input
                  name="passportNumber"
                  value={newCandidate.passportNumber}
                  onChange={handleAddChange}
                  placeholder="Passport Number (Optional)"
                  className="border p-2 rounded uppercase"
                />

                <input
                  name="bankAccountNumber"
                  value={newCandidate.bankAccountNumber}
                  onChange={handleAddChange}
                  placeholder="Bank Account Number (Optional)"
                  className="border p-2 rounded"
                />

                <input
                  name="pincode"
                  value={newCandidate.pincode}
                  onChange={handleAddChange}
                  placeholder="Pincode*"
                  className="border p-2 rounded"
                />
              </div>

              {/* ADDRESS */}
              <h3 className="font-semibold text-lg mt-6 mb-3 text-red-600">
                Address Details
              </h3>

              <textarea
                name="address"
                value={newCandidate.address}
                onChange={handleAddChange}
                placeholder="Full Address*"
                rows={3}
                className="border p-2 rounded w-full"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <input
                  name="district"
                  value={newCandidate.district}
                  onChange={handleAddChange}
                  placeholder="District*"
                  className="border p-2 rounded"
                />

                <input
                  name="state"
                  value={newCandidate.state}
                  onChange={handleAddChange}
                  placeholder="State*"
                  className="border p-2 rounded"
                />
              </div>

              {/* ============================================ */}
              {/* SUPERVISORY CHECK 1 - COLLAPSIBLE */}
              {/* ============================================ */}
              <div className="mt-6 border-2 border-blue-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('supervisory1')}
                  className="w-full bg-gradient-to-r from-blue-50 to-blue-100 p-4 flex justify-between items-center hover:from-blue-100 hover:to-blue-200 transition-all"
                >
                  <h3 className="font-semibold text-lg text-blue-700">
                    👤 Supervisory Check 1 (Optional)
                  </h3>
                  <ChevronDown
                    className={`transform transition-transform ${expandedSections.supervisory1 ? 'rotate-180' : ''}`}
                    size={20}
                  />
                </button>
                
                {expandedSections.supervisory1 && (
                  <div className="p-4 bg-white space-y-3">
                    <input
                      name="supervisory1_name"
                      value={newCandidate.supervisory1_name || ''}
                      onChange={handleAddChange}
                      placeholder="Supervisor Name"
                      className="border p-2 rounded w-full"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory1_phone"
                        value={newCandidate.supervisory1_phone || ''}
                        onChange={handleAddChange}
                        placeholder="Phone Number"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory1_email"
                        value={newCandidate.supervisory1_email || ''}
                        onChange={handleAddChange}
                        placeholder="Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory1_relationship"
                        value={newCandidate.supervisory1_relationship || ''}
                        onChange={handleAddChange}
                        placeholder="Relationship (e.g., Former Manager)"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory1_company"
                        value={newCandidate.supervisory1_company || ''}
                        onChange={handleAddChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory1_designation"
                        value={newCandidate.supervisory1_designation || ''}
                        onChange={handleAddChange}
                        placeholder="Designation"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory1_workingPeriod"
                        value={newCandidate.supervisory1_workingPeriod || ''}
                        onChange={handleAddChange}
                        placeholder="Working Period (e.g., 2020-2023)"
                        className="border p-2 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* SUPERVISORY CHECK 2 - COLLAPSIBLE */}
              {/* ============================================ */}
              <div className="mt-4 border-2 border-blue-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('supervisory2')}
                  className="w-full bg-gradient-to-r from-blue-50 to-blue-100 p-4 flex justify-between items-center hover:from-blue-100 hover:to-blue-200 transition-all"
                >
                  <h3 className="font-semibold text-lg text-blue-700">
                    👤 Supervisory Check 2 (Optional)
                  </h3>
                  <ChevronDown 
                    className={`transform transition-transform ${expandedSections.supervisory2 ? 'rotate-180' : ''}`}
                    size={20}
                  />
                </button>
                
                {expandedSections.supervisory2 && (
                  <div className="p-4 bg-white space-y-3">
                    <input
                      name="supervisory2_name"
                      value={newCandidate.supervisory2_name || ''}
                      onChange={handleAddChange}
                      placeholder="Supervisor Name"
                      className="border p-2 rounded w-full"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory2_phone"
                        value={newCandidate.supervisory2_phone || ''}
                        onChange={handleAddChange}
                        placeholder="Phone Number"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory2_email"
                        value={newCandidate.supervisory2_email || ''}
                        onChange={handleAddChange}
                        placeholder="Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory2_relationship"
                        value={newCandidate.supervisory2_relationship || ''}
                        onChange={handleAddChange}
                        placeholder="Relationship (e.g., Former Team Lead)"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory2_company"
                        value={newCandidate.supervisory2_company || ''}
                        onChange={handleAddChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory2_designation"
                        value={newCandidate.supervisory2_designation || ''}
                        onChange={handleAddChange}
                        placeholder="Designation"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory2_workingPeriod"
                        value={newCandidate.supervisory2_workingPeriod || ''}
                        onChange={handleAddChange}
                        placeholder="Working Period (e.g., 2018-2020)"
                        className="border p-2 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* EMPLOYMENT HISTORY 1 - COLLAPSIBLE */}
              {/* ============================================ */}
              <div className="mt-4 border-2 border-green-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('employment1')}
                  className="w-full bg-gradient-to-r from-green-50 to-green-100 p-4 flex justify-between items-center hover:from-green-100 hover:to-green-200 transition-all"
                >
                  <h3 className="font-semibold text-lg text-green-700">
                    🏢 Employment History 1 (Optional)
                  </h3>
                  <ChevronDown 
                    className={`transform transition-transform ${expandedSections.employment1 ? 'rotate-180' : ''}`}
                    size={20}
                  />
                </button>
                
                {expandedSections.employment1 && (
                  <div className="p-4 bg-white space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="employment1_company"
                        value={newCandidate.employment1_company || ''}
                        onChange={handleAddChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment1_designation"
                        value={newCandidate.employment1_designation || ''}
                        onChange={handleAddChange}
                        placeholder="Designation"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Joining Date</label>
                        <input
                          type="date"
                          name="employment1_joiningDate"
                          value={newCandidate.employment1_joiningDate || ''}
                          onChange={handleAddChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Relieving Date</label>
                        <input
                          type="date"
                          name="employment1_relievingDate"
                          value={newCandidate.employment1_relievingDate || ''}
                          onChange={handleAddChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        name="employment1_hrName"
                        value={newCandidate.employment1_hrName || ''}
                        onChange={handleAddChange}
                        placeholder="HR Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment1_hrContact"
                        value={newCandidate.employment1_hrContact || ''}
                        onChange={handleAddChange}
                        placeholder="HR Contact"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment1_hrEmail"
                        value={newCandidate.employment1_hrEmail || ''}
                        onChange={handleAddChange}
                        placeholder="HR Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <textarea
                      name="employment1_address"
                      value={newCandidate.employment1_address || ''}
                      onChange={handleAddChange}
                      placeholder="Company Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Relieving Letter* (PDF)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleAddChange(e, true, 'relievingLetter1')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.relievingLetter1 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.relievingLetter1.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Experience Letter (PDF, Optional)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleAddChange(e, true, 'experienceLetter1')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.experienceLetter1 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.experienceLetter1.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Salary Slips (PDF, Optional)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleAddChange(e, true, 'salarySlips1')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.salarySlips1 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.salarySlips1.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* EMPLOYMENT HISTORY 2 - COLLAPSIBLE */}
              {/* ============================================ */}
              <div className="mt-4 border-2 border-green-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('employment2')}
                  className="w-full bg-gradient-to-r from-green-50 to-green-100 p-4 flex justify-between items-center hover:from-green-100 hover:to-green-200 transition-all"
                >
                  <h3 className="font-semibold text-lg text-green-700">
                    🏢 Employment History 2 (Optional)
                  </h3>
                  <ChevronDown 
                    className={`transform transition-transform ${expandedSections.employment2 ? 'rotate-180' : ''}`}
                    size={20}
                  />
                </button>
                
                {expandedSections.employment2 && (
                  <div className="p-4 bg-white space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="employment2_company"
                        value={newCandidate.employment2_company || ''}
                        onChange={handleAddChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment2_designation"
                        value={newCandidate.employment2_designation || ''}
                        onChange={handleAddChange}
                        placeholder="Designation"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Joining Date</label>
                        <input
                          type="date"
                          name="employment2_joiningDate"
                          value={newCandidate.employment2_joiningDate || ''}
                          onChange={handleAddChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Relieving Date</label>
                        <input
                          type="date"
                          name="employment2_relievingDate"
                          value={newCandidate.employment2_relievingDate || ''}
                          onChange={handleAddChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        name="employment2_hrName"
                        value={newCandidate.employment2_hrName || ''}
                        onChange={handleAddChange}
                        placeholder="HR Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment2_hrContact"
                        value={newCandidate.employment2_hrContact || ''}
                        onChange={handleAddChange}
                        placeholder="HR Contact"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment2_hrEmail"
                        value={newCandidate.employment2_hrEmail || ''}
                        onChange={handleAddChange}
                        placeholder="HR Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <textarea
                      name="employment2_address"
                      value={newCandidate.employment2_address || ''}
                      onChange={handleAddChange}
                      placeholder="Company Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Relieving Letter* (PDF)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleAddChange(e, true, 'relievingLetter2')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.relievingLetter2 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.relievingLetter2.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Experience Letter (PDF, Optional)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleAddChange(e, true, 'experienceLetter2')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.experienceLetter2 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.experienceLetter2.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Salary Slips (PDF, Optional)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleAddChange(e, true, 'salarySlips2')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.salarySlips2 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.salarySlips2.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* EDUCATION CHECK - COLLAPSIBLE */}
              {/* ============================================ */}
              <div className="mt-4 border-2 border-purple-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('education')}
                  className="w-full bg-gradient-to-r from-purple-50 to-purple-100 p-4 flex justify-between items-center hover:from-purple-100 hover:to-purple-200 transition-all"
                >
                  <h3 className="font-semibold text-lg text-purple-700">
                    🎓 Education Check (Optional)
                  </h3>
                  <ChevronDown 
                    className={`transform transition-transform ${expandedSections.education ? 'rotate-180' : ''}`}
                    size={20}
                  />
                </button>
                
                {expandedSections.education && (
                  <div className="p-4 bg-white space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Degree Certificate (PDF, Optional)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleAddChange(e, true, 'educationCertificate')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.educationCertificate && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.educationCertificate.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marksheet (PDF, Optional)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleAddChange(e, true, 'marksheet')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.marksheet && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.marksheet.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="education_degree"
                        value={newCandidate.education_degree || ''}
                        onChange={handleAddChange}
                        placeholder="Degree (e.g., Bachelor of Technology)"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_specialization"
                        value={newCandidate.education_specialization || ''}
                        onChange={handleAddChange}
                        placeholder="Specialization"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="education_universityName"
                        value={newCandidate.education_universityName || ''}
                        onChange={handleAddChange}
                        placeholder="University Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_collegeName"
                        value={newCandidate.education_collegeName || ''}
                        onChange={handleAddChange}
                        placeholder="College Name"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="education_yearOfPassing"
                        value={newCandidate.education_yearOfPassing || ''}
                        onChange={handleAddChange}
                        placeholder="Year of Passing"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_cgpa"
                        value={newCandidate.education_cgpa || ''}
                        onChange={handleAddChange}
                        placeholder="CGPA/Percentage"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        name="education_universityContact"
                        value={newCandidate.education_universityContact || ''}
                        onChange={handleAddChange}
                        placeholder="University Contact"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_universityEmail"
                        value={newCandidate.education_universityEmail || ''}
                        onChange={handleAddChange}
                        placeholder="University Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_collegeContact"
                        value={newCandidate.education_collegeContact || ''}
                        onChange={handleAddChange}
                        placeholder="College Contact"
                        className="border p-2 rounded"
                      />
                    </div>
                    <input
                      name="education_collegeEmail"
                      value={newCandidate.education_collegeEmail || ''}
                      onChange={handleAddChange}
                      placeholder="College Email"
                      type="email"
                      className="border p-2 rounded w-full"
                    />
                    <textarea
                      name="education_universityAddress"
                      value={newCandidate.education_universityAddress || ''}
                      onChange={handleAddChange}
                      placeholder="University Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                    <textarea
                      name="education_collegeAddress"
                      value={newCandidate.education_collegeAddress || ''}
                      onChange={handleAddChange}
                      placeholder="College Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                )}
              </div>

              {/* RESUME UPLOAD */}
              <h3 className="font-semibold text-lg mt-6 mb-3 text-red-600">
                Resume Upload (Optional)
              </h3>

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleAddChange(e, true)}
                className="border p-2 rounded w-full"
              />

              {newCandidate.resume && (
                <p className="text-sm mt-2 text-gray-700">
                  Selected: <span className="font-semibold">{newCandidate.resume.name}</span>
                </p>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    // Check required fields first
                    if (!newCandidate.firstName?.trim() || !newCandidate.lastName?.trim() || !newCandidate.email?.trim() || !newCandidate.phone?.trim()) {
                      setValidationError("Please fill all required details");
                      return;
                    }
                    
                    // Clear validation error if basic fields are filled
                    setValidationError("");
                    
                    // ENHANCED VALIDATION
                    const errors = {};

                    const {
                      firstName,
                      lastName,
                      fatherName,
                      dob,
                      gender,
                      phone,
                      email,
                      aadhaarNumber,
                      panNumber,
                      district,
                      state,
                      pincode,
                      address,
                      middleName,
                      passportNumber,
                      uanNumber,
                      bankAccountNumber,
                    } = newCandidate;

                    // Required field checks
                    if (!firstName) errors.firstName = "First Name is required";
                    if (!lastName) errors.lastName = "Last Name is required";
                    if (!fatherName)
                      errors.fatherName = "Father's Name is required";
                    if (!dob) errors.dob = "Date of Birth is required";
                    if (!gender) errors.gender = "Gender is required";
                    if (!phone) errors.phone = "Phone Number is required";
                    if (!email) errors.email = "Email is required";
                    if (!aadhaarNumber)
                      errors.aadhaarNumber = "Aadhaar Number is required";
                    if (!panNumber) errors.panNumber = "PAN Number is required";
                    if (!address) errors.address = "Address is required";
                    if (!district) errors.district = "District is required";
                    if (!state) errors.state = "State is required";
                    if (!pincode) errors.pincode = "Pincode is required";

                    // Name validations - only letters and spaces, no numbers
                    const nameRegex = /^[a-zA-Z\s]+$/;
                    if (firstName && !nameRegex.test(firstName)) {
                      errors.firstName =
                        "First Name must contain only letters and spaces, no numbers allowed";
                    }
                    if (middleName && !nameRegex.test(middleName)) {
                      errors.middleName =
                        "Middle Name must contain only letters and spaces, no numbers allowed";
                    }
                    if (lastName && !nameRegex.test(lastName)) {
                      errors.lastName =
                        "Last Name must contain only letters and spaces, no numbers allowed";
                    }
                    if (fatherName && !nameRegex.test(fatherName)) {
                      errors.fatherName =
                        "Father's Name must contain only letters and spaces, no numbers allowed";
                    }

                    // Email validation
                    const emailRegex =
                      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    if (email && !emailRegex.test(email)) {
                      errors.email =
                        "Invalid email format. Please enter a valid email address (e.g., user@example.com)";
                    } else if (
                      email &&
                      (!email.includes("@") ||
                        !email.split("@")[1]?.includes("."))
                    ) {
                      errors.email =
                        "Email must include @ symbol and a valid domain (e.g., user@gmail.com)";
                    }

                    // Aadhaar validation
                    if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber)) {
                      errors.aadhaarNumber =
                        "Invalid Aadhaar number. Must be exactly 12 digits";
                    }

                    // PAN validation
                    if (
                      panNumber &&
                      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)
                    ) {
                      errors.panNumber =
                        "Invalid PAN format. Must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)";
                    }

                    // Phone validation
                    if (phone && !/^\d{10}$/.test(phone)) {
                      errors.phone =
                        "Invalid phone number. Must be exactly 10 digits";
                    }

                    // District and State validation - only letters and spaces
                    if (district && !nameRegex.test(district)) {
                      errors.district =
                        "District must contain only letters and spaces, no numbers or special characters allowed";
                    }

                    if (state && !nameRegex.test(state)) {
                      errors.state =
                        "State must contain only letters and spaces, no numbers or special characters allowed";
                    }

                    // Pincode validation
                    if (pincode && !/^[1-9][0-9]{5}$/.test(pincode)) {
                      errors.pincode =
                        "Invalid Pincode. Must be exactly 6 digits and cannot start with 0";
                    }

                    // Optional field validations
                    if (
                      passportNumber &&
                      !/^[A-PR-WY][1-9]\d{6}$/.test(passportNumber)
                    ) {
                      errors.passportNumber =
                        "Invalid Passport Number. Must be in format: A1234567 (1 letter followed by 7 digits)";
                    }

                    if (uanNumber && !/^[0-9]{10,12}$/.test(uanNumber)) {
                      errors.uanNumber =
                        "Invalid UAN Number. Must be 10-12 digits";
                    }

                    if (
                      bankAccountNumber &&
                      !/^[0-9]{9,18}$/.test(bankAccountNumber)
                    ) {
                      errors.bankAccountNumber =
                        "Invalid Bank Account Number. Must be 9-18 digits";
                    }

                    if (Object.keys(errors).length > 0) {
                      setFieldErrors(errors);
                      return;
                    }

                    try {
                      setLoading(true);

                      const formData = new FormData();

                      // Append all fields EXACTLY as backend expects
                      formData.append("firstName", newCandidate.firstName || "");
                      formData.append("middleName", newCandidate.middleName || "");
                      formData.append("lastName", newCandidate.lastName || "");
                      formData.append("phone", newCandidate.phone || "");
                      formData.append("aadhaarNumber", newCandidate.aadhaarNumber || "");
                      formData.append("panNumber", newCandidate.panNumber || "");
                      formData.append("address", newCandidate.address || "");
                      formData.append("email", newCandidate.email || "");
                      formData.append("fatherName", newCandidate.fatherName || "");
                      formData.append("dob", newCandidate.dob || "");
                      formData.append("gender", newCandidate.gender || "");
                      formData.append("uanNumber", newCandidate.uanNumber || "");
                      formData.append("passportNumber", newCandidate.passportNumber || "");
                      formData.append("bankAccountNumber", newCandidate.bankAccountNumber || "");
                      formData.append("district", newCandidate.district || "");
                      formData.append("state", newCandidate.state || "");
                      formData.append("pincode", newCandidate.pincode || "");
                      formData.append("organizationId", userOrgId);

                      // Supervisory Check 1 Fields (flat structure as backend expects)
                      formData.append("supervisory1_name", newCandidate.supervisory1_name || "");
                      formData.append("supervisory1_phone", newCandidate.supervisory1_phone || "");
                      formData.append("supervisory1_email", newCandidate.supervisory1_email || "");
                      formData.append("supervisory1_relationship", newCandidate.supervisory1_relationship || "");
                      formData.append("supervisory1_company", newCandidate.supervisory1_company || "");
                      formData.append("supervisory1_designation", newCandidate.supervisory1_designation || "");
                      formData.append("supervisory1_workingPeriod", newCandidate.supervisory1_workingPeriod || "");

                      // Supervisory Check 2 Fields
                      formData.append("supervisory2_name", newCandidate.supervisory2_name || "");
                      formData.append("supervisory2_phone", newCandidate.supervisory2_phone || "");
                      formData.append("supervisory2_email", newCandidate.supervisory2_email || "");
                      formData.append("supervisory2_relationship", newCandidate.supervisory2_relationship || "");
                      formData.append("supervisory2_company", newCandidate.supervisory2_company || "");
                      formData.append("supervisory2_designation", newCandidate.supervisory2_designation || "");
                      formData.append("supervisory2_workingPeriod", newCandidate.supervisory2_workingPeriod || "");

                      // Employment History 1 Fields
                      formData.append("employment1_company", newCandidate.employment1_company || "");
                      formData.append("employment1_designation", newCandidate.employment1_designation || "");
                      formData.append("employment1_joiningDate", newCandidate.employment1_joiningDate || "");
                      formData.append("employment1_relievingDate", newCandidate.employment1_relievingDate || "");
                      formData.append("employment1_hrContact", newCandidate.employment1_hrContact || "");
                      formData.append("employment1_hrEmail", newCandidate.employment1_hrEmail || "");
                      formData.append("employment1_hrName", newCandidate.employment1_hrName || "");
                      formData.append("employment1_address", newCandidate.employment1_address || "");

                      // Employment History 2 Fields
                      formData.append("employment2_company", newCandidate.employment2_company || "");
                      formData.append("employment2_designation", newCandidate.employment2_designation || "");
                      formData.append("employment2_joiningDate", newCandidate.employment2_joiningDate || "");
                      formData.append("employment2_relievingDate", newCandidate.employment2_relievingDate || "");
                      formData.append("employment2_hrContact", newCandidate.employment2_hrContact || "");
                      formData.append("employment2_hrEmail", newCandidate.employment2_hrEmail || "");
                      formData.append("employment2_hrName", newCandidate.employment2_hrName || "");
                      formData.append("employment2_address", newCandidate.employment2_address || "");

                      // Education Check Fields
                      formData.append("education_degree", newCandidate.education_degree || "");
                      formData.append("education_specialization", newCandidate.education_specialization || "");
                      formData.append("education_universityName", newCandidate.education_universityName || "");
                      formData.append("education_collegeName", newCandidate.education_collegeName || "");
                      formData.append("education_yearOfPassing", newCandidate.education_yearOfPassing || "");
                      formData.append("education_cgpa", newCandidate.education_cgpa || "");
                      formData.append("education_universityContact", newCandidate.education_universityContact || "");
                      formData.append("education_universityEmail", newCandidate.education_universityEmail || "");
                      formData.append("education_universityAddress", newCandidate.education_universityAddress || "");
                      formData.append("education_collegeContact", newCandidate.education_collegeContact || "");
                      formData.append("education_collegeEmail", newCandidate.education_collegeEmail || "");
                      formData.append("education_collegeAddress", newCandidate.education_collegeAddress || "");

                      // Document Uploads
                      if (newCandidate.resume) {
                        formData.append("resume", newCandidate.resume);
                      }
                      
                      if (newCandidate.relievingLetter1) {
                        formData.append("relievingLetter1", newCandidate.relievingLetter1);
                      }
                      if (newCandidate.experienceLetter1) {
                        formData.append("experienceLetter1", newCandidate.experienceLetter1);
                      }
                      if (newCandidate.salarySlips1) {
                        formData.append("salarySlips1", newCandidate.salarySlips1);
                      }
                      
                      if (newCandidate.relievingLetter2) {
                        formData.append("relievingLetter2", newCandidate.relievingLetter2);
                      }
                      if (newCandidate.experienceLetter2) {
                        formData.append("experienceLetter2", newCandidate.experienceLetter2);
                      }
                      if (newCandidate.salarySlips2) {
                        formData.append("salarySlips2", newCandidate.salarySlips2);
                      }
                      
                      if (newCandidate.educationCertificate) {
                        formData.append("educationCertificate", newCandidate.educationCertificate);
                      }
                      if (newCandidate.marksheet) {
                        formData.append("marksheet", newCandidate.marksheet);
                      }

                      const res = await fetch(
                        `/api/proxy/secure/addCandidate`,
                        {
                          method: "POST",
                          credentials: "include",
                          body: formData, // 👈 IMPORTANT: No headers
                        }
                      );

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
                      setValidationError("");
                      setExpandedSections({
                        supervisory1: false,
                        supervisory2: false,
                        employment1: false,
                        employment2: false,
                        education: false,
                      });

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
                  setValidationError("");
                  setExpandedSections({
                    supervisory1: false,
                    supervisory2: false,
                    employment1: false,
                    employment2: false,
                    education: false,
                  });
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
