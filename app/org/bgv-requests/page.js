"use client";
import { useEffect, useState } from "react";
import {
  PlusCircle,
  Loader2,
  X,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  RotateCcw,
  Edit3,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function OrgBGVRequestsPage() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [candidateVerification, setCandidateVerification] = useState(null);
  const [userOrgId, setUserOrgId] = useState("");
  const [userServices, setUserServices] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [reinitLoading, setReinitLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newCandidate, setNewCandidate] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    aadhaarNumber: "",
    panNumber: "",
    address: "",
  });

  const [stages, setStages] = useState({
    primary: [],
    secondary: [],
    final: [],
  });

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("bgvUser");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserOrgId(user.organizationId);
        setUserServices(user.services || []);
        fetchCandidates(user.organizationId);
      } catch {
        console.error("Failed to parse bgvUser");
      }
    }
  }, []);

  const fetchCandidates = async (orgId) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/secure/getCandidates?orgId=${orgId}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok) setCandidates(data.candidates || []);
      else alert(data.detail || "Failed to fetch candidates");
    } catch {
      alert("Failed to fetch candidates");
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
      if (!res.ok)
        throw new Error(data.message || "Failed to load verification");
      setCandidateVerification(data.verifications?.[0] || null);
    } catch {
      setCandidateVerification(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelect = (id) => {
    setSelectedCandidate(id);
    setCandidateVerification(null);
    if (id) fetchCandidateVerification(id);
  };

  const handleStageToggle = (checkType, stageKey) => {
    setStages((prev) => {
      const exists = prev[stageKey].includes(checkType);
      return {
        ...prev,
        [stageKey]: exists
          ? prev[stageKey].filter((t) => t !== checkType)
          : [...prev[stageKey], checkType],
      };
    });
  };

  const handleInitiate = async () => {
    if (!selectedCandidate) return alert("Select candidate first.");

    const payload = {
      candidateId: selectedCandidate,
      organizationId: userOrgId,
      stages,
    };

    try {
      setInitLoading(true);
      const res = await fetch(`${API_BASE}/secure/initiateVerification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Initiation failed");
      alert("Verification initiated successfully");
      fetchCandidateVerification(selectedCandidate);
    } catch (err) {
      alert(err.message);
    } finally {
      setInitLoading(false);
    }
  };

  const handleReinitiateFailed = async () => {
    if (!candidateVerification) return;
    const failedChecks = [];
    Object.values(candidateVerification.stages || {}).forEach((stage) => {
      stage.forEach((check) => {
        if (check.status === "FAILED") failedChecks.push(check.check);
      });
    });
    if (failedChecks.length === 0)
      return alert("No failed checks to reinitiate.");

    const payload = {
      candidateId: selectedCandidate,
      organizationId: userOrgId,
      reinitiateChecks: failedChecks,
    };

    try {
      setReinitLoading(true);
      const res = await fetch(`${API_BASE}/secure/initiateVerification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reinitiate");
      alert("Failed checks reinitiated successfully");
      fetchCandidateVerification(selectedCandidate);
    } catch (err) {
      alert(err.message);
    } finally {
      setReinitLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    try {
      const payload = { ...newCandidate, organizationId: userOrgId };
      const res = await fetch(`${API_BASE}/secure/addCandidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add candidate");
      alert("Candidate added");
      setShowAddModal(false);
      setNewCandidate({
        firstName: "",
        middleName: "",
        lastName: "",
        phone: "",
        aadhaarNumber: "",
        panNumber: "",
        address: "",
      });
      fetchCandidates(userOrgId);
    } catch (err) {
      alert(err.message);
    }
  };

  const verificationCards = [
    { key: "aadhaar", title: "Aadhaar Verification", icon: "🪪" },
    { key: "pan", title: "PAN Verification", icon: "💳" },
    { key: "degree", title: "Degree Verification", icon: "🎓" },
    { key: "employment", title: "Employment Verification", icon: "💼" },
    { key: "criminal", title: "Criminal Check", icon: "🕵️" },
    { key: "address", title: "Address Verification", icon: "🏠" },
    { key: "cibil", title: "CIBIL Report", icon: "📊" },
  ];

  const getCheckStatus = (check) => {
    if (!candidateVerification) return null;
    const allStages = candidateVerification.stages || {};
    for (const stage of Object.values(allStages)) {
      const found = stage.find((c) => c.check === check);
      if (found) return found.status;
    }
    return null;
  };

  const stepNames = ["primary", "secondary", "final"];
  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 2));
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const allSelected = [
    ...new Set([...stages.primary, ...stages.secondary, ...stages.final]),
  ];

  const availableChecksForStep = (stepIndex) => {
    const all = verificationCards.map((c) => c.key);
    if (stepIndex === 0) return all;
    if (stepIndex === 1) return all.filter((k) => !stages.primary.includes(k));
    if (stepIndex === 2)
      return all.filter(
        (k) => !stages.primary.includes(k) && !stages.secondary.includes(k)
      );
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-600">
            Organization — BGV Requests
          </h1>

          <div className="flex gap-3">
            <button
              onClick={() =>
                selectedCandidate &&
                fetchCandidateVerification(selectedCandidate)
              }
              disabled={!selectedCandidate || loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              <RefreshCcw size={16} /> Refresh
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              <PlusCircle size={16} /> Add Candidate
            </button>
          </div>
        </div>

        {/* CANDIDATE ADD MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-4">Add Candidate</h2>

              <div className="grid grid-cols-2 gap-3">
                {Object.keys(newCandidate).map((field) => (
                  <input
                    key={field}
                    type="text"
                    placeholder={field}
                    value={newCandidate[field]}
                    onChange={(e) =>
                      setNewCandidate({
                        ...newCandidate,
                        [field]: e.target.value,
                      })
                    }
                    className="border rounded-md px-3 py-2 text-sm"
                  />
                ))}
              </div>

              <button
                onClick={handleAddCandidate}
                className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md"
              >
                Save Candidate
              </button>
            </div>
          </div>
        )}

        {/* Candidate select */}
        <div className="bg-white p-6 rounded-xl shadow border space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Select Candidate</label>
              <select
                value={selectedCandidate}
                onChange={(e) => handleCandidateSelect(e.target.value)}
                className="border rounded-md w-full p-2"
              >
                <option value="">-- Select --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-semibold mt-1">
                {candidateVerification?.overallStatus || "Not initiated"}
              </div>
            </div>
          </div>
        </div>

        {/* Steps and controls */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-md border">
                <h3 className="font-semibold mb-1">
                  {stepNames[currentStep].charAt(0).toUpperCase() +
                    stepNames[currentStep].slice(1)}{" "}
                  Stage
                </h3>
              </div>

              <div className="bg-gray-100 p-4 rounded-md border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Edit3 size={16} /> Service Pricing
                </h3>
                <ul className="space-y-2">
                  {userServices.map((s, idx) => (
                    <li key={idx} className="flex justify-between text-sm">
                      <span>{s.serviceName}</span>
                      <input
                        type="number"
                        value={s.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setUserServices((prev) =>
                            prev.map((srv, i) =>
                              i === idx ? { ...srv, price: val } : srv
                            )
                          );
                        }}
                        className="w-20 border rounded-md px-2 py-1 text-right"
                      />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-md flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>

                <button
                  onClick={goNext}
                  disabled={
                    currentStep === 2 ||
                    (currentStep === 0 && stages.primary.length === 0)
                  }
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md flex items-center justify-center gap-2"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>

              {currentStep === 2 && (
                <button
                  onClick={handleInitiate}
                  disabled={initLoading || !allSelected.length}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md flex items-center justify-center gap-2"
                >
                  {initLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />{" "}
                      Initiating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Initiate Verification
                    </>
                  )}
                </button>
              )}

              {candidateVerification?.overallStatus === "FAILED" && (
                <button
                  onClick={handleReinitiateFailed}
                  disabled={reinitLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md flex items-center justify-center gap-2"
                >
                  {reinitLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />{" "}
                      Reinitiating...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} /> Reinitiate Failed Checks
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
              {verificationCards.map((v) => {
                const status = getCheckStatus(v.key);
                const available = availableChecksForStep(currentStep);
                const selected =
                  stages.primary.includes(v.key) ||
                  stages.secondary.includes(v.key) ||
                  stages.final.includes(v.key);

                return (
                  <div
                    key={v.key}
                    className={`border rounded-xl p-4 ${
                      selected
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="text-xl">{v.icon}</div>
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
                        <span className="text-xs text-gray-400">Not run</span>
                      )}
                    </div>
                    <div className="mt-2 font-medium">{v.title}</div>
                    <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stages[stepNames[currentStep]].includes(v.key)}
                        onChange={() =>
                          handleStageToggle(v.key, stepNames[currentStep])
                        }
                        disabled={!available.includes(v.key)}
                        className="accent-red-600 w-4 h-4"
                      />
                      <span className="text-sm">
                        {available.includes(v.key)
                          ? `Add to ${stepNames[currentStep]}`
                          : "Locked"}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
