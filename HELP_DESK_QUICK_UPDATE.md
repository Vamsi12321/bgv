# Help Desk Quick Update Guide

## 🚀 Quick Changes Needed

### 1. Update API Endpoints

Replace these in both `app/org/help-desk/page.js` and `app/superadmin/help-desk/page.js`:

```javascript
// ❌ OLD ENDPOINTS - REMOVE THESE
POST /secure/createticket
GET /secure/tickets/org
GET /secure/tickets/all
GET /secure/tickets/my
GET /secure/tickets/{id}
POST /secure/tickets/{id}/comment
POST /secure/tickets/{id}/status

// ✅ NEW ENDPOINTS - USE THESE
POST /secure/ticket/create
GET /secure/ticket/list (with query params)
GET /secure/ticket/{id}
POST /secure/ticket/{id}/comment
PUT /secure/ticket/{id}/status (changed from POST to PUT)
PUT /secure/ticket/{id}/reassign (new - superadmin only)
GET /secure/ticket/{id}/available-assignees (new - superadmin only)
GET /secure/ticket/categories (new)
```

### 2. Update Fetch Tickets Function

```javascript
// OLD
const fetchTickets = async () => {
  const res = await fetch(`${API_BASE}/secure/tickets/org`, {
    credentials: "include",
  });
  // ...
};

// NEW
const fetchTickets = async () => {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.priority) params.append("priority", filters.priority);
  if (filters.category) params.append("category", filters.category);
  if (filters.assignedToMe) params.append("assignedToMe", "true");

  const res = await fetch(`${API_BASE}/secure/ticket/list?${params}`, {
    credentials: "include",
  });
  // ...
};
```

### 3. Update Create Ticket Function

```javascript
// OLD
const handleCreateTicket = async () => {
  const formData = new FormData();
  formData.append("body", JSON.stringify({
    title: newTicket.title,
    description: newTicket.description,
    category: newTicket.category,
    priority: newTicket.priority,
  }));

  const res = await fetch(`${API_BASE}/secure/createticket`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
};

// NEW
const handleCreateTicket = async () => {
  const res = await fetch(`${API_BASE}/secure/ticket/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      subject: newTicket.subject,  // Changed from 'title' to 'subject'
      description: newTicket.description,
      category: newTicket.category,
      priority: newTicket.priority,
    }),
  });
};
```

### 4. Add Category Fetching

```javascript
// NEW - Add this function
const [categories, setCategories] = useState([]);

const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/secure/ticket/categories`, {
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) {
      setCategories(data.categories || []);
    }
  } catch (err) {
    console.error("Error fetching categories:", err);
  }
};

// Call in useEffect
useEffect(() => {
  fetchCategories();
  fetchTickets();
}, []);
```

### 5. Update Status Function (POST → PUT)

```javascript
// OLD
const handleUpdateStatus = async (status) => {
  const res = await fetch(
    `${API_BASE}/secure/tickets/${ticketId}/status`,
    {
      method: "POST",  // ❌ OLD: POST
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    }
  );
};

// NEW
const handleUpdateStatus = async () => {
  const res = await fetch(
    `${API_BASE}/secure/ticket/${ticketId}/status`,
    {
      method: "PUT",  // ✅ NEW: PUT
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        status: statusUpdate.status,
        comment: statusUpdate.comment,
        resolution: statusUpdate.resolution,  // Required when status=RESOLVED
      }),
    }
  );
};
```

### 6. Add Reassignment (SuperAdmin Only)

```javascript
// NEW - Add for superadmin page only
const [showReassignModal, setShowReassignModal] = useState(false);
const [availableAssignees, setAvailableAssignees] = useState([]);
const [reassignment, setReassignment] = useState({
  assignedToEmail: "",
  reason: "",
});

const fetchAvailableAssignees = async (ticketId) => {
  const res = await fetch(
    `${API_BASE}/secure/ticket/${ticketId}/available-assignees`,
    { credentials: "include" }
  );
  const data = await res.json();
  if (res.ok) {
    setAvailableAssignees(data.availableAssignees || []);
    setShowReassignModal(true);
  }
};

const handleReassignTicket = async () => {
  const res = await fetch(
    `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/reassign`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(reassignment),
    }
  );
  if (res.ok) {
    alert("Ticket reassigned successfully");
    setShowReassignModal(false);
    viewTicketDetails(selectedTicket.ticketId);
  }
};
```

### 7. Update UI Components

#### Category Dropdown in Create Form
```jsx
<select
  value={newTicket.category}
  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
  required
>
  <option value="">Select Category...</option>
  {categories.map((cat) => (
    <option key={cat.value} value={cat.value} title={cat.description}>
      {cat.label}
    </option>
  ))}
</select>
```

#### Filter Section
```jsx
<div className="filters">
  <select
    value={filters.status}
    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
  >
    <option value="">All Status</option>
    <option value="OPEN">Open</option>
    <option value="IN_PROGRESS">In Progress</option>
    <option value="RESOLVED">Resolved</option>
    <option value="CLOSED">Closed</option>
    <option value="REOPENED">Reopened</option>
  </select>

  <select
    value={filters.category}
    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
  >
    <option value="">All Categories</option>
    {categories.map((cat) => (
      <option key={cat.value} value={cat.value}>
        {cat.label}
      </option>
    ))}
  </select>

  <label>
    <input
      type="checkbox"
      checked={filters.assignedToMe}
      onChange={(e) => setFilters({ ...filters, assignedToMe: e.target.checked })}
    />
    Assigned to Me
  </label>
</div>
```

#### Ticket Card - Show SLA Deadline
```jsx
<div className="ticket-card">
  <h3>{ticket.subject}</h3>
  <div className="ticket-meta">
    <span>Category: {ticket.category}</span>
    <span>Priority: {ticket.priority}</span>
    <span>Status: {ticket.status}</span>
    <span>SLA: {new Date(ticket.slaDeadline).toLocaleString()}</span>
  </div>
  <div className="assignees">
    Assigned to: {ticket.assigneeEmails?.join(", ") || "Unassigned"}
  </div>
</div>
```

#### Reassign Button (SuperAdmin Only)
```jsx
{currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "SUPER_SPOC" ? (
  <button onClick={() => fetchAvailableAssignees(selectedTicket.ticketId)}>
    Reassign Ticket
  </button>
) : null}
```

## 📋 Complete Checklist

### Both Pages (Org & SuperAdmin)
- [ ] Update API endpoint URLs (singular `/ticket/` not `/tickets/`)
- [ ] Change status update from POST to PUT
- [ ] Add category fetching and dropdown
- [ ] Add filters (status, priority, category, assignedToMe)
- [ ] Update create ticket (title → subject)
- [ ] Add SLA deadline display
- [ ] Show multiple assignees
- [ ] Add resolution field for RESOLVED status

### SuperAdmin Page Only
- [ ] Add reassignment modal
- [ ] Add available assignees fetching
- [ ] Add reassignment function
- [ ] Show reassign button based on role

## 🧪 Testing

After updates, test:
1. ✅ Create ticket with category selection
2. ✅ Filter tickets by status/priority/category
3. ✅ Filter "Assigned to Me"
4. ✅ View ticket details
5. ✅ Add comments
6. ✅ Update status (with resolution for RESOLVED)
7. ✅ Reassign ticket (superadmin only)
8. ✅ View SLA deadlines
9. ✅ See multiple assignees

## 🚀 Quick Deploy

1. Update both help-desk pages with changes above
2. Test locally
3. Deploy to production
4. Monitor for errors

**Estimated Time:** 30-45 minutes per page
