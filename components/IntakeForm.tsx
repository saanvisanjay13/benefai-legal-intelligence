'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh"
]

const SCHEMES = ["PM-KISAN", "PM Awas Yojana", "Ujjwala Yojana", "Jan Dhan Yojana", "MGNREGA"]

export default function IntakeForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    aadhaar: '',
    annualIncome: '',
    district: '',
    schemeName: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [verificationResult, setVerificationResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('beneficiaries')
      .insert({
        full_name: formData.fullName,
        aadhaar: formData.aadhaar,
        annual_income: Number(formData.annualIncome),
        district: formData.district,
        scheme_name: formData.schemeName,
      })
      .select()
      .single()

    if (insertError) {
      setError('Submission failed: ' + insertError.message)
      setIsSubmitting(false)
      return
    }

    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: data.id,
        full_name: formData.fullName,
        aadhaar: formData.aadhaar,
        annual_income: formData.annualIncome,
        district: formData.district,
        scheme_name: formData.schemeName,
      })
    })

    const result = await res.json()

    if (result.error) {
      setError('AI verification failed: ' + result.error)
      setIsSubmitting(false)
      return
    }

    setVerificationResult(result)
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted && verificationResult) {
    return (
      <div className="text-center py-8">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
          verificationResult.risk_level === 'green' ? 'bg-emerald-100' :
          verificationResult.risk_level === 'yellow' ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          <span className="text-4xl">
            {verificationResult.risk_level === 'green' ? '✅' :
             verificationResult.risk_level === 'yellow' ? '⚠️' : '❌'}
          </span>
        </div>

        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${
          verificationResult.risk_level === 'green' ? 'bg-emerald-100 text-emerald-800' :
          verificationResult.risk_level === 'yellow' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
        }`}>
          {verificationResult.decision?.toUpperCase()}
        </div>

        <p className="text-5xl font-bold text-slate-900 mb-1">
          {verificationResult.score}
          <span className="text-xl font-normal text-slate-400">/100</span>
        </p>
        <p className="text-slate-500 text-sm mb-2">Fraud Risk Score</p>

        <div className="w-full bg-slate-100 rounded-full h-2 mb-6 mt-3">
          <div
            className={`h-2 rounded-full transition-all ${
              verificationResult.risk_level === 'green' ? 'bg-emerald-500' :
              verificationResult.risk_level === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${verificationResult.score}%` }}
          />
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">AI Reasoning</p>
          <p className="text-sm text-slate-700">{verificationResult.reason}</p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setIsSubmitted(false)
              setVerificationResult(null)
              setFormData({ fullName: '', aadhaar: '', annualIncome: '', district: '', schemeName: '' })
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Submit Another
          </button>
          <a href="/audit" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700">
            View Audit Log
          </a>
          <a href="/dashboard" className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
            Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Enter full name as per Aadhaar"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Aadhaar Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={12}
            placeholder="12-digit number"
            value={formData.aadhaar}
            onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '') })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Annual Income (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="0"
            placeholder="In rupees"
            value={formData.annualIncome}
            onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            State <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-slate-50"
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Scheme Name <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.schemeName}
            onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-slate-50"
          >
            <option value="">Select scheme</option>
            {SCHEMES.map(scheme => (
              <option key={scheme} value={scheme}>{scheme}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-blue-900 text-white rounded-xl text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors mt-2"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Verifying with AI...
          </span>
        ) : (
          'Submit for Verification →'
        )}
      </button>
    </form>
  )
}