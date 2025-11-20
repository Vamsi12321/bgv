"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SelfVerificationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [verificationId, setVerificationId] = useState("");
  const [checks, setChecks] = useState([]);

  /* ---------------------- IF TOKEN MISSING ---------------------- */
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white shadow-lg border border-red-200 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600">
            Unauthorized Access
          </h2>

          <p className="text-gray-700 mt-3">
            This verification link is invalid or expired.
          </p>

          <p className="text-gray-700 mt-1">
            Please request your HR to resend the verification link.
          </p>

          <button
            onClick={() => alert("Ask HR to resend the verification link.")}
            className="mt-5 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Resend Link
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------- VALIDATE TOKEN ---------------------- */
  useEffect(() => {
    async function validate() {
      setLoading(true);

      const formData = new FormData();
      formData.append("token", token);

      const res = await fetch(`https://maihoo.onrender.com/self/verify/start`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setVerificationId(data.verificationId);
      setCandidate({
        name: data.candidateName,
        org: data.organizationName,
        stage: data.stage,
      });
      setChecks(data.checks || []);
      setLoading(false);
    }

    validate();
  }, [token]);

  /* ---------------------- START CHECK ---------------------- */
  async function startCheck(checkName) {
    const formData = new FormData();
    formData.append("verificationId", verificationId);
    formData.append("check", checkName);

    const res = await fetch(`https://maihoo.onrender.com/self/verify/check`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    alert(`Check Completed: ${data.remarks}`);

    refreshChecks();
  }

  /* ---------------------- RETRY CHECK ---------------------- */
  async function retryCheck(checkName) {
    const formData = new FormData();
    formData.append("verificationId", verificationId);
    formData.append("check", checkName);

    const res = await fetch(
      `https://maihoo.onrender.com/self/verify/retryCheck`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    alert(`Retry Status: ${data.status}`);

    refreshChecks();
  }

  /* ---------------------- REFRESH CHECKS ---------------------- */
  async function refreshChecks() {
    const formData = new FormData();
    formData.append("token", token);

    const res = await fetch(`https://maihoo.onrender.com/self/verify/start`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setChecks(data.checks || []);
  }

  /* ---------------------- LOADING SCREEN ---------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="animate-spin text-red-600" />
          Validating your verification link...
        </div>
      </div>
    );
  }

  /* ---------------------- UI ---------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* HEADER CARD */}
        <div className="bg-white shadow border border-red-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-red-600">
            Welcome, {candidate?.name}
          </h2>

          <p className="text-gray-700 mt-2">
            <strong className="text-gray-900">Organization:</strong>{" "}
            {candidate?.org}
          </p>

          <p className="text-gray-700">
            <strong className="text-gray-900">Stage:</strong> {candidate?.stage}
          </p>
        </div>

        {/* CHECKS HEADER */}
        <div className="bg-red-100 border border-red-300 rounded-xl px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-900">Your Checks</h3>
        </div>

        {/* CHECK CARDS */}
        {checks.map((chk, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 shadow-sm rounded-xl p-5"
          >
            <h4 className="text-lg font-semibold text-gray-900">
              {chk.check.toUpperCase()}
            </h4>

            <p className="text-gray-700 mt-1">
              <strong>Status:</strong> {chk.status}
            </p>

            {/* ACTION BUTTONS */}
            {chk.status === "NOT_STARTED" && (
              <button
                onClick={() => startCheck(chk.check)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Start Check
              </button>
            )}

            {chk.status === "FAILED" && (
              <button
                onClick={() => retryCheck(chk.check)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Retry Check
              </button>
            )}

            {chk.status === "COMPLETED" && (
              <p className="mt-3 text-green-700 font-semibold">✓ Completed</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
