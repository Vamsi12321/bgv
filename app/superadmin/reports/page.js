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
} from "lucide-react";

import { jsPDF } from "jspdf";
import { safeHtml2Canvas } from "@/utils/safeHtml2Canvas";

/* ----------------------------------------------- */
/* 🔗 API BASE */
/* ----------------------------------------------- */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

/* ----------------------------------------------- */
/* SERVICE ICONS */
/* ----------------------------------------------- */
const SERVICE_ICONS = {
  pan_aadhaar_seeding: "🪪",
  pan_verification: "📄",
  employment_history: "👔",
  aadhaar_to_uan: "🔗",
  credit_report: "💳",
  court_record: "⚖️",
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

const getServiceCertId = (stage, checkName, candId) =>
  `cert-${stage}-${checkName
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase()}-${candId}`;

/* ----------------------------------------------- */
/* PDF SINGLE CERT */
/* ----------------------------------------------- */
async function downloadSingleCert(id, fileName, setDownloading) {
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
    pdf.save(fileName);
  } finally {
    setDownloading(false);
  }
}

/* ----------------------------------------------- */
/* PDF MERGED FINAL — OPTION C (Title Page + All Reports) */
/* ----------------------------------------------- */
async function mergeAllCertificates(ids, fileName, setDownloading) {
  try {
    setDownloading(true);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    /* ---------------------- */
    /* HEADER PAGE */
    /* ---------------------- */
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(0, 0, 0);

    pdf.text("ALL VERIFICATION REPORTS", 297.5, 200, { align: "center" });

    /* ---------------------- */
    /* ADD CERTIFICATES */
    /* ---------------------- */
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;

      const canvas = await safeHtml2Canvas(el, { scale: 2 });
      const img = canvas.toDataURL("image/png");

      const pdfWidth = 595.28;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addPage(); // first certificate page
      pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);
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
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [candidates, setCandidates] = useState([]);
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
        const res = await fetch(`${API_BASE}/secure/getOrganizations`, {
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
    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/secure/getCandidates?orgId=${orgId}`,
        { credentials: "include" }
      );

      const data = await res.json();
      if (!res.ok) throw new Error("Candidates failed");

      const list = data.candidates || [];

      const enriched = await Promise.all(
        list.map(async (c) => {
          try {
            const verRes = await fetch(
              `${API_BASE}/secure/getVerifications?candidateId=${c._id}`,
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
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#ff004f] flex items-center gap-2">
          <FileText /> Reports Overview
        </h1>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow">
          <Building2 size={18} />
          <span className="font-medium">All Organizations</span>
        </div>
      </div>

      {/* ORG SELECTOR */}
      <div className="bg-white rounded-xl p-4 mb-8 shadow">
        <div className="border rounded-xl p-4 shadow relative">
          <label className="text-sm font-medium mb-2 block">
            Select Organization
          </label>

          <div
            onClick={() => setShowOrgDropdown((p) => !p)}
            className="border rounded-lg p-2 w-full bg-gray-50 text-gray-700 cursor-pointer flex justify-between items-center"
          >
            {selectedOrg
              ? organizations.find((o) => o._id === selectedOrg)
                  ?.organizationName
              : "-- Select Organization --"}

            <ChevronDown size={18} className="text-gray-500" />
          </div>

          {showOrgDropdown && (
            <div className="absolute bg-white border rounded-lg w-full mt-2 z-20 shadow-xl max-h-72 overflow-hidden">
              <div className="p-2 border-b bg-gray-50">
                <input
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  placeholder="Search organization..."
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>

              <div className="max-h-56 overflow-y-auto">
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
                      className="p-3 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {o.organizationName}
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

          return (
            <div
              key={c._id}
              className="bg-white shadow border rounded-xl p-5 mb-6 transition-all"
            >
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggle(c._id)}
              >
                <div className="flex items-center gap-3">
                  {expanded === c._id ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}

                  <div>
                    <p className="font-semibold text-lg">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-gray-500">ID: {c._id}</p>
                  </div>
                </div>
              </div>

              {/* EXPANDED */}
              {expanded === c._id && (
                <div className="mt-6 border-t pt-6 space-y-10">
                  {/* HIDDEN CERTIFICATES - invisible DOM for PDF */}
                  <div className="absolute -left-[9999px] -top-[9999px]">
                    {primaryChecks.map((chk) => (
                      <ServiceCertificate
                        key={getServiceCertId("primary", chk.check, c._id)}
                        id={getServiceCertId("primary", chk.check, c._id)}
                        candidate={c}
                        orgName={c.organizationName}
                        check={chk}
                        stage="primary"
                      />
                    ))}
                    {secondaryChecks.map((chk) => (
                      <ServiceCertificate
                        key={getServiceCertId("secondary", chk.check, c._id)}
                        id={getServiceCertId("secondary", chk.check, c._id)}
                        candidate={c}
                        orgName={c.organizationName}
                        check={chk}
                        stage="secondary"
                      />
                    ))}
                    {finalChecks.map((chk) => (
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
                        className="w-full flex justify-between items-center bg-[#fde7ee] px-4 py-3 rounded-lg font-semibold text-[#ff004f]"
                      >
                        <span>Primary Services ({primaryChecks.length})</span>
                        {primaryOpen ? <ChevronDown /> : <ChevronRight />}
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

                            return (
                              <div
                                key={certId}
                                className="bg-white border rounded-xl p-4 shadow flex flex-col"
                              >
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                  <span className="text-lg">
                                    {SERVICE_ICONS[chk.check] || "📝"}
                                  </span>
                                  {formatServiceName(chk.check)}
                                </p>

                                <button
                                  disabled={!done || downloading}
                                  onClick={() =>
                                    downloadSingleCert(
                                      certId,
                                      `${c._id}-primary-${chk.check}.pdf`,
                                      setDownloading
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
                        className="w-full flex justify-between items-center bg-[#fde7ee] px-4 py-3 rounded-lg font-semibold text-[#ff004f]"
                      >
                        <span>
                          Secondary Services ({secondaryChecks.length})
                        </span>
                        {secondaryOpen ? <ChevronDown /> : <ChevronRight />}
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

                            return (
                              <div
                                key={certId}
                                className="bg-white border rounded-xl p-4 shadow flex flex-col"
                              >
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                  <span className="text-lg">
                                    {SERVICE_ICONS[chk.check] || "📝"}
                                  </span>
                                  {formatServiceName(chk.check)}
                                </p>

                                <button
                                  disabled={!done || downloading}
                                  onClick={() =>
                                    downloadSingleCert(
                                      certId,
                                      `${c._id}-secondary-${chk.check}.pdf`,
                                      setDownloading
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
                        className="w-full flex justify-between items-center bg-[#fde7ee] px-4 py-3 rounded-lg font-semibold text-[#ff004f]"
                      >
                        <span>Final Services ({finalChecks.length})</span>
                        {finalOpen ? <ChevronDown /> : <ChevronRight />}
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

                            return (
                              <div
                                key={certId}
                                className="bg-white border rounded-xl p-4 shadow flex flex-col"
                              >
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                  <span className="text-lg">
                                    {SERVICE_ICONS[chk.check] || "📝"}
                                  </span>
                                  {formatServiceName(chk.check)}
                                </p>

                                <button
                                  disabled={!done || downloading}
                                  onClick={() =>
                                    downloadSingleCert(
                                      certId,
                                      `${c._id}-final-${chk.check}.pdf`,
                                      setDownloading
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* MERGED ALL REPORTS */}
                  {primaryChecks.every((x) => x.status === "COMPLETED") &&
                    secondaryChecks.every((x) => x.status === "COMPLETED") &&
                    finalChecks.every((x) => x.status === "COMPLETED") && (
                      <button
                        disabled={downloading}
                        onClick={() => {
                          const allIds = [
                            ...primaryChecks.map((chk) =>
                              getServiceCertId("primary", chk.check, c._id)
                            ),
                            ...secondaryChecks.map((chk) =>
                              getServiceCertId("secondary", chk.check, c._id)
                            ),
                            ...finalChecks.map((chk) =>
                              getServiceCertId("final", chk.check, c._id)
                            ),
                          ];

                          mergeAllCertificates(
                            allIds,
                            `${c._id}-all-verification-reports.pdf`,
                            setDownloading
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
                    )}
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

  const title = `${
    stage.charAt(0).toUpperCase() + stage.slice(1)
  } – ${formatServiceName(check.check)} Verification Report`;

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
   CERTIFICATE UI BASE (SINGLE PAGE)
------------------------------------------------------------- */

function CertificateBase({ id, title, candidate, orgName, checks }) {
  const verification = candidate.verification;
  const serviceName = formatServiceName(checks[0]?.check || "");

  const bulletItems = checks[0]?.remarks
    ? Object.entries(checks[0].remarks).map(([k, v]) => `${k}: ${String(v)}`)
    : ["No remarks available"];

  return (
    <div
      id={id}
      style={{
        width: "860px",
        minHeight: "1120px", // A4 page height
        padding: "40px",
        background: "#ffffff",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* ------------------------------- */}
      {/* HEADER: LOGO LEFT + TITLE CENTER */}
      {/* ------------------------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          alignItems: "center",
        }}
      >
        {/* Left - Logo */}
        <div style={{ textAlign: "left" }}>
          <img
            src="/logos/maihooMain.png"
            alt="logo"
            style={{ height: "80px" }}
          />
        </div>

        {/* Center - Title */}
        <div
          style={{
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "bold",
            textDecoration: "underline",
            width: "200px",
          }}
        >
          {serviceName} Verification Report
        </div>

        {/* Right - Empty (for alignment) */}
        <div></div>
      </div>

      {/* ------------------------------- */}
      {/* CANDIDATE DETAILS BLOCK */}
      {/* ------------------------------- */}
      <div
        style={{
          marginTop: "40px",
          fontSize: "16px",
          lineHeight: "28px",
        }}
      >
        <p>
          <b>Candidate Name:</b> {candidate.firstName} {candidate.lastName}
        </p>

        <p>
          <b>Candidate ID:</b> {candidate._id}
        </p>

        <p>
          <b>Verification ID:</b> {verification?._id || "—"}
        </p>

        <p>
          <b>Organization:</b> {orgName}
        </p>

        <p>
          <b>Service:</b> {serviceName}
        </p>

        <p>
          <b>Verification Date & Time stamp:</b> {new Date().toLocaleString()}
        </p>
      </div>

      {/* LINE */}
      <div
        style={{
          width: "100%",
          height: "2px",
          background: "#000",
          marginTop: "10px",
          marginBottom: "40px",
        }}
      />

      {/* ------------------------------- */}
      {/* GREEN BOX + LINE */}
      {/* ------------------------------- */}
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "40px" }}
      >
        <div
          style={{
            width: "70px",
            height: "40px",
            background: "#6ac46a",
            borderRadius: "6px",
            boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
          }}
        />
        <div
          style={{
            flexGrow: 1,
            height: "2px",
            background: "#6ac46a",
            marginLeft: "15px",
          }}
        />
      </div>

      {/* ------------------------------- */}
      {/* BULLET REMARKS LIST */}
      {/* ------------------------------- */}
      <div style={{ marginTop: "20px", marginLeft: "40px" }}>
        {bulletItems.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "20px", marginRight: "12px" }}>✓</span>
            <span style={{ fontSize: "16px" }}>{item}</span>
          </div>
        ))}
      </div>

      {/* ------------------------------- */}
      {/* FIXED FOOTER */}
      {/* ------------------------------- */}
      <div style={{ marginTop: "60px", textAlign: "center" }}>
        <div
          style={{
            height: "1px",
            background: "red",
            width: "100%",
            marginBottom: "10px",
          }}
        />
        <p
          style={{
            fontSize: "13px",
            color: "red",
            fontWeight: "600",
          }}
        >
          Maihoo Technologies Private Limited, Vaishnavi’s Cynosure, 2-48/5/6,
          8th Floor, Opp RTCC, Telecom Nagar Extension, Gachibowli-500032
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
