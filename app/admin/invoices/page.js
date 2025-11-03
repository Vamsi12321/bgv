export default function InvoicesPage() {
  const invoices = [
    { id: "INV001", amount: "₹12,000", date: "2025-09-28", status: "Paid" },
    { id: "INV002", amount: "₹8,500", date: "2025-09-20", status: "Pending" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-black">Invoices</h1>
      <table className="w-full border-collapse bg-white rounded-lg shadow text-black border-black">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">Invoice ID</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Date</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-t">
              <td className="p-3">{inv.id}</td>
              <td className="p-3">{inv.amount}</td>
              <td className="p-3">{inv.date}</td>
              <td
                className={`p-3 font-semibold ${
                  inv.status === "Paid" ? "text-green-600" : "text-yellow-600"
                }`}
              >
                {inv.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
