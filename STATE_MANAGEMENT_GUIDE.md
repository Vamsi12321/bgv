# State Management Implementation Guide

## Overview
Your application now has persistent state management across page navigations for both **org** and **superadmin** sections. Data is maintained when you move between pages.

## What Was Added

### 1. Context Providers
Two new context files were created:
- `app/context/OrgStateContext.js` - For org-level pages
- `app/context/SuperAdminStateContext.js` - For superadmin-level pages

### 2. Layout Integration
Both layouts now wrap their children with the respective providers:
- `app/org/layout.js` - Wrapped with `OrgStateProvider`
- `app/superadmin/layout.js` - Wrapped with `SuperAdminStateProvider`

## Pages Updated

### Org Section
✅ **Dashboard** (`app/org/dashboard/page.js`) - No changes needed, read-only
✅ **Reports** (`app/org/reports/page.js`) - Maintains candidates data
✅ **Logs** (`app/org/logs/page.js`) - Maintains filters, pagination, and logs data
✅ **Verifications** (`app/org/verifications/page.js`) - Maintains verifications and filters
✅ **Manage Candidates** (`app/org/manage-candidates/page.js`) - Maintains candidates list

### SuperAdmin Section
✅ **Dashboard** (`app/superadmin/dashboard/page.js`) - Maintains selected org and stats
✅ **Reports** (`app/superadmin/reports/page.js`) - Maintains selected org and candidates
✅ **BGV Requests** (`app/superadmin/bgv-requests/page.js`) - Ready for state management

## How to Update Remaining Pages

For any page that needs state persistence, follow this pattern:

### Step 1: Import the hook
```javascript
import { useOrgState } from "../../context/OrgStateContext";
// OR
import { useSuperAdminState } from "../../context/SuperAdminStateContext";
```

### Step 2: Replace local state with context state
```javascript
// BEFORE:
const [data, setData] = useState([]);
const [filters, setFilters] = useState({ status: "", search: "" });

// AFTER:
const {
  logsData: data,
  setLogsData: setData,
  logsFilters: filters,
  setLogsFilters: setFilters,
} = useOrgState();
```

### Step 3: Modify data fetching to check if data exists
```javascript
// BEFORE:
useEffect(() => {
  fetchData();
}, []);

// AFTER:
useEffect(() => {
  // Only fetch if we don't have data
  if (data.length === 0) {
    fetchData();
  }
}, []);
```

## Available State in OrgStateContext

```javascript
{
  // Dashboard
  dashboardData, setDashboardData,
  dashboardLoading, setDashboardLoading,

  // Reports
  reportsFilters, setReportsFilters,
  reportsData, setReportsData,
  reportsPagination, setReportsPagination,

  // Logs
  logsFilters, setLogsFilters,
  logsData, setLogsData,
  logsPagination, setLogsPagination,

  // Verifications
  verificationsFilters, setVerificationsFilters,
  verificationsData, setVerificationsData,
  verificationsPagination, setVerificationsPagination,

  // Manage Candidates
  candidatesFilters, setCandidatesFilters,
  candidatesData, setCandidatesData,
  candidatesPagination, setCandidatesPagination,
}
```

## Available State in SuperAdminStateContext

```javascript
{
  // Dashboard
  dashboardData, setDashboardData,
  dashboardLoading, setDashboardLoading,
  selectedOrg, setSelectedOrg,

  // Reports
  reportsFilters, setReportsFilters,
  reportsData, setReportsData,
  reportsPagination, setReportsPagination,

  // Logs
  logsFilters, setLogsFilters,
  logsData, setLogsData,
  logsPagination, setLogsPagination,

  // Verifications
  verificationsFilters, setVerificationsFilters,
  verificationsData, setVerificationsData,
  verificationsPagination, setVerificationsPagination,

  // Manage Candidates
  candidatesFilters, setCandidatesFilters,
  candidatesData, setCandidatesData,
  candidatesPagination, setCandidatesPagination,

  // BGV Requests
  bgvSelectedOrg, setBgvSelectedOrg,
  bgvSelectedCandidate, setBgvSelectedCandidate,
  bgvCandidates, setBgvCandidates,
  bgvVerification, setBgvVerification,
}
```

## Pages That Still Need Updates

You can apply the same pattern to these pages:

### Org Section
- `app/org/bgv-requests/page.js`
- `app/org/invoices/page.js`
- `app/org/users/page.js`
- `app/org/organization/page.js`
- `app/org/self-verification/page.js`
- `app/org/AI-screening/page.js`
- `app/org/AI-CV-Verification/page.js`

### SuperAdmin Section
- `app/superadmin/logs/page.js`
- `app/superadmin/verifications/page.js`
- `app/superadmin/manage-candidates/page.js`
- `app/superadmin/organizations/page.js`
- `app/superadmin/users/page.js`
- `app/superadmin/invoices/page.js`
- `app/superadmin/self-verification/page.js`
- `app/superadmin/AI-screening/page.js`
- `app/superadmin/AI-CV-Verification/page.js`

## Adding New State Fields

If you need to add more state fields to the context:

1. Open the appropriate context file
2. Add the new state in the provider:
```javascript
const [newData, setNewData] = useState([]);
```

3. Add it to the value object:
```javascript
const value = {
  // ... existing state
  newData,
  setNewData,
};
```

4. Use it in your component:
```javascript
const { newData, setNewData } = useOrgState();
```

## Benefits

✅ Data persists when navigating between pages
✅ Filters and search terms are maintained
✅ Pagination state is preserved
✅ Selected organizations/candidates remain selected
✅ No unnecessary API calls when returning to a page
✅ Better user experience

## Testing

To verify state persistence:
1. Go to any updated page (e.g., Reports)
2. Load some data or apply filters
3. Navigate to another page (e.g., Dashboard)
4. Navigate back to the original page
5. Your data and filters should still be there!

## Notes

- State is cleared when the user logs out (handled by logout function)
- State is cleared when the browser is refreshed (this is normal React behavior)
- If you need localStorage persistence across refreshes, you can add that to the context providers
