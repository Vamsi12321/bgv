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
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function SelfVerificationPage() {
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

  const steps = ["primary", "secondary", "final"];

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

  /* ---------------------------------------------- */
  /* STATE                                           */
  /* ---------------------------------------------- */
  const [organizations, setOrganizations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [availableChecks, setAvailableChecks] = useState([]);
  const [candidateVerification, setCandidateVerification] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [stages, setStages] = useState({
    primary: [],
    secondary: [],
    final: [],
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
  };

  const [newCandidate, setNewCandidate] = useState(emptyCandidate);

  /* ---------------------------------------------- */
  /* INPUT SANITIZER                                 */
  /* ---------------------------------------------- */

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

    setNewCandidate((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = "hidden"; // lock background
    } else {
      document.body.style.overflow = "auto"; // unlock
    }
  }, [showAddModal]);

  /* ---------------------------------------------- */
  /* VALIDATE AND ADD CANDIDATE                      */
  /* ---------------------------------------------- */

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
      phone,
      email,
      aadhaarNumber,
      panNumber,
      address,
      fatherName,
      gender,
      dob,
      district,
      state,
      pincode,
      passportNumber,
      uanNumber,
      bankAccountNumber,
    } = newCandidate;

    // REQUIRED FIELDS
    if (!firstName) errors.firstName = "First name is required";
    if (!lastName) errors.lastName = "Last name is required";
    if (!fatherName) errors.fatherName = "Father name is required";
    if (!dob) errors.dob = "Date of birth is required";
    if (!gender) errors.gender = "Gender is required";
    if (!phone) errors.phone = "Phone number is required";
    if (!email) errors.email = "Email is required";
    if (!aadhaarNumber) errors.aadhaarNumber = "Aadhaar number is required";
    if (!panNumber) errors.panNumber = "PAN number is required";
    if (!address) errors.address = "Full address is required";
    if (!district) errors.district = "District is required";
    if (!state) errors.state = "State is required";
    if (!pincode) errors.pincode = "Pincode is required";

    // FORMAT VALIDATIONS
    if (phone && !validatePhone(phone))
      errors.phone = "Phone must be 10 digits";

    if (email && !validateEmail(email)) errors.email = "Invalid email address";

    if (aadhaarNumber && !validateAadhaar(aadhaarNumber))
      errors.aadhaarNumber = "Aadhaar must be 12 digits";

    if (panNumber && !validatePAN(panNumber))
      errors.panNumber = "Format must be ABCDE1234F";

    if (dob && !validateDOB(dob)) errors.dob = "Use YYYY-MM-DD format";

    if (pincode && !validatePincode(pincode))
      errors.pincode = "Pincode must be 6 digits";

    if (passportNumber && !validatePassport(passportNumber))
      errors.passportNumber = "Invalid passport format";

    if (uanNumber && !validateUAN(uanNumber))
      errors.uanNumber = "UAN must be 12 digits";

    if (bankAccountNumber && !validateAccount(bankAccountNumber))
      errors.bankAccountNumber = "Account must be 6–18 digits";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    // API ADD CALL
    try {
      const res = await fetch(`${API_BASE}/secure/addCandidate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: selectedOrg, ...newCandidate }),
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

      // 🔥 FIX: Reset candidate selection + verification data
      setSelectedCandidate("");
      setCandidateVerification(null);

      // Reset UI stages
      setStages({ primary: [], secondary: [], final: [] });
      setCurrentStep(0);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------- */
  /* MODAL SYSTEM                                    */
  /* ---------------------------------------------- */
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
      type: type || "info",
    });

  const closeModal = () =>
    setModal({
      open: false,
      title: "",
      message: "",
      type: "info",
    });

  /* ---------------------------------------------- */
  /* FETCH ORGANIZATIONS                             */
  /* ---------------------------------------------- */

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
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
  /* ---------------------------------------------- */
  /* FETCH SERVICES + CANDIDATES                     */
  /* ---------------------------------------------- */

  const handleOrgSelect = (orgId) => {
    setSelectedOrg(orgId);
    setSelectedCandidate("");
    setCandidateVerification(null);

    setStages({ primary: [], secondary: [], final: [] });
    setCurrentStep(0);

    if (!orgId) {
      setAvailableChecks([]);
      return;
    }

    const org = organizations.find((o) => o._id === orgId);

    if (org?.services?.length) {
      // Extract service names
      const serviceNames = org.services
        .filter((s) => s.serviceName?.trim())
        .map((s) => s.serviceName.toLowerCase());

      // 🔥 API-ONLY FILTER
      const apiChecksOnly = serviceNames.filter((svc) =>
        API_CHECKS.includes(svc)
      );

      // Convert to UI object
      const dynamicChecks = apiChecksOnly.map((key) => ({
        key,
        ...getCheckConfig(key),
        type: "API", // mark type if needed later
      }));

      setAvailableChecks(dynamicChecks);
    } else {
      setAvailableChecks([]);
    }

    fetchCandidates(orgId);
  };

  const fetchCandidates = async (orgId) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/secure/getCandidates?orgId=${orgId}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok) setCandidates(data.candidates || []);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------- */
  /* REFRESH VERIFICATION                            */
  /* ---------------------------------------------- */

  const refreshVerification = async (candidateId) => {
    if (!candidateId) {
      setCandidateVerification(null);
      setStages({ primary: [], secondary: [], final: [] });
      setCurrentStep(0);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/secure/getVerifications?candidateId=${candidateId}`,
        { credentials: "include" }
      );

      const data = await res.json();

      // 🚨 NEW LOGIC — if no verifications → clear UI
      if (!res.ok || !data.verifications || data.verifications.length === 0) {
        setCandidateVerification(null);
        setStages({ primary: [], secondary: [], final: [] });
        setCurrentStep(0);
        return; // 🛑 stop processing
      }

      // existing logic for when verification exists
      const v = data.verifications[0];
      setCandidateVerification(v);

      const idx = steps.indexOf(v.currentStage);
      setCurrentStep(idx);

      const newStages = { primary: [], secondary: [], final: [] };
      steps.forEach((stage) => {
        if (Array.isArray(v.stages?.[stage])) {
          newStages[stage] = v.stages[stage].map((c) => c.check);
        }
      });

      setStages(newStages);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------- */
  /* STAGE STATUS LOGIC                              */
  /* ---------------------------------------------- */

  const getStageStatus = (stageKey) => {
    const data = candidateVerification?.stages?.[stageKey];

    if (!Array?.isArray(data) || data.length === 0) return "PENDING";
    if (data.every((c) => c.status === "COMPLETED")) return "COMPLETED";
    if (data.some((c) => c.status === "IN_PROGRESS")) return "IN_PROGRESS";
    if (data.some((c) => c.status === "FAILED")) return "FAILED";

    return "PENDING";
  };

  const isStageInitiated = (stage) => {
    const s = getStageStatus(stage);
    return s === "COMPLETED" || s === "IN_PROGRESS";
  };

  const isPrevStageCompleted = (stage) => {
    const idx = steps.indexOf(stage);
    if (idx === 0) return true;
    return getStageStatus(steps[idx - 1]) === "COMPLETED";
  };

  /* ---------------------------------------------- */
  /* CHECK VISIBILITY (MOBILE SAFE - NO SHIFTING)    */
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

    if (isStageInitiated(stageKey)) return;
    if (!isPrevStageCompleted(stageKey)) return;

    setStages((prev) => {
      const exists = prev[stageKey].includes(checkKey);
      return {
        ...prev,
        [stageKey]: exists
          ? prev[stageKey].filter((c) => c !== checkKey)
          : [...prev[stageKey], checkKey],
      };
    });
  };

  /* ---------------------------------------------- */
  /* REMOVE CHECK (CONFIRMATION)                     */
  /* ---------------------------------------------- */

  const removeCheckFromLeft = (checkKey) => {
    setModal({
      open: true,
      title: "Remove Selected Check?",
      message: `Do you want to remove '${checkKey}' from this stage?`,
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
  /* INITIATE STAGE                                  */
  /* ---------------------------------------------- */

  const initiateStage = async (stageKey) => {
    if (!selectedOrg || !selectedCandidate) {
      return showModal({
        title: "Missing Selection",
        message: "Please select an organization & candidate.",
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
      const res = await fetch(`${API_BASE}/secure/initiateStage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          candidateId: selectedCandidate,
          organizationId: selectedOrg,
          stage: stageKey,
          checks: selectedChecks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return showModal({
          title: "Failed to Initiate",
          message: data.detail || data.message || "Server error",
          type: "error",
        });
      }

      showModal({
        title: "Stage Initiated",
        message: `${stageKey.toUpperCase()} stage successfully initiated.`,
        type: "success",
      });

      await refreshVerification(selectedCandidate);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------- */
  /* STAGE TABLE (RESPONSIVE)                        */
  /* ---------------------------------------------- */

  const StageTable = ({ title, stageKey }) => {
    const data = candidateVerification?.stages?.[stageKey] || [];
    const stageStatus = getStageStatus(stageKey);

    const getCheckTitle = (key) => {
      const check = availableChecks.find((c) => c.key === key);
      return check?.title || key;
    };

    return (
      <div className="bg-white rounded-xl border shadow-sm p-5 mb-6 overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
          <h3 className="text-lg font-semibold">
            {title} — {stageStatus}
          </h3>

          <span
            className={`px-3 py-1 text-xs rounded-md font-medium ${
              stageStatus === "COMPLETED"
                ? "bg-green-100 text-green-800"
                : stageStatus === "IN_PROGRESS"
                ? "bg-yellow-100 text-yellow-800"
                : stageStatus === "FAILED"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {stageStatus}
          </span>
        </div>

        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-100 text-left text-sm">
              <th className="p-2 border">Check</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Remarks</th>
              <th className="p-2 border">Submitted At</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-3 text-center text-gray-500">
                  No checks initiated
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={idx} className="text-sm">
                  <td className="border p-2 font-medium text-gray-800">
                    {getCheckTitle(item.check)}
                  </td>

                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        item.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : item.status === "IN_PROGRESS"
                          ? "bg-yellow-100 text-yellow-700"
                          : item.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="border p-2">
                    {item.remarks ? (
                      <div className="space-y-1">
                        {Object.entries(item.remarks).map(([key, value]) => (
                          <div
                            key={key}
                            className="text-xs bg-gray-50 p-1 rounded border break-all"
                          >
                            <span className="font-semibold">{key}: </span>
                            {value === null ? "—" : String(value)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="border p-2 whitespace-nowrap">
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
    );
  };
  /* ---------------------------------------------- */
  /* STAGE HEADER (RESPONSIVE + NO SHIFT)            */
  /* ---------------------------------------------- */

  const StageHeader = ({ stageKey, index, isActive, onClick }) => {
    const status = getStageStatus(stageKey);
    const canNavigate =
      index === 0 ||
      steps.slice(0, index).every((st) => getStageStatus(st) === "COMPLETED");

    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
          isActive
            ? "bg-red-50 border-2 border-red-200"
            : canNavigate
            ? "bg-gray-50 border-2 border-gray-200 hover:bg-gray-100"
            : "bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed"
        }`}
        onClick={() => canNavigate && onClick()}
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
          {status === "COMPLETED" ? <CheckCircle size={18} /> : index + 1}
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
            {status.toLowerCase()} • {stages[stageKey]?.length || 0} checks
            selected
          </div>
        </div>

        {canNavigate && !isActive && (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </div>
    );
  };

  function SearchableDropdown({ label, value, options, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = options.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="w-full relative">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}

        {/* Trigger Box */}
        <div
          className={`mt-1 border rounded-lg px-3 py-2 bg-white flex items-center justify-between 
          ${
            disabled
              ? "bg-gray-100 cursor-not-allowed"
              : "cursor-pointer hover:border-gray-400"
          }
        `}
          onClick={() => !disabled && setOpen(!open)}
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {options.find((o) => o.value === value)?.label || "Select..."}
          </span>
          <ChevronDown className="text-gray-500" size={18} />
        </div>

        {/* Dropdown */}
        {open && !disabled && (
          <div className="absolute z-50 w-full bg-white mt-1 border rounded-lg shadow-xl p-2">
            {/* Search */}
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-red-500 outline-none mb-2"
            />

            {/* Results */}
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-gray-500 text-sm p-2 text-center">
                  No results found
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.value}
                    className="px-3 py-2 rounded-md cursor-pointer hover:bg-red-50 hover:text-red-600 text-sm"
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
  /* UI START                                        */
  /* ---------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 px-4 sm:px-6 md:px-10 py-6">
      {/* ERROR / SUCCESS / CONFIRM MODAL */}
      {modal.open && modal.type !== "confirmClose" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border">
            <h2
              className={`text-xl font-semibold mb-2 ${
                modal.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {modal.title}
            </h2>

            <p className="text-gray-700 whitespace-pre-wrap mb-4">
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
                  className="w-1/2 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveCheck}
                  className="w-1/2 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
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
                className={`mt-2 w-full py-2 rounded-lg text-white ${
                  modal.type === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#ff004f]">
              Self Verification
            </h1>
            <p className="mt-1 text-gray-600">
              Select checks and initiate verification.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              disabled={!selectedCandidate}
              onClick={() => refreshVerification(selectedCandidate)}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                selectedCandidate
                  ? "bg-gray-200 hover:bg-gray-300"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <RefreshCcw size={16} /> Refresh
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (!selectedOrg) {
                  return showModal({
                    title: "Organization Required",
                    message:
                      "Please select an organization before adding a candidate.",
                    type: "error",
                  });
                }
                setShowAddModal(true);
              }}
            >
              <PlusCircle size={16} /> Add Candidate
            </button>
          </div>
        </div>

        {/* STEPPER */}
        <div className="bg-white p-4 rounded-xl shadow border flex flex-wrap gap-4 justify-between">
          {steps.map((stageKey, idx) => {
            const active = idx === currentStep;
            const status = getStageStatus(stageKey);

            return (
              <div
                key={stageKey}
                className="flex items-center gap-3 flex-1 min-w-[150px]"
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold ${
                    status === "COMPLETED"
                      ? "bg-green-600 text-white"
                      : active
                      ? "bg-red-600 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {status === "COMPLETED" ? <CheckCircle size={18} /> : idx + 1}
                </div>

                <div>
                  <div
                    className={`font-semibold ${
                      active ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {stageKey.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500">{status}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ORG + CANDIDATE SELECT */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <SearchableDropdown
                label="Select Organization"
                value={selectedOrg}
                onChange={(v) => handleOrgSelect(v)}
                options={organizations.map((o) => ({
                  label: o.organizationName,
                  value: o._id,
                }))}
              />
            </div>

            <div>
              <SearchableDropdown
                label="Select Candidate"
                value={selectedCandidate}
                disabled={!selectedOrg}
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
              <div className="text-sm text-gray-600">Available Services</div>
              <div className="font-semibold text-gray-800 mt-1 text-sm">
                {availableChecks.length > 0
                  ? `${availableChecks.length} services`
                  : "No services"}
              </div>
            </div>
          </div>
        </div>

        {/* CHECK PANEL */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="grid md:grid-cols-4 gap-6">
            {/* LEFT PANEL */}
            <div className="space-y-4 md:sticky md:top-4 mb-6 md:mb-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Verification Stages
              </h3>

              {steps.map((stageKey, index) => (
                <StageHeader
                  key={stageKey}
                  stageKey={stageKey}
                  index={index}
                  isActive={index === currentStep}
                  onClick={() => setCurrentStep(index)}
                />
              ))}

              {/* SELECTED CHECKS */}
              <div className="bg-gray-50 p-4 rounded-lg border mt-6 max-h-[260px] overflow-auto">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Selected Checks
                </div>

                {stages[steps[currentStep]].length ? (
                  <div className="space-y-2">
                    {stages[steps[currentStep]].map((checkKey) => {
                      const check = availableChecks.find(
                        (c) => c.key === checkKey
                      );
                      return (
                        <div
                          key={checkKey}
                          className="flex items-center justify-between text-sm bg-white border rounded-md px-3 py-2"
                        >
                          <span>{check?.title || checkKey}</span>

                          <button
                            disabled={isStageInitiated(steps[currentStep])}
                            onClick={() => removeCheckFromLeft(checkKey)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    No checks selected
                  </div>
                )}
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
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {steps[currentStep].toUpperCase()} Stage - Available Checks
                </h3>
                <div className="text-sm text-gray-500">
                  {visibleCheckCards().length} checks available
                </div>
              </div>

              {/* RESPONSIVE CARD GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {visibleCheckCards().map((c) => {
                  const stageKey = steps[currentStep];
                  const selected = stages[stageKey].includes(c.key);
                  const locked = isStageInitiated(stageKey);
                  const allowed = isPrevStageCompleted(stageKey);

                  return (
                    <div
                      key={c.key}
                      className={`border-2 rounded-xl p-4 transition-all duration-200 min-h-[160px]
                        ${
                          locked
                            ? "border-blue-300 bg-blue-50"
                            : selected
                            ? "border-green-400 bg-green-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-2xl">{c.icon}</span>

                        {selected && (
                          <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full font-medium">
                            Selected
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-gray-800 mb-3">
                        {c.title}
                      </h4>

                      {locked ? (
                        <div className="mt-3 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                          ✔ {getStageStatus(stageKey)}
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!allowed}
                            onChange={() => handleToggle(c.key)}
                            className="accent-red-600 w-4 h-4"
                          />
                          <span
                            className={`text-sm ${
                              !allowed ? "text-gray-400" : "text-gray-700"
                            }`}
                          >
                            {!allowed
                              ? "Complete previous stage"
                              : "Select for verification"}
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center p-4 overflow-y-auto">
            <div className="bg-white p-4 rounded-xl w-full max-w-lg shadow-xl border relative mt-10 mb-10 max-h-[90vh] overflow-y-auto">
              {/* Confirm Close */}
              {modal.open && modal.type === "confirmClose" && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999] p-4">
                  <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border">
                    <h2 className="text-lg font-bold text-gray-800">
                      Discard Changes?
                    </h2>
                    <p className="text-gray-600 mt-2">
                      All unsaved changes will be lost.
                    </p>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setModal({ open: false })}
                        className="w-1/2 py-2 rounded bg-gray-200 text-gray-800 font-medium hover:bg-gray-300"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={() => {
                          setShowAddModal(false);
                          setModal({ open: false });
                          setNewCandidate(emptyCandidate);
                        }}
                        className="w-1/2 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700"
                      >
                        Yes, Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* HEADER */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Add Candidate
                </h2>

                <button
                  onClick={() => setModal({ open: true, type: "confirmClose" })}
                  className="text-gray-500 hover:text-black"
                >
                  <X />
                </button>
              </div>

              {/* FORM GRID — VALIDATION + MOB RESPONSIVE FIXES */}
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
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>

                {/* MIDDLE NAME */}
                <div>
                  <input
                    name="middleName"
                    value={newCandidate.middleName}
                    onChange={handleInputChange}
                    placeholder="Middle Name (optional)"
                    className="border p-2 rounded w-full"
                  />
                </div>

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
                    className={`border p-2 rounded w-full ${
                      fieldErrors.fatherName ? "border-red-500" : ""
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
                    className={`border p-2 rounded w-full ${
                      fieldErrors.dob ? "border-red-500" : ""
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
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.gender}
                    </p>
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
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.phone}
                    </p>
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
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.email}
                    </p>
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
                    className={`border p-2 rounded uppercase w-full ${
                      fieldErrors.panNumber ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.panNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.panNumber}
                    </p>
                  )}
                </div>

                {/* UAN (optional) */}
                <div>
                  <input
                    name="uanNumber"
                    value={newCandidate.uanNumber}
                    onChange={handleInputChange}
                    placeholder="UAN Number (optional)"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.uanNumber ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.uanNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.uanNumber}
                    </p>
                  )}
                </div>

                {/* PASSPORT (optional) */}
                <div>
                  <input
                    name="passportNumber"
                    value={newCandidate.passportNumber}
                    onChange={handleInputChange}
                    placeholder="Passport Number (optional)"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.passportNumber ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.passportNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.passportNumber}
                    </p>
                  )}
                </div>

                {/* BANK ACCOUNT (optional) */}
                <div className="sm:col-span-2">
                  <input
                    name="bankAccountNumber"
                    value={newCandidate.bankAccountNumber}
                    onChange={handleInputChange}
                    placeholder="Bank Account Number (optional)"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.bankAccountNumber ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.bankAccountNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.bankAccountNumber}
                    </p>
                  )}
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
                    className={`border p-2 rounded w-full ${
                      fieldErrors.state ? "border-red-500" : ""
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
                    className={`border p-2 rounded w-full ${
                      fieldErrors.pincode ? "border-red-500" : ""
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
              <textarea
                name="address"
                value={newCandidate.address}
                onChange={handleInputChange}
                placeholder="Full Address *"
                className="border p-2 rounded w-full mt-4"
                rows={3}
              />
              {fieldErrors.address && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.address}
                </p>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setModal({ open: true, type: "confirmClose" })}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddCandidate}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <PlusCircle size={16} />
                  )}
                  Add Candidate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------- */
/* END OF FILE — PART 3 / 3 COMPLETE               */
/* ---------------------------------------------- */
