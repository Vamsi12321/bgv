"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function ConsentClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // ------------------ NO TOKEN ------------------
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white shadow-lg border border-red-200 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600">
            Unauthorized Access
          </h2>

          <p className="text-gray-700 mt-3">
            This consent link is invalid or missing.
          </p>

          <p className="text-gray-700 mt-1">
            Please request your HR to resend the consent link.
          </p>
        </div>
      </div>
    );
  }

  // ------------------ FETCH CONSENT DETAILS ------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/public/verification-consent/${token}`
        );
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async (value) => {
    setSubmitting(true);

    const res = await fetch(
      `${API_BASE}/public/verification-consent/${token}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentGiven: value }),
      }
    );

    const json = await res.json();
    setMessage(json);
    setSubmitting(false);
  };

  // ------------------ LOADING ------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="animate-spin text-red-600" />
          <span>Loading your consent details...</span>
        </div>
      </div>
    );
  }

  // ------------------ AFTER SUBMIT ------------------
  if (message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white shadow-lg border rounded-xl p-8 max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">
            {message.status}
          </h1>
          <p className="text-gray-700">{message.message}</p>
        </div>
      </div>
    );
  }

  // ------------------ INVALID / EXPIRED ------------------
  if (!data || data.detail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white shadow-lg border border-red-200 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600">
            Invalid or Expired Link
          </h2>

          <p className="text-gray-700 mt-3">
            This consent link is invalid or has expired.
          </p>

          <p className="text-gray-700 mt-1">
            Please contact your HR to get a new consent link.
          </p>
        </div>
      </div>
    );
  }

  // ------------------ MAIN UI ------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6 bg-white shadow-lg border border-gray-200 rounded-2xl p-8">
        {/* HEADER */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold text-[#ff004f]">
            Verification Consent
          </h1>

          <p className="text-gray-700 mt-3">
            Organization:{" "}
            <span className="font-semibold">{data.organizationName}</span>
          </p>

          <p className="text-gray-700">
            Candidate:{" "}
            <span className="font-semibold">{data.candidateName}</span>
          </p>
        </div>

        {/* CHECK DETAILS */}
        <div className="bg-gray-50 p-4 rounded-xl border">
          <h2 className="font-semibold mb-2 text-lg">
            Verification Checks Requested
          </h2>
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            {data.verificationChecks.map((c, i) => (
              <li key={i}>
                <strong>{c.name}</strong> – {c.description}
              </li>
            ))}
          </ul>
        </div>

        {/* CONSENT DECLARATION */}
        <div className="bg-yellow-50 p-5 rounded-xl border leading-relaxed text-sm">
          <strong className="text-gray-900">Declaration &amp; Consent</strong>

          <p className="mt-3 text-gray-800">
            This organization is requesting your consent to collect, verify, and
            validate your personal, identity, employment, education, and other
            relevant information required for the purpose of{" "}
            <strong>Background Verification (BGV)</strong>.
          </p>

          <p className="mt-3 text-gray-800">
            By giving consent, you authorize{" "}
            <strong>{data.organizationName}</strong> and its verification
            partners to:
          </p>

          <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
            <li>Collect and process your submitted personal information.</li>
            <li>
              Contact previous employers, institutions, or government databases
              for verification purposes.
            </li>
            <li>
              Conduct primary, secondary, and final verification checks as
              listed above.
            </li>
            <li>
              Store verification results securely for compliance and audit
              needs.
            </li>
          </ul>

          <p className="mt-4 text-gray-800">
            <strong>I hereby declare: </strong>I am voluntarily providing my
            consent for the above background verification checks. I understand
            that refusal to provide consent may affect my employment or
            onboarding process with the organization.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-4 mt-4">
          <button
            disabled={submitting}
            onClick={() => submit(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg text-lg font-medium flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Submitting...
              </>
            ) : (
              <>✔ I Agree &amp; Give Consent</>
            )}
          </button>

          <button
            disabled={submitting}
            onClick={() => submit(false)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg text-lg font-medium disabled:opacity-70"
          >
            ✖ I Do Not Agree
          </button>
        </div>
      </div>
    </div>
  );
}
