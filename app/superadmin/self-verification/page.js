"use client";

import { useEffect, useState } from "react";
import {
  PlusCircle,
  Loader2,
  X,
  RefreshCcw,
  CheckCircle,
  Send,
  ChevronRight,
  ChevronDown,
  Shield,
  AlertCircle,
  Info,
  UserCheck,
  FileText,
  User,
  Phone,
  CreditCard,
  MapPin,
  Upload,
} from "lucide-react";

export default function SelfVerificationPage() {
  /* ---------------------------------------------- */
  /* DYNAMIC CHECK CONFIG                            */
  /* ---------------------------------------------- */
  const getCheckConfig = (serviceKey) => {
    const checkConfigs = {
      aadhaar: { title: "Aadhaar Verification", icon: "🪪" },
      pan: { title: "PAN Verification", icon: "💳" },
      bankaccount: { title: "Bank Account Verification", icon: "🏦" },
      uan: { title: "UAN Verification", icon: "🧾" },
      fir: { title: "FIR / Criminal Check", icon: "🛡️" },
      passport: { title: "Passport Verification", icon: "🛂" },
      education: { title: "Education Verification", icon: "🎓" },
      employment: { title: "Employment Verification", icon: "💼" },
      cibil: { title: "CIBIL Credit Check", icon: "📊" },
    };

    const normalizedKey = serviceKey.toLowerCase();
    return (
      checkConfigs[serviceKey] ||
      checkConfigs[normalizedKey] || {
        title: `${serviceKey} Verification`,
        icon: "📋",
      }
    );
  };

  const steps = ["primary", "secondary", "final"];

  const API_CHECKS = [
    "pan_aadhaar_seeding",
    "pan_verification",
    "employment_history",
    "aadhaar_to_uan",
    "credit_report",
    "court_record",
  ];

  const MANUAL_CHECKS = [
    "address_verification",
    "education_check_manual",
    "supervisory_check",
    "employment_history_manual",
  ];

  const AI_CHECKS = ["ai_education_validation"];

  /* ---------------------------------------------- */
  /* STATE                                           */
  /* ---------------------------------------------- */
  const [organizations, setOrganizations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [availableChecks, setAvailableChecks] = useState([]);
  const [candidateVerification, setCandidateVerification] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [orgDetails, setOrgDetails] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [stages, setStages] = useState({
    primary: [],
    secondary: [],
    final: [],
  });

  /* ---------------------------------------------- */
  /* VALIDATION HELPERS                              */
  /* ---------------------------------------------- */

  const validateAadhaar = (v) => /^\d{12}$/.test(v);
  const validatePAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);
  const validatePhone = (v) => /^\d{10}$/.test(v);
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePincode = (v) => /^\d{6}$/.test(v);
  const validateDOB = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);
  const validatePassport = (v) => /^[A-PR-WYa-pr-wy][1-9]\d{6}$/.test(v);
  const validateUAN = (v) => /^\d{12}$/.test(v);
  const validateAccount = (v) => /^\d{6,18}$/.test(v);

  const emptyCandidate = {
    firstName: "",
    middleName: "",
    lastName: "",
    fatherName: "",
    dob: "",
    gender: "",
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

    // Supervisory Check 1 - FLAT STRUCTURE
    supervisory1_name: "",
    supervisory1_phone: "",
    supervisory1_email: "",
    supervisory1_relationship: "",
    supervisory1_company: "",
    supervisory1_designation: "",
    supervisory1_workingPeriod: "",

    // Supervisory Check 2 - FLAT STRUCTURE
    supervisory2_name: "",
    supervisory2_phone: "",
    supervisory2_email: "",
    supervisory2_relationship: "",
    supervisory2_company: "",
    supervisory2_designation: "",
    supervisory2_workingPeriod: "",

    // Employment History 1 - FLAT STRUCTURE
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

    // Employment History 2 - FLAT STRUCTURE
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

    // Education Check - FLAT STRUCTURE
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
  };

  const [newCandidate, setNewCandidate] = useState(emptyCandidate);
  const [expandedSections, setExpandedSections] = useState({
    supervisory1: false,
    supervisory2: false,
    employment1: false,
    employment2: false,
    education: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  /* ---------------------------------------------- */
  /* INPUT SANITIZER                                 */
  /* ---------------------------------------------- */

  const handleInputChange = (e, isFile = false, fileField = null) => {
    if (isFile) {
      const file = e.target.files[0];
      
      // Handle file uploads with flat field names
      if (fileField) {
        setNewCandidate((p) => ({ ...p, [fileField]: file }));
        return;
      }
      
      // Handle top-level file (resume)
      setNewCandidate((prev) => ({
        ...prev,
        resume: e.target.files?.[0] || null,
      }));
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
    if (name === "uanNumber") value = value.replace(/\D/g, "").slice(0, 12);
    if (name === "pincode") value = value.replace(/\D/g, "").slice(0, 6);
    if (name === "bankAccountNumber")
      value = value.replace(/\D/g, "").slice(0, 18);

    setNewCandidate((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = "hidden"; // lock background
    } else {
      document.body.style.overflow = "auto"; // unlock
    }
  }, [showAddModal]);

  /* ---------------------------------------------- */
  /* VALIDATE AND ADD CANDIDATE                      */
  /* ---------------------------------------------- */

  const handleAddCandidate = async () => {
    if (!selectedOrg) {
      return showModal({
        title: "Organization Required",
        message: "Please select an organization first.",
        type: "error",
      });
    }

    const errors = {};

    const {
      firstName,
      lastName,
      phone,
      email,
      aadhaarNumber,
      panNumber,
      address,
      fatherName,
      gender,
      dob,
      district,
      state,
      pincode,
      passportNumber,
      uanNumber,
      bankAccountNumber,
    } = newCandidate;

    // REQUIRED FIELDS
    if (!firstName) errors.firstName = "First Name is required";
    if (!lastName) errors.lastName = "Last Name is required";
    if (!fatherName) errors.fatherName = "Father's Name is required";
    if (!dob) errors.dob = "Date of Birth is required";
    if (!gender) errors.gender = "Gender is required";
    if (!phone) errors.phone = "Phone Number is required";
    if (!email) errors.email = "Email is required";
    if (!aadhaarNumber) errors.aadhaarNumber = "Aadhaar Number is required";
    if (!panNumber) errors.panNumber = "PAN Number is required";
    if (!address) errors.address = "Address is required";
    if (!district) errors.district = "District is required";
    if (!state) errors.state = "State is required";
    if (!pincode) errors.pincode = "Pincode is required";

    // Name validations - only letters and spaces, no numbers
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (firstName && !nameRegex.test(firstName)) {
      errors.firstName = "First Name must contain only letters and spaces, no numbers allowed";
    }
    if (newCandidate.middleName && !nameRegex.test(newCandidate.middleName)) {
      errors.middleName = "Middle Name must contain only letters and spaces, no numbers allowed";
    }
    if (lastName && !nameRegex.test(lastName)) {
      errors.lastName = "Last Name must contain only letters and spaces, no numbers allowed";
    }
    if (fatherName && !nameRegex.test(fatherName)) {
      errors.fatherName = "Father's Name must contain only letters and spaces, no numbers allowed";
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !emailRegex.test(email)) {
      errors.email = "Invalid email format. Please enter a valid email address (e.g., user@example.com)";
    } else if (email && (!email.includes('@') || !email.split('@')[1]?.includes('.'))) {
      errors.email = "Email must include @ symbol and a valid domain (e.g., user@gmail.com)";
    }

    // Phone validation
    if (phone && !/^\d{10}$/.test(phone)) {
      errors.phone = "Invalid phone number. Must be exactly 10 digits";
    }

    // Aadhaar validation
    if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber)) {
      errors.aadhaarNumber = "Invalid Aadhaar number. Must be exactly 12 digits";
    }

    // PAN validation
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      errors.panNumber = "Invalid PAN format. Must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)";
    }

    // District and State validation - only letters and spaces
    if (district && !nameRegex.test(district)) {
      errors.district = "District must contain only letters and spaces, no numbers or special characters allowed";
    }

    if (state && !nameRegex.test(state)) {
      errors.state = "State must contain only letters and spaces, no numbers or special characters allowed";
    }

    // Pincode validation
    if (pincode && !/^[1-9][0-9]{5}$/.test(pincode)) {
      errors.pincode = "Invalid Pincode. Must be exactly 6 digits and cannot start with 0";
    }

    // Optional field validations
    if (passportNumber && !/^[A-PR-WY][1-9]\d{6}$/.test(passportNumber)) {
      errors.passportNumber = "Invalid Passport Number. Must be in format: A1234567 (1 letter followed by 7 digits)";
    }

    if (uanNumber && !/^[0-9]{10,12}$/.test(uanNumber)) {
      errors.uanNumber = "Invalid UAN Number. Must be 10-12 digits";
    }

    if (bankAccountNumber && !/^[0-9]{9,18}$/.test(bankAccountNumber)) {
      errors.bankAccountNumber = "Invalid Bank Account Number. Must be 9-18 digits";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    // API ADD CALL
    try {
      const formData = new FormData();

      formData.append("organizationId", selectedOrg);
      formData.append("firstName", newCandidate.firstName);
      formData.append("middleName", newCandidate.middleName);
      formData.append("lastName", newCandidate.lastName);
      formData.append("fatherName", newCandidate.fatherName);
      formData.append("dob", newCandidate.dob);
      formData.append("gender", newCandidate.gender);
      formData.append("phone", newCandidate.phone);
      formData.append("email", newCandidate.email);
      formData.append("aadhaarNumber", newCandidate.aadhaarNumber);
      formData.append("panNumber", newCandidate.panNumber);
      formData.append("uanNumber", newCandidate.uanNumber);
      formData.append("passportNumber", newCandidate.passportNumber);
      formData.append("bankAccountNumber", newCandidate.bankAccountNumber);
      formData.append("address", newCandidate.address);
      formData.append("district", newCandidate.district);
      formData.append("state", newCandidate.state);
      formData.append("pincode", newCandidate.pincode);

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
        body: formData, // ❗ NO HEADERS
      });

      const data = await res.json();

      if (!res.ok) {
        return showModal({
          title: "Error Adding Candidate",
          message: data.detail || "Server error",
          type: "error",
        });
      }

      showModal({
        title: "Success",
        message: "Candidate added successfully.",
        type: "success",
      });
      setShowAddModal(false);
      await fetchCandidates(selectedOrg);
      setNewCandidate(emptyCandidate);
      setExpandedSections({
        supervisory1: false,
        supervisory2: false,
        employment1: false,
        employment2: false,
        education: false,
      });

      // 🔥 FIX: Reset candidate selection + verification data
      setSelectedCandidate("");
      setCandidateVerification(null);

      // Reset UI stages
      setStages({ primary: [], secondary: [], final: [] });
      setCurrentStep(0);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------- */
  /* MODAL SYSTEM                                    */
  /* ---------------------------------------------- */
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = ({ title, message, type }) =>
    setModal({
      open: true,
      title,
      message,
      type: type || "info",
    });

  const closeModal = () =>
    setModal({
      open: false,
      title: "",
      message: "",
      type: "info",
    });

  /* ---------------------------------------------- */
  /* FETCH ORGANIZATIONS                             */
  /* ---------------------------------------------- */

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/proxy/secure/getOrganizations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setOrganizations(data.organizations || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  /* ---------------------------------------------- */
  /* FETCH SERVICES + CANDIDATES                     */
  /* ---------------------------------------------- */

  const handleOrgSelect = (orgId) => {
    setSelectedOrg(orgId);
    setSelectedCandidate("");
    setCandidateVerification(null);

    setStages({ primary: [], secondary: [], final: [] });
    setCurrentStep(0);

    if (!orgId) {
      setAvailableChecks([]);
      setOrgDetails(null);
      return;
    }

    const org = organizations.find((o) => o._id === orgId);
    setOrgDetails(org || null);

    if (org?.services?.length) {
      // Extract service names
      const serviceNames = org.services
        .filter((s) => s.serviceName?.trim())
        .map((s) => s.serviceName.toLowerCase());

      // 🔥 API-ONLY FILTER
      const apiChecksOnly = serviceNames.filter((svc) =>
        API_CHECKS.includes(svc)
      );

      // Convert to UI object
      const dynamicChecks = apiChecksOnly.map((key) => ({
        key,
        ...getCheckConfig(key),
        type: "API", // mark type if needed later
      }));

      setAvailableChecks(dynamicChecks);
    } else {
      setAvailableChecks([]);
    }

    fetchCandidates(orgId);
  };

  const fetchCandidates = async (orgId) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/secure/getCandidates?orgId=${orgId}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok) setCandidates(data.candidates || []);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------- */
  /* REFRESH VERIFICATION                            */
  /* ---------------------------------------------- */

  const refreshVerification = async (candidateId) => {
    if (!candidateId) {
      setCandidateVerification(null);
      setStages({ primary: [], secondary: [], final: [] });
      setCurrentStep(0);
      return;
    }

    setLoadingCandidate(true);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/proxy/secure/getVerifications?candidateId=${candidateId}`,
        { credentials: "include" }
      );

      const data = await res.json();

      // 🚨 NEW LOGIC — if no verifications → clear UI
      if (!res.ok || !data.verifications || data.verifications.length === 0) {
        setCandidateVerification(null);
        setStages({ primary: [], secondary: [], final: [] });
        setCurrentStep(0);
        return; // 🛑 stop processing
      }

      // existing logic for when verification exists
      const v = data.verifications[0];
      setCandidateVerification(v);

      const idx = steps.indexOf(v.currentStage);
      setCurrentStep(idx);

      const newStages = { primary: [], secondary: [], final: [] };
      steps.forEach((stage) => {
        if (Array.isArray(v.stages?.[stage])) {
          newStages[stage] = v.stages[stage].map((c) => c.check);
        }
      });

      setStages(newStages);
    } finally {
      setLoading(false);
      setLoadingCandidate(false);
    }
  };

  /* ---------------------------------------------- */
  /* STAGE STATUS LOGIC                              */
  /* ---------------------------------------------- */

  const getStageStatus = (stageKey) => {
    const data = candidateVerification?.stages?.[stageKey];

    if (!Array?.isArray(data) || data.length === 0) return "PENDING";
    if (data.every((c) => c.status === "COMPLETED")) return "COMPLETED";
    if (data.some((c) => c.status === "IN_PROGRESS")) return "IN_PROGRESS";
    if (data.some((c) => c.status === "FAILED")) return "FAILED";

    return "PENDING";
  };

  const isStageInitiated = (stage) => {
    const s = getStageStatus(stage);
    return s === "COMPLETED" || s === "IN_PROGRESS";
  };

  const isPrevStageCompleted = (stage) => {
    const idx = steps.indexOf(stage);
    if (idx === 0) return true;
    return getStageStatus(steps[idx - 1]) === "COMPLETED";
  };

  /* ---------------------------------------------- */
  /* CHECK VISIBILITY (MOBILE SAFE - NO SHIFTING)    */
  /* ---------------------------------------------- */

  const visibleCheckCards = () => {
    const stageKey = steps[currentStep];

    if (isStageInitiated(stageKey)) {
      return availableChecks.filter((c) => stages[stageKey].includes(c.key));
    }

    const usedBefore = new Set();
    for (let i = 0; i < currentStep; i++) {
      stages[steps[i]].forEach((ck) => usedBefore.add(ck));
    }

    return availableChecks.filter(
      (c) => !usedBefore.has(c.key) && !stages[stageKey].includes(c.key)
    );
  };

  /* ---------------------------------------------- */
  /* TOGGLE CHECK                                    */
  /* ---------------------------------------------- */

  const handleToggle = (checkKey) => {
    const stageKey = steps[currentStep];

    if (isStageInitiated(stageKey)) return;
    if (!isPrevStageCompleted(stageKey)) return;

    setStages((prev) => {
      const exists = prev[stageKey].includes(checkKey);
      return {
        ...prev,
        [stageKey]: exists
          ? prev[stageKey].filter((c) => c !== checkKey)
          : [...prev[stageKey], checkKey],
      };
    });
  };

  /* ---------------------------------------------- */
  /* REMOVE CHECK (CONFIRMATION)                     */
  /* ---------------------------------------------- */

  const removeCheckFromLeft = (checkKey) => {
    setModal({
      open: true,
      title: "Remove Selected Check?",
      message: `Do you want to remove '${checkKey}' from this stage?`,
      type: "confirm",
      checkKeyToRemove: checkKey,
    });
  };

  const confirmRemoveCheck = () => {
    const checkKey = modal.checkKeyToRemove;
    const stageKey = steps[currentStep];

    setStages((prev) => ({
      ...prev,
      [stageKey]: prev[stageKey].filter((c) => c !== checkKey),
    }));

    setModal({
      open: false,
      title: "",
      message: "",
      type: "info",
      checkKeyToRemove: null,
    });
  };

  /* ---------------------------------------------- */
  /* INITIATE STAGE                                  */
  /* ---------------------------------------------- */

  const initiateStage = async (stageKey) => {
    if (!selectedOrg || !selectedCandidate) {
      return showModal({
        title: "Missing Selection",
        message: "Please select an organization & candidate.",
        type: "error",
      });
    }

    if (!isPrevStageCompleted(stageKey)) {
      return showModal({
        title: "Previous Stage Incomplete",
        message: "Complete previous stage first.",
        type: "error",
      });
    }

    const selectedChecks = stages[stageKey];
    if (!selectedChecks.length) {
      return showModal({
        title: "No Checks Selected",
        message: "Select at least one verification check.",
        type: "error",
      });
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/proxy/secure/initiateStage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          candidateId: selectedCandidate,
          organizationId: selectedOrg,
          stage: stageKey,
          checks: selectedChecks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return showModal({
          title: "Failed to Initiate",
          message: data.detail || data.message || "Server error",
          type: "error",
        });
      }

      showModal({
        title: "Stage Initiated",
        message: `${stageKey.toUpperCase()} stage successfully initiated.`,
        type: "success",
      });

      await refreshVerification(selectedCandidate);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------- */
  /* STAGE TABLE (RESPONSIVE)                        */
  /* ---------------------------------------------- */

  const StageTable = ({ title, stageKey }) => {
    const data = candidateVerification?.stages?.[stageKey] || [];
    const stageStatus = getStageStatus(stageKey);

    const getCheckTitle = (key) => {
      const check = availableChecks.find((c) => c.key === key);
      return check?.title || key;
    };

    return (
      <div className="bg-white rounded-2xl border-2 shadow-lg p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] rounded-lg">
              <FileText className="text-white" size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>

          <span
            className={`px-3 py-1.5 text-xs rounded-full font-bold border ${
              stageStatus === "COMPLETED"
                ? "bg-green-100 text-green-800 border-green-300"
                : stageStatus === "IN_PROGRESS"
                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                : stageStatus === "FAILED"
                ? "bg-red-100 text-red-800 border-red-300"
                : "bg-gray-100 text-gray-800 border-gray-300"
            }`}
          >
            {stageStatus}
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                <th className="p-4 text-left font-bold text-gray-900 border-b-2">
                  Check
                </th>
                <th className="p-4 text-left font-bold text-gray-900 border-b-2">
                  Status
                </th>
                <th className="p-4 text-left font-bold text-gray-900 border-b-2">
                  Remarks
                </th>
                <th className="p-4 text-left font-bold text-gray-900 border-b-2">
                  Submitted At
                </th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No checks initiated
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {getCheckTitle(item.check)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          item.status === "COMPLETED"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : item.status === "IN_PROGRESS"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : item.status === "FAILED"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : "bg-gray-100 text-gray-800 border border-gray-300"
                        }`}
                      >
                        {item.status === "COMPLETED" && "✓"}
                        {item.status === "FAILED" && "✗"}
                        {item.status === "IN_PROGRESS" && "⏳"}
                        {item.status}
                      </span>
                    </td>

                    <td className="p-4 max-w-xs">
                      {item.remarks ? (
                        typeof item.remarks === "string" ? (
                          <div className="text-xs bg-gray-50 p-3 rounded-lg border break-words whitespace-pre-wrap">
                            {item.remarks}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {Object.entries(item.remarks).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="text-xs bg-gray-50 p-2 rounded-lg border break-words"
                                >
                                  <span className="font-semibold capitalize">
                                    {key}:{" "}
                                  </span>
                                  {value === null ? "—" : String(value)}
                                </div>
                              )
                            )}
                          </div>
                        )
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>

                    <td className="p-4 text-gray-700 whitespace-nowrap">
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-4">
          {data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No checks initiated
            </div>
          ) : (
            data.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border-2 rounded-xl shadow-md p-4 space-y-3"
              >
                {/* Check Name */}
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-bold text-gray-900 text-base flex-1">
                    {getCheckTitle(item.check)}
                  </h4>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                      item.status === "COMPLETED"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : item.status === "IN_PROGRESS"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                        : item.status === "FAILED"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                  >
                    {item.status === "COMPLETED" && "✓ "}
                    {item.status === "FAILED" && "✗ "}
                    {item.status === "IN_PROGRESS" && "⏳ "}
                    {item.status}
                  </span>
                </div>

                {/* Remarks */}
                {item.remarks && (
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="font-semibold text-gray-700 text-xs mb-2">
                      Remarks:
                    </div>
                    <div className="space-y-1">
                      {Object.entries(item.remarks).map(([key, value]) => (
                        <div
                          key={key}
                          className="text-xs text-gray-700 break-words"
                        >
                          <span className="font-semibold capitalize">
                            {key}:{" "}
                          </span>
                          <span>{value === null ? "—" : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submitted At */}
                {item.submittedAt && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-semibold">Submitted:</span>
                    <span>{new Date(item.submittedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };
  /* ---------------------------------------------- */
  /* STAGE HEADER (RESPONSIVE + NO SHIFT)            */
  /* ---------------------------------------------- */

  const StageHeader = ({ stageKey, index, isActive, onClick }) => {
    const status = getStageStatus(stageKey);
    const canNavigate =
      index === 0 ||
      steps.slice(0, index).every((st) => getStageStatus(st) === "COMPLETED");

    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
          isActive
            ? "bg-red-50 border-2 border-red-200"
            : canNavigate
            ? "bg-gray-50 border-2 border-gray-200 hover:bg-gray-100"
            : "bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed"
        }`}
        onClick={() => canNavigate && onClick()}
      >
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold ${
            status === "COMPLETED"
              ? "bg-green-600 text-white"
              : isActive
              ? "bg-red-600 text-white"
              : "bg-gray-400 text-white"
          }`}
        >
          {status === "COMPLETED" ? <CheckCircle size={18} /> : index + 1}
        </div>

        <div className="flex-1">
          <div
            className={`font-semibold ${
              isActive ? "text-red-600" : "text-gray-700"
            }`}
          >
            {stageKey.toUpperCase()} STAGE
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {status.toLowerCase()} • {stages[stageKey]?.length || 0} checks
            selected
          </div>
        </div>

        {canNavigate && !isActive && (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </div>
    );
  };

  function SearchableDropdown({ label, value, options, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = options.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="w-full relative">
        {label && (
          <label className="text-sm font-bold text-gray-700 mb-2 block">
            {label}
          </label>
        )}

        {/* Trigger Box - Enhanced */}
        <div
          className={`
          border-2 rounded-xl px-4 py-3 bg-white 
          flex justify-between items-center cursor-pointer
          transition-all duration-200 shadow-sm
          ${
            disabled
              ? "bg-gray-100 cursor-not-allowed border-gray-300"
              : "hover:border-[#ff004f] hover:shadow-md border-gray-300"
          }
        `}
          onClick={() => !disabled && setOpen(!open)}
        >
          <span
            className={`text-sm font-medium truncate ${
              value ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {options.find((o) => o.value === value)?.label || "Select..."}
          </span>
          <ChevronDown
            size={20}
            className={`text-gray-600 flex-shrink-0 ml-2 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Dropdown - Enhanced */}
        {open && !disabled && (
          <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-3">
            {/* Search input */}
            <input
              type="text"
              placeholder="🔍 Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none transition"
            />

            {/* Results */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="p-4 text-gray-500 text-sm text-center">
                  No results found
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.value}
                    className="px-4 py-3 text-sm rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-[#ff004f] transition-all duration-150 font-medium"
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {item.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------------------------------------- */
  /* UI START                                        */
  /* ---------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 px-4 sm:px-6 md:px-10 py-6">
      {/* Loading Overlay */}
      {loadingCandidate && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#ff004f]" size={48} />
          </div>
        </>
      )}

      {/* ERROR / SUCCESS / CONFIRM MODAL */}
      {modal.open && modal.type !== "confirmClose" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border">
            <h2
              className={`text-xl font-semibold mb-2 ${
                modal.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {modal.title}
            </h2>

            <p className="text-gray-700 whitespace-pre-wrap mb-4">
              {modal.message}
            </p>

            {modal.type === "confirm" ? (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() =>
                    setModal({
                      open: false,
                      title: "",
                      message: "",
                      type: "info",
                    })
                  }
                  className="w-1/2 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveCheck}
                  className="w-1/2 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Yes, Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  setModal({
                    open: false,
                    title: "",
                    message: "",
                    type: "info",
                  })
                }
                className={`mt-2 w-full py-2 rounded-lg text-white ${
                  modal.type === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff004f]/5 via-transparent to-purple-500/5"></div>
          <div className="relative p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <UserCheck size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    Self Verification Services
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base">
                    Initiate candidate self-verification with automated checks
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INFORMATIVE BANNER */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 shadow-md overflow-hidden">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="text-blue-600 flex-shrink-0 mt-1"
              size={24}
            />
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-2">
                Self-Verification Information
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p className="flex items-center gap-2">
                  <span className="font-semibold">🔐 Candidate Initiated:</span>
                  <span>
                    Self-verification allows candidates to complete their own
                    verification checks through a secure portal.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">⚡ API-Only Checks:</span>
                  <span>
                    Only automated API-based verification checks are available
                    for self-verification (PAN, Aadhaar, Employment, etc.).
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">📋 Stage-Based Process:</span>
                  <span>
                    Select checks for each stage (Primary, Secondary, Final) and
                    initiate verification. Candidates will receive instructions
                    to complete.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">✅ Automated Results:</span>
                  <span>
                    Results are automatically processed and displayed in the
                    summary tables below once candidates complete their
                    verification.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS ROW */}
        <div className="flex justify-end gap-3 flex-wrap">
          <div className="flex gap-3 flex-wrap">
            <button
              disabled={!selectedCandidate}
              onClick={() => refreshVerification(selectedCandidate)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                selectedCandidate
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <RefreshCcw size={16} /> Refresh
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (!selectedOrg) {
                  return showModal({
                    title: "Organization Required",
                    message:
                      "Please select an organization before adding a candidate.",
                    type: "error",
                  });
                }
                setShowAddModal(true);
              }}
            >
              <PlusCircle size={16} /> Add Candidate
            </button>
          </div>
        </div>

        {/* STEPPER - ENHANCED */}
        <div className="bg-white border-2 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Verification Progress
            </h3>
            <span className="text-sm text-gray-600">
              {getStageStatus("primary") === "COMPLETED" &&
              getStageStatus("secondary") === "COMPLETED" &&
              getStageStatus("final") === "COMPLETED"
                ? "All Stages Complete ✓"
                : `Stage ${currentStep + 1} of 3`}
            </span>
          </div>
          <div className="flex justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-500"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>

            {steps.map((stageKey, idx) => {
              const active = idx === currentStep;
              const status = getStageStatus(stageKey);
              const done = status === "COMPLETED";

              return (
                <div
                  key={stageKey}
                  className="flex flex-col items-center gap-2 flex-1 relative"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg transition-all duration-300 transform ${
                      done
                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white scale-110"
                        : active
                        ? "bg-gradient-to-br from-[#ff004f] to-[#ff6f6f] text-white scale-110 ring-4 ring-red-200"
                        : "bg-white border-2 border-gray-300 text-gray-500"
                    }`}
                  >
                    {done ? <CheckCircle size={20} /> : idx + 1}
                  </div>
                  <div className="text-center">
                    <div
                      className={`font-bold text-sm ${
                        active
                          ? "text-[#ff004f]"
                          : done
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {stageKey.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">
                      {done
                        ? "✓ Completed"
                        : active
                        ? "In Progress"
                        : status.toLowerCase()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ORG + CANDIDATE SELECT - Enhanced */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Selection Panel</h3>
                <p className="text-xs text-gray-600">Choose organization and candidate to begin self-verification</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <SearchableDropdown
                  label="Select Organization"
                  value={selectedOrg}
                  onChange={(v) => handleOrgSelect(v)}
                  options={organizations.map((o) => ({
                    label: o.organizationName,
                    value: o._id,
                  }))}
                />
              </div>

              <div>
                <SearchableDropdown
                  label="Select Candidate"
                  value={selectedCandidate}
                  disabled={!selectedOrg}
                  onChange={(cid) => {
                    setSelectedCandidate(cid);
                    if (cid) refreshVerification(cid);
                    else {
                      setCandidateVerification(null);
                      setStages({ primary: [], secondary: [], final: [] });
                      setCurrentStep(0);
                    }
                  }}
                  options={candidates.map((c) => ({
                    label: `${c.firstName} ${c.lastName}`,
                    value: c._id,
                  }))}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  Available API Checks
                </label>
                <div className="border-2 border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                  <div className="font-bold text-sm text-gray-900">
                    {availableChecks.length > 0
                      ? `${availableChecks.length} API Services`
                      : "No services"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SERVICE CARDS - SHOW WHEN ORGANIZATION IS SELECTED */}
        {selectedOrg && orgDetails && orgDetails.services && orgDetails.services.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff004f] to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Available Services</h3>
                <p className="text-xs text-gray-600">Services offered by {orgDetails.organizationName}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orgDetails.services.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#ff004f] hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#ff004f]/10 to-purple-600/10 rounded-lg flex items-center justify-center">
                      <CheckCircle size={16} className="text-[#ff004f]" />
                    </div>
                    <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      ₹{service.price}
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1 capitalize">
                    {service.serviceName.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-xs text-gray-600">Per verification</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHECK PANEL */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="grid md:grid-cols-4 gap-6">
            {/* LEFT PANEL */}
            <div className="space-y-4 md:sticky md:top-4 mb-6 md:mb-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Verification Stages
              </h3>

              {steps.map((stageKey, index) => (
                <StageHeader
                  key={stageKey}
                  stageKey={stageKey}
                  index={index}
                  isActive={index === currentStep}
                  onClick={() => setCurrentStep(index)}
                />
              ))}

              {/* SELECTED CHECKS - Enhanced */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm mt-6 max-h-[260px] overflow-auto">
                <div className="text-xs font-bold text-blue-900 mb-2">
                  Selected Checks
                </div>

                {stages[steps[currentStep]].length ? (
                  <div className="space-y-2">
                    {stages[steps[currentStep]].map((checkKey) => {
                      const check = availableChecks.find(
                        (c) => c.key === checkKey
                      );
                      return (
                        <div
                          key={checkKey}
                          className="flex items-center justify-between text-sm bg-white border-2 border-blue-200 rounded-lg px-3 py-2 shadow-sm"
                        >
                          <span className="font-medium text-gray-900 flex items-center gap-2">
                            <span>{check?.icon}</span>
                            <span className="truncate">
                              {check?.title || checkKey}
                            </span>
                          </span>

                          <button
                            disabled={isStageInitiated(steps[currentStep])}
                            onClick={() => removeCheckFromLeft(checkKey)}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs text-center py-4">
                    No checks selected
                  </div>
                )}
              </div>

              {/* INITIATE BUTTON */}
              <button
                onClick={() => initiateStage(steps[currentStep])}
                disabled={
                  submitting ||
                  isStageInitiated(steps[currentStep]) ||
                  !isPrevStageCompleted(steps[currentStep]) ||
                  !stages[steps[currentStep]].length
                }
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium mt-4
                  ${
                    isStageInitiated(steps[currentStep])
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isStageInitiated(steps[currentStep])
                  ? "Stage Initiated"
                  : `Initiate ${steps[currentStep]} Stage`}
              </button>
            </div>

            {/* RIGHT — CHECK CARDS */}
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {steps[currentStep].toUpperCase()} Stage - Available Checks
                </h3>
                <div className="text-sm text-gray-500">
                  {visibleCheckCards().length} checks available
                </div>
              </div>

              {/* RESPONSIVE CARD GRID - Enhanced */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {visibleCheckCards().map((c) => {
                  const stageKey = steps[currentStep];
                  const selected = stages[stageKey].includes(c.key);
                  const locked = isStageInitiated(stageKey);
                  const allowed = isPrevStageCompleted(stageKey);

                  const cardGradient = locked
                    ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg"
                    : selected
                    ? "border-[#ff004f] bg-gradient-to-br from-red-50 to-pink-50 shadow-lg"
                    : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-lg";

                  return (
                    <div
                      key={c.key}
                      className={`border-2 rounded-2xl p-5 transition-all duration-200 min-h-[180px] transform hover:scale-105 ${cardGradient}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <span className="text-3xl">{c.icon}</span>
                        </div>

                        {selected && !locked && (
                          <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-[#ff004f] to-[#ff6f6f] text-white rounded-full font-bold shadow-md">
                            Selected
                          </span>
                        )}

                        {locked && (
                          <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-md">
                            Initiated
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-gray-900 mb-3 text-base leading-tight">
                        {c.title}
                      </h4>

                      <div className="border-t border-gray-200 my-3" />

                      {locked ? (
                        <div className="mt-3 text-xs font-bold text-green-700 bg-green-100 px-3 py-2 rounded-lg border border-green-300 flex items-center gap-2">
                          <CheckCircle size={14} />
                          {getStageStatus(stageKey)}
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-3 mt-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!allowed}
                            onChange={() => handleToggle(c.key)}
                            className="accent-[#ff004f] w-5 h-5"
                          />
                          <span
                            className={`text-sm font-medium ${
                              !allowed ? "text-gray-400" : "text-gray-700"
                            }`}
                          >
                            {!allowed
                              ? "Complete previous stage"
                              : "Add to Current Stage"}
                          </span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY TABLES */}
        {candidateVerification && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Verification Summary
            </h2>

            <div className="space-y-6">
              {/* Show current stage table */}
              <StageTable 
                title={`${steps[currentStep].toUpperCase()} Stage`} 
                stageKey={steps[currentStep]} 
              />

              {/* Show other initiated stages */}
              {steps.map((stageKey, index) => {
                // Don't show current stage again, and only show initiated stages
                if (index === currentStep || !isStageInitiated(stageKey)) return null;
                
                return (
                  <StageTable 
                    key={stageKey}
                    title={`${stageKey.toUpperCase()} Stage`} 
                    stageKey={stageKey} 
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ADD CANDIDATE MODAL - ENHANCED UI */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl w-full max-w-3xl shadow-2xl border-2 border-gray-200 relative my-8 max-h-[90vh] overflow-y-auto">
              {/* Confirm Close */}
              {modal.open && modal.type === "confirmClose" && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999] p-4">
                  <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border">
                    <h2 className="text-lg font-bold text-gray-800">
                      Discard Changes?
                    </h2>
                    <p className="text-gray-600 mt-2">
                      All unsaved changes will be lost.
                    </p>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setModal({ open: false })}
                        className="w-1/2 py-2 rounded bg-gray-200 text-gray-800 font-medium hover:bg-gray-300"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={() => {
                          setShowAddModal(false);
                          setModal({ open: false });
                          setNewCandidate(emptyCandidate);
                          setExpandedSections({
                            supervisory1: false,
                            supervisory2: false,
                            employment1: false,
                            employment2: false,
                            education: false,
                          });
                        }}
                        className="w-1/2 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700"
                      >
                        Yes, Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ENHANCED HEADER */}
              <div className="bg-gradient-to-r from-[#ff004f] to-[#ff3366] px-6 py-5 sticky top-0 z-10 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <UserCheck className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Add Candidate</h2>
                      <p className="text-white/80 text-sm">Fill in candidate information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModal({ open: true, type: "confirmClose" })}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* SCROLLABLE CONTENT */}
              <div className="p-6 space-y-6">

              {/* PERSONAL DETAILS SECTION */}
              <div className="bg-white rounded-xl p-5 shadow-md border-2 border-blue-100">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-blue-200">
                  <User className="text-blue-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">Personal Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* FIRST NAME */}
                  <div>
                    <input
                      name="firstName"
                      value={newCandidate.firstName}
                      onChange={handleInputChange}
                      placeholder="First Name *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        fieldErrors.firstName ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>

                  {/* MIDDLE NAME */}
                  <div>
                    <input
                      name="middleName"
                      value={newCandidate.middleName}
                      onChange={handleInputChange}
                      placeholder="Middle Name (optional)"
                      className="border-2 border-gray-300 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                    {fieldErrors.middleName && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        {fieldErrors.middleName}
                      </p>
                    )}
                  </div>

                  {/* LAST NAME */}
                  <div>
                    <input
                      name="lastName"
                      value={newCandidate.lastName}
                      onChange={handleInputChange}
                      placeholder="Last Name *"
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        fieldErrors.lastName ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>

                  {/* FATHER NAME */}
                  <div>
                    <input
                      name="fatherName"
                      value={newCandidate.fatherName}
                      onChange={handleInputChange}
                    placeholder="Father Name *"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.fatherName ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.fatherName && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.fatherName}
                    </p>
                  )}
                </div>

                {/* DOB */}
                <div>
                  <input
                    name="dob"
                    type="date"
                    value={newCandidate.dob}
                    onChange={handleInputChange}
                    className={`border p-2 rounded w-full ${
                      fieldErrors.dob ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.dob && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.dob}
                    </p>
                  )}
                </div>

                  {/* GENDER */}
                  <div>
                    <select
                      name="gender"
                      value={newCandidate.gender}
                      onChange={handleInputChange}
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        fieldErrors.gender ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Gender *</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {fieldErrors.gender && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        {fieldErrors.gender}
                      </p>
                    )}
                  </div>

                  {/* DOB */}
                  <div>
                    <input
                      name="dob"
                      type="date"
                      value={newCandidate.dob}
                      onChange={handleInputChange}
                      className={`border-2 p-3 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        fieldErrors.dob ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.dob && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        {fieldErrors.dob}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* CONTACT & IDENTITY SECTION */}
              <div className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PHONE */}
                  <div>
                    <input
                      name="phone"
                      value={newCandidate.phone}
                      onChange={handleInputChange}
                      placeholder="Phone *"
                      className={`border p-2 rounded w-full ${
                        fieldErrors.phone ? "border-red-500" : ""
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                {/* EMAIL */}
                <div className="sm:col-span-2">
                  <input
                    name="email"
                    value={newCandidate.email}
                    onChange={handleInputChange}
                    placeholder="Email *"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.email ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* AADHAAR */}
                <div>
                  <input
                    name="aadhaarNumber"
                    value={newCandidate.aadhaarNumber}
                    onChange={handleInputChange}
                    placeholder="Aadhaar Number *"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.aadhaarNumber ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.aadhaarNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.aadhaarNumber}
                    </p>
                  )}
                </div>

                {/* PAN */}
                <div>
                  <input
                    name="panNumber"
                    value={newCandidate.panNumber}
                    onChange={handleInputChange}
                    placeholder="PAN Number *"
                    className={`border p-2 rounded uppercase w-full ${
                      fieldErrors.panNumber ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.panNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.panNumber}
                    </p>
                  )}
                </div>

                {/* UAN (optional) */}
                <div>
                  <input
                    name="uanNumber"
                    value={newCandidate.uanNumber}
                    onChange={handleInputChange}
                    placeholder="UAN Number (optional)"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.uanNumber ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.uanNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.uanNumber}
                    </p>
                  )}
                </div>

                {/* PASSPORT (optional) */}
                <div>
                  <input
                    name="passportNumber"
                    value={newCandidate.passportNumber}
                    onChange={handleInputChange}
                    placeholder="Passport Number (optional)"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.passportNumber ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.passportNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.passportNumber}
                    </p>
                  )}
                </div>

                {/* BANK ACCOUNT (optional) */}
                <div className="sm:col-span-2">
                  <input
                    name="bankAccountNumber"
                    value={newCandidate.bankAccountNumber}
                    onChange={handleInputChange}
                    placeholder="Bank Account Number (optional)"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.bankAccountNumber ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.bankAccountNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.bankAccountNumber}
                    </p>
                  )}
                </div>

                {/* DISTRICT */}
                <div>
                  <input
                    name="district"
                    value={newCandidate.district}
                    onChange={handleInputChange}
                    placeholder="District *"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.district ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.district && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.district}
                    </p>
                  )}
                </div>

                {/* STATE */}
                <div>
                  <input
                    name="state"
                    value={newCandidate.state}
                    onChange={handleInputChange}
                    placeholder="State *"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.state ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.state && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.state}
                    </p>
                  )}
                </div>

                {/* PINCODE */}
                <div>
                  <input
                    name="pincode"
                    value={newCandidate.pincode}
                    onChange={handleInputChange}
                    placeholder="Pincode *"
                    className={`border p-2 rounded w-full ${
                      fieldErrors.pincode ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.pincode && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.pincode}
                    </p>
                  )}
                </div>
              </div>

                  {/* ADDRESS */}
                  <div className="sm:col-span-2">
                    <textarea
                      name="address"
                      value={newCandidate.address}
                      onChange={handleInputChange}
                      placeholder="Full Address *"
                      className="border p-2 rounded w-full"
                      rows={3}
                    />
                    {fieldErrors.address && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* RESUME UPLOAD */}
              <div className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="text-gray-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">Resume Upload (Optional)</h3>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setNewCandidate((prev) => ({
                      ...prev,
                      resume: e.target.files?.[0] || null,
                    }))
                  }
                  className="border-2 border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                />
                {newCandidate.resume && (
                  <p className="text-xs text-gray-600 mt-2">
                    ✅ Selected: <strong>{newCandidate.resume.name}</strong>
                  </p>
                )}
              </div>

              {/* ============================================ */}
              {/* SUPERVISORY CHECK 1 - COLLAPSIBLE */}
              {/* ============================================ */}
              <div className="mt-4 border-2 border-blue-200 rounded-lg overflow-hidden">
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
                      value={newCandidate.supervisory1_name || ''}
                      onChange={handleInputChange}
                      placeholder="Supervisor Name"
                      className="border p-2 rounded w-full"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory1_phone"
                        value={newCandidate.supervisory1_phone || ''}
                        onChange={handleInputChange}
                        placeholder="Phone Number"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory1_email"
                        value={newCandidate.supervisory1_email || ''}
                        onChange={handleInputChange}
                        placeholder="Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory1_relationship"
                        value={newCandidate.supervisory1_relationship || ''}
                        onChange={handleInputChange}
                        placeholder="Relationship (e.g., Former Manager)"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory1_company"
                        value={newCandidate.supervisory1_company || ''}
                        onChange={handleInputChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory1_designation"
                        value={newCandidate.supervisory1_designation || ''}
                        onChange={handleInputChange}
                        placeholder="Designation"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory1_workingPeriod"
                        value={newCandidate.supervisory1_workingPeriod || ''}
                        onChange={handleInputChange}
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
                      value={newCandidate.supervisory2_name || ''}
                      onChange={handleInputChange}
                      placeholder="Supervisor Name"
                      className="border p-2 rounded w-full"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory2_phone"
                        value={newCandidate.supervisory2_phone || ''}
                        onChange={handleInputChange}
                        placeholder="Phone Number"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory2_email"
                        value={newCandidate.supervisory2_email || ''}
                        onChange={handleInputChange}
                        placeholder="Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory2_relationship"
                        value={newCandidate.supervisory2_relationship || ''}
                        onChange={handleInputChange}
                        placeholder="Relationship (e.g., Former Team Lead)"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory2_company"
                        value={newCandidate.supervisory2_company || ''}
                        onChange={handleInputChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="supervisory2_designation"
                        value={newCandidate.supervisory2_designation || ''}
                        onChange={handleInputChange}
                        placeholder="Designation"
                        className="border p-2 rounded"
                      />
                      <input
                        name="supervisory2_workingPeriod"
                        value={newCandidate.supervisory2_workingPeriod || ''}
                        onChange={handleInputChange}
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
                        value={newCandidate.employment1_company || ''}
                        onChange={handleInputChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment1_designation"
                        value={newCandidate.employment1_designation || ''}
                        onChange={handleInputChange}
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
                          value={newCandidate.employment1_joiningDate || ''}
                          onChange={handleInputChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Relieving Date</label>
                        <input
                          type="date"
                          name="employment1_relievingDate"
                          value={newCandidate.employment1_relievingDate || ''}
                          onChange={handleInputChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        name="employment1_hrName"
                        value={newCandidate.employment1_hrName || ''}
                        onChange={handleInputChange}
                        placeholder="HR Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment1_hrContact"
                        value={newCandidate.employment1_hrContact || ''}
                        onChange={handleInputChange}
                        placeholder="HR Contact"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment1_hrEmail"
                        value={newCandidate.employment1_hrEmail || ''}
                        onChange={handleInputChange}
                        placeholder="HR Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <textarea
                      name="employment1_address"
                      value={newCandidate.employment1_address || ''}
                      onChange={handleInputChange}
                      placeholder="Company Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Relieving Letter (PDF)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleInputChange(e, true, 'relievingLetter1')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.relievingLetter1 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.relievingLetter1.name}
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
                          onChange={(e) => handleInputChange(e, true, 'experienceLetter1')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.experienceLetter1 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.experienceLetter1.name}
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
                          onChange={(e) => handleInputChange(e, true, 'salarySlips1')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.salarySlips1 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.salarySlips1.name}
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
                        value={newCandidate.employment2_company || ''}
                        onChange={handleInputChange}
                        placeholder="Company Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment2_designation"
                        value={newCandidate.employment2_designation || ''}
                        onChange={handleInputChange}
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
                          value={newCandidate.employment2_joiningDate || ''}
                          onChange={handleInputChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Relieving Date</label>
                        <input
                          type="date"
                          name="employment2_relievingDate"
                          value={newCandidate.employment2_relievingDate || ''}
                          onChange={handleInputChange}
                          className="border p-2 rounded w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        name="employment2_hrName"
                        value={newCandidate.employment2_hrName || ''}
                        onChange={handleInputChange}
                        placeholder="HR Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment2_hrContact"
                        value={newCandidate.employment2_hrContact || ''}
                        onChange={handleInputChange}
                        placeholder="HR Contact"
                        className="border p-2 rounded"
                      />
                      <input
                        name="employment2_hrEmail"
                        value={newCandidate.employment2_hrEmail || ''}
                        onChange={handleInputChange}
                        placeholder="HR Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                    </div>
                    <textarea
                      name="employment2_address"
                      value={newCandidate.employment2_address || ''}
                      onChange={handleInputChange}
                      placeholder="Company Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Relieving Letter (PDF)
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleInputChange(e, true, 'relievingLetter2')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.relievingLetter2 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.relievingLetter2.name}
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
                          onChange={(e) => handleInputChange(e, true, 'experienceLetter2')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.experienceLetter2 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.experienceLetter2.name}
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
                          onChange={(e) => handleInputChange(e, true, 'salarySlips2')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.salarySlips2 && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.salarySlips2.name}
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
                          onChange={(e) => handleInputChange(e, true, 'educationCertificate')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.educationCertificate && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.educationCertificate.name}
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
                          onChange={(e) => handleInputChange(e, true, 'marksheet')}
                          className="border p-2 rounded w-full"
                        />
                        {newCandidate.marksheet && (
                          <p className="text-xs mt-1 text-green-600">
                            ✓ New file: {newCandidate.marksheet.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="education_degree"
                        value={newCandidate.education_degree || ''}
                        onChange={handleInputChange}
                        placeholder="Degree (e.g., Bachelor of Technology)"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_specialization"
                        value={newCandidate.education_specialization || ''}
                        onChange={handleInputChange}
                        placeholder="Specialization"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="education_universityName"
                        value={newCandidate.education_universityName || ''}
                        onChange={handleInputChange}
                        placeholder="University Name"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_collegeName"
                        value={newCandidate.education_collegeName || ''}
                        onChange={handleInputChange}
                        placeholder="College Name"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="education_yearOfPassing"
                        value={newCandidate.education_yearOfPassing || ''}
                        onChange={handleInputChange}
                        placeholder="Year of Passing"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_cgpa"
                        value={newCandidate.education_cgpa || ''}
                        onChange={handleInputChange}
                        placeholder="CGPA/Percentage"
                        className="border p-2 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        name="education_universityContact"
                        value={newCandidate.education_universityContact || ''}
                        onChange={handleInputChange}
                        placeholder="University Contact"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_universityEmail"
                        value={newCandidate.education_universityEmail || ''}
                        onChange={handleInputChange}
                        placeholder="University Email"
                        type="email"
                        className="border p-2 rounded"
                      />
                      <input
                        name="education_collegeContact"
                        value={newCandidate.education_collegeContact || ''}
                        onChange={handleInputChange}
                        placeholder="College Contact"
                        className="border p-2 rounded"
                      />
                    </div>
                    <input
                      name="education_collegeEmail"
                      value={newCandidate.education_collegeEmail || ''}
                      onChange={handleInputChange}
                      placeholder="College Email"
                      type="email"
                      className="border p-2 rounded w-full"
                    />
                    <textarea
                      name="education_universityAddress"
                      value={newCandidate.education_universityAddress || ''}
                      onChange={handleInputChange}
                      placeholder="University Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                    <textarea
                      name="education_collegeAddress"
                      value={newCandidate.education_collegeAddress || ''}
                      onChange={handleInputChange}
                      placeholder="College Address"
                      rows={2}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => setModal({ open: true, type: "confirmClose" })}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddCandidate}
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      Add Candidate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------- */
/* END OF FILE — PART 3 / 3 COMPLETE               */
/* ---------------------------------------------- */
