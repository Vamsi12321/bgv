"use client";

import { useState, useEffect } from "react";

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const [organizations, setOrganizations] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    organization: "All",
    status: "All",
    priority: "All",
    startDate: "",
    endDate: "",
  });

  const [newTicket, setNewTicket] = useState({
    subject: "",
    organization: "",
    priority: "Medium",
    status: "Open",
  });

  useEffect(() => {
    setHydrated(true);

    // Load organizations
    fetch("https://maihoo.onrender.com/secure/getOrganizations")
      .then((res) => res.json())
      .then((data) => {
        if (data?.organizations) {
          setOrganizations(data.organizations);
        }
      })
      .catch((err) => console.log("Org Fetch Error:", err));

    // Sample Tickets
    setTickets([
      {
        id: "TCKT-001",
        subject: "Login Issue",
        organization: "Innova Dynamics",
        priority: "High",
        status: "Open",
        createdAt: "2025-10-09T10:30:00",
      },
      {
        id: "TCKT-002",
        subject: "Password Reset",
        organization: "TechNova",
        priority: "Medium",
        status: "Resolved",
        createdAt: "2025-10-08T15:20:00",
      },
    ]);
  }, []);

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
    <div className="p-6 space-y-6 min-h-screen bg-white text-black">
      <h1 className="text-3xl font-bold text-[#ff004f]">Helpdesk</h1>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <select
          name="organization"
          value={filters.organization}
          onChange={handleFilterChange}
          className="border rounded p-2"
        >
          <option value="All">All Organizations</option>
          {organizations.map((org) => (
            <option key={org._id} value={org.organizationName}>
              {org.organizationName}
            </option>
          ))}
        </select>

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="border rounded p-2"
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
          className="border rounded p-2"
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
          className="border rounded p-2"
        />

        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          className="border rounded p-2"
        />

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#ff004f] text-white px-5 py-2 rounded font-semibold hover:opacity-90 transition"
        >
          + Create Ticket
        </button>
      </div>

      {/* TICKETS TABLE */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full table-auto text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3">Ticket ID</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Organization</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50 transition">
                <td className="p-3">{t.id}</td>
                <td className="p-3">{t.subject}</td>
                <td className="p-3">{t.organization}</td>
                <td className="p-3">{t.priority}</td>
                <td className="p-3">{t.status}</td>
                <td className="p-3">
                  {hydrated ? new Date(t.createdAt).toLocaleString() : "..."}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md space-y-4 border border-gray-300">
            <h2 className="text-xl font-bold text-[#ff004f]">Create Ticket</h2>

            <input
              type="text"
              placeholder="Subject"
              value={newTicket.subject}
              onChange={(e) =>
                setNewTicket({ ...newTicket, subject: e.target.value })
              }
              className="border rounded p-2 w-full"
            />

            <select
              value={newTicket.organization}
              onChange={(e) =>
                setNewTicket({ ...newTicket, organization: e.target.value })
              }
              className="border rounded p-2 w-full"
            >
              <option value="">Select Organization</option>
              {organizations.map((org) => (
                <option key={org._id} value={org.organizationName}>
                  {org.organizationName}
                </option>
              ))}
            </select>

            <select
              value={newTicket.priority}
              onChange={(e) =>
                setNewTicket({ ...newTicket, priority: e.target.value })
              }
              className="border rounded p-2 w-full"
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
              className="border rounded p-2 w-full"
            >
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-400 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-4 py-2 bg-[#ff004f] text-white rounded hover:opacity-90"
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
