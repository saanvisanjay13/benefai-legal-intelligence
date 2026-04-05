'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
      setLogs(data || [])
      setLoading(false)
    }
    fetchLogs()
  }, [])

  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">Audit Trail</h1>
          <p className="text-gray-500 text-sm mt-1">Every verification logged and timestamped</p>
        </div>
        <div className="flex gap-3">
          <a href="/" className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">← Verify</a>
          <a href="/dashboard" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-700">Dashboard →</a>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-400 text-sm">No verifications yet.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Applicant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Decision</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.applicant_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.decision === 'approved' ? 'bg-green-100 text-green-700' :
                      log.decision === 'review' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {log.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.fraud_score}/100</td>
                  <td className="px-4 py-3 text-gray-500">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}