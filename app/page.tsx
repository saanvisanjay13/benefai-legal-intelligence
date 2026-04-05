'use client';
import { useState } from 'react';

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function testFraudScore() {
    setLoading(true);
    const res = await fetch('/api/fraud-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Sharma',
        aadhaar_last4: '4521',
        relationship: 'spouse',
        policy_number: 'GIA-2021-88321',
        claim_amount: 500000,
        days_since_death: 3,
        documents_submitted: ['death_certificate'],
        previous_claims: 0
      })
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  const getColor = (level) => {
    if (level === 'LOW') return '#1D9E75';
    if (level === 'MEDIUM') return '#BA7517';
    return '#E24B4A';
  };

  return (
    <main style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '8px' }}>BenefAI — Fraud Score</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>AI fraud detection for GIA beneficiary claims</p>

      <button
        onClick={testFraudScore}
        disabled={loading}
        style={{ background: '#7F77DD', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}
      >
        {loading ? 'Analysing...' : 'Run Fraud Check'}
      </button>

      {result && (
        <div style={{ marginTop: '32px', border: '1px solid #eee', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', fontWeight: '500', color: getColor(result.risk_level) }}>
              {result.score}
            </div>
            <div>
              <div style={{ background: getColor(result.risk_level), color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', marginBottom: '4px', display: 'inline-block' }}>
                {result.risk_level}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{result.decision}</div>
            </div>
          </div>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>{result.reasoning}</p>
          {result.red_flags.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Red flags</div>
              {result.red_flags.map((flag, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#E24B4A', padding: '6px 10px', background: '#fff0f0', borderRadius: '6px', marginBottom: '6px' }}>
                  ⚠ {flag}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}