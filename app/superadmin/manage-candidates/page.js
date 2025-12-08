"use client";
import { useEffect, useState } from "react";
import { PlusCircle, X, Edit, Trash2, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";



/* -------------------------------------------- */
/* NORMALIZE CANDIDATE (fixes uncontrolled inputs) */
/* -------------------------------------------- */
const normalizeCandidate = (c = {}) => ({
  _id: c._id ?? "",
  firstName: c.firstName ?? "",
  middleName: c.middleName ?? "",
  lastName: c.lastName ?? "",
  fatherName: c.fatherName ?? "",
  dob: c.dob ?? "",
  gender: c.gender ?? "male",

  phone: c.phone ?? "",
  email: c.email ?? "",

  aadhaarNumber: c.aadhaarNumber ?? "",
  panNumber: c.panNumber ?? "",

  uanNumber: c.uanNumber ?? "",
  passportNumber: c.passportNumber ?? "",
  bankAccountNumber: c.bankAccountNumber ?? "",

  address: c.address ?? "",
  district: c.district ?? "",
  state: c.state ?? "",
  pincode: c.pincode ?? "",
});

export default function ManageCandidatesPage() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [newCandidate, setNewCandidate] = useState(normalizeCandidate({}));
  const [editCandidate, setEditCandidate] = useState(normalizeCandidate({}));

  const [saving, setSaving] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");

  const [modal, setModal] = useState({
    show: false,
    type: "info",
    message: "",
  });

  const showError = (msg) => {
    // Handle both string messages and objects with detail property
    const errorMessage = typeof msg === 'string' ? msg : (msg?.detail || msg?.message || 'An error occurred');
    setModal({ show: true, type: "error", message: errorMessage });
  };

  const showSuccess = (msg) => {
    const successMessage = typeof msg === 'string' ? msg : (msg?.message || 'Operation successful');
    setModal({ show: true, type: "success", message: successMessage });
  };

  /* ----------------------------------------------------
   VALIDATION UTILITIES
---------------------------------------------------- */

  const isEmpty = (v) => !v || String(v).trim() === "";

  const digitOnly = (v) => v.replace(/\D/g, "");

  /* Aadhaar → 12 digits only */
  const isValidAadhaar = (v) => /^\d{12}$/.test(v);

  /* PAN → ABCDE1234F */
  const isValidPAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);

  /* Phone → 10 digits */
  const isValidPhone = (v) => /^\d{10}$/.test(v);

  /* Passport optional → A1234567 */
  const isValidPassport = (v) => v === "" || /^[A-PR-WY][1-9]\d{6}$/.test(v);

  /* UAN optional → digits only */
  const isValidUAN = (v) => v === "" || /^[0-9]{10,12}$/.test(v);

  /* Bank Account optional → 9 to 18 digits */
  const isValidAccount = (v) => v === "" || /^[0-9]{9,18}$/.test(v);

  /* Pincode → 6 digits */
  const isValidPincode = (v) => /^[1-9][0-9]{5}$/.test(v);

  /* Name validation → only letters and spaces, no numbers */
  const isValidName = (v) => /^[a-zA-Z\s]+$/.test(v);

  /* -------------------------------------------- */
  /* FETCH ORGANIZATIONS */
  /* -------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/proxy/secure/getOrganizations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setOrganizations(data.organizations || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  /* -------------------------------------------- */
  /* GET CANDIDATES WHEN ORG SELECTED */
  /* -------------------------------------------- */
  const loadCandidates = async () => {
    if (!selectedOrg) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/secure/getCandidates?orgId=${selectedOrg}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) setCandidates(data.candidates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrg) loadCandidates();
  }, [selectedOrg]);

  /* -------------------------------------------- */
  /* ADD CANDIDATE */
  /* -------------------------------------------- */
  const handleAddChange = (e, isFile = false) => {
    if (isFile) {
      setNewCandidate((p) => ({ ...p, resume: e.target.files[0] }));
      return;
    }

    let { name, value } = e.target;

    if (name === "panNumber")
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (name === "aadhaarNumber") value = value.replace(/\D/g, "").slice(0, 12);
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);

    setNewCandidate((p) => ({ ...p, [name]: value }));
  };

  const handleAdd = async () => {
    if (!validateCandidate(newCandidate, showError)) return;

    setSaving(true);

    try {
      const formData = new FormData();

      // Append all fields EXACTLY as backend expects
      formData.append("firstName", newCandidate.firstName);
      formData.append("middleName", newCandidate.middleName);
      formData.append("lastName", newCandidate.lastName);
      formData.append("phone", newCandidate.phone);
      formData.append("aadhaarNumber", newCandidate.aadhaarNumber);
      formData.append("panNumber", newCandidate.panNumber);
      formData.append("address", newCandidate.address);
      formData.append("email", newCandidate.email);
      formData.append("fatherName", newCandidate.fatherName);
      formData.append("dob", newCandidate.dob);
      formData.append("gender", newCandidate.gender);
      formData.append("uanNumber", newCandidate.uanNumber);
      formData.append("district", newCandidate.district);
      formData.append("state", newCandidate.state);
      formData.append("pincode", newCandidate.pincode);
      formData.append("organizationId", selectedOrg);

      // Resume file (optional)
      if (newCandidate.resume) {
        formData.append("resume", newCandidate.resume);
      }

      const res = await fetch(`/api/proxy/secure/addCandidate`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle backend error response
        showError(data);
        return;
      }

      showSuccess("Candidate added successfully!");
      setShowAddModal(false);
      setNewCandidate(normalizeCandidate({}));
      await loadCandidates();
    } catch (err) {
      showError(err?.message || "Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------- */
  /* EDIT CANDIDATE */
  /* -------------------------------------------- */
  const handleEditChange = (e, isFile = false) => {
    if (isFile) {
      setEditCandidate((p) => ({ ...p, resume: e.target.files[0] }));
      return;
    }

    let { name, value } = e.target;

    if (name === "panNumber")
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (name === "aadhaarNumber") value = value.replace(/\D/g, "").slice(0, 12);
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);

    setEditCandidate((p) => ({ ...p, [name]: value }));
  };

  const handleEdit = async () => {
    if (!validateCandidate(editCandidate, showError)) return;

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("operation", "edit");
      formData.append("candidateId", editCandidate._id);
      formData.append("organizationId", selectedOrg);

      // ALL editable fields — optional on backend
      formData.append("firstName", editCandidate.firstName);
      formData.append("middleName", editCandidate.middleName);
      formData.append("lastName", editCandidate.lastName);
      formData.append("email", editCandidate.email);
      formData.append("phone", editCandidate.phone);
      formData.append("aadhaarNumber", editCandidate.aadhaarNumber);
      formData.append("panNumber", editCandidate.panNumber);
      formData.append("address", editCandidate.address);
      formData.append("dob", editCandidate.dob);
      formData.append("passportNumber", editCandidate.passportNumber);
      formData.append("uanNumber", editCandidate.uanNumber);
      formData.append("bankAccountNumber", editCandidate.bankAccountNumber);
      formData.append("fatherName", editCandidate.fatherName);
      formData.append("gender", editCandidate.gender);
      formData.append("district", editCandidate.district);
      formData.append("state", editCandidate.state);
      formData.append("pincode", editCandidate.pincode);

      if (editCandidate.resume) {
        formData.append("resume", editCandidate.resume);
      }

      const res = await fetch(`/api/proxy/secure/modifyCandidate`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle backend error response
        showError(data);
        return;
      }

      showSuccess("Candidate updated successfully!");
      setShowEditModal(false);
      setEditCandidate(normalizeCandidate({}));
      await loadCandidates();
    } catch (err) {
      showError(err?.message || "Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------- */
  /* DELETE CANDIDATE */
  /* -------------------------------------------- */
  const handleDelete = async () => {
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("operation", "delete");
      formData.append("candidateId", selectedCandidate._id);
      formData.append("organizationId", selectedOrg);

      const res = await fetch(`/api/proxy/secure/modifyCandidate`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle backend error response
        showError(data);
        return;
      }

      showSuccess("Candidate deleted successfully.");
      setShowDeleteModal(false);
      await loadCandidates();
    } catch (err) {
      showError(err?.message || "Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------------------------------
   MASTER VALIDATION FUNCTION
---------------------------------------------------- */
  const validateCandidate = (c, showError) => {
    // Mandatory fields with user-friendly names
    const required = {
      firstName: "First Name",
      lastName: "Last Name",
      fatherName: "Father's Name",
      phone: "Phone Number",
      email: "Email",
      aadhaarNumber: "Aadhaar Number",
      panNumber: "PAN Number",
      address: "Address",
      district: "District",
      state: "State",
      pincode: "Pincode",
      dob: "Date of Birth",
      gender: "Gender",
    };

    // Check required fields
    for (let [key, label] of Object.entries(required)) {
      if (isEmpty(c[key])) {
        showError(`${label} is required`);
        return false;
      }
    }

    // Name validations - only letters and spaces, no numbers
    if (!isValidName(c.firstName)) {
      showError("First Name must contain only letters and spaces, no numbers allowed.");
      return false;
    }

    if (c.middleName && !isValidName(c.middleName)) {
      showError("Middle Name must contain only letters and spaces, no numbers allowed.");
      return false;
    }

    if (!isValidName(c.lastName)) {
      showError("Last Name must contain only letters and spaces, no numbers allowed.");
      return false;
    }

    if (!isValidName(c.fatherName)) {
      showError("Father's Name must contain only letters and spaces, no numbers allowed.");
      return false;
    }

    // Email validation - must have @ and domain with extension
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(c.email)) {
      showError("Invalid email format. Please enter a valid email address (e.g., user@example.com).");
      return false;
    }
    
    // Check if email has proper domain
    if (!c.email.includes('@') || !c.email.split('@')[1].includes('.')) {
      showError("Email must include @ symbol and a valid domain (e.g., user@gmail.com).");
      return false;
    }

    // Aadhaar
    if (!isValidAadhaar(c.aadhaarNumber)) {
      showError("Invalid Aadhaar number. Must be exactly 12 digits.");
      return false;
    }

    // PAN
    if (!isValidPAN(c.panNumber)) {
      showError("Invalid PAN format. Must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter).");
      return false;
    }

    // Phone
    if (!isValidPhone(c.phone)) {
      showError("Invalid phone number. Must be exactly 10 digits.");
      return false;
    }

    // District and State validation - only letters and spaces
    if (!isValidName(c.district)) {
      showError("District must contain only letters and spaces, no numbers or special characters allowed.");
      return false;
    }

    if (!isValidName(c.state)) {
      showError("State must contain only letters and spaces, no numbers or special characters allowed.");
      return false;
    }

    // Pincode
    if (!isValidPincode(c.pincode)) {
      showError("Invalid Pincode. Must be exactly 6 digits and cannot start with 0.");
      return false;
    }

    // Passport optional
    if (c.passportNumber && !isValidPassport(c.passportNumber)) {
      showError("Invalid Passport Number. Must be in format: A1234567 (1 letter followed by 7 digits).");
      return false;
    }

    // UAN optional
    if (c.uanNumber && !isValidUAN(c.uanNumber)) {
      showError("Invalid UAN Number. Must be 10-12 digits.");
      return false;
    }

    // Bank Account optional
    if (c.bankAccountNumber && !isValidAccount(c.bankAccountNumber)) {
      showError("Invalid Bank Account Number. Must be 9-18 digits.");
      return false;
    }

    return true;
  };
  const enhancedOnChange = (e) => {
    let { name, value } = e.target;

    // Auto formatting
    if (name === "aadhaarNumber") value = digitOnly(value);
    if (name === "phone") value = digitOnly(value);
    if (name === "pincode") value = digitOnly(value);
    if (name === "uanNumber") value = digitOnly(value);
    if (name === "bankAccountNumber") value = digitOnly(value);

    if (name === "panNumber") value = value.toUpperCase();
    if (name === "passportNumber") value = value.toUpperCase();

    onChange({ target: { name, value } });
  };

  /* -------------------------------------------- */
  /* UI START */
  /* -------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#ff004f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Manage Candidates
            </h1>
            <p className="text-gray-600 text-sm mt-1">Add and manage candidate records</p>
          </div>

          <button
            onClick={() => {
              if (!selectedOrg) {
                setModal({
                  show: true,
                  type: "error",
                  message:
                    "Please select an organization before adding a candidate.",
                });
                return;
              }
              setNewCandidate(normalizeCandidate({}));
              setShowAddModal(true);
            }}
            disabled={!selectedOrg}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold w-full sm:w-auto shadow transition-all hover:shadow-lg ${
      selectedOrg
        ? "bg-[#ff004f] hover:bg-[#e60047]"
        : "bg-gray-400 cursor-not-allowed"
    }`}
          >
            <PlusCircle size={18} />
            Add Candidate
          </button>
        </div>

        {/* SUPERB ORGANIZATION SELECT */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-white p-6 rounded-2xl shadow-xl border-2 border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-[#ff004f]/10 to-[#ff3366]/10 rounded-lg">
              <svg className="w-5 h-5 text-[#ff004f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <label className="text-base font-bold text-gray-800">
              Select Organization
            </label>
          </div>
          
          {/* SEARCHABLE ORG DROPDOWN */}
          <div className="relative">
            <div
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="w-full border-2 border-gray-200 rounded-xl p-4 bg-white cursor-pointer flex justify-between items-center shadow-sm hover:border-[#ff004f]/50 transition-all"
            >
              <span className="text-gray-800 font-medium">
                {selectedOrg
                  ? "🏢 " + organizations.find((o) => o._id === selectedOrg)
                      ?.organizationName
                  : "🌐 Select Organization"}
              </span>
              <span className="text-gray-400 text-lg">▾</span>
            </div>

            {showOrgDropdown && (
              <div className="absolute left-0 right-0 bg-white border-2 border-[#ff004f]/20 rounded-xl shadow-2xl mt-2 z-30 max-h-80 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                {/* Search box */}
                <div className="p-3 border-b-2 border-gray-100 bg-gradient-to-r from-[#ff004f]/5 to-[#ff3366]/5 sticky top-0">
                  <input
                    type="text"
                    placeholder="🔍 Search organization..."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all"
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                  />
                </div>

                {/* List */}
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
                        }}
                        className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-[#ff004f]/10 hover:to-[#ff3366]/10 text-sm font-medium transition-all border-b border-gray-50 last:border-0"
                      >
                        🏢 {o.organizationName}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CANDIDATE SEARCH FILTER */}
        {selectedOrg && (
          <div className="bg-gradient-to-br from-white via-gray-50 to-white p-6 rounded-2xl shadow-xl border-2 border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <label className="text-base font-bold text-gray-800">
                Search Candidates
              </label>
            </div>
            <input
              type="text"
              placeholder="🔍 Search by name, email, phone, Aadhaar, or PAN..."
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-4 bg-white text-sm focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] transition-all shadow-sm"
            />
          </div>
        )}

        {/* SUPERB CANDIDATES LIST */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-gray-100 text-gray-900">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="animate-spin mx-auto text-[#ff004f] mb-4" size={40} />
              <p className="text-gray-600 font-medium">Loading candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-xl font-semibold text-gray-600 mb-2">No candidates found</p>
              <p className="text-sm text-gray-400">Add your first candidate to get started</p>
            </div>
          ) : (
            <>
              {/* SUPERB DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 uppercase text-xs tracking-wide">
                      <th className="p-4 text-left font-semibold text-gray-700">👤 Name</th>
                      <th className="p-4 text-left font-semibold text-gray-700">📞 Phone</th>
                      <th className="p-4 text-left font-semibold text-gray-700">✉️ Email</th>
                      <th className="p-4 text-left font-semibold text-gray-700">🆔 Aadhaar</th>
                      <th className="p-4 text-left font-semibold text-gray-700">💳 PAN</th>
                      <th className="p-4 text-left font-semibold text-gray-700">⚙️ Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {candidates.filter((c) => {
                      if (!candidateSearch.trim()) return true;
                      const search = candidateSearch.toLowerCase();
                      return (
                        (c.firstName || "").toLowerCase().includes(search) ||
                        (c.lastName || "").toLowerCase().includes(search) ||
                        (c.email || "").toLowerCase().includes(search) ||
                        (c.phone || "").includes(search) ||
                        (c.aadhaarNumber || "").includes(search) ||
                        (c.panNumber || "").toLowerCase().includes(search)
                      );
                    }).map((c, idx) => (
                      <tr
                        key={c._id}
                        className={`transition-all group hover:bg-gradient-to-r hover:from-[#fff5f8] hover:to-[#fff0f5] hover:shadow-md ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <td className="p-4 font-semibold text-gray-800 group-hover:text-[#ff004f] transition-colors">
                          {c.firstName} {c.lastName}
                        </td>
                        <td className="p-4 text-gray-600">{c.phone}</td>
                        <td className="p-4 text-gray-600">{c.email}</td>
                        <td className="p-4 text-gray-600 font-mono text-sm">{c.aadhaarNumber}</td>
                        <td className="p-4 text-gray-600 font-mono text-sm font-semibold">{c.panNumber}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              className="p-2.5 text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 rounded-lg transition-all transform hover:scale-110 shadow-sm hover:shadow-lg"
                              onClick={() => {
                                setEditCandidate(normalizeCandidate(c));
                                setShowEditModal(true);
                              }}
                              title="Edit Candidate"
                            >
                              <Edit size={18} />
                            </button>

                            <button
                              className="p-2.5 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-lg transition-all transform hover:scale-110 shadow-sm hover:shadow-lg"
                              onClick={() => {
                                setSelectedCandidate(normalizeCandidate(c));
                                setShowDeleteModal(true);
                              }}
                              title="Delete Candidate"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SUPERB MOBILE CARDS */}
              <div className="md:hidden grid gap-4">
                {candidates.filter((c) => {
                  if (!candidateSearch.trim()) return true;
                  const search = candidateSearch.toLowerCase();
                  return (
                    (c.firstName || "").toLowerCase().includes(search) ||
                    (c.lastName || "").toLowerCase().includes(search) ||
                    (c.email || "").toLowerCase().includes(search) ||
                    (c.phone || "").includes(search) ||
                    (c.aadhaarNumber || "").includes(search) ||
                    (c.panNumber || "").toLowerCase().includes(search)
                  );
                }).map((c) => (
                  <div
                    key={c._id}
                    className="border-2 border-gray-100 rounded-2xl p-5 shadow-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-2xl transition-all transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-100">
                      <div className="p-3 bg-gradient-to-br from-[#ff004f] to-[#ff3366] rounded-xl shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-800">
                          {c.firstName} {c.lastName}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 font-semibold min-w-[80px]">📞 Phone:</span>
                        <span className="text-gray-800 font-medium">{c.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 font-semibold min-w-[80px]">✉️ Email:</span>
                        <span className="text-gray-800 font-medium break-all">{c.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 font-semibold min-w-[80px]">🆔 Aadhaar:</span>
                        <span className="text-gray-800 font-mono font-medium">{c.aadhaarNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 font-semibold min-w-[80px]">💳 PAN:</span>
                        <span className="text-gray-800 font-mono font-bold">{c.panNumber}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4 pt-4 border-t-2 border-gray-100">
                      <button
                        className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                        onClick={() => {
                          setEditCandidate(normalizeCandidate(c));
                          setShowEditModal(true);
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                        onClick={() => {
                          setSelectedCandidate(normalizeCandidate(c));
                          setShowDeleteModal(true);
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showAddModal && (
        <Modal title="Add Candidate" onClose={() => setShowAddModal(false)}>
          <CandidateForm
            data={newCandidate}
            onChange={handleAddChange}
            onSubmit={handleAdd}
            saving={saving}
            submitText="Add Candidate"
          />
        </Modal>
      )}

      {showEditModal && (
        <Modal title="Edit Candidate" onClose={() => setShowEditModal(false)}>
          <CandidateForm
            data={editCandidate}
            onChange={handleEditChange}
            onSubmit={handleEdit}
            saving={saving}
            submitText="Save Changes"
          />
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          title="Delete Candidate"
          onClose={() => setShowDeleteModal(false)}
        >
          <p className="text-gray-800">
            Are you sure you want to delete{" "}
            <strong>
              {selectedCandidate?.firstName} {selectedCandidate?.lastName}
            </strong>
            ?
          </p>

          <button
            onClick={handleDelete}
            disabled={saving}
            className="mt-6 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            {saving ? <Loader2 className="animate-spin mx-auto" /> : "Delete"}
          </button>
        </Modal>
      )}

      {/* GLOBAL MODAL */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md"
          >
            <h2
              className={`text-lg font-semibold ${
                modal.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {modal.type === "error" ? "Error" : "Success"}
            </h2>

            <p className="mt-3 text-gray-700 whitespace-pre-wrap">
              {modal.message}
            </p>

            <button
              onClick={() => setModal({ show: false, type: "", message: "" })}
              className="mt-5 w-full py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              OK
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------- */
/* MODAL COMPONENT */
/* -------------------------------------------- */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg text-gray-900 overflow-hidden"
      >
        {/* Enhanced Header with Gradient */}
        <div className="bg-gradient-to-r from-[#ff004f] to-[#ff3366] px-6 py-4 relative sticky top-0 z-10">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-1 transition-all"
          >
            <X size={22} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="text-white/80 text-sm">Fill in candidate information</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------- */
/* FORM COMPONENT — WITH FULL NEW FIELDS */
/* -------------------------------------------- */
function CandidateForm({ data, onChange, onSubmit, saving, submitText }) {
  return (
    <div className="text-gray-900">
      {/* FULL NAME */}
      <h3 className="font-semibold text-lg mb-3 text-[#ff004f]">
        Personal Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          name="firstName"
          value={data.firstName}
          onChange={onChange}
          placeholder="First Name*"
          className="border p-2 rounded"
        />

        <input
          name="middleName"
          value={data.middleName}
          onChange={onChange}
          placeholder="Middle Name (Optional)"
          className="border p-2 rounded"
        />

        <input
          name="lastName"
          value={data.lastName}
          onChange={onChange}
          placeholder="Last Name*"
          className="border p-2 rounded"
        />
      </div>

      {/* FATHER NAME */}
      <input
        name="fatherName"
        value={data.fatherName}
        onChange={onChange}
        placeholder="Father's Name*"
        className="border p-2 rounded w-full mt-4"
      />

      {/* DOB + GENDER PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Date of Birth*
          </label>
          <input
            type="date"
            name="dob"
            value={data.dob}
            onChange={onChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* 🔥 PREMIUM GENDER BUTTONS */}
        <div>
          <label className="block text-sm font-medium mb-1">Gender*</label>
          <div className="flex gap-3">
            {["male", "female", "other"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() =>
                  onChange({ target: { name: "gender", value: g } })
                }
                className={`px-4 py-2 rounded-md border flex-1 capitalize ${
                  data.gender === g
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTACT */}
      <h3 className="font-semibold text-lg mt-6 mb-3 text-red-600">
        Contact Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="phone"
          value={data.phone}
          onChange={onChange}
          placeholder="Phone Number*"
          className="border p-2 rounded"
        />

        <input
          name="email"
          value={data.email}
          onChange={onChange}
          placeholder="Email*"
          type="email"
          className="border p-2 rounded"
        />
      </div>

      {/* IDENTITY */}
      <h3 className="font-semibold text-lg mt-6 mb-3 text-red-600">
        Identity Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          name="aadhaarNumber"
          value={data.aadhaarNumber}
          onChange={onChange}
          placeholder="Aadhaar* (12 digits)"
          className="border p-2 rounded"
        />

        <input
          name="panNumber"
          value={data.panNumber}
          onChange={onChange}
          placeholder="PAN* (ABCDE1234F)"
          className="border p-2 rounded uppercase"
        />

        <input
          name="uanNumber"
          value={data.uanNumber}
          onChange={onChange}
          placeholder="UAN Number"
          className="border p-2 rounded"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <input
          name="passportNumber"
          value={data.passportNumber}
          onChange={onChange}
          placeholder="Passport Number (Optional)"
          className="border p-2 rounded uppercase"
        />

        <input
          name="bankAccountNumber"
          value={data.bankAccountNumber}
          onChange={onChange}
          placeholder="Bank Account Number (Optional)"
          className="border p-2 rounded"
        />

        <input
          name="pincode"
          value={data.pincode}
          onChange={onChange}
          placeholder="Pincode*"
          className="border p-2 rounded"
        />
      </div>

      {/* ADDRESS */}
      <h3 className="font-semibold text-lg mt-6 mb-3 text-red-600">
        Address Details
      </h3>

      <textarea
        name="address"
        value={data.address}
        onChange={onChange}
        placeholder="Full Address*"
        rows={3}
        className="border p-2 rounded w-full"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <input
          name="district"
          value={data.district}
          onChange={onChange}
          placeholder="District*"
          className="border p-2 rounded"
        />

        <input
          name="state"
          value={data.state}
          onChange={onChange}
          placeholder="State*"
          className="border p-2 rounded"
        />
      </div>
      <h3 className="font-semibold text-lg mt-6 mb-3 text-red-600">
        Resume Upload (Optional)
      </h3>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => onChange(e, true)}
        className="border p-2 rounded w-full"
      />

      {data.resume && (
        <p className="text-sm mt-2 text-gray-700">
          Selected: <span className="font-semibold">{data.resume.name}</span>
        </p>
      )}

      {/* SUBMIT BUTTON */}
      <div className="mt-8 pt-6 border-t-2 border-gray-100">
        <button
          onClick={onSubmit}
          disabled={saving}
          className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#ff004f] to-[#ff3366] hover:shadow-2xl hover:shadow-[#ff004f]/30"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>💾 {submitText}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
