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
  UserCircle2,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSuperAdminState } from "../../context/SuperAdminStateContext";

export default function BGVInitiationPage() {
  const router = useRouter();

  // State management context
  const { bgvState = {}, setBgvState = () => {} } = useSuperAdminState();

  const [organizations, setOrganizations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(bgvState.selectedOrg || "");
  const [selectedCandidate, setSelectedCandidate] = useState(
    bgvState.selectedCandidate || ""
  );
  const [candidateVerification, setCandidateVerification] = useState(null);

  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [loadingCandidateStatus, setLoadingCandidateStatus] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [reinitLoading, setReinitLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [startLoading, setStartLoading] = useState({});
  const [orgDetails, setOrgDetails] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [stageTransition, setStageTransition] = useState({
    isTransitioning: false,
    fromStage: "",
    toStage: "",
  });

  const [visibleStage, setVisibleStage] = useState(
    bgvState.visibleStage || "primary"
  );
  const [currentStep, setCurrentStep] = useState(bgvState.currentStep || 0);
  const stepNames = ["Primary", "Secondary", "Final"];
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const [consentStatus, setConsentStatus] = useState(null);
  const [sendingConsent, setSendingConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(false);
  const [showConsentWarning, setShowConsentWarning] = useState({
    open: false,
    stage: null,
  });
  const [manualModal, setManualModal] = useState({
    open: false,
    check: null,
    stage: null,
    remarks: "",
    status: "COMPLETED",
    loading: false,
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

  // FULL candidate schema
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
  };

  const [newCandidate, setNewCandidate] = useState(emptyCandidate);
  const [fieldErrors, setFieldErrors] = useState({});
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

    setNewCandidate((p) => ({ ...p, [name]: value }));
  };

  const DEFAULTS = {
    primary: [],
    secondary: [],
    final: [],
  };

  const [stages, setStages] = useState(
    bgvState.stages || {
      primary: [...DEFAULTS.primary],
      secondary: [...DEFAULTS.secondary],
      final: [...DEFAULTS.final],
    }
  );

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "info",
  });

  // Use ref to always have latest values for state persistence
  const stateRef = useRef({
    selectedOrg,
    selectedCandidate,
    stages,
    currentStep,
    visibleStage,
  });

  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = {
      selectedOrg,
      selectedCandidate,
      stages,
      currentStep,
      visibleStage,
    };
  }, [selectedOrg, selectedCandidate, stages, currentStep, visibleStage]);

  // Save state on unmount (when navigating away)
  useEffect(() => {
    return () => {
      setBgvState(stateRef.current);
    };
  }, [setBgvState]);

  const showModal = ({ title, message, type }) =>
    setModal({
      open: true,
      title,
      message,
      type,
    });

  const closeModal = () =>
    setModal((p) => ({
      ...p,
      open: false,
    }));

  const [lastRunStage, setLastRunStage] = useState(null);
  useEffect(() => {
    const selected = organizations.find((o) => o._id === selectedOrg);
    setOrgDetails(selected || null);
  }, [selectedOrg, organizations]);

  const servicesOffered = useMemo(() => {
    if (!orgDetails?.services) return [];
    return orgDetails.services
      .map((s) => s.serviceName?.trim()?.toLowerCase())
      .filter(Boolean); // remove empty names
  }, [orgDetails]);

  const getCheckStatus = (check) => {
    if (!candidateVerification?.stages) return null;
    for (const arr of Object.values(candidateVerification.stages)) {
      if (!Array.isArray(arr)) continue;
      const found = arr.find((c) => c.check === check);
      if (found) return found.status;
    }
    return null;
  };
  function getCheckType(checkId) {
    if (API_SERVICES.includes(checkId)) return "API";
    if (MANUAL_SERVICES.some(s => s.id === checkId)) return "MANUAL";
    if (AI_SERVICES.some(s => s.id === checkId)) return "AI";
    return "OTHER";
  }

  const isStageCompleted = (stage) => {
    const arr = candidateVerification?.stages?.[stage];
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every((c) => c.status === "COMPLETED");
  };

  const isCheckCompletedAnywhere = (check) => {
    if (!candidateVerification?.stages) return false;
    for (const arr of Object.values(candidateVerification.stages)) {
      if (!Array.isArray(arr)) continue;
      const f = arr.find((c) => c.check === check && c.status === "COMPLETED");
      if (f) return true;
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

  // NEW: Check if specific stage has failed checks
  const stageHasFailedChecks = (stage) => {
    const arr = candidateVerification?.stages?.[stage];
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.some((c) => c.status === "FAILED");
  };

  // NEW: Get stage initiation status for display
  const getStageInitiationStatus = (stage) => {
    const arr = candidateVerification?.stages?.[stage];
    if (!Array.isArray(arr) || arr.length === 0) return "not_initiated";
    
    const hasCompleted = arr.some((c) => c.status === "COMPLETED");
    const hasFailed = arr.some((c) => c.status === "FAILED");
    const hasInProgress = arr.some((c) => c.status === "IN_PROGRESS");
    
    if (hasCompleted && !hasFailed && !hasInProgress) return "completed";
    if (hasFailed) return "has_failures";
    if (hasInProgress) return "in_progress";
    if (arr.length > 0) return "initiated";
    return "not_initiated";
  };

  // NEW: Get count of new checks that will be processed
  const getNewChecksCount = (stageKey) => {
    const selectedChecks = stages[stageKey] || [];
    const newChecks = selectedChecks.filter(checkKey => {
      const status = getCheckStatus(checkKey);
      return !status || status === "NOT_STARTED";
    });
    return {
      total: selectedChecks.length,
      new: newChecks.length,
      processed: selectedChecks.length - newChecks.length
    };
  };

  // NEW: Get locked checks information
  const getLockedChecksInfo = () => {
    const lockedStages = [];
    const lockedChecks = [];
    
    ["primary", "secondary", "final"].forEach(stage => {
      if (isStageLocked(stage)) {
        lockedStages.push(stage);
        const stageChecks = finalizedChecks[stage] || [];
        lockedChecks.push(...stageChecks);
      }
    });
    
    return {
      hasLockedStages: lockedStages.length > 0,
      lockedStages,
      lockedChecks: [...new Set(lockedChecks)], // Remove duplicates
      totalLocked: [...new Set(lockedChecks)].length
    };
  };

  const isStageLocked = (stage) => {
    if (!candidateVerification?.stages) return false;
    const arr = candidateVerification.stages[stage];
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.some((c) => c.status !== "FAILED");
  };

  const candidateHasConsented =
    candidateVerification?.consentStatus === "CONSENT_GIVEN";

  const finalizedChecks = useMemo(() => {
    if (!candidateVerification?.stages) return { primary: [], secondary: [], final: [] };

    return {
      primary: candidateVerification.stages.primary?.map((c) => c.check) || [],
      secondary: candidateVerification.stages.secondary?.map((c) => c.check) || [],
      final: candidateVerification.stages.final?.map((c) => c.check) || [],
    };
  }, [candidateVerification]);

  useEffect(() => {
    (async () => {
      try {
        setOrgLoading(true);
        const res = await fetch(`/api/proxy/secure/getOrganizations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setOrganizations(data.organizations || []);
          // Restore candidates if org was selected
          if (bgvState.selectedOrg) {
            fetchCandidates(bgvState.selectedOrg);
          }
        }
      } finally {
        setOrgLoading(false);
      }
    })();
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

  const fetchCandidates = async (orgId) => {
    try {
      setCandidateLoading(true);
      const res = await fetch(
        `/api/proxy/secure/getCandidates?orgId=${orgId}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || data.error || data.detail || "Failed";
        throw new Error(msg);
      }

      setCandidates(data.candidates || []);
    } catch (err) {
      showModal({
        title: "Error",
        message: err.message,
        type: "error",
      });
    } finally {
      setCandidateLoading(false);
    }
  };
  const fetchConsentStatus = async (candidateId) => {
    try {
      setCheckingConsent(true);
      const res = await fetch(
        `/api/proxy/secure/verification/${candidateId}/consent-status`,
        {
          credentials: "include",
        }
      );

      const data = await res.json();
      if (res.ok) {
        setConsentStatus(data);
      } else {
        setConsentStatus(null);
      }
    } catch {
      setConsentStatus(null);
    } finally {
      setCheckingConsent(false);
    }
  };
  const sendConsentEmail = async () => {
    if (!selectedCandidate) return;

    try {
      setSendingConsent(true);

      const res = await fetch(
        `/api/proxy/secure/verification/${selectedCandidate}/send-consent`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationChecks: [
              {
                name: "Employment Verification",
                description:
                  "Verify employment history, job titles, and employment dates",
              },
            ],
          }), // backend ignores anyway
        }
      );

      const data = await res.json();

      if (res.ok) {
        showModal({
          title: "Consent Email Sent",
          message: `Consent email has been sent to the candidate.\n\nToken expires: ${data.expiresAt}`,
          type: "success",
        });

        fetchConsentStatus(selectedCandidate);
      } else {
        showModal({
          title: "Error",
          message: data.detail || "Failed to send consent",
          type: "error",
        });
      }
    } finally {
      setSendingConsent(false);
    }
  };

  const fetchCandidateVerification = async (candidateId) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/proxy/secure/getVerifications?candidateId=${candidateId}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || data.error || data.detail || "Failed";
        throw new Error(msg);
      }

      setCandidateVerification(data.verifications?.[0] || null);

      setStages({
        primary:
          data.verifications?.[0]?.stages?.primary?.map((c) => c.check) || [],
        secondary:
          data.verifications?.[0]?.stages?.secondary?.map((c) => c.check) || [],
        final:
          data.verifications?.[0]?.stages?.final?.map((c) => c.check) || [],
      });
    } catch (err) {
      showModal({
        title: "Error",
        message: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
      setLoadingCandidateStatus(false);
    }
  };

  const handleCandidateSelect = (id) => {
    setSelectedCandidate(id);
    setCandidateVerification(null);
    setStages({ primary: [], secondary: [], final: [] });
    setCurrentStep(0);
    setVisibleStage("primary");
    setLastRunStage(null);

    if (id) {
      setLoadingCandidateStatus(true);
      fetchCandidateVerification(id);
      fetchConsentStatus(id);
    }
  };

  const validateAadhaar = (aadhaar) => {
    return /^[0-9]{12}$/.test(aadhaar);
  };

  const validatePAN = (pan) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
  };

  const validatePhone = (phone) => {
    return /^[0-9]{10}$/.test(phone);
  };
  const candidateExists = (firstName, lastName, phone) => {
    return candidates.some(
      (c) =>
        c.firstName?.toLowerCase() === firstName.toLowerCase() &&
        c.lastName?.toLowerCase() === lastName.toLowerCase() &&
        c.phone === phone
    );
  };
  const handleAddCandidate = async () => {
    if (!selectedOrg) {
      return showModal({
        title: "Organization Required",
        message: "Please select an organization first.",
        type: "error",
      });
    }

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
      address,
      district,
      state,
      pincode,
      passportNumber,
      uanNumber,
      bankAccountNumber,
      resume,
      middleName,
    } = newCandidate;

    // Required field checks
    if (!firstName) errors.firstName = "First Name is required";
    if (!lastName) errors.lastName = "Last Name is required";
    if (!fatherName) errors.fatherName = "Father's Name is required";
    if (!dob) errors.dob = "Date of Birth is required";
    if (!gender) errors.gender = "Gender is required";
    if (!phone) errors.phone = "Phone Number is required";
    if (!email) errors.email = "Email is required";
    if (!aadhaarNumber) errors.aadhaarNumber = "Aadhaar Number is required";
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
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !emailRegex.test(email)) {
      errors.email =
        "Invalid email format. Please enter a valid email address (e.g., user@example.com)";
    } else if (
      email &&
      (!email.includes("@") || !email.split("@")[1]?.includes("."))
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
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      errors.panNumber =
        "Invalid PAN format. Must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)";
    }

    // Phone validation
    if (phone && !/^\d{10}$/.test(phone)) {
      errors.phone = "Invalid phone number. Must be exactly 10 digits";
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
    if (passportNumber && !/^[A-PR-WY][1-9]\d{6}$/.test(passportNumber)) {
      errors.passportNumber =
        "Invalid Passport Number. Must be in format: A1234567 (1 letter followed by 7 digits)";
    }

    if (uanNumber && !/^[0-9]{10,12}$/.test(uanNumber)) {
      errors.uanNumber = "Invalid UAN Number. Must be 10-12 digits";
    }

    if (bankAccountNumber && !/^[0-9]{9,18}$/.test(bankAccountNumber)) {
      errors.bankAccountNumber =
        "Invalid Bank Account Number. Must be 9-18 digits";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("organizationId", selectedOrg);
      formData.append("firstName", firstName);
      formData.append("middleName", newCandidate.middleName);
      formData.append("lastName", lastName);
      formData.append("fatherName", fatherName);
      formData.append("dob", dob);
      formData.append("gender", gender);
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("aadhaarNumber", aadhaarNumber);
      formData.append("panNumber", panNumber);
      formData.append("uanNumber", uanNumber);
      formData.append("passportNumber", passportNumber);
      formData.append("bankAccountNumber", bankAccountNumber);
      formData.append("address", address);
      formData.append("district", district);
      formData.append("state", state);
      formData.append("pincode", pincode);

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
      if (resume) {
        formData.append("resume", resume);
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
        return showModal({
          title: "Error Adding Candidate",
          message: data.detail || data.message || "Server error",
          type: "error",
        });
      }

      showModal({
        title: "Success",
        message: "Candidate added successfully.",
        type: "success",
      });

      setShowAddModal(false);
      await fetchCandidates(selectedOrg);
      setNewCandidate(emptyCandidate);
      setFieldErrors({});
      setExpandedSections({
        supervisory1: false,
        supervisory2: false,
        employment1: false,
        employment2: false,
        education: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStageToggle = (checkKey, stageKey) => {
    // Check if this check is already completed or failed and should not be toggled
    const status = getCheckStatus(checkKey);
    const isCompleted = isCheckCompletedAnywhere(checkKey);
    
    // Don't allow toggling completed checks or checks that are in progress
    if (isCompleted || (status && status !== "FAILED" && status !== "NOT_STARTED")) {
      return;
    }
    
    // Don't allow toggling if stage is locked (except for failed checks which can be retried)
    if (isStageLocked(stageKey) && status !== "FAILED") {
      return;
    }

    setStages((prev) => {
      const updated = { ...prev };

      // If check is already in this stage, remove it
      if (updated[stageKey].includes(checkKey)) {
        updated[stageKey] = updated[stageKey].filter((x) => x !== checkKey);
        return updated;
      }

      // Remove from other stages first (but only if not locked)
      Object.keys(updated).forEach((st) => {
        if (st !== stageKey && !isStageLocked(st)) {
          updated[st] = updated[st].filter((v) => v !== checkKey);
        }
      });

      // Add to current stage
      updated[stageKey] = [...updated[stageKey], checkKey];
      return updated;
    });
  };

  const apiChecks = useMemo(() => {
    if (!candidateVerification?.stages) return [];
    const collected = [];
    for (const [stage, arr] of Object.entries(candidateVerification.stages)) {
      if (!Array.isArray(arr)) continue;
      arr.forEach((c) =>
        collected.push({
          key: c.check,
          stage,
          status: c.status,
          remarks: c.remarks,
          submittedAt: c.submittedAt,
        })
      );
    }
    return collected;
  }, [candidateVerification]);

  const getAvailableChecksForStage = (stage) => {
    const all = [...servicesOffered];

    const primarySel = stages.primary;
    const secondarySel = stages.secondary;
    const finalSel = stages.final;

    // PRIMARY VIEW RULE:
    if (stage === "primary") {
      if (isStageLocked("primary")) {
        // Stage initiated → ONLY selected primary should show
        return primarySel;
      }
      // Not initiated → show all
      return all;
    }

    // SECONDARY VIEW RULE:
    if (stage === "secondary") {
      if (isStageLocked("secondary")) {
        // Stage initiated → only selected secondary
        return secondarySel;
      }

      // Not initiated → show remaining after primary + selected secondary
      const remaining = all.filter((c) => !primarySel.includes(c));
      return [...new Set([...secondarySel, ...remaining])];
    }

    // FINAL VIEW RULE:
    if (stage === "final") {
      if (isStageLocked("final")) {
        // Stage initiated → only final selected
        return finalSel;
      }

      // Not initiated → show remaining after primary & secondary + final selected
      const remaining = all.filter(
        (c) => !primarySel.includes(c) && !secondarySel.includes(c)
      );
      return [...new Set([...finalSel, ...remaining])];
    }

    return all;
  };

  const goNext = () => {
    const next = Math.min(currentStep + 1, 2);
    const nextStage = stepNames[next].toLowerCase();
    const currentStageName = stepNames[currentStep];
    
    // Start stage transition animation directly (no popup confirmation)
    setStageTransition({
      isTransitioning: true,
      fromStage: currentStageName,
      toStage: stepNames[next],
    });

    // Show animation for 2 seconds, then change stage
    setTimeout(() => {
      setCurrentStep(next);
      setVisibleStage(nextStage);
      
      // End transition after stage change
      setTimeout(() => {
        setStageTransition({
          isTransitioning: false,
          fromStage: "",
          toStage: "",
        });
      }, 500);
    }, 2000); // 2 seconds animation display
  };

  const goBack = () => {
    const prev = Math.max(currentStep - 1, 0);
    const prevStage = stepNames[prev].toLowerCase();
    const currentStageName = stepNames[currentStep];
    
    // Start stage transition animation for backward navigation
    setStageTransition({
      isTransitioning: true,
      fromStage: currentStageName,
      toStage: stepNames[prev],
    });

    // Show animation for 2 seconds, then change stage
    setTimeout(() => {
      setCurrentStep(prev);
      setVisibleStage(prevStage);
      
      // End transition after stage change
      setTimeout(() => {
        setStageTransition({
          isTransitioning: false,
          fromStage: "",
          toStage: "",
        });
      }, 500);
    }, 2000); // 2 seconds animation display
  };

  const handleInitiateStage = async (stageKey) => {
    try {
      setInitLoading(true);

      // Filter out already processed checks (completed, failed, in progress)
      const filteredChecks = stages[stageKey].filter(checkKey => {
        const status = getCheckStatus(checkKey);
        // Only include checks that haven't been processed yet
        return !status || status === "NOT_STARTED";
      });

      // Show info about filtered checks
      const totalSelected = stages[stageKey].length;
      const filteredCount = filteredChecks.length;
      const skippedCount = totalSelected - filteredCount;

      if (skippedCount > 0) {
        console.log(`Skipping ${skippedCount} already processed checks, finalizing ${filteredCount} new checks for ${stageKey} stage`);
      }

      const res = await fetch(`/api/proxy/secure/initiateStageVerification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedCandidate,
          organizationId: selectedOrg,
          stages: { [stageKey]: filteredChecks },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error format for missing required data
        if (data.detail && data.detail.missingData) {
          const missingChecks = data.detail.missingData.map(item => 
            `• ${item.check}: ${item.message}`
          ).join('\n');
          
          const errorMessage = `${data.detail.error}\n\n${missingChecks}\n\n${data.detail.action}`;
          throw new Error(errorMessage);
        }
        
        const msg = data.message || data.error || data.detail || "Failed";
        throw new Error(msg);
      }

      showModal({
        title: "Success",
        message: skippedCount > 0 
          ? `${stageKey} stage initiated with ${filteredCount} new checks.\n${skippedCount} already processed checks were skipped.`
          : `${stageKey} stage initiated with ${filteredCount} checks.`,
        type: "success",
      });

      await fetchCandidateVerification(selectedCandidate);

      /* ------------------------------------------
       ⭐ PATCH 2 — FINAL STAGE LOCK REMAINING
    -------------------------------------------*/
      if (stageKey === "final") {
        const all = [...servicesOffered];

        const remaining = all.filter(
          (c) =>
            !stages.primary.includes(c) &&
            !stages.secondary.includes(c) &&
            !stages.final.includes(c)
        );

        setStages((p) => ({
          ...p,
          final: [...p.final, ...remaining], // lock all leftover checks
        }));
      }
      /* ------------------------------------------ */

      // // MOVE TO NEXT STEP
      // if (stageKey === "primary") {
      //   setCurrentStep(1);
      //   setVisibleStage("secondary");
      // }
      // if (stageKey === "secondary") {
      //   setCurrentStep(2);
      //   setVisibleStage("final");
      // }
    } catch (err) {
      showModal({
        title: "Error",
        message: err.message,
        type: "error",
      });
    } finally {
      setInitLoading(false);
    }
  };

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

      if (!res.ok) {
        // Handle specific error format for failed checks
        if (data.overallStatus === "FAILED" && data.failedChecks) {
          const failedList = data.failedChecks.join(", ");
          throw new Error(`${data.message || "Stage failed"}\nFailed checks: ${failedList}`);
        }
        const msg = data.message || data.error || data.detail || "Failed";
        throw new Error(msg);
      }

      setLastRunStage(stageKey);

      if (data.status === "COMPLETED") {
        showModal({
          title: "Completed",
          message: `${stageKey} completed.`,
          type: "success",
        });
      } else if (data.overallStatus === "FAILED" && data.failedChecks) {
        // Handle successful response but with failed checks
        const failedList = data.failedChecks.join(", ");
        showModal({
          title: "Stage Completed with Failures",
          message: `${data.message || "Stage completed"}\nFailed checks: ${failedList}`,
          type: "error",
        });
      }

      await fetchCandidateVerification(selectedCandidate);
    } catch (err) {
      showModal({
        title: "Error",
        message: err.message,
        type: "error",
      });
    } finally {
      setRunLoading(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      setReinitLoading(true);

      const failed = [];
      for (const [stage, arr] of Object.entries(candidateVerification.stages)) {
        if (!Array.isArray(arr)) continue;
        arr.forEach((c) => {
          if (c.status === "FAILED") failed.push({ stage, check: c.check });
        });
      }

      const retryResults = [];
      
      for (const f of failed) {
        try {
          const res = await fetch(`/api/proxy/secure/retryCheck`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              verificationId: candidateVerification._id,
              stage: f.stage,
              check: f.check,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            // Handle specific retry error format
            if (data.status === "FAILED" && data.remarks) {
              let errorMessage = `${f.check}: ${data.remarks.message || "Failed"}`;
              if (data.remarks.errors) {
                const errorDetails = Object.entries(data.remarks.errors)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(", ");
                errorMessage += `\nErrors: ${errorDetails}`;
              }
              retryResults.push({ check: f.check, success: false, error: errorMessage });
            } else {
              retryResults.push({ 
                check: f.check, 
                success: false, 
                error: data.message || data.error || "Retry failed" 
              });
            }
          } else {
            retryResults.push({ check: f.check, success: true });
          }
        } catch (error) {
          retryResults.push({ check: f.check, success: false, error: error.message });
        }
      }

      await fetchCandidateVerification(selectedCandidate);

      // Show results summary
      const successCount = retryResults.filter(r => r.success).length;
      const failedResults = retryResults.filter(r => !r.success);
      
      if (failedResults.length === 0) {
        showModal({
          title: "Retried",
          message: "All failed checks have been retried.",
          type: "success",
        });
      } else {
        const failedMessages = failedResults.map(r => r.error).join("\n\n");
        showModal({
          title: "Retry Results",
          message: `${successCount} checks retried successfully.\n\nFailed retries:\n${failedMessages}`,
          type: "error",
        });
      }
    } catch (err) {
      showModal({
        title: "Error",
        message: err.message,
        type: "error",
      });
    } finally {
      setReinitLoading(false);
    }
  };

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

      if (!res.ok) {
        const msg = data.message || data.error || data.detail || "Failed";
        throw new Error(msg);
      }

      await fetchCandidateVerification(selectedCandidate);

      if (data.status === "FAILED") {
        showModal({
          title: "Failed",
          message: `${check} failed.`,
          type: "error",
        });
      }

      if (data.status === "COMPLETED") {
        showModal({
          title: "Completed",
          message: `${check} completed successfully.`,
          type: "success",
        });
      }
    } catch (err) {
      showModal({
        title: "Error",
        message: err.message,
        type: "error",
      });
    } finally {
      setStartLoading((p) => ({ ...p, [check]: false }));
    }
  };

  const allCompleted =
    isStageCompleted("primary") &&
    isStageCompleted("secondary") &&
    isStageCompleted("final");

  /* -------------------------------------------------- */
  /* RETURN UI */
  /* -------------------------------------------------- */

  function SearchableDropdown({
    label,
    value,
    onChange,
    options,
    disabled,
    loading,
  }) {
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

        {/* Input Box - Enhanced with Loading */}
        <div
          className={`
          border-2 rounded-xl px-4 py-3 bg-white 
          flex justify-between items-center cursor-pointer
          transition-all duration-200 shadow-sm
          ${
            disabled || loading
              ? "bg-gray-100 cursor-not-allowed border-gray-300"
              : "hover:border-[#ff004f] hover:shadow-md border-gray-300"
          }
        `}
          onClick={() => !disabled && !loading && setOpen(!open)}
        >
          <span
            className={`text-sm font-medium truncate ${
              value ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {loading
              ? "Loading..."
              : options.find((o) => o.value === value)?.label || "Select..."}
          </span>
          {loading ? (
            <Loader2
              size={20}
              className="text-gray-600 animate-spin flex-shrink-0 ml-2"
            />
          ) : (
            <ChevronDown
              size={20}
              className={`text-gray-600 flex-shrink-0 ml-2 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          )}
        </div>

        {/* DROPDOWN - Enhanced */}
        {open && !disabled && !loading && (
          <div className="absolute z-[100] mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-3">
            {/* Search input */}
            <input
              type="text"
              placeholder="🔍 Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none transition"
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
                  className="px-4 py-3 text-sm text-gray-900 rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-[#ff004f] transition-all duration-150 font-medium"
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

    // NEW: Enhanced check locking logic for better UX
    const lockedInfo = getLockedChecksInfo();
    
    // Check if this check was part of the original stage selection (finalized checks)
    const wasOriginallySelectedInStage = finalizedChecks[stageKey]?.includes(key);
    
    // Check if current stage has been initiated (has any processed checks)
    const currentStageInitiated = candidateVerification?.stages?.[stageKey]?.length > 0;
    
    // A check is locked if:
    // 1. Current stage is initiated AND check is not failed (failed checks can be retried)
    // 2. OR it's been processed in any other stage (except failed ones which can be retried)
    const isLockedInCurrentStage = currentStageInitiated && status !== "FAILED";
    const isProcessedInOtherStage = lockedInfo.lockedChecks.includes(key) && !finalizedChecks[stageKey]?.includes(key);
    
    const isCheckLocked = isLockedInCurrentStage || (isProcessedInOtherStage && status !== "FAILED");

    // NEW: Check which stages this check has been initiated in
    const initiatedStages = [];
    ["primary", "secondary", "final"].forEach(stage => {
      const arr = candidateVerification?.stages?.[stage];
      if (Array.isArray(arr) && arr.some(c => c.check === key)) {
        initiatedStages.push(stage);
      }
    });

    // Consistent color coding based on individual check verification status
    const cardGradient = status === "COMPLETED"
      ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg"
      : status === "FAILED"
      ? "border-red-400 bg-gradient-to-br from-red-50 to-pink-50 shadow-lg"
      : status === "IN_PROGRESS" || isCheckLocked
      ? "border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg"
      : selected
      ? "border-[#ff004f] bg-gradient-to-br from-red-50 to-pink-50 shadow-lg"
      : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-lg";

    return (
      <motion.div
        key={key}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`rounded-2xl p-4 sm:p-6 shadow-md border-2 ${cardGradient} transition-all duration-200 transform hover:scale-105 relative group`}
      >
        {/* NEW: Card Info Icons */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          {/* Locked Check Indicator */}
          {isCheckLocked && (
            <div className="relative">
              <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform">
                <span className="text-white text-sm">🔒</span>
              </div>
              
              {/* Locked Check Tooltip */}
              <div className="absolute top-8 right-0 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500 delay-700 pointer-events-none z-30 shadow-2xl min-w-[200px] max-w-[280px]">
                <div className="font-bold mb-1 text-gray-300 text-xs">🔒 Locked</div>
                <div className="space-y-1 text-gray-200 text-xs">
                  <div>
                    {currentStageInitiated 
                      ? `${stageKey.charAt(0).toUpperCase() + stageKey.slice(1)} stage initiated`
                      : isProcessedInOtherStage 
                      ? "Processed in other stage"
                      : "Already processed"
                    }
                  </div>
                  <div className="border-t border-gray-700 pt-1 mt-1">
                    <div>• Cannot select in this stage</div>
                    <div>• {status === "FAILED" ? "Can retry" : "Use next stage"}</div>
                  </div>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          )}

          {/* General Info Icon for all cards */}
          {!isCheckLocked && (
            <div className="relative">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform">
                <Info size={12} className="text-white" />
              </div>
              
              {/* General Info Tooltip */}
              <div className="absolute top-8 right-0 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-500 delay-700 pointer-events-none z-30 shadow-2xl min-w-[180px] max-w-[250px]">
                <div className="font-bold mb-1 text-blue-400 text-xs">ℹ️ Info</div>
                <div className="space-y-1 text-gray-200 text-xs">
                  <div>Status: {status || "Not Started"}</div>
                  <div>Type: {type.toUpperCase()}</div>
                  <div className="border-t border-gray-700 pt-1 mt-1">
                    <div>• {completed ? "Completed" : selected ? "Selected" : "Available"}</div>
                    <div>• {status === "FAILED" ? "Can retry" : "Execute after finalize"}</div>
                  </div>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          )}
        </div>

        {/* NEW: Stage Initiation Indicator */}
        {initiatedStages.length > 0 && !isCheckLocked && (
          <div className="absolute top-3 right-3 z-10">
            <div className="relative">
              <div className="w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                <Info size={16} className="text-white" />
              </div>
              
              {/* Enhanced Tooltip on hover */}
              <div className="absolute top-9 right-0 bg-gray-900 text-white text-xs rounded-xl px-4 py-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 shadow-2xl min-w-[200px]">
                <div className="font-bold mb-2 text-green-400">✨ Initiated Stages</div>
                <div className="space-y-1">
                  {initiatedStages.map(stage => {
                    const stageStatus = getStageInitiationStatus(stage);
                    const statusIcon = stageStatus === "completed" ? "✅" : 
                                     stageStatus === "has_failures" ? "❌" : 
                                     stageStatus === "in_progress" ? "⏳" : "🔄";
                    const statusText = stageStatus === "completed" ? "Completed" : 
                                      stageStatus === "has_failures" ? "Has Failures" : 
                                      stageStatus === "in_progress" ? "In Progress" : "Initiated";
                    return (
                      <div key={stage} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span>{statusIcon}</span>
                          <span className="capitalize font-medium">{stage}</span>
                        </div>
                        <span className="text-xs text-gray-300">{statusText}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Enhanced Tooltip arrow */}
                <div className="absolute -top-2 right-4 w-3 h-3 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          </div>
        )}

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
                  Manual verification check
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

        {/* NEW: Stage Status Info Bar */}
        {initiatedStages.length > 0 && (
          <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-blue-900">🎯 Active in:</span>
              <div className="flex gap-1 flex-wrap">
                {initiatedStages.map(stage => {
                  const stageStatus = getStageInitiationStatus(stage);
                  const statusColor = stageStatus === "completed" ? "bg-green-500 text-white" : 
                                     stageStatus === "has_failures" ? "bg-red-500 text-white" : 
                                     stageStatus === "in_progress" ? "bg-orange-500 text-white" : "bg-blue-500 text-white";
                  const statusIcon = stageStatus === "completed" ? "✓" : 
                                    stageStatus === "has_failures" ? "✗" : 
                                    stageStatus === "in_progress" ? "⏳" : "●";
                  return (
                    <span key={stage} className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor} shadow-sm`}>
                      {statusIcon} {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 my-3" />

        {/* MANUAL VERIFICATION INFO */}
        {status === "PENDING" && (
          <div className="mb-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                <AlertCircle size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  ⏳ Maihoo needs to approve this check
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  This verification requires manual review and approval
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ENHANCED CHECKBOX */}
        <div className="flex items-center gap-3 mb-3">
          {(() => {
            const isInProgress = status === "IN_PROGRESS";
            const isFailed = status === "FAILED";
            const isDisabled = isCheckLocked && !isFailed;
            
            return (
              <>
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={isDisabled}
                  onChange={() => handleStageToggle(key, stageKey)}
                  className={`w-5 h-5 accent-[#ff004f] ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                />
                <span className={`text-sm font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-700'}`}>
                  {completed
                    ? "✓ Already Verified"
                    : isInProgress
                    ? "⏳ In Progress"
                    : isFailed
                    ? "🔄 Can Retry (Failed)"
                    : isCheckLocked
                    ? "🔒 Check Locked"
                    : "Add to Current Stage"}
                </span>
              </>
            );
          })()}
        </div>

        {/* LOCKED CHECK INFO */}
        {isCheckLocked && status !== "FAILED" && (
          <div className="mb-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-300 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🔒</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-700">
                  {currentStageInitiated ? `${stageKey.charAt(0).toUpperCase() + stageKey.slice(1)} Stage Locked` : 'Check Locked in Other Stage'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {currentStageInitiated 
                    ? `${stageKey.charAt(0).toUpperCase() + stageKey.slice(1)} stage is initiated. All checks are locked in this stage. Use next stages for remaining checks.`
                    : "This check is processed in another stage. Select from remaining available checks for this stage."
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MANUAL VERIFY BUTTON */}
        {type === "manual" && wasOriginallySelectedInStage && currentStageInitiated && !completed && (
          <button
            onClick={() => openManualVerify(key, stageKey)}
            className="mt-2 w-full px-4 py-3 text-sm bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FileCheck size={16} />
            Verify Manually Here
          </button>
        )}

        {/* AI CHECK REDIRECT BUTTON - Only show after finalization */}
        {type === "ai" && wasOriginallySelectedInStage && currentStageInitiated && !completed && (
          <button
            onClick={() => {
              setNavigating(true);
              setTimeout(() => {
                if (key === "ai_cv_validation") {
                  router.push("/superadmin/AI-CV-Verification");
                } else if (key === "ai_education_validation") {
                  router.push("/superadmin/AI-Edu-Verification");
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

  function openManualVerify(check, stage) {
    setManualModal({
      open: true,
      check,
      stage,
      remarks: "",
      status: "COMPLETED",
      loading: false,
    });
  }
  async function handleManualSubmit() {
    try {
      setManualModal((m) => ({ ...m, loading: true }));

      const res = await fetch(`/api/proxy/secure/updateInternalVerification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: candidateVerification._id,
          stage: manualModal.stage,
          checkName: manualModal.check,
          status: manualModal.status,
          remarks: manualModal.remarks,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed");

      showModal({
        title: "Manual Verification Updated",
        message: `${manualModal.check} marked as ${manualModal.status}`,
        type: "success",
      });

      setManualModal({ ...manualModal, open: false });

      await fetchCandidateVerification(selectedCandidate);
    } catch (err) {
      showModal({
        title: "Error",
        message: err.message,
        type: "error",
      });
    } finally {
      setManualModal((m) => ({ ...m, loading: false }));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 p-4 sm:p-6 lg:p-8">
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

      {/* Stage Transition Animation Overlay */}
      {stageTransition.isTransitioning && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-md mx-4"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-[#ff004f]/20 border-t-[#ff004f] rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ChevronRight className="text-[#ff004f]" size={24} />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Stage Transition
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-gray-100 rounded-full font-medium">
                    {stageTransition.fromStage}
                  </span>
                  <ChevronRight size={16} className="text-[#ff004f]" />
                  <span className="px-3 py-1 bg-[#ff004f] text-white rounded-full font-medium">
                    {stageTransition.toStage}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Moving to {stageTransition.toStage} verification stage...
                </p>
              </div>
            </motion.div>
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
                    Enterprise verification management across all organizations
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
                  onClick={() => {
                    if (!selectedOrg) {
                      return showModal({
                        title: "Select Organization",
                        message:
                          "Please select an organization before adding a candidate.",
                        type: "error",
                      });
                    }
                    setShowAddModal(true);
                  }}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  Choose organization and candidate to begin verification
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 relative">
              {/* ORG */}
              <div>
                <SearchableDropdown
                  label="Organization"
                  options={organizations.map((o) => ({
                    label: o.organizationName,
                    value: o._id,
                  }))}
                  value={selectedOrg}
                  loading={orgLoading}
                  onChange={(v) => {
                    setSelectedOrg(v);
                    setCandidates([]);
                    setSelectedCandidate("");
                    if (v) fetchCandidates(v);
                  }}
                />
              </div>

              {/* CANDIDATE */}
              <div>
                <SearchableDropdown
                  label="Candidate"
                  disabled={!selectedOrg}
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

        {/* SERVICE CARDS - SHOW WHEN ORGANIZATION IS SELECTED */}
        {selectedOrg &&
          orgDetails &&
          orgDetails.services &&
          orgDetails.services.length > 0 && (
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
                    Services offered by {orgDetails.organizationName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orgDetails.services.map((service, idx) => (
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

        {/* CONSENT STATUS BOX - ENHANCED */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 p-6 rounded-2xl shadow-lg mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <FileCheck size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Candidate Consent Status
              </h3>
              <p className="text-sm text-gray-600">
                Required before initiating verification
              </p>
            </div>
          </div>

          {checkingConsent ? (
            <p className="text-gray-600">Checking consent status...</p>
          ) : consentStatus ? (
            <>
              <p className="text-sm">
                Status:{" "}
                <span className="font-semibold">
                  {consentStatus.consentStatus || "Unknown"}
                </span>
              </p>

              {consentStatus.consentStatus === "CONSENT_GIVEN" ? (
                <p className="mt-2 text-green-600 font-medium">
                  ✔ Candidate has provided consent. You can initiate
                  verification.
                </p>
              ) : consentStatus.consentStatus === "CONSENT_DENIED" ? (
                <p className="mt-2 text-red-600 font-medium">
                  ✖ Candidate denied consent.
                </p>
              ) : consentStatus.consentStatus === "PENDING_CONSENT" ? (
                <p className="mt-2 text-yellow-600 font-medium">
                  ⏳ Waiting for candidate to respond.
                </p>
              ) : consentStatus.consentStatus === "TOKEN_EXPIRED" ? (
                <p className="mt-2 text-red-600 font-medium">
                  Token expired. You must resend the consent email.
                </p>
              ) : null}

              {/* UPDATED RESEND CONDITIONS */}
              {(consentStatus.consentStatus === "NOT_REQUESTED" ||
                consentStatus.consentStatus === "PENDING_CONSENT" ||
                consentStatus.consentStatus === "TOKEN_EXPIRED" ||
                consentStatus.consentStatus === "CONSENT_DENIED") && (
                <button
                  onClick={async () => {
                    await sendConsentEmail();
                    // Immediately update UI → remove button and show "Waiting"
                    fetchConsentStatus(selectedCandidate);
                  }}
                  disabled={sendingConsent}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
                >
                  {sendingConsent ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      {consentStatus.consentStatus === "NOT_REQUESTED"
                        ? "Send Consent Email"
                        : "Resend Consent Email"}
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={sendConsentEmail}
              disabled={sendingConsent}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
            >
              {sendingConsent ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <PlusCircle size={16} /> Send Consent Email
                </>
              )}
            </button>
          )}
        </div>

        {/* MAIN GRID */}
        <div className="bg-white border p-4 sm:p-6 rounded-xl shadow grid xl:grid-cols-3 gap-4 xl:gap-6">
          {/* LEFT PANEL */}
          <div className="space-y-6">
            {/* Enhanced Stage Info */}
            <div className="bg-gradient-to-br from-[#ff004f]/5 via-purple-50 to-indigo-50 p-4 sm:p-6 rounded-2xl border-2 border-[#ff004f]/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">{currentStep + 1}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {stepNames[currentStep]} Stage
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isStageCompleted(stepNames[currentStep].toLowerCase()) 
                        ? 'bg-green-500' 
                        : candidateVerification?.stages?.[stepNames[currentStep].toLowerCase()]?.length > 0
                        ? 'bg-orange-500'
                        : 'bg-gray-400'
                    }`}></div>
                    <span className="text-xs font-medium text-gray-600">
                      {isStageCompleted(stepNames[currentStep].toLowerCase()) 
                        ? 'Completed' 
                        : candidateVerification?.stages?.[stepNames[currentStep].toLowerCase()]?.length > 0
                        ? 'In Progress'
                        : 'Not Started'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-white/60 p-3 rounded-lg">
                {currentStep === 0 &&
                  "🎯 Choose initial verification checks for primary stage validation."}
                {currentStep === 1 &&
                  "🔄 Select from remaining checks not used in Primary stage."}
                {currentStep === 2 && "🏁 Final stage with all remaining verification checks."}
              </p>
            </div>

            {/* Enhanced Selected Checks - Current Stage Only */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 rounded-2xl border-2 border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <CheckCircle size={16} className="text-white" />
                </div>
                <div className="text-sm font-bold text-blue-900">
                  {stepNames[currentStep]} Stage Checks
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">
                    {(() => {
                      const currentStageKey = stepNames[currentStep].toLowerCase();
                      const finalizedInCurrentStage = finalizedChecks[currentStageKey] || [];
                      return finalizedInCurrentStage.length;
                    })()} Finalized
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {(() => {
                  const currentStageKey = stepNames[currentStep].toLowerCase();
                  const finalizedInCurrentStage = finalizedChecks[currentStageKey] || [];
                  
                  return finalizedInCurrentStage.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {finalizedInCurrentStage.map((check, i) => (
                        <span
                          key={i}
                          className="px-3 py-2 bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-900 rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 border border-blue-300"
                        >
                          ✓ {check.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Circle size={20} className="text-gray-400" />
                      </div>
                      <span className="text-gray-500 text-sm font-medium">No checks finalized in {stepNames[currentStep].toLowerCase()} stage yet</span>
                      <p className="text-xs text-gray-400 mt-1">Select and finalize verification checks for this stage</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Enhanced Navigation */}
            <div className="flex gap-3">
              <button
                disabled={currentStep === 0}
                onClick={goBack}
                className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 disabled:from-gray-100 disabled:to-gray-200 text-gray-700 disabled:text-gray-400 px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg disabled:shadow-sm transition-all duration-200 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} /> Back
              </button>

              <button
                disabled={currentStep === 2}
                onClick={goNext}
                className="flex-1 bg-gradient-to-r from-[#ff004f] to-purple-600 hover:from-purple-600 hover:to-[#ff004f] disabled:from-gray-400 disabled:to-gray-500 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg disabled:shadow-sm transition-all duration-200 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>

            {/* Stage Action Buttons */}
            <div className="space-y-3">
              {/* ENHANCED PRIMARY BUTTONS */}
              {currentStep === 0 && (
                <>
                  <button
                    disabled={initLoading}
                    onClick={() => {
                      if (!candidateHasConsented) {
                        setShowConsentWarning({ open: true, stage: "primary" });
                      } else {
                        handleInitiateStage("primary");
                      }
                    }}
                    className="group relative w-full py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl hover:shadow-2xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {initLoading ? (
                      <>
                        <Loader2 className="animate-spin relative z-10" size={20} />
                        <span className="relative z-10 text-lg">Finalizing Checks...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative z-10">
                          <CheckCircle size={20} />
                        </div>
                        <div className="text-center relative z-10">
                          <div className="text-base font-semibold">🎯 Finalize Primary Checks</div>
                          {(() => {
                            const counts = getNewChecksCount("primary");
                            return counts.processed > 0 ? (
                              <div className="text-sm text-green-200 font-medium">
                                {counts.new} new • {counts.processed} processed
                              </div>
                            ) : (
                              <div className="text-sm text-green-200 font-medium">
                                {counts.new} checks selected for validation
                              </div>
                            );
                          })()}
                        </div>
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
                    className="group relative w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-500 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl hover:shadow-2xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {runLoading ? (
                      <>
                        <Loader2 className="animate-spin relative z-10" size={20} />
                        <span className="relative z-10 text-lg">Executing Verification...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative z-10">
                          <Shield size={20} />
                        </div>
                        <span className="relative z-10 text-base">⚡ Execute Primary Verification</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {/* ENHANCED SECONDARY BUTTONS */}
              {currentStep === 1 && (
                <>
                  <button
                    disabled={initLoading}
                    onClick={() => handleInitiateStage("secondary")}
                    className="group relative w-full py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl hover:shadow-2xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {initLoading ? (
                      <>
                        <Loader2 className="animate-spin relative z-10" size={20} />
                        <span className="relative z-10 text-lg">Finalizing Checks...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative z-10">
                          <CheckCircle size={20} />
                        </div>
                        <div className="text-center relative z-10">
                          <div className="text-base font-semibold">🔄 Finalize Secondary Checks</div>
                          {(() => {
                            const counts = getNewChecksCount("secondary");
                            return counts.processed > 0 ? (
                              <div className="text-sm text-green-200 font-medium">
                                {counts.new} new • {counts.processed} processed
                              </div>
                            ) : (
                              <div className="text-sm text-green-200 font-medium">
                                {counts.new} checks selected for validation
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </button>

                  <button
                    disabled={
                      isStageCompleted("secondary") ||
                      runLoading ||
                      !candidateVerification
                    }
                    onClick={() => handleRunStage("secondary")}
                    className="group relative w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-500 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl hover:shadow-2xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {runLoading ? (
                      <>
                        <Loader2 className="animate-spin relative z-10" size={20} />
                        <span className="relative z-10 text-lg">Executing Verification...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative z-10">
                          <Shield size={20} />
                        </div>
                        <span className="relative z-10 text-base">⚡ Execute Secondary Verification</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {/* ENHANCED FINAL BUTTONS */}
              {currentStep === 2 && (
                <>
                  <button
                    disabled={initLoading}
                    onClick={() => handleInitiateStage("final")}
                    className="group relative w-full py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl hover:shadow-2xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {initLoading ? (
                      <>
                        <Loader2 className="animate-spin relative z-10" size={20} />
                        <span className="relative z-10 text-lg">Finalizing Checks...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative z-10">
                          <CheckCircle size={20} />
                        </div>
                        <div className="text-center relative z-10">
                          <div className="text-base font-semibold">🏁 Finalize Final Checks</div>
                          {(() => {
                            const counts = getNewChecksCount("final");
                            return counts.processed > 0 ? (
                              <div className="text-sm text-green-200 font-medium">
                                {counts.new} new • {counts.processed} processed
                              </div>
                            ) : (
                              <div className="text-sm text-green-200 font-medium">
                                {counts.new} checks selected for validation
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </button>

                  <button
                    disabled={
                      isStageCompleted("final") ||
                      runLoading ||
                      !candidateVerification
                    }
                    onClick={() => handleRunStage("final")}
                    className="group relative w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-500 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl hover:shadow-2xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {runLoading ? (
                      <>
                        <Loader2 className="animate-spin relative z-10" size={20} />
                        <span className="relative z-10 text-lg">Executing Verification...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative z-10">
                          <Shield size={20} />
                        </div>
                        <span className="relative z-10 text-base">⚡ Execute Final Verification</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {/* ENHANCED STAGE-SPECIFIC RETRY FAILED CHECKS */}
              {stageHasFailedChecks(stepNames[currentStep].toLowerCase()) && (
                <button
                  disabled={reinitLoading}
                  onClick={handleRetryFailed}
                  className="group relative w-full py-4 bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 hover:from-orange-700 hover:via-red-700 hover:to-orange-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl hover:shadow-2xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {reinitLoading ? (
                    <>
                      <Loader2 className="animate-spin relative z-10" size={20} />
                      <span className="relative z-10 text-base">Retrying Failed Checks...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative z-10">
                        <RotateCcw size={20} />
                      </div>
                      <div className="text-center relative z-10">
                        <div className="text-base font-semibold">🔄 Retry {stepNames[currentStep]} Failed Checks</div>
                        <div className="text-sm text-orange-200 font-medium">
                          Re-execute failed verifications in this stage
                        </div>
                      </div>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT PANEL — CARDS */}
          <div className="xl:col-span-2">
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

            {/* STAGE INITIATED INFO BANNER */}
            {(() => {
              const currentStageInitiated = candidateVerification?.stages?.[visibleStage]?.length > 0;
              const stageName = visibleStage.charAt(0).toUpperCase() + visibleStage.slice(1);
              
              return currentStageInitiated && (
                <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-200 rounded-2xl shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl text-white">🔒</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                        🎯 {stageName} Stage Already Initiated
                      </h3>
                      <div className="space-y-2 text-sm text-amber-800">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>
                            <strong>{stageName} stage checks</strong> are now locked and cannot be modified in this stage
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>
                            <strong>Remaining available checks</strong> can be used in next stages if available
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>
                            You can <strong>retry failed checks</strong> or <strong>execute remaining verifications</strong>
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white/70 rounded-lg border border-amber-200">
                        <p className="text-xs text-amber-700 font-medium">
                          💡 <strong>Tip:</strong> Navigate to Secondary or Final stages to use the remaining available checks for verification.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* FINAL STAGE INFO MESSAGE */}
            {currentStep === 2 && !isStageCompleted("final") && (
              <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-200 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-2xl text-white">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                      🎯 Final Stage - Important Guidelines
                    </h3>
                    <div className="space-y-2 text-sm text-amber-800">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>
                          <strong>Select all remaining checks</strong> that haven't been processed in previous stages
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>
                          <strong>Once finalized</strong>, this stage will be locked and no further changes can be made
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          <strong>Failed checks</strong> can still be retried even after stage is locked
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-white/70 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-700 font-medium">
                        💡 <strong>Tip:</strong> Review all your check selections carefully before finalizing, as this is your last opportunity to make changes to the verification workflow.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOCKED CHECKS INFO BANNER */}
            {(() => {
              const lockedInfo = getLockedChecksInfo();
              return lockedInfo.hasLockedStages && !isStageCompleted(visibleStage) && (
                <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl text-white">🔒</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                        📋 Locked Checks Information
                      </h3>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>
                            <strong>{lockedInfo.totalLocked} checks</strong> are already locked in previous stages: <strong>{lockedInfo.lockedStages.join(", ")}</strong>
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>
                            <strong>Remaining checks</strong> are still available for selection in this and future stages
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">•</span>
                          <span>
                            <strong>Locked checks cannot be modified</strong> but failed ones can still be retried
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white/70 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700 font-medium">
                          💡 <strong>Tip:</strong> You can only select from the remaining unlocked checks. Locked checks will appear dimmed and cannot be modified.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* AI CV VALIDATION SECTION */}
            {candidateVerification?.aiCvValidation && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">AI CV Validation</h3>
                      <p className="text-sm text-gray-600">AI-powered resume authenticity verification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${
                        candidateVerification.aiCvValidation.status === "COMPLETED"
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : candidateVerification.aiCvValidation.status === "FAILED"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : candidateVerification.aiCvValidation.status === "IN_PROGRESS"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                          : "bg-gray-100 text-gray-800 border border-gray-300"
                      }`}
                    >
                      {candidateVerification.aiCvValidation.status === "COMPLETED" && "✓ "}
                      {candidateVerification.aiCvValidation.status === "FAILED" && "✗ "}
                      {candidateVerification.aiCvValidation.status === "IN_PROGRESS" && "⏳ "}
                      {candidateVerification.aiCvValidation.status}
                    </span>
                    {candidateVerification.aiCvValidation.status === "COMPLETED" && (
                      <button
                        onClick={() => {
                          setNavigating(true);
                          setTimeout(() => {
                            router.push("/superadmin/AI-CV-Verification");
                          }, 500);
                        }}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                      >
                        <ExternalLink size={16} />
                        View Report
                      </button>
                    )}
                  </div>
                </div>
                
                {candidateVerification.aiCvValidation.status === "COMPLETED" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="text-sm text-gray-600">Authenticity Score</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {candidateVerification.aiCvValidation.authenticity_score}/100
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="text-sm text-gray-600">Recommendation</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {candidateVerification.aiCvValidation.recommendation}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="text-sm text-gray-600">Candidate Type</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {candidateVerification.aiCvValidation.candidateType?.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                )}

                {candidateVerification.aiCvValidation.status === "NOT_STARTED" && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      AI CV validation has not been started yet. Use the AI CV Verification page to begin the process.
                    </p>
                  </div>
                )}

                {candidateVerification.aiCvValidation.finalRemarks && (
                  <div className="mt-4 p-4 bg-white border border-purple-200 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Final Remarks</div>
                    <div className="text-gray-900">{candidateVerification.aiCvValidation.finalRemarks}</div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Stage Title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 p-4 sm:p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-2xl border-2 border-gray-200 shadow-lg gap-4 sm:gap-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  {currentStep === 0 && <FileCheck size={24} className="text-white" />}
                  {currentStep === 1 && <FileSearch size={24} className="text-white" />}
                  {currentStep === 2 && <Shield size={24} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {stepNames[currentStep]} Verification
                  </h2>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#ff004f] rounded-full animate-pulse"></span>
                    Select verification checks and execute validation process
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-gray-500 mb-1">Current Stage</div>
                <div className="px-4 py-2 bg-gradient-to-r from-[#ff004f] to-purple-600 text-white rounded-xl font-bold text-sm shadow-md">
                  {stepNames[currentStep]}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Step {currentStep + 1} of 3
                </div>
              </div>
            </div>
            {/* Stage Completed Message */}
            {/* SHOW MESSAGE IF STAGE COMPLETED */}
            {isStageCompleted(visibleStage) && (
              <div className="p-6 bg-blue-50 border border-blue-300 rounded-xl text-center mb-6">
                <h3 className="text-xl font-bold text-blue-700">
                  {visibleStage.charAt(0).toUpperCase() + visibleStage.slice(1)}{" "}
                  Stage Completed
                </h3>
                <p className="text-blue-700 mt-2">
                  All checks in this stage are completed.
                </p>
              </div>
            )}

            {/* ONLY SHOW CARDS IF NOT COMPLETED */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    <AnimatePresence mode="popLayout">
                      {API_SERVICES.filter(
                        (s) => servicesOffered.includes(s)
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    <AnimatePresence mode="popLayout">
                      {MANUAL_SERVICES.filter(
                        (s) => servicesOffered.includes(s.id)
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    <AnimatePresence mode="popLayout">
                      {AI_SERVICES.filter(
                        (s) => servicesOffered.includes(s.id)
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
                  onClick={() => setShowAddModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Personal Information Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-200">
                  <User className="text-blue-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">
                    Personal Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* FIRST NAME */}
                  <div>
                    <input
                      name="firstName"
                      value={newCandidate.firstName}
                      onChange={handleInputChange}
                      placeholder="First Name *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        fieldErrors.firstName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>

                  {/* MIDDLE NAME */}
                  <input
                    name="middleName"
                    value={newCandidate.middleName}
                    onChange={handleInputChange}
                    placeholder="Middle Name"
                    className="border-2 border-gray-300 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />

                  {/* LAST NAME */}
                  <div>
                    <input
                      name="lastName"
                      value={newCandidate.lastName}
                      onChange={handleInputChange}
                      placeholder="Last Name *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        fieldErrors.lastName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>

                  {/* FATHER NAME */}
                  <div>
                    <input
                      name="fatherName"
                      value={newCandidate.fatherName}
                      onChange={handleInputChange}
                      placeholder="Father Name *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        fieldErrors.fatherName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.fatherName && (
                      <p className="text-red-500 text-xs mt-1">
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
                      onChange={handleInputChange}
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        fieldErrors.dob ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.dob && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.dob}
                      </p>
                    )}
                  </div>

                  {/* GENDER */}
                  <div>
                    <select
                      name="gender"
                      value={newCandidate.gender}
                      onChange={handleInputChange}
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        fieldErrors.gender
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Gender *</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {fieldErrors.gender && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.gender}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-green-200">
                  <Mail className="text-green-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">
                    Contact Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PHONE */}
                  <div>
                    <input
                      name="phone"
                      value={newCandidate.phone}
                      onChange={handleInputChange}
                      placeholder="Phone *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition ${
                        fieldErrors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* EMAIL */}
                  <div>
                    <input
                      name="email"
                      value={newCandidate.email}
                      onChange={handleInputChange}
                      placeholder="Email *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition ${
                        fieldErrors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-purple-200">
                  <FileText className="text-purple-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">Documents</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* AADHAAR */}
                  <div>
                    <input
                      name="aadhaarNumber"
                      value={newCandidate.aadhaarNumber}
                      onChange={handleInputChange}
                      placeholder="Aadhaar Number *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition ${
                        fieldErrors.aadhaarNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.aadhaarNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.aadhaarNumber}
                      </p>
                    )}
                  </div>

                  {/* PAN */}
                  <div>
                    <input
                      name="panNumber"
                      value={newCandidate.panNumber}
                      onChange={handleInputChange}
                      placeholder="PAN Number *"
                      className={`border-2 p-3 rounded-lg w-full uppercase text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition ${
                        fieldErrors.panNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.panNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.panNumber}
                      </p>
                    )}
                  </div>

                  {/* UAN */}
                  <input
                    name="uanNumber"
                    value={newCandidate.uanNumber}
                    onChange={handleInputChange}
                    placeholder="UAN Number (optional)"
                    className="border-2 border-gray-300 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />

                  {/* PASSPORT */}
                  <input
                    name="passportNumber"
                    value={newCandidate.passportNumber}
                    onChange={handleInputChange}
                    placeholder="Passport Number (optional)"
                    className="border-2 border-gray-300 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />

                  {/* BANK ACCOUNT */}
                  <div className="sm:col-span-2">
                    <input
                      name="bankAccountNumber"
                      value={newCandidate.bankAccountNumber}
                      onChange={handleInputChange}
                      placeholder="Bank Account Number (optional)"
                      className="border-2 border-gray-300 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
                  <MapPin className="text-orange-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">Address</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* DISTRICT */}
                  <div>
                    <input
                      name="district"
                      value={newCandidate.district}
                      onChange={handleInputChange}
                      placeholder="District *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                        fieldErrors.district
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.district && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.district}
                      </p>
                    )}
                  </div>

                  {/* STATE */}
                  <div>
                    <input
                      name="state"
                      value={newCandidate.state}
                      onChange={handleInputChange}
                      placeholder="State *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                        fieldErrors.state ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.state && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.state}
                      </p>
                    )}
                  </div>

                  {/* PINCODE */}
                  <div>
                    <input
                      name="pincode"
                      value={newCandidate.pincode}
                      onChange={handleInputChange}
                      placeholder="Pincode *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                        fieldErrors.pincode
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.pincode && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.pincode}
                      </p>
                    )}
                  </div>
                </div>

                {/* ADDRESS */}
                <div className="mt-4">
                  <textarea
                    name="address"
                    value={newCandidate.address}
                    onChange={handleInputChange}
                    placeholder="Full Address *"
                    className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                      fieldErrors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    rows={3}
                  />
                  {fieldErrors.address && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Resume Upload */}
              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  Resume (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setNewCandidate((p) => ({
                      ...p,
                      resume: e.target.files[0],
                    }))
                  }
                  className="border-2 border-gray-300 p-2 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none transition"
                />
                {newCandidate.resume && (
                  <p className="text-sm text-gray-700 mt-2">
                    Selected: <strong>{newCandidate.resume.name}</strong>
                  </p>
                )}
              </div>

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
                      value={newCandidate.supervisory1_name || ''}
                      onChange={handleInputChange}
                      placeholder="Supervisor Name"
                      className="border p-2 rounded w-full"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory1_phone"
                        value={newCandidate.supervisory1_phone || ''}
                        onChange={handleInputChange}
                        placeholder="Phone Number"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory1_email"
                        value={newCandidate.supervisory1_email || ''}
                        onChange={handleInputChange}
                        placeholder="Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory1_relationship"
                        value={newCandidate.supervisory1_relationship || ''}
                        onChange={handleInputChange}
                        placeholder="Relationship (e.g., Former Manager)"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory1_company"
                        value={newCandidate.supervisory1_company || ''}
                        onChange={handleInputChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory1_designation"
                        value={newCandidate.supervisory1_designation || ''}
                        onChange={handleInputChange}
                        placeholder="Designation"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory1_workingPeriod"
                        value={newCandidate.supervisory1_workingPeriod || ''}
                        onChange={handleInputChange}
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
                      onChange={handleInputChange}
                      placeholder="Supervisor Name"
                      className="border p-2 rounded w-full"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory2_phone"
                        value={newCandidate.supervisory2_phone || ''}
                        onChange={handleInputChange}
                        placeholder="Phone Number"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory2_email"
                        value={newCandidate.supervisory2_email || ''}
                        onChange={handleInputChange}
                        placeholder="Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory2_relationship"
                        value={newCandidate.supervisory2_relationship || ''}
                        onChange={handleInputChange}
                        placeholder="Relationship (e.g., Former Team Lead)"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory2_company"
                        value={newCandidate.supervisory2_company || ''}
                        onChange={handleInputChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory2_designation"
                        value={newCandidate.supervisory2_designation || ''}
                        onChange={handleInputChange}
                        placeholder="Designation"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory2_workingPeriod"
                        value={newCandidate.supervisory2_workingPeriod || ''}
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment1_designation"
                        value={newCandidate.employment1_designation || ''}
                        onChange={handleInputChange}
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
                          onChange={handleInputChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Relieving Date</label>
                        <input
                          type="date"
                          name="employment1_relievingDate"
                          value={newCandidate.employment1_relievingDate || ''}
                          onChange={handleInputChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        name="employment1_hrName"
                        value={newCandidate.employment1_hrName || ''}
                        onChange={handleInputChange}
                        placeholder="HR Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment1_hrContact"
                        value={newCandidate.employment1_hrContact || ''}
                        onChange={handleInputChange}
                        placeholder="HR Contact"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment1_hrEmail"
                        value={newCandidate.employment1_hrEmail || ''}
                        onChange={handleInputChange}
                        placeholder="HR Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <textarea
                      name="employment1_address"
                      value={newCandidate.employment1_address || ''}
                      onChange={handleInputChange}
                      placeholder="Company Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Relieving Letter (PDF)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleInputChange(e, true, 'relievingLetter1')}
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
                          onChange={(e) => handleInputChange(e, true, 'experienceLetter1')}
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
                          onChange={(e) => handleInputChange(e, true, 'salarySlips1')}
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
                        onChange={handleInputChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment2_designation"
                        value={newCandidate.employment2_designation || ''}
                        onChange={handleInputChange}
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
                          onChange={handleInputChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Relieving Date</label>
                        <input
                          type="date"
                          name="employment2_relievingDate"
                          value={newCandidate.employment2_relievingDate || ''}
                          onChange={handleInputChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        name="employment2_hrName"
                        value={newCandidate.employment2_hrName || ''}
                        onChange={handleInputChange}
                        placeholder="HR Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment2_hrContact"
                        value={newCandidate.employment2_hrContact || ''}
                        onChange={handleInputChange}
                        placeholder="HR Contact"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment2_hrEmail"
                        value={newCandidate.employment2_hrEmail || ''}
                        onChange={handleInputChange}
                        placeholder="HR Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <textarea
                      name="employment2_address"
                      value={newCandidate.employment2_address || ''}
                      onChange={handleInputChange}
                      placeholder="Company Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Relieving Letter (PDF)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleInputChange(e, true, 'relievingLetter2')}
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
                          onChange={(e) => handleInputChange(e, true, 'experienceLetter2')}
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
                          onChange={(e) => handleInputChange(e, true, 'salarySlips2')}
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
                          onChange={(e) => handleInputChange(e, true, 'educationCertificate')}
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
                          onChange={(e) => handleInputChange(e, true, 'marksheet')}
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
                        onChange={handleInputChange}
                        placeholder="Degree (e.g., Bachelor of Technology)"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_specialization"
                        value={newCandidate.education_specialization || ''}
                        onChange={handleInputChange}
                        placeholder="Specialization"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="education_universityName"
                        value={newCandidate.education_universityName || ''}
                        onChange={handleInputChange}
                        placeholder="University Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_collegeName"
                        value={newCandidate.education_collegeName || ''}
                        onChange={handleInputChange}
                        placeholder="College Name"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="education_yearOfPassing"
                        value={newCandidate.education_yearOfPassing || ''}
                        onChange={handleInputChange}
                        placeholder="Year of Passing"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_cgpa"
                        value={newCandidate.education_cgpa || ''}
                        onChange={handleInputChange}
                        placeholder="CGPA/Percentage"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        name="education_universityContact"
                        value={newCandidate.education_universityContact || ''}
                        onChange={handleInputChange}
                        placeholder="University Contact"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_universityEmail"
                        value={newCandidate.education_universityEmail || ''}
                        onChange={handleInputChange}
                        placeholder="University Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_collegeContact"
                        value={newCandidate.education_collegeContact || ''}
                        onChange={handleInputChange}
                        placeholder="College Contact"
                        className="border p-2 rounded"
                      />
                    </div>
                    <input
                      name="education_collegeEmail"
                      value={newCandidate.education_collegeEmail || ''}
                      onChange={handleInputChange}
                      placeholder="College Email"
                      type="email"
                      className="border p-2 rounded w-full"
                    />
                    <textarea
                      name="education_universityAddress"
                      value={newCandidate.education_universityAddress || ''}
                      onChange={handleInputChange}
                      placeholder="University Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                    <textarea
                      name="education_collegeAddress"
                      value={newCandidate.education_collegeAddress || ''}
                      onChange={handleInputChange}
                      placeholder="College Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Actions */}
            <div className="border-t-2 border-gray-200 p-6 bg-gray-50 flex-shrink-0 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmClose(true)}
                className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCandidate}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Add Candidate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold">Discard Changes?</h3>
            <p className="text-sm text-gray-600 mt-2">
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
                  setExpandedSections({
                    supervisory1: false,
                    supervisory2: false,
                    employment1: false,
                    employment2: false,
                    education: false,
                  });
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Yes, Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED MODAL */}
      <AnimatePresence>
        {modal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 ${
                modal.type === "success"
                  ? "border-green-300"
                  : modal.type === "error"
                  ? "border-red-300"
                  : "border-blue-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-full ${
                    modal.type === "success"
                      ? "bg-green-100"
                      : modal.type === "error"
                      ? "bg-red-100"
                      : "bg-blue-100"
                  }`}
                >
                  {modal.type === "error" && (
                    <XCircle className="text-red-600" size={32} />
                  )}
                  {modal.type === "success" && (
                    <CheckCircle className="text-green-600" size={32} />
                  )}
                  {modal.type === "info" && (
                    <AlertCircle className="text-blue-600" size={32} />
                  )}
                </div>

                <div className="flex-1">
                  <h3
                    className={`text-xl font-bold mb-2 ${
                      modal.type === "success"
                        ? "text-green-700"
                        : modal.type === "error"
                        ? "text-red-700"
                        : "text-blue-700"
                    }`}
                  >
                    {modal.title}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {modal.message}
                  </p>

                  <button
                    onClick={closeModal}
                    className={`mt-4 w-full py-2 rounded-lg text-white font-medium transition ${
                      modal.type === "success"
                        ? "bg-green-600 hover:bg-green-700"
                        : modal.type === "error"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {showConsentWarning.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-red-600">
              Candidate Consent Not Provided
            </h3>

            <p className="text-sm text-gray-700 mt-2">
              The candidate has not yet provided consent for verification. Are
              you sure you want to continue and initiate this stage?
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() =>
                  setShowConsentWarning({ open: false, stage: null })
                }
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  handleInitiateStage(showConsentWarning.stage);
                  setShowConsentWarning({ open: false, stage: null });
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {manualModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-3 capitalize">
              Manual Verification — {manualModal.check.replace(/_/g, " ")}
            </h3>

            {/* Status */}
            <label className="block text-sm font-medium text-gray-700 mt-2">
              Status
            </label>
            <select
              value={manualModal.status}
              onChange={(e) =>
                setManualModal((m) => ({ ...m, status: e.target.value }))
              }
              className="border rounded-md p-2 w-full"
            >
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>

            {/* Remarks */}
            <label className="block text-sm font-medium text-gray-700 mt-4">
              Remarks
            </label>
            <textarea
              value={manualModal.remarks}
              onChange={(e) =>
                setManualModal((m) => ({ ...m, remarks: e.target.value }))
              }
              className="border rounded-md p-2 w-full mt-1"
              rows={4}
              placeholder="Add manual verification notes..."
            />

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setManualModal({ ...manualModal, open: false })}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>

              <button
                disabled={manualModal.loading}
                onClick={handleManualSubmit}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                {manualModal.loading ? (
                  <Loader2 size={16} className="animate-spin inline" />
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
