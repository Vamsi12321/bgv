export default function ReportsPage() {
  const reports = [
    { id: 1, name: "Monthly Verification Report", date: "2025-10-01" },
    { id: 2, name: "Employee Joinings Report", date: "2025-09-15" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-black">Reports</h1>
      <ul className="space-y-3">
        {reports.map((r) => (
          <li key={r.id} className="bg-white p-4 rounded-lg shadow text-black">
            <p className="font-semibold">{r.name}</p>
            <p className="text-gray-500 text-sm">Generated on {r.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
