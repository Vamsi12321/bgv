"use client";
import { useState } from "react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([
    {
      id: "INV001",
      org: "ABC Corp",
      amount: 5000,
      discount: 0,
      referral: "John Doe",
      status: "Paid",
      date: "2025-09-25",
    },
    {
      id: "INV002",
      org: "XYZ Ltd",
      amount: 8000,
      discount: 0,
      referral: "",
      status: "Pending",
      date: "2025-09-26",
    },
    {
      id: "INV003",
      org: "DEF Pvt",
      amount: 6000,
      discount: 10,
      referral: "Nisha Patel",
      status: "Overdue",
      date: "2025-09-20",
    },
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [discountValue, setDiscountValue] = useState("");
  const [referralName, setReferralName] = useState("");

  const handleMarkPaid = (id) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "Paid" } : inv))
    );
  };

  const handleApplyDiscount = (id) => {
    if (discountValue === "" || isNaN(discountValue) || discountValue < 0) {
      alert("Enter a valid discount percentage (0-100)");
      return;
    }
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              discount: Number(discountValue),
              amount: Math.round(inv.amount * (1 - discountValue / 100)),
            }
          : inv
      )
    );
    setDiscountValue("");
    setSelectedInvoice(null);
  };

  const handleAddReferral = (id) => {
    if (!referralName.trim()) {
      alert("Enter referral name");
      return;
    }
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, referral: referralName } : inv
      )
    );
    setReferralName("");
    setSelectedInvoice(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-10 text-black">
      <h1 className="text-3xl md:text-4xl font-bold text-red-700">Invoices</h1>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white p-6 rounded-xl shadow-lg border border-red-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-red-50 text-red-800 border-b border-red-200">
              <th className="p-3">Invoice ID</th>
              <th className="p-3">Organization</th>
              <th className="p-3">Referral</th>
              <th className="p-3">Discount (%)</th>
              <th className="p-3">Final Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b hover:bg-red-50 transition">
                <td className="p-3">{inv.id}</td>
                <td className="p-3 font-semibold">{inv.org}</td>
                <td className="p-3">
                  {inv.referral ? (
                    <span className="text-green-700 font-medium">
                      {inv.referral}
                    </span>
                  ) : (
                    <span className="text-black/60 italic">None</span>
                  )}
                </td>
                <td className="p-3">
                  {inv.discount ? `${inv.discount}%` : "—"}
                </td>
                <td className="p-3 font-semibold">
                  ₹{inv.amount.toLocaleString()}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-white text-sm ${
                      inv.status === "Paid"
                        ? "bg-green-600"
                        : inv.status === "Pending"
                        ? "bg-yellow-500"
                        : "bg-red-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="p-3">{inv.date}</td>
                <td className="p-3 space-y-2 flex flex-col">
                  {inv.status !== "Paid" && (
                    <button
                      onClick={() => handleMarkPaid(inv.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                    >
                      Mark Paid
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInvoice(inv.id)}
                    className="w-full border border-red-600 text-red-700 hover:bg-red-600 hover:text-white px-3 py-1 rounded transition"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="bg-white p-4 rounded-xl shadow-lg border border-red-200 space-y-2"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">{inv.org}</h3>
              <span
                className={`px-2 py-1 rounded text-white text-sm ${
                  inv.status === "Paid"
                    ? "bg-green-600"
                    : inv.status === "Pending"
                    ? "bg-yellow-500"
                    : "bg-red-600"
                }`}
              >
                {inv.status}
              </span>
            </div>
            <p>
              <span className="font-semibold">Invoice ID:</span> {inv.id}
            </p>
            <p>
              <span className="font-semibold">Referral:</span>{" "}
              {inv.referral || "None"}
            </p>
            <p>
              <span className="font-semibold">Discount:</span>{" "}
              {inv.discount ? `${inv.discount}%` : "—"}
            </p>
            <p>
              <span className="font-semibold">Final Amount:</span> ₹
              {inv.amount.toLocaleString()}
            </p>
            <p>
              <span className="font-semibold">Date:</span> {inv.date}
            </p>
            <div className="flex gap-2 mt-2">
              {inv.status !== "Paid" && (
                <button
                  onClick={() => handleMarkPaid(inv.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                >
                  Mark Paid
                </button>
              )}
              <button
                onClick={() => setSelectedInvoice(inv.id)}
                className="flex-1 border border-red-600 text-red-700 hover:bg-red-600 hover:text-white px-3 py-1 rounded transition"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:p-0">
          <div className="bg-white w-full max-w-md p-5 md:p-6 rounded-xl shadow-xl space-y-5 border border-red-300">
            <h2 className="text-xl md:text-2xl font-bold text-red-700">
              Edit Invoice – {selectedInvoice}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-black">
                  Add Referral
                </label>
                <input
                  value={referralName}
                  onChange={(e) => setReferralName(e.target.value)}
                  className="w-full mt-1 p-2 border border-black/20 rounded"
                  placeholder="Referred by"
                />
                <button
                  onClick={() => handleAddReferral(selectedInvoice)}
                  className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                >
                  Save Referral
                </button>
              </div>

              <div>
                <label className="text-sm font-semibold text-black">
                  Discount (%)
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full mt-1 p-2 border border-black/20 rounded"
                  placeholder="Enter discount"
                />
                <button
                  onClick={() => handleApplyDiscount(selectedInvoice)}
                  className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
                >
                  Apply Discount
                </button>
              </div>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-full bg-gray-300 hover:bg-gray-400 text-black py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
