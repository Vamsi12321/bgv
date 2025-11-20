"use client";
import { useEffect, useState } from "react";
import { PlusCircle, X, Edit, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://maihoo.onrender.com";

/* -------------------------------------------- */
/* NORMALIZE CANDIDATE (fixes uncontrolled inputs) */
/* -------------------------------------------- */
const normalizeCandidate = (c = {}) => ({
  _id: c._id ?? "",
  firstName: c.firstName ?? "",
  middleName: c.middleName ?? "",
  lastName: c.lastName ?? "",
  phone: c.phone ?? "",
  email: c.email ?? "",
  aadhaarNumber: c.aadhaarNumber ?? "",
  panNumber: c.panNumber ?? "",
  address: c.address ?? "",
});

export default function ManageCandidatesPage() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [newCandidate, setNewCandidate] = useState(normalizeCandidate({}));
  const [editCandidate, setEditCandidate] = useState(normalizeCandidate({}));

  const [saving, setSaving] = useState(false);

  /* -------------------------------------------- */
  /* FETCH ORGANIZATIONS */
  /* -------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/secure/getOrganizations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setOrganizations(data.organizations || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  /* -------------------------------------------- */
  /* FETCH CANDIDATES WHEN ORG SELECTED */
  /* -------------------------------------------- */
  const loadCandidates = async () => {
    if (!selectedOrg) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/secure/getCandidates?orgId=${selectedOrg}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) setCandidates(data.candidates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrg) loadCandidates();
  }, [selectedOrg]);

  /* -------------------------------------------- */
  /* ADD CANDIDATE */
  /* -------------------------------------------- */
  const handleAddChange = (e) => {
    setNewCandidate((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = async () => {
    if (!newCandidate.firstName || !newCandidate.lastName) return;
    setSaving(true);

    try {
      const payload = { ...newCandidate, organizationId: selectedOrg };

      const res = await fetch(`${API_BASE}/secure/addCandidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewCandidate(normalizeCandidate({})); // FIXED
        await loadCandidates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------- */
  /* EDIT CANDIDATE */
  /* -------------------------------------------- */
  const handleEditChange = (e) => {
    setEditCandidate((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = async () => {
    setSaving(true);

    try {
      const payload = {
        operation: "edit",
        candidateId: editCandidate._id,
        organizationId: selectedOrg,
        updates: { ...editCandidate },
      };

      const res = await fetch(`${API_BASE}/secure/modifyCandidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditCandidate(normalizeCandidate({}));
        await loadCandidates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------- */
  /* DELETE CANDIDATE */
  /* -------------------------------------------- */
  const handleDelete = async () => {
    setSaving(true);

    try {
      const payload = {
        operation: "delete",
        candidateId: selectedCandidate._id,
        organizationId: selectedOrg,
      };

      const res = await fetch(`${API_BASE}/secure/modifyCandidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedCandidate(null);
        await loadCandidates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------- */
  /* UI */
  /* -------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Manage Candidates
            </h1>
            <p className="text-gray-700 mt-1">
              Add, edit, and delete candidates for your organization.
            </p>
          </div>

          <button
            onClick={() => {
              setNewCandidate(normalizeCandidate({}));
              setShowAddModal(true);
            }}
            disabled={!selectedOrg}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <PlusCircle size={18} />
            Add Candidate
          </button>
        </div>

        {/* ORGANIZATION SELECT */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <label className="block text-sm font-medium mb-2 text-gray-800">
            Select Organization
          </label>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full border rounded-md p-2 text-gray-900"
          >
            <option value="">-- Select --</option>
            {organizations.map((o) => (
              <option key={o._id} value={o._id}>
                {o.organizationName}
              </option>
            ))}
          </select>
        </div>

        {/* CANDIDATES LIST */}
        <div className="bg-white p-6 rounded-lg shadow border text-gray-900">
          {loading ? (
            <div className="text-center py-10 text-gray-600">Loading...</div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              No candidates found.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-red-100 text-black">
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Phone</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Aadhaar</th>
                      <th className="p-3 text-left">PAN</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr
                        key={c._id}
                        className="border-b hover:bg-red-50 transition"
                      >
                        <td className="p-3">
                          {c.firstName} {c.lastName}
                        </td>
                        <td className="p-3">{c.phone}</td>
                        <td className="p-3">{c.email}</td>
                        <td className="p-3">{c.aadhaarNumber}</td>
                        <td className="p-3">{c.panNumber}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                              onClick={() => {
                                setEditCandidate(normalizeCandidate(c)); // FIXED
                                setShowEditModal(true);
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                              onClick={() => {
                                setSelectedCandidate(normalizeCandidate(c)); // FIXED
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden grid gap-4">
                {candidates.map((c) => (
                  <div
                    key={c._id}
                    className="border rounded-lg p-4 shadow bg-white"
                  >
                    <div className="font-semibold text-lg">
                      {c.firstName} {c.lastName}
                    </div>

                    <div className="text-sm mt-1 text-gray-700">
                      📞 {c.phone}
                    </div>
                    <div className="text-sm text-gray-700">✉️ {c.email}</div>

                    <div className="text-sm text-gray-700 mt-2">
                      Aadhaar: {c.aadhaarNumber}
                    </div>
                    <div className="text-sm text-gray-700">
                      PAN: {c.panNumber}
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => {
                          setEditCandidate(normalizeCandidate(c));
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="flex-1 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => {
                          setSelectedCandidate(normalizeCandidate(c));
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showAddModal && (
        <Modal title="Add Candidate" onClose={() => setShowAddModal(false)}>
          <CandidateForm
            data={newCandidate}
            onChange={handleAddChange}
            onSubmit={handleAdd}
            saving={saving}
            submitText="Add Candidate"
          />
        </Modal>
      )}

      {showEditModal && (
        <Modal title="Edit Candidate" onClose={() => setShowEditModal(false)}>
          <CandidateForm
            data={editCandidate}
            onChange={handleEditChange}
            onSubmit={handleEdit}
            saving={saving}
            submitText="Save Changes"
          />
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          title="Delete Candidate"
          onClose={() => setShowDeleteModal(false)}
        >
          <p className="text-gray-800">
            Are you sure you want to delete{" "}
            <strong>
              {selectedCandidate?.firstName} {selectedCandidate?.lastName}
            </strong>
            ?
          </p>

          <button
            onClick={handleDelete}
            disabled={saving}
            className="mt-5 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            {saving ? <Loader2 className="animate-spin mx-auto" /> : "Delete"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------------------- */
/* MODAL COMPONENT */
/* -------------------------------------------- */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg text-gray-900"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">
            <X size={22} />
          </button>
        </div>

        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------- */
/* FORM COMPONENT */
/* -------------------------------------------- */
function CandidateForm({ data, onChange, onSubmit, saving, submitText }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900">
        <input
          name="firstName"
          value={data.firstName}
          onChange={onChange}
          placeholder="First Name"
          className="border p-2 rounded"
        />
        <input
          name="middleName"
          value={data.middleName}
          onChange={onChange}
          placeholder="Middle Name"
          className="border p-2 rounded"
        />
        <input
          name="lastName"
          value={data.lastName}
          onChange={onChange}
          placeholder="Last Name"
          className="border p-2 rounded"
        />
        <input
          name="phone"
          value={data.phone}
          onChange={onChange}
          placeholder="Phone Number"
          className="border p-2 rounded"
          pattern="[0-9]{10}"
        />
        <input
          name="aadhaarNumber"
          value={data.aadhaarNumber}
          onChange={onChange}
          placeholder="Aadhaar Number"
          className="border p-2 rounded"
          pattern="[0-9]{12}"
        />
        <input
          name="panNumber"
          value={data.panNumber}
          onChange={onChange}
          placeholder="PAN Number"
          className="border p-2 rounded uppercase"
          pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
        />
      </div>

      <input
        name="email"
        value={data.email}
        onChange={onChange}
        placeholder="Email"
        type="email"
        className="border p-2 rounded w-full mt-4"
      />

      <textarea
        name="address"
        value={data.address}
        onChange={onChange}
        placeholder="Address"
        rows={3}
        className="border p-2 rounded w-full mt-4"
      />

      <button
        onClick={onSubmit}
        disabled={saving}
        className="mt-5 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
      >
        {saving ? <Loader2 className="animate-spin mx-auto" /> : submitText}
      </button>
    </div>
  );
}
