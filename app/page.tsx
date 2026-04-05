
'use client';
import { useState } from 'react';

export default function Home() {
  // Feature 1 - Fraud Score
  const [fraudForm, setFraudForm] = useState({
    name: '', aadhaar_last4: '', relationship: '', policy_number: '',
    claim_amount: '', days_since_death: '', previous_claims: '',
    documents_submitted: [] as string[]
  });
  const [fraudResult, setFraudResult] = useState<any>(null);
  const [fraudLoading, setFraudLoading] = useState(false);

  // Feature 2 - Duplicate Check
  const [dupForm, setDupForm] = useState({ name: '', aadhaar_last4: '' });
  const [dupResult, setDupResult] = useState<any>(null);
  const [dupLoading, setDupLoading] = useState(false);

  const existingRecords = [
    { id: 1, name: 'Priya Sharma', aadhaar_last4: '4521' },
    { id: 2, name: 'Rahul Verma', aadhaar_last4: '7823' },
    { id: 3, name: 'Sita Devi', aadhaar_last4: '3341' },
    { id: 4, name: 'Mohammed Ali', aadhaar_last4: '9012' },
    { id: 5, name: 'Priya Sharmaa', aadhaar_last4: '4521' },
  ];

  // Feature 3 - Eligibility
  const [eligForm, setEligForm] = useState({
    name: '', age: '', gender: 'female', annual_income: '', occupation: '',
    has_land: 'no', has_lpg: 'no', has_bank_account: 'yes', has_aadhaar: 'yes'
  });
  const [eligResult, setEligResult] = useState<any>(null);
  const [eligLoading, setEligLoading] = useState(false);

  // Feature 4 - Rejection Letter
  const [rejForm, setRejForm] = useState({
    name: '', policy_number: '', claim_amount: '', language: 'English',
    red_flags: [] as string[]
  });
  const [rejResult, setRejResult] = useState<any>(null);
  const [rejLoading, setRejLoading] = useState(false);

  const getRiskColor = (level: string) => {
    if (level === 'LOW') return '#1D9E75';
    if (level === 'MEDIUM') return '#BA7517';
    return '#E24B4A';
  };

  const toggleDoc = (doc: string) => {
    setFraudForm(f => ({
      ...f,
      documents_submitted: f.documents_submitted.includes(doc)
        ? f.documents_submitted.filter(d => d !== doc)
        : [...f.documents_submitted, doc]
    }));
  };

  const toggleFlag = (flag: string) => {
    setRejForm(f => ({
      ...f,
      red_flags: f.red_flags.includes(flag)
        ? f.red_flags.filter(d => d !== flag)
        : [...f.red_flags, flag]
    }));
  };

  async function runFraudCheck() {
    setFraudLoading(true);
    try {
      const res = await fetch('/api/fraud-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fraudForm, claim_amount: Number(fraudForm.claim_amount), days_since_death: Number(fraudForm.days_since_death), previous_claims: Number(fraudForm.previous_claims) })
      });
      setFraudResult(await res.json());
    } catch (e) { console.error(e); }
    setFraudLoading(false);
  }

  async function runDupCheck() {
    setDupLoading(true);
    try {
      const res = await fetch('/api/duplicate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newApplicant: dupForm, existingRecords })
      });
      setDupResult(await res.json());
    } catch (e) { console.error(e); }
    setDupLoading(false);
  }

  async function runEligCheck() {
    setEligLoading(true);
    try {
      const res = await fetch('/api/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eligForm, age: Number(eligForm.age), annual_income: Number(eligForm.annual_income) })
      });
      setEligResult(await res.json());
    } catch (e) { console.error(e); }
    setEligLoading(false);
  }

  async function runRejection() {
    setRejLoading(true);
    try {
      const res = await fetch('/api/rejection-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: { name: rejForm.name, policy_number: rejForm.policy_number, claim_amount: rejForm.claim_amount }, red_flags: rejForm.red_flags, language: rejForm.language })
      });
      setRejResult(await res.json());
    } catch (e) { console.error(e); }
    setRejLoading(false);
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: '14px', marginTop: '4px' };
  const labelStyle = { fontSize: '13px', color: '#94a3b8', display: 'block' as const, marginBottom: '2px' };
  const sectionStyle = { background: '#1e293b', borderRadius: '12px', padding: '28px', marginBottom: '24px' };
  const btnStyle = { background: '#7F77DD', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', marginTop: '16px', width: '100%' };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '32px' }}>
        <span style={{ fontWeight: '700', fontSize: '18px', color: '#7F77DD' }}>BenefAI</span>
        {['fraud', 'duplicate', 'eligibility', 'rejection'].map(s => (
          <a key={s} href={`#${s}`} style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none', textTransform: 'capitalize' }}>{s}</a>
        ))}
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>BenefAI Dashboard</h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px' }}>AI-powered beneficiary identification for GIA India</p>

        {/* FEATURE 1 - FRAUD SCORE */}
        <div id="fraud" style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#7F77DD' }}>Fraud Risk Score</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Analyse a claim for fraud signals</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[['name', 'Full Name'], ['aadhaar_last4', 'Aadhaar Last 4'], ['relationship', 'Relationship'], ['policy_number', 'Policy Number'], ['claim_amount', 'Claim Amount (INR)'], ['days_since_death', 'Days Since Death'], ['previous_claims', 'Previous Claims']].map(([key, label]) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input style={inputStyle} value={(fraudForm as any)[key]} onChange={e => setFraudForm(f => ({ ...f, [key]: e.target.value }))} placeholder={label} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={labelStyle}>Documents Submitted</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const, marginTop: '8px' }}>
              {['death_certificate', 'aadhaar', 'pan', 'bank_statement'].map(doc => (
                <label key={doc} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8', cursor: 'pointer' }}>
                  <input type="checkbox" checked={fraudForm.documents_submitted.includes(doc)} onChange={() => toggleDoc(doc)} />
                  {doc.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>
          <button style={btnStyle} onClick={runFraudCheck} disabled={fraudLoading}>
            {fraudLoading ? 'Analysing...' : 'Run Fraud Check'}
          </button>
          {fraudResult && (
            <div style={{ marginTop: '20px', background: '#0f172a', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '52px', fontWeight: '700', color: getRiskColor(fraudResult.risk_level) }}>{fraudResult.score}</div>
                <div>
                  <span style={{ background: getRiskColor(fraudResult.risk_level), color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>{fraudResult.risk_level}</span>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginTop: '6px' }}>{fraudResult.decision}</div>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>{fraudResult.reasoning}</p>
              {fraudResult.red_flags?.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Red Flags</div>
                  {fraudResult.red_flags.map((f: string, i: number) => (
                    <div key={i} style={{ fontSize: '13px', color: '#E24B4A', background: '#2d1515', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px' }}>⚠ {f}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FEATURE 2 - DUPLICATE CHECK */}
        <div id="duplicate" style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#7F77DD' }}>Duplicate Detection</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Check if applicant already exists in the system</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Applicant Name</label>
              <input style={inputStyle} value={dupForm.name} onChange={e => setDupForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div>
              <label style={labelStyle}>Aadhaar Last 4</label>
              <input style={inputStyle} value={dupForm.aadhaar_last4} onChange={e => setDupForm(f => ({ ...f, aadhaar_last4: e.target.value }))} placeholder="4 digits" />
            </div>
          </div>
          <button style={btnStyle} onClick={runDupCheck} disabled={dupLoading}>
            {dupLoading ? 'Checking...' : 'Check Duplicate'}
          </button>
          {dupResult && (
            <div style={{ marginTop: '20px', background: '#0f172a', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: dupResult.is_duplicate ? '#E24B4A' : '#1D9E75', marginBottom: '12px' }}>
                {dupResult.is_duplicate ? '⚠ Duplicate Detected' : '✓ No Duplicate Found'}
              </div>
              {dupResult.matches?.map((m: any, i: number) => (
                <div key={i} style={{ background: '#1e293b', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>Record #{m.id} — <span style={{ color: m.confidence === 'HIGH' ? '#E24B4A' : '#BA7517' }}>{m.confidence} confidence</span></div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{m.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FEATURE 3 - ELIGIBILITY */}
        <div id="eligibility" style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#7F77DD' }}>Scheme Eligibility</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Check which government schemes the applicant qualifies for</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[['name', 'Full Name'], ['age', 'Age'], ['annual_income', 'Annual Income (INR)'], ['occupation', 'Occupation']].map(([key, label]) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input style={inputStyle} value={(eligForm as any)[key]} onChange={e => setEligForm(f => ({ ...f, [key]: e.target.value }))} placeholder={label} />
              </div>
            ))}
            {[['gender', 'Gender', ['male', 'female', 'other']], ['has_land', 'Owns Land', ['yes', 'no']], ['has_lpg', 'Has LPG Connection', ['yes', 'no']], ['has_bank_account', 'Has Bank Account', ['yes', 'no']], ['has_aadhaar', 'Has Aadhaar', ['yes', 'no']]].map(([key, label, opts]) => (
              <div key={key as string}>
                <label style={labelStyle}>{label as string}</label>
                <select style={inputStyle} value={(eligForm as any)[key as string]} onChange={e => setEligForm(f => ({ ...f, [key as string]: e.target.value }))}>
                  {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button style={btnStyle} onClick={runEligCheck} disabled={eligLoading}>
            {eligLoading ? 'Checking...' : 'Check Eligibility'}
          </button>
          {eligResult && (
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {eligResult.eligible_schemes?.map((s: any, i: number) => (
                <div key={i} style={{ background: s.eligible ? '#0d2b1f' : '#1e293b', border: `1px solid ${s.eligible ? '#1D9E75' : '#334155'}`, borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>{s.scheme_name}</div>
                  <div style={{ fontSize: '12px', color: s.eligible ? '#1D9E75' : '#64748b', marginBottom: '6px' }}>{s.eligible ? '✓ Eligible' : '✗ Not eligible'}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{s.reason}</div>
                  {s.eligible && <div style={{ fontSize: '12px', color: '#7F77DD' }}>{s.benefit}</div>}
                </div>
              ))}
              {eligResult.recommended_action && (
                <div style={{ gridColumn: '1 / -1', background: '#0f172a', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#94a3b8' }}>
                  <strong style={{ color: 'white' }}>Recommended action: </strong>{eligResult.recommended_action}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FEATURE 4 - REJECTION LETTER */}
        <div id="rejection" style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#7F77DD' }}>Rejection Letter Generator</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Generate an explainable rejection with appeal steps</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Claimant Name</label>
              <input style={inputStyle} value={rejForm.name} onChange={e => setRejForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div>
              <label style={labelStyle}>Policy Number</label>
              <input style={inputStyle} value={rejForm.policy_number} onChange={e => setRejForm(f => ({ ...f, policy_number: e.target.value }))} placeholder="Policy number" />
            </div>
            <div>
              <label style={labelStyle}>Claim Amount (INR)</label>
              <input style={inputStyle} value={rejForm.claim_amount} onChange={e => setRejForm(f => ({ ...f, claim_amount: e.target.value }))} placeholder="Amount" />
            </div>
            <div>
              <label style={labelStyle}>Language</label>
              <select style={inputStyle} value={rejForm.language} onChange={e => setRejForm(f => ({ ...f, language: e.target.value }))}>
                {['English', 'Hindi', 'Kannada'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={labelStyle}>Red Flags</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const, marginTop: '8px' }}>
              {['High claim amount', 'Filed within 7 days of death', 'Missing documents'].map(flag => (
                <label key={flag} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8', cursor: 'pointer' }}>
                  <input type="checkbox" checked={rejForm.red_flags.includes(flag)} onChange={() => toggleFlag(flag)} />
                  {flag}
                </label>
              ))}
            </div>
          </div>
          <button style={btnStyle} onClick={runRejection} disabled={rejLoading}>
            {rejLoading ? 'Generating...' : 'Generate Rejection Letter'}
          </button>
          {rejResult && (
            <div style={{ marginTop: '20px', background: '#0f172a', borderRadius: '10px', padding: '20px' }}>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', marginBottom: '16px', fontSize: '14px', lineHeight: '1.7', color: '#e2e8f0', whiteSpace: 'pre-wrap' as const }}>
                {rejResult.rejection_letter}
              </div>
              {rejResult.documents_needed?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Documents Needed</div>
                  {rejResult.documents_needed.map((d: string, i: number) => (
                    <div key={i} style={{ fontSize: '13px', color: '#94a3b8', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>• {d}</div>
                  ))}
                </div>
              )}
              {rejResult.appeal_steps?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Appeal Steps</div>
                  {rejResult.appeal_steps.map((s: string, i: number) => (
                    <div key={i} style={{ fontSize: '13px', color: '#94a3b8', padding: '6px 0' }}>{i + 1}. {s}</div>
                  ))}
                </div>
              )}
              <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', background: rejResult.reapply_eligible ? '#0d2b1f' : '#2d1515', color: rejResult.reapply_eligible ? '#1D9E75' : '#E24B4A' }}>
                {rejResult.reapply_eligible ? '✓ Eligible to reapply' : '✗ Not eligible to reapply'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
