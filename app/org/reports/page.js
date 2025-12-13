"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Loader2,
  Download,
  FileText,
  Building2,
  CheckCircle,
  XCircle,
  Brain,
} from "lucide-react";

import { jsPDF } from "jspdf";
import { safeHtml2Canvas } from "@/utils/safeHtml2Canvas";
import { useOrgState } from "../../context/OrgStateContext";

const SERVICE_ICONS = {
  pan_aadhaar_seeding: "🪪",
  pan_verification: "📄",
  employment_history: "👔",
  aadhaar_to_uan: "🔗",
  credit_report: "💳",
  court_record: "⚖️",
};

const formatServiceName = (raw = "") =>
  raw
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const isAIValidationCheck = (checkName) => {
  return (
    checkName === "ai_cv_validation" || checkName === "ai_education_validation"
  );
};

const getServiceCertId = (stage, checkName, candId) =>
  `cert-${stage}-${checkName.replace(/[^a-z0-9]/gi, "-")}-${candId}`;

async function downloadSingleCert(id, fileName, setDownloading, attachments = []) {
  try {
    setDownloading(true);
    const element = document.getElementById(id);
    if (!element) {
      alert("Report not ready.");
      return;
    }

    const canvas = await safeHtml2Canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pdfWidth = 595.28;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);

    if (attachments && attachments.length > 0) {
      const attachmentLinks = element.querySelectorAll('a[href^="http"]');
      attachmentLinks.forEach((link, idx) => {
        if (idx < attachments.length) {
          const rect = link.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const x = ((rect.left - elementRect.left) * pdfWidth) / element.offsetWidth;
          const y = ((rect.top - elementRect.top) * pdfWidth) / element.offsetWidth;
          const width = (rect.width * pdfWidth) / element.offsetWidth;
          const height = (rect.height * pdfWidth) / element.offsetWidth;
          pdf.link(x, y, width, height, { url: attachments[idx] });
        }
      });
    }

    pdf.save(fileName);
  } finally {
    setDownloading(false);
  }
}

async function mergeAllCertificates(ids, fileName, setDownloading, candidate, verification) {
  try {
    setDownloading(true);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const indexDiv = document.createElement("div");
    indexDiv.id = "temp-index-page";
    indexDiv.style.position = "absolute";
    indexDiv.style.left = "-9999px";
    indexDiv.style.top = "0";
    document.body.appendChild(indexDiv);

    const allChecks = [];
    const stages = verification?.stages || {};

    if (stages.primary) {
      stages.primary.forEach((chk) => {
        allChecks.push({ ...chk, stage: "Primary" });
      });
    }
    if (stages.secondary) {
      stages.secondary.forEach((chk) => {
        allChecks.push({ ...chk, stage: "Secondary" });
      });
    }
    if (stages.final) {
      stages.final.forEach((chk) => {
        allChecks.push({ ...chk, stage: "Final" });
      });
    }

    // Build verification summary table rows
    const tableRows = allChecks.map((chk, index) => {
      const status = chk.status || "PENDING";
      let statusText = "";
      let statusColor = "";

      if (status === "COMPLETED") {
        statusText = "✓ Verified";
        statusColor = "#22c55e";
      } else if (status === "FAILED") {
        statusText = "✗ Failed";
        statusColor = "#ef4444";
      } else {
        statusText = "○ Pending";
        statusColor = "#9ca3af";
      }

      return '<tr style="background: ' + (index % 2 === 0 ? "#ffffff" : "#f9f9f9") + ';">' +
        '<td style="padding: 10px 12px; font-size: 12px; color: #000; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">' + chk.stage + '</td>' +
        '<td style="padding: 10px 12px; font-size: 12px; color: #000; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">' + formatServiceName(chk.check) + '</td>' +
        '<td style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: ' + statusColor + '; border-bottom: 1px solid #e0e0e0;">' + statusText + '</td>' +
        '</tr>';
    }).join("");

    indexDiv.innerHTML = 
      '<div style="width: 860px; min-height: 1120px; padding: 40px 50px 60px 50px; background: #ffffff; font-family: Arial, sans-serif; color: #000; position: relative; overflow: hidden;">' +
      '<img src="/logos/maihooMain.png" alt="watermark" style="position: absolute; top: 300px; left: 50%; transform: translateX(-50%); opacity: 0.08; width: 750px; height: 750px; object-fit: contain; pointer-events: none; z-index: 1;" />' +
      '<div style="position: relative; z-index: 2;">' +
      '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">' +
      '<div style="flex-shrink: 0; margin-top: 5px;"><img src="/logos/maihooMain.png" alt="logo" style="max-height: 180px; max-width: 450px; height: auto; width: auto; display: block; object-fit: contain;" /></div>' +
      '<div style="display: flex; flex-direction: column; justify-content: flex-start; margin-top: 55px; flex: 1; padding: 0 20px;"><h1 style="font-size: 26px; font-weight: bold; color: #000; margin: 0 0 8px 0; line-height: 1.3;">All Verification Reports</h1><p style="font-size: 14px; color: #555; margin: 0; line-height: 1.4;">Comprehensive Background Verification Summary</p></div>' +
      '<div style="flex-shrink: 0; margin-top: 5px; text-align: right; font-size: 12px; color: #333; line-height: 1.8;"><p style="margin: 0 0 5px 0; font-weight: bold;">📞 +91-8235-279-810</p><p style="margin: 0 0 5px 0;">✉ info@maihootech.co.in</p><p style="margin: 0;">🌐 maihootech.co.in</p></div>' +
      '</div>' +
      '<div style="background: #f8f9fa; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 30px;"><h2 style="font-size: 16px; font-weight: bold; color: #000; margin: 0 0 15px 0; border-bottom: 2px solid #ddd; padding-bottom: 8px;">Candidate Information</h2>' +
      '<table style="width: 100%; border-collapse: collapse;">' +
      '<tr><td style="padding: 8px 0; font-size: 13px; color: #333; font-weight: bold; width: 150px;">Name:</td><td style="padding: 8px 0; font-size: 13px; color: #000;">' + candidate.firstName + ' ' + candidate.lastName + '</td></tr>' +
      '<tr><td style="padding: 8px 0; font-size: 13px; color: #333; font-weight: bold;">Email:</td><td style="padding: 8px 0; font-size: 13px; color: #000;">' + (candidate.email || "N/A") + '</td></tr>' +
      '<tr><td style="padding: 8px 0; font-size: 13px; color: #333; font-weight: bold;">Phone:</td><td style="padding: 8px 0; font-size: 13px; color: #000;">' + (candidate.phone || "N/A") + '</td></tr>' +
      '<tr><td style="padding: 8px 0; font-size: 13px; color: #333; font-weight: bold;">Organization:</td><td style="padding: 8px 0; font-size: 13px; color: #000;">' + (candidate.organizationName || "N/A") + '</td></tr>' +
      '</table></div>' +
      '<div style="margin-bottom: 30px;"><h2 style="font-size: 16px; font-weight: bold; color: #000; margin: 0 0 15px 0; border-bottom: 2px solid #ddd; padding-bottom: 8px;">Verification Summary</h2>' +
      '<table style="width: 100%; border-collapse: collapse; border: 2px solid #e0e0e0;">' +
      '<thead><tr style="background: #f0f0f0;">' +
      '<th style="padding: 12px; text-align: left; font-size: 13px; font-weight: bold; color: #000; border-bottom: 2px solid #ddd; border-right: 1px solid #ddd;">BGV Check</th>' +
      '<th style="padding: 12px; text-align: left; font-size: 13px; font-weight: bold; color: #000; border-bottom: 2px solid #ddd; border-right: 1px solid #ddd;">Service</th>' +
      '<th style="padding: 12px; text-align: left; font-size: 13px; font-weight: bold; color: #000; border-bottom: 2px solid #ddd;">Status</th>' +
      '</tr></thead>' +
      '<tbody>' + tableRows + '</tbody>' +
      '</table></div>' +
      '<div style="margin-top: 80px; padding-top: 20px; border-top: 2px solid #e0e0e0;"><div style="font-size: 11px; color: #666; margin-bottom: 15px;">' +
      '<p style="margin: 5px 0;">Generated on: ' + new Date().toLocaleString() + '</p>' +
      '<p style="margin: 5px 0;">Total Verifications: ' + allChecks.length + '</p>' +
      '<p style="margin: 5px 0;">Completed: ' + allChecks.filter((c) => c.status === "COMPLETED").length + '</p>' +
      '</div><div style="margin-top: 120px; padding-top: 15px; border-top: 2px solid #272626ff; font-size: 12px; color: #dc3545; text-align: center; font-weight: 600; line-height: 1.4;">' +
      '<p style="margin: 0;">Maihoo Technologies Private Limited, Vaishnavi\'s Cynosure, 2-48/5/6, 8th Floor, Opp RTCC, Telecom Nagar Extension, Gachibowli-500032</p>' +
      '</div></div></div></div>';

    await new Promise((resolve) => setTimeout(resolve, 500));

    const indexCanvas = await safeHtml2Canvas(indexDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const indexImg = indexCanvas.toDataURL("image/png");
    const pdfWidth = 595.28;
    const indexPdfHeight = (indexCanvas.height * pdfWidth) / indexCanvas.width;

    pdf.addImage(indexImg, "PNG", 0, 0, pdfWidth, indexPdfHeight);
    document.body.removeChild(indexDiv);

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;

      const canvas = await safeHtml2Canvas(el, { scale: 2 });
      const img = canvas.toDataURL("image/png");
      const certPdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addPage();
      pdf.addImage(img, "PNG", 0, 0, pdfWidth, certPdfHeight);

      const attachmentLinks = el.querySelectorAll('a[href^="http"]');
      attachmentLinks.forEach((link) => {
        const rect = link.getBoundingClientRect();
        const elementRect = el.getBoundingClientRect();
        const x = ((rect.left - elementRect.left) * pdfWidth) / el.offsetWidth;
        const y = ((rect.top - elementRect.top) * pdfWidth) / el.offsetWidth;
        const width = (rect.width * pdfWidth) / el.offsetWidth;
        const height = (rect.height * pdfWidth) / el.offsetWidth;
        pdf.link(x, y, width, height, { url: link.href });
      });
    }

    pdf.save(fileName);
  } finally {
    setDownloading(false);
  }
}

export default function OrgReportsPage() {
  const { reportsData: candidates, setReportsData: setCandidates } = useOrgState();
  const [orgName, setOrgName] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("bgvUser");
    if (!stored) return;

    try {
      const user = JSON.parse(stored);
      setOrgName(user.organizationName);

      if (user.organizationId) {
        fetchCandidates(user.organizationId);
      }
    } catch (err) {
      console.error("User parse error:", err);
    }
  }, []);

  const fetchCandidates = async (orgId) => {
    if (candidates.length > 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/proxy/secure/getCandidates?orgId=${orgId}`, { credentials: "include" });
      const data = await res.json();

      const enriched = await Promise.all(
        (data.candidates || []).map(async (c) => {
          try {
            const verRes = await fetch(`/api/proxy/secure/getVerifications?candidateId=${c._id}`, { credentials: "include" });
            const verData = await verRes.json();
            return { ...c, verification: verData.verifications?.[0] || null };
          } catch {
            return { ...c, verification: null };
          }
        })
      );

      setCandidates(enriched);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#ff004f]/10 to-[#ff004f]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[#ff004f]/8 to-[#ff004f]/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-[#ff004f]/5 to-[#ff004f]/2 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <FileText size={24} className="text-black" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  Reports Dashboard
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  Comprehensive verification reports & analytics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/50 shadow-lg">
              <Building2 size={20} className="text-black" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Organization</p>
                <p className="font-bold text-slate-800">{orgName}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{candidates.length}</p>
                  <p className="text-xs text-slate-600 font-medium">Total Candidates</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {candidates.filter(c => c.verification?.overallStatus === "COMPLETED").length}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Completed</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                  <Loader2 size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {candidates.filter(c => c.verification?.overallStatus === "IN_PROGRESS").length}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">In Progress</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#ff004f] to-red-500 rounded-lg">
                  <XCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {candidates.filter(c => {
                      const v = c.verification || {};
                      const allChecks = [
                        ...(v.stages?.primary || []),
                        ...(v.stages?.secondary || []),
                        ...(v.stages?.final || [])
                      ];
                      return allChecks.some(chk => chk.status === "FAILED");
                    }).length}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">With Issues</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff004f] via-red-400 to-red-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-[#ff004f] to-red-500 rounded-2xl shadow-lg flex-shrink-0 animate-pulse">
                <Brain size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold bg-gradient-to-r from-[#ff004f] to-red-600 bg-clip-text text-transparent mb-2">
                  🤖 AI-Powered Validation Reports
                </h3>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Advanced AI validation reports for <strong className="text-purple-600">CV Analysis</strong> and{" "}
                  <strong className="text-pink-600">Education Verification</strong> are available on their dedicated pages with enhanced analytics and insights.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                    <span>📄</span>
                    <span>AI-CV-Verification</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                    <span>🎓</span>
                    <span>AI-Edu-Verification</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#ff004f] rounded-full animate-spin"></div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-xl font-semibold bg-gradient-to-r from-[#ff004f] to-red-600 bg-clip-text text-transparent">
                Fetching Reports
              </p>
              <p className="text-slate-600 mt-1">Please wait while we gather your data...</p>
            </div>
          </div>
        )}

        {!loading && candidates.map((c, index) => {
          const v = c.verification || {};
          const primary = v.stages?.primary || [];
          const secondary = v.stages?.secondary || [];
          const final = v.stages?.final || [];

          const totalChecks = primary.length + secondary.length + final.length;
          const completedChecks = [...primary, ...secondary, ...final].filter(
            (chk) => chk.status === "COMPLETED"
          ).length;
          const failedChecks = [...primary, ...secondary, ...final].filter(
            (chk) => chk.status === "FAILED"
          ).length;

          return (
            <div
              key={c._id}
              className="group relative mb-8"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff004f]/10 via-[#ff004f]/5 to-[#ff004f]/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                <div
                  className="p-3 cursor-pointer bg-gradient-to-r from-transparent via-white/20 to-transparent hover:from-[#ff004f]/5 hover:via-[#ff004f]/3 hover:to-[#ff004f]/5 transition-all duration-300"
                  onClick={() => toggle(c._id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#ff004f] via-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg transform transition-transform duration-300 group-hover:scale-110">
                          {c.firstName?.charAt(0)}
                          {c.lastName?.charAt(0)}
                        </div>
                        {v?.overallStatus === "COMPLETED" && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle size={12} className="text-white" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-800">
                            {c.firstName} {c.lastName}
                          </h3>
                          {failedChecks > 0 && (
                            <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-semibold">
                              <XCircle size={12} />
                              {failedChecks} Issues
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="font-medium">ID:</span>
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                              {c._id.slice(-8)}
                            </code>
                          </div>
                          
                          {totalChecks > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#ff004f] to-green-500 transition-all duration-500"
                                  style={{ width: `${(completedChecks / totalChecks) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-semibold text-slate-600">
                                {completedChecks}/{totalChecks}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {v?.overallStatus && (
                        <div className={`px-3 py-1 rounded-xl font-bold text-xs shadow-lg transition-all duration-300 ${
                          v.overallStatus === "COMPLETED"
                            ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                            : v.overallStatus === "IN_PROGRESS"
                            ? "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200"
                            : "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border border-slate-200"
                        }`}>
                          {v.overallStatus === "COMPLETED" && "✅ "}
                          {v.overallStatus === "IN_PROGRESS" && "⏳ "}
                          {v.overallStatus.replace("_", " ")}
                        </div>
                      )}
                      
                      <div className={`p-2 rounded-xl transition-all duration-300 shadow-lg ${
                        expanded === c._id
                          ? "bg-gradient-to-br from-[#ff004f] to-red-600 text-white shadow-lg"
                          : "bg-white/80 text-slate-600 hover:bg-slate-100"
                      }`}>
                        <div className={`transition-transform duration-300 ${expanded === c._id ? "rotate-180" : ""}`}>
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {expanded === c._id && (
                  <div className="border-t border-slate-200/50 bg-gradient-to-b from-transparent to-slate-50/30">
                    <div className="p-4 space-y-6">
                      <div className="absolute -left-[9999px] -top-[9999px]">
                        {primary
                          .filter((chk) => !isAIValidationCheck(chk.check))
                          .map((chk) => (
                            <ServiceCertificate
                              key={getServiceCertId("primary", chk.check, c._id)}
                              id={getServiceCertId("primary", chk.check, c._id)}
                              candidate={c}
                              orgName={orgName}
                              check={chk}
                              stage="primary"
                            />
                          ))}
                        {secondary
                          .filter((chk) => !isAIValidationCheck(chk.check))
                          .map((chk) => (
                            <ServiceCertificate
                              key={getServiceCertId("secondary", chk.check, c._id)}
                              id={getServiceCertId("secondary", chk.check, c._id)}
                              candidate={c}
                              orgName={orgName}
                              check={chk}
                              stage="secondary"
                            />
                          ))}
                        {final
                          .filter((chk) => !isAIValidationCheck(chk.check))
                          .map((chk) => (
                            <ServiceCertificate
                              key={getServiceCertId("final", chk.check, c._id)}
                              id={getServiceCertId("final", chk.check, c._id)}
                              candidate={c}
                              orgName={orgName}
                              check={chk}
                              stage="final"
                            />
                          ))}
                      </div>

                      {primary.length > 0 && (
                        <StageSection
                          title="Primary Services"
                          checks={primary}
                          candidate={c}
                          stage="primary"
                          downloading={downloading}
                          setDownloading={setDownloading}
                        />
                      )}

                      {secondary.length > 0 && (
                        <StageSection
                          title="Secondary Services"
                          checks={secondary}
                          candidate={c}
                          stage="secondary"
                          downloading={downloading}
                          setDownloading={setDownloading}
                        />
                      )}

                      {final.length > 0 && (
                        <StageSection
                          title="Final Services"
                          checks={final}
                          candidate={c}
                          stage="final"
                          downloading={downloading}
                          setDownloading={setDownloading}
                        />
                      )}

                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff004f] via-red-500 to-red-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                        <button
                          disabled={downloading}
                          onClick={() => {
                            const allIds = [
                              ...primary
                                .filter((chk) => !isAIValidationCheck(chk.check))
                                .map((chk) =>
                                  getServiceCertId("primary", chk.check, c._id)
                                ),
                              ...secondary
                                .filter((chk) => !isAIValidationCheck(chk.check))
                                .map((chk) =>
                                  getServiceCertId("secondary", chk.check, c._id)
                                ),
                              ...final
                                .filter((chk) => !isAIValidationCheck(chk.check))
                                .map((chk) =>
                                  getServiceCertId("final", chk.check, c._id)
                                ),
                            ];

                            mergeAllCertificates(
                              allIds,
                              `${c.firstName}-${c.lastName}-verification-report.pdf`,
                              setDownloading,
                              c,
                              v
                            );
                          }}
                          className={`relative w-full bg-gradient-to-r from-[#ff004f] via-red-500 to-red-600 text-white rounded-2xl shadow-lg py-3 px-6 font-semibold text-base flex justify-center items-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                            downloading ? "opacity-50 cursor-not-allowed" : "hover:from-[#e60047] hover:via-red-600 hover:to-red-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {downloading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Generating Report...</span>
                              </>
                            ) : (
                              <>
                                <Download size={18} />
                                <span>Download Complete Report Package</span>
                              </>
                            )}
                          </div>
                          
                          {!downloading && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!loading && candidates.length === 0 && (
          <div className="text-center py-20">
            <div className="relative">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-xl">
                <FileText size={48} className="text-slate-400" />
              </div>
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-[#ff004f]/10 to-[#ff004f]/5 rounded-full blur-2xl animate-pulse"></div>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-4">
              No Reports Available
            </h3>
            <p className="text-slate-600 max-w-lg mx-auto text-lg leading-relaxed">
              There are no verification reports to display at the moment. Reports will appear here once candidates complete their verification process.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="bg-gradient-to-r from-[#ff004f]/10 to-[#ff004f]/5 px-6 py-3 rounded-2xl border border-slate-200">
                <p className="text-sm text-slate-500 font-medium">
                  🔄 Reports will automatically refresh when available
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCertificate({ id, candidate, orgName, check, stage }) {
  const checks = [{ ...check, stage }];
  return (
    <CertificateBase
      id={id}
      candidate={candidate}
      orgName={orgName}
      checks={checks}
    />
  );
}

function StageSection({ title, checks, candidate, stage, downloading, setDownloading }) {
  const [open, setOpen] = useState(false);

  const stageConfig = {
    "Primary Services": {
      num: 1,
      icon: "🚀",
      gradient: "from-red-400 via-pink-500 to-purple-600",
      bgGradient: "from-red-50 via-pink-50 to-purple-50",
      textGradient: "from-red-600 to-purple-700",
    },
    "Secondary Services": {
      num: 2,
      icon: "⚡",
      gradient: "from-orange-400 via-amber-500 to-yellow-600",
      bgGradient: "from-orange-50 via-amber-50 to-yellow-50",
      textGradient: "from-orange-600 to-yellow-700",
    },
    "Final Services": {
      num: 3,
      icon: "🎯",
      gradient: "from-green-400 via-emerald-500 to-teal-600",
      bgGradient: "from-green-50 via-emerald-50 to-teal-50",
      textGradient: "from-green-600 to-teal-700",
    },
  };

  const config = stageConfig[title] || stageConfig["Primary Services"];
  const completedCount = checks.filter(chk => chk.status === "COMPLETED").length;
  const failedCount = checks.filter(chk => chk.status === "FAILED").length;

  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
      
      <div className="relative">
        <button
          onClick={() => setOpen((p) => !p)}
          className={`w-full flex justify-between items-center bg-gradient-to-r ${config.bgGradient} border-2 border-transparent bg-clip-padding px-6 py-5 rounded-3xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] group`}
        >
          <div className="flex items-center gap-4">
            <div className={`relative w-14 h-14 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <span className="text-xl">{config.icon}</span>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-slate-700 shadow-md">
                {config.num}
              </div>
            </div>
            
            <div className="text-left">
              <h3 className={`text-xl font-bold bg-gradient-to-r ${config.textGradient} bg-clip-text text-transparent`}>
                {title}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-600 font-medium">
                  {checks.length} services
                </span>
                {completedCount > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    ✅ {completedCount} completed
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                    ❌ {failedCount} failed
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className={`p-3 bg-white/50 rounded-2xl transition-all duration-300 ${open ? "rotate-180 bg-white/80" : "group-hover:bg-white/70"}`}>
            <ChevronDown size={20} className="text-slate-700" />
          </div>
        </button>

        {open && (
          <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {checks.map((chk, index) => {
                const done = chk.status === "COMPLETED";
                const failed = chk.status === "FAILED";
                const pending = chk.status === "PENDING";
                const certId = getServiceCertId(stage, chk.check, candidate._id);
                const isAI = isAIValidationCheck(chk.check);

                return (
                  <div
                    key={certId}
                    className={`relative group/card bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                      isAI ? "border-purple-300/50 bg-gradient-to-br from-purple-50/80 to-pink-50/80" : ""
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute top-3 right-3">
                      {done && <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>}
                      {failed && <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>}
                      {pending && <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg animate-pulse"></div>}
                    </div>

                    <div className="flex items-start gap-3 mb-4">
                      <div className={`p-2 rounded-xl shadow-md ${
                        isAI ? "bg-gradient-to-br from-[#ff004f] to-red-500" : 
                        done ? "bg-gradient-to-br from-green-500 to-emerald-500" :
                        failed ? "bg-gradient-to-br from-red-500 to-pink-500" :
                        "bg-gradient-to-br from-slate-400 to-slate-500"
                      }`}>
                        <span className="text-lg">
                          {isAI ? "🤖" : SERVICE_ICONS[chk.check] || "📝"}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">
                          {formatServiceName(chk.check)}
                        </h4>
                        <p className={`text-xs font-semibold mt-1 ${
                          done ? "text-green-600" :
                          failed ? "text-red-600" :
                          "text-yellow-600"
                        }`}>
                          {done ? "✅ Completed" :
                           failed ? "❌ Failed" :
                           "⏳ Pending"}
                        </p>
                      </div>
                    </div>

                    {isAI ? (
                      <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl">
                        <p className="text-xs text-purple-900 font-semibold flex items-center gap-2">
                          <Brain size={14} />
                          <span>Available on AI Verification Page</span>
                        </p>
                      </div>
                    ) : (
                      <button
                        disabled={!done || downloading}
                        onClick={() =>
                          downloadSingleCert(
                            certId,
                            `${candidate._id}-${stage}-${chk.check}.pdf`,
                            setDownloading,
                            chk.attachments || []
                          )
                        }
                        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 ${
                          done
                            ? "bg-gradient-to-r from-[#ff004f] to-red-600 text-white hover:from-[#e60047] hover:to-red-700 shadow-lg hover:shadow-xl hover:scale-105"
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        } ${downloading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {downloading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download size={16} />
                            <span>Download Report</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CertificateBase({ id, candidate, orgName, checks }) {
  const verification = candidate.verification;
  const serviceName = formatServiceName(checks[0]?.check || "");

  // Helper function to truncate long text
  const truncateText = (text, maxLength = 500) => {
    if (!text) return text;
    const str = String(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + "...";
  };

  let bulletItems = [];
  const remarks = checks[0]?.remarks;

  if (!remarks) {
    bulletItems = ["No remarks available"];
  } else if (typeof remarks === "string") {
    bulletItems = [truncateText(remarks)];
  } else if (Array.isArray(remarks)) {
    bulletItems = remarks.map((r) => truncateText(String(r)));
  } else if (typeof remarks === "object") {
    if (remarks.message && remarks.message_code) {
      bulletItems.push(`Status: ${truncateText(remarks.message)}`);
      bulletItems.push(`Code: ${remarks.message_code}`);
      
      if (remarks.data) {
        bulletItems.push(`Client ID: ${remarks.data.client_id || 'N/A'}`);
        
        if (remarks.data.uan) {
          bulletItems.push(`UAN: ${remarks.data.uan}`);
        }
        
        if (remarks.data.employment_history) {
          if (Array.isArray(remarks.data.employment_history) && remarks.data.employment_history.length === 0) {
            bulletItems.push(`Employment History: No employment records found`);
          } else if (Array.isArray(remarks.data.employment_history)) {
            bulletItems.push(`Employment History: ${remarks.data.employment_history.length} records found`);
            // Limit employment history records to prevent overflow
            const maxRecords = 3;
            remarks.data.employment_history.slice(0, maxRecords).forEach((emp, index) => {
              bulletItems.push(`  Record ${index + 1}: ${truncateText(JSON.stringify(emp), 200)}`);
            });
            if (remarks.data.employment_history.length > maxRecords) {
              bulletItems.push(`  ... and ${remarks.data.employment_history.length - maxRecords} more records`);
            }
          }
        }
        
        // Handle other data fields with truncation
        Object.entries(remarks.data).forEach(([key, value]) => {
          if (key !== 'client_id' && key !== 'uan' && key !== 'employment_history') {
            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            bulletItems.push(`${key}: ${truncateText(valueStr, 300)}`);
          }
        });
      }
      
      if (remarks.status_code) {
        bulletItems.push(`Status Code: ${remarks.status_code}`);
      }
      
      if (remarks.success !== undefined) {
        bulletItems.push(`Success: ${remarks.success ? 'Yes' : 'No'}`);
      }
    } else {
      // Handle other object types (like court records, credit reports)
      const entries = Object.entries(remarks);
      const maxEntries = 10; // Limit number of entries to prevent overflow
      
      entries.slice(0, maxEntries).forEach(([k, v]) => {
        if (typeof v === 'object' && v !== null) {
          bulletItems.push(`${k}: ${truncateText(JSON.stringify(v), 300)}`);
        } else {
          bulletItems.push(`${k}: ${truncateText(String(v), 300)}`);
        }
      });
      
      if (entries.length > maxEntries) {
        bulletItems.push(`... and ${entries.length - maxEntries} more fields`);
      }
    }
  } else {
    bulletItems = [truncateText(String(remarks))];
  }

  const attachments = checks[0]?.attachments || [];
  const hasAttachments = attachments && attachments.length > 0;

  return (
    <div
      id={id}
      style={{
        width: "860px",
        minHeight: "1120px",
        padding: "10px 50px 60px 50px",
        background: "#ffffff",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <img
        src="/logos/maihooMain.png"
        alt="watermark"
        style={{
          position: "absolute",
          top: "300px",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.08,
          width: "750px",
          height: "750px",
          objectFit: "contain",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div style={{ position: "relative", zIndex: 2, marginTop: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "35px",
            marginBottom: "25px",
          }}
        >
          <div style={{ flexShrink: 0, marginTop: "5px" }}>
            <img
              src="/logos/maihooMain.png"
              alt="logo"
              style={{
                maxHeight: "180px",
                maxWidth: "450px",
                height: "auto",
                width: "auto",
                display: "block",
                objectFit: "contain",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              marginTop: "55px",
            }}
          >
            <h1
              style={{
                fontSize: "26px",
                fontWeight: "900",
                margin: 0,
                lineHeight: "1",
                fontFamily: "Arial Black, Arial, sans-serif",
              }}
            >
              {serviceName}
            </h1>

            <h2
              style={{
                fontSize: "26px",
                fontWeight: "900",
                margin: "0",
                lineHeight: "1",
                fontFamily: "Arial Black, Arial, sans-serif",
              }}
            >
              Verification Report
            </h2>
          </div>
        </div>

        <div
          style={{
            fontSize: "15px",
            lineHeight: "28px",
            marginTop: "-20px",
            marginBottom: "50px",
          }}
        >
          <p>
            <strong>Candidate Name:</strong> {candidate.firstName}{" "}
            {candidate.lastName}
          </p>
          <p>
            <strong>Candidate ID:</strong> {candidate._id}
          </p>
          <p>
            <strong>Verification ID:</strong> {verification?._id || "—"}
          </p>
          <p>
            <strong>Organization:</strong> {orgName}
          </p>
          <p>
            <strong>Service:</strong> {serviceName}
          </p>
          <p>
            <strong>Verification Timestamp:</strong>{" "}
            {new Date().toLocaleString()}
          </p>

          <p style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <strong>Status:</strong>
            <span
              style={{ 
                color: checks[0]?.status === "COMPLETED" ? "#5cb85c" : 
                       checks[0]?.status === "FAILED" ? "#dc2626" : "#f59e0b", 
                fontWeight: "bold", 
                fontSize: "16px" 
              }}
            >
              {checks[0]?.status === "COMPLETED" ? "✓ Completed" :
               checks[0]?.status === "FAILED" ? "✗ Failed" :
               checks[0]?.status === "PENDING" ? "⏳ Pending" :
               "⏳ In Progress"}
            </span>
          </p>
        </div>

        <div
          style={{
            width: "100%",
            height: "3px",
            background: "#272626ff",
            marginTop: "10px",
            marginBottom: "60px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "90px",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "32px",
              background: checks[0]?.status === "COMPLETED" ? "#5cb85c" : 
                         checks[0]?.status === "FAILED" ? "#dc2626" : "#f59e0b",
              borderRadius: "5px",
            }}
          />
          <div
            style={{
              width: "25%",
              height: "2px",
              background: checks[0]?.status === "COMPLETED" ? "#5cb85c" : 
                         checks[0]?.status === "FAILED" ? "#dc2626" : "#f59e0b",
              marginLeft: "10px",
            }}
          />
        </div>

        <div style={{ marginBottom: "30px" }}>
          {bulletItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  marginRight: "10px",
                  color: "#000",
                }}
              >
                ✓
              </span>
              <span style={{ fontSize: "14px", color: "#000" }}>{item}</span>
            </div>
          ))}
        </div>

        {hasAttachments && (
          <div style={{ marginBottom: "30px" }}>
            <p
              style={{
                fontSize: "14px",
                color: "#000",
                fontWeight: "bold",
                marginBottom: "15px",
              }}
            >
              Please find the proof of this verification as attachments:
            </p>
            {attachments.map((url, idx) => {
              const fileName = url.split("/").pop() || `Attachment ${idx + 1}`;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ marginRight: "8px" }}>📎</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#0066cc",
                      textDecoration: "underline",
                      wordBreak: "break-all",
                      cursor: "pointer",
                    }}
                  >
                    {fileName}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "310px",
          paddingTop: "15px",
          borderTop: "2px solid #272626ff",
          fontSize: "12px",
          color: "#dc3545",
          textAlign: "center",
          fontWeight: "600",
          lineHeight: "1.4",
        }}
      >
        <p style={{ margin: 0 }}>
          Maihoo Technologies Private Limited, Vaishnavi's Cynosure, 2-48/5/6,
          8th Floor, Opp RTCC, Telecom Nagar Extension, Gachibowli-500032
        </p>
      </div>
    </div>
  );
}