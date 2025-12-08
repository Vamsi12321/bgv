"use client";
import { useEffect, useState } from "react";
import { PlusCircle, X, Edit, Trash2, Loader2,UserSearch } from "lucide-react";
import { motion } from "framer-motion";
import { useOrgState } from "../../context/OrgStateContext";



/* -------------------------------------------- */
/* NORMALIZE CANDIDATE                          */
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

/* ====================================================================== */
/* =======================  MAIN COMPONENT =============================== */
/* ====================================================================== */

export default function ManageCandidatesPage() {
  const {
    candidatesData: candidates,
    setCandidatesData: setCandidates,
    candidatesFilters: filters,
    setCandidatesFilters: setFilters,
  } = useOrgState();

  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [newCandidate, setNewCandidate] = useState(normalizeCandidate({}));
  const [editCandidate, setEditCandidate] = useState(normalizeCandidate({}));

  const [saving, setSaving] = useState(false);
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
  /* ---------------------------------------------- */
  /* CONFIRMATION MODAL STATE */
  /* ---------------------------------------------- */
  const [confirmClose, setConfirmClose] = useState({
    open: false,
    target: null, // "add" | "edit" | "delete"
  });

  /* -------------------------------------------- */
  /* GET ORG ID FROM LOGGED IN USER               */
  /* -------------------------------------------- */
  const bgvUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("bgvUser") || "{}")
      : {};

  const orgId = bgvUser?.organizationId;

  /* -------------------------------------------- */
  /* LOAD CANDIDATES FOR ORG                      */
  /* -------------------------------------------- */
  const loadCandidates = async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/secure/getCandidates?orgId=${orgId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) setCandidates(data.candidates || []);
      else showError(data.detail || "Failed to load candidates");
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      // Only load if we don't have data
      if (candidates.length === 0) {
        loadCandidates();
      }
    }
  }, [orgId]);

  /* ====================================================================== */
  /* =========================== VALIDATION =============================== */
  /* ====================================================================== */

  const isEmpty = (v) => !v || String(v).trim() === "";
  const digitOnly = (v) => v.replace(/\D/g, "");

  const isValidAadhaar = (v) => /^\d{12}$/.test(v);
  const isValidPAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
  const isValidPhone = (v) => /^\d{10}$/.test(v);
  const isValidPassport = (v) => v === "" || /^[A-PR-WY][1-9]\d{6}$/.test(v);
  const isValidUAN = (v) => v === "" || /^[0-9]{10,12}$/.test(v);
  const isValidAccount = (v) => v === "" || /^[0-9]{9,18}$/.test(v);
  const isValidPincode = (v) => /^[1-9][0-9]{5}$/.test(v);

  /* Name validation → only letters and spaces, no numbers */
  const isValidName = (v) => /^[a-zA-Z\s]+$/.test(v);

  const validateCandidate = (c) => {
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

  /* ====================================================================== */
  /* =============================== ADD ================================== */
  /* ====================================================================== */

  const handleAddChange = (e, isFile = false) => {
    if (isFile) {
      setNewCandidate((p) => ({ ...p, resume: e.target.files[0] }));
      return;
    }

    let { name, value } = e.target;

    if (name === "panNumber")
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (name === "aadhaarNumber") value = digitOnly(value).slice(0, 12);
    if (name === "phone") value = digitOnly(value).slice(0, 10);

    setNewCandidate((p) => ({ ...p, [name]: value }));
  };

  const handleAdd = async () => {
    if (!validateCandidate(newCandidate)) return;

    setSaving(true);

    try {
      const formData = new FormData();

      // 🔥 ALL FIELDS EXACTLY AS BACKEND NEEDS
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

      // org-level auto organizationId
      formData.append("organizationId", orgId);

      // resume optional
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
      loadCandidates();
    } catch (err) {
      showError(err?.message || "Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = (candidate, initial) =>
    JSON.stringify(candidate) !== JSON.stringify(initial);

  /* ====================================================================== */
  /* =============================== EDIT ================================= */
  /* ====================================================================== */
  const handleEditChange = (e, isFile = false) => {
    if (isFile) {
      setEditCandidate((p) => ({ ...p, resume: e.target.files[0] }));
      return;
    }

    let { name, value } = e.target;

    if (name === "panNumber")
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (name === "aadhaarNumber") value = digitOnly(value).slice(0, 12);
    if (name === "phone") value = digitOnly(value).slice(0, 10);

    setEditCandidate((p) => ({ ...p, [name]: value }));
  };

  const handleEdit = async () => {
    if (!validateCandidate(editCandidate)) return;

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("operation", "edit");
      formData.append("candidateId", editCandidate._id);
      formData.append("organizationId", orgId);

      // ALL editable fields
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
      loadCandidates();
    } catch (err) {
      showError(err?.message || "Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ====================================================================== */
  /* ============================== DELETE ================================ */
  /* ====================================================================== */
  const handleDelete = async () => {
    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("operation", "delete");
      formData.append("candidateId", selectedCandidate._id);
      formData.append("organizationId", orgId);

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
      loadCandidates();
    } catch (err) {
      showError(err?.message || "Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ====================================================================== */
  /* =============================== UI =================================== */
  /* ====================================================================== */

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserSearch size={24} /> Manage Candidates
            </h1>
            <p className="text-gray-700 mt-1">
              Add, edit, and delete candidates for your organization.
            </p>
          </div>

          <button
            onClick={() => {
              setNewCandidate(normalizeCandidate({}));
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff004f] hover:bg-[#e60047] text-white"
          >
            <PlusCircle size={18} />
            Add Candidate
          </button>
        </div>

        {/* SEARCH FILTER */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-white p-6 rounded-2xl shadow-xl border-2 border-gray-100">
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

        {/* LIST */}
        <div className="bg-white p-6 rounded-lg shadow border text-gray-900">
          {loading ? (
            <div className="text-center py-10 text-gray-600">Loading...</div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              No candidates found.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
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
                  <tbody>
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
                      <tr
                        key={c._id}
                        className="border-b hover:bg-[#ffeef3] transition"
                      >
                        <td className="p-3">
                          {c.firstName} {c.lastName}
                        </td>
                        <td className="p-3">{c.phone}</td>
                        <td className="p-3">{c.email}</td>
                        <td className="p-3">{c.aadhaarNumber}</td>
                        <td className="p-3">{c.panNumber}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                              onClick={() => {
                                setEditCandidate(normalizeCandidate(c));
                                setShowEditModal(true);
                              }}
                            >
                              <Edit size={18} />
                            </button>

                            <button
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-[#ffeef3] rounded transition"
                              onClick={() => {
                                setSelectedCandidate(normalizeCandidate(c));
                                setShowDeleteModal(true);
                              }}
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

              {/* MOBILE CARDS - Enhanced */}
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
                    className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02]"
                  >
                    <div className="font-semibold text-lg">
                      {c.firstName} {c.lastName}
                    </div>

                    <div className="text-sm mt-1 text-gray-700">
                      📞 {c.phone}
                    </div>
                    <div className="text-sm text-gray-700">✉️ {c.email}</div>

                    <div className="text-sm text-gray-700 mt-2">
                      Aadhaar: {c.aadhaarNumber}
                    </div>
                    <div className="text-sm text-gray-700">
                      PAN: {c.panNumber}
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        className="flex-1 py-2 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 transition"
                        onClick={() => {
                          setEditCandidate(normalizeCandidate(c));
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="flex-1 py-2 rounded border border-red-500 text-red-600 hover:bg-[#ffeef3] transition"
                        onClick={() => {
                          setSelectedCandidate(normalizeCandidate(c));
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <Modal
          title="Add Candidate"
          onClose={() => {
            if (hasChanges(newCandidate, normalizeCandidate({}))) {
              setConfirmClose({ open: true, target: "add" });
            } else {
              setShowAddModal(false);
            }
          }}
        >
          <CandidateForm
            data={newCandidate}
            onChange={handleAddChange}
            onSubmit={handleAdd}
            saving={saving}
            submitText="Add Candidate"
          />
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <Modal
          title="Edit Candidate"
          onClose={() => {
            const original = candidates.find(
              (c) => c._id === editCandidate._id
            );
            if (hasChanges(editCandidate, normalizeCandidate(original))) {
              setConfirmClose({ open: true, target: "edit" });
            } else {
              setShowEditModal(false);
            }
          }}
        >
          <CandidateForm
            data={editCandidate}
            onChange={handleEditChange}
            onSubmit={handleEdit}
            saving={saving}
            submitText="Save Changes"
          />
        </Modal>
      )}

      {/* DELETE MODAL */}
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

      {/* GLOBAL SUCCESS/ERROR MODAL */}
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
      {/* CONFIRM CLOSE MODAL */}
      {confirmClose.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border">
            <h2 className="text-lg font-bold text-gray-800">
              Discard Changes?
            </h2>
            <p className="text-gray-600 mt-2">
              Are you sure you want to close? All unsaved changes will be lost.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmClose({ open: false, target: null })}
                className="w-1/2 py-2 rounded bg-gray-200 text-gray-800 font-medium hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (confirmClose.target === "add") {
                    setShowAddModal(false);
                    setNewCandidate(normalizeCandidate({}));
                  }
                  if (confirmClose.target === "edit") {
                    setShowEditModal(false);
                    setEditCandidate(normalizeCandidate({}));
                  }
                  setConfirmClose({ open: false, target: null });
                }}
                className="w-1/2 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/* ============================== MODAL ================================ */
/* ====================================================================== */

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      {/* backdrop click also triggers confirmation */}
      <div
        className="absolute inset-0"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      ></div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto text-gray-900"
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
          <h2 className="text-xl font-semibold">{title}</h2>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-600 hover:text-black"
          >
            <X size={22} />
          </button>
        </div>

        {children}
      </motion.div>
    </div>
  );
}

/* ====================================================================== */
/* =============================== FORM ================================ */
/* ====================================================================== */

function CandidateForm({ data, onChange, onSubmit, saving, submitText }) {
  return (
    <div className="text-gray-900">
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

      <input
        name="fatherName"
        value={data.fatherName}
        onChange={onChange}
        placeholder="Father's Name*"
        className="border p-2 rounded w-full mt-4"
      />

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
        <p className="text-sm text-gray-700 mt-2">
          Selected: <span className="font-semibold">{data.resume.name}</span>
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={saving}
        className="mt-6 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
      >
        {saving ? <Loader2 className="animate-spin" /> : submitText}
      </button>
    </div>
  );
}
