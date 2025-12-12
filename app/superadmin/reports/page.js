"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
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
import { useSuperAdminState } from "../../context/SuperAdminStateContext";

/* ----------------------------------------------- */
/* 🔗 API BASE */
/* ----------------------------------------------- */


/* ----------------------------------------------- */
/* SERVICE ICONS */
/* ----------------------------------------------- */
const SERVICE_ICONS = {
  pan_aadhaar_seeding: "🪪",
  pan_verification: "📄",
  employment_history: "👔",
  aadhaar_to_uan: "🔗",
  credit_report: "💳",
  court_record: "⚖",
};

/* ----------------------------------------------- */
/* HELPERS */
/* ----------------------------------------------- */
const formatServiceName = (raw = "") =>
  raw
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const isAIValidationCheck = (checkName) => {
  return checkName === "ai_cv_validation" || checkName === "ai_education_validation";
};

const getServiceCertId = (stage, checkName, candId) =>
  `cert-${stage}-${checkName
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase()}-${candId}`;

/* ----------------------------------------------- */
/* PDF SINGLE CERT */
/* ----------------------------------------------- */
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

    // Add clickable links for attachments
    if (attachments && attachments.length > 0) {
      // Find attachment links in the element
      const attachmentLinks = element.querySelectorAll('a[href^="http"]');
      attachmentLinks.forEach((link, idx) => {
        if (idx < attachments.length) {
          const rect = link.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          
          // Calculate position relative to the element
          const x = ((rect.left - elementRect.left) * pdfWidth) / element.offsetWidth;
          const y = ((rect.top - elementRect.top) * pdfWidth) / element.offsetWidth;
          const width = (rect.width * pdfWidth) / element.offsetWidth;
          const height = (rect.height * pdfWidth) / element.offsetWidth;
          
          // Add clickable link to PDF
          pdf.link(x, y, width, height, { url: attachments[idx] });
        }
      });
    }

    pdf.save(fileName);
  } finally {
    setDownloading(false);
  }
}

/* ----------------------------------------------- */
/* PDF MERGED FINAL — WITH INDEX PAGE (MATCHING CERTIFICATE STYLE) */
/* ----------------------------------------------- */
async function mergeAllCertificates(ids, fileName, setDownloading, candidate, verification) {
  try {
    setDownloading(true);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    /* ---------------------- */
    /* CREATE INDEX PAGE AS HTML ELEMENT */
    /* ---------------------- */
    
    // Create a temporary div for the index page
    const indexDiv = document.createElement('div');
    indexDiv.id = 'temp-index-page';
    indexDiv.style.position = 'absolute';
    indexDiv.style.left = '-9999px';
    indexDiv.style.top = '0';
    document.body.appendChild(indexDiv);

    // Get all checks from verification (including AI checks for index page)
    const allChecks = [];
    const stages = verification?.stages || {};
    
    if (stages.primary) {
      stages.primary.forEach(chk => {
        allChecks.push({ ...chk, stage: 'Primary' });
      });
    }
    if (stages.secondary) {
      stages.secondary.forEach(chk => {
        allChecks.push({ ...chk, stage: 'Secondary' });
      });
    }
    if (stages.final) {
      stages.final.forEach(chk => {
        allChecks.push({ ...chk, stage: 'Final' });
      });
    }

    // Build the index page HTML (matching certificate style)
    indexDiv.innerHTML = `
      <div style="
        width: 860px;
        min-height: 1120px;
        padding: 40px 50px 60px 50px;
        background: #ffffff;
        font-family: Arial, sans-serif;
        color: #000;
        position: relative;
        overflow: hidden;
      ">
        <!-- Watermark -->
        <img 
          src="/logos/maihooMain.png" 
          alt="watermark"
          style="
            position: absolute;
            top: 300px;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0.08;
            width: 750px;
            height: 750px;
            object-fit: contain;
            pointer-events: none;
            z-index: 1;
          "
        />

        <!-- Content -->
        <div style="position: relative; z-index: 2;">
          <!-- Header with Logo and Contact Info -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <!-- Left: Logo -->
            <div style="flex-shrink: 0; margin-top: 5px;">
              <img 
                src="/logos/maihooMain.png" 
                alt="logo"
                style="
                  max-height: 180px;
                  max-width: 450px;
                  height: auto;
                  width: auto;
                  display: block;
                  object-fit: contain;
                "
              />
            </div>

            <!-- Center: Title -->
            <div style="display: flex; flex-direction: column; justify-content: flex-start; margin-top: 55px; flex: 1; padding: 0 20px;">
              <h1 style="
                font-size: 26px;
                font-weight: bold;
                color: #000;
                margin: 0 0 8px 0;
                line-height: 1.3;
              ">
                All Verification Reports
              </h1>
              <p style="
                font-size: 14px;
                color: #555;
                margin: 0;
                line-height: 1.4;
              ">
                Comprehensive Background Verification Summary
              </p>
            </div>

            <!-- Right: Contact Information -->
            <div style="
              flex-shrink: 0;
              margin-top: 5px;
              text-align: right;
              font-size: 12px;
              color: #333;
              line-height: 1.8;
            ">
              <p style="margin: 0 0 5px 0; font-weight: bold;">📞 +91-8235-279-810</p>
              <p style="margin: 0 0 5px 0;">✉ info@maihootech.co.in</p>
              <p style="margin: 0;">🌐 maihootech.co.in</p>
            </div>
          </div>

          <!-- Candidate Information -->
          <div style="
            background: #f8f9fa;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          ">
            <h2 style="
              font-size: 16px;
              font-weight: bold;
              color: #000;
              margin: 0 0 15px 0;
              border-bottom: 2px solid #ddd;
              padding-bottom: 8px;
            ">
              Candidate Information
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #333; font-weight: bold; width: 150px;">Name:</td>
                <td style="padding: 8px 0; font-size: 13px; color: #000;">${candidate.firstName} ${candidate.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #333; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; font-size: 13px; color: #000;">${candidate.email || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #333; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; font-size: 13px; color: #000;">${candidate.phone || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #333; font-weight: bold;">Organization:</td>
                <td style="padding: 8px 0; font-size: 13px; color: #000;">${candidate.organizationName || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Verification Summary Table -->
          <div style="margin-bottom: 30px;">
            <h2 style="
              font-size: 16px;
              font-weight: bold;
              color: #000;
              margin: 0 0 15px 0;
              border-bottom: 2px solid #ddd;
              padding-bottom: 8px;
            ">
              Verification Summary
            </h2>
            <table style="
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #e0e0e0;
            ">
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="
                    padding: 12px;
                    text-align: left;
                    font-size: 13px;
                    font-weight: bold;
                    color: #000;
                    border-bottom: 2px solid #ddd;
                    border-right: 1px solid #ddd;
                  ">BGV Check</th>
                  <th style="
                    padding: 12px;
                    text-align: left;
                    font-size: 13px;
                    font-weight: bold;
                    color: #000;
                    border-bottom: 2px solid #ddd;
                    border-right: 1px solid #ddd;
                  ">Service</th>
                  <th style="
                    padding: 12px;
                    text-align: left;
                    font-size: 13px;
                    font-weight: bold;
                    color: #000;
                    border-bottom: 2px solid #ddd;
                  ">Status</th>
                </tr>
              </thead>
              <tbody>
                ${allChecks.map((chk, index) => {
                  const status = chk.status || 'PENDING';
                  let statusText = '';
                  let statusColor = '';
                  
                  if (status === 'COMPLETED') {
                    statusText = '✓ Verified';
                    statusColor = '#22c55e';
                  } else if (status === 'FAILED') {
                    statusText = '✗ Failed';
                    statusColor = '#ef4444';
                  } else {
                    statusText = '○ Pending';
                    statusColor = '#9ca3af';
                  }

                  return `
                    <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
                      <td style="
                        padding: 10px 12px;
                        font-size: 12px;
                        color: #000;
                        border-bottom: 1px solid #e0e0e0;
                        border-right: 1px solid #e0e0e0;
                      ">${chk.stage}</td>
                      <td style="
                        padding: 10px 12px;
                        font-size: 12px;
                        color: #000;
                        border-bottom: 1px solid #e0e0e0;
                        border-right: 1px solid #e0e0e0;
                      ">${formatServiceName(chk.check)}</td>
                      <td style="
                        padding: 10px 12px;
                        font-size: 12px;
                        font-weight: bold;
                        color: ${statusColor};
                        border-bottom: 1px solid #e0e0e0;
                      ">${statusText}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
          ">
            <!-- Report Stats -->
            <div style="font-size: 11px; color: #666; margin-bottom: 15px;">
              <p style="margin: 5px 0;">Generated on: ${new Date().toLocaleString()}</p>
              <p style="margin: 5px 0;">Total Verifications: ${allChecks.length}</p>
              <p style="margin: 5px 0;">Completed: ${allChecks.filter(c => c.status === 'COMPLETED').length}</p>
            </div>
            
            <!-- Address - Single line in red with red border -->
            <div style="
              margin-top: 230px;
              padding-top: 15px;
              border-top: 2px solid #272626ff;
              font-size: 12px;
              color: #dc3545;
              text-align: center;
              font-weight: 600;
              line-height: "3px";
            ">
              <p style="margin: 0;">
                Maihoo Technologies Private Limited, Vaishnavi's Cynosure, 2-48/5/6, 8th Floor, Opp RTCC, Telecom Nagar Extension, Gachibowli-500032
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert index page to canvas
    const indexCanvas = await safeHtml2Canvas(indexDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const indexImg = indexCanvas.toDataURL("image/png");
    const pdfWidth = 595.28;
    const indexPdfHeight = (indexCanvas.height * pdfWidth) / indexCanvas.width;

    // Add index page to PDF
    pdf.addImage(indexImg, "PNG", 0, 0, pdfWidth, indexPdfHeight);

    // Clean up
    document.body.removeChild(indexDiv);

    /* ---------------------- */
    /* ADD CERTIFICATES */
    /* ---------------------- */
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;

      const canvas = await safeHtml2Canvas(el, { scale: 2 });
      const img = canvas.toDataURL("image/png");

      const certPdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addPage();
      pdf.addImage(img, "PNG", 0, 0, pdfWidth, certPdfHeight);

      // Add clickable links for attachments on this page
      const attachmentLinks = el.querySelectorAll('a[href^="http"]');
      attachmentLinks.forEach((link) => {
        const rect = link.getBoundingClientRect();
        const elementRect = el.getBoundingClientRect();
        
        // Calculate position relative to the element
        const x = ((rect.left - elementRect.left) * pdfWidth) / el.offsetWidth;
        const y = ((rect.top - elementRect.top) * pdfWidth) / el.offsetWidth;
        const width = (rect.width * pdfWidth) / el.offsetWidth;
        const height = (rect.height * pdfWidth) / el.offsetWidth;
        
        // Add clickable link to PDF
        pdf.link(x, y, width, height, { url: link.href });
      });
    }

    pdf.save(fileName);
  } finally {
    setDownloading(false);
  }
}

/* ----------------------------------------------- */
/* MAIN PAGE */
/* ----------------------------------------------- */
export default function SuperAdminReportsPage() {
  const {
    reportsData: candidates,
    setReportsData: setCandidates,
    reportsFilters,
    setReportsFilters,
  } = useSuperAdminState();

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(reportsFilters.organizationId || "");
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [orgSearch, setOrgSearch] = useState("");
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const [primaryOpen, setPrimaryOpen] = useState(false);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);

  /* Fetch Orgs */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/proxy/secure/getOrganizations", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setOrganizations(data.organizations || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Fetch Candidates */
  const fetchCandidates = async (orgId) => {
    // Save selected org to context
    setReportsFilters({ ...reportsFilters, organizationId: orgId });

    // Only fetch if we don't have data or org changed
    if (candidates.length > 0 && reportsFilters.organizationId === orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/proxy/secure/getCandidates?orgId=${orgId}`,  
        { credentials: "include" }
      );

      const data = await res.json();
      if (!res.ok) throw new Error("Candidates failed");

      const list = data.candidates || [];

      const enriched = await Promise.all(
        list.map(async (c) => {
          try {
            const verRes = await fetch(
              `/api/proxy/secure/getVerifications?candidateId=${c._id}`,  
              { credentials: "include" }
            );
            const verData = await verRes.json();
            return { ...c, verification: verData.verifications?.[0] || null };
          } catch (_) {
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

  /* ----------------------------------------------- */
  /* RENDER UI - (Same as previous message, trimmed for brevity) */
  /* ----------------------------------------------- */

  /* ----------------------------------------------- */
  /* RENDER UI */
  /* ----------------------------------------------- */
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen text-gray-900">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={24} className="text-[#ff004f]" />
            Reports
          </h1>
          <p className="text-gray-600 text-sm mt-1">Download verification reports</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <Building2 size={18} className="text-[#ff004f]" />
          <span className="font-semibold text-gray-700 text-sm">All Organizations</span>
        </div>
      </div>

      {/* AI VALIDATION NOTICE */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4 mb-6 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-200 rounded-lg flex-shrink-0">
            <Brain size={20} className="text-purple-700" />
          </div>
          <div>
            <h3 className="font-bold text-purple-900 mb-1">AI Validation Reports</h3>
            <p className="text-sm text-purple-800">
              Reports for <strong>AI CV Validation</strong> and <strong>AI Education Validation</strong> can be downloaded from their respective verification pages:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs bg-purple-200 text-purple-900 px-3 py-1 rounded-full font-semibold">
                📄 AI-CV-Verification Page
              </span>
              <span className="text-xs bg-purple-200 text-purple-900 px-3 py-1 rounded-full font-semibold">
                🎓 AI-Edu-Verification Page
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SUPERB ORG SELECTOR */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-6 mb-8 shadow-xl border-2 border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-gradient-to-br from-[#ff004f]/10 to-[#ff3366]/10 rounded-lg">
            <Building2 size={20} className="text-[#ff004f]" />
          </div>
          <label className="text-base font-bold text-gray-800">
            Select Organization
          </label>
        </div>
        
        <div className="relative">

          <div
            onClick={() => setShowOrgDropdown((p) => !p)}
            className="border-2 border-gray-200 rounded-xl p-4 w-full bg-white text-gray-700 cursor-pointer flex justify-between items-center shadow-sm hover:border-[#ff004f]/50 transition-all"
          >
            <span className="font-medium">
              {selectedOrg
                ? "🏢 " + organizations.find((o) => o._id === selectedOrg)
                    ?.organizationName
                : "🌐 Select Organization"}
            </span>

            <ChevronDown size={20} className="text-gray-400" />
          </div>

          {showOrgDropdown && (
            <div className="absolute bg-white border-2 border-[#ff004f]/20 rounded-xl w-full mt-2 z-30 shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b-2 border-gray-100 bg-gradient-to-r from-[#ff004f]/5 to-[#ff3366]/5">
                <input
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  placeholder="🔍 Search organization..."
                  className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all"
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {organizations
                  .filter((o) =>
                    o.organizationName
                      .toLowerCase()
                      .includes(orgSearch.toLowerCase())
                  )
                  .map((o) => (
                    <div
                      key={o._id}
                      onClick={() => {
                        setSelectedOrg(o._id);
                        setShowOrgDropdown(false);
                        setOrgSearch("");
                        setCandidates([]);
                        fetchCandidates(o._id);
                      }}
                      className="p-3 hover:bg-gradient-to-r hover:from-[#ff004f]/10 hover:to-[#ff3366]/10 cursor-pointer text-sm font-medium transition-all border-b border-gray-50 last:border-0"
                    >
                      🏢 {o.organizationName}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-20 text-[#ff004f]">
          <Loader2 className="animate-spin mr-2" />
          Fetching Reports…
        </div>
      )}


      

      {/* --------------------------- CANDIDATES --------------------------- */}
      {!loading &&
        candidates.map((c) => {
          const v = c.verification;
          const primaryChecks = v?.stages?.primary || [];
          const secondaryChecks = v?.stages?.secondary || [];
          const finalChecks = v?.stages?.final || [];
          
          const totalChecks = primaryChecks.length + secondaryChecks.length + finalChecks.length;
          const completedChecks = [...primaryChecks, ...secondaryChecks, ...finalChecks].filter(chk => chk.status === "COMPLETED").length;

          return (
            <div
              key={c._id}
              className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2 border-gray-200 rounded-2xl overflow-hidden mb-6 transition-all hover:shadow-xl hover:border-[#ff004f]/30"
            >
              {/* Candidate Header */}
              <div
                className="bg-gradient-to-r from-[#ff004f]/5 to-purple-500/5 p-6 cursor-pointer hover:from-[#ff004f]/10 hover:to-purple-500/10 transition-all"
                onClick={() => toggle(c._id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {/* Avatar Circle */}
                    <div className="w-14 h-14 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {c.firstName?.charAt(0)}{c.lastName?.charAt(0)}
                    </div>

                    {/* Candidate Info */}
                    <div>
                      <p className="font-bold text-xl text-gray-900 flex items-center gap-2">
                        {c.firstName} {c.lastName}
                        {v?.overallStatus === "COMPLETED" && (
                          <CheckCircle size={20} className="text-green-600" />
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">ID:</span> {c._id}
                        </p>
                        {totalChecks > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                            {completedChecks}/{totalChecks} Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className="flex items-center gap-3">
                    {v?.overallStatus && (
                      <span className={`px-4 py-2 rounded-lg font-bold text-sm ${
                        v.overallStatus === "COMPLETED" ? "bg-green-100 text-green-800" :
                        v.overallStatus === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {v.overallStatus.replace("_", " ")}
                      </span>
                    )}
                    <div className={`p-2 rounded-lg transition-all ${expanded === c._id ? "bg-[#ff004f] text-white" : "bg-gray-200 text-gray-600"}`}>
                      {expanded === c._id ? (
                        <ChevronDown size={24} />
                      ) : (
                        <ChevronRight size={24} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* EXPANDED */}
              {expanded === c._id && (
                <div className="mt-6 border-t pt-6 space-y-10">
                  {/* HIDDEN CERTIFICATES - invisible DOM for PDF (excluding AI checks) */}
                  <div className="absolute -left-[9999px] -top-[9999px]">
                    {primaryChecks.filter(chk => !isAIValidationCheck(chk.check)).map((chk) => (
                      <ServiceCertificate
                        key={getServiceCertId("primary", chk.check, c._id)}
                        id={getServiceCertId("primary", chk.check, c._id)}
                        candidate={c}
                        orgName={c.organizationName}
                        check={chk}
                        stage="primary"
                      />
                    ))}
                    {secondaryChecks.filter(chk => !isAIValidationCheck(chk.check)).map((chk) => (
                      <ServiceCertificate
                        key={getServiceCertId("secondary", chk.check, c._id)}
                        id={getServiceCertId("secondary", chk.check, c._id)}
                        candidate={c}
                        orgName={c.organizationName}
                        check={chk}
                        stage="secondary"
                      />
                    ))}
                    {finalChecks.filter(chk => !isAIValidationCheck(chk.check)).map((chk) => (
                      <ServiceCertificate
                        key={getServiceCertId("final", chk.check, c._id)}
                        id={getServiceCertId("final", chk.check, c._id)}
                        candidate={c}
                        orgName={c.organizationName}
                        check={chk}
                        stage="final"
                      />
                    ))}
                  </div>

                  {/* PRIMARY */}
                  {primaryChecks.length > 0 && (
                    <div>
                      <button
                        onClick={() => setPrimaryOpen((p) => !p)}
                        className="w-full flex justify-between items-center bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 px-6 py-4 rounded-xl font-bold text-[#ff004f] hover:from-red-100 hover:to-pink-100 transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#ff004f] rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            1
                          </div>
                          <span className="text-lg">Primary Services ({primaryChecks.length})</span>
                        </div>
                        <div className={`transition-transform ${primaryOpen ? "rotate-180" : ""}`}>
                          <ChevronDown size={24} />
                        </div>
                      </button>

                      {primaryOpen && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {primaryChecks.map((chk) => {
                            const done = chk.status === "COMPLETED";
                            const certId = getServiceCertId(
                              "primary",
                              chk.check,
                              c._id
                            );
                            const isAI = isAIValidationCheck(chk.check);

                            return (
                              <div
                                key={certId}
                                className={`bg-white border rounded-xl p-4 shadow flex flex-col ${isAI ? "border-purple-300 bg-purple-50" : ""}`}
                              >
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                  <span className="text-lg">
                                    {isAI ? "🤖" : (SERVICE_ICONS[chk.check] || "📝")}
                                  </span>
                                  {formatServiceName(chk.check)}
                                </p>

                                {isAI ? (
                                  <div className="mt-4 p-3 bg-purple-100 border border-purple-300 rounded-lg">
                                    <p className="text-xs text-purple-900 font-semibold flex items-center gap-1">
                                      <Brain size={14} />
                                      Download from AI Verification Page
                                    </p>
                                  </div>
                                ) : (
                                  <button
                                    disabled={!done || downloading}
                                    onClick={() =>
                                      downloadSingleCert(
                                        certId,
                                        `${c._id}-primary-${chk.check}.pdf`,
                                        setDownloading,
                                        chk.attachments || []
                                      )
                                    }
                                    className={`mt-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${
                                      done
                                        ? "bg-[#ff004f] text-white hover:bg-[#e60047]"
                                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    } ${
                                      downloading
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    {downloading ? (
                                      <Loader2
                                        className="animate-spin"
                                        size={16}
                                      />
                                    ) : (
                                      <Download size={16} />
                                    )}
                                    Download
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECONDARY */}
                  {secondaryChecks.length > 0 && (
                    <div>
                      <button
                        onClick={() => setSecondaryOpen((p) => !p)}
                        className="w-full flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 px-6 py-4 rounded-xl font-bold text-orange-600 hover:from-orange-100 hover:to-amber-100 transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            2
                          </div>
                          <span className="text-lg">Secondary Services ({secondaryChecks.length})</span>
                        </div>
                        <div className={`transition-transform ${secondaryOpen ? "rotate-180" : ""}`}>
                          <ChevronDown size={24} />
                        </div>
                      </button>

                      {secondaryOpen && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {secondaryChecks.map((chk) => {
                            const done = chk.status === "COMPLETED";
                            const certId = getServiceCertId(
                              "secondary",
                              chk.check,
                              c._id
                            );
                            const isAI = isAIValidationCheck(chk.check);

                            return (
                              <div
                                key={certId}
                                className={`bg-white border rounded-xl p-4 shadow flex flex-col ${isAI ? "border-purple-300 bg-purple-50" : ""}`}
                              >
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                  <span className="text-lg">
                                    {isAI ? "🤖" : (SERVICE_ICONS[chk.check] || "📝")}
                                  </span>
                                  {formatServiceName(chk.check)}
                                </p>

                                {isAI ? (
                                  <div className="mt-4 p-3 bg-purple-100 border border-purple-300 rounded-lg">
                                    <p className="text-xs text-purple-900 font-semibold flex items-center gap-1">
                                      <Brain size={14} />
                                      Download from AI Verification Page
                                    </p>
                                  </div>
                                ) : (
                                  <button
                                    disabled={!done || downloading}
                                    onClick={() =>
                                      downloadSingleCert(
                                        certId,
                                        `${c._id}-secondary-${chk.check}.pdf`,
                                        setDownloading,
                                        chk.attachments || []
                                      )
                                    }
                                    className={`mt-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${
                                      done
                                        ? "bg-[#ff004f] text-white hover:bg-[#e60047]"
                                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    } ${
                                      downloading
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    {downloading ? (
                                      <Loader2
                                        className="animate-spin"
                                        size={16}
                                      />
                                    ) : (
                                      <Download size={16} />
                                    )}
                                    Download
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* FINAL */}
                  {finalChecks.length > 0 && (
                    <div>
                      <button
                        onClick={() => setFinalOpen((p) => !p)}
                        className="w-full flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 px-6 py-4 rounded-xl font-bold text-green-600 hover:from-green-100 hover:to-emerald-100 transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            3
                          </div>
                          <span className="text-lg">Final Services ({finalChecks.length})</span>
                        </div>
                        <div className={`transition-transform ${finalOpen ? "rotate-180" : ""}`}>
                          <ChevronDown size={24} />
                        </div>
                      </button>

                      {finalOpen && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {finalChecks.map((chk) => {
                            const done = chk.status === "COMPLETED";
                            const certId = getServiceCertId(
                              "final",
                              chk.check,
                              c._id
                            );
                            const isAI = isAIValidationCheck(chk.check);

                            return (
                              <div
                                key={certId}
                                className={`bg-white border rounded-xl p-4 shadow flex flex-col ${isAI ? "border-purple-300 bg-purple-50" : ""}`}
                              >
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                  <span className="text-lg">
                                    {isAI ? "🤖" : (SERVICE_ICONS[chk.check] || "📝")}
                                  </span>
                                  {formatServiceName(chk.check)}
                                </p>

                                {isAI ? (
                                  <div className="mt-4 p-3 bg-purple-100 border border-purple-300 rounded-lg">
                                    <p className="text-xs text-purple-900 font-semibold flex items-center gap-1">
                                      <Brain size={14} />
                                      Download from AI Verification Page
                                    </p>
                                  </div>
                                ) : (
                                  <button
                                    disabled={!done || downloading}
                                    onClick={() =>
                                      downloadSingleCert(
                                        certId,
                                        `${c._id}-final-${chk.check}.pdf`,
                                        setDownloading,
                                        chk.attachments || []
                                      )
                                    }
                                    className={`mt-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${
                                      done
                                        ? "bg-[#ff004f] text-white hover:bg-[#e60047]"
                                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    } ${
                                      downloading
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    {downloading ? (
                                      <Loader2
                                        className="animate-spin"
                                        size={16}
                                      />
                                    ) : (
                                      <Download size={16} />
                                    )}
                                    Download
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* MERGED ALL REPORTS */}
                  <button
                        disabled={downloading}
                        onClick={() => {
                          // Filter out AI validation checks
                          const allIds = [
                            ...primaryChecks.filter(chk => !isAIValidationCheck(chk.check)).map((chk) =>
                              getServiceCertId("primary", chk.check, c._id)
                            ),
                            ...secondaryChecks.filter(chk => !isAIValidationCheck(chk.check)).map((chk) =>
                              getServiceCertId("secondary", chk.check, c._id)
                            ),
                            ...finalChecks.filter(chk => !isAIValidationCheck(chk.check)).map((chk) =>
                              getServiceCertId("final", chk.check, c._id)
                            ),
                          ];

                          mergeAllCertificates(
                            allIds,
                            `${c._id}-all-verification-reports.pdf`,
                            setDownloading,
                            c,
                            v
                          );
                        }}
                        className={`w-full bg-[#ff004f] text-white hover:bg-[#e60047] rounded-xl shadow py-4 px-6 font-bold text-lg flex justify-center items-center gap-3 mt-10 ${
                          downloading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {downloading ? (
                          <Loader2 size={22} className="animate-spin" />
                        ) : (
                          <Download size={22} />
                        )}
                        Download ALL Reports (Merged)
                      </button>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}


/* -------------------------------------------------------------
   SERVICE CERTIFICATE TEMPLATE
------------------------------------------------------------- */
function ServiceCertificate({ id, candidate, orgName, check, stage }) {
  const checks = [{ ...check, stage }];
  const title = `${stage.toUpperCase()} - ${formatServiceName(
    check.check
  )} Verification Report`;

  return (
    <CertificateBase
      id={id}
      title={title}
      candidate={candidate}
      orgName={orgName}
      checks={checks}
    />
  );
}

/* -------------------------------------------------------------
   FINAL SUPERADMIN CERTIFICATE TEMPLATE (FIXED & IMPROVED)
------------------------------------------------------------- */

function CertificateBase({ id, title, candidate, orgName, checks }) {
  const verification = candidate.verification;
  const serviceName = formatServiceName(checks[0]?.check || "");

  // Prepare remarks
  let bulletItems = [];
  const remarks = checks[0]?.remarks;

  if (!remarks) bulletItems = ["No remarks available"];
  else if (typeof remarks === "string") bulletItems = [remarks];
  else if (Array.isArray(remarks)) bulletItems = remarks.map((r) => String(r));
  else if (typeof remarks === "object") {
    bulletItems = Object.entries(remarks).map(
      ([k, v]) => `${k}: ${String(v)}`
    );
  } else {
    bulletItems = [String(remarks)];
  }

  // Get attachments
  const attachments = checks[0]?.attachments || [];
  const hasAttachments = attachments && attachments.length > 0;

  return (
    <div
      id={id}
      style={{
        width: "860px",
        minHeight: "1120px", // A4 height
        padding: "10px 50px 60px 50px",
        background: "#ffffff",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ================= WATERMARK ================= */}
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

      {/* ================= CONTENT BLOCK ================= */}
      <div style={{ position: "relative", zIndex: 2, marginTop: "10px" }}>
        
        {/* =============================================== */}
        {/* HEADER AREA                                     */}
        {/* =============================================== */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "35px",
            marginBottom: "25px",
          }}
        >
          {/* Left logo */}
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

          {/* Title block */}
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

        {/* =============================================== */}
        {/* CANDIDATE DETAILS                               */}
        {/* =============================================== */}
        <div
          style={{
            fontSize: "15px",
            lineHeight: "28px",
            marginTop: "-20px",
            marginBottom: "50px",
          }}
        >
          <p><strong>Candidate Name:</strong> {candidate.firstName} {candidate.lastName}</p>
          <p><strong>Candidate ID:</strong> {candidate._id}</p>
          <p><strong>Verification ID:</strong> {verification?._id || "—"}</p>
          <p><strong>Organization:</strong> {orgName}</p>
          <p><strong>Service:</strong> {serviceName}</p>
          <p>
            <strong>Verification Timestamp:</strong>{" "}
            {new Date().toLocaleString()}
          </p>

         {/* STATUS */}
{(() => {
  const status = checks[0]?.status || "PENDING";

  let icon = "○";
  let color = "#9ca3af"; // gray
  let text = "Pending";

  if (status === "COMPLETED") {
    icon = "✓";
    color = "#22c55e"; // green
    text = "Completed";
  } else if (status === "FAILED") {
    icon = "✗";
    color = "#ef4444"; // red
    text = "Failed";
  }

  return (
    <p style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <strong>Status:</strong>
      <span style={{ fontWeight: "bold", fontSize: "16px", color }}>
        {icon} {text}
      </span>
    </p>
  );
})()}

        </div>

        {/* =============================================== */}
        {/* BLACK SEPARATOR LINE                             */}
        {/* =============================================== */}
        <div
          style={{
            width: "100%",
            height: "3px",
            background: "#272626ff",
            marginTop: "10px",
            marginBottom: "60px",
          }}
        />

        {/* =============================================== */}
        {/* DYNAMIC STATUS BAR                               */}
        {/* =============================================== */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "90px" }}>
          <div
            style={{
              width: "70px",
              height: "32px",
              background: checks[0]?.status === "COMPLETED" ? "#22c55e" : 
                         checks[0]?.status === "FAILED" ? "#ef4444" : "#f59e0b",
              borderRadius: "5px",
            }}
          />
          <div
            style={{
              width:"25%",
              height: "2px",
              background: checks[0]?.status === "COMPLETED" ? "#22c55e" : 
                         checks[0]?.status === "FAILED" ? "#ef4444" : "#f59e0b",
              marginLeft: "10px",
            }}
          />
        </div>

        {/* =============================================== */}
        {/* REMARKS LIST                                     */}
        {/* =============================================== */}
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

        {/* =============================================== */}
        {/* ATTACHMENTS SECTION                              */}
        {/* =============================================== */}
        {hasAttachments && (
          <div style={{ marginBottom: "30px" }}>
            <p style={{ fontSize: "14px", color: "#000", fontWeight: "bold", marginBottom: "15px" }}>
              Please find the proof of this verification as attachments:
            </p>
            {attachments.map((url, idx) => {
              const fileName = url.split('/').pop() || `Attachment ${idx + 1}`;
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
                      cursor: "pointer"
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

      {/* =============================================== */}
      {/* FOOTER SECTION                                    */}
      {/* =============================================== */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          left: "50px",
          right: "50px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            height: "2px",
            background: "#272626ff",
            width: "100%",
            marginBottom: "12px",
          }}
        />

        <p
          style={{
            fontSize: "12px",
            color: "#dc3545",
            fontWeight: "600",
            margin: 0,
            lineHeight: "1.4",
          }}
        >
          Maihoo Technologies Private Limited, Vaishnavi's Cynosure, 2-48/5/6, 8th Floor, Opp RTCC, Telecom Nagar Extension, Gachibowli-500032
        </p>
      </div>
    </div>
  );
}


const headerCell = {
  padding: "10px",
  border: "1px solid #000",
  fontWeight: "700",
  textAlign: "left",
  color: "#000",
  backgroundColor: "#ffe5ef",
};

const cell = {
  padding: "10px",
  border: "1px solid #000",
  fontSize: "13px",
  textAlign: "left",
  color: "#000",
};
