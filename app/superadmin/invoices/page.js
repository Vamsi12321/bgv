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
      discount: 10, // already discounted 10%
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
    console.log("Invoice", id, "marked as Paid");
  };

  const handleApplyDiscount = (id) => {
    if (discountValue === "" || isNaN(discountValue) || discountValue < 0) {
      alert("Please enter a valid discount percentage (0-100)");
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

    console.log(`Applied ${discountValue}% discount to Invoice ${id}`);
    setDiscountValue("");
    setSelectedInvoice(null);
  };

  const handleAddReferral = (id) => {
    if (!referralName.trim()) {
      alert("Please enter a referral name");
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, referral: referralName } : inv
      )
    );

    console.log(`Referral added for Invoice ${id}: ${referralName}`);
    setReferralName("");
    setSelectedInvoice(null);
  };

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold text-black">Invoices</h1>

      {/* 🔹 Invoice Table */}
      <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
        <table className="w-full border rounded-lg border-black">
          <thead className="bg-gray-200">
            <tr className="text-black">
              <th className="p-3">Invoice ID</th>
              <th className="p-3">Organization</th>
              <th className="p-3">Referral (if any)</th>
              <th className="p-3">Discount (%)</th>
              <th className="p-3">Final Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t text-black">
                <td className="p-3">{inv.id}</td>
                <td className="p-3 font-medium">{inv.org}</td>
                <td className="p-3">
                  {inv.referral ? (
                    <span className="text-green-700 font-medium">
                      {inv.referral}
                    </span>
                  ) : (
                    <em className="text-gray-500">None</em>
                  )}
                </td>
                <td className="p-3">
                  {inv.discount ? `${inv.discount}%` : "—"}
                </td>
                <td className="p-3">₹{inv.amount.toLocaleString()}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-white ${
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
                <td className="p-3 space-y-2">
                  {inv.status !== "Paid" && (
                    <button
                      onClick={() => handleMarkPaid(inv.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 w-full"
                    >
                      Mark Paid
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInvoice(inv.id)}
                    className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 w-full"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Edit Modal for Discount / Referral */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[400px] space-y-5">
            <h2 className="text-xl font-bold text-black">
              Update Invoice – {selectedInvoice}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Add Referral (if any)
                </label>
                <input
                  type="text"
                  value={referralName}
                  onChange={(e) => setReferralName(e.target.value)}
                  placeholder="e.g., Referred by John"
                  className="w-full mt-1 p-2 border border-gray-400 rounded"
                />
                <button
                  onClick={() => handleAddReferral(selectedInvoice)}
                  className="mt-2 w-full bg-green-600 text-white py-1.5 rounded hover:bg-green-700"
                >
                  Save Referral
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Apply Discount (%)
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="Enter discount in %"
                  className="w-full mt-1 p-2 border border-gray-400 rounded"
                />
                <button
                  onClick={() => handleApplyDiscount(selectedInvoice)}
                  className="mt-2 w-full bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700"
                >
                  Apply Discount
                </button>
              </div>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="mt-2 w-full bg-gray-400 text-black py-1.5 rounded hover:bg-gray-500"
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
