"use client";
import { useEffect, useState } from "react";
import { PlusCircle, Loader2, X, RefreshCcw } from "lucide-react";

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
  const [showAddModal, setShowAddModal] = useState(false);

  const [newCandidate, setNewCandidate] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    aadhaarNumber: "",
    panNumber: "",
    address: "",
    organizationId: "",
  });

  const [stages, setStages] = useState({
    primary: [],
    secondary: [],
    final: [],
  });

  /* ---------------------- Fetch Organizations ---------------------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/secure/getOrganizations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setOrganizations(data.organizations || []);
      } catch {
        alert("Failed to load organizations");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------------------- Fetch Candidates by Org ---------------------- */
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
    } catch {
      alert("Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- Fetch Candidate Verification ---------------------- */
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

  /* ---------------------- Handle Candidate Select ---------------------- */
  const handleCandidateSelect = (id) => {
    setSelectedCandidate(id);
    setCandidateVerification(null);
    if (id) fetchCandidateVerification(id);
  };

  /* ---------------------- Handle Stage Selection ---------------------- */
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

  /* ---------------------- Initiate Verification ---------------------- */
  const handleInitiate = async () => {
    if (!selectedCandidate || !selectedOrg) {
      alert("Select organization and candidate first.");
      return;
    }

    const payload = {
      candidateId: selectedCandidate,
      organizationId: selectedOrg,
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
      alert("✅ Verification initiated successfully!");
      fetchCandidateVerification(selectedCandidate);
    } catch (err) {
      alert(err.message);
    } finally {
      setInitLoading(false);
    }
  };

  /* ---------------------- Add Candidate ---------------------- */
  const handleAddCandidate = async () => {
    try {
      const updatedCandidate = {
        ...newCandidate,
        organizationId: selectedOrg,
      };
      if (!updatedCandidate.organizationId)
        return alert("Please select organization first.");
      const res = await fetch(`${API_BASE}/secure/addCandidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedCandidate),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add candidate");
      alert("✅ Candidate added!");
      setShowAddModal(false);
      setNewCandidate({
        firstName: "",
        middleName: "",
        lastName: "",
        phone: "",
        aadhaarNumber: "",
        panNumber: "",
        address: "",
        organizationId: "",
      });
      fetchCandidates(selectedOrg);
    } catch (err) {
      alert(err.message);
    }
  };

  /* ---------------------- Verification Check Cards ---------------------- */
  const verificationCards = [
    { key: "aadhaar", title: "Aadhaar Verification", icon: "🪪" },
    { key: "pan", title: "PAN Verification", icon: "💳" },
    { key: "bankAccount", title: "Bank Account Verification", icon: "🏦" },
    { key: "uan", title: "UAN Verification", icon: "🟢" },
    { key: "fir", title: "Criminal Record (FIR)", icon: "🕵️‍♂️" },
    { key: "degree", title: "Degree Verification", icon: "🎓" },
    { key: "cibil", title: "CIBIL Report", icon: "📊" },
  ];

  const disableAll =
    candidateVerification?.overallStatus === "COMPLETED" ||
    candidateVerification?.overallStatus === "IN_PROGRESS";

  const getCheckStatus = (check) => {
    if (!candidateVerification) return null;
    const allStages = candidateVerification.stages || {};
    for (const stage of Object.values(allStages)) {
      const found = stage.find((c) => c.check === check);
      if (found) return found.status;
    }
    return null;
  };

  return (
    <div className="p-4 md:p-8 space-y-8 text-gray-900 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center md:text-left">
        Background Verification – Initiation
      </h1>

      {/* Org & Candidate Selection */}
      <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Organization */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Select Organization
            </label>
            <select
              value={selectedOrg}
              onChange={(e) => {
                setSelectedOrg(e.target.value);
                setSelectedCandidate("");
                setCandidateVerification(null);
                if (e.target.value) fetchCandidates(e.target.value);
              }}
              className="border rounded-md p-2 w-full"
            >
              <option value="">-- Select --</option>
              {organizations.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.organizationName}
                </option>
              ))}
            </select>
          </div>

          {/* Candidate */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Select Candidate
            </label>
            <select
              value={selectedCandidate}
              onChange={(e) => handleCandidateSelect(e.target.value)}
              className="border rounded-md p-2 w-full"
              disabled={!selectedOrg}
            >
              <option value="">-- Select --</option>
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {`${c.firstName} ${c.lastName}`}
                </option>
              ))}
            </select>
          </div>

          {/* Add Candidate */}
          <div className="flex items-end justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!selectedOrg}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <PlusCircle size={18} /> Add Candidate
            </button>
          </div>
        </div>
      </div>

      {/* Verification Cards */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">
          Verification Checks & Stages
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {verificationCards.map((v) => {
            const checkStatus = getCheckStatus(v.key);
            return (
              <div
                key={v.key}
                className={`border p-4 rounded-lg shadow-sm ${
                  disableAll
                    ? "opacity-60"
                    : "bg-gradient-to-b from-white to-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{v.icon}</span>
                  <h3 className="font-semibold">{v.title}</h3>
                </div>

                {checkStatus && (
                  <p className="text-sm text-gray-600 mb-2">
                    Status:{" "}
                    <span
                      className={`font-semibold ${
                        checkStatus === "COMPLETED"
                          ? "text-green-600"
                          : checkStatus === "FAILED"
                          ? "text-red-500"
                          : "text-blue-600"
                      }`}
                    >
                      {checkStatus}
                    </span>
                  </p>
                )}

                <div className="space-y-1 text-sm">
                  {["primary", "secondary", "final"].map((stageKey) => (
                    <label
                      key={stageKey}
                      className="flex items-center gap-2 capitalize"
                    >
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={stages[stageKey].includes(v.key)}
                        onChange={() => handleStageToggle(v.key, stageKey)}
                        disabled={disableAll}
                      />
                      {stageKey} Stage
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {candidateVerification?.overallStatus === "FAILED" && (
            <button
              onClick={handleInitiate}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md"
            >
              <RefreshCcw size={16} /> Re-initiate Verification
            </button>
          )}
          {candidateVerification?.overallStatus !== "COMPLETED" && (
            <button
              onClick={handleInitiate}
              disabled={initLoading || disableAll}
              className={`px-6 py-2 rounded-md text-white font-semibold ${
                initLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {initLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Initiating...
                </span>
              ) : (
                "Initiate Verification"
              )}
            </button>
          )}
        </div>

        {/* Candidate Status Summary */}
        {candidateVerification && (
          <div className="mt-6 border-t pt-4 text-sm">
            <h3 className="font-semibold mb-2">Candidate Status Summary</h3>
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Stage</th>
                  <th className="p-2 text-left">Checks</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(candidateVerification.stages).map(
                  ([stage, checks]) => (
                    <tr key={stage} className="border-t">
                      <td className="p-2 capitalize font-medium">{stage}</td>
                      <td className="p-2">
                        <ul className="list-disc pl-5">
                          {checks.map((c, i) => (
                            <li key={i}>
                              {c.check} -{" "}
                              <span
                                className={`${
                                  c.status === "COMPLETED"
                                    ? "text-green-600"
                                    : c.status === "FAILED"
                                    ? "text-red-500"
                                    : "text-blue-600"
                                }`}
                              >
                                {c.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Candidate Modal (unchanged) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-4">Add Candidate</h2>

            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1">
                Organization
              </label>
              <input
                type="text"
                value={
                  organizations.find((o) => o._id === selectedOrg)
                    ?.organizationName || ""
                }
                disabled
                className="border p-2 rounded w-full bg-gray-100 text-gray-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {["firstName", "middleName", "lastName", "phone"].map((f) => (
                <input
                  key={f}
                  placeholder={f.replace(/([A-Z])/g, " $1")}
                  className="border p-2 rounded"
                  value={newCandidate[f]}
                  onChange={(e) =>
                    setNewCandidate({ ...newCandidate, [f]: e.target.value })
                  }
                />
              ))}
              <input
                placeholder="Aadhaar Number"
                className="border p-2 rounded"
                value={newCandidate.aadhaarNumber}
                onChange={(e) =>
                  setNewCandidate({
                    ...newCandidate,
                    aadhaarNumber: e.target.value,
                  })
                }
              />
              <input
                placeholder="PAN Number"
                className="border p-2 rounded uppercase"
                value={newCandidate.panNumber}
                onChange={(e) =>
                  setNewCandidate({
                    ...newCandidate,
                    panNumber: e.target.value,
                  })
                }
              />
            </div>

            <textarea
              placeholder="Address"
              className="border p-2 rounded w-full mb-4"
              rows="3"
              value={newCandidate.address}
              onChange={(e) =>
                setNewCandidate({ ...newCandidate, address: e.target.value })
              }
            />

            <button
              onClick={handleAddCandidate}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Save Candidate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
