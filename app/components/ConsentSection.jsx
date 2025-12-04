"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";

export default function ConsentSection({ candidateId }) {
  const [consentStatus, setConsentStatus] = useState(null);
  const [sendingConsent, setSendingConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(false);

  /* -------------------------------------------
      FETCH CONSENT STATUS
  ------------------------------------------- */
  const fetchConsentStatus = async () => {
    if (!candidateId) return;

    try {
      setCheckingConsent(true);
      const res = await fetch(
        `/api/proxy/secure/verification/${candidateId}/consent-status`,
        { credentials: "include" }
      );

      const data = await res.json();
      if (res.ok) setConsentStatus(data);
      else setConsentStatus(null);
    } finally {
      setCheckingConsent(false);
    }
  };

  useEffect(() => {
    fetchConsentStatus();
  }, [candidateId]);

  /* -------------------------------------------
      SEND / RESEND CONSENT EMAIL
  ------------------------------------------- */
  const sendConsentEmail = async () => {
    if (!candidateId) return;

    try {
      setSendingConsent(true);

      const res = await fetch(
        `/api/proxy/secure/verification/${candidateId}/send-consent`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationChecks: [
              {
                name: "Employment Verification",
                description: "Verify employment history, job titles, and dates",
              },
            ],
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Consent email sent successfully!");

        // 🔥 IMMEDIATE UI UPDATE — Do NOT wait for backend
        setConsentStatus((prev) => ({
          ...prev,
          consentStatus: "PENDING_CONSENT",
        }));

        // 🔄 After a moment, poll backend for real-time update
        setTimeout(fetchConsentStatus, 15000);
      } else {
        alert(data.detail || "Failed to send consent email");
      }
    } finally {
      setSendingConsent(false);
    }
  };

  /* -------------------------------------------
      RESEND ALLOWED CONDITIONS
  ------------------------------------------- */

  // ❌ DO NOT show resend during PENDING
  const allowResend =
    consentStatus?.consentStatus === "NOT_REQUESTED" ||
    consentStatus?.consentStatus === "TOKEN_EXPIRED" ||
    consentStatus?.consentStatus === "CONSENT_DENIED";

  /* -------------------------------------------
      UI COMPONENT
  ------------------------------------------- */
  return (
    <div className="bg-white border p-6 rounded-xl shadow mt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Candidate Consent
      </h3>

      {/* STATUS LOADING */}
      {checkingConsent ? (
        <p className="text-gray-600">Checking consent status...</p>
      ) : consentStatus ? (
        <>
          {/* MAIN STATUS */}
          <p className="text-sm">
            Status:{" "}
            <span className="font-semibold">
              {consentStatus.consentStatus || "Unknown"}
            </span>
          </p>

          {/* CONDITIONS */}
          {consentStatus.consentStatus === "CONSENT_GIVEN" && (
            <p className="mt-2 text-green-600 font-medium">
              ✔ Candidate has provided consent.
            </p>
          )}

          {consentStatus.consentStatus === "CONSENT_DENIED" && (
            <p className="mt-2 text-red-600 font-medium">
              ✖ Candidate denied consent.
            </p>
          )}

          {consentStatus.consentStatus === "PENDING_CONSENT" && (
            <p className="mt-2 text-yellow-600 font-medium">
              ⏳ Waiting for candidate to respond.
            </p>
          )}

          {consentStatus.consentStatus === "TOKEN_EXPIRED" && (
            <p className="mt-2 text-red-600 font-medium">
              ⚠ Token expired. You must resend the consent email.
            </p>
          )}

          {/* RESEND BUTTON */}
          {allowResend && (
            <button
              onClick={sendConsentEmail}
              disabled={sendingConsent}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
            >
              {sendingConsent ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <PlusCircle size={16} /> Resend Consent Email
                </>
              )}
            </button>
          )}
        </>
      ) : (
        /* FIRST TIME */
        <button
          onClick={sendConsentEmail}
          disabled={sendingConsent}
          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
        >
          {sendingConsent ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending...
            </>
          ) : (
            <>
              <PlusCircle size={16} /> Send Consent Email
            </>
          )}
        </button>
      )}
    </div>
  );
}
