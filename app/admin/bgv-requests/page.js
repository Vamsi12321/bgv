"use client";
import { useState } from "react";

export default function BgvRequestsPage({ orgName = "ABC Corp" }) {
  const [requests, setRequests] = useState([
    {
      id: 1,
      candidate: "Ravi Kumar",
      org: orgName,
      initiatedBy: "Admin",
      checks: ["Degree Verification", "CIBIL Report"],
      status: "Pending",
    },
  ]);

  const [employee, setEmployee] = useState({
    name: "",
    email: "",
    mobile: "",
    checks: [],
  });

  const [selectedCheck, setSelectedCheck] = useState(null);

  const verificationCards = [
    {
      title: "Aadhaar Verification",
      desc: "Verify Aadhaar details and face match.",
      icon: "🪪",
    },
    {
      title: "PAN Verification",
      desc: "Validate PAN details and link with Aadhaar.",
      icon: "💳",
    },
    {
      title: "Address Verification",
      desc: "Verify address via proof or field visit.",
      icon: "📍",
    },
    {
      title: "Degree Verification",
      desc: "Verify educational certificates and universities.",
      icon: "🎓",
    },
    {
      title: "Past Employment Verification",
      desc: "Validate previous employer details and experience.",
      icon: "💼",
    },
    {
      title: "CIBIL Report Verification",
      desc: "Fetch candidate credit report securely.",
      icon: "📊",
    },
  ];

  const handleInitiate = (e) => {
    e.preventDefault();

    if (!employee.name || !employee.email || !employee.mobile) {
      alert("Please fill all fields");
      return;
    }

    if (!employee.checks || employee.checks.length === 0) {
      alert("Please select at least one verification check");
      return;
    }

    const newRequest = {
      id: requests.length + 1,
      candidate: employee.name,
      org: orgName, // auto-assign organization
      initiatedBy: "Admin / HR",
      checks: employee.checks,
      status: "Initiated",
    };

    setRequests((prev) => [...prev, newRequest]);
    alert(`Verification initiated for ${employee.name}`);
    setEmployee({ name: "", email: "", mobile: "", checks: [] });
  };

  return (
    <div className="p-8 space-y-10 text-black">
      <h1 className="text-2xl font-bold text-black">
        Background Verification (BGV) Dashboard
      </h1>

      {/* Initiate Section */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          Initiate Candidate Verification
        </h2>
        <form onSubmit={handleInitiate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Candidate Name"
              className="border p-2 rounded placeholder-black text-black"
              value={employee.name}
              onChange={(e) =>
                setEmployee({ ...employee, name: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="Email"
              className="border p-2 rounded placeholder-black text-black"
              value={employee.email}
              onChange={(e) =>
                setEmployee({ ...employee, email: e.target.value })
              }
            />
            <input
              type="tel"
              placeholder="Mobile Number"
              className="border p-2 rounded placeholder-black text-black"
              value={employee.mobile}
              onChange={(e) =>
                setEmployee({ ...employee, mobile: e.target.value })
              }
            />
          </div>

          <div>
            <h3 className="font-semibold text-black mb-2">
              Select Verification Checks:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {verificationCards.map((check, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-2 border p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    checked={employee.checks.includes(check.title)}
                    onChange={(e) => {
                      const updatedChecks = e.target.checked
                        ? [...employee.checks, check.title]
                        : employee.checks.filter((c) => c !== check.title);
                      setEmployee({ ...employee, checks: updatedChecks });
                    }}
                  />
                  <span>{check.title}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Initiate
          </button>
        </form>
      </div>

      {/* Verification Modules Section */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          Available Verification Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {verificationCards.map((c, i) => (
            <div
              key={i}
              className="border border-gray-300 rounded-xl p-5 shadow-sm hover:shadow-lg transition bg-gradient-to-b from-white to-gray-50 flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
                <p className="text-gray-600 text-sm">{c.desc}</p>
              </div>
              <div className="mt-5 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedCheck(c)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 relative shadow-lg">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold"
              onClick={() => setSelectedCheck(null)}
            >
              ×
            </button>
            <div className="text-4xl mb-4">{selectedCheck.icon}</div>
            <h3 className="text-xl font-semibold mb-2">
              {selectedCheck.title}
            </h3>
            <p className="text-gray-700 mb-4">{selectedCheck.desc}</p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => {
                alert(`Performing ${selectedCheck.title}`);
              }}
            >
              Start Verification
            </button>
          </div>
        </div>
      )}

      {/* Existing Verifications */}
      <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Existing Verifications</h2>
        <table className="w-full border rounded-lg border-black text-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Candidate</th>
              <th className="p-3 text-left">Organization</th>
              <th className="p-3 text-left">Initiated By</th>
              <th className="p-3 text-left">Checks</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.candidate}</td>
                <td className="p-3">{r.org}</td>
                <td className="p-3">{r.initiatedBy}</td>
                <td className="p-3">
                  {r.checks.length ? (
                    <ul className="list-disc pl-5">
                      {r.checks.map((c, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          {c}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500 text-sm">No checks yet</span>
                  )}
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
    </div>
  );
}
