"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartData = [
  { day: "Mon", verifications: 124 },
  { day: "Tue", verifications: 156 },
  { day: "Wed", verifications: 189 },
  { day: "Thu", verifications: 142 },
  { day: "Fri", verifications: 203 },
  { day: "Sat", verifications: 87 },
  { day: "Sun", verifications: 65 },
];

const recentVerifications = [
  { id: 1, name: "Maria Johnson", decision: "Approved", score: 94, reason: "All documents verified, identity confirmed" },
  { id: 2, name: "Robert Chen", decision: "Flagged", score: 67, reason: "Address mismatch detected, requires manual review" },
  { id: 3, name: "Sarah Williams", decision: "Rejected", score: 23, reason: "Fraudulent documents detected, duplicate SSN" },
  { id: 4, name: "James Thompson", decision: "Approved", score: 89, reason: "Identity verified, income documentation valid" },
  { id: 5, name: "Emily Davis", decision: "Flagged", score: 58, reason: "Incomplete employment history, pending verification" },
  { id: 6, name: "Michael Brown", decision: "Approved", score: 91, reason: "All eligibility criteria met" },
];

const stats = [
  { label: "Total Verified", value: "12,847", change: "+12.5%" },
  { label: "Fraud Caught", value: "342", change: "-8.3%" },
  { label: "Flagged for Review", value: "1,284", change: "+3.2%" },
  { label: "Approved", value: "11,221", change: "+15.7%" },
];

function DecisionBadge({ decision }: { decision: string }) {
  const styles: any = {
    Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Flagged: "bg-amber-100 text-amber-800 border-amber-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[decision]}`}>
      {decision}
    </span>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-xl font-bold text-slate-900">BenefAI</span>
            <div className="flex items-center gap-8">
              <a href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">Home</a>
              <a href="/audit" className="text-sm font-medium text-slate-600 hover:text-slate-900">Audit Log</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Verification Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor beneficiary verification status and fraud detection metrics</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <span className={`text-xs font-medium ${stat.change.startsWith("+") ? "text-emerald-600" : "text-red-600"}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Verifications Per Day</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                  <Bar dataKey="verifications" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Verifications</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 pr-4">Name</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 pr-4">Decision</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 pr-4">Score</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentVerifications.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 text-sm font-medium text-slate-900">{v.name}</td>
                      <td className="py-3 pr-4"><DecisionBadge decision={v.decision} /></td>
                      <td className={`py-3 pr-4 text-sm font-semibold ${v.score >= 80 ? "text-emerald-600" : v.score >= 50 ? "text-amber-600" : "text-red-600"}`}>{v.score}</td>
                      <td className="py-3 text-sm text-slate-500">{v.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-slate-200">
          <p className="text-center text-sm text-slate-500">BenefAI Verification System © 2026. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}