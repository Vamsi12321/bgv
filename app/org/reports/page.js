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
const formatServiceName = (raw = "") =>
  raw
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const getServiceCertId = (stage, checkName, candId) =>
  `cert-${stage}-${checkName.replace(/[^a-z0-9]/gi, "-")}-${candId}`;

/* ----------------------------------------------- */
/* PDF: Single Certificate */
/* ----------------------------------------------- */
async function downloadSingleCert(id, fileName, setDownloading) {
  try {
    setDownloading(true);
    const element = document.getElementById(id);
    if (!element) return alert("Report not prepared.");

    const canvas = await safeHtml2Canvas(element, { scale: 2 });
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
/* PDF: Merged All Certificates */
/* ----------------------------------------------- */
async function mergeAllCertificates(ids, fileName, setDownloading) {
  try {
    setDownloading(true);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(26);
    pdf.text("ALL VERIFICATION REPORTS", 297, 200, { align: "center" });

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;

      const canvas = await safeHtml2Canvas(el, { scale: 2 });
      const img = canvas.toDataURL("image/png");

      const pdfWidth = 595.28;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addPage();
      pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(fileName);
  } finally {
    setDownloading(false);
  }
}

/* ============================================================= */
/* ===================== ORG REPORTS PAGE ======================= */
/* ============================================================= */

export default function OrgReportsPage() {
  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  /* --------------------------------------------- */
  /* Load organization from logged-in user */
  /* --------------------------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem("bgvUser");
    if (!stored) return;

    try {
      const user = JSON.parse(stored);
      setOrgId(user.organizationId);
      setOrgName(user.organizationName);

      if (user.organizationId) {
        fetchCandidates(user.organizationId);
      }
    } catch (err) {
      console.error("User parse error:", err);
    }
  }, []);

  /* --------------------------------------------- */
  /* Fetch candidates with verification info */
  /* --------------------------------------------- */
  const fetchCandidates = async (orgId) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/secure/getCandidates?orgId=${orgId}`,
        { credentials: "include" }
      );

      const data = await res.json();

      const enriched = await Promise.all(
        (data.candidates || []).map(async (c) => {
          try {
            const verRes = await fetch(
              `${API_BASE}/secure/getVerifications?candidateId=${c._id}`,
              { credentials: "include" }
            );
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

  /* --------------------------------------------- */
  /* UI */
  /* --------------------------------------------- */

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      {/* HEADER SAME AS SUPERADMIN */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#ff004f] flex items-center gap-2">
          <FileText /> Reports Overview
        </h1>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow">
          <Building2 size={18} />
          <span className="font-medium">{orgName}</span>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-20 text-[#ff004f]">
          <Loader2 className="animate-spin mr-2" />
          Fetching Reports…
        </div>
      )}

      {/* CANDIDATE LIST */}
      {!loading &&
        candidates.map((c) => {
          const v = c.verification || {};
          const primary = v.stages?.primary || [];
          const secondary = v.stages?.secondary || [];
          const final = v.stages?.final || [];

          return (
            <div
              key={c._id}
              className="bg-white shadow border rounded-xl p-5 mb-6"
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

              {expanded === c._id && (
                <div className="mt-6 border-t pt-6 space-y-10">
                  {/* Hidden certificates */}
                  <div className="absolute -left-[9999px] -top-[9999px]">
                    {primary.map((chk) => (
                      <ServiceCertificate
                        key={getServiceCertId("primary", chk.check, c._id)}
                        id={getServiceCertId("primary", chk.check, c._id)}
                        candidate={c}
                        orgName={orgName}
                        check={chk}
                        stage="primary"
                      />
                    ))}
                    {secondary.map((chk) => (
                      <ServiceCertificate
                        key={getServiceCertId("secondary", chk.check, c._id)}
                        id={getServiceCertId("secondary", chk.check, c._id)}
                        candidate={c}
                        orgName={orgName}
                        check={chk}
                        stage="secondary"
                      />
                    ))}
                    {final.map((chk) => (
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

                  {/* PRIMARY SECTION */}
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

                  {/* SECONDARY SECTION */}
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

                  {/* FINAL */}
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

                  {/* MERGED ALL REPORTS BUTTON */}
                  {primary.every((x) => x.status === "COMPLETED") &&
                    secondary.every((x) => x.status === "COMPLETED") &&
                    final.every((x) => x.status === "COMPLETED") && (
                      <button
                        disabled={downloading}
                        onClick={() => {
                          const allIds = [
                            ...primary.map((chk) =>
                              getServiceCertId("primary", chk.check, c._id)
                            ),
                            ...secondary.map((chk) =>
                              getServiceCertId("secondary", chk.check, c._id)
                            ),
                            ...final.map((chk) =>
                              getServiceCertId("final", chk.check, c._id)
                            ),
                          ];

                          mergeAllCertificates(
                            allIds,
                            `${c._id}-all-reports.pdf`,
                            setDownloading
                          );
                        }}
                        className="w-full bg-[#ff004f] text-white hover:bg-[#e60047] rounded-xl shadow py-4 px-6 font-bold text-lg flex justify-center items-center gap-3"
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

/* ------------------------------------------------ */
/* SERVICE CERTIFICATE TEMPLATE */
/* ------------------------------------------------ */
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

/* ------------------------------------------------ */
/* STAGE SECTION UI BLOCK */
/* ------------------------------------------------ */
function StageSection({
  title,
  checks,
  candidate,
  stage,
  downloading,
  setDownloading,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex justify-between items-center bg-[#fde7ee] px-4 py-3 rounded-lg font-semibold text-[#ff004f]"
      >
        <span>
          {title} ({checks.length})
        </span>
        {open ? <ChevronDown /> : <ChevronRight />}
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {checks.map((chk) => {
            const done = chk.status === "COMPLETED";
            const certId = getServiceCertId(stage, chk.check, candidate._id);

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
                      `${candidate._id}-${stage}-${chk.check}.pdf`,
                      setDownloading
                    )
                  }
                  className={`mt-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${
                    done
                      ? "bg-[#ff004f] text-white hover:bg-[#e60047]"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  } ${downloading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {downloading ? (
                    <Loader2 className="animate-spin" size={16} />
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
  );
}

/* ------------------------------------------------ */
/* CERTIFICATE BASE PDF TEMPLATE */
/* ------------------------------------------------ */

function CertificateBase({ id, title, candidate, orgName, checks }) {
  const verification = candidate.verification;
  const serviceName = formatServiceName(checks[0]?.check || "");

  let bulletItems = [];
  const remarks = checks[0]?.remarks;

  if (!remarks) {
    bulletItems = ["No remarks available"];
  } else if (typeof remarks === "string") {
    bulletItems = [remarks];
  } else if (Array.isArray(remarks)) {
    bulletItems = remarks.map((r) => String(r));
  } else if (typeof remarks === "object") {
    bulletItems = Object.entries(remarks).map(([k, v]) => `${k}: ${String(v)}`);
  } else {
    bulletItems = [String(remarks)];
  }

  return (
    <div
      id={id}
      style={{
        width: "860px",
        minHeight: "1120px",
        padding: "40px",
        background: "#ffffff",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* HEADER: LOGO LEFT + TITLE CENTER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <img
            src="/logos/maihooMain.png"
            alt="logo"
            style={{ height: "80px", objectFit: "contain" }}
          />
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "bold",
            textDecoration: "underline",
            marginTop: "20px",
          }}
        >
          {serviceName} Verification Report
        </div>

        <div></div>
      </div>

      {/* CANDIDATE DETAILS */}
      <div style={{ marginTop: "40px", fontSize: "16px", lineHeight: "28px" }}>
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

      {/* BLACK LINE */}
      <div
        style={{
          width: "100%",
          height: "2px",
          background: "#000",
          marginTop: "10px",
          marginBottom: "40px",
        }}
      />

      {/* GREEN BOX + LINE */}
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

      {/* BULLET POINTS */}
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
            <span
              style={{ fontSize: "20px", color: "#000", marginRight: "12px" }}
            >
              ✓
            </span>
            <span style={{ fontSize: "16px" }}>{item}</span>
          </div>
        ))}
      </div>

      {/* FOOTER */}
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
