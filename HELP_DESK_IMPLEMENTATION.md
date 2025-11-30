# Help Desk Implementation Guide

## Overview
This guide provides complete implementation for both Org-level and SuperAdmin-level help desk pages using the new ticket system APIs.

## Key Changes from Old System

### API Endpoints Updated
- ❌ OLD: `POST /secure/createticket` → ✅ NEW: `POST /secure/ticket/create`
- ❌ OLD: `GET /secure/tickets/org` → ✅ NEW: `GET /secure/ticket/list`
- ❌ OLD: `GET /secure/tickets/{id}` → ✅ NEW: `GET /secure/ticket/{id}`
- ❌ OLD: `POST /secure/tickets/{id}/comment` → ✅ NEW: `POST /secure/ticket/{id}/comment`
- ❌ OLD: `POST /secure/tickets/{id}/status` → ✅ NEW: `PUT /secure/ticket/{id}/status`

### New Features Added
1. **Category System** - Predefined categories with auto-assignment
2. **Multi-Assignee Support** - Tickets can have multiple assignees
3. **SLA Tracking** - Automatic SLA deadline calculation
4. **Enhanced Filtering** - Filter by status, priority, category, assignedToMe
5. **Reassignment** - Admin can reassign tickets to appropriate team members
6. **Status History** - Complete audit trail of status changes
7. **Resolution Tracking** - Required resolution text when closing tickets

## File Structure

```
app/
├── org/
│   └── help-desk/
│       └── page.js (ORG-LEVEL HELP DESK)
└── superadmin/
    └── help-desk/
        └── page.js (SUPERADMIN-LEVEL HELP DESK)
```

## Complete Implementation Files

Due to file size, I'll provide the implementation in chunks that you can copy.

### Part 1: Imports and State (Both Pages)

```javascript
"use client";

import { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import {
  Ticket, Plus, Search, Filter, Paperclip, Send, Clock,
  CheckCircle2, XCircle, AlertCircle, MessageSquare, Eye,
  Loader2, Upload, X, RefreshCw, User, Calendar, Tag, Users
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";
```

### Part 2: State Management

```javascript
const [tickets, setTickets] = useState([]);
const [categories, setCategories] = useState([]);
const [loading, setLoading] = useState(true);
const [showCreateModal, setShowCreateModal] = useState(false);
const [showDetailModal, setShowDetailModal] = useState(false);
const [showReassignModal, setShowReassignModal] = useState(false);
const [selectedTicket, setSelectedTicket] = useState(null);
const [searchTerm, setSearchTerm] = useState("");
const [currentUser, setCurrentUser] = useState(null);
const [availableAssignees, setAvailableAssignees] = useState([]);

// Filters
const [filters, setFilters] = useState({
  status: "",
  priority: "",
  category: "",
  assignedToMe: false,
});

// Create Ticket Form
const [newTicket, setNewTicket] = useState({
  subject: "",
  description: "",
  category: "",
  priority: "MEDIUM",
});
const [creating, setCreating] = useState(false);

// Comment
const [comment, setComment] = useState("");
const [commenting, setCommenting] = useState(false);

// Status Update
const [statusUpdate, setStatusUpdate] = useState({
  status: "",
  comment: "",
  resolution: "",
});
const [updatingStatus, setUpdatingStatus] = useState(false);

// Reassignment (SuperAdmin only)
const [reassignment, setReassignment] = useState({
  assignedToEmail: "",
  reason: "",
});
const [reassigning, setReassigning] = useState(false);
```

### Part 3: API Functions

```javascript
// Load user from localStorage
useEffect(() => {
  const storedUser = localStorage.getItem("bgvUser");
  if (storedUser) {
    setCurrentUser(JSON.parse(storedUser));
  }
  fetchCategories();
  fetchTickets();
}, []);

useEffect(() => {
  fetchTickets();
}, [filters]);

// Fetch Categories
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

// Fetch Tickets with Filters
const fetchTickets = async () => {
  try {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.category) params.append("category", filters.category);
    if (filters.assignedToMe) params.append("assignedToMe", "true");

    const res = await fetch(`${API_BASE}/secure/ticket/list?${params}`, {
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) {
      setTickets(data.tickets || []);
    }
  } catch (err) {
    console.error("Error fetching tickets:", err);
  } finally {
    setLoading(false);
  }
};

// Create Ticket
const handleCreateTicket = async () => {
  if (!newTicket.subject || !newTicket.description || !newTicket.category) {
    alert("Please fill in all required fields");
    return;
  }

  try {
    setCreating(true);
    const res = await fetch(`${API_BASE}/secure/ticket/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        subject: newTicket.subject,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(`Ticket ${data.ticketId} created successfully!`);
      setShowCreateModal(false);
      setNewTicket({ subject: "", description: "", category: "", priority: "MEDIUM" });
      fetchTickets();
    } else {
      alert(data.detail || "Failed to create ticket");
    }
  } catch (err) {
    console.error("Error creating ticket:", err);
    alert("Network error. Please try again.");
  } finally {
    setCreating(false);
  }
};

// View Ticket Details
const viewTicketDetails = async (ticketId) => {
  try {
    const res = await fetch(`${API_BASE}/secure/ticket/${ticketId}`, {
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) {
      setSelectedTicket(data);
      setShowDetailModal(true);
    }
  } catch (err) {
    console.error("Error fetching ticket details:", err);
  }
};

// Add Comment
const handleAddComment = async () => {
  if (!comment.trim()) return;

  try {
    setCommenting(true);
    const res = await fetch(
      `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/comment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: comment }),
      }
    );

    if (res.ok) {
      setComment("");
      viewTicketDetails(selectedTicket.ticketId);
    } else {
      const data = await res.json();
      alert(data.detail || "Failed to add comment");
    }
  } catch (err) {
    console.error("Error adding comment:", err);
  } finally {
    setCommenting(false);
  }
};

// Update Status
const handleUpdateStatus = async () => {
  if (!statusUpdate.status) {
    alert("Please select a status");
    return;
  }

  if (statusUpdate.status === "RESOLVED" && !statusUpdate.resolution) {
    alert("Resolution is required when marking as resolved");
    return;
  }

  try {
    setUpdatingStatus(true);
    const res = await fetch(
      `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/status`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(statusUpdate),
      }
    );

    if (res.ok) {
      alert("Status updated successfully");
      setStatusUpdate({ status: "", comment: "", resolution: "" });
      viewTicketDetails(selectedTicket.ticketId);
      fetchTickets();
    } else {
      const data = await res.json();
      alert(data.detail || "Failed to update status");
    }
  } catch (err) {
    console.error("Error updating status:", err);
  } finally {
    setUpdatingStatus(false);
  }
};

// Fetch Available Assignees (SuperAdmin only)
const fetchAvailableAssignees = async (ticketId) => {
  try {
    const res = await fetch(
      `${API_BASE}/secure/ticket/${ticketId}/available-assignees`,
      {
        credentials: "include",
      }
    );
    const data = await res.json();
    if (res.ok) {
      setAvailableAssignees(data.availableAssignees || []);
      setShowReassignModal(true);
    } else {
      alert(data.detail || "Failed to load assignees");
    }
  } catch (err) {
    console.error("Error fetching assignees:", err);
  }
};

// Reassign Ticket (SuperAdmin only)
const handleReassignTicket = async () => {
  if (!reassignment.assignedToEmail) {
    alert("Please select an assignee");
    return;
  }

  try {
    setReassigning(true);
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
      setReassignment({ assignedToEmail: "", reason: "" });
      viewTicketDetails(selectedTicket.ticketId);
      fetchTickets();
    } else {
      const data = await res.json();
      alert(data.detail || "Failed to reassign ticket");
    }
  } catch (err) {
    console.error("Error reassigning ticket:", err);
  } finally {
    setReassigning(false);
  }
};

// Close Ticket
const handleCloseTicket = async (reason) => {
  if (!reason) {
    alert("Please provide a reason for closing");
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/close`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      }
    );

    if (res.ok) {
      alert("Ticket closed successfully");
      viewTicketDetails(selectedTicket.ticketId);
      fetchTickets();
    } else {
      const data = await res.json();
      alert(data.detail || "Failed to close ticket");
    }
  } catch (err) {
    console.error("Error closing ticket:", err);
  }
};
```

## Next Steps

1. Copy the complete implementation files from the repository
2. Replace existing help-desk pages
3. Test all functionality
4. Deploy

See `HELP_DESK_COMPLETE_CODE.md` for the full page implementations.
