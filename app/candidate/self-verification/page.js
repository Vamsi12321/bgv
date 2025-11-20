export const dynamic = "force-dynamic";   // this one is allowed

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

    if (token) validate();
  }, [token]);

  async function startCheck(checkName) {
    const formData = new FormData();
    formData.append("verificationId", verificationId);
    formData.append("check", checkName);

    await fetch(`https://maihoo.onrender.com/self/verify/check`, {
      method: "POST",
      body: formData,
    });

    refreshChecks();
  }

  async function retryCheck(checkName) {
    const formData = new FormData();
    formData.append("verificationId", verificationId);
    formData.append("check", checkName);

    await fetch(`https://maihoo.onrender.com/self/verify/retryCheck`, {
      method: "POST",
      body: formData,
    });

    refreshChecks();
  }

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

  if (!token) {
    return <div>Unauthorized or invalid link</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white shadow border border-red-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-red-600">
            Welcome, {candidate?.name}
          </h2>
        </div>

        {checks.map((chk, i) => (
          <div key={i} className="bg-white p-5 border rounded-xl">
            <h4>{chk.check.toUpperCase()}</h4>
            <p>Status: {chk.status}</p>

            {chk.status === "NOT_STARTED" && (
              <button onClick={() => startCheck(chk.check)}>Start</button>
            )}

            {chk.status === "FAILED" && (
              <button onClick={() => retryCheck(chk.check)}>Retry</button>
            )}

            {chk.status === "COMPLETED" && (
              <p className="text-green-600 font-semibold">✓ Completed</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
