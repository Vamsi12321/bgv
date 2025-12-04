"use client";

import { createContext, useContext, useState } from "react";

const SuperAdminStateContext = createContext();

export function SuperAdminStateProvider({ children }) {
  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("Global");

  // Reports state
  const [reportsFilters, setReportsFilters] = useState({
    dateRange: "",
    status: "",
    organizationId: "",
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
    organizationId: "",
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
    organizationId: "",
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
    organizationId: "",
    searchTerm: "",
  });
  const [candidatesData, setCandidatesData] = useState([]);
  const [candidatesPagination, setCandidatesPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  // BGV Requests state
  const [bgvState, setBgvState] = useState({
    selectedOrg: "",
    selectedCandidate: "",
    stages: { primary: [], secondary: [], final: [] },
    currentStep: 0,
    visibleStage: "primary"
  });

  // Organizations state
  const [organizationsData, setOrganizationsData] = useState([]);
  const [organizationsFilters, setOrganizationsFilters] = useState({
    search: "",
  });

  // Users state
  const [usersData, setUsersData] = useState([]);
  const [usersFilterRole, setUsersFilterRole] = useState("All");

  // AI Screening state (excluding file objects as they can't be serialized)
  const [aiScreeningState, setAiScreeningState] = useState({
    topN: 5,
    mustHave: "",
    niceToHave: "",
    results: [],
    enhancedResults: [],
  });

  const value = {
    // Dashboard
    dashboardData,
    setDashboardData,
    dashboardLoading,
    setDashboardLoading,
    selectedOrg,
    setSelectedOrg,

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

    // BGV Requests
    bgvState,
    setBgvState,

    // Organizations
    organizationsData,
    setOrganizationsData,
    organizationsFilters,
    setOrganizationsFilters,

    // Users
    usersData,
    setUsersData,
    usersFilterRole,
    setUsersFilterRole,

    // AI Screening
    aiScreeningState,
    setAiScreeningState,
  };

  return (
    <SuperAdminStateContext.Provider value={value}>
      {children}
    </SuperAdminStateContext.Provider>
  );
}

export function useSuperAdminState() {
  const context = useContext(SuperAdminStateContext);
  if (!context) {
    throw new Error(
      "useSuperAdminState must be used within SuperAdminStateProvider"
    );
  }
  return context;
}
