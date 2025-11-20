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
  RotateCcw,
  Edit3,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function OrgSelfVerificationPage() {
  const [userOrgId, setUserOrgId] = useState("");
  const [userServices, setUserServices] = useState([]);

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [candidateDetails, setCandidateDetails] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [candidateVerification, setCandidateVerification] = useState(null);
  const [reinitLoading, setReinitLoading] = useState(false);

  const [stages, setStages] = useState({
    primary: [],
    secondary: [],
    final: [],
  });
  const [currentStep, setCurrentStep] = useState(0);

  // read org from localStorage.bgvUser on mount
  useEffect(() => {
    const stored = localStorage.getItem("bgvUser");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.organizationId) {
          setUserOrgId(user.organizationId);
          setUserServices(user.services || []);
          fetchCandidates(user.organizationId);
        }
      } catch {
        console.error("Failed to parse bgvUser");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCandidates = async (orgId) => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/secure/getCandidates?orgId=${orgId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) setCandidates(data.candidates || []);
      else {
        console.warn("getCandidates", data);
        setCandidates([]);
      }
    } catch (err) {
      console.warn("Failed to fetch candidates:", err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshCandidateVerification = async (candidateId) => {
    if (!candidateId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/secure/getVerifications?candidateId=${candidateId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) setCandidateVerification(data.verifications?.[0] || null);
      else setCandidateVerification(null);
    } catch (err) {
      console.warn("Failed to fetch verification:", err);
      setCandidateVerification(null);
    } finally {
      setLoading(false);
    }
  };

  const checksList = [
    {
      key: "aadhaar",
      title: "Aadhaar Verification",
      desc: "Verify Aadhaar identity & information.",
      icon: "🪪",
    },
    {
      key: "pan",
      title: "PAN Verification",
      desc: "Verify PAN details & linkage.",
      icon: "💳",
    },
    {
      key: "bankAccount",
      title: "Bank Account Verification",
      desc: "Verify bank account ownership.",
      icon: "🏦",
    },
    {
      key: "uan",
      title: "UAN Verification",
      desc: "Verify employee UAN identity & records.",
      icon: "🧾",
    },
    {
      key: "fir",
      title: "FIR / Criminal Check",
      desc: "Check for any registered criminal records.",
      icon: "🛡️",
    },
    {
      key: "passport",
      title: "Passport Verification",
      desc: "Verify passport document & identity details.",
      icon: "🛂",
    },
    {
      key: "education",
      title: "Education Verification",
      desc: "Verify highest degree from issuing institution.",
      icon: "🎓",
    },
    {
      key: "employment",
      title: "Employment Verification",
      desc: "Verify previous employment & roles.",
      icon: "💼",
    },
    {
      key: "cibil",
      title: "CIBIL Credit Check",
      desc: "Check financial score & credit behavior.",
      icon: "📊",
    },
  ];

  const handleStageToggle = (checkKey, stageKey) => {
    setStages((prev) => {
      const exists = prev[stageKey].includes(checkKey);
      return {
        ...prev,
        [stageKey]: exists
          ? prev[stageKey].filter((k) => k !== checkKey)
          : [...prev[stageKey], checkKey],
      };
    });
  };

  const stepNames = ["Primary", "Secondary", "Final"];
  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 2));
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const availableChecksForStep = (stepIndex) => {
    const allKeys = checksList.map((c) => c.key);
    if (stepIndex === 0) return allKeys;
    if (stepIndex === 1)
      return allKeys.filter((k) => !stages.primary.includes(k));
    if (stepIndex === 2)
      return allKeys.filter(
        (k) => !stages.primary.includes(k) && !stages.secondary.includes(k)
      );
    return [];
  };

  const allSelected = Array.from(
    new Set([...stages.primary, ...stages.secondary, ...stages.final])
  );

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!selectedCandidate) {
      if (
        !candidateDetails.name ||
        !candidateDetails.email ||
        !candidateDetails.mobile
      ) {
        alert("Please fill candidate details or select existing candidate.");
        return;
      }
    }
    if (allSelected.length === 0) {
      alert("Please select at least one check.");
      return;
    }

    const payload = {
      candidateId: selectedCandidate || undefined,
      candidate: selectedCandidate
        ? undefined
        : {
            firstName:
              candidateDetails.name.split(" ")[0] || candidateDetails.name,
            lastName: candidateDetails.name.split(" ").slice(1).join(" ") || "",
            email: candidateDetails.email,
            phone: candidateDetails.mobile,
          },
      organizationId: userOrgId,
      stages,
      initiatedBy: "Organization Helper",
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/secure/selfInitiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("✅ Verification request created successfully.");
        setRequests((prev) => [
          {
            id: prev.length + 1,
            name:
              candidateDetails.name ||
              (candidates.find((c) => c._id === selectedCandidate)
                ? `${
                    candidates.find((c) => c._id === selectedCandidate)
                      .firstName
                  } ${
                    candidates.find((c) => c._id === selectedCandidate).lastName
                  }`
                : "Candidate"),
            email:
              candidateDetails.email ||
              candidates.find((c) => c._id === selectedCandidate)?.email ||
              "",
            org: userOrgId,
            checks: allSelected,
            status: "Pending",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        const returnedCandidateId = data.candidateId || selectedCandidate;
        if (returnedCandidateId)
          refreshCandidateVerification(returnedCandidateId);
      } else {
        console.warn("selfInitiate response:", data);
        alert("⚠️ Backend returned an error — saved request locally.");
        setRequests((prev) => [
          {
            id: prev.length + 1,
            name: candidateDetails.name || "Candidate",
            email: candidateDetails.email || "",
            org: userOrgId,
            checks: allSelected,
            status: "Pending (local)",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.warn("submit error:", err);
      alert("⚠️ Network error — saved request locally.");
      setRequests((prev) => [
        {
          id: prev.length + 1,
          name: candidateDetails.name || "Candidate",
          email: candidateDetails.email || "",
          org: userOrgId,
          checks: allSelected,
          status: "Pending (local)",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setSubmitting(false);
      if (!selectedCandidate)
        setCandidateDetails({ name: "", email: "", mobile: "" });
    }
  };

  const handleAddCandidate = async () => {
    if (
      !candidateDetails.name ||
      !candidateDetails.email ||
      !candidateDetails.mobile
    ) {
      alert("Please enter name, email, and mobile.");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        firstName: candidateDetails.name.split(" ")[0] || candidateDetails.name,
        lastName: candidateDetails.name.split(" ").slice(1).join(" ") || "",
        email: candidateDetails.email,
        phone: candidateDetails.mobile,
        organizationId: userOrgId,
      };
      const res = await fetch(`${API_BASE}/secure/addCandidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.candidate) {
        setCandidates((prev) => [data.candidate, ...prev]);
        alert("✅ Candidate added successfully.");
      } else {
        // fallback local candidate stub
        const localCandidate = {
          _id: `local-${Date.now()}`,
          firstName: candidateDetails.name.split(" ")[0],
          lastName: candidateDetails.name.split(" ").slice(1).join(" "),
          email: candidateDetails.email,
          phone: candidateDetails.mobile,
        };
        setCandidates((prev) => [localCandidate, ...prev]);
        alert("⚠️ Backend add failed — candidate added locally.");
      }
      setShowAddModal(false);
      setCandidateDetails({ name: "", email: "", mobile: "" });
    } catch (err) {
      console.warn("addCandidate error:", err);
      const localCandidate = {
        _id: `local-${Date.now()}`,
        firstName: candidateDetails.name.split(" ")[0],
        lastName: candidateDetails.name.split(" ").slice(1).join(" "),
        email: candidateDetails.email,
        phone: candidateDetails.mobile,
      };
      setCandidates((prev) => [localCandidate, ...prev]);
      setShowAddModal(false);
      setCandidateDetails({ name: "", email: "", mobile: "" });
      alert("⚠️ Network error while adding candidate — added locally.");
    } finally {
      setLoading(false);
    }
  };

  const handleReinitiateFailed = async () => {
    if (!candidateVerification) return;
    const failedChecks = [];
    Object.values(candidateVerification.stages || {}).forEach((stage) =>
      stage.forEach((check) => {
        if (check.status === "FAILED") failedChecks.push(check.check);
      })
    );
    if (failedChecks.length === 0) {
      alert("No failed checks to reinitiate.");
      return;
    }
    try {
      setReinitLoading(true);
      const payload = {
        candidateId: selectedCandidate,
        organizationId: userOrgId,
        reinitiateChecks: failedChecks,
      };
      const res = await fetch(`${API_BASE}/secure/initiateVerification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("🔁 Failed checks reinitiated successfully.");
        refreshCandidateVerification(selectedCandidate);
      } else {
        console.warn("reinitiate error:", data);
        alert("⚠️ Could not reinitiate on backend.");
      }
    } catch (err) {
      console.warn("reinitiate network err:", err);
      alert("⚠️ Network error during reinitiation.");
    } finally {
      setReinitLoading(false);
    }
  };

  const getCheckStatus = (key) => {
    if (!candidateVerification?.stages) return null;
    for (const s of Object.values(candidateVerification.stages)) {
      const found = s.find((c) => c.check === key);
      if (found) return found.status;
    }
    return null;
  };

  const isFullyCompleted = candidateVerification?.overallStatus === "COMPLETED";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Organization — Candidate Self Verification
            </h1>
            <p className="mt-1 text-gray-600 max-w-xl">
              Initiate self-verification for candidates within your
              organization.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!userOrgId)
                  return alert("Organization not found in localStorage.");
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
            >
              <PlusCircle size={16} /> Add Candidate
            </button>

            <button
              onClick={() =>
                selectedCandidate &&
                refreshCandidateVerification(selectedCandidate)
              }
              disabled={!selectedCandidate}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium"
            >
              <RefreshCcw size={16} /> Refresh Status
            </button>
          </div>
        </div>

        {/* Candidate Select */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Candidate
              </label>
              <select
                value={selectedCandidate}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedCandidate(id);
                  setCandidateVerification(null);
                  setStages({ primary: [], secondary: [], final: [] });
                  setCurrentStep(0);
                  if (id) refreshCandidateVerification(id);
                }}
                className="border rounded-md w-full p-2"
              >
                <option value="">-- Select candidate --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {`${c.firstName || ""} ${c.lastName || ""}`.trim() ||
                      c.email ||
                      c._id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <div className="text-sm text-gray-600">Current Status</div>
              <div className="font-semibold text-gray-800 mt-1">
                {candidateVerification?.overallStatus || "Not initiated"}
              </div>
            </div>
          </div>
        </div>

        {/* Steps UI */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-1">
                  {stepNames[currentStep]} Stage
                </h3>
                <p className="text-sm text-gray-600">
                  {currentStep === 0
                    ? "Pick primary checks first."
                    : currentStep === 1
                    ? "Pick secondary checks from remaining."
                    : "Pick final remaining checks."}
                </p>
              </div>

              <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">
                  Selected Checks
                </div>
                <div className="font-semibold text-gray-800">
                  {allSelected.length ? allSelected.join(", ") : "None"}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded-md flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>

                <button
                  onClick={goNext}
                  disabled={
                    currentStep === 2 ||
                    (currentStep === 0 && stages.primary.length === 0)
                  }
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>

              {currentStep === 2 && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || allSelected.length === 0}
                  className="w-full py-2 rounded-md bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  Send Email & Create Request
                </button>
              )}

              {candidateVerification?.overallStatus === "FAILED" && (
                <button
                  onClick={handleReinitiateFailed}
                  disabled={reinitLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md flex items-center justify-center gap-2"
                >
                  {reinitLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <RotateCcw size={16} />
                  )}{" "}
                  Reinitiate Failed Checks
                </button>
              )}
            </div>

            {/* Right Side Checks */}
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
              {checksList.map((c) => {
                const status = getCheckStatus(c.key);
                const availableKeys = availableChecksForStep(currentStep);
                const isAvailable = availableKeys.includes(c.key);
                const selectedInStage = stages[
                  stepNames[currentStep].toLowerCase()
                ]?.includes(c.key);
                const selectedAny =
                  stages.primary.includes(c.key) ||
                  stages.secondary.includes(c.key) ||
                  stages.final.includes(c.key);

                return (
                  <div
                    key={c.key}
                    className={`border rounded-xl p-4 transition flex flex-col justify-between ${
                      isFullyCompleted
                        ? "border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed"
                        : selectedAny
                        ? "border-green-500 bg-green-50 cursor-pointer"
                        : "border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{c.icon}</div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {c.title}
                          </div>
                          <div className="text-sm text-gray-500">{c.desc}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        {status ? (
                          <span
                            className={`text-xs px-2 py-1 rounded-full text-white ${
                              status === "COMPLETED"
                                ? "bg-green-600"
                                : status === "FAILED"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                            }`}
                          >
                            {status}
                          </span>
                        ) : (
                          <span
                            className={`text-xs px-2 py-1 rounded-full text-white ${
                              selectedAny ? "bg-blue-600" : "bg-gray-400"
                            }`}
                          >
                            {selectedAny ? "Selected" : "Not run"}
                          </span>
                        )}
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedInStage || false}
                        onChange={() =>
                          handleStageToggle(
                            c.key,
                            stepNames[currentStep].toLowerCase()
                          )
                        }
                        disabled={!isAvailable || isFullyCompleted}
                        className="accent-red-600 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">
                        {isAvailable
                          ? `Add to ${stepNames[currentStep]}`
                          : "Locked (selected earlier)"}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Requests table */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Self-Verification Requests
            </h2>
            <div className="text-sm text-gray-600">
              {requests.length} record(s)
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-sm text-gray-500 py-6 text-center">
              No self-verification requests yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Candidate</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Organization</th>
                  <th className="p-3 text-left">Checks</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.name}</td>
                    <td className="p-3">{r.email}</td>
                    <td className="p-3">{r.org}</td>
                    <td className="p-3">
                      <ul className="list-disc pl-5">
                        {r.checks.map((ck) => (
                          <li key={ck} className="text-sm text-gray-700">
                            {checksList.find((x) => x.key === ck)?.icon || "✅"}{" "}
                            {checksList.find((x) => x.key === ck)?.title || ck}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-white ${
                          r.status?.toLowerCase().includes("complete")
                            ? "bg-green-600"
                            : "bg-yellow-500"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            alert("Open details (not implemented)")
                          }
                          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() =>
                            selectedCandidate
                              ? refreshCandidateVerification(selectedCandidate)
                              : alert(
                                  "Select the candidate used for this request and click Refresh."
                                )
                          }
                          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-2"
                        >
                          <RefreshCcw size={14} /> Refresh
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-transparent backdrop-blur-sm pointer-events-auto"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg pointer-events-auto">
            <div className="bg-white/98 rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold">Add Candidate</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Full name"
                  value={candidateDetails.name}
                  onChange={(e) =>
                    setCandidateDetails({
                      ...candidateDetails,
                      name: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={candidateDetails.email}
                  onChange={(e) =>
                    setCandidateDetails({
                      ...candidateDetails,
                      email: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />
                <input
                  type="tel"
                  placeholder="Mobile"
                  value={candidateDetails.mobile}
                  onChange={(e) =>
                    setCandidateDetails({
                      ...candidateDetails,
                      mobile: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleAddCandidate}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <PlusCircle size={16} />
                    )}{" "}
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
