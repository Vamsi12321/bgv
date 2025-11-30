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

export default function OrgHelpDeskPage() {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({
    status: "All",
    priority: "All",
    category: "All",
  });

  // Create Ticket
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

  // Status Change
  const [changingStatus, setChangingStatus] = useState(false);

  // Assign
  const [assignee, setAssignee] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("bgvUser");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    fetchCategories();
    fetchTickets();
  }, []);

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

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "All") params.append("status", filters.status);
      if (filters.priority && filters.priority !== "All") params.append("priority", filters.priority);
      if (filters.category && filters.category !== "All") params.append("category", filters.category);
      
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

  const handleAddComment = async () => {
    if (!comment.trim() || !selectedTicket) return;

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

  const handleChangeStatus = async (newStatus) => {
    if (!selectedTicket) return;

    try {
      setChangingStatus(true);
      const res = await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        refreshTicketDetails();
        fetchTickets();
      }
    } catch (err) {
      console.error("Error changing status:", err);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!assignee.trim() || !selectedTicket) return;

    try {
      setAssigning(true);
      const res = await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/reassign`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignee }),
        }
      );

      if (res.ok) {
        setAssignee("");
        refreshTicketDetails();
        fetchTickets();
      }
    } catch (err) {
      console.error("Error assigning ticket:", err);
    } finally {
      setAssigning(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      const res = await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/close`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Resolved by admin" }),
        }
      );

      if (res.ok) {
        refreshTicketDetails();
        fetchTickets();
      }
    } catch (err) {
      console.error("Error closing ticket:", err);
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;

    try {
      const res = await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/reopen`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Reopened by admin" }),
        }
      );

      if (res.ok) {
        refreshTicketDetails();
        fetchTickets();
      }
    } catch (err) {
      console.error("Error reopening ticket:", err);
    }
  };

  const refreshTicketDetails = async () => {
    if (!selectedTicket) return;

    try {
      const res = await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(data);
      }
    } catch (err) {
      console.error("Error refreshing ticket:", err);
    }
  };

  const handleViewTicket = async (ticket) => {
    try {
      const res = await fetch(`${API_BASE}/secure/ticket/${ticket.ticketId}`, {
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

  const getPriorityBadge = (priority) => {
    const variants = {
      HIGH: "danger",
      MEDIUM: "warning",
      LOW: "success",
    };
    return variants[priority] || "default";
  };

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
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-black tickets-page
"
    >
      <div className="p-4 sm:p-8">
        <PageHeader
          title="Support Tickets"
          subtitle="Create and manage support tickets"
          breadcrumbs={["Support", "Tickets"]}
          action={
            <div className="flex gap-2">
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
              >
                Create Ticket
              </Button>
              <Button variant="outline" icon={RefreshCw} onClick={fetchTickets}>
                Refresh
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
            >
              <option value="All">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
            >
              <option value="All">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
            >
              <option value="All">All Categories</option>
              <option value="General">General</option>
              <option value="API Failure">API Failure</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
            </select>
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No tickets found"
            description="No support tickets match your current filters"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.ticketId}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer group"
                onClick={() => handleViewTicket(ticket)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{ticket.ticketId}</span>
                      <Badge variant={getStatusBadge(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#ff004f] transition-colors line-clamp-2">
                      {ticket.subject}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Category: {ticket.category} | Assigned to: {ticket.assignedToName || 'Unassigned'}
                    </p>
                  </div>
                  <Badge variant={getPriorityBadge(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {ticket.description}
                </p>

                <div className="flex items-center justify-between">
                  <Badge variant={getStatusBadge(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                  <button className="text-[#ff004f] hover:text-[#e60047] transition-colors flex items-center gap-1 text-sm font-medium">
                    <Eye size={16} />
                    View
                  </button>
                </div>

                {ticket.assignedTo && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Assigned to:{" "}
                      <span className="font-medium text-gray-700">
                        {ticket.assignedTo}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Create New Ticket"
            size="lg"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  placeholder="Brief description of the issue"
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                  maxLength={200}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
                >
                  <option value="">Select Category...</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value} title={cat.description}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, priority: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Detailed description of the issue..."
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                  rows={6}
                  maxLength={2000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateTicket}
                  loading={creating}
                  icon={Plus}
                >
                  Create Ticket
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <Modal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            title={selectedTicket.ticketId}
            size="lg"
          >
            <div className="space-y-6">
              {/* Header */}
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
                  {selectedTicket.assignedTo && (
                    <span className="text-sm text-gray-500">
                      Assigned: {selectedTicket.assignedTo}
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Admin Actions
                </h3>

                {/* Status Change */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangeStatus("IN_PROGRESS")}
                    disabled={
                      changingStatus || selectedTicket.status === "IN_PROGRESS"
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
                  {selectedTicket.status === "CLOSED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReopenTicket}
                      disabled={changingStatus}
                    >
                      Reopen
                    </Button>
                  )}
                </div>

                {/* Assign */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Assign to email..."
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAssignTicket}
                    loading={assigning}
                    icon={UserCheck}
                  >
                    Assign
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Attachments */}
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
                          className="flex items-center gap-2 text-sm text-[#ff004f] hover:text-[#e60047] bg-gray-50 px-3 py-2 rounded"
                        >
                          <Paperclip size={14} />
                          {att.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {/* Comments */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Comments</h3>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {selectedTicket.comments &&
                  selectedTicket.comments.length > 0 ? (
                    selectedTicket.comments.map((c, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {c.commentedBy}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(c.commentedAt).toLocaleString()}
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

                {/* Add Comment */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
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
