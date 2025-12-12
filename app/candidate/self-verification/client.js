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

  // ★ NEW: loading state per check
  const [checkLoading, setCheckLoading] = useState(null);

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

      const res = await fetch(`/api/proxy/self/verify/start`, {
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
    setCheckLoading(checkName);

    try {
      const formData = new FormData();
      formData.append("verificationId", verificationId);
      formData.append("check", checkName);

      const res = await fetch(`/api/proxy/self/verify/check`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      // Enhanced error handling for detailed API responses
      if (data.status === "FAILED" && data.remarks) {
        let errorMessage = `Check Failed: ${checkName.toUpperCase()}\n\n`;
        
        if (typeof data.remarks === 'object') {
          if (data.remarks.message) {
            errorMessage += `Message: ${data.remarks.message}\n`;
          }
          if (data.remarks.message_code) {
            errorMessage += `Code: ${data.remarks.message_code}\n`;
          }
          if (data.remarks.data) {
            errorMessage += `Details: ${JSON.stringify(data.remarks.data, null, 2)}\n`;
          }
        } else {
          errorMessage += `Remarks: ${data.remarks}`;
        }
        
        alert(errorMessage);
      } else if (data.status === "COMPLETED") {
        let successMessage = `Check Completed: ${checkName.toUpperCase()}\n\n`;
        
        if (data.remarks && typeof data.remarks === 'object') {
          if (data.remarks.reason) {
            successMessage += `Status: ${data.remarks.reason}\n`;
          }
          if (data.remarks.linking_status !== undefined) {
            successMessage += `Linking Status: ${data.remarks.linking_status ? 'Linked' : 'Not Linked'}\n`;
          }
          if (data.remarks.masked_pan) {
            successMessage += `Masked PAN: ${data.remarks.masked_pan}\n`;
          }
        }
        
        alert(successMessage);
      } else {
        alert(`Check Status: ${data.status}\nRemarks: ${data.remarks || 'No additional details'}`);
      }
    } catch (error) {
      alert(`Error starting check: ${error.message}`);
    } finally {
      setCheckLoading(null);
      refreshChecks();
    }
  }

  /* ---------------------- RETRY CHECK ---------------------- */
  async function retryCheck(checkName) {
    setCheckLoading(checkName);

    try {
      const formData = new FormData();
      formData.append("verificationId", verificationId);
      formData.append("check", checkName);

      const res = await fetch(`/api/proxy/self/verify/retryCheck`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      // Enhanced error handling for detailed API responses
      if (data.status === "FAILED" && data.remarks) {
        let errorMessage = `Retry Failed: ${checkName.toUpperCase()}\n\n`;
        
        if (typeof data.remarks === 'object') {
          if (data.remarks.message) {
            errorMessage += `Message: ${data.remarks.message}\n`;
          }
          if (data.remarks.message_code) {
            errorMessage += `Code: ${data.remarks.message_code}\n`;
          }
          if (data.remarks.data) {
            errorMessage += `Details: ${JSON.stringify(data.remarks.data, null, 2)}\n`;
          }
        } else {
          errorMessage += `Remarks: ${data.remarks}`;
        }
        
        alert(errorMessage);
      } else if (data.status === "COMPLETED") {
        let successMessage = `Retry Successful: ${checkName.toUpperCase()}\n\n`;
        
        if (data.remarks && typeof data.remarks === 'object') {
          if (data.remarks.reason) {
            successMessage += `Status: ${data.remarks.reason}\n`;
          }
          if (data.remarks.linking_status !== undefined) {
            successMessage += `Linking Status: ${data.remarks.linking_status ? 'Linked' : 'Not Linked'}\n`;
          }
          if (data.remarks.masked_pan) {
            successMessage += `Masked PAN: ${data.remarks.masked_pan}\n`;
          }
        }
        
        alert(successMessage);
      } else {
        alert(`Retry Status: ${data.status}\nRemarks: ${data.remarks || 'No additional details'}`);
      }
    } catch (error) {
      alert(`Error retrying check: ${error.message}`);
    } finally {
      setCheckLoading(null);
      refreshChecks();
    }
  }

  /* ---------------------- REFRESH CHECKS ---------------------- */
  async function refreshChecks() {
    const formData = new FormData();
    formData.append("token", token);

    const res = await fetch(`/api/proxy/self/verify/start`, {
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

            <div className="mt-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  chk.status === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : chk.status === "FAILED"
                    ? "bg-red-100 text-red-800"
                    : chk.status === "IN_PROGRESS"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {chk.status === "COMPLETED" && "✓ "}
                {chk.status === "FAILED" && "✗ "}
                {chk.status === "IN_PROGRESS" && "⏳ "}
                {chk.status}
              </span>
            </div>

            {/* Enhanced Remarks Display */}
            {chk.remarks && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Details:</h5>
                {typeof chk.remarks === 'object' ? (
                  <div className="space-y-2 text-sm">
                    {chk.remarks.message && (
                      <div>
                        <span className="font-medium text-gray-600">Message:</span>
                        <span className="ml-2 text-gray-800">{chk.remarks.message}</span>
                      </div>
                    )}
                    {chk.remarks.message_code && (
                      <div>
                        <span className="font-medium text-gray-600">Code:</span>
                        <span className="ml-2 text-gray-800">{chk.remarks.message_code}</span>
                      </div>
                    )}
                    {chk.remarks.reason && (
                      <div>
                        <span className="font-medium text-gray-600">Reason:</span>
                        <span className="ml-2 text-gray-800">{chk.remarks.reason}</span>
                      </div>
                    )}
                    {chk.remarks.linking_status !== undefined && (
                      <div>
                        <span className="font-medium text-gray-600">Linking Status:</span>
                        <span className={`ml-2 font-medium ${chk.remarks.linking_status ? 'text-green-600' : 'text-red-600'}`}>
                          {chk.remarks.linking_status ? 'Linked' : 'Not Linked'}
                        </span>
                      </div>
                    )}
                    {chk.remarks.masked_pan && (
                      <div>
                        <span className="font-medium text-gray-600">Masked PAN:</span>
                        <span className="ml-2 text-gray-800 font-mono">{chk.remarks.masked_pan}</span>
                      </div>
                    )}
                    {chk.remarks.data && (
                      <div>
                        <span className="font-medium text-gray-600">Additional Data:</span>
                        <pre className="ml-2 mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(chk.remarks.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-800">{chk.remarks}</p>
                )}
              </div>
            )}

            {/* ACTION BUTTONS */}
            {chk.status === "NOT_STARTED" && (
              <button
                onClick={() => startCheck(chk.check)}
                disabled={checkLoading === chk.check}
                className={`mt-4 px-4 py-2 rounded-lg text-white 
                  ${
                    checkLoading === chk.check
                      ? "bg-red-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {checkLoading === chk.check ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4" /> Starting...
                  </div>
                ) : (
                  "Start Check"
                )}
              </button>
            )}

            {chk.status === "FAILED" && (
              <button
                onClick={() => retryCheck(chk.check)}
                disabled={checkLoading === chk.check}
                className={`mt-4 px-4 py-2 rounded-lg text-white 
                  ${
                    checkLoading === chk.check
                      ? "bg-red-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {checkLoading === chk.check ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4" /> Retrying...
                  </div>
                ) : (
                  "Retry Check"
                )}
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
