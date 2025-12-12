"use client";

import { useEffect, useState } from "react";
import {
  PlusCircle,
  Loader2,
  X,
  RefreshCcw,
  CheckCircle,
  Send,
  ChevronRight,
  ChevronDown,
  Shield,
  AlertCircle,
  Info,
  UserCheck,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

export default function OrgCandidateSelfVerification() {
  /* ---------------------------------------------- */
  /* DYNAMIC CHECK CONFIG                            */
  /* ---------------------------------------------- */
  const getCheckConfig = (serviceKey) => {
    const checkConfigs = {
      aadhaar: { title: "Aadhaar Verification", icon: "🪪" },
      pan: { title: "PAN Verification", icon: "💳" },
      bankaccount: { title: "Bank Account Verification", icon: "🏦" },
      uan: { title: "UAN Verification", icon: "🧾" },
      fir: { title: "FIR / Criminal Check", icon: "🛡️" },
      passport: { title: "Passport Verification", icon: "🛂" },
      education: { title: "Education Verification", icon: "🎓" },
      employment: { title: "Employment Verification", icon: "💼" },
      cibil: { title: "CIBIL Credit Check", icon: "📊" },
    };

    const normalizedKey = serviceKey.toLowerCase();
    return (
      checkConfigs[serviceKey] ||
      checkConfigs[normalizedKey] || {
        title: `${serviceKey} Verification`,
        icon: "📋",
      }
    );
  };
  const API_CHECKS = [
    "pan_aadhaar_seeding",
    "pan_verification",
    "employment_history",
    "verify_pan_to_uan",
    "credit_report",
    "court_record",
  ];

  const steps = ["primary", "secondary", "final"];

  /* ---------------------------------------------- */
  /* STATE                                           */
  /* ---------------------------------------------- */
  const [bgvUser, setBgvUser] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [availableChecks, setAvailableChecks] = useState([]);
  const [candidateVerification, setCandidateVerification] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationError, setValidationError] = useState("");
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  
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

  // Create truly empty candidate object (no default values for close detection)
  const createEmptyCandidate = () => ({
    firstName: "",
    middleName: "",
    lastName: "",
    fatherName: "",
    dob: "",
    gender: "", // No default value initially
    phone: "",
    email: "",
    aadhaarNumber: "",
    panNumber: "",
    uanNumber: "",
    passportNumber: "",
    bankAccountNumber: "",
    address: "",
    district: "",
    state: "",
    pincode: "",
    supervisory1_name: "",
    supervisory1_phone: "",
    supervisory1_email: "",
    supervisory1_relationship: "",
    supervisory1_company: "",
    supervisory1_designation: "",
    supervisory1_workingPeriod: "",
    supervisory2_name: "",
    supervisory2_phone: "",
    supervisory2_email: "",
    supervisory2_relationship: "",
    supervisory2_company: "",
    supervisory2_designation: "",
    supervisory2_workingPeriod: "",
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
  });

  // Check if any form data has been entered
  const hasFormData = () => {
    // Check all text fields (excluding gender since it has a default value)
    const textFields = [
      'firstName', 'middleName', 'lastName', 'fatherName', 'dob',
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
    
    // Check gender separately (only consider it changed if it's not empty)
    const hasGenderChange = newCandidate.gender && newCandidate.gender.trim();
    
    // Check if any file has been selected
    const hasFileData = newCandidate.resume || newCandidate.relievingLetter1 || 
                       newCandidate.experienceLetter1 || newCandidate.salarySlips1 ||
                       newCandidate.relievingLetter2 || newCandidate.experienceLetter2 || 
                       newCandidate.salarySlips2 || newCandidate.educationCertificate || 
                       newCandidate.marksheet;
    
    return hasTextData || hasGenderChange || hasFileData;
  };

  // Handle modal close with smart confirmation
  const handleModalClose = () => {
    if (hasFormData()) {
      setShowConfirmClose(true);
    } else {
      // No data entered, close directly
      setShowAddModal(false);
      setNewCandidate(createEmptyCandidate());
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

  const [stages, setStages] = useState({
    primary: [],
    secondary: [],
    final: [],
  });
  /* ---------------------------------------------- */
  /* MODAL SYSTEM                                    */
  /* ---------------------------------------------- */
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "info",
    checkKeyToRemove: null,
  });

  const showModal = ({ title, message, type }) =>
    setModal({
      open: true,
      title,
      message,
      type: type || "info",
    });

  const closeModal = () =>
    setModal({
      open: false,
      title: "",
      message: "",
      type: "info",
      checkKeyToRemove: null,
    });

  /* ---------------------------------------------- */
  /* VALIDATION HELPERS                              */
  /* ---------------------------------------------- */
  const validateAadhaar = (v) => /^\d{12}$/.test(v);
  const validatePAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);
  const validatePhone = (v) => /^\d{10}$/.test(v);
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePincode = (v) => /^\d{6}$/.test(v);
  const validateDOB = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);
  const validatePassport = (v) => /^[A-PR-WYa-pr-wy][1-9]\d{6}$/.test(v);
  const validateUAN = (v) => /^\d{12}$/.test(v);
  const validateAccount = (v) => /^\d{6,18}$/.test(v);

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
    address: "",
    district: "",
    state: "",
    pincode: "",
    
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

  /* ---------------------------------------------- */
  /* AUTO-LOAD ORG + SERVICES FROM LOCALSTORAGE      */
  /* ---------------------------------------------- */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bgvUser");
      if (stored) {
        const parsed = JSON.parse(stored);
        setBgvUser(parsed);

        // Load checks from org services
        if (parsed?.services?.length) {
          // Only API-based services should appear in the self-verification page
          const dynamicChecks = parsed.services
            .filter((s) => s.serviceName?.trim())
            .filter((s) => API_CHECKS.includes(s.serviceName)) // <-- FILTER ADDED
            .map((s) => ({
              key: s.serviceName,
              ...getCheckConfig(s.serviceName),
            }));

          setAvailableChecks(dynamicChecks);
        }
      }
    } catch (err) {
      console.error("Failed to parse bgvUser");
    }
  }, []);

  /* ---------------------------------------------- */
  /* INPUT SANITIZER                                 */
  /* ---------------------------------------------- */
  const handleInputChange = (e, isFile = false, fileField = null) => {
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
    if (name === "uanNumber") value = value.replace(/\D/g, "").slice(0, 12);
    if (name === "pincode") value = value.replace(/\D/g, "").slice(0, 6);
    if (name === "bankAccountNumber")
      value = value.replace(/\D/g, "").slice(0, 18);

    setNewCandidate((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError("");
    }
  };

  /* ---------------------------------------------- */
  /* CANDIDATE FETCH                                 */
  /* ---------------------------------------------- */
  useEffect(() => {
    if (!bgvUser?.organizationId) return;

    fetchCandidates(bgvUser.organizationId);
  }, [bgvUser]);

  const fetchCandidates = async (orgId) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/secure/getCandidates?orgId=${orgId}`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (res.ok) setCandidates(data.candidates || []);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------- */
  /* VERIFICATION REFRESH                            */
  /* ---------------------------------------------- */
  const refreshVerification = async (candidateId) => {
    if (!candidateId) {
      setCandidateVerification(null);
      setStages({ primary: [], secondary: [], final: [] });
      setCurrentStep(0);
      return;
    }

    setLoadingCandidate(true);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/secure/getVerifications?candidateId=${candidateId}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok || !data.verifications?.length) {
        setCandidateVerification(null);
        setStages({ primary: [], secondary: [], final: [] });
        setCurrentStep(0);
        return;
      }

      const v = data.verifications[0];
      setCandidateVerification(v);

      const stageIndex = steps.indexOf(v.currentStage);
      setCurrentStep(stageIndex);

      const restored = { primary: [], secondary: [], final: [] };

      steps.forEach((st) => {
        if (Array.isArray(v.stages?.[st])) {
          restored[st] = v.stages[st].map((c) => c.check);
        }
      });

      setStages(restored);
    } finally {
      setLoading(false);
      setLoadingCandidate(false);
    }
  };

  /* ---------------------------------------------- */
  /* STAGE STATUS HELPERS                            */
  /* ---------------------------------------------- */
  const getStageStatus = (stageKey) => {
    const data = candidateVerification?.stages?.[stageKey];
    if (!Array.isArray(data) || data.length === 0) return "PENDING";
    if (data.every((c) => c.status === "COMPLETED")) return "COMPLETED";
    if (data.some((c) => c.status === "IN_PROGRESS")) return "IN_PROGRESS";
    if (data.some((c) => c.status === "FAILED")) return "FAILED";
    return "PENDING";
  };

  const isStageInitiated = (stageKey) => {
    const s = getStageStatus(stageKey);
    return s === "COMPLETED" || s === "IN_PROGRESS";
  };

  const isPrevStageCompleted = (stageKey) => {
    const idx = steps.indexOf(stageKey);
    if (idx === 0) return true;
    const prevStageStatus = getStageStatus(steps[idx - 1]);
    return prevStageStatus === "COMPLETED" || prevStageStatus === "FAILED";
  };
  /* ---------------------------------------------- */
  /* VISIBLE CHECK CARDS                             */
  /* ---------------------------------------------- */
  const visibleCheckCards = () => {
    const stageKey = steps[currentStep];

    if (isStageInitiated(stageKey)) {
      return availableChecks.filter((c) => stages[stageKey].includes(c.key));
    }

    const usedBefore = new Set();
    for (let i = 0; i < currentStep; i++) {
      stages[steps[i]].forEach((ck) => usedBefore.add(ck));
    }

    return availableChecks.filter(
      (c) => !usedBefore.has(c.key) && !stages[stageKey].includes(c.key)
    );
  };

  /* ---------------------------------------------- */
  /* TOGGLE CHECK                                    */
  /* ---------------------------------------------- */
  const handleToggle = (checkKey) => {
    const stageKey = steps[currentStep];

    if (!isPrevStageCompleted(stageKey)) return;
    if (isStageInitiated(stageKey)) return;

    setStages((prev) => {
      const selected = prev[stageKey].includes(checkKey);

      return {
        ...prev,
        [stageKey]: selected
          ? prev[stageKey].filter((c) => c !== checkKey)
          : [...prev[stageKey], checkKey],
      };
    });
  };

  /* ---------------------------------------------- */
  /* REMOVE CHECK                                     */
  /* ---------------------------------------------- */
  const removeCheckFromLeft = (checkKey) => {
    setModal({
      open: true,
      title: "Remove Selected Check?",
      message: `Remove '${checkKey}' from this stage?`,
      type: "confirm",
      checkKeyToRemove: checkKey,
    });
  };

  const confirmRemoveCheck = () => {
    const checkKey = modal.checkKeyToRemove;
    const stageKey = steps[currentStep];

    setStages((prev) => ({
      ...prev,
      [stageKey]: prev[stageKey].filter((c) => c !== checkKey),
    }));

    setModal({
      open: false,
      title: "",
      message: "",
      type: "info",
      checkKeyToRemove: null,
    });
  };

  /* ---------------------------------------------- */
  /* INITIATE STAGE (USING /secure/initiateStage)   */
  /* ---------------------------------------------- */
  const initiateStage = async (stageKey) => {
    if (!bgvUser?.organizationId || !selectedCandidate) {
      return showModal({
        title: "Missing Selection",
        message: "Select a candidate first.",
        type: "error",
      });
    }

    if (!isPrevStageCompleted(stageKey)) {
      return showModal({
        title: "Previous Stage Incomplete",
        message: "Complete previous stage first.",
        type: "error",
      });
    }

    const selectedChecks = stages[stageKey];

    if (!selectedChecks.length) {
      return showModal({
        title: "No Checks Selected",
        message: "Select at least one verification check.",
        type: "error",
      });
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/proxy/secure/initiateStage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          candidateId: selectedCandidate,
          organizationId: bgvUser.organizationId,
          stage: stageKey,
          checks: selectedChecks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return showModal({
          title: "Failed to Initiate",
          message: data.detail || data.message || "Server error.",
          type: "error",
        });
      }

      showModal({
        title: "Stage Initiated",
        message: `${stageKey.toUpperCase()} stage started successfully.`,
        type: "success",
      });

      await refreshVerification(selectedCandidate);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------- */
  /* SEARCHABLE DROPDOWN                             */
  /* ---------------------------------------------- */
  function SearchableDropdown({ label, value, options, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = options.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="w-full relative">
        {label && (
          <label className="text-sm font-bold text-gray-700 mb-2 block">
            {label}
          </label>
        )}

        {/* Trigger Box - Enhanced */}
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

        {/* Dropdown - Enhanced */}
        {open && !disabled && (
          <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-3">
            {/* Search input */}
            <input
              type="text"
              placeholder="🔍 Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none transition"
            />

            {/* Results */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="p-4 text-gray-500 text-sm text-center">
                  No results found
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.value}
                    className="px-4 py-3 text-sm rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-[#ff004f] transition-all duration-150 font-medium"
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {item.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------------------------------------- */
  /* STAGE TABLE (SUMMARY)                           */
  /* ---------------------------------------------- */
  const StageTable = ({ title, stageKey }) => {
    const data = candidateVerification?.stages?.[stageKey] || [];
    const stageStatus = getStageStatus(stageKey);

    const getCheckTitle = (key) => {
      const check = availableChecks.find((c) => c.key === key);
      return check?.title || key;
    };

    return (
      <div className="bg-white rounded-2xl border-2 shadow-lg p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] rounded-lg">
              <FileText className="text-white" size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>

          <span
            className={`px-3 py-1.5 text-xs rounded-full font-bold border ${
              stageStatus === "COMPLETED"
                ? "bg-green-100 text-green-800 border-green-300"
                : stageStatus === "IN_PROGRESS"
                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                : stageStatus === "FAILED"
                ? "bg-red-100 text-red-800 border-red-300"
                : "bg-gray-100 text-gray-800 border-gray-300"
            }`}
          >
            {stageStatus}
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                <th className="p-4 text-left font-bold text-gray-900 border-b-2">
                  Check
                </th>
                <th className="p-4 text-left font-bold text-gray-900 border-b-2">
                  Status
                </th>
                <th className="p-4 text-left font-bold text-gray-900 border-b-2">
                  Remarks
                </th>
                <th className="p-4 text-left font-bold text-gray-900 border-b-2">
                  Submitted At
                </th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No checks initiated
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {getCheckTitle(item.check)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          item.status === "COMPLETED"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : item.status === "IN_PROGRESS"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : item.status === "FAILED"
                            ? "bg-red-100 text-red-800 border border-red-300"
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
                      {item.remarks ? (
                        typeof item.remarks === "string" ? (
                          <div className="text-xs bg-gray-50 p-2 rounded-lg border break-words whitespace-pre-wrap">
                            {item.remarks}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {Object.entries(item.remarks).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="text-xs bg-gray-50 p-2 rounded-lg border break-words"
                                >
                                  <span className="font-semibold capitalize">
                                    {key}:{" "}
                                  </span>
                                  {value === null ? "—" : String(value)}
                                </div>
                              )
                            )}
                          </div>
                        )
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>

                    <td className="p-4 text-gray-700 whitespace-nowrap">
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-4">
          {data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No checks initiated
            </div>
          ) : (
            data.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border-2 rounded-xl shadow-md p-4 space-y-3"
              >
                {/* Check Name */}
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-bold text-gray-900 text-base flex-1">
                    {getCheckTitle(item.check)}
                  </h4>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                      item.status === "COMPLETED"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : item.status === "IN_PROGRESS"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                        : item.status === "FAILED"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                  >
                    {item.status === "COMPLETED" && "✓ "}
                    {item.status === "FAILED" && "✗ "}
                    {item.status === "IN_PROGRESS" && "⏳ "}
                    {item.status}
                  </span>
                </div>

                {/* Remarks */}
                {item.remarks && (
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="font-semibold text-gray-700 text-xs mb-2">
                      Remarks:
                    </div>
                    {typeof item.remarks === "string" ? (
                      <div className="text-xs text-gray-700 break-words whitespace-pre-wrap">
                        {item.remarks}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(item.remarks).map(([key, value]) => (
                          <div
                            key={key}
                            className="text-xs text-gray-700 break-words"
                          >
                            <span className="font-semibold capitalize">
                              {key}:{" "}
                            </span>
                            <span>{value === null ? "—" : String(value)}</span>
                          </div>
                        ))}
                      </div>
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
          )}
        </div>
      </div>
    );
  };

  /* ---------------------------------------------- */
  /* ADD CANDIDATE FUNCTION                          */
  /* ---------------------------------------------- */
  const handleAddCandidate = async () => {
    setSubmitting(true);

    try {
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
      formData.append("organizationId", bgvUser.organizationId);

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

      const res = await fetch(`/api/proxy/secure/addCandidate`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        showModal({
          title: "Error Adding Candidate",
          message: data.detail || "Server error",
          type: "error",
        });
      } else {
        showModal({
          title: "Success",
          message: "Candidate added successfully.",
          type: "success",
        });

        setShowAddModal(false);
        setNewCandidate(createEmptyCandidate());
        setValidationError("");
        setExpandedSections({
          supervisory1: false,
          supervisory2: false,
          employment1: false,
          employment2: false,
          education: false,
        });

        await fetchCandidates(bgvUser.organizationId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------- */
  /* PAGE UI                                         */
  /* ---------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900 px-3 sm:px-4 md:px-6 py-4">
      {/* Loading Overlay */}
      {loadingCandidate && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#ff004f]" size={48} />
          </div>
        </>
      )}

      {/* Global Modals */}
      {modal.open && modal.type !== "confirmClose" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-gray-100">
            <h2
              className={`text-2xl font-black mb-3 ${
                modal.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {modal.title}
            </h2>

            <p className="text-gray-700 whitespace-pre-wrap mb-6 leading-relaxed">
              {modal.message}
            </p>

            {modal.type === "confirm" ? (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() =>
                    setModal({
                      open: false,
                      title: "",
                      message: "",
                      type: "info",
                    })
                  }
                  className="w-1/2 py-3 rounded-xl bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveCheck}
                  className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg font-bold transition-all"
                >
                  Yes, Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  setModal({
                    open: false,
                    title: "",
                    message: "",
                    type: "info",
                  })
                }
                className={`mt-2 w-full py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg ${
                  modal.type === "error"
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : "bg-gradient-to-r from-green-500 to-green-600"
                }`}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* PAGE HEADER — ENHANCED WITH GRADIENT */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff004f]/5 via-transparent to-purple-500/5"></div>
          <div className="relative p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <UserCheck size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    Self Verification Services
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base">
                    Initiate candidate self-verification with automated API
                    checks
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INFORMATIVE BANNER */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertCircle className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-blue-900 mb-3 text-lg">
                Self-Verification Information
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p className="flex items-center gap-2">
                  <span className="font-semibold">🔐 Candidate Initiated:</span>
                  <span>
                    Self-verification allows candidates to complete their own
                    verification checks through a secure portal.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">⚡ API-Only Checks:</span>
                  <span>
                    Only automated API-based verification checks are available
                    for self-verification (PAN, Aadhaar, Employment, etc.).
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">📋 Stage-Based Process:</span>
                  <span>
                    Select checks for each stage (Primary, Secondary, Final) and
                    initiate verification. Candidates will receive instructions
                    to complete.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">✅ Automated Results:</span>
                  <span>
                    Results are automatically processed and displayed in the
                    summary tables below once candidates complete their
                    verification.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS ROW */}
        <div className="flex justify-end gap-3 flex-wrap">
          <div className="flex gap-3 flex-wrap">
            <button
              disabled={!selectedCandidate}
              onClick={() => refreshVerification(selectedCandidate)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                selectedCandidate
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <RefreshCcw size={16} /> Refresh
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setNewCandidate(createEmptyCandidate());
                setShowAddModal(true);
              }}
            >
              <PlusCircle size={16} /> Add Candidate
            </button>
          </div>
        </div>

        {/* STEPPER - ENHANCED */}
        <div className="bg-white border-2 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Verification Progress
            </h3>
            <span className="text-sm text-gray-600">
              {getStageStatus("primary") === "COMPLETED" &&
              getStageStatus("secondary") === "COMPLETED" &&
              getStageStatus("final") === "COMPLETED"
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

            {steps.map((stageKey, idx) => {
              const active = idx === currentStep;
              const status = getStageStatus(stageKey);
              const done = status === "COMPLETED";

              return (
                <div
                  key={stageKey}
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
                    {done ? <CheckCircle size={20} /> : idx + 1}
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
                      {stageKey.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">
                      {done
                        ? "✓ Completed"
                        : active
                        ? "In Progress"
                        : status.toLowerCase()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CANDIDATE SELECT - Enhanced */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Selection Panel
                </h3>
                <p className="text-xs text-gray-600">
                  Choose candidate to begin self-verification
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  Organization
                </label>
                <div className="border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                  <div className="font-bold text-sm text-gray-900">
                    {bgvUser?.organizationName || "Your Organization"}
                  </div>
                </div>
              </div>

              <div>
                <SearchableDropdown
                  label="Select Candidate"
                  value={selectedCandidate}
                  disabled={!bgvUser?.organizationId}
                  onChange={(cid) => {
                    setSelectedCandidate(cid);

                    if (cid) refreshVerification(cid);
                    else {
                      setCandidateVerification(null);
                      setStages({ primary: [], secondary: [], final: [] });
                      setCurrentStep(0);
                    }
                  }}
                  options={candidates.map((c) => ({
                    label: `${c.firstName} ${c.lastName}`,
                    value: c._id,
                  }))}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  Available API Checks
                </label>
                <div className="border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                  <div className="font-bold text-sm text-gray-900">
                    {availableChecks.length > 0
                      ? `${availableChecks.length} API Services`
                      : "No services"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SERVICE CARDS - SHOW AVAILABLE SERVICES */}
        {bgvUser && bgvUser.services && bgvUser.services.length > 0 && (
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
              {bgvUser.services.map((service, idx) => (
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

        {/* CHECK PANEL */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow border">
          <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
            {/* LEFT PANEL */}
            <div className="space-y-4 lg:sticky lg:top-4 mb-6 lg:mb-0 order-2 lg:order-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Verification Stages
              </h3>

              {steps.map((stageKey, index) => {
                const status = getStageStatus(stageKey);
                const isActive = index === currentStep;

                const canNavigate =
                  index === 0 ||
                  steps
                    .slice(0, index)
                    .every((s) => {
                      const status = getStageStatus(s);
                      return status === "COMPLETED" || status === "FAILED";
                    });

                return (
                  <div
                    key={stageKey}
                    className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? "bg-red-50 border-2 border-red-200"
                        : canNavigate
                        ? "bg-gray-50 border-2 border-gray-200 hover:bg-gray-100"
                        : "bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => canNavigate && setCurrentStep(index)}
                  >
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold ${
                        status === "COMPLETED"
                          ? "bg-green-600 text-white"
                          : isActive
                          ? "bg-red-600 text-white"
                          : "bg-gray-400 text-white"
                      }`}
                    >
                      {status === "COMPLETED" ? (
                        <CheckCircle size={18} />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <div className="flex-1">
                      <div
                        className={`font-semibold ${
                          isActive ? "text-red-600" : "text-gray-700"
                        }`}
                      >
                        {stageKey.toUpperCase()} STAGE
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {status.toLowerCase()} • {stages[stageKey]?.length || 0}{" "}
                        checks
                      </div>
                    </div>

                    {canNavigate && !isActive && (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </div>
                );
              })}

              {/* SELECTED CHECKS - Enhanced */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200 shadow-sm mt-6">
                <div className="text-xs font-bold text-blue-900 mb-3">
                  Selected Checks
                </div>
                <div className="max-h-[200px] overflow-y-auto">

                {stages[steps[currentStep]].length ? (
                  <div className="space-y-2">
                    {stages[steps[currentStep]].map((checkKey) => {
                      const check = availableChecks.find(
                        (c) => c.key === checkKey
                      );
                      return (
                        <div
                          key={checkKey}
                          className="flex items-center justify-between text-sm bg-white border-2 border-blue-200 rounded-lg px-3 py-2 shadow-sm"
                        >
                          <span className="font-medium text-gray-900 flex items-center gap-2">
                            <span>{check?.icon}</span>
                            <span className="truncate">
                              {check?.title || checkKey}
                            </span>
                          </span>

                          <button
                            disabled={isStageInitiated(steps[currentStep])}
                            onClick={() => removeCheckFromLeft(checkKey)}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs text-center py-4">
                    No checks selected
                  </div>
                )}
                </div>
              </div>

              {/* INITIATE BUTTON */}
              <button
                onClick={() => initiateStage(steps[currentStep])}
                disabled={
                  submitting ||
                  isStageInitiated(steps[currentStep]) ||
                  !isPrevStageCompleted(steps[currentStep]) ||
                  !stages[steps[currentStep]].length
                }
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium mt-4
                  ${
                    isStageInitiated(steps[currentStep])
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isStageInitiated(steps[currentStep])
                  ? "Stage Initiated"
                  : `Initiate ${steps[currentStep]} Stage`}
              </button>
            </div>

            {/* RIGHT — CHECK CARDS */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {steps[currentStep].toUpperCase()} Stage - Available Checks
                </h3>
                <div className="text-sm text-gray-500">
                  {visibleCheckCards().length} checks available
                </div>
              </div>

              {/* RESPONSIVE CARD GRID - Enhanced */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
                {visibleCheckCards().map((c) => {
                  const stageKey = steps[currentStep];
                  const selected = stages[stageKey].includes(c.key);
                  const locked = isStageInitiated(stageKey);
                  const allowed = isPrevStageCompleted(stageKey);

                  const cardGradient = locked
                    ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg"
                    : selected
                    ? "border-[#ff004f] bg-gradient-to-br from-red-50 to-pink-50 shadow-lg"
                    : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-lg";

                  return (
                    <div
                      key={c.key}
                      className={`border-2 rounded-2xl p-4 md:p-5 transition-all duration-200 min-h-[160px] md:min-h-[180px] transform hover:scale-105 ${cardGradient}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <span className="text-3xl">{c.icon}</span>
                        </div>

                        {selected && !locked && (
                          <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] text-white rounded-full font-bold shadow-md">
                            Selected
                          </span>
                        )}

                        {locked && (
                          <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-md">
                            Initiated
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-gray-900 mb-3 text-base leading-tight">
                        {c.title}
                      </h4>

                      <div className="border-t border-gray-200 my-3" />

                      {locked ? (
                        <div className="mt-3 text-xs font-bold text-green-700 bg-green-100 px-3 py-2 rounded-lg border border-green-300 flex items-center gap-2">
                          <CheckCircle size={14} />
                          {getStageStatus(stageKey)}
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-3 mt-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!allowed}
                            onChange={() => handleToggle(c.key)}
                            className="accent-[#ff004f] w-5 h-5"
                          />
                          <span
                            className={`text-sm font-medium ${
                              !allowed ? "text-gray-400" : "text-gray-700"
                            }`}
                          >
                            {!allowed
                              ? "Complete previous stage"
                              : "Add to Current Stage"}
                          </span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY TABLES */}
        {candidateVerification && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Verification Summary
            </h2>

            <div className="space-y-6">
              {isStageInitiated("primary") && (
                <StageTable title="Primary Stage" stageKey="primary" />
              )}

              {isStageInitiated("secondary") && (
                <StageTable title="Secondary Stage" stageKey="secondary" />
              )}

              {isStageInitiated("final") && (
                <StageTable title="Final Stage" stageKey="final" />
              )}
            </div>
          </div>
        )}

        {/* ADD CANDIDATE MODAL */}
        {showAddModal && (
          <Modal 
            title="Add Candidate" 
            onClose={handleModalClose}
          >
            <CandidateForm
              data={newCandidate}
              onChange={handleInputChange}
              onSubmit={handleAddCandidate}
              saving={submitting}
              submitText="Add Candidate"
              validationError={validationError}
              setValidationError={setValidationError}
            />
          </Modal>
        )}

        {/* CONFIRM CLOSE MODAL */}
        {showConfirmClose && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">Discard Changes?</h3>
              <p className="text-sm text-gray-600 mb-4">
                You have unsaved changes. Are you sure you want to close without saving?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmClose(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmClose(false);
                    setShowAddModal(false);
                    setNewCandidate(createEmptyCandidate());
                    setValidationError("");
                    setExpandedSections({
                      supervisory1: false,
                      supervisory2: false,
                      employment1: false,
                      employment2: false,
                      education: false,
                    });
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM CLOSE MODAL */}
        {showConfirmClose && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">Discard Changes?</h3>
              <p className="text-sm text-gray-600 mb-4">
                You have unsaved changes. Are you sure you want to close without saving?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmClose(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmClose(false);
                    setShowAddModal(false);
                    setNewCandidate(createEmptyCandidate());
                    setValidationError("");
                    setExpandedSections({
                      supervisory1: false,
                      supervisory2: false,
                      employment1: false,
                      employment2: false,
                      education: false,
                    });
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* ============================== MODAL ================================ */
/* ====================================================================== */

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg text-gray-900 overflow-hidden">
        {/* Enhanced Header with Gradient */}
        <div className="bg-gradient-to-r from-[#ff004f] to-[#ff3366] px-6 py-4 relative sticky top-0 z-10">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-1 transition-all"
          >
            <X size={22} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="text-white/80 text-sm">Fill in candidate information</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------- */
/* -------------------------------------------- */
/* FORM COMPONENT — WITH FULL NEW FIELDS */
/* -------------------------------------------- */
function CandidateForm({ data, onChange, onSubmit, saving, submitText, validationError, setValidationError }) {
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

  const handleSubmitWithValidation = () => {
    // Validate required fields
    if (!data.firstName?.trim() || !data.lastName?.trim() || !data.email?.trim() || !data.phone?.trim()) {
      setValidationError("Please fill all required details");
      return;
    }
    
    // Clear validation error and proceed with submission
    setValidationError("");
    onSubmit();
  };

  const handleInputChange = (e) => {
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError("");
    }
    onChange(e);
  };

  return (
    <div className="text-gray-900 max-h-[70vh] overflow-y-auto pr-2">
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
          value={data.firstName}
          onChange={handleInputChange}
          placeholder="First Name*"
          className="border p-2 rounded"
        />

        <input
          name="middleName"
          value={data.middleName}
          onChange={handleInputChange}
          placeholder="Middle Name (Optional)"
          className="border p-2 rounded"
        />

        <input
          name="lastName"
          value={data.lastName}
          onChange={handleInputChange}
          placeholder="Last Name*"
          className="border p-2 rounded"
        />
      </div>

      {/* FATHER NAME */}
      <input
        name="fatherName"
        value={data.fatherName}
        onChange={onChange}
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
            value={data.dob}
            onChange={onChange}
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
                  onChange({ target: { name: "gender", value: g } })
                }
                className={`px-4 py-2 rounded-md border flex-1 capitalize ${
                  data.gender === g
                    ? "bg-[#ff004f] text-white border-[#ff004f]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#ff004f]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTACT INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <input
          name="phone"
          value={data.phone}
          onChange={onChange}
          placeholder="Phone Number*"
          className="border p-2 rounded"
        />

        <input
          name="email"
          value={data.email}
          onChange={onChange}
          placeholder="Email Address*"
          className="border p-2 rounded"
        />
      </div>

      {/* DOCUMENT NUMBERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <input
          name="aadhaarNumber"
          value={data.aadhaarNumber}
          onChange={onChange}
          placeholder="Aadhaar Number*"
          className="border p-2 rounded"
        />

        <input
          name="panNumber"
          value={data.panNumber}
          onChange={onChange}
          placeholder="PAN Number*"
          className="border p-2 rounded uppercase"
        />
      </div>

      {/* OPTIONAL DOCUMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <input
          name="uanNumber"
          value={data.uanNumber}
          onChange={onChange}
          placeholder="UAN Number (Optional)"
          className="border p-2 rounded"
        />

        <input
          name="passportNumber"
          value={data.passportNumber}
          onChange={onChange}
          placeholder="Passport Number (Optional)"
          className="border p-2 rounded"
        />

        <input
          name="bankAccountNumber"
          value={data.bankAccountNumber}
          onChange={onChange}
          placeholder="Bank Account (Optional)"
          className="border p-2 rounded"
        />
      </div>

      {/* ADDRESS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <input
          name="district"
          value={data.district}
          onChange={onChange}
          placeholder="District*"
          className="border p-2 rounded"
        />

        <input
          name="state"
          value={data.state}
          onChange={onChange}
          placeholder="State*"
          className="border p-2 rounded"
        />

        <input
          name="pincode"
          value={data.pincode}
          onChange={onChange}
          placeholder="Pincode*"
          className="border p-2 rounded"
        />
      </div>

      <textarea
        name="address"
        value={data.address}
        onChange={onChange}
        placeholder="Full Address*"
        className="border p-2 rounded w-full mt-4"
        rows={3}
      />

      {/* ============================================ */}
      {/* SUPERVISORY CHECK 1 - COLLAPSIBLE */}
      {/* ============================================ */}
      <div className="mt-4 border-2 border-blue-200 rounded-lg overflow-hidden">
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
              value={data.supervisory1_name || ''}
              onChange={onChange}
              placeholder="Supervisor Name"
              className="border p-2 rounded w-full"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory1_phone"
                value={data.supervisory1_phone || ''}
                onChange={onChange}
                placeholder="Phone Number"
                className="border p-2 rounded"
              />
              <input
                name="supervisory1_email"
                value={data.supervisory1_email || ''}
                onChange={onChange}
                placeholder="Email"
                type="email"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory1_relationship"
                value={data.supervisory1_relationship || ''}
                onChange={onChange}
                placeholder="Relationship (e.g., Former Manager)"
                className="border p-2 rounded"
              />
              <input
                name="supervisory1_company"
                value={data.supervisory1_company || ''}
                onChange={onChange}
                placeholder="Company Name"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory1_designation"
                value={data.supervisory1_designation || ''}
                onChange={onChange}
                placeholder="Designation"
                className="border p-2 rounded"
              />
              <input
                name="supervisory1_workingPeriod"
                value={data.supervisory1_workingPeriod || ''}
                onChange={onChange}
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
              value={data.supervisory2_name || ''}
              onChange={onChange}
              placeholder="Supervisor Name"
              className="border p-2 rounded w-full"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory2_phone"
                value={data.supervisory2_phone || ''}
                onChange={onChange}
                placeholder="Phone Number"
                className="border p-2 rounded"
              />
              <input
                name="supervisory2_email"
                value={data.supervisory2_email || ''}
                onChange={onChange}
                placeholder="Email"
                type="email"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory2_relationship"
                value={data.supervisory2_relationship || ''}
                onChange={onChange}
                placeholder="Relationship (e.g., Former Team Lead)"
                className="border p-2 rounded"
              />
              <input
                name="supervisory2_company"
                value={data.supervisory2_company || ''}
                onChange={onChange}
                placeholder="Company Name"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory2_designation"
                value={data.supervisory2_designation || ''}
                onChange={onChange}
                placeholder="Designation"
                className="border p-2 rounded"
              />
              <input
                name="supervisory2_workingPeriod"
                value={data.supervisory2_workingPeriod || ''}
                onChange={onChange}
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
                value={data.employment1_company || ''}
                onChange={onChange}
                placeholder="Company Name"
                className="border p-2 rounded"
              />
              <input
                name="employment1_designation"
                value={data.employment1_designation || ''}
                onChange={onChange}
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
                  value={data.employment1_joiningDate || ''}
                  onChange={onChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Relieving Date</label>
                <input
                  type="date"
                  name="employment1_relievingDate"
                  value={data.employment1_relievingDate || ''}
                  onChange={onChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                name="employment1_hrName"
                value={data.employment1_hrName || ''}
                onChange={onChange}
                placeholder="HR Name"
                className="border p-2 rounded"
              />
              <input
                name="employment1_hrContact"
                value={data.employment1_hrContact || ''}
                onChange={onChange}
                placeholder="HR Contact"
                className="border p-2 rounded"
              />
              <input
                name="employment1_hrEmail"
                value={data.employment1_hrEmail || ''}
                onChange={onChange}
                placeholder="HR Email"
                type="email"
                className="border p-2 rounded"
              />
            </div>
            <textarea
              name="employment1_address"
              value={data.employment1_address || ''}
              onChange={onChange}
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
                  onChange={(e) => onChange(e, true, 'relievingLetter1')}
                  className="border p-2 rounded w-full"
                />
                {data.relievingLetter1 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.relievingLetter1.name}
                  </p>
                )}
                {!data.relievingLetter1 && data.relievingLetterUrl1 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
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
                  onChange={(e) => onChange(e, true, 'experienceLetter1')}
                  className="border p-2 rounded w-full"
                />
                {data.experienceLetter1 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.experienceLetter1.name}
                  </p>
                )}
                {!data.experienceLetter1 && data.experienceLetterUrl1 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
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
                  onChange={(e) => onChange(e, true, 'salarySlips1')}
                  className="border p-2 rounded w-full"
                />
                {data.salarySlips1 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.salarySlips1.name}
                  </p>
                )}
                {!data.salarySlips1 && data.salarySlipsUrl1 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
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
                value={data.employment2_company || ''}
                onChange={onChange}
                placeholder="Company Name"
                className="border p-2 rounded"
              />
              <input
                name="employment2_designation"
                value={data.employment2_designation || ''}
                onChange={onChange}
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
                  value={data.employment2_joiningDate || ''}
                  onChange={onChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Relieving Date</label>
                <input
                  type="date"
                  name="employment2_relievingDate"
                  value={data.employment2_relievingDate || ''}
                  onChange={onChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                name="employment2_hrName"
                value={data.employment2_hrName || ''}
                onChange={onChange}
                placeholder="HR Name"
                className="border p-2 rounded"
              />
              <input
                name="employment2_hrContact"
                value={data.employment2_hrContact || ''}
                onChange={onChange}
                placeholder="HR Contact"
                className="border p-2 rounded"
              />
              <input
                name="employment2_hrEmail"
                value={data.employment2_hrEmail || ''}
                onChange={onChange}
                placeholder="HR Email"
                type="email"
                className="border p-2 rounded"
              />
            </div>
            <textarea
              name="employment2_address"
              value={data.employment2_address || ''}
              onChange={onChange}
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
                  onChange={(e) => onChange(e, true, 'relievingLetter2')}
                  className="border p-2 rounded w-full"
                />
                {data.relievingLetter2 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.relievingLetter2.name}
                  </p>
                )}
                {!data.relievingLetter2 && data.relievingLetterUrl2 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
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
                  onChange={(e) => onChange(e, true, 'experienceLetter2')}
                  className="border p-2 rounded w-full"
                />
                {data.experienceLetter2 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.experienceLetter2.name}
                  </p>
                )}
                {!data.experienceLetter2 && data.experienceLetterUrl2 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
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
                  onChange={(e) => onChange(e, true, 'salarySlips2')}
                  className="border p-2 rounded w-full"
                />
                {data.salarySlips2 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.salarySlips2.name}
                  </p>
                )}
                {!data.salarySlips2 && data.salarySlipsUrl2 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
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
                  onChange={(e) => onChange(e, true, 'educationCertificate')}
                  className="border p-2 rounded w-full"
                />
                {data.educationCertificate && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.educationCertificate.name}
                  </p>
                )}
                {!data.educationCertificate && data.educationCertificateUrl && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
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
                  onChange={(e) => onChange(e, true, 'marksheet')}
                  className="border p-2 rounded w-full"
                />
                {data.marksheet && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.marksheet.name}
                  </p>
                )}
                {!data.marksheet && data.marksheetUrl && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="education_degree"
                value={data.education_degree || ''}
                onChange={onChange}
                placeholder="Degree (e.g., Bachelor of Technology)"
                className="border p-2 rounded"
              />
              <input
                name="education_specialization"
                value={data.education_specialization || ''}
                onChange={onChange}
                placeholder="Specialization"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="education_universityName"
                value={data.education_universityName || ''}
                onChange={onChange}
                placeholder="University Name"
                className="border p-2 rounded"
              />
              <input
                name="education_collegeName"
                value={data.education_collegeName || ''}
                onChange={onChange}
                placeholder="College Name"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="education_yearOfPassing"
                value={data.education_yearOfPassing || ''}
                onChange={onChange}
                placeholder="Year of Passing"
                className="border p-2 rounded"
              />
              <input
                name="education_cgpa"
                value={data.education_cgpa || ''}
                onChange={onChange}
                placeholder="CGPA/Percentage"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                name="education_universityContact"
                value={data.education_universityContact || ''}
                onChange={onChange}
                placeholder="University Contact"
                className="border p-2 rounded"
              />
              <input
                name="education_universityEmail"
                value={data.education_universityEmail || ''}
                onChange={onChange}
                placeholder="University Email"
                type="email"
                className="border p-2 rounded"
              />
              <input
                name="education_collegeContact"
                value={data.education_collegeContact || ''}
                onChange={onChange}
                placeholder="College Contact"
                className="border p-2 rounded"
              />
            </div>
            <input
              name="education_collegeEmail"
              value={data.education_collegeEmail || ''}
              onChange={onChange}
              placeholder="College Email"
              type="email"
              className="border p-2 rounded w-full"
            />
            <textarea
              name="education_universityAddress"
              value={data.education_universityAddress || ''}
              onChange={onChange}
              placeholder="University Address"
              rows={2}
              className="border p-2 rounded w-full"
            />
            <textarea
              name="education_collegeAddress"
              value={data.education_collegeAddress || ''}
              onChange={onChange}
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
        onChange={(e) => onChange(e, true)}
        className="border p-2 rounded w-full"
      />

      {data.resume && (
        <p className="text-sm mt-2 text-gray-700">
          Selected: <span className="font-semibold">{data.resume.name}</span>
        </p>
      )}

      {/* SUBMIT BUTTON */}
      <div className="mt-8 pt-6 border-t-2 border-gray-100">
        <button
          onClick={handleSubmitWithValidation}
          disabled={saving}
          className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#ff004f] to-[#ff3366] hover:shadow-2xl hover:shadow-[#ff004f]/30"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>💾 {submitText}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
