"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  FileText,
  Download,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  Receipt,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { safeHtml2Canvas } from "@/utils/safeHtml2Canvas";

export default function BatchInvoicesPage() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  // Generate Invoice Form
  const [generateForm, setGenerateForm] = useState({
    organizationId: "",
    includeCompleted: true,
    includePartial: true,
    startDate: "",
    endDate: "",
  });

  const invoiceRef = useRef(null);

  // Load Organizations
  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(`/api/proxy/secure/getOrganizations`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load organizations");
      setOrganizations(data.organizations || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Load Invoices for Selected Organization
  useEffect(() => {
    if (selectedOrg) {
      fetchInvoices(selectedOrg);
    } else {
      setInvoices([]);
    }
  }, [selectedOrg]);

  const fetchInvoices = async (orgId) => {
    setLoadingInvoices(true);
    setError("");
    try {
      const res = await fetch(
        `/api/proxy/secure/get_batch_invoices?organizationId=${orgId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load invoices");
      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err.message);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Generate Invoice
  const handleGenerateInvoice = async () => {
    if (!generateForm.organizationId) {
      setError("Please select an organization");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/proxy/secure/generate_batch_invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(generateForm),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to generate invoice");

      setSuccess("Invoice generated successfully!");
      setShowGenerateModal(false);
      
      // Refresh invoices if the generated invoice is for the selected org
      if (generateForm.organizationId === selectedOrg) {
        fetchInvoices(selectedOrg);
      }

      // Reset form
      setGenerateForm({
        organizationId: "",
        includeCompleted: true,
        includePartial: true,
        startDate: "",
        endDate: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesNumber = invoice.invoiceNumber?.toLowerCase().includes(search);
      const matchesOrg = invoice.organization?.organizationName?.toLowerCase().includes(search);
      if (!matchesNumber && !matchesOrg) return false;
    }

    // Date filter
    if (dateFilter.from) {
      const invoiceDate = new Date(invoice.invoiceDate);
      const fromDate = new Date(dateFilter.from);
      if (invoiceDate < fromDate) return false;
    }

    if (dateFilter.to) {
      const invoiceDate = new Date(invoice.invoiceDate);
      const toDate = new Date(dateFilter.to + "T23:59:59");
      if (invoiceDate > toDate) return false;
    }

    return true;
  });

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await safeHtml2Canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${selectedInvoice?.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF");
    }
  };

  const selectedOrgData = organizations.find((o) => o._id === selectedOrg);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt size={24} className="text-[#ff004f]" />
              Batch Invoices
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Generate, view and download batch invoices
            </p>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold w-full sm:w-auto shadow transition-all hover:shadow-lg bg-[#ff004f] hover:bg-[#e60047]"
          >
            <FileText size={18} />
            Generate Invoice
          </button>
        </div>

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <p className="text-green-700 font-medium">{success}</p>
            <button
              onClick={() => setSuccess("")}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* ORGANIZATION SELECTOR */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-white p-6 rounded-2xl shadow-xl border-2 border-gray-100 mb-6">
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
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="w-full border-2 border-gray-200 rounded-xl p-4 bg-white cursor-pointer flex justify-between items-center shadow-sm hover:border-[#ff004f]/50 transition-all"
            >
              <span className="text-gray-800 font-medium">
                {selectedOrgData
                  ? `🏢 ${selectedOrgData.organizationName}`
                  : "🌐 Select Organization"}
              </span>
              <span className="text-gray-400 text-lg">▾</span>
            </div>

            {showOrgDropdown && (
              <div className="absolute left-0 right-0 bg-white border-2 border-[#ff004f]/20 rounded-xl shadow-2xl mt-2 z-30 max-h-80 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b-2 border-gray-100 bg-gradient-to-r from-[#ff004f]/5 to-[#ff3366]/5 sticky top-0">
                  <input
                    type="text"
                    placeholder="🔍 Search organization..."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all"
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {organizations
                    .filter((o) =>
                      o.organizationName
                        .toLowerCase()
                        .includes(orgSearch.toLowerCase())
                    )
                    .map((org) => (
                      <div
                        key={org._id}
                        onClick={() => {
                          setSelectedOrg(org._id);
                          setShowOrgDropdown(false);
                          setOrgSearch("");
                        }}
                        className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-[#ff004f]/10 hover:to-[#ff3366]/10 text-sm font-medium transition-all border-b border-gray-50 last:border-0"
                      >
                        🏢 {org.organizationName}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-600" size={24} />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* INVOICES LIST */}
        {selectedOrg && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText size={20} className="text-[#ff004f]" />
                Invoices for {selectedOrgData?.organizationName}
              </h2>
              <p className="text-sm text-gray-600">
                Total: <span className="font-bold text-[#ff004f]">{filteredInvoices.length}</span> invoices
              </p>
            </div>

            {/* FILTERS */}
            <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Invoice number or org..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all"
                    />
                  </div>
                </div>

                {/* From Date */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter.from}
                    onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all"
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter.to}
                    onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {(searchQuery || dateFilter.from || dateFilter.to) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDateFilter({ from: "", to: "" });
                  }}
                  className="mt-3 text-sm text-[#ff004f] hover:text-[#e60047] font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {loadingInvoices ? (
              <div className="text-center py-12">
                <Loader2
                  className="animate-spin mx-auto text-[#ff004f] mb-4"
                  size={40}
                />
                <p className="text-gray-600">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-xl font-semibold text-gray-600 mb-2">
                  {invoices.length === 0 ? "No Invoices Found" : "No Matching Invoices"}
                </p>
                <p className="text-sm text-gray-400">
                  {invoices.length === 0
                    ? "No batch invoices available for this organization"
                    : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.invoiceId || invoice.invoiceNumber}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-[#ff004f] hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setShowInvoiceModal(true);
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt className="text-[#ff004f]" size={20} />
                          <h3 className="font-bold text-gray-900">
                            {invoice.invoiceNumber}
                          </h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            {invoice.invoiceType}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-semibold text-gray-900">
                              {formatDate(invoice.invoiceDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Verifications</p>
                            <p className="font-semibold text-gray-900">
                              {invoice.summary?.totalVerifications || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Checks</p>
                            <p className="font-semibold text-gray-900">
                              {invoice.summary?.totalCompletedChecks || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total</p>
                            <p className="font-bold text-[#ff004f] text-lg">
                              {formatCurrency(invoice.grandTotal)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(invoice);
                          setShowInvoiceModal(true);
                        }}
                        className="px-4 py-2 bg-[#ff004f] text-white rounded-lg hover:bg-[#e60047] transition-all flex items-center gap-2 font-semibold"
                      >
                        <FileText size={18} />
                        View Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVOICE MODAL */}
        {showInvoiceModal && selectedInvoice && (
          <InvoiceModal
            invoice={selectedInvoice}
            onClose={() => {
              setShowInvoiceModal(false);
              setSelectedInvoice(null);
            }}
            invoiceRef={invoiceRef}
            downloadPDF={downloadPDF}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
        )}

        {/* GENERATE INVOICE MODAL */}
        {showGenerateModal && (
          <GenerateInvoiceModal
            organizations={organizations}
            generateForm={generateForm}
            setGenerateForm={setGenerateForm}
            generating={generating}
            error={error}
            onGenerate={handleGenerateInvoice}
            onClose={() => {
              setShowGenerateModal(false);
              setError("");
            }}
          />
        )}
      </div>
    </div>
  );
}

// Generate Invoice Modal
function GenerateInvoiceModal({
  organizations,
  generateForm,
  setGenerateForm,
  generating,
  error,
  onGenerate,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-[#ff004f]" />
            Generate Batch Invoice
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Organization */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Organization <span className="text-red-500">*</span>
            </label>
            <select
              value={generateForm.organizationId}
              onChange={(e) =>
                setGenerateForm({ ...generateForm, organizationId: e.target.value })
              }
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all text-black bg-white"
            >
              <option value="">Select Organization</option>
              {organizations.map((org) => (
                <option key={org._id} value={org._id} className="text-black">
                  {org.organizationName}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={generateForm.startDate}
              onChange={(e) =>
                setGenerateForm({ ...generateForm, startDate: e.target.value })
              }
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={generateForm.endDate}
              onChange={(e) =>
                setGenerateForm({ ...generateForm, endDate: e.target.value })
              }
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all"
            />
          </div>

          {/* Include Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateForm.includeCompleted}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    includeCompleted: e.target.checked,
                  })
                }
                className="w-4 h-4 text-[#ff004f] border-gray-300 rounded focus:ring-[#ff004f]"
              />
              <span className="text-sm text-gray-700">Include Completed Verifications</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateForm.includePartial}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    includePartial: e.target.checked,
                  })
                }
                className="w-4 h-4 text-[#ff004f] border-gray-300 rounded focus:ring-[#ff004f]"
              />
              <span className="text-sm text-gray-700">Include Partial Verifications</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={generating}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onGenerate}
              disabled={generating || !generateForm.organizationId}
              className="flex-1 px-4 py-2.5 bg-[#ff004f] text-white rounded-lg font-semibold hover:bg-[#e60047] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Generating...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Invoice Modal Component
function InvoiceModal({
  invoice,
  onClose,
  invoiceRef,
  downloadPDF,
  formatDate,
  formatCurrency,
}) {
  const [expanded, setExpanded] = useState({
    verifications: false,
    items: true,
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="text-[#ff004f]" />
            Invoice Details
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-[#ff004f] text-white rounded-lg hover:bg-[#e60047] transition-all flex items-center gap-2 font-semibold"
            >
              <Download size={18} />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* INVOICE PREVIEW */}
          <div ref={invoiceRef} className="bg-white p-8 border-2 border-gray-200 rounded-xl">
            <InvoiceContent
              invoice={invoice}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              expanded={expanded}
              setExpanded={setExpanded}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Invoice Content Component
function InvoiceContent({ invoice, formatDate, formatCurrency, expanded, setExpanded }) {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">INVOICE</h1>
          <p className="text-sm text-black">
            Invoice #: <span className="font-bold text-black">{invoice.invoiceNumber}</span>
          </p>
          <p className="text-sm text-black">
            Date: <span className="font-semibold text-black">{formatDate(invoice.invoiceDate)}</span>
          </p>
          <p className="text-sm text-black">
            Type: <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">{invoice.invoiceType}</span>
          </p>
        </div>
        <div className="text-right">
          <img
            src="/logos/maihooMain.png"
            alt="Logo"
            className="h-16 mb-2"
          />
          <p className="text-sm font-semibold text-black">Maihoo Technologies</p>
          <p className="text-xs text-black">Gachibowli, Hyderabad</p>
        </div>
      </div>

      {/* ORGANIZATION DETAILS */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-black mb-2">BILL TO:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-bold text-black">{invoice.organization?.organizationName}</p>
            <p className="text-sm text-black">{invoice.organization?.email}</p>
            {invoice.organization?.phone && (
              <p className="text-sm text-black">{invoice.organization?.phone}</p>
            )}
            {invoice.organization?.gstNumber && (
              <p className="text-sm text-black">GST: {invoice.organization?.gstNumber}</p>
            )}
            <p className="text-sm text-black">{invoice.organization?.address}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-black mb-2">BILLING PERIOD:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-black">
              <span className="font-semibold">From:</span> {formatDate(invoice.billingPeriod?.startDate)}
            </p>
            <p className="text-sm text-black">
              <span className="font-semibold">To:</span> {formatDate(invoice.billingPeriod?.endDate)}
            </p>
          </div>

          <h3 className="text-sm font-bold text-black mt-4 mb-2">SUMMARY:</h3>
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <p className="text-black">Total Verifications: <span className="font-semibold">{invoice.summary?.totalVerifications}</span></p>
            <p className="text-black">Completed Checks: <span className="font-semibold">{invoice.summary?.totalCompletedChecks}</span></p>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div>
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => setExpanded({ ...expanded, items: !expanded.items })}
        >
          <h3 className="text-lg font-bold text-black">Invoice Items</h3>
          {expanded.items ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expanded.items && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-bold text-black">Check Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-bold text-black">Stage</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-bold text-black">Completed At</th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-bold text-black">Price</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-sm text-black">{item.checkName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                        {item.stage}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-black">{formatDate(item.completedAt)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right font-semibold text-black">
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VERIFICATIONS */}
      {invoice.verifications && invoice.verifications.length > 0 && (
        <div>
          <div
            className="flex justify-between items-center cursor-pointer mb-2"
            onClick={() => setExpanded({ ...expanded, verifications: !expanded.verifications })}
          >
            <h3 className="text-lg font-bold text-black">Verifications</h3>
            {expanded.verifications ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {expanded.verifications && (
            <div className="space-y-2">
              {invoice.verifications.map((ver, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-black">{ver.candidateName}</p>
                  <p className="text-sm text-black">{ver.candidateEmail}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-black">Status: <span className="font-semibold">{ver.overallStatus}</span></span>
                    <span className="text-black">Checks: <span className="font-semibold">{ver.completedChecks}</span></span>
                    <span className="text-black">Total: <span className="font-semibold">{formatCurrency(ver.verificationTotal)}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TOTALS */}
      <div className="border-t-2 border-gray-200 pt-4">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-black">Subtotal:</span>
              <span className="font-semibold text-black">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-black">Tax ({(invoice.taxRate * 100).toFixed(0)}%):</span>
              <span className="font-semibold text-black">{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2">
              <span className="text-black">Grand Total:</span>
              <span className="text-[#ff004f]">{formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* WARNINGS */}
      {invoice.warnings && invoice.warnings.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <p className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
            <AlertCircle size={18} />
            Warnings:
          </p>
          <ul className="list-disc list-inside text-sm text-yellow-700">
            {invoice.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* FOOTER */}
      <div className="text-center text-xs text-black border-t border-gray-200 pt-4">
        <p>Generated by: {invoice.generatedBy}</p>
        <p>Generated at: {formatDate(invoice.generatedAt)}</p>
      </div>
    </div>
  );
}
