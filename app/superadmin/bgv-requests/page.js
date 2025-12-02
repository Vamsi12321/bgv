"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function BGVInitiationPage() {
  const [organizations, setOrganizations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [candidateVerification, setCandidateVerification] = useState(null);

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [reinitLoading, setReinitLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [startLoading, setStartLoading] = useState({});
  const [orgDetails, setOrgDetails] = useState(null);

  const [visibleStage, setVisibleStage] = useState("primary");
  const [currentStep, setCurrentStep] = useState(0);
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
    "aadhaar_to_uan",
    "credit_report",
    "court_record",
  ];

  const MANUAL_CHECKS = [
    "address_verification",
    "education_check_manual",
    "supervisory_check",
    "employment_history_manual",
  ];

  const AI_CHECKS = ["resume_validation", "education_check_ai"];

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
  const handleInputChange = (e) => {
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

  const [stages, setStages] = useState({
    primary: [...DEFAULTS.primary],
    secondary: [...DEFAULTS.secondary],
    final: [...DEFAULTS.final],
  });

  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "info",
  });

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
        setLoading(true);
        const res = await fetch(`${API_BASE}/secure/getOrganizations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setOrganizations(data.organizations || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchCandidates = async (orgId) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/secure/getCandidates?orgId=${orgId}`,
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
      setLoading(false);
    }
  };
  const fetchConsentStatus = async (candidateId) => {
    try {
      setCheckingConsent(true);
      const res = await fetch(
        `${API_BASE}/secure/verification/${candidateId}/consent-status`,
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
        `${API_BASE}/secure/verification/${selectedCandidate}/send-consent`,
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
        `${API_BASE}/secure/getVerifications?candidateId=${candidateId}`,
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
    } = newCandidate;

    // REQUIRED
    if (!firstName) errors.firstName = "First name is required";
    if (!lastName) errors.lastName = "Last name is required";
    if (!fatherName) errors.fatherName = "Father name is required";
    if (!dob) errors.dob = "Date of birth is required";
    if (!gender) errors.gender = "Gender is required";
    if (!phone) errors.phone = "Phone is required";
    if (!email) errors.email = "Email is required";
    if (!aadhaarNumber) errors.aadhaarNumber = "Aadhaar number required";
    if (!panNumber) errors.panNumber = "PAN required";
    if (!address) errors.address = "Address required";
    if (!district) errors.district = "District required";
    if (!state) errors.state = "State required";
    if (!pincode) errors.pincode = "Pincode required";

    // FORMAT VALIDATIONS
    const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const validatePhone = (v) => /^\d{10}$/.test(v);
    const validateAadhaar = (v) => /^\d{12}$/.test(v);
    const validatePAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);
    const validateDOB = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);
    const validatePincode = (v) => /^\d{6}$/.test(v);
    const validatePassport = (v) => /^[A-PR-WYa-pr-wy][1-9]\d{6}$/.test(v);
    const validateUAN = (v) => /^\d{12}$/.test(v);
    const validateAccount = (v) => /^\d{6,18}$/.test(v);

    if (phone && !validatePhone(phone))
      errors.phone = "Phone must be 10 digits";
    if (email && !validateEmail(email)) errors.email = "Invalid email";
    if (aadhaarNumber && !validateAadhaar(aadhaarNumber))
      errors.aadhaarNumber = "Aadhaar must be 12 digits";
    if (panNumber && !validatePAN(panNumber))
      errors.panNumber = "Format ABCDE1234F required";
    if (dob && !validateDOB(dob)) errors.dob = "Use YYYY-MM-DD";
    if (pincode && !validatePincode(pincode))
      errors.pincode = "Must be 6 digits";
    if (passportNumber && !validatePassport(passportNumber))
      errors.passportNumber = "Invalid passport format";
    if (uanNumber && !validateUAN(uanNumber))
      errors.uanNumber = "UAN must be 12 digits";
    if (bankAccountNumber && !validateAccount(bankAccountNumber))
      errors.bankAccountNumber = "6–18 digits required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/secure/addCandidate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: selectedOrg,
          ...newCandidate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return showModal({
          title: "Error Adding Candidate",
          message: data.detail || "Server error",
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

      const res = await fetch(`${API_BASE}/secure/initiateStageVerification`, {
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

      const res = await fetch(`${API_BASE}/secure/runStage`, {
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
        const res = await fetch(`${API_BASE}/secure/retryCheck`, {
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

      const res = await fetch(`${API_BASE}/secure/startCheck`, {
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

  function SearchableDropdown({ label, value, onChange, options, disabled }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filtered = options.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );

    return (
      <div className="w-full relative">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}

        {/* Input Box */}
        <div
          className={`
          mt-1 border rounded-lg px-3 py-2 bg-white 
          flex justify-between items-center cursor-pointer
          ${
            disabled
              ? "bg-gray-100 cursor-not-allowed"
              : "hover:border-gray-400"
          }
        `}
          onClick={() => !disabled && setOpen(!open)}
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {options.find((o) => o.value === value)?.label || "Select..."}
          </span>
          <ChevronDown size={18} className="text-gray-600" />
        </div>

        {/* DROPDOWN */}
        {open && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-md p-2">
            {/* Search input */}
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border rounded-md px-2 py-1 mb-2 text-sm focus:ring-1 focus:ring-red-500 outline-none"
            />

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="p-2 text-gray-500 text-sm text-center">
                  No results
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
                  className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-red-50 hover:text-red-700"
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
        <Cpu size={20} className="text-blue-600" />
      ) : type === "MANUAL" ? (
        <FileSearch size={20} className="text-orange-600" />
      ) : (
        <Brain size={20} className="text-purple-600" />
      );

    const typeBadge =
      type === "API"
        ? "bg-blue-100 text-blue-700"
        : type === "MANUAL"
        ? "bg-orange-100 text-orange-700"
        : "bg-purple-100 text-purple-700";

    return (
      <motion.div
        key={v}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className={`rounded-xl p-5 shadow-md border-2 
      ${
        selected
          ? "border-red-500 bg-red-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }
      transition-all duration-150`}
      >
        {/* TOP ROW — ICON + BADGE + STATUS */}
        <div className="flex justify-between items-start">
          <div className="flex gap-3 items-center">
            {icon}

            <div className="text-lg font-semibold capitalize">
              {v.replace(/_/g, " ")}
            </div>
          </div>

          {/* STATUS ICON */}
          <div>
            {status === "COMPLETED" && (
              <CheckCircle className="text-green-600" size={20} />
            )}
            {status === "FAILED" && (
              <XCircle className="text-red-600" size={20} />
            )}
            {status === "IN_PROGRESS" && (
              <Loader2 className="text-yellow-500 animate-spin" size={20} />
            )}
          </div>
        </div>

        {/* TYPE BADGE */}
        <span
          className={`inline-block text-xs px-2 py-1 mt-2 rounded-md font-semibold ${typeBadge}`}
        >
          {type} Check
        </span>

        <div className="border-t my-3" />

        {/* CHECKBOX */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selected}
            disabled={completed || locked}
            onChange={() => handleStageToggle(v, stageKey)}
            className="w-5 h-5 accent-red-600"
          />
          <span className="text-sm">
            {completed
              ? "Already Verified"
              : locked
              ? "Locked"
              : "Add to Stage"}
          </span>
        </div>

        {/* MANUAL VERIFY BUTTON */}
        {type === "MANUAL" && isStageLocked(stageKey) && !completed && (
          <button
            onClick={() => openManualVerify(v, stageKey)}
            className="mt-4 w-full px-3 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
          >
            Verify Manually
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

      const res = await fetch(`${API_BASE}/secure/updateInternalVerification`, {
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
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        {/* PAGE HEADER — SAME STYLE AS ORG PAGE */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#ff004f]">
              Background Verification
            </h1>

            <p className="text-gray-700 mt-1 text-sm">
              Configure and start verification workflows for candidates.
            </p>
          </div>

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
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
            >
              <PlusCircle size={16} />
              Add Candidate
            </button>
          </div>
        </div>

        {/* STEPPER */}
        <div className="bg-white border p-4 rounded-xl shadow flex justify-between">
          {stepNames.map((name, i) => {
            const active = i === currentStep;
            const done = isStageCompleted(name.toLowerCase());
            return (
              <div key={i} className="flex items-center gap-3 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center
                  ${
                    done
                      ? "bg-green-600 text-white"
                      : active
                      ? "bg-red-600 text-white"
                      : "bg-gray-300 text-gray-700"
                  }
                `}
                >
                  {done ? <CheckCircle size={16} /> : i + 1}
                </div>
                <div>
                  <div
                    className={`font-semibold ${
                      active ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {done ? "Completed" : active ? "Active stage" : "Pending"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ORG + CANDIDATE SELECT */}
        <div className="bg-white border p-6 rounded-xl shadow space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* ORG */}
            <div>
              <SearchableDropdown
                label="Organization"
                options={organizations.map((o) => ({
                  label: o.organizationName,
                  value: o._id,
                }))}
                value={selectedOrg}
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
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-semibold mt-1">
                {candidateVerification?.overallStatus || "Not Initiated"}
              </div>
            </div>
          </div>
        </div>
        {/* CONSENT STATUS BOX */}
        {/* CONSENT STATUS BOX */}
        <div className="bg-white border p-6 rounded-xl shadow mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Candidate Consent
          </h3>

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
            <div className="bg-gray-100 p-4 rounded-md border">
              <h3 className="font-semibold text-gray-800">
                {stepNames[currentStep]} Stage
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {currentStep === 0 &&
                  "Primary: Choose initial verification checks."}
                {currentStep === 1 &&
                  "Secondary: Only checks not used in Primary show here."}
                {currentStep === 2 &&
                  "Final: Only checks not used earlier appear here."}
              </p>
            </div>

            {/* SELECTED CHECKS */}
            <div className="bg-gray-100 p-4 rounded-md border">
              <div className="text-sm text-gray-600 mb-1">Selected Checks</div>
              <div className="font-semibold text-gray-900">
                {[
                  ...new Set([
                    ...stages.primary,
                    ...stages.secondary,
                    ...stages.final,
                  ]),
                ].join(", ") || "None"}
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
                {/* API CHECKS */}
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                  <Cpu className="text-blue-600" size={20} /> API Checks
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {getAvailableChecksForStage(visibleStage)
                      .filter((c) => getCheckType(c) === "API")
                      .map(renderCheckCard)}
                  </AnimatePresence>
                </div>

                {/* MANUAL CHECKS */}
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                  <FileSearch className="text-orange-600" size={20} /> Manual
                  Checks
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {getAvailableChecksForStage(visibleStage)
                      .filter((c) => getCheckType(c) === "MANUAL")
                      .map(renderCheckCard)}
                  </AnimatePresence>
                </div>

                {/* AI CHECKS */}
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                  <Brain className="text-purple-600" size={20} /> AI Checks
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {getAvailableChecksForStage(visibleStage)
                      .filter((c) => getCheckType(c) === "AI")
                      .map(renderCheckCard)}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY TABLE */}
        {candidateVerification && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">
              {visibleStage.toUpperCase()} Stage Summary
            </h2>

            <div className="overflow-x-auto bg-white border rounded-xl shadow">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3">Check</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3">Submitted At</th>
                    <th className="p-3">Stage</th>
                  </tr>
                </thead>

                <tbody>
                  {candidateVerification.stages?.[visibleStage]?.length ? (
                    candidateVerification.stages[visibleStage].map(
                      (item, i) => (
                        <tr key={i} className="border-t hover:bg-gray-50">
                          <td className="p-3 capitalize">{item.check}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                item.status === "COMPLETED"
                                  ? "bg-green-200 text-green-800"
                                  : item.status === "FAILED"
                                  ? "bg-red-200 text-red-800"
                                  : item.status === "IN_PROGRESS"
                                  ? "bg-yellow-200 text-yellow-700"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {item.remarks &&
                            typeof item.remarks === "object" ? (
                              <div className="text-xs text-gray-700 space-y-1">
                                {Object.entries(item.remarks).map(
                                  ([key, value]) => (
                                    <div key={key}>
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
                              item.remarks || "—"
                            )}
                          </td>

                          <td className="p-3">
                            {item.submittedAt
                              ? new Date(item.submittedAt).toLocaleString()
                              : "—"}
                          </td>
                          <td className="p-3 capitalize">{visibleStage}</td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td className="p-4 text-center text-gray-500" colSpan={5}>
                        No checks in this stage.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* ADD CANDIDATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center p-4 overflow-y-auto">
          <div className="bg-white p-4 rounded-xl w-full max-w-lg shadow-xl border relative mt-10 mb-10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Add Candidate
              </h2>

              <button
                onClick={() => setShowAddModal(false)}
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
                  onChange={handleInputChange}
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
                onChange={handleInputChange}
                placeholder="Middle Name"
                className="border p-2 rounded w-full"
              />

              {/* LAST NAME */}
              <div>
                <input
                  name="lastName"
                  value={newCandidate.lastName}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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

              {/* UAN */}
              <input
                name="uanNumber"
                value={newCandidate.uanNumber}
                onChange={handleInputChange}
                placeholder="UAN Number (optional)"
                className="border p-2 rounded w-full"
              />

              {/* PASSPORT */}
              <input
                name="passportNumber"
                value={newCandidate.passportNumber}
                onChange={handleInputChange}
                placeholder="Passport Number (optional)"
                className="border p-2 rounded w-full"
              />

              {/* BANK ACCOUNT */}
              <div className="sm:col-span-2">
                <input
                  name="bankAccountNumber"
                  value={newCandidate.bankAccountNumber}
                  onChange={handleInputChange}
                  placeholder="Bank Account Number (optional)"
                  className="border p-2 rounded w-full"
                />
              </div>

              {/* DISTRICT */}
              <div>
                <input
                  name="district"
                  value={newCandidate.district}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
              onChange={handleInputChange}
              placeholder="Full Address *"
              className="border p-2 rounded w-full mt-4"
              rows={3}
            />
            {fieldErrors.address && (
              <p className="text-red-500 text-xs">{fieldErrors.address}</p>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowConfirmClose(true)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={handleAddCandidate}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Add Candidate
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

      {/* MODAL */}
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
