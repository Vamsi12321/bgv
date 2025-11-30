"use client";

import { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import { Button, Input, Modal, Badge } from "../../components/ui";
import EmptyState from "../../components/EmptyState";

import {
  Ticket,
  Plus,
  Search,
  Filter,
  Paperclip,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Eye,
  Loader2,
  Upload,
  X,
  UserCheck,
  RefreshCw,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

export default function SuperAdminTicketsPage() {
  // ===========================
  // GLOBAL STATES
  // ===========================
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "All",
    priority: "All",
    category: "All",
  });

  // Comments
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  // Status Change
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusComment, setStatusComment] = useState("");
  const [resolutionText, setResolutionText] = useState("");

  // Assignment
  const [assignee, setAssignee] = useState("");
  const [assignReason, setAssignReason] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [availableAssignees, setAvailableAssignees] = useState([]);

  // ===========================
  // INITIAL LOAD
  // ===========================
  useEffect(() => {
    fetchTickets();
  }, []);

  // ===========================
  // FETCH TICKETS LIST
  // ===========================
  const fetchTickets = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.status !== "All") params.append("status", filters.status);
      if (filters.priority !== "All")
        params.append("priority", filters.priority);
      if (filters.category !== "All")
        params.append("category", filters.category);

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
  const normalizeStatus = (s) => s?.toUpperCase().trim();
  const isClosed = (status) => {
    const s = normalizeStatus(status);
    return s === "CLOSED" || s === "CLOSE" || s.includes("CLOSED");
  };

  // ===========================
  // LOAD TICKET DETAILS
  // ===========================
  const handleViewTicket = async (ticket) => {
    try {
      const res = await fetch(`${API_BASE}/secure/ticket/${ticket.ticketId}`, {
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(data);
        setShowDetailModal(true);
        fetchAvailableAssignees(ticket.ticketId);
      }
    } catch (err) {
      console.error("Error fetching ticket details:", err);
    }
  };

  // Refresh details after actions
  const refreshTicketDetails = async () => {
    if (!selectedTicket) return;

    try {
      const res = await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}`,
        { credentials: "include" }
      );

      const data = await res.json();
      if (res.ok) setSelectedTicket(data);
    } catch (err) {
      console.error("Error refreshing ticket:", err);
    }
  };

  // ===========================
  // LOAD AVAILABLE ASSIGNEES
  // ===========================
  const fetchAvailableAssignees = async (ticketId) => {
    try {
      const res = await fetch(
        `${API_BASE}/secure/ticket/${ticketId}/available-assignees`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (res.ok) {
        setAvailableAssignees(data.availableAssignees || []);
      }
    } catch (err) {
      console.error("Error loading assignees:", err);
    }
  };

  // ===========================
  // ADD COMMENT
  // ===========================
  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      setCommenting(true);

      const res = await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/comment`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: comment }),
        }
      );

      if (res.ok) {
        setComment("");
        refreshTicketDetails();
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setCommenting(false);
    }
  };

  // ===========================
  // CHANGE STATUS
  // ===========================
  const handleChangeStatus = async (newStatus) => {
    try {
      setChangingStatus(true);

      const payload = {
        status: newStatus,
        comment: statusComment,
      };

      if (newStatus === "RESOLVED") payload.resolution = resolutionText;

      const res = await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        setStatusComment("");
        setResolutionText("");
        fetchTickets();
        refreshTicketDetails();
      }
    } catch (err) {
      console.error("Error changing status:", err);
    } finally {
      setChangingStatus(false);
    }
  };

  // ===========================
  // ASSIGN TICKET
  // ===========================
  const handleAssignTicket = async () => {
    if (!assignee.trim()) return;

    try {
      setAssigning(true);

      const res = await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/reassign`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignedToEmail: assignee,
            reason: assignReason,
          }),
        }
      );

      if (res.ok) {
        setAssignee("");
        setAssignReason("");
        refreshTicketDetails();
        fetchTickets();
      }
    } catch (err) {
      console.error("Error assigning ticket:", err);
    } finally {
      setAssigning(false);
    }
  };

  // ===========================
  // CLOSE / REOPEN
  // ===========================
  const handleCloseTicket = async () => {
    try {
      await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/close`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Closed by admin" }),
        }
      );

      refreshTicketDetails();
      fetchTickets();
    } catch (err) {
      console.error("Error closing ticket:", err);
    }
  };

  const handleReopenTicket = async () => {
    try {
      await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/reopen`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Reopened by admin" }),
        }
      );

      refreshTicketDetails();
      fetchTickets();
    } catch (err) {
      console.error("Error reopening ticket:", err);
    }
  };

  // ===========================
  // FILTER LOGIC
  // ===========================
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filters.status === "All" || ticket.status === filters.status;

    const matchesPriority =
      filters.priority === "All" || ticket.priority === filters.priority;

    const matchesCategory =
      filters.category === "All" || ticket.category === filters.category;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Badge helpers
  const getStatusBadge = (status) => {
    const variants = {
      OPEN: "warning",
      IN_PROGRESS: "info",
      RESOLVED: "success",
      CLOSED: "default",
      REOPENED: "danger",
    };
    return variants[status] || "default";
  };
  // ===========================
  // SUMMARY COUNTERS
  // ===========================
  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    reopened: tickets.filter((t) => t.status === "REOPENED").length,
    closed: tickets.filter((t) => t.status === "CLOSED").length,
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      CRITICAL: "danger",
      HIGH: "danger",
      MEDIUM: "warning",
      LOW: "success",
    };
    return variants[priority] || "default";
  }; // ===========================
  // MAIN PAGE RENDER
  // ===========================

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ff004f] border-t-transparent"></div>
          <div className="absolute inset-0 rounded-full bg-[#ff004f]/20 animate-ping"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-black tickets-page">
      <div className="p-4 sm:p-8">
        {/* PAGE HEADER */}
        <PageHeader
          title="All Support Tickets"
          subtitle="Manage and respond to support tickets from all organizations"
          breadcrumbs={["Support", "All Tickets"]}
          action={
            <Button variant="outline" icon={RefreshCw} onClick={fetchTickets}>
              Refresh
            </Button>
          }
        />
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 mt-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Total Tickets</p>
            <h2 className="text-2xl font-bold text-gray-900">
              {ticketStats.total}
            </h2>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Open</p>
            <h2 className="text-2xl font-bold text-blue-600">
              {ticketStats.open}
            </h2>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">In Progress</p>
            <h2 className="text-2xl font-bold text-yellow-600">
              {ticketStats.inProgress}
            </h2>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Resolved</p>
            <h2 className="text-2xl font-bold text-green-600">
              {ticketStats.resolved}
            </h2>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Reopened</p>
            <h2 className="text-2xl font-bold text-rose-600">
              {ticketStats.reopened}
            </h2>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Closed</p>
            <h2 className="text-2xl font-bold text-gray-600">
              {ticketStats.closed}
            </h2>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* SEARCH */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
              />
            </div>

            {/* STATUS FILTER */}
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
            >
              <option value="All">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>

            {/* PRIORITY */}
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
            >
              <option value="All">All Priority</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* CATEGORY */}
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
            >
              <option value="All">All Categories</option>
              <option value="IT_ISSUE">IT Issue</option>
              <option value="VERIFICATION_ISSUE">Verification Issue</option>
              <option value="HR_QUERY">HR Query</option>
              <option value="BILLING">Billing</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="BUG_REPORT">Bug Report</option>
              <option value="ACCOUNT_ISSUE">Account Issue</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* EMPTY STATE */}
        {filteredTickets.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No tickets found"
            description="No support tickets match your current filters"
          />
        ) : (
          /* TICKETS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.ticketId}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 
                  hover:shadow-md transition-all duration-300 cursor-pointer group"
                onClick={() => handleViewTicket(ticket)}
              >
                {/* HEADER */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-mono text-gray-500 bg-gray-100 
                        px-2 py-1 rounded"
                      >
                        {ticket.ticketId}
                      </span>

                      <Badge variant={getStatusBadge(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>

                    {/* SUBJECT */}
                    <h3
                      className="font-semibold text-gray-900 
                      group-hover:text-[#ff004f] transition-colors line-clamp-2"
                    >
                      {ticket.subject}
                    </h3>

                    {/* META */}
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}{" "}
                      | Org: {ticket.organizationName}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Category: {ticket.category}
                      <br />
                      Assigned to: {ticket.assignedToName || "Unassigned"}
                    </p>

                    {/* SLA */}
                    <p className="text-xs text-gray-500 mt-1">
                      SLA:{" "}
                      {ticket.slaDeadline
                        ? new Date(ticket.slaDeadline).toLocaleString()
                        : "—"}
                    </p>
                  </div>

                  {/* PRIORITY BADGE */}
                  <Badge variant={getPriorityBadge(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>

                {/* DESCRIPTION PREVIEW */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {ticket.description}
                </p>

                {/* VIEW BUTTON */}
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusBadge(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </Badge>

                  <button
                    className="text-[#ff004f] hover:text-[#e60047] 
                    transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ticket Detail Modal (Part 3) */}
        {selectedTicket && (
          <Modal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            title={selectedTicket.ticketId}
            size="lg"
          >
            {/* Part 3 will continue inside this modal */}
            {/* ===========================
                TICKET DETAIL MODAL CONTENT
            ============================ */}
            <div className="space-y-6">
              {/* HEADER */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedTicket.subject}
                </h2>

                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={getStatusBadge(selectedTicket.status)}>
                    {selectedTicket.status.replace("_", " ")}
                  </Badge>

                  <Badge variant={getPriorityBadge(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>

                  <span className="text-sm text-gray-500">
                    {selectedTicket.category}
                  </span>

                  {selectedTicket.assignedToName && (
                    <span className="text-sm text-gray-500">
                      Assigned: {selectedTicket.assignedToName}
                    </span>
                  )}
                </div>

                {/* SLA */}
                <p className="text-xs text-gray-500 mt-1">
                  SLA Deadline:{" "}
                  {selectedTicket.slaDeadline
                    ? new Date(selectedTicket.slaDeadline).toLocaleString()
                    : "—"}
                </p>
              </div>

              {/* ===========================
                  ADMIN CONTROLS
              ============================ */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Admin Actions
                </h3>

                {/* STATUS UPDATE SECTION */}
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Optional comment for status update"
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                      focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
                  />

                  {selectedTicket.status !== "RESOLVED" && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus("IN_PROGRESS")}
                        disabled={
                          changingStatus ||
                          selectedTicket.status === "IN_PROGRESS"
                        }
                      >
                        Mark In Progress
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus("RESOLVED")}
                        disabled={
                          changingStatus || selectedTicket.status === "RESOLVED"
                        }
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  )}

                  {/* RESOLUTION TEXT WHEN MARKING RESOLVED */}
                  {selectedTicket.status !== "RESOLVED" && (
                    <input
                      type="text"
                      placeholder="Resolution details (required if resolved)"
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                        focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
                    />
                  )}

                  {/* CLOSE TICKET */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCloseTicket}
                    disabled={
                      changingStatus || selectedTicket.status === "CLOSED"
                    }
                  >
                    Close Ticket
                  </Button>

                  {/* REOPEN */}
                  {isClosed(selectedTicket.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReopenTicket}
                      disabled={changingStatus}
                    >
                      Reopen Ticket
                    </Button>
                  )}
                </div>

                {/* ===========================
                    ASSIGN SECTION (SUPER ADMIN ONLY)
                ============================ */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">
                    Assign Ticket
                  </h3>

                  {/* ASSIGNEE DROPDOWN */}
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2
                      focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
                  >
                    <option value="">Select Assignee...</option>
                    {availableAssignees.map((user) => (
                      <option key={user.email} value={user.email}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>

                  {/* REASON */}
                  <input
                    type="text"
                    placeholder="Reason for assignment (optional)"
                    value={assignReason}
                    onChange={(e) => setAssignReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-3
                      focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
                  />

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAssignTicket}
                    loading={assigning}
                    icon={UserCheck}
                  >
                    Assign Ticket
                  </Button>
                </div>
              </div>

              {/* ===========================
                  DESCRIPTION
              ============================ */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* ===========================
                  ATTACHMENTS
              ============================ */}
              {selectedTicket.attachments &&
                selectedTicket.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Attachments
                    </h3>

                    <div className="space-y-2">
                      {selectedTicket.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-[#ff004f] 
                            hover:text-[#e60047] bg-gray-50 px-3 py-2 rounded"
                        >
                          <Paperclip size={14} />
                          {att.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {/* ===========================
                  COMMENTS SECTION
              ============================ */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Comments & Updates
                </h3>

                {/* COMMENTS LIST */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {selectedTicket.comments &&
                  selectedTicket.comments.length > 0 ? (
                    selectedTicket.comments.map((c, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {c.commentBy}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(c.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{c.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No comments yet
                    </p>
                  )}
                </div>

                {/* ADD COMMENT INPUT */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg 
                      focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
                  />

                  <Button
                    variant="primary"
                    onClick={handleAddComment}
                    loading={commenting}
                    icon={Send}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
