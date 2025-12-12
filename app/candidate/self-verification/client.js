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
  
  // ★ NEW: notification state
  const [notification, setNotification] = useState(null);

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

  /* ---------------------- NOTIFICATION SYSTEM ---------------------- */
  const showStatusNotification = ({ type, title, checkName, data }) => {
    setNotification({
      type,
      title,
      checkName: checkName.replace(/_/g, ' ').toUpperCase(),
      data,
      timestamp: new Date().toLocaleString()
    });
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      setNotification(null);
    }, 8000);
  };

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
      
      // Enhanced status handling with beautiful notifications
      if (data.status === "COMPLETED") {
        showStatusNotification({
          type: "success",
          title: "✅ Verification Completed Successfully!",
          checkName: checkName,
          data: data.remarks
        });
      } else if (data.status === "FAILED") {
        showStatusNotification({
          type: "error", 
          title: "❌ Verification Failed",
          checkName: checkName,
          data: data.remarks
        });
      } else if (data.status === "PENDING") {
        showStatusNotification({
          type: "pending",
          title: "⏳ Verification Pending Review",
          checkName: checkName,
          data: data.remarks
        });
      } else {
        showStatusNotification({
          type: "info",
          title: `📋 Verification ${data.status}`,
          checkName: checkName,
          data: data.remarks
        });
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
      
      // Enhanced status handling with beautiful notifications
      if (data.status === "COMPLETED") {
        showStatusNotification({
          type: "success",
          title: "🔄 Retry Successful!",
          checkName: checkName,
          data: data.remarks
        });
      } else if (data.status === "FAILED") {
        showStatusNotification({
          type: "error", 
          title: "🔄 Retry Failed",
          checkName: checkName,
          data: data.remarks
        });
      } else if (data.status === "PENDING") {
        showStatusNotification({
          type: "pending",
          title: "🔄 Retry Pending Review",
          checkName: checkName,
          data: data.remarks
        });
      } else {
        showStatusNotification({
          type: "info",
          title: `🔄 Retry ${data.status}`,
          checkName: checkName,
          data: data.remarks
        });
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

  /* ---------------------- UI HELPER FUNCTIONS ---------------------- */
  function formatCheckName(checkType) {
    const checkNames = {
      'pan_verification': 'PAN Card Verification',
      'pan_aadhaar_seeding': 'PAN-Aadhaar Linking',
      'verify_pan_to_uan': 'PAN to UAN Verification',
      'employment_history': 'Employment History',
      'credit_report': 'Credit Report',
      'court_record': 'Court Record Check',
      'address_verification': 'Address Verification',
      'supervisory_check_1': 'Supervisory Reference #1',
      'supervisory_check_2': 'Supervisory Reference #2',
      'education_check_manual': 'Education Verification',
      'ai_education_validation': 'AI Education Validation',
      'ai_cv_validation': 'AI CV Validation'
    };
    return checkNames[checkType] || checkType.replace(/_/g, ' ').toUpperCase();
  }

  function getCheckDescription(checkType) {
    const descriptions = {
      'pan_verification': 'Verify PAN card details and authenticity',
      'pan_aadhaar_seeding': 'Check PAN-Aadhaar linking status',
      'verify_pan_to_uan': 'Verify PAN to UAN mapping',
      'employment_history': 'Verify employment records and history',
      'credit_report': 'Generate credit score and financial history',
      'court_record': 'Check criminal and court records',
      'address_verification': 'Verify current residential address',
      'supervisory_check_1': 'Reference check with previous supervisor',
      'supervisory_check_2': 'Additional supervisory reference',
      'education_check_manual': 'Verify educational qualifications',
      'ai_education_validation': 'AI-powered education document validation',
      'ai_cv_validation': 'AI-powered CV analysis and validation'
    };
    return descriptions[checkType] || 'Verification process';
  }

  function getCheckHeaderColor(status) {
    switch(status) {
      case 'COMPLETED': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'FAILED': return 'bg-gradient-to-r from-red-500 to-rose-600';
      case 'IN_PROGRESS': return 'bg-gradient-to-r from-yellow-500 to-amber-600';
      case 'PENDING': return 'bg-gradient-to-r from-blue-500 to-indigo-600';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-600';
    }
  }

  function getCheckIconBg(status) {
    switch(status) {
      case 'COMPLETED': return 'bg-white/20';
      case 'FAILED': return 'bg-white/20';
      case 'IN_PROGRESS': return 'bg-white/20';
      case 'PENDING': return 'bg-white/20';
      default: return 'bg-white/20';
    }
  }

  function getCheckIcon(status) {
    switch(status) {
      case 'COMPLETED': return <span className="text-white text-lg">✓</span>;
      case 'FAILED': return <span className="text-white text-lg">✗</span>;
      case 'IN_PROGRESS': return <span className="text-white text-lg">⏳</span>;
      case 'PENDING': return <span className="text-white text-lg">⏸️</span>;
      default: return <span className="text-white text-lg">❓</span>;
    }
  }

  function getStatusBadgeStyle(status) {
    switch(status) {
      case 'COMPLETED': return 'bg-white text-green-700 border-white';
      case 'FAILED': return 'bg-white text-red-700 border-white';
      case 'IN_PROGRESS': return 'bg-white text-yellow-700 border-white';
      case 'PENDING': return 'bg-white text-blue-700 border-white';
      default: return 'bg-white text-gray-700 border-white';
    }
  }

  /* ---------------------- RENDER VERIFICATION DETAILS ---------------------- */
  function renderVerificationDetails(chk) {
    const remarks = chk.remarks;
    const checkType = chk.check.toLowerCase();

    if (typeof remarks !== 'object' || !remarks) {
      return (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-800">{remarks || 'No details available'}</p>
        </div>
      );
    }

    // PAN Verification Details
    if (checkType.includes('pan_verification')) {
      return (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h5 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
            💳 PAN Verification Details
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {remarks.pan_number && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">PAN Number:</span>
                <span className="ml-2 text-gray-900 font-mono">{remarks.pan_number}</span>
              </div>
            )}
            {remarks.full_name && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Full Name:</span>
                <span className="ml-2 text-gray-900 font-semibold">{remarks.full_name}</span>
              </div>
            )}
            {remarks.category && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Category:</span>
                <span className="ml-2 text-gray-900 capitalize">{remarks.category}</span>
              </div>
            )}
            {remarks.client_id && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Verification ID:</span>
                <span className="ml-2 text-gray-700 text-xs font-mono">{remarks.client_id}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // PAN-Aadhaar Linking Details
    if (checkType.includes('pan_aadhaar') || checkType.includes('aadhaar_pan')) {
      return (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <h5 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
            🔗 PAN-Aadhaar Linking Details
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {remarks.masked_pan && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Masked PAN:</span>
                <span className="ml-2 text-gray-900 font-mono">{remarks.masked_pan}</span>
              </div>
            )}
            {remarks.linking_status !== undefined && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Linking Status:</span>
                <span className={`ml-2 font-bold ${remarks.linking_status ? 'text-green-600' : 'text-red-600'}`}>
                  {remarks.linking_status ? '✓ Linked' : '✗ Not Linked'}
                </span>
              </div>
            )}
            {remarks.reason && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Reason:</span>
                <span className="ml-2 text-gray-900 capitalize">{remarks.reason}</span>
              </div>
            )}
            {remarks.client_id && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Verification ID:</span>
                <span className="ml-2 text-gray-700 text-xs font-mono">{remarks.client_id}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Employment History Details
    if (checkType.includes('employment')) {
      return (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <h5 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
            💼 Employment History Details
          </h5>
          <div className="space-y-3 text-sm">
            {remarks.uan && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">UAN Number:</span>
                <span className="ml-2 text-gray-900 font-mono">{remarks.uan}</span>
              </div>
            )}
            {remarks.employment_history && Array.isArray(remarks.employment_history) && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600 block mb-2">Employment Records:</span>
                {remarks.employment_history.length === 0 ? (
                  <p className="text-gray-500 italic">No employment records found</p>
                ) : (
                  <div className="space-y-2">
                    {remarks.employment_history.map((emp, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded border-l-4 border-purple-400">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {emp.name && (
                            <div><strong>Name:</strong> {emp.name}</div>
                          )}
                          {emp.establishment_name && (
                            <div><strong>Company:</strong> {emp.establishment_name}</div>
                          )}
                          {emp.date_of_joining && (
                            <div><strong>Joining:</strong> {emp.date_of_joining}</div>
                          )}
                          {emp.date_of_exit && emp.date_of_exit !== '1800-01-01' && (
                            <div><strong>Exit:</strong> {emp.date_of_exit}</div>
                          )}
                          {emp.member_id && (
                            <div><strong>Member ID:</strong> {emp.member_id}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {remarks.client_id && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Verification ID:</span>
                <span className="ml-2 text-gray-700 text-xs font-mono">{remarks.client_id}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Credit Report Details
    if (checkType.includes('credit')) {
      return (
        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
          <h5 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
            📊 Credit Report Details
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {remarks.data?.credit_score && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Credit Score:</span>
                <span className="ml-2 text-gray-900 font-bold text-lg">{remarks.data.credit_score}</span>
              </div>
            )}
            {remarks.data?.name && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="ml-2 text-gray-900 font-semibold">{remarks.data.name}</span>
              </div>
            )}
            {remarks.data?.pan && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">PAN:</span>
                <span className="ml-2 text-gray-900 font-mono">{remarks.data.pan}</span>
              </div>
            )}
            {remarks.data?.mobile && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Mobile:</span>
                <span className="ml-2 text-gray-900">{remarks.data.mobile}</span>
              </div>
            )}
            {remarks.message && (
              <div className="bg-white p-3 rounded border md:col-span-2">
                <span className="font-medium text-gray-600">Status:</span>
                <span className="ml-2 text-gray-900">{remarks.message}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Address Verification Details
    if (checkType.includes('address')) {
      return (
        <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
          <h5 className="text-sm font-bold text-teal-900 mb-3 flex items-center gap-2">
            🏠 Address Verification Details
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {remarks.candidateAddress && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Address:</span>
                <span className="ml-2 text-gray-900">{remarks.candidateAddress}</span>
              </div>
            )}
            {remarks.district && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">District:</span>
                <span className="ml-2 text-gray-900">{remarks.district}</span>
              </div>
            )}
            {remarks.state && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">State:</span>
                <span className="ml-2 text-gray-900">{remarks.state}</span>
              </div>
            )}
            {remarks.pincode && (
              <div className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600">Pincode:</span>
                <span className="ml-2 text-gray-900 font-mono">{remarks.pincode}</span>
              </div>
            )}
            {remarks.message && (
              <div className="bg-white p-3 rounded border md:col-span-2">
                <span className="font-medium text-gray-600">Status:</span>
                <span className="ml-2 text-gray-900">{remarks.message}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Generic/Fallback Display
    return (
      <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
        <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          📋 Verification Details
        </h5>
        <div className="space-y-2 text-sm">
          {remarks.message && (
            <div className="bg-white p-3 rounded border">
              <span className="font-medium text-gray-600">Message:</span>
              <span className="ml-2 text-gray-900">{remarks.message}</span>
            </div>
          )}
          {remarks.message_code && (
            <div className="bg-white p-3 rounded border">
              <span className="font-medium text-gray-600">Code:</span>
              <span className="ml-2 text-gray-900">{remarks.message_code}</span>
            </div>
          )}
          {Object.entries(remarks).map(([key, value]) => {
            if (key === 'message' || key === 'message_code' || key === 'client_id') return null;
            
            return (
              <div key={key} className="bg-white p-3 rounded border">
                <span className="font-medium text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="ml-2 text-gray-900">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        {/* ENHANCED HEADER CARD */}
        <div className="relative overflow-hidden bg-white shadow-2xl border-2 border-gray-100 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="relative p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl text-white">👤</span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome, {candidate?.name}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-lg">🏢</span>
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Organization</p>
                      <p className="text-sm font-bold text-gray-900">{candidate?.org}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-purple-600 text-lg">📋</span>
                    <div>
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Verification Stage</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">{candidate?.stage}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BEAUTIFUL INFO BAR */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="relative px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                <span className="text-3xl">✨</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  🎯 Quick Verification Process
                </h3>
                <div className="space-y-2">
                  <p className="text-white/90 text-base font-medium">
                    📋 You have received verification requests from your organization
                  </p>
                  <p className="text-white/80 text-sm">
                    💡 <strong>Simple Process:</strong> Just click on each verification check below - we'll handle everything automatically!
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-white text-sm">🚀</span>
                      <span className="text-white/90 text-xs font-semibold">One-Click Verification</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-white text-sm">📊</span>
                      <span className="text-white/90 text-xs font-semibold">Real-Time Progress</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-white text-sm">🔒</span>
                      <span className="text-white/90 text-xs font-semibold">Secure & Safe</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED CHECKS HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl text-white">🔍</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Verification Checks</h2>
                  <p className="text-white/80 text-sm">Complete the following verifications to proceed</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/20 rounded-lg px-4 py-2">
                  <p className="text-white/80 text-xs uppercase tracking-wide">Total Checks</p>
                  <p className="text-white text-2xl font-bold">{checks.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED CHECK CARDS */}
        {checks.map((chk, i) => (
          <div
            key={i}
            className="bg-white border-2 border-gray-100 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            {/* Card Header */}
            <div className={`px-6 py-4 ${getCheckHeaderColor(chk.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCheckIconBg(chk.status)}`}>
                    {getCheckIcon(chk.status)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      {formatCheckName(chk.check)}
                    </h4>
                    <p className="text-sm text-white/80">
                      {getCheckDescription(chk.check)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusBadgeStyle(chk.status)}`}
                  >
                    {chk.status === "COMPLETED" && "✓ "}
                    {chk.status === "FAILED" && "✗ "}
                    {chk.status === "IN_PROGRESS" && "⏳ "}
                    {chk.status}
                  </span>
                  {chk.submittedAt && (
                    <p className="text-xs text-white/70 mt-1">
                      {new Date(chk.submittedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Enhanced Verification Details Display */}
              {chk.remarks && (
                <div className="mb-4">
                  {renderVerificationDetails(chk)}
                </div>
              )}

              {/* Attachments Section */}
              {chk.attachments && chk.attachments.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h6 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                    📎 Attachments ({chk.attachments.length})
                  </h6>
                  <div className="space-y-2">
                    {chk.attachments.map((attachment, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-blue-600">📄</span>
                        <a 
                          href={attachment} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Document {idx + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Section */}
              {chk.metadata && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h6 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    ℹ️ Additional Information
                  </h6>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(chk.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Card Footer - Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              {chk.status === "NOT_STARTED" && (
                <button
                  onClick={() => startCheck(chk.check)}
                  disabled={checkLoading === chk.check}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    checkLoading === chk.check
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  }`}
                >
                  {checkLoading === chk.check ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent"></div>
                      Starting Verification...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🚀</span>
                      Start Verification
                    </>
                  )}
                </button>
              )}

              {chk.status === "FAILED" && (
                <button
                  onClick={() => retryCheck(chk.check)}
                  disabled={checkLoading === chk.check}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    checkLoading === chk.check
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  }`}
                >
                  {checkLoading === chk.check ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent"></div>
                      Retrying Verification...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🔄</span>
                      Retry Verification
                    </>
                  )}
                </button>
              )}

              {chk.status === "COMPLETED" && (
                <div className="flex items-center justify-center gap-2 py-3 text-green-700 font-semibold">
                  <span className="text-lg">🎉</span>
                  <span>Verification Completed Successfully!</span>
                </div>
              )}

              {chk.status === "IN_PROGRESS" && (
                <div className="flex items-center justify-center gap-2 py-3 text-yellow-700 font-semibold">
                  <div className="animate-pulse">
                    <span className="text-lg">⏳</span>
                  </div>
                  <span>Verification in Progress...</span>
                </div>
              )}

              {chk.status === "PENDING" && (
                <div className="flex items-center justify-center gap-2 py-3 text-blue-700 font-semibold">
                  <span className="text-lg">⏸️</span>
                  <span>Verification Pending Review</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* BEAUTIFUL STATUS NOTIFICATION MODAL */}
        {notification && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
              notification.type === 'success' ? 'border-l-8 border-green-500' :
              notification.type === 'error' ? 'border-l-8 border-red-500' :
              notification.type === 'pending' ? 'border-l-8 border-yellow-500' :
              'border-l-8 border-blue-500'
            }`}>
              {/* Header */}
              <div className={`p-6 rounded-t-2xl ${
                notification.type === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
                notification.type === 'error' ? 'bg-gradient-to-r from-red-50 to-rose-50' :
                notification.type === 'pending' ? 'bg-gradient-to-r from-yellow-50 to-amber-50' :
                'bg-gradient-to-r from-blue-50 to-indigo-50'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold ${
                    notification.type === 'success' ? 'text-green-800' :
                    notification.type === 'error' ? 'text-red-800' :
                    notification.type === 'pending' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {notification.title}
                  </h3>
                  <button
                    onClick={() => setNotification(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.checkName} • {notification.timestamp}
                </p>
              </div>

              {/* Body */}
              <div className="p-6">
                {notification.data && typeof notification.data === 'object' ? (
                  <div className="space-y-4">
                    {/* Handle PAN Verification Response */}
                    {notification.data.pan_number && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">📋 Verification Details</h4>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          {notification.data.client_id && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Client ID:</span>
                              <span className="font-mono text-xs text-gray-800">{notification.data.client_id}</span>
                            </div>
                          )}
                          {notification.data.pan_number && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">PAN Number:</span>
                              <span className="font-mono font-semibold text-gray-900">{notification.data.pan_number}</span>
                            </div>
                          )}
                          {notification.data.full_name && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Full Name:</span>
                              <span className="font-semibold text-gray-900">{notification.data.full_name}</span>
                            </div>
                          )}
                          {notification.data.category && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <span className="capitalize text-gray-900">{notification.data.category}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Handle other verification types */}
                    {!notification.data.pan_number && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">📋 Response Details</h4>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-32">
                          {JSON.stringify(notification.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Success Message */}
                    {notification.type === 'success' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-medium">
                          🎉 Great! Your verification has been completed successfully. The results have been recorded and will be reviewed by your organization.
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {notification.type === 'error' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 font-medium">
                          ⚠️ This verification encountered an issue. You can try again or contact your HR department for assistance.
                        </p>
                      </div>
                    )}

                    {/* Pending Message */}
                    {notification.type === 'pending' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 font-medium">
                          ⏳ Your verification is pending manual review. You'll be notified once it's processed.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-700">
                    {notification.data || 'Verification completed successfully.'}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => setNotification(null)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    notification.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    notification.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    notification.type === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
