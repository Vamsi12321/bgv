"use client";
import { useEffect, useState } from "react";
import { PlusCircle, X, Edit, Trash2, Loader2, Users, ChevronDown } from "lucide-react";
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

  // Supervisory Check 1 - FLAT STRUCTURE
  supervisory1_name: c.supervisoryCheck1?.name ?? c.supervisory1_name ?? "",
  supervisory1_phone: c.supervisoryCheck1?.phone ?? c.supervisory1_phone ?? "",
  supervisory1_email: c.supervisoryCheck1?.email ?? c.supervisory1_email ?? "",
  supervisory1_relationship: c.supervisoryCheck1?.relationship ?? c.supervisory1_relationship ?? "",
  supervisory1_company: c.supervisoryCheck1?.company ?? c.supervisory1_company ?? "",
  supervisory1_designation: c.supervisoryCheck1?.designation ?? c.supervisory1_designation ?? "",
  supervisory1_workingPeriod: c.supervisoryCheck1?.workingPeriod ?? c.supervisory1_workingPeriod ?? "",

  // Supervisory Check 2 - FLAT STRUCTURE
  supervisory2_name: c.supervisoryCheck2?.name ?? c.supervisory2_name ?? "",
  supervisory2_phone: c.supervisoryCheck2?.phone ?? c.supervisory2_phone ?? "",
  supervisory2_email: c.supervisoryCheck2?.email ?? c.supervisory2_email ?? "",
  supervisory2_relationship: c.supervisoryCheck2?.relationship ?? c.supervisory2_relationship ?? "",
  supervisory2_company: c.supervisoryCheck2?.company ?? c.supervisory2_company ?? "",
  supervisory2_designation: c.supervisoryCheck2?.designation ?? c.supervisory2_designation ?? "",
  supervisory2_workingPeriod: c.supervisoryCheck2?.workingPeriod ?? c.supervisory2_workingPeriod ?? "",

  // Employment History 1 - FLAT STRUCTURE
  employment1_company: c.employmentHistory1?.company ?? c.employment1_company ?? "",
  employment1_designation: c.employmentHistory1?.designation ?? c.employment1_designation ?? "",
  employment1_joiningDate: c.employmentHistory1?.joiningDate ?? c.employment1_joiningDate ?? "",
  employment1_relievingDate: c.employmentHistory1?.relievingDate ?? c.employment1_relievingDate ?? "",
  employment1_hrContact: c.employmentHistory1?.hrContact ?? c.employment1_hrContact ?? "",
  employment1_hrEmail: c.employmentHistory1?.hrEmail ?? c.employment1_hrEmail ?? "",
  employment1_hrName: c.employmentHistory1?.hrName ?? c.employment1_hrName ?? "",
  employment1_address: c.employmentHistory1?.address ?? c.employment1_address ?? "",
  relievingLetter1: c.employmentHistory1?.relievingLetter ?? c.relievingLetter1 ?? null,
  experienceLetter1: c.employmentHistory1?.experienceLetter ?? c.experienceLetter1 ?? null,
  salarySlips1: c.employmentHistory1?.salarySlips ?? c.salarySlips1 ?? null,
  relievingLetterUrl1: c.employmentHistory1?.relievingLetterUrl ?? c.relievingLetterUrl1 ?? "",
  experienceLetterUrl1: c.employmentHistory1?.experienceLetterUrl ?? c.experienceLetterUrl1 ?? "",
  salarySlipsUrl1: c.employmentHistory1?.salarySlipsUrl ?? c.salarySlipsUrl1 ?? "",

  // Employment History 2 - FLAT STRUCTURE
  employment2_company: c.employmentHistory2?.company ?? c.employment2_company ?? "",
  employment2_designation: c.employmentHistory2?.designation ?? c.employment2_designation ?? "",
  employment2_joiningDate: c.employmentHistory2?.joiningDate ?? c.employment2_joiningDate ?? "",
  employment2_relievingDate: c.employmentHistory2?.relievingDate ?? c.employment2_relievingDate ?? "",
  employment2_hrContact: c.employmentHistory2?.hrContact ?? c.employment2_hrContact ?? "",
  employment2_hrEmail: c.employmentHistory2?.hrEmail ?? c.employment2_hrEmail ?? "",
  employment2_hrName: c.employmentHistory2?.hrName ?? c.employment2_hrName ?? "",
  employment2_address: c.employmentHistory2?.address ?? c.employment2_address ?? "",
  relievingLetter2: c.employmentHistory2?.relievingLetter ?? c.relievingLetter2 ?? null,
  experienceLetter2: c.employmentHistory2?.experienceLetter ?? c.experienceLetter2 ?? null,
  salarySlips2: c.employmentHistory2?.salarySlips ?? c.salarySlips2 ?? null,
  relievingLetterUrl2: c.employmentHistory2?.relievingLetterUrl ?? c.relievingLetterUrl2 ?? "",
  experienceLetterUrl2: c.employmentHistory2?.experienceLetterUrl ?? c.experienceLetterUrl2 ?? "",
  salarySlipsUrl2: c.employmentHistory2?.salarySlipsUrl ?? c.salarySlipsUrl2 ?? "",

  // Education Check - FLAT STRUCTURE
  education_degree: c.educationCheck?.degree ?? c.education_degree ?? "",
  education_specialization: c.educationCheck?.specialization ?? c.education_specialization ?? "",
  education_universityName: c.educationCheck?.universityName ?? c.education_universityName ?? "",
  education_collegeName: c.educationCheck?.collegeName ?? c.education_collegeName ?? "",
  education_yearOfPassing: c.educationCheck?.yearOfPassing ?? c.education_yearOfPassing ?? "",
  education_cgpa: c.educationCheck?.cgpa ?? c.education_cgpa ?? "",
  education_universityContact: c.educationCheck?.universityContact ?? c.education_universityContact ?? "",
  education_universityEmail: c.educationCheck?.universityEmail ?? c.education_universityEmail ?? "",
  education_universityAddress: c.educationCheck?.universityAddress ?? c.education_universityAddress ?? "",
  education_collegeContact: c.educationCheck?.collegeContact ?? c.education_collegeContact ?? "",
  education_collegeEmail: c.educationCheck?.collegeEmail ?? c.education_collegeEmail ?? "",
  education_collegeAddress: c.educationCheck?.collegeAddress ?? c.education_collegeAddress ?? "",
  educationCertificate: c.educationCheck?.certificate ?? c.educationCertificate ?? null,
  marksheet: c.educationCheck?.marksheet ?? c.marksheet ?? null,
  certificateUrl: c.educationCheck?.certificateUrl ?? c.certificateUrl ?? "",
  marksheetUrl: c.educationCheck?.marksheetUrl ?? c.marksheetUrl ?? "",
});

/* ====================================================================== */
/* =======================  MAIN COMPONENT =============================== */
/* ====================================================================== */

export default function ManageCandidatesPage() {
  const [candidates, setCandidates] = useState([]);
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

  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState(null);

  const showError = (msg) => {
    // Handle both string messages and objects with detail property
    const errorMessage = typeof msg === 'string' ? msg : (msg?.detail || msg?.message || 'An error occurred');
    setModal({ show: true, type: "error", message: errorMessage });
  };

  const showSuccess = (msg) => {
    const successMessage = typeof msg === 'string' ? msg : (msg?.message || 'Operation successful');
    setModal({ show: true, type: "success", message: successMessage });
  };

  // Create truly empty candidate object (no default values for close detection)
  const createEmptyCandidate = () => ({
    _id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    fatherName: "",
    dob: "",
    gender: "", // No default value initially
    phone: "",
    email: "",
    aadhaarNumber: "",
    panNumber: "",
    uanNumber: "",
    passportNumber: "",
    bankAccountNumber: "",
    address: "",
    district: "",
    state: "",
    pincode: "",
    supervisory1_name: "",
    supervisory1_phone: "",
    supervisory1_email: "",
    supervisory1_relationship: "",
    supervisory1_company: "",
    supervisory1_designation: "",
    supervisory1_workingPeriod: "",
    supervisory2_name: "",
    supervisory2_phone: "",
    supervisory2_email: "",
    supervisory2_relationship: "",
    supervisory2_company: "",
    supervisory2_designation: "",
    supervisory2_workingPeriod: "",
    employment1_company: "",
    employment1_designation: "",
    employment1_joiningDate: "",
    employment1_relievingDate: "",
    employment1_hrContact: "",
    employment1_hrEmail: "",
    employment1_hrName: "",
    employment1_address: "",
    relievingLetter1: null,
    experienceLetter1: null,
    salarySlips1: null,
    relievingLetterUrl1: "",
    experienceLetterUrl1: "",
    salarySlipsUrl1: "",
    employment2_company: "",
    employment2_designation: "",
    employment2_joiningDate: "",
    employment2_relievingDate: "",
    employment2_hrContact: "",
    employment2_hrEmail: "",
    employment2_hrName: "",
    employment2_address: "",
    relievingLetter2: null,
    experienceLetter2: null,
    salarySlips2: null,
    relievingLetterUrl2: "",
    experienceLetterUrl2: "",
    salarySlipsUrl2: "",
    education_degree: "",
    education_specialization: "",
    education_universityName: "",
    education_collegeName: "",
    education_yearOfPassing: "",
    education_cgpa: "",
    education_universityContact: "",
    education_universityEmail: "",
    education_universityAddress: "",
    education_collegeContact: "",
    education_collegeEmail: "",
    education_collegeAddress: "",
    educationCertificate: null,
    marksheet: null,
    certificateUrl: "",
    marksheetUrl: "",
  });

  // Check if any form data has been entered
  const hasFormData = (candidateData) => {
    // Check all text fields (excluding gender since it has a default value)
    const textFields = [
      'firstName', 'middleName', 'lastName', 'fatherName', 'dob',
      'phone', 'email', 'aadhaarNumber', 'panNumber', 'uanNumber', 
      'passportNumber', 'bankAccountNumber', 'district', 'state', 'pincode', 'address',
      'supervisory1_name', 'supervisory1_phone', 'supervisory1_email', 'supervisory1_relationship',
      'supervisory1_company', 'supervisory1_designation', 'supervisory1_workingPeriod',
      'supervisory2_name', 'supervisory2_phone', 'supervisory2_email', 'supervisory2_relationship',
      'supervisory2_company', 'supervisory2_designation', 'supervisory2_workingPeriod',
      'employment1_company', 'employment1_designation', 'employment1_joiningDate', 'employment1_relievingDate',
      'employment1_hrContact', 'employment1_hrEmail', 'employment1_hrName', 'employment1_address',
      'employment2_company', 'employment2_designation', 'employment2_joiningDate', 'employment2_relievingDate',
      'employment2_hrContact', 'employment2_hrEmail', 'employment2_hrName', 'employment2_address',
      'education_degree', 'education_specialization', 'education_universityName', 'education_collegeName',
      'education_yearOfPassing', 'education_cgpa', 'education_universityContact', 'education_universityEmail',
      'education_universityAddress', 'education_collegeContact', 'education_collegeEmail', 'education_collegeAddress'
    ];
    
    // Check if any text field has data
    const hasTextData = textFields.some(field => candidateData[field]?.trim());
    
    // Check gender separately (only consider it changed if it's not empty)
    const hasGenderChange = candidateData.gender && candidateData.gender.trim();
    
    // Check if any file has been selected
    const hasFileData = candidateData.resume || candidateData.relievingLetter1 || 
                       candidateData.experienceLetter1 || candidateData.salarySlips1 ||
                       candidateData.relievingLetter2 || candidateData.experienceLetter2 || 
                       candidateData.salarySlips2 || candidateData.educationCertificate || 
                       candidateData.marksheet;
    
    return hasTextData || hasGenderChange || hasFileData;
  };

  // Handle modal close with smart confirmation
  const handleSmartClose = (modalType, resetAction) => {
    const candidateData = modalType === 'add' ? newCandidate : editCandidate;
    
    if (hasFormData(candidateData)) {
      setPendingCloseAction(resetAction);
      setShowConfirmClose(true);
    } else {
      // No data entered, close directly
      resetAction();
    }
  };

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
      loadCandidates();
    }
  }, [orgId]);

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

  /* -------------------------------------------- */
  /* ADD CANDIDATE */
  /* -------------------------------------------- */
  const handleAddChange = (e, isFile = false, fileField = null) => {
    if (isFile) {
      const file = e.target.files[0];
      
      // Handle file uploads with flat field names
      if (fileField) {
        setNewCandidate((p) => ({ ...p, [fileField]: file }));
        return;
      }
      
      // Handle top-level file (resume)
      setNewCandidate((p) => ({ ...p, resume: file }));
      return;
    }

    let { name, value } = e.target;

    // Auto-format specific fields based on field name
    if (name.includes('phone') || name.includes('hrContact') || name.includes('Contact')) {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    
    // Auto-format top-level fields
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
      formData.append("firstName", newCandidate.firstName || "");
      formData.append("middleName", newCandidate.middleName || "");
      formData.append("lastName", newCandidate.lastName || "");
      formData.append("phone", newCandidate.phone || "");
      formData.append("aadhaarNumber", newCandidate.aadhaarNumber || "");
      formData.append("panNumber", newCandidate.panNumber || "");
      formData.append("address", newCandidate.address || "");
      formData.append("email", newCandidate.email || "");
      formData.append("fatherName", newCandidate.fatherName || "");
      formData.append("dob", newCandidate.dob || "");
      formData.append("gender", newCandidate.gender || "");
      formData.append("uanNumber", newCandidate.uanNumber || "");
      formData.append("passportNumber", newCandidate.passportNumber || "");
      formData.append("bankAccountNumber", newCandidate.bankAccountNumber || "");
      formData.append("district", newCandidate.district || "");
      formData.append("state", newCandidate.state || "");
      formData.append("pincode", newCandidate.pincode || "");
      formData.append("organizationId", orgId);

      // Supervisory Check 1 Fields (flat structure as backend expects)
      formData.append("supervisory1_name", newCandidate.supervisory1_name || "");
      formData.append("supervisory1_phone", newCandidate.supervisory1_phone || "");
      formData.append("supervisory1_email", newCandidate.supervisory1_email || "");
      formData.append("supervisory1_relationship", newCandidate.supervisory1_relationship || "");
      formData.append("supervisory1_company", newCandidate.supervisory1_company || "");
      formData.append("supervisory1_designation", newCandidate.supervisory1_designation || "");
      formData.append("supervisory1_workingPeriod", newCandidate.supervisory1_workingPeriod || "");

      // Supervisory Check 2 Fields
      formData.append("supervisory2_name", newCandidate.supervisory2_name || "");
      formData.append("supervisory2_phone", newCandidate.supervisory2_phone || "");
      formData.append("supervisory2_email", newCandidate.supervisory2_email || "");
      formData.append("supervisory2_relationship", newCandidate.supervisory2_relationship || "");
      formData.append("supervisory2_company", newCandidate.supervisory2_company || "");
      formData.append("supervisory2_designation", newCandidate.supervisory2_designation || "");
      formData.append("supervisory2_workingPeriod", newCandidate.supervisory2_workingPeriod || "");

      // Employment History 1 Fields
      formData.append("employment1_company", newCandidate.employment1_company || "");
      formData.append("employment1_designation", newCandidate.employment1_designation || "");
      formData.append("employment1_joiningDate", newCandidate.employment1_joiningDate || "");
      formData.append("employment1_relievingDate", newCandidate.employment1_relievingDate || "");
      formData.append("employment1_hrContact", newCandidate.employment1_hrContact || "");
      formData.append("employment1_hrEmail", newCandidate.employment1_hrEmail || "");
      formData.append("employment1_hrName", newCandidate.employment1_hrName || "");
      formData.append("employment1_address", newCandidate.employment1_address || "");

      // Employment History 2 Fields
      formData.append("employment2_company", newCandidate.employment2_company || "");
      formData.append("employment2_designation", newCandidate.employment2_designation || "");
      formData.append("employment2_joiningDate", newCandidate.employment2_joiningDate || "");
      formData.append("employment2_relievingDate", newCandidate.employment2_relievingDate || "");
      formData.append("employment2_hrContact", newCandidate.employment2_hrContact || "");
      formData.append("employment2_hrEmail", newCandidate.employment2_hrEmail || "");
      formData.append("employment2_hrName", newCandidate.employment2_hrName || "");
      formData.append("employment2_address", newCandidate.employment2_address || "");

      // Education Check Fields
      formData.append("education_degree", newCandidate.education_degree || "");
      formData.append("education_specialization", newCandidate.education_specialization || "");
      formData.append("education_universityName", newCandidate.education_universityName || "");
      formData.append("education_collegeName", newCandidate.education_collegeName || "");
      formData.append("education_yearOfPassing", newCandidate.education_yearOfPassing || "");
      formData.append("education_cgpa", newCandidate.education_cgpa || "");
      formData.append("education_universityContact", newCandidate.education_universityContact || "");
      formData.append("education_universityEmail", newCandidate.education_universityEmail || "");
      formData.append("education_universityAddress", newCandidate.education_universityAddress || "");
      formData.append("education_collegeContact", newCandidate.education_collegeContact || "");
      formData.append("education_collegeEmail", newCandidate.education_collegeEmail || "");
      formData.append("education_collegeAddress", newCandidate.education_collegeAddress || "");

      // Document Uploads
      if (newCandidate.resume) {
        formData.append("resume", newCandidate.resume);
      }
      
      if (newCandidate.relievingLetter1) {
        formData.append("relievingLetter1", newCandidate.relievingLetter1);
      }
      if (newCandidate.experienceLetter1) {
        formData.append("experienceLetter1", newCandidate.experienceLetter1);
      }
      if (newCandidate.salarySlips1) {
        formData.append("salarySlips1", newCandidate.salarySlips1);
      }
      
      if (newCandidate.relievingLetter2) {
        formData.append("relievingLetter2", newCandidate.relievingLetter2);
      }
      if (newCandidate.experienceLetter2) {
        formData.append("experienceLetter2", newCandidate.experienceLetter2);
      }
      if (newCandidate.salarySlips2) {
        formData.append("salarySlips2", newCandidate.salarySlips2);
      }
      
      if (newCandidate.educationCertificate) {
        formData.append("educationCertificate", newCandidate.educationCertificate);
      }
      if (newCandidate.marksheet) {
        formData.append("marksheet", newCandidate.marksheet);
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
      setNewCandidate(createEmptyCandidate());
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
  const handleEditChange = (e, isFile = false, fileField = null) => {
    if (isFile) {
      const file = e.target.files[0];
      
      // Handle file uploads with flat field names
      if (fileField) {
        setEditCandidate((p) => ({ ...p, [fileField]: file }));
        return;
      }
      
      // Handle top-level file (resume)
      setEditCandidate((p) => ({ ...p, resume: file }));
      return;
    }

    let { name, value } = e.target;

    // Auto-format specific fields based on field name
    if (name.includes('phone') || name.includes('hrContact') || name.includes('Contact')) {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    
    // Auto-format top-level fields
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
      formData.append("organizationId", orgId);

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

      // Supervisory Check 1 Fields (flat structure as backend expects)
      formData.append("supervisory1_name", editCandidate.supervisory1_name || "");
      formData.append("supervisory1_phone", editCandidate.supervisory1_phone || "");
      formData.append("supervisory1_email", editCandidate.supervisory1_email || "");
      formData.append("supervisory1_relationship", editCandidate.supervisory1_relationship || "");
      formData.append("supervisory1_company", editCandidate.supervisory1_company || "");
      formData.append("supervisory1_designation", editCandidate.supervisory1_designation || "");
      formData.append("supervisory1_workingPeriod", editCandidate.supervisory1_workingPeriod || "");

      // Supervisory Check 2 Fields
      formData.append("supervisory2_name", editCandidate.supervisory2_name || "");
      formData.append("supervisory2_phone", editCandidate.supervisory2_phone || "");
      formData.append("supervisory2_email", editCandidate.supervisory2_email || "");
      formData.append("supervisory2_relationship", editCandidate.supervisory2_relationship || "");
      formData.append("supervisory2_company", editCandidate.supervisory2_company || "");
      formData.append("supervisory2_designation", editCandidate.supervisory2_designation || "");
      formData.append("supervisory2_workingPeriod", editCandidate.supervisory2_workingPeriod || "");

      // Employment History 1 Fields
      formData.append("employment1_company", editCandidate.employment1_company || "");
      formData.append("employment1_designation", editCandidate.employment1_designation || "");
      formData.append("employment1_joiningDate", editCandidate.employment1_joiningDate || "");
      formData.append("employment1_relievingDate", editCandidate.employment1_relievingDate || "");
      formData.append("employment1_hrContact", editCandidate.employment1_hrContact || "");
      formData.append("employment1_hrEmail", editCandidate.employment1_hrEmail || "");
      formData.append("employment1_hrName", editCandidate.employment1_hrName || "");
      formData.append("employment1_address", editCandidate.employment1_address || "");

      // Employment History 2 Fields
      formData.append("employment2_company", editCandidate.employment2_company || "");
      formData.append("employment2_designation", editCandidate.employment2_designation || "");
      formData.append("employment2_joiningDate", editCandidate.employment2_joiningDate || "");
      formData.append("employment2_relievingDate", editCandidate.employment2_relievingDate || "");
      formData.append("employment2_hrContact", editCandidate.employment2_hrContact || "");
      formData.append("employment2_hrEmail", editCandidate.employment2_hrEmail || "");
      formData.append("employment2_hrName", editCandidate.employment2_hrName || "");
      formData.append("employment2_address", editCandidate.employment2_address || "");

      // Education Check Fields
      formData.append("education_degree", editCandidate.education_degree || "");
      formData.append("education_specialization", editCandidate.education_specialization || "");
      formData.append("education_universityName", editCandidate.education_universityName || "");
      formData.append("education_collegeName", editCandidate.education_collegeName || "");
      formData.append("education_yearOfPassing", editCandidate.education_yearOfPassing || "");
      formData.append("education_cgpa", editCandidate.education_cgpa || "");
      formData.append("education_universityContact", editCandidate.education_universityContact || "");
      formData.append("education_universityEmail", editCandidate.education_universityEmail || "");
      formData.append("education_universityAddress", editCandidate.education_universityAddress || "");
      formData.append("education_collegeContact", editCandidate.education_collegeContact || "");
      formData.append("education_collegeEmail", editCandidate.education_collegeEmail || "");
      formData.append("education_collegeAddress", editCandidate.education_collegeAddress || "");

      // Document Uploads
      if (editCandidate.resume) {
        formData.append("resume", editCandidate.resume);
      }
      
      if (editCandidate.relievingLetter1) {
        formData.append("relievingLetter1", editCandidate.relievingLetter1);
      }
      if (editCandidate.experienceLetter1) {
        formData.append("experienceLetter1", editCandidate.experienceLetter1);
      }
      if (editCandidate.salarySlips1) {
        formData.append("salarySlips1", editCandidate.salarySlips1);
      }
      
      if (editCandidate.relievingLetter2) {
        formData.append("relievingLetter2", editCandidate.relievingLetter2);
      }
      if (editCandidate.experienceLetter2) {
        formData.append("experienceLetter2", editCandidate.experienceLetter2);
      }
      if (editCandidate.salarySlips2) {
        formData.append("salarySlips2", editCandidate.salarySlips2);
      }
      
      if (editCandidate.educationCertificate) {
        formData.append("educationCertificate", editCandidate.educationCertificate);
      }
      if (editCandidate.marksheet) {
        formData.append("marksheet", editCandidate.marksheet);
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
      await loadCandidates();
    } catch (err) {
      showError(err?.message || "Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
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
              setNewCandidate(createEmptyCandidate());
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold w-full sm:w-auto shadow transition-all hover:shadow-lg bg-[#ff004f] hover:bg-[#e60047]"
          >
            <PlusCircle size={18} />
            Add Candidate
          </button>
        </div>

        {/* CANDIDATE SEARCH FILTER */}
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
        <Modal 
          title="Add Candidate" 
          onClose={() => handleSmartClose('add', () => {
            setShowAddModal(false);
            setNewCandidate(createEmptyCandidate());
          })}
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

      {showEditModal && (
        <Modal 
          title="Edit Candidate" 
          onClose={() => handleSmartClose('edit', () => {
            setShowEditModal(false);
            setEditCandidate(normalizeCandidate({}));
          })}
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

      {/* CONFIRM CLOSE MODAL */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-2">Discard Changes?</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have unsaved changes. Are you sure you want to close without saving?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmClose(false);
                  setPendingCloseAction(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmClose(false);
                  if (pendingCloseAction) {
                    pendingCloseAction();
                    setPendingCloseAction(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Discard Changes
              </button>
            </div>
          </motion.div>
        </div>
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

    </div>
  );
}

/* ====================================================================== */
/* ============================== MODAL ================================ */
/* ====================================================================== */

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
/* -------------------------------------------- */
/* FORM COMPONENT — WITH FULL NEW FIELDS */
/* -------------------------------------------- */
function CandidateForm({ data, onChange, onSubmit, saving, submitText }) {
  const [expandedSections, setExpandedSections] = useState({
    supervisory1: false,
    supervisory2: false,
    employment1: false,
    employment2: false,
    education: false,
  });

  const [validationError, setValidationError] = useState("");

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmitWithValidation = () => {
    // Validate required fields
    if (!data.firstName?.trim() || !data.lastName?.trim() || !data.email?.trim() || !data.phone?.trim()) {
      setValidationError("Please fill all required details");
      return;
    }
    
    // Clear validation error and proceed with submission
    setValidationError("");
    onSubmit();
  };

  const handleInputChange = (e) => {
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError("");
    }
    onChange(e);
  };

  return (
    <div className="text-gray-900 max-h-[70vh] overflow-y-auto pr-2">
      {/* Validation Error Message */}
      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span>
            {validationError}
          </p>
        </div>
      )}

      {/* FULL NAME */}
      <h3 className="font-semibold text-lg mb-3 text-[#ff004f]">
        Personal Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          name="firstName"
          value={data.firstName}
          onChange={handleInputChange}
          placeholder="First Name*"
          className="border p-2 rounded"
        />

        <input
          name="middleName"
          value={data.middleName}
          onChange={handleInputChange}
          placeholder="Middle Name (Optional)"
          className="border p-2 rounded"
        />

        <input
          name="lastName"
          value={data.lastName}
          onChange={handleInputChange}
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
          onChange={handleInputChange}
          placeholder="Phone Number*"
          className="border p-2 rounded"
        />

        <input
          name="email"
          value={data.email}
          onChange={handleInputChange}
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

      {/* ============================================ */}
      {/* SUPERVISORY CHECK 1 - COLLAPSIBLE */}
      {/* ============================================ */}
      <div className="mt-6 border-2 border-blue-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('supervisory1')}
          className="w-full bg-gradient-to-r from-blue-50 to-blue-100 p-4 flex justify-between items-center hover:from-blue-100 hover:to-blue-200 transition-all"
        >
          <h3 className="font-semibold text-lg text-blue-700">
            👤 Supervisory Check 1 (Optional)
          </h3>
          <ChevronDown
            className={`transform transition-transform ${expandedSections.supervisory1 ? 'rotate-180' : ''}`}
            size={20}
          />
        </button>
        
        {expandedSections.supervisory1 && (
          <div className="p-4 bg-white space-y-3">
            <input
              name="supervisory1_name"
              value={data.supervisory1_name || ''}
              onChange={onChange}
              placeholder="Supervisor Name"
              className="border p-2 rounded w-full"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory1_phone"
                value={data.supervisory1_phone || ''}
                onChange={onChange}
                placeholder="Phone Number"
                className="border p-2 rounded"
              />
              <input
                name="supervisory1_email"
                value={data.supervisory1_email || ''}
                onChange={onChange}
                placeholder="Email"
                type="email"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory1_relationship"
                value={data.supervisory1_relationship || ''}
                onChange={onChange}
                placeholder="Relationship (e.g., Former Manager)"
                className="border p-2 rounded"
              />
              <input
                name="supervisory1_company"
                value={data.supervisory1_company || ''}
                onChange={onChange}
                placeholder="Company Name"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory1_designation"
                value={data.supervisory1_designation || ''}
                onChange={onChange}
                placeholder="Designation"
                className="border p-2 rounded"
              />
              <input
                name="supervisory1_workingPeriod"
                value={data.supervisory1_workingPeriod || ''}
                onChange={onChange}
                placeholder="Working Period (e.g., 2020-2023)"
                className="border p-2 rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* SUPERVISORY CHECK 2 - COLLAPSIBLE */}
      {/* ============================================ */}
      <div className="mt-4 border-2 border-blue-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('supervisory2')}
          className="w-full bg-gradient-to-r from-blue-50 to-blue-100 p-4 flex justify-between items-center hover:from-blue-100 hover:to-blue-200 transition-all"
        >
          <h3 className="font-semibold text-lg text-blue-700">
            👤 Supervisory Check 2 (Optional)
          </h3>
          <ChevronDown 
            className={`transform transition-transform ${expandedSections.supervisory2 ? 'rotate-180' : ''}`}
            size={20}
          />
        </button>
        
        {expandedSections.supervisory2 && (
          <div className="p-4 bg-white space-y-3">
            <input
              name="supervisory2_name"
              value={data.supervisory2_name || ''}
              onChange={onChange}
              placeholder="Supervisor Name"
              className="border p-2 rounded w-full"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory2_phone"
                value={data.supervisory2_phone || ''}
                onChange={onChange}
                placeholder="Phone Number"
                className="border p-2 rounded"
              />
              <input
                name="supervisory2_email"
                value={data.supervisory2_email || ''}
                onChange={onChange}
                placeholder="Email"
                type="email"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory2_relationship"
                value={data.supervisory2_relationship || ''}
                onChange={onChange}
                placeholder="Relationship (e.g., Former Team Lead)"
                className="border p-2 rounded"
              />
              <input
                name="supervisory2_company"
                value={data.supervisory2_company || ''}
                onChange={onChange}
                placeholder="Company Name"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="supervisory2_designation"
                value={data.supervisory2_designation || ''}
                onChange={onChange}
                placeholder="Designation"
                className="border p-2 rounded"
              />
              <input
                name="supervisory2_workingPeriod"
                value={data.supervisory2_workingPeriod || ''}
                onChange={onChange}
                placeholder="Working Period (e.g., 2018-2020)"
                className="border p-2 rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* EMPLOYMENT HISTORY 1 - COLLAPSIBLE */}
      {/* ============================================ */}
      <div className="mt-4 border-2 border-green-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('employment1')}
          className="w-full bg-gradient-to-r from-green-50 to-green-100 p-4 flex justify-between items-center hover:from-green-100 hover:to-green-200 transition-all"
        >
          <h3 className="font-semibold text-lg text-green-700">
            🏢 Employment History 1 (Optional)
          </h3>
          <ChevronDown 
            className={`transform transition-transform ${expandedSections.employment1 ? 'rotate-180' : ''}`}
            size={20}
          />
        </button>
        
        {expandedSections.employment1 && (
          <div className="p-4 bg-white space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="employment1_company"
                value={data.employment1_company || ''}
                onChange={onChange}
                placeholder="Company Name"
                className="border p-2 rounded"
              />
              <input
                name="employment1_designation"
                value={data.employment1_designation || ''}
                onChange={onChange}
                placeholder="Designation"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Joining Date</label>
                <input
                  type="date"
                  name="employment1_joiningDate"
                  value={data.employment1_joiningDate || ''}
                  onChange={onChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Relieving Date</label>
                <input
                  type="date"
                  name="employment1_relievingDate"
                  value={data.employment1_relievingDate || ''}
                  onChange={onChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                name="employment1_hrName"
                value={data.employment1_hrName || ''}
                onChange={onChange}
                placeholder="HR Name"
                className="border p-2 rounded"
              />
              <input
                name="employment1_hrContact"
                value={data.employment1_hrContact || ''}
                onChange={onChange}
                placeholder="HR Contact"
                className="border p-2 rounded"
              />
              <input
                name="employment1_hrEmail"
                value={data.employment1_hrEmail || ''}
                onChange={onChange}
                placeholder="HR Email"
                type="email"
                className="border p-2 rounded"
              />
            </div>
            <textarea
              name="employment1_address"
              value={data.employment1_address || ''}
              onChange={onChange}
              placeholder="Company Address"
              rows={2}
              className="border p-2 rounded w-full"
            />
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Relieving Letter* (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onChange(e, true, 'relievingLetter1')}
                  className="border p-2 rounded w-full"
                />
                {data.relievingLetter1 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.relievingLetter1.name}
                  </p>
                )}
                {!data.relievingLetter1 && data.relievingLetterUrl1 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Letter (PDF, Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onChange(e, true, 'experienceLetter1')}
                  className="border p-2 rounded w-full"
                />
                {data.experienceLetter1 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.experienceLetter1.name}
                  </p>
                )}
                {!data.experienceLetter1 && data.experienceLetterUrl1 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Slips (PDF, Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onChange(e, true, 'salarySlips1')}
                  className="border p-2 rounded w-full"
                />
                {data.salarySlips1 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.salarySlips1.name}
                  </p>
                )}
                {!data.salarySlips1 && data.salarySlipsUrl1 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* EMPLOYMENT HISTORY 2 - COLLAPSIBLE */}
      {/* ============================================ */}
      <div className="mt-4 border-2 border-green-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('employment2')}
          className="w-full bg-gradient-to-r from-green-50 to-green-100 p-4 flex justify-between items-center hover:from-green-100 hover:to-green-200 transition-all"
        >
          <h3 className="font-semibold text-lg text-green-700">
            🏢 Employment History 2 (Optional)
          </h3>
          <ChevronDown 
            className={`transform transition-transform ${expandedSections.employment2 ? 'rotate-180' : ''}`}
            size={20}
          />
        </button>
        
        {expandedSections.employment2 && (
          <div className="p-4 bg-white space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="employment2_company"
                value={data.employment2_company || ''}
                onChange={onChange}
                placeholder="Company Name"
                className="border p-2 rounded"
              />
              <input
                name="employment2_designation"
                value={data.employment2_designation || ''}
                onChange={onChange}
                placeholder="Designation"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Joining Date</label>
                <input
                  type="date"
                  name="employment2_joiningDate"
                  value={data.employment2_joiningDate || ''}
                  onChange={onChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Relieving Date</label>
                <input
                  type="date"
                  name="employment2_relievingDate"
                  value={data.employment2_relievingDate || ''}
                  onChange={onChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                name="employment2_hrName"
                value={data.employment2_hrName || ''}
                onChange={onChange}
                placeholder="HR Name"
                className="border p-2 rounded"
              />
              <input
                name="employment2_hrContact"
                value={data.employment2_hrContact || ''}
                onChange={onChange}
                placeholder="HR Contact"
                className="border p-2 rounded"
              />
              <input
                name="employment2_hrEmail"
                value={data.employment2_hrEmail || ''}
                onChange={onChange}
                placeholder="HR Email"
                type="email"
                className="border p-2 rounded"
              />
            </div>
            <textarea
              name="employment2_address"
              value={data.employment2_address || ''}
              onChange={onChange}
              placeholder="Company Address"
              rows={2}
              className="border p-2 rounded w-full"
            />
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Relieving Letter* (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onChange(e, true, 'relievingLetter2')}
                  className="border p-2 rounded w-full"
                />
                {data.relievingLetter2 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.relievingLetter2.name}
                  </p>
                )}
                {!data.relievingLetter2 && data.relievingLetterUrl2 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Letter (PDF, Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onChange(e, true, 'experienceLetter2')}
                  className="border p-2 rounded w-full"
                />
                {data.experienceLetter2 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.experienceLetter2.name}
                  </p>
                )}
                {!data.experienceLetter2 && data.experienceLetterUrl2 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Slips (PDF, Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onChange(e, true, 'salarySlips2')}
                  className="border p-2 rounded w-full"
                />
                {data.salarySlips2 && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.salarySlips2.name}
                  </p>
                )}
                {!data.salarySlips2 && data.salarySlipsUrl2 && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* EDUCATION CHECK - COLLAPSIBLE */}
      {/* ============================================ */}
      <div className="mt-4 border-2 border-purple-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('education')}
          className="w-full bg-gradient-to-r from-purple-50 to-purple-100 p-4 flex justify-between items-center hover:from-purple-100 hover:to-purple-200 transition-all"
        >
          <h3 className="font-semibold text-lg text-purple-700">
            🎓 Education Check (Optional)
          </h3>
          <ChevronDown 
            className={`transform transition-transform ${expandedSections.education ? 'rotate-180' : ''}`}
            size={20}
          />
        </button>
        
        {expandedSections.education && (
          <div className="p-4 bg-white space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree Certificate (PDF, Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onChange(e, true, 'educationCertificate')}
                  className="border p-2 rounded w-full"
                />
                {data.educationCertificate && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.educationCertificate.name}
                  </p>
                )}
                {!data.educationCertificate && data.educationCertificateUrl && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marksheet (PDF, Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => onChange(e, true, 'marksheet')}
                  className="border p-2 rounded w-full"
                />
                {data.marksheet && (
                  <p className="text-xs mt-1 text-green-600">
                    ✓ New file: {data.marksheet.name}
                  </p>
                )}
                {!data.marksheet && data.marksheetUrl && (
                  <p className="text-xs mt-1 text-blue-600">
                    📄 Existing file uploaded
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="education_degree"
                value={data.education_degree || ''}
                onChange={onChange}
                placeholder="Degree (e.g., Bachelor of Technology)"
                className="border p-2 rounded"
              />
              <input
                name="education_specialization"
                value={data.education_specialization || ''}
                onChange={onChange}
                placeholder="Specialization"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="education_universityName"
                value={data.education_universityName || ''}
                onChange={onChange}
                placeholder="University Name"
                className="border p-2 rounded"
              />
              <input
                name="education_collegeName"
                value={data.education_collegeName || ''}
                onChange={onChange}
                placeholder="College Name"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="education_yearOfPassing"
                value={data.education_yearOfPassing || ''}
                onChange={onChange}
                placeholder="Year of Passing"
                className="border p-2 rounded"
              />
              <input
                name="education_cgpa"
                value={data.education_cgpa || ''}
                onChange={onChange}
                placeholder="CGPA/Percentage"
                className="border p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                name="education_universityContact"
                value={data.education_universityContact || ''}
                onChange={onChange}
                placeholder="University Contact"
                className="border p-2 rounded"
              />
              <input
                name="education_universityEmail"
                value={data.education_universityEmail || ''}
                onChange={onChange}
                placeholder="University Email"
                type="email"
                className="border p-2 rounded"
              />
              <input
                name="education_collegeContact"
                value={data.education_collegeContact || ''}
                onChange={onChange}
                placeholder="College Contact"
                className="border p-2 rounded"
              />
            </div>
            <input
              name="education_collegeEmail"
              value={data.education_collegeEmail || ''}
              onChange={onChange}
              placeholder="College Email"
              type="email"
              className="border p-2 rounded w-full"
            />
            <textarea
              name="education_universityAddress"
              value={data.education_universityAddress || ''}
              onChange={onChange}
              placeholder="University Address"
              rows={2}
              className="border p-2 rounded w-full"
            />
            <textarea
              name="education_collegeAddress"
              value={data.education_collegeAddress || ''}
              onChange={onChange}
              placeholder="College Address"
              rows={2}
              className="border p-2 rounded w-full"
            />
          </div>
        )}
      </div>

      {/* RESUME UPLOAD */}
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
          onClick={handleSubmitWithValidation}
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
