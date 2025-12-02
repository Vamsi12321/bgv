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
  Cpu,
  FileCheck,
  FileSearch,
  Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConsentSection from "@/app/components/ConsentSection";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function OrgBGVRequestsPage() {
  /* ---------------------------------------------------------------------
      STATE
  --------------------------------------------------------------------- */
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [candidateVerification, setCandidateVerification] = useState(null);

  const [userOrgId, setUserOrgId] = useState("");
  const [userServices, setUserServices] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [startLoading, setStartLoading] = useState({});
  const [reinitLoading, setReinitLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const stepNames = ["Primary", "Secondary", "Final"];
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleStage, setVisibleStage] = useState("primary");
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
    { id: "resume_validation", name: "Resume Validation" },
    { id: "education_check_ai", name: "Education AI Check" },
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

  const [stages, setStages] = useState({ ...DEFAULTS });

  const [lastRunStage, setLastRunStage] = useState(null);

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
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/secure/getCandidates?orgId=${orgId}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || data.error || "Failed fetching");

      setCandidates(data.candidates || []);
    } catch (err) {
      showModal({ title: "Error", message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------
      FETCH VERIFICATION
  --------------------------------------------------------------------- */
  const fetchCandidateVerification = async (candidateId) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/secure/getVerifications?candidateId=${candidateId}`,
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

      const res = await fetch(`${API_BASE}/secure/initiateStageVerification`, {
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
        await fetch(`${API_BASE}/secure/retryCheck`, {
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

      const res = await fetch(`${API_BASE}/secure/updateInternalVerification`, {
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

  const renderServiceCard = (key, label, type) => {
    const stageKey = visibleStage;
    const status = getCheckStatus(key);
    const selected = stages[stageKey]?.includes(key);
    const completed = isCheckCompletedAnywhere(key);
    const locked = isStageLocked(stageKey);

    // icon selection
    const iconMap = {
      api: <Cpu size={20} className="text-blue-600" />,
      manual: <FileCheck size={20} className="text-orange-600" />,
      ai: <Brain size={20} className="text-purple-600" />,
    };

    return (
      <motion.div
        key={key}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className={`
        rounded-2xl p-4 shadow-lg border
        ${
          selected
            ? "border-red-500 bg-red-50"
            : completed
            ? "border-green-400 bg-green-50"
            : "border-gray-200 bg-white hover:shadow-xl hover:bg-gray-50"
        }
        transition-all duration-150
      `}
      >
        {/* Title, Icon, Status */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {iconMap[type]}
            <div className="text-lg font-semibold capitalize text-gray-800">
              {label}
            </div>
          </div>

          <div className="flex items-center ml-2">
            {status === "COMPLETED" && (
              <CheckCircle className="text-green-600" size={22} />
            )}
            {status === "FAILED" && <X className="text-red-600" size={22} />}
            {status === "IN_PROGRESS" && (
              <Loader2 className="text-yellow-500 animate-spin" size={22} />
            )}
            {!status && (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            )}
          </div>
        </div>

        <div className="border-t my-3" />

        {/* Checkbox OR Manual Verify */}
        {!completed ? (
          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => handleStageToggle(key, stageKey)}
              disabled={locked}
              className="w-5 h-5 accent-red-600 cursor-pointer"
            />
            <span className="text-sm text-gray-700">
              {locked ? "Locked" : `Add to ${stepNames[currentStep]}`}
            </span>
          </div>
        ) : null}

        {/* Manual Verify Button */}
        {type === "manual" &&
          isStageLocked(stageKey) &&
          finalizedChecks[stageKey].includes(key) &&
          status !== "COMPLETED" &&
          status !== "FAILED" && (
            <button
              onClick={() =>
                setManualVerifyModal({
                  open: true,
                  check: key,
                  remarks: "",
                  status: "COMPLETED", // default
                })
              }
              className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-md"
            >
              Verify Manually
            </button>
          )}
      </motion.div>
    );
  };

  /* ---------------------------------------------------------------------
      RETURN UI
  --------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* -----------------------------------------------------------------
            PAGE HEADER
        ----------------------------------------------------------------- */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#ff004f]">
              Organization — BGV Requests
            </h1>
            <p className="text-gray-700 mt-1 text-sm">
              Configure and run background verification checks.
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
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
            >
              <PlusCircle size={16} />
              Add Candidate
            </button>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            STEPPER
        ----------------------------------------------------------------- */}
        <div className="bg-white border p-4 rounded-xl shadow flex justify-between">
          {stepNames.map((name, i) => {
            const key = name.toLowerCase();
            const active = i === currentStep;
            const done = isStageCompleted(key);

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
                  }`}
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

        <div className="mt-6">
          <ConsentSection candidateId={selectedCandidate} />
        </div>

        {/* -----------------------------------------------------------------
            CANDIDATE & STATUS
        ----------------------------------------------------------------- */}
        <div className="bg-white border p-6 rounded-xl shadow space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Candidate Selection */}
            <div>
              <label className="text-sm font-medium">Candidate</label>
              <select
                value={selectedCandidate}
                onChange={(e) => handleCandidateSelect(e.target.value)}
                className="border rounded-md p-2 w-full mt-1"
              >
                <option value="">-- Select --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-semibold mt-1">
                {candidateVerification?.overallStatus || "Not Initiated"}
              </div>
            </div>

            {/* Service Pricing */}
            <div className="bg-gray-100 p-4 rounded-md border">
              <h3 className="font-semibold mb-1 text-sm">Service Pricing</h3>
              {userServices.map((s, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm text-gray-700 border-b py-1"
                >
                  <span>{s.serviceName}</span>
                  <span>₹{s.price}</span>
                </div>
              ))}
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
            <div className="bg-gray-100 p-4 rounded-md border">
              <h3 className="font-semibold text-gray-800">
                {stepNames[currentStep]} Stage
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {currentStep === 0 &&
                  "Primary: Choose initial verification checks."}
                {currentStep === 1 && "Secondary: Checks not used in Primary."}
                {currentStep === 2 && "Final: Remaining checks."}
              </p>
            </div>

            {/* Selected Checks */}
            <div className="bg-gray-100 p-4 rounded-md border">
              <div className="text-sm text-gray-600 mb-1">Selected Checks</div>
              <div className="font-semibold">
                {[
                  ...new Set([
                    ...stages.primary,
                    ...stages.secondary,
                    ...stages.final,
                  ]),
                ].join(", ") || "None"}
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
            {/* ======== GROUPED CHECK SECTIONS (API / MANUAL / AI) ========== */}
            {!isStageCompleted(visibleStage) && (
              <div className="space-y-10">
                {/* ---------------- API CHECKS ---------------- */}
                {/* ---------------- API CHECKS ---------------- */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">🔗</span> API-Based Checks
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {API_SERVICES.filter(
                      (s) =>
                        servicesOffered.includes(s) &&
                        (!isStageLocked(visibleStage) ||
                          finalizedChecks[visibleStage].includes(s))
                    ).map((s) =>
                      renderServiceCard(s, s.replace(/_/g, " "), "api")
                    )}
                  </div>
                </div>

                {/* ---------------- MANUAL CHECKS ---------------- */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-orange-600">📝</span> Manual
                    Verification
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MANUAL_SERVICES.filter(
                      (s) =>
                        servicesOffered.includes(s.id) &&
                        (!isStageLocked(visibleStage) ||
                          finalizedChecks[visibleStage].includes(s.id))
                    ).map((s) => renderServiceCard(s.id, s.name, "manual"))}
                  </div>
                </div>

                {/* ---------------- AI CHECKS ---------------- */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-purple-600">🤖</span> AI-Powered
                    Checks
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {AI_SERVICES.filter(
                      (s) =>
                        servicesOffered.includes(s.id) &&
                        (!isStageLocked(visibleStage) ||
                          finalizedChecks[visibleStage].includes(s.id))
                    ).map((s) => renderServiceCard(s.id, s.name, "ai"))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* -----------------------------------------------------------------
            SUMMARY TABLE
        ----------------------------------------------------------------- */}
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

                    const res = await fetch(`${API_BASE}/secure/addCandidate`, {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        organizationId: userOrgId,
                        ...newCandidate,
                      }),
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
