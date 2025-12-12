"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";



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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white shadow-2xl border-2 border-red-200 rounded-2xl p-8 max-w-lg text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <span className="text-4xl text-white">🚫</span>
          </div>
          
          <h2 className="text-3xl font-bold text-red-600 mb-4">
            Unauthorized Access
          </h2>

          <div className="space-y-4 text-gray-700">
            <p className="text-lg">
              This consent link is invalid or missing.
            </p>

            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔗</span>
                <div>
                  <p className="font-semibold text-red-800 mb-2">
                    Access Required:
                  </p>
                  <p className="text-red-700 text-sm leading-relaxed">
                    You need a valid consent link to access this page. 
                    Please request your HR department to resend the consent link via email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ FETCH CONSENT DETAILS ------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/proxy/public/verification-consent/${token}`
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
      `/api/proxy/public/verification-consent/${token}/submit`,
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <Loader2 className="animate-spin text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Loading Consent Details
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Please wait while we fetch your verification consent information...
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ AFTER SUBMIT ------------------
  if (message) {
    const isSuccess = message.status?.toLowerCase().includes('success') || message.status?.toLowerCase().includes('consent given');
    const isDeclined = message.status?.toLowerCase().includes('declined') || message.status?.toLowerCase().includes('denied');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
        <div className={`bg-white shadow-2xl border-2 rounded-2xl p-8 max-w-2xl mx-auto text-center ${
          isSuccess ? 'border-green-200' : isDeclined ? 'border-red-200' : 'border-gray-200'
        }`}>
          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6 ${
            isSuccess ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 
            isDeclined ? 'bg-gradient-to-br from-red-500 to-rose-600' : 
            'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            <span className="text-4xl text-white">
              {isSuccess ? '✅' : isDeclined ? '❌' : '📋'}
            </span>
          </div>
          
          <h1 className={`text-3xl font-bold mb-4 ${
            isSuccess ? 'text-green-800' : isDeclined ? 'text-red-800' : 'text-gray-900'
          }`}>
            {message.status}
          </h1>
          
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            {message.message}
          </p>
          
          {isSuccess && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 justify-center">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-green-800 font-semibold">
                    Thank you for providing your consent!
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Your organization will now proceed with the background verification process.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {isDeclined && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 justify-center">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="text-red-800 font-semibold">
                    Consent Declined
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    Please contact your HR department if you have any questions or concerns.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ------------------ INVALID / EXPIRED ------------------
  if (!data || data.detail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white shadow-2xl border-2 border-red-200 rounded-2xl p-8 max-w-lg text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <span className="text-4xl text-white">⚠️</span>
          </div>
          
          <h2 className="text-3xl font-bold text-red-600 mb-4">
            Invalid or Expired Link
          </h2>

          <div className="space-y-4 text-gray-700">
            <p className="text-lg">
              This consent link is invalid or has expired.
            </p>

            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-semibold text-red-800 mb-2">
                    What to do next:
                  </p>
                  <p className="text-red-700 text-sm leading-relaxed">
                    Please contact your HR department to get a new consent link. 
                    They will be able to resend the verification consent request with a valid link.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ MAIN UI ------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* ENHANCED HEADER CARD */}
        <div className="relative overflow-hidden bg-white shadow-2xl border-2 border-gray-100 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff004f]/5 via-purple-500/5 to-blue-500/5"></div>
          <div className="relative p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl text-white">📋</span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Verification Consent Required
                </h1>
                <p className="text-gray-600 text-lg">
                  Please review and provide your consent for background verification
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-lg">🏢</span>
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Organization</p>
                      <p className="text-sm font-bold text-gray-900">{data.organizationName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-purple-600 text-lg">👤</span>
                    <div>
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Candidate</p>
                      <p className="text-sm font-bold text-gray-900">{data.candidateName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BEAUTIFUL INFO BAR */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="relative px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                <span className="text-3xl">🔒</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  🛡️ Secure Consent Process
                </h3>
                <div className="space-y-2">
                  <p className="text-white/90 text-base font-medium">
                    📋 Your organization has requested consent for background verification
                  </p>
                  <p className="text-white/80 text-sm">
                    💡 <strong>Simple & Secure:</strong> Review the verification details below and provide your consent with a single click
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-white text-sm">🔐</span>
                      <span className="text-white/90 text-xs font-semibold">Secure Process</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-white text-sm">⚡</span>
                      <span className="text-white/90 text-xs font-semibold">Quick Decision</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-white text-sm">📊</span>
                      <span className="text-white/90 text-xs font-semibold">Transparent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED VERIFICATION CHECKS */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl text-white">🔍</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Verification Checks Requested
                </h2>
                <p className="text-blue-100 text-sm">
                  The following checks will be performed as part of your background verification
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid gap-4">
              {data.verificationChecks.map((c, i) => (
                <div key={i} className="bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 font-bold text-sm">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {c.name}
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {c.description}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-semibold text-green-800">
                    Total Verification Checks: {data.verificationChecks.length}
                  </p>
                  <p className="text-green-700 text-sm">
                    All checks are conducted securely and in compliance with privacy regulations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED CONSENT DECLARATION */}
        <div className="bg-white border-2 border-amber-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl text-white">📜</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Declaration & Consent Agreement
                </h2>
                <p className="text-amber-100 text-sm">
                  Please read carefully before providing your consent
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Purpose Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Purpose of Verification</h3>
                  <p className="text-blue-800 leading-relaxed">
                    <strong>{data.organizationName}</strong> is requesting your consent to collect, verify, and
                    validate your personal, identity, employment, education, and other
                    relevant information required for <strong>Background Verification (BGV)</strong> purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Authorization Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔐</span>
                <div>
                  <h3 className="font-bold text-purple-900 mb-3">Authorization Granted</h3>
                  <p className="text-purple-800 mb-3">
                    By giving consent, you authorize <strong>{data.organizationName}</strong> and its verification partners to:
                  </p>
                  <div className="grid gap-3">
                    {[
                      "Collect and process your submitted personal information",
                      "Contact previous employers, institutions, or government databases for verification purposes", 
                      "Conduct primary, secondary, and final verification checks as listed above",
                      "Store verification results securely for compliance and audit needs"
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/70 rounded-lg p-3">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">{i + 1}</span>
                        </div>
                        <p className="text-purple-800 text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Declaration Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✋</span>
                <div>
                  <h3 className="font-bold text-green-900 mb-2">Your Declaration</h3>
                  <p className="text-green-800 leading-relaxed">
                    <strong>I hereby declare:</strong> I am voluntarily providing my
                    consent for the above background verification checks. I understand
                    that refusal to provide consent may affect my employment or
                    onboarding process with the organization.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Privacy & Security</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Your personal information will be handled in accordance with applicable privacy laws and regulations. 
                    All data is encrypted and stored securely. You have the right to know how your information is being used.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED ACTION BUTTONS */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Ready to Proceed?
            </h3>
            <p className="text-gray-600">
              Please make your decision regarding the background verification consent
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Agree Button */}
            <button
              disabled={submitting}
              onClick={() => submit(true)}
              className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-70 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-3">
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xl">✓</span>
                    </div>
                    <div className="text-left">
                      <div>I Agree & Give Consent</div>
                      <div className="text-sm text-green-100 font-normal">Proceed with verification</div>
                    </div>
                  </>
                )}
              </div>
            </button>

            {/* Decline Button */}
            <button
              disabled={submitting}
              onClick={() => submit(false)}
              className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white p-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-70 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">✗</span>
                </div>
                <div className="text-left">
                  <div>I Do Not Agree</div>
                  <div className="text-sm text-red-100 font-normal">Decline verification</div>
                </div>
              </div>
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-blue-800 font-medium text-sm">
                  <strong>Need Help?</strong> If you have questions about this consent process, please contact your HR department or the organization directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
