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

  const API_CHECKS = [
    "pan_aadhaar_seeding",
    "pan_verification",
    "employment_history",
    "verify_pan_to_uan",
    "credit_report",
    "court_record",
  ];

  const MANUAL_CHECKS = [
    "address_verification",
    "education_check_manual",
    "supervisory_check",
    "employment_history_manual",
  ];

  const AI_CHECKS = ["ai_cv_validation", "ai_education_validation"];

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
  };

  const [newCandidate, setNewCandidate] = useState(emptyCandidate);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (e, isFile = false) => {
    if (isFile) {
      setNewCandidate((p) => ({ ...p, resume: e.target.files[0] }));
      return;
    }

    let { name, value } = e.target;

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
    if (API_CHECKS.includes(checkId)) return "API";
    if (MANUAL_CHECKS.includes(checkId)) return "MANUAL";
    if (AI_CHECKS.includes(checkId)) return "AI";
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

  const isStageLocked = (stage) => {
    if (!candidateVerification?.stages) return false;
    const arr = candidateVerification.stages[stage];
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.some((c) => c.status !== "FAILED");
  };

  const candidateHasConsented =
    candidateVerification?.consentStatus === "CONSENT_GIVEN";

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

      // resume optional
      if (resume) {
        formData.append("resume", resume);
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
    } finally {
      setLoading(false);
    }
  };

  const handleStageToggle = (checkKey, stageKey) => {
    if (isStageLocked(stageKey)) return;

    setStages((prev) => {
      const updated = { ...prev };

      if (updated[stageKey].includes(checkKey)) {
        updated[stageKey] = updated[stageKey].filter((x) => x !== checkKey);
        return updated;
      }

      Object.keys(updated).forEach((st) => {
        updated[st] = updated[st].filter((v) => v !== checkKey);
      });

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
    if (currentStep === 0 && !isStageCompleted("primary")) return;
    if (currentStep === 1 && !isStageCompleted("secondary")) return;
    setCurrentStep((s) => Math.min(s + 1, 2));
    setVisibleStage(stepNames[Math.min(currentStep + 1, 2)].toLowerCase());
  };

  const goBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    setVisibleStage(stepNames[Math.max(currentStep - 1, 0)].toLowerCase());
  };

  const handleInitiateStage = async (stageKey) => {
    try {
      setInitLoading(true);

      const res = await fetch(`/api/proxy/secure/initiateStageVerification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedCandidate,
          organizationId: selectedOrg,
          stages: { [stageKey]: stages[stageKey] },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || data.error || data.detail || "Failed";
        throw new Error(msg);
      }

      showModal({
        title: "Success",
        message: `${stageKey} initiated.`,
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

      for (const f of failed) {
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
          const msg = data.message || data.error || data.detail || "Failed";
          throw new Error(msg);
        }
      }

      await fetchCandidateVerification(selectedCandidate);

      showModal({
        title: "Retried",
        message: "All failed checks have been retried.",
        type: "success",
      });
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
  function renderCheckCard(v) {
    const stageKey = visibleStage;
    const status = getCheckStatus(v);
    const selected = stages[stageKey]?.includes(v);
    const completed = isCheckCompletedAnywhere(v);
    const locked = isStageLocked(stageKey);

    const type = getCheckType(v);

    const icon =
      type === "API" ? (
        <Cpu size={24} className="text-blue-600" />
      ) : type === "MANUAL" ? (
        <FileSearch size={24} className="text-orange-600" />
      ) : (
        <Brain size={24} className="text-purple-600" />
      );

    const typeBadge =
      type === "API"
        ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300"
        : type === "MANUAL"
        ? "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300"
        : "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300";

    const cardGradient = selected
      ? "border-[#ff004f] bg-gradient-to-br from-red-50 to-pink-50 shadow-lg"
      : completed
      ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50"
      : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-lg";

    return (
      <motion.div
        key={v}
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
                {v.replace(/_/g, " ")}
              </div>
              {type === "MANUAL" && (
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
            {type === "API" && "⚡"}
            {type === "MANUAL" && "✍️"}
            {type === "AI" && "🤖"}
            {type} Check
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
            onChange={() => handleStageToggle(v, stageKey)}
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
        {type === "MANUAL" && isStageLocked(stageKey) && !completed && (
          <button
            onClick={() => openManualVerify(v, stageKey)}
            className="mt-2 w-full px-4 py-3 text-sm bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FileCheck size={16} />
            Verify Manually Here
          </button>
        )}

        {/* AI CHECK REDIRECT BUTTON - Only show after finalization */}
        {type === "AI" && !completed && isStageLocked(stageKey) && (
          <button
            onClick={() => {
              setNavigating(true);
              setTimeout(() => {
                if (v === "ai_cv_validation") {
                  router.push("/superadmin/AI-CV-Verification");
                } else if (v === "ai_education_validation") {
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
                {v === "ai_cv_validation"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
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
        <div className="bg-white border p-6 rounded-xl shadow grid md:grid-cols-3 gap-6">
          {/* LEFT PANEL */}
          <div className="space-y-6">
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

            {/* SELECTED CHECKS */}
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

            {/* NAV BUTTONS */}
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

            {/* ACTION BUTTONS */}
            <div className="space-y-3">
              {/* PRIMARY */}
              {currentStep === 0 && (
                <>
                  <button
                    disabled={
                      isStageLocked("primary") ||
                      initLoading ||
                      candidateVerification?.stages?.primary?.length > 0
                    }
                    onClick={() => {
                      if (!candidateHasConsented) {
                        setShowConsentWarning({ open: true, stage: "primary" });
                      } else {
                        handleInitiateStage("primary");
                      }
                    }}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {initLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Initiating Primary...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Finalize Checks
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

              {/* SECONDARY */}
              {currentStep === 1 && (
                <>
                  <button
                    disabled={
                      !isStageCompleted("primary") ||
                      isStageLocked("secondary") ||
                      initLoading ||
                      candidateVerification?.stages?.secondary?.length > 0
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
                      runLoading
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
                      "Execute Verification"
                    )}
                  </button>
                </>
              )}

              {/* FINAL */}
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
                      "Run Final"
                    )}
                  </button>
                </>
              )}

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

          {/* RIGHT PANEL — CARDS */}
          <div className="md:col-span-2">
            {/* ALL COMPLETED MESSAGE */}
            {allCompleted && (
              <div className="p-6 bg-green-50 border border-green-300 rounded-xl text-center mb-6">
                <h3 className="text-xl font-bold text-green-700">
                  🎉 All Verifications Completed!
                </h3>
                <p className="text-green-700 mt-2">
                  All background verification checks for this candidate have
                  been successfully completed.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {stepNames[currentStep]} Verification
                </h2>
                <p className="text-sm text-gray-500">
                  Select checks and run verification for this stage.
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {getAvailableChecksForStage(visibleStage)
                        .filter((c) => getCheckType(c) === "API")
                        .map(renderCheckCard)}
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
                      {getAvailableChecksForStage(visibleStage)
                        .filter((c) => getCheckType(c) === "MANUAL")
                        .map(renderCheckCard)}
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
                      {getAvailableChecksForStage(visibleStage)
                        .filter((c) => getCheckType(c) === "AI")
                        .map(renderCheckCard)}
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
