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
  const handleInputChange = (e, isFile = false) => {
    if (isFile) {
      setNewCandidate((prev) => ({ ...prev, resume: e.target.files[0] }));
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

    setNewCandidate((prev) => ({ ...prev, [name]: value }));
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
    return getStageStatus(steps[idx - 1]) === "COMPLETED";
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
              onClick={() => setShowAddModal(true)}
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
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="grid md:grid-cols-4 gap-6">
            {/* LEFT PANEL */}
            <div className="space-y-4 md:sticky md:top-4 mb-6 md:mb-0">
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
                    .every((s) => getStageStatus(s) === "COMPLETED");

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
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm mt-6 max-h-[260px] overflow-auto">
                <div className="text-xs font-bold text-blue-900 mb-2">
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

              {/* RESPONSIVE CARD GRID - Enhanced */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
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
                      className={`border-2 rounded-2xl p-5 transition-all duration-200 min-h-[180px] transform hover:scale-105 ${cardGradient}`}
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

              {/* FORM GRID */}
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

                {/* UAN */}
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

                {/* PASSPORT */}
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

                {/* BANK ACCOUNT */}
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
              {/* RESUME UPLOAD */}
              <div className="mt-4">
                <label className="text-sm font-medium">
                  Resume (PDF/DOC/DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setNewCandidate((prev) => ({
                      ...prev,
                      resume: e.target.files[0],
                    }))
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
                  onClick={() => setModal({ open: true, type: "confirmClose" })}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
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

                    setSubmitting(true);

                    try {
                      const formData = new FormData();

                      formData.append("organizationId", bgvUser.organizationId);
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
                      formData.append("address", newCandidate.address);
                      formData.append("district", newCandidate.district);
                      formData.append("state", newCandidate.state);
                      formData.append("pincode", newCandidate.pincode);

                      // OPTIONAL resume
                      if (newCandidate.resume) {
                        formData.append("resume", newCandidate.resume);
                      }

                      const res = await fetch(
                        `/api/proxy/secure/addCandidate`,
                        {
                          method: "POST",
                          credentials: "include",
                          body: formData,
                        }
                      );

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
                        setNewCandidate(emptyCandidate);

                        await fetchCandidates(bgvUser.organizationId);
                      }
                    } finally {
                      setSubmitting(false);
                    }
                  }}
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
