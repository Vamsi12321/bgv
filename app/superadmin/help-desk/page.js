"use client";

import { useState, useEffect } from "react";

// Sample ticket data
const sampleTickets = [
  {
    id: "TCKT-001",
    subject: "Login Issue",
    organization: "ABC",
    priority: "High",
    status: "Open",
    createdAt: "2025-10-09T10:30:00",
  },
  {
    id: "TCKT-002",
    subject: "Password Reset",
    organization: "XYZ",
    priority: "Medium",
    status: "Resolved",
    createdAt: "2025-10-08T15:20:00",
  },
];

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState(sampleTickets);
  const [hydrated, setHydrated] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    organization: "All",
    status: "All",
    priority: "All",
    startDate: "",
    endDate: "",
  });

  // Form state for creating ticket
  const [newTicket, setNewTicket] = useState({
    subject: "",
    organization: "",
    priority: "Medium",
    status: "Open",
  });

  useEffect(() => setHydrated(true), []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredTickets = tickets.filter((t) => {
    const created = new Date(t.createdAt);
    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;

    return (
      (filters.organization === "All" ||
        t.organization === filters.organization) &&
      (filters.status === "All" || t.status === filters.status) &&
      (filters.priority === "All" || t.priority === filters.priority) &&
      (!start || created >= start) &&
      (!end || created <= end)
    );
  });

  const handleCreateTicket = () => {
    const newT = {
      id: `TCKT-${tickets.length + 1}`.padStart(7, "0"),
      ...newTicket,
      createdAt: new Date().toISOString(),
    };
    setTickets([newT, ...tickets]);
    setNewTicket({
      subject: "",
      organization: "",
      priority: "Medium",
      status: "Open",
    });
    setShowModal(false);
  };

  return (
    <div className="p-6 space-y-6 bg-[#f9fafb] min-h-screen text-black">
      <h1 className="text-2xl font-bold">Helpdesk</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <select
          name="organization"
          value={filters.organization}
          onChange={handleFilterChange}
          className="border rounded p-2 text-black"
        >
          <option value="All">All Organizations</option>
          <option value="ABC">ABC</option>
          <option value="XYZ">XYZ</option>
        </select>

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="border rounded p-2 text-black"
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          name="priority"
          value={filters.priority}
          onChange={handleFilterChange}
          className="border rounded p-2 text-black"
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          className="border rounded p-2 text-black"
        />

        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          className="border rounded p-2 text-black"
        />

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#ff004f] text-white px-4 py-2 rounded"
        >
          Create Ticket
        </button>
      </div>

      {/* Tickets Table */}
      <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto">
        <table className="w-full table-auto border-collapse border text-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Ticket ID</th>
              <th className="border p-2 text-left">Subject</th>
              <th className="border p-2 text-left">Organization</th>
              <th className="border p-2 text-left">Priority</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="border p-2">{t.id}</td>
                <td className="border p-2">{t.subject}</td>
                <td className="border p-2">{t.organization}</td>
                <td className="border p-2">{t.priority}</td>
                <td className="border p-2">{t.status}</td>
                <td className="border p-2">
                  {hydrated
                    ? new Date(t.createdAt).toLocaleString()
                    : "Loading..."}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">Create Ticket</h2>

            <input
              type="text"
              placeholder="Subject"
              value={newTicket.subject}
              onChange={(e) =>
                setNewTicket({ ...newTicket, subject: e.target.value })
              }
              className="border rounded p-2 w-full text-black"
            />
            <select
              value={newTicket.organization}
              onChange={(e) =>
                setNewTicket({ ...newTicket, organization: e.target.value })
              }
              className="border rounded p-2 w-full text-black"
            >
              <option value="">Select Organization</option>
              <option value="ABC">ABC</option>
              <option value="XYZ">XYZ</option>
            </select>
            <select
              value={newTicket.priority}
              onChange={(e) =>
                setNewTicket({ ...newTicket, priority: e.target.value })
              }
              className="border rounded p-2 w-full text-black"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              value={newTicket.status}
              onChange={(e) =>
                setNewTicket({ ...newTicket, status: e.target.value })
              }
              className="border rounded p-2 w-full text-black"
            >
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-4 py-2 bg-[#ff004f] text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
