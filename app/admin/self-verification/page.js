"use client";
import { useState } from "react";

export default function SelfVerificationPage({ orgName = "ABC Corp" }) {
  const [candidate, setCandidate] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [selectedChecks, setSelectedChecks] = useState({
    aadhaar: false,
    pan: false,
    address: false,
    degree: false,
    employment: false,
    cibil: false,
  });

  const [requests, setRequests] = useState([]);

  const toggleCheck = (key) => {
    setSelectedChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!candidate.name || !candidate.email || !candidate.mobile) {
      alert("Please fill all fields");
      return;
    }

    const checks = Object.keys(selectedChecks).filter(
      (key) => selectedChecks[key]
    );
    if (checks.length === 0) {
      alert("Please select at least one verification check");
      return;
    }

    const newRequest = {
      id: requests.length + 1,
      ...candidate,
      org: orgName, // automatically assign org
      checks,
      initiatedBy: "Candidate (Self)",
      status: "Pending",
    };

    setRequests((prev) => [...prev, newRequest]);
    alert(
      `✅ Self-verification initiated for ${candidate.name} (${orgName})
Checks: ${checks.join(", ")}`
    );

    // Reset form
    setCandidate({ name: "", email: "", mobile: "" });
    setSelectedChecks({
      aadhaar: false,
      pan: false,
      address: false,
      degree: false,
      employment: false,
      cibil: false,
    });
  };

  const checksList = [
    {
      key: "aadhaar",
      title: "Aadhaar Verification",
      desc: "Verify Aadhaar number & face match.",
      icon: "🪪",
    },
    {
      key: "pan",
      title: "PAN Verification",
      desc: "Verify PAN with DOB & Aadhaar seeding.",
      icon: "💳",
    },
    {
      key: "address",
      title: "Address Verification",
      desc: "Verify address via photo or document proof.",
      icon: "📍",
    },
    {
      key: "degree",
      title: "Degree Verification",
      desc: "Verify academic degrees from universities.",
      icon: "🎓",
    },
    {
      key: "employment",
      title: "Past Employment Verification",
      desc: "Verify previous employment history.",
      icon: "💼",
    },
    {
      key: "cibil",
      title: "CIBIL Report Check",
      desc: "Check credit score & financial reliability.",
      icon: "📊",
    },
  ];

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold text-black">
        Candidate Self Verification
      </h1>

      {/* Candidate Info Form */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Fill Candidate Details
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <input
            type="text"
            placeholder="Full Name"
            className="border p-2 rounded placeholder-black text-black"
            value={candidate.name}
            onChange={(e) =>
              setCandidate({ ...candidate, name: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded placeholder-black text-black"
            value={candidate.email}
            onChange={(e) =>
              setCandidate({ ...candidate, email: e.target.value })
            }
          />
          <input
            type="tel"
            placeholder="Mobile Number"
            className="border p-2 rounded placeholder-black text-black"
            value={candidate.mobile}
            onChange={(e) =>
              setCandidate({ ...candidate, mobile: e.target.value })
            }
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </form>

        {/* Select Verification Checks */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-black">
            Select Verification Checks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {checksList.map((c) => {
              const selected = selectedChecks[c.key];
              return (
                <div
                  key={c.key}
                  className={`border rounded-lg p-4 shadow-sm cursor-pointer transition ${
                    selected
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => toggleCheck(c.key)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{c.icon}</span>
                      <h4 className="font-semibold text-black">{c.title}</h4>
                    </div>
                    <span
                      className={`text-sm px-2 py-1 rounded-full text-white ${
                        selected ? "bg-blue-600" : "bg-gray-400"
                      }`}
                    >
                      {selected ? "Selected" : "Select"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table of Submitted Verifications */}
      {requests.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4 text-black">
            Self-Verification Requests
          </h2>
          <table className="w-full border rounded-lg border-black text-black">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Organization</th>
                <th className="p-3 text-left">Initiated By</th>
                <th className="p-3 text-left">Selected Checks</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.org}</td>
                  <td className="p-3 text-gray-700">{r.initiatedBy}</td>
                  <td className="p-3">
                    <ul className="list-disc pl-5">
                      {r.checks.map((c, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          {checksList.find((x) => x.key === c)?.icon || "✅"}{" "}
                          {checksList.find((x) => x.key === c)?.title || c}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        r.status === "Completed"
                          ? "bg-green-600"
                          : "bg-yellow-500"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
