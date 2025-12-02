"use client";

import { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import { Button, Modal, Badge } from "../../components/ui";
import EmptyState from "../../components/EmptyState";
import {
  Ticket,
  Plus,
  Search,
  Paperclip,
  Send,
  Eye,
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

  // Commenting
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTickets();
  }, []);

  // -------------------------------------------------
  // FETCH CATEGORIES
  // -------------------------------------------------
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/secure/ticket/categories`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch (err) {
      console.error("Categories error:", err);
    }
  };

  // -------------------------------------------------
  // FETCH TICKETS
  // -------------------------------------------------
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
      if (res.ok) setTickets(data.tickets || []);
    } catch (err) {
      console.error("Tickets error:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------
  // SUMMARY COUNTERS
  // -------------------------------------------------
  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    reopened: tickets.filter((t) => t.status === "REOPENED").length,
    closed: tickets.filter((t) => t.status === "CLOSED").length,
  };

  // -------------------------------------------------
  // VIEW TICKET DETAILS
  // -------------------------------------------------
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
      console.error("Ticket detail error:", err);
    }
  };

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
      console.error("Refresh error:", err);
    }
  };

  // -------------------------------------------------
  // CREATE TICKET
  // -------------------------------------------------
  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description || !newTicket.category) {
      alert("All fields are required.");
      return;
    }

    try {
      setCreating(true);

      const res = await fetch(`${API_BASE}/secure/ticket/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Ticket ${data.ticketId} created successfully`);
        setShowCreateModal(false);
        setNewTicket({
          subject: "",
          description: "",
          category: "",
          priority: "MEDIUM",
        });
        fetchTickets();
      } else {
        alert(data.detail || "Failed to create ticket");
      }
    } catch (err) {
      console.error("Create error:", err);
    } finally {
      setCreating(false);
    }
  };

  // -------------------------------------------------
  // ADD COMMENT
  // -------------------------------------------------
  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      setCommenting(true);

      await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/comment`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: comment }),
        }
      );
      setSelectedTicket((prev) => ({
        ...prev,
        comments: [
          {
            comment: comment,
            commentedBy: "You",
            commentedAt: new Date().toISOString(),
          },
          ...(prev.comments || []),
        ],
      }));

      setComment("");
      refreshTicketDetails();
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setCommenting(false);
    }
  };

  // -------------------------------------------------
  // REOPEN TICKET
  // -------------------------------------------------
  const handleReopenTicket = async () => {
    try {
      await fetch(
        `${API_BASE}/secure/ticket/${selectedTicket.ticketId}/reopen`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Reopened by user" }),
        }
      );

      refreshTicketDetails();
      fetchTickets();
    } catch (err) {
      console.error("Reopen error:", err);
    }
  };
  // -------------------------------------------------
  // FILTERED TICKETS
  // -------------------------------------------------
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

  // BADGES
  const getStatusBadge = (status) => {
    const map = {
      OPEN: "warning",
      IN_PROGRESS: "info",
      RESOLVED: "success",
      CLOSED: "default",
      REOPENED: "danger",
    };
    return map[status] || "default";
  };

  const getPriorityBadge = (priority) => {
    const map = {
      CRITICAL: "danger",
      HIGH: "danger",
      MEDIUM: "warning",
      LOW: "success",
    };
    return map[priority] || "default";
  };
  // -------------------------------------------------
  // LOADING SCREEN
  // -------------------------------------------------
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

  // -------------------------------------------------
  // RENDER PAGE
  // -------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-black tickets-page">
      <div className="p-4 sm:p-8">
        {/* PAGE HEADER */}
        <PageHeader
          title="Support Tickets"
          subtitle="Create and manage your organization's support tickets"
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
        {/* ---------------------- SUMMARY CARDS ---------------------- */}
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
        {/* ---------------------- FILTERS ---------------------- */}
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

            {/* PRIORITY FILTER */}
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

            {/* CATEGORY FILTER */}
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-[#ff004f] focus:border-[#ff004f] outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* ---------------------- TICKETS GRID ---------------------- */}
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

                    <h3
                      className="font-semibold text-gray-900 
                      group-hover:text-[#ff004f] transition-colors line-clamp-2"
                    >
                      {ticket.subject}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Category: {ticket.category}
                      <br />
                      Assigned to: {ticket.assignedToName || "Unassigned"}
                    </p>
                  </div>

                  <Badge variant={getPriorityBadge(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>

                {/* DESCRIPTION PREVIEW */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {ticket.description}
                </p>

                {/* FOOTER */}
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
        )}{" "}
        {/* ---------------------- CREATE TICKET MODAL ---------------------- */}
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Create New Ticket"
            size="lg"
          >
            <div className="space-y-4">
              {/* SUBJECT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                  placeholder="Enter the issue subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-[#ff004f] outline-none"
                />
              </div>

              {/* CATEGORY */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-[#ff004f] outline-none"
                >
                  <option value="">Choose category...</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* PRIORITY */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, priority: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-[#ff004f] outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                  rows={6}
                  placeholder="Explain your issue in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-[#ff004f] outline-none resize-none"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  icon={Plus}
                  loading={creating}
                  onClick={handleCreateTicket}
                >
                  Create Ticket
                </Button>
              </div>
            </div>
          </Modal>
        )}
        {/* ---------------------- TICKET DETAIL MODAL ---------------------- */}
        {selectedTicket && (
          <Modal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            title={selectedTicket.ticketId}
            size="lg"
          >
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
                      Assigned to: {selectedTicket.assignedToName}
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

              {/* ---------------------- USER ACTIONS (ONLY REOPEN) ---------------------- */}
              {selectedTicket.status === "CLOSED" && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-sm">Actions</h3>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReopenTicket}
                  >
                    Reopen Ticket
                  </Button>
                </div>
              )}

              {/* ---------------------- DESCRIPTION ---------------------- */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* ---------------------- ATTACHMENTS ---------------------- */}
              {selectedTicket.attachments?.length > 0 && (
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

              {/* ---------------------- COMMENTS ---------------------- */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Comments</h3>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {selectedTicket.comments?.length > 0 ? (
                    selectedTicket.comments.map((c, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {c.commentedBy || c.commentBy || c.commentedByName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(
                              c.commentedAt || c.timestamp
                            ).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {c.comment || c.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No comments yet
                    </p>
                  )}
                </div>

                {/* ADD COMMENT */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg 
                    focus:ring-2 focus:ring-[#ff004f] outline-none"
                  />

                  <Button
                    variant="primary"
                    icon={Send}
                    loading={commenting}
                    onClick={handleAddComment}
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
