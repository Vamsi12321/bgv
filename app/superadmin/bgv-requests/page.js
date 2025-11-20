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

  const [newCandidate, setNewCandidate] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    aadhaarNumber: "",
    panNumber: "",
    address: "",
    email: "",
  });

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

      // if (
      //   isStageCompleted("primary") &&
      //   isStageCompleted("secondary") &&
      //   isStageCompleted("final")
      // ) {
      //   setVisibleStage("final");
      // }
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
    setStages({
      primary: [],
      secondary: [],
      final: [],
    });

    setCurrentStep(0);
    setLastRunStage(null);
    setVisibleStage("primary");
    if (id) fetchCandidateVerification(id);
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // Auto uppercase PAN
    if (name === "panNumber") {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    }

    // Aadhaar: only digits
    if (name === "aadhaarNumber") {
      value = value.replace(/\D/g, "");
    }

    // Phone formatting (digits only, max 10)
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setNewCandidate((p) => ({ ...p, [name]: value }));
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
    try {
      if (!selectedOrg) {
        return showModal({
          title: "Missing Organization",
          message: "Please select an organization before adding a candidate.",
          type: "error",
        });
      }

      const { firstName, lastName, phone, aadhaarNumber, panNumber, email } =
        newCandidate;

      // Required fields check
      if (!firstName || !lastName || !phone) {
        return showModal({
          title: "Missing Fields",
          message: "First name, last name & phone are required.",
          type: "error",
        });
      }

      // Duplicate check
      if (candidateExists(firstName, lastName, phone)) {
        return showModal({
          title: "Duplicate",
          message: "This candidate already exists for this organization.",
          type: "error",
        });
      }

      // Aadhaar validation
      if (aadhaarNumber && !validateAadhaar(aadhaarNumber)) {
        return showModal({
          title: "Invalid Aadhaar",
          message: "Aadhaar must be exactly 12 digits.",
          type: "error",
        });
      }

      // PAN validation
      if (panNumber && !validatePAN(panNumber.toUpperCase())) {
        return showModal({
          title: "Invalid PAN",
          message: "PAN must follow format: ABCDE1234F",
          type: "error",
        });
      }

      // Phone validation
      if (!validatePhone(phone)) {
        return showModal({
          title: "Invalid Phone",
          message: "Phone number must be exactly 10 digits.",
          type: "error",
        });
      }

      setLoading(true);

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
        throw new Error(data.message || "Failed to add candidate.");
      }

      showModal({
        title: "Success",
        message: "Candidate added successfully.",
        type: "success",
      });

      setShowAddModal(false);

      // Refresh candidate list
      await fetchCandidates(selectedOrg);

      // Reset form
      setNewCandidate({
        firstName: "",
        middleName: "",
        lastName: "",
        phone: "",
        aadhaarNumber: "",
        panNumber: "",
        address: "",
        email: "",
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

      // MOVE TO NEXT STEP
      if (stageKey === "primary") {
        setCurrentStep(1);
        setVisibleStage("secondary");
      }
      if (stageKey === "secondary") {
        setCurrentStep(2);
        setVisibleStage("final");
      }
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
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Background Verification — Initiation
            </h1>
            <p className="text-gray-600">
              Configure & initiate BGV workflow for candidates.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() =>
                selectedCandidate &&
                fetchCandidateVerification(selectedCandidate)
              }
              disabled={!selectedCandidate || loading}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center gap-2"
            >
              <RefreshCcw size={16} /> Refresh
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              disabled={!selectedOrg}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
            >
              <PlusCircle size={16} /> Add Candidate
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
              <label className="text-sm font-medium">Organization</label>
              <select
                value={selectedOrg}
                onChange={(e) => {
                  setSelectedOrg(e.target.value);
                  setCandidates([]);
                  setSelectedCandidate("");
                  if (e.target.value) fetchCandidates(e.target.value);
                }}
                className="border rounded-md p-2 w-full mt-1"
              >
                <option value="">-- Select --</option>
                {organizations.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.organizationName}
                  </option>
                ))}
              </select>
            </div>

            {/* CANDIDATE */}
            <div>
              <label className="text-sm font-medium">Candidate</label>
              <select
                value={selectedCandidate}
                onChange={(e) => handleCandidateSelect(e.target.value)}
                className="border rounded-md p-2 w-full mt-1"
                disabled={!selectedOrg}
              >
                <option value="">-- Select --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
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
                    disabled={isStageLocked("primary") || initLoading}
                    onClick={() => handleInitiateStage("primary")}
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
                        Initiate Primary
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
                      "Run Primary"
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
                      "Initiate Secondary"
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
                      "Run Secondary"
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
                      initLoading
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
                      "Initiate Final"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              <AnimatePresence mode="popLayout">
                {getAvailableChecksForStage(visibleStage).map((v) => {
                  const stageKey = visibleStage;
                  const status = getCheckStatus(v);
                  const selected = stages[stageKey]?.includes(v);
                  const completed = isCheckCompletedAnywhere(v);
                  const locked = isStageLocked(stageKey);

                  return (
                    <motion.div
                      key={v}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className={`border rounded-xl p-4 h-full flex flex-col justify-between ${
                        selected
                          ? "border-green-500 bg-green-50"
                          : completed
                          ? "border-gray-300 bg-gray-100"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="text-lg font-semibold capitalize">
                          {v}
                        </div>

                        {status ? (
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              status === "COMPLETED"
                                ? "bg-green-500 text-white"
                                : status === "FAILED"
                                ? "bg-red-500 text-white"
                                : "bg-yellow-500 text-white"
                            }`}
                          >
                            {status}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Not Started
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleStageToggle(v, stageKey)}
                            disabled={locked}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">
                            {completed
                              ? "Already Verified"
                              : locked
                              ? "Locked"
                              : `Add to ${stepNames[currentStep]}`}
                          </span>
                        </label>

                        {!completed && !locked && (
                          <button
                            onClick={() => handleStageToggle(v, stageKey)}
                            className="w-full py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm rounded-md"
                          >
                            Add Verification
                          </button>
                        )}
                      </div>

                      {lastRunStage === stageKey &&
                        !isStageCompleted(stageKey) &&
                        (selected ||
                          candidateVerification?.stages?.[stageKey]?.some(
                            (c) => c.check === v
                          )) && (
                          <button
                            onClick={() => handleStartVerification(v)}
                            disabled={startLoading[v]}
                            className="mt-3 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center justify-center gap-2"
                          >
                            {startLoading[v] ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Starting...
                              </>
                            ) : (
                              "Start Verification"
                            )}
                          </button>
                        )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
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
                          <td className="p-3">{item.remarks || "—"}</td>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Candidate</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-600 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="firstName"
                value={newCandidate.firstName}
                onChange={handleInputChange}
                className="border p-2 rounded"
                placeholder="First Name"
              />
              <input
                name="middleName"
                value={newCandidate.middleName}
                onChange={handleInputChange}
                className="border p-2 rounded"
                placeholder="Middle Name"
              />
              <input
                name="lastName"
                value={newCandidate.lastName}
                onChange={handleInputChange}
                className="border p-2 rounded"
                placeholder="Last Name"
              />
              <input
                name="phone"
                value={newCandidate.phone}
                onChange={handleInputChange}
                className="border p-2 rounded"
                placeholder="Phone Number"
              />
              <input
                name="aadhaarNumber"
                value={newCandidate.aadhaarNumber}
                onChange={handleInputChange}
                className="border p-2 rounded"
                placeholder="Aadhaar Number"
              />
              <input
                name="panNumber"
                value={newCandidate.panNumber}
                onChange={handleInputChange}
                className="border p-2 rounded uppercase"
                placeholder="PAN Number"
              />
            </div>

            <input
              name="email"
              value={newCandidate.email}
              onChange={handleInputChange}
              className="border p-2 rounded w-full mt-3"
              placeholder="Email"
            />

            <textarea
              name="address"
              value={newCandidate.address}
              onChange={handleInputChange}
              className="border p-2 rounded w-full mt-3"
              rows={3}
              placeholder="Address"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
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
    </div>
  );
}
