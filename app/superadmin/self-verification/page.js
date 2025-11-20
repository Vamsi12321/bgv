"use client";

import { useEffect, useState } from "react";
import {
  PlusCircle,
  Loader2,
  X,
  RefreshCcw,
  CheckCircle,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function SelfVerificationPage() {
  /* ---------------------------------------------- */
  /* DYNAMIC CHECK DEFINITIONS FROM ORG SERVICES    */
  /* ---------------------------------------------- */
  const getCheckConfig = (serviceKey) => {
    const checkConfigs = {
      aadhaar: { title: "Aadhaar Verification", icon: "🪪" },
      pan: { title: "PAN Verification", icon: "💳" },
      bankaccount: { title: "Bank Account Verification", icon: "🏦" },
      bankAccount: { title: "Bank Account Verification", icon: "🏦" }, // Handle both cases
      uan: { title: "UAN Verification", icon: "🧾" },
      fir: { title: "FIR / Criminal Check", icon: "🛡️" },
      passport: { title: "Passport Verification", icon: "🛂" },
      education: { title: "Education Verification", icon: "🎓" },
      employment: { title: "Employment Verification", icon: "💼" },
      cibil: { title: "CIBIL Credit Check", icon: "📊" },
    };

    // Normalize key to handle case sensitivity
    const normalizedKey = serviceKey.toLowerCase();
    const exactMatch = checkConfigs[serviceKey];
    const normalizedMatch = checkConfigs[normalizedKey];

    return (
      exactMatch ||
      normalizedMatch || {
        title: `${serviceKey} Verification`,
        icon: "📋",
      }
    );
  };

  const steps = ["primary", "secondary", "final"];

  /* ---------------------------------------------- */
  /* STATE                                           */
  /* ---------------------------------------------- */
  const [organizations, setOrganizations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [orgServices, setOrgServices] = useState([]);
  const [availableChecks, setAvailableChecks] = useState([]);
  const [candidateVerification, setCandidateVerification] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const emptyCandidate = {
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    aadhaarNumber: "",
    panNumber: "",
    email: "",
    address: "",
  };

  const [newCandidate, setNewCandidate] = useState(emptyCandidate);
  const [stages, setStages] = useState({
    primary: [],
    secondary: [],
    final: [],
  });

  /* ---------------------------------------------- */
  /* MODAL                                           */
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
    setModal((p) => ({
      ...p,
      open: false,
    }));

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
  /* FETCH CANDIDATES + ORG SERVICES                 */
  /* ---------------------------------------------- */
  const handleOrgSelect = (orgId) => {
    setSelectedOrg(orgId);
    setSelectedCandidate("");
    setCandidateVerification(null);

    // Reset stage selections
    setStages({
      primary: [],
      secondary: [],
      final: [],
    });

    setCurrentStep(0);

    if (orgId) {
      const selected = organizations.find((o) => o._id === orgId);

      if (selected?.services?.length) {
        // Get unique service names and create dynamic checks
        const serviceNames = selected.services
          .filter((s) => s.serviceName && s.serviceName.trim() !== "")
          .map((s) => s.serviceName);

        setOrgServices(serviceNames);

        // Create dynamic checks from org services
        const dynamicChecks = serviceNames.map((serviceName) => ({
          key: serviceName,
          ...getCheckConfig(serviceName),
        }));

        setAvailableChecks(dynamicChecks);
      } else {
        setOrgServices([]);
        setAvailableChecks([]);
      }

      fetchCandidates(orgId);
    } else {
      setOrgServices([]);
      setAvailableChecks([]);
    }
  };

  const fetchCandidates = async (orgId) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/secure/getCandidates?orgId=${orgId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) setCandidates(data.candidates || []);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------- */
  /* REFRESH VERIFICATION (AFTER INITIATION)         */
  /* ---------------------------------------------- */
  const refreshVerification = async (candidateId) => {
    if (!candidateId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/secure/getVerifications?candidateId=${candidateId}`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (res.ok && data.verifications?.length > 0) {
        const v = data.verifications[0];
        setCandidateVerification(v);

        const idx = steps.indexOf(v.currentStage);
        setCurrentStep(idx);

        // Load selected checks from backend
        const newStages = { primary: [], secondary: [], final: [] };

        steps.forEach((stage) => {
          if (Array.isArray(v.stages?.[stage])) {
            newStages[stage] = v.stages[stage].map((c) => c.check);
          }
        });

        setStages(newStages);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------- */
  /* STAGE STATUS LOGIC                               */
  /* ---------------------------------------------- */
  const getStageStatus = (stageKey) => {
    const data = candidateVerification?.stages?.[stageKey];

    if (!Array.isArray(data) || data.length === 0) return "PENDING";
    if (data.every((c) => c.status === "COMPLETED")) return "COMPLETED";
    if (data.some((c) => c.status === "IN_PROGRESS")) return "IN_PROGRESS";
    if (data.some((c) => c.status === "FAILED")) return "FAILED";

    return "PENDING";
  };

  const isStageInitiated = (stage) => {
    const s = getStageStatus(stage);
    return s === "COMPLETED" || s === "IN_PROGRESS";
  };

  const isStageLocked = (stage) => isStageInitiated(stage);

  const isPrevStageCompleted = (stage) => {
    const idx = steps.indexOf(stage);
    if (idx === 0) return true;
    return getStageStatus(steps[idx - 1]) === "COMPLETED";
  };

  const canNavigateToStage = (stageIndex) => {
    if (stageIndex === 0) return true;

    for (let i = 0; i < stageIndex; i++) {
      if (getStageStatus(steps[i]) !== "COMPLETED") {
        return false;
      }
    }
    return true;
  };

  /* ---------------------------------------------- */
  /* VISIBLE CHECKS (ORG SERVICES ONLY)              */
  /* ---------------------------------------------- */
  const visibleCheckCards = () => {
    const stageKey = steps[currentStep];

    // If stage already initiated → ONLY show those checks
    if (isStageInitiated(stageKey)) {
      return availableChecks.filter((c) => stages[stageKey].includes(c.key));
    }

    // Before initiation: show available checks MINUS checks used in earlier stages
    const usedInPreviousStages = [
      ...stages.primary,
      ...stages.secondary,
      ...stages.final,
    ];

    return availableChecks.filter((c) => !usedInPreviousStages.includes(c.key));
  };

  /* ---------------------------------------------- */
  /* TOGGLE CHECK SELECTION                          */
  /* ---------------------------------------------- */
  const handleToggle = (checkKey) => {
    const stageKey = steps[currentStep];

    if (isStageLocked(stageKey)) return;
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
  /* INITIATE STAGE                                  */
  /* ---------------------------------------------- */
  const initiateStage = async (stageKey) => {
    if (!selectedOrg || !selectedCandidate) {
      alert("Select organization and candidate first.");
      return;
    }

    if (!isPrevStageCompleted(stageKey)) {
      alert("Previous stage must be completed first.");
      return;
    }

    const selectedChecks = stages[stageKey];

    if (!selectedChecks.length) {
      alert("Select at least one check.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        candidateId: selectedCandidate,
        organizationId: selectedOrg,
        stage: stageKey,
        checks: selectedChecks,
      };

      const res = await fetch(`${API_BASE}/secure/initiateStage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`${stageKey} stage initiated! Email sent.`);
        await refreshVerification(selectedCandidate);
      } else {
        alert(data.message || "Failed to initiate stage.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------- */
  /* ADD CANDIDATE HELPERS                           */
  /* ---------------------------------------------- */
  const candidateExists = (firstName, lastName, phone) => {
    return candidates.some(
      (c) =>
        c.firstName?.trim().toLowerCase() === firstName.trim().toLowerCase() &&
        c.lastName?.trim().toLowerCase() === lastName.trim().toLowerCase() &&
        c.phone === phone
    );
  };

  const validateAadhaar = (v) => /^\d{12}$/.test(v);
  const validatePAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);
  const validatePhone = (v) => /^\d{10}$/.test(v);

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    if (name === "panNumber")
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (name === "aadhaarNumber") value = value.replace(/\D/g, "");
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);

    setNewCandidate((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCandidate = async () => {
    const { firstName, lastName, phone, aadhaarNumber, panNumber } =
      newCandidate;

    if (!selectedOrg)
      return showModal({
        title: "Missing Organization",
        message: "Select an organization before adding a candidate.",
        type: "error",
      });

    if (!firstName || !lastName || !phone)
      return showModal({
        title: "Missing Fields",
        message: "First name, last name & phone are required.",
        type: "error",
      });

    if (candidateExists(firstName, lastName, phone))
      return showModal({
        title: "Duplicate Candidate",
        message: "This candidate already exists for this organization.",
        type: "error",
      });

    if (aadhaarNumber && !validateAadhaar(aadhaarNumber))
      return showModal({
        title: "Invalid Aadhaar",
        message: "Aadhaar must be exactly 12 digits.",
        type: "error",
      });

    if (panNumber && !validatePAN(panNumber))
      return showModal({
        title: "Invalid PAN",
        message: "PAN must follow format ABCDE1234F.",
        type: "error",
      });

    if (!validatePhone(phone))
      return showModal({
        title: "Invalid Phone",
        message: "Phone number must be 10 digits.",
        type: "error",
      });

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

      if (!res.ok) throw new Error(data.message || "Failed to add candidate.");

      showModal({
        title: "Success",
        message: "Candidate added successfully.",
        type: "success",
      });

      setShowAddModal(false);

      // Refresh candidates list
      await fetchCandidates(selectedOrg);

      // Auto-select the newly added candidate
      if (data.candidate?._id) {
        setSelectedCandidate(data.candidate._id);
        // Refresh verification status after a short delay
        setTimeout(() => {
          refreshVerification(data.candidate._id);
        }, 1000);
      }

      setNewCandidate(emptyCandidate);
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

  /* ---------------------------------------------- */
  /* STAGE TABLE COMPONENT                            */
  /* ---------------------------------------------- */
  const StageTable = ({ title, stageKey }) => {
    const data = candidateVerification?.stages?.[stageKey] || [];
    const stageStatus = getStageStatus(stageKey);

    // Helper to get check title
    const getCheckTitle = (checkKey) => {
      const check = availableChecks.find((c) => c.key === checkKey);
      return check?.title || checkKey;
    };

    return (
      <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">
            {title} — {stageStatus}
          </h3>
          <span
            className={`px-2 py-1 text-xs rounded-md font-medium ${
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

        <table className="w-full border-collapse">
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
                  <td className="border p-2">{getCheckTitle(item.check)}</td>
                  <td className="border p-2">{item.status}</td>
                  <td className="border p-2">{item.remarks || "—"}</td>
                  <td className="border p-2">
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
  /* STAGE HEADER COMPONENT                          */
  /* ---------------------------------------------- */
  const StageHeader = ({ stageKey, index, isActive, onClick }) => {
    const status = getStageStatus(stageKey);
    const canNavigate = canNavigateToStage(index);

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
              : canNavigate
              ? "bg-gray-400 text-white"
              : "bg-gray-300 text-gray-600"
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

  /* ---------------------------------------------- */
  /* UI START                                         */
  /* ---------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Self Verification — Services Offered
            </h1>
            <p className="mt-1 text-gray-600">
              Select checks offered by your organization and initiate
              verification.
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
              onClick={() => setShowAddModal(true)}
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

        {/* ORG + CANDIDATE SELECTION */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Select Organization</label>
              <select
                value={selectedOrg}
                onChange={(e) => handleOrgSelect(e.target.value)}
                className="border rounded-md w-full p-2 mt-1"
              >
                <option value="">-- Select --</option>
                {organizations.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.organizationName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Select Candidate</label>
              <select
                value={selectedCandidate}
                onChange={(e) => {
                  setSelectedCandidate(e.target.value);
                  refreshVerification(e.target.value);
                }}
                disabled={!selectedOrg}
                className="border rounded-md w-full p-2 mt-1"
              >
                <option value="">-- Select --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
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

        {/* CHECK SELECTION PANEL */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="grid md:grid-cols-4 gap-6">
            {/* LEFT PANEL - STAGE HEADERS */}
            <div className="space-y-4">
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

              {/* Selected Checks Summary */}
              <div className="bg-gray-50 p-4 rounded-lg border mt-6">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Selected Checks
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {stages[steps[currentStep]].length ? (
                    stages[steps[currentStep]].map((checkKey) => {
                      const check = availableChecks.find(
                        (c) => c.key === checkKey
                      );
                      return (
                        <div key={checkKey} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{check?.title || checkKey}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-400">No checks selected</div>
                  )}
                </div>
              </div>

              {/* INITIATE BUTTON */}
              <button
                onClick={() => initiateStage(steps[currentStep])}
                disabled={
                  submitting ||
                  isStageLocked(steps[currentStep]) ||
                  !isPrevStageCompleted(steps[currentStep]) ||
                  !stages[steps[currentStep]].length
                }
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium mt-4
                  ${
                    isStageLocked(steps[currentStep])
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isStageLocked(steps[currentStep])
                  ? "Stage Initiated"
                  : `Initiate ${steps[currentStep]} Stage`}
              </button>
            </div>

            {/* RIGHT PANEL - CHECK CARDS */}
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {steps[currentStep].toUpperCase()} Stage - Available Checks
                </h3>
                <div className="text-sm text-gray-500">
                  {visibleCheckCards().length} checks available
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleCheckCards().length === 0 ? (
                  <div className="col-span-3 text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-2">📋</div>
                    <div className="font-medium">
                      No verification services available
                    </div>
                    <div className="text-sm mt-1">
                      {isStageInitiated(steps[currentStep])
                        ? "All checks for this stage have been initiated"
                        : "No checks available for selection in this stage"}
                    </div>
                  </div>
                ) : (
                  visibleCheckCards().map((c) => {
                    const stageKey = steps[currentStep];
                    const selected = stages[stageKey].includes(c.key);
                    const locked = isStageLocked(stageKey);
                    const allowed = isPrevStageCompleted(stageKey);

                    return (
                      <div
                        key={c.key}
                        className={`border-2 rounded-xl p-4 transition-all duration-200 ${
                          isStageInitiated(stageKey)
                            ? "border-blue-300 bg-blue-50" // READ ONLY STAGE
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

                        {/* IF STAGE ALREADY INITIATED — SHOW READ-ONLY CARD */}
                        {isStageInitiated(stageKey) ? (
                          <div className="mt-3 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                            ✔{" "}
                            {getStageStatus(stageKey) === "COMPLETED"
                              ? "Completed"
                              : "Initiated"}
                          </div>
                        ) : (
                          /* NORMAL SELECTION UI */
                          <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={locked || !allowed}
                              onChange={() => handleToggle(c.key)}
                              className="accent-red-600 w-4 h-4"
                            />
                            <span
                              className={`text-sm ${
                                locked || !allowed
                                  ? "text-gray-400"
                                  : "text-gray-700"
                              }`}
                            >
                              {locked
                                ? "Stage initiated"
                                : !allowed
                                ? "Complete previous stage"
                                : "Select for verification"}
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STAGE TABLES */}
        {candidateVerification && (
          <>
            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">
              Verification Summary
            </h2>

            {isStageInitiated("primary") && (
              <StageTable title="Primary Stage" stageKey="primary" />
            )}

            {isStageInitiated("secondary") && (
              <StageTable title="Secondary Stage" stageKey="secondary" />
            )}

            {isStageInitiated("final") && (
              <StageTable title="Final Stage" stageKey="final" />
            )}
          </>
        )}

        {/* ADD CANDIDATE MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl border">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="firstName"
                  value={newCandidate.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  className="border p-2 rounded"
                />
                <input
                  name="middleName"
                  value={newCandidate.middleName}
                  onChange={handleInputChange}
                  placeholder="Middle Name"
                  className="border p-2 rounded"
                />
                <input
                  name="lastName"
                  value={newCandidate.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  className="border p-2 rounded"
                />
                <input
                  name="phone"
                  value={newCandidate.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  className="border p-2 rounded"
                />
                <input
                  name="aadhaarNumber"
                  value={newCandidate.aadhaarNumber}
                  onChange={handleInputChange}
                  placeholder="Aadhaar Number"
                  className="border p-2 rounded"
                />
                <input
                  name="panNumber"
                  value={newCandidate.panNumber}
                  onChange={handleInputChange}
                  placeholder="PAN Number"
                  className="border p-2 rounded uppercase"
                />
              </div>

              <input
                name="email"
                value={newCandidate.email}
                onChange={handleInputChange}
                placeholder="Email"
                className="border p-2 rounded w-full mt-3"
              />

              <textarea
                name="address"
                value={newCandidate.address}
                onChange={handleInputChange}
                placeholder="Address"
                className="border p-2 rounded w-full mt-3"
                rows={3}
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCandidate}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                >
                  {loading ? (
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
