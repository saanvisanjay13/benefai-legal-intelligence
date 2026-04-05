"use client";
import { useState } from "react";
import OCRUpload from "@/components/OCRUpload";
import BatchCSV from "@/components/BatchCSV";

export default function P3Test() {
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [satelliteResult, setSatelliteResult] = useState<any>(null);
  const [whatsappStatus, setWhatsappStatus] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", address: "", annualIncome: "",
    district: "", state: "", aadhaar: "", scheme: "PM-KISAN",
  });
  const [loading, setLoading] = useState("");

  function handleOCRData(data: any) {
    const income = data.annual_income || data.income || data.annualIncome || "";
    setForm((f) => ({
      ...f,
      name:         data.full_name      || data.name    || f.name,
      aadhaar:      data.aadhaar_number || data.aadhaar || f.aadhaar,
      annualIncome: income ? String(income).replace(/[^0-9]/g, "") : f.annualIncome,
      address:      data.address        || f.address,
      district:     data.district       || f.district,
      state:        data.state          || f.state,
    }));
  }

  async function runVerify() {
    setLoading("verify");
    const res = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setVerifyResult(await res.json());
    setLoading("");
  }

  async function runSatellite() {
    setLoading("satellite");
    const res = await fetch("/api/satellite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: form.address, annualIncome: form.annualIncome, name: form.name }) });
    setSatelliteResult(await res.json());
    setLoading("");
  }

  async function runWhatsapp() {
    if (!verifyResult) { alert("Run verify first"); return; }
    setLoading("whatsapp");
    const res = await fetch("/api/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: form.phone, name: form.name, decision: verifyResult.decision, fraudScore: verifyResult.fraudScore, reason: verifyResult.reason, scheme: form.scheme }) });
    const data = await res.json();
    setWhatsappStatus(data.success ? "✅ WhatsApp sent!" : "❌ Failed: " + data.error);
    setLoading("");
  }

  const label = "block text-sm font-medium text-gray-900 mb-1";
  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 mb-4";
  const btn = "px-4 py-2 rounded-lg text-sm font-medium transition";

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">BenefAI — AI Beneficiary Verification</h1>
      <p className="text-sm text-gray-500 mb-10">Enter applicant details to run GIA India fraud detection.</p>

      {/* DOCUMENT OCR */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Document OCR</h2>
        <p className="text-sm text-gray-500 mb-3">Upload Aadhaar or income certificate to auto-fill the form.</p>
        <OCRUpload onDataExtracted={handleOCRData} />
      </div>

      {/* APPLICANT DETAILS */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicant Details</h2>
        <label className={label}>Full Name</label>
        <input className={inp} placeholder="Ramesh Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <label className={label}>Aadhaar Number</label>
        <input className={inp} placeholder="1234 5678 9012" value={form.aadhaar} onChange={e => setForm(f => ({ ...f, aadhaar: e.target.value }))} />
        <label className={label}>Phone (enter manually for WhatsApp)</label>
        <input className={inp} placeholder="9008374682" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        <label className={label}>Address</label>
        <input className={inp} placeholder="14 MG Road, Pune" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        <label className={label}>Annual Income (INR)</label>
        <input className={inp} placeholder="38000" value={form.annualIncome} onChange={e => setForm(f => ({ ...f, annualIncome: e.target.value }))} />
        <label className={label}>District</label>
        <input className={inp} placeholder="Pune" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
        <label className={label}>State</label>
        <input className={inp} placeholder="Maharashtra" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
        <label className={label}>Scheme</label>
        <select className={inp} value={form.scheme} onChange={e => setForm(f => ({ ...f, scheme: e.target.value }))}>
          {["PM-KISAN","PM Awas Yojana","Ujjwala Yojana","Jan Dhan","MGNREGA"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* SATELLITE WEALTH CHECK */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Satellite Wealth Check</h2>
        <p className="text-sm text-gray-500 mb-3">Analyses applicant address against claimed income.</p>
        <button onClick={runSatellite} disabled={loading === "satellite"} className={`${btn} bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60`}>
          {loading === "satellite" ? "Analysing..." : "Run Satellite Check"}
        </button>
        {satelliteResult && (
          <div className="mt-4 space-y-3">
            <iframe src={satelliteResult.mapUrl} width="100%" height="300" className="rounded-lg border border-gray-200" />
            <div className="p-4 border border-gray-200 rounded-lg text-sm space-y-1">
              <p><span className="font-medium">Wealth Level:</span> {satelliteResult.wealthLevel}</p>
              <p><span className="font-medium">Consistent with income:</span> {satelliteResult.consistent ? "✅ Yes" : "❌ No"}</p>
              <p><span className="font-medium">AI Analysis:</span> {satelliteResult.note}</p>
            </div>
          </div>
        )}
      </div>

      {/* VERIFY & WHATSAPP */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Verify & WhatsApp Notification</h2>
        <p className="text-sm text-gray-500 mb-3">Run fraud detection and notify applicant via WhatsApp.</p>
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <button onClick={runVerify} disabled={loading === "verify"} className={`${btn} bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60`}>
            {loading === "verify" ? "Verifying..." : "1. Verify Applicant"}
          </button>
          {verifyResult && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${verifyResult.decision === "APPROVED" ? "bg-green-100 text-green-800" : verifyResult.decision === "REJECTED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
              {verifyResult.decision} — Fraud Score: {verifyResult.fraudScore}
            </span>
          )}
        </div>
        {verifyResult?.reason && <p className="text-xs text-gray-500 mb-3">Reason: {verifyResult.reason}</p>}
        {verifyResult && (
          <div>
            <button onClick={runWhatsapp} disabled={loading === "whatsapp"} className={`${btn} bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60`}>
              {loading === "whatsapp" ? "Sending..." : "2. Send WhatsApp Notification"}
            </button>
            {whatsappStatus && <p className="mt-2 text-sm font-medium">{whatsappStatus}</p>}
          </div>
        )}
      </div>

      {/* BATCH CSV */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Batch CSV Verification</h2>
        <p className="text-sm text-gray-500 mb-3">Upload CSV to score multiple applicants at once.</p>
        <BatchCSV />
      </div>
    </div>
  );
}