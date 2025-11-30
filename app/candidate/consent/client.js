"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function ConsentPage({ searchParams }) {
  const token = searchParams.token;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await fetch(
        `${API_BASE}/public/verification-consent/${token}`
      );
      const json = await res.json();
      setData(json);
      setLoading(false);
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

  if (loading) return <p className="p-10">Loading...</p>;

  if (message)
    return (
      <div className="p-10 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">{message.status}</h1>
        <p className="text-gray-700">{message.message}</p>
      </div>
    );

  if (!data || data.detail)
    return (
      <div className="p-10 text-center text-red-600">
        Invalid or expired consent link.
      </div>
    );

  return (
    <div className="p-10 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-[#ff004f]">
        Verification Consent
      </h1>

      <p className="text-gray-700">
        Organization: <strong>{data.organizationName}</strong>
      </p>

      <p className="text-gray-700">
        Candidate: <strong>{data.candidateName}</strong>
      </p>

      <div className="bg-gray-50 p-4 rounded-xl border">
        <h2 className="font-semibold mb-2">Verification Checks</h2>
        <ul className="list-disc ml-6 text-gray-700">
          {data.verificationChecks.map((c, i) => (
            <li key={i}>
              <strong>{c.name}</strong> – {c.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-yellow-50 p-4 rounded-xl border leading-relaxed text-sm">
        <strong>Self-Declaration:</strong>
        <p className="mt-2 text-gray-700">
          I hereby give consent to the organization to perform the verification
          checks listed above. I understand that the information provided by me
          will be used solely for the purpose of background verification.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          disabled={submitting}
          onClick={() => submit(true)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg"
        >
          I Agree
        </button>

        <button
          disabled={submitting}
          onClick={() => submit(false)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg"
        >
          I Do Not Agree
        </button>
      </div>
    </div>
  );
}
