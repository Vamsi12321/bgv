"use client";

import { createContext, useContext, useState, useEffect } from "react";

const OrgStateContext = createContext();

export function OrgStateProvider({ children }) {
  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Reports state
  const [reportsFilters, setReportsFilters] = useState({
    dateRange: "",
    status: "",
    searchTerm: "",
  });
  const [reportsData, setReportsData] = useState([]);
  const [reportsPagination, setReportsPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  // Logs state
  const [logsFilters, setLogsFilters] = useState({
    dateRange: "",
    action: "",
    searchTerm: "",
  });
  const [logsData, setLogsData] = useState([]);
  const [logsPagination, setLogsPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  // Verifications state
  const [verificationsFilters, setVerificationsFilters] = useState({
    status: "",
    stage: "",
    searchTerm: "",
  });
  const [verificationsData, setVerificationsData] = useState([]);
  const [verificationsSummary, setVerificationsSummary] = useState([]);
  const [verificationsPagination, setVerificationsPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  // Manage Candidates state
  const [candidatesFilters, setCandidatesFilters] = useState({
    status: "",
    searchTerm: "",
  });
  const [candidatesData, setCandidatesData] = useState([]);
  const [candidatesPagination, setCandidatesPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  // Users & Roles state
  const [usersData, setUsersData] = useState([]);
  const [usersFilterRole, setUsersFilterRole] = useState("All");

  // Organization state
  const [organizationData, setOrganizationData] = useState(null);

  // AI Screening state (excluding file objects as they can't be serialized)
  const [aiScreeningState, setAiScreeningState] = useState({
    topN: 5,
    mustHave: "",
    niceToHave: "",
    results: [],
    enhancedResults: [],
  });

  // AI CV Verification state
  const [aiCvVerificationState, setAiCvVerificationState] = useState({
    selectedCandidate: null,
    verificationId: "",
    analysis: null,
    finalRemarks: "",
  });

  // BGV Requests state
  const [bgvState, setBgvState] = useState({
    selectedCandidate: "",
    stages: { primary: [], secondary: [], final: [] },
    currentStep: 0,
    visibleStage: "primary"
  });

  const value = {
    // Dashboard
    dashboardData,
    setDashboardData,
    dashboardLoading,
    setDashboardLoading,

    // Reports
    reportsFilters,
    setReportsFilters,
    reportsData,
    setReportsData,
    reportsPagination,
    setReportsPagination,

    // Logs
    logsFilters,
    setLogsFilters,
    logsData,
    setLogsData,
    logsPagination,
    setLogsPagination,

    // Verifications
    verificationsFilters,
    setVerificationsFilters,
    verificationsData,
    setVerificationsData,
    verificationsSummary,
    setVerificationsSummary,
    verificationsPagination,
    setVerificationsPagination,

    // Manage Candidates
    candidatesFilters,
    setCandidatesFilters,
    candidatesData,
    setCandidatesData,
    candidatesPagination,
    setCandidatesPagination,

    // Users & Roles
    usersData,
    setUsersData,
    usersFilterRole,
    setUsersFilterRole,

    // Organization
    organizationData,
    setOrganizationData,

    // AI Screening
    aiScreeningState,
    setAiScreeningState,

    // AI CV Verification
    aiCvVerificationState,
    setAiCvVerificationState,

    // BGV Requests
    bgvState,
    setBgvState,
  };

  return (
    <OrgStateContext.Provider value={value}>
      {children}
    </OrgStateContext.Provider>
  );
}

export function useOrgState() {
  const context = useContext(OrgStateContext);
  if (!context) {
    throw new Error("useOrgState must be used within OrgStateProvider");
  }
  return context;
}
