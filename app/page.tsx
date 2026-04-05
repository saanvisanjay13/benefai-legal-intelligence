'use client';

import { useState, FormEvent } from 'react';

type FraudResult = {
  score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  decision: 'AUTO_APPROVE' | 'HUMAN_REVIEW' | 'REJECT';
  reasoning: string;
  red_flags: string[];
};

type FormState = {
  name: string;
  aadhaar_last4: string;
  relationship: string;
  policy_number: string;
  claim_amount: string;
  days_since_death: string;
  documents_submitted: string;
  previous_claims: string;
};

type ExistingRecord = {
  id: string;
  name: string;
  aadhaar_last4: string;
  policy_number: string;
};

type DupMatch = {
  id: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
};

type DuplicateResult = {
  is_duplicate: boolean;
  matches: DupMatch[];
};

type EligibilityFormState = {
  name: string;
  age: string;
  gender: string;
  annual_income: string;
  occupation: string;
  has_land: boolean;
  has_lpg: boolean;
  has_bank_account: boolean;
  has_aadhaar: boolean;
};

type EligibleSchemeRow = {
  scheme_name: string;
  eligible: boolean;
  reason: string;
  benefit: string;
};

type EligibilityResult = {
  eligible_schemes: EligibleSchemeRow[];
  recommended_action: string;
};

type RejectionLanguage = 'English' | 'Hindi' | 'Kannada';

type RejectionResult = {
  rejection_letter: string;
  documents_needed: string[];
  appeal_steps: string[];
  reapply_eligible: boolean;
  officer_summary: string;
};

const REJECTION_RED_FLAG_OPTIONS: { id: string; text: string }[] = [
  {
    id: 'rf1',
    text: 'Claim filed within 7 days of policyholder death — additional verification required',
  },
  {
    id: 'rf2',
    text: 'Death certificate missing, illegible, or not registered',
  },
  {
    id: 'rf3',
    text: 'Bank account / nominee details do not match submitted records',
  },
];

const emptyForm: FormState = {
  name: '',
  aadhaar_last4: '',
  relationship: '',
  policy_number: '',
  claim_amount: '',
  days_since_death: '',
  documents_submitted: '',
  previous_claims: '0',
};

/** Demo dataset for duplicate check (frontend only) */
const DEMO_EXISTING_RECORDS: ExistingRecord[] = [
  { id: 'REC-001', name: 'Priya Sharma', aadhaar_last4: '4521', policy_number: 'GIA-2021-88321' },
  { id: 'REC-002', name: 'Ramesh Kumar', aadhaar_last4: '7812', policy_number: 'GIA-2020-11203' },
  { id: 'REC-003', name: 'Ananya Iyer', aadhaar_last4: '3390', policy_number: 'GIA-2022-44102' },
  { id: 'REC-004', name: 'Vikram Singh Chauhan', aadhaar_last4: '1022', policy_number: 'GIA-2019-22001' },
  { id: 'REC-005', name: 'Deepa Nair', aadhaar_last4: '6677', policy_number: 'GIA-2023-99001' },
];

/** Policy used when only name + Aadhaar are entered (matches REC-001 for demo collisions) */
const DEMO_DUP_POLICY = 'GIA-2021-88321';

function riskScoreClass(level: FraudResult['risk_level'] | undefined) {
  if (level === 'LOW') return 'text-emerald-600';
  if (level === 'MEDIUM') return 'text-amber-500';
  return 'text-red-600';
}

function riskBadgeClass(level: FraudResult['risk_level'] | undefined) {
  if (level === 'LOW') return 'bg-emerald-600 text-white';
  if (level === 'MEDIUM') return 'bg-amber-500 text-white';
  return 'bg-red-600 text-white';
}

function dupConfidenceBadgeClass(c: DupMatch['confidence']) {
  if (c === 'HIGH') return 'bg-red-600 text-white';
  return 'bg-amber-500 text-white';
}

export default function Home() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [result, setResult] = useState<FraudResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [dupName, setDupName] = useState('');
  const [dupAadhaar, setDupAadhaar] = useState('');
  const [dupResult, setDupResult] = useState<DuplicateResult | null>(null);
  const [dupError, setDupError] = useState<string | null>(null);
  const [dupLoading, setDupLoading] = useState(false);

  const [eligForm, setEligForm] = useState<EligibilityFormState>({
    name: '',
    age: '',
    gender: '',
    annual_income: '',
    occupation: '',
    has_land: false,
    has_lpg: false,
    has_bank_account: false,
    has_aadhaar: false,
  });
  const [eligResult, setEligResult] = useState<EligibilityResult | null>(null);
  const [eligError, setEligError] = useState<string | null>(null);
  const [eligLoading, setEligLoading] = useState(false);

  const [rejClaimName, setRejClaimName] = useState('');
  const [rejPolicyNumber, setRejPolicyNumber] = useState('');
  const [rejClaimAmount, setRejClaimAmount] = useState('');
  const [rejLanguage, setRejLanguage] = useState<RejectionLanguage>('English');
  const [rejFlagIds, setRejFlagIds] = useState<Record<string, boolean>>({
    rf1: false,
    rf2: false,
    rf3: false,
  });
  const [rejResult, setRejResult] = useState<RejectionResult | null>(null);
  const [rejError, setRejError] = useState<string | null>(null);
  const [rejLoading, setRejLoading] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const documents_submitted = form.documents_submitted
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name,
      aadhaar_last4: form.aadhaar_last4,
      relationship: form.relationship,
      policy_number: form.policy_number,
      claim_amount: Number(form.claim_amount) || 0,
      days_since_death: Number(form.days_since_death) || 0,
      documents_submitted,
      previous_claims: Number(form.previous_claims) || 0,
    };

    try {
      const res = await fetch('/api/fraud-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Request failed');
        return;
      }
      if (data.error && !data.score) {
        setError(typeof data.error === 'string' ? data.error : 'Request failed');
        return;
      }
      setResult(data as FraudResult);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function runDuplicateCheck() {
    setDupError(null);
    setDupResult(null);
    setDupLoading(true);

    const payload = {
      newApplicant: {
        name: dupName.trim(),
        aadhaar_last4: dupAadhaar.replace(/\D/g, '').slice(0, 4),
        policy_number: DEMO_DUP_POLICY,
      },
      existingRecords: DEMO_EXISTING_RECORDS,
    };

    try {
      const res = await fetch('/api/duplicate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setDupError(typeof data.error === 'string' ? data.error : 'Request failed');
        return;
      }
      if (data.error && data.is_duplicate === undefined) {
        setDupError(typeof data.error === 'string' ? data.error : 'Request failed');
        return;
      }
      setDupResult(data as DuplicateResult);
    } catch {
      setDupError('Network error. Try again.');
    } finally {
      setDupLoading(false);
    }
  }

  async function handleEligibilitySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEligError(null);
    setEligResult(null);
    setEligLoading(true);

    const payload = {
      name: eligForm.name.trim(),
      age: Number(eligForm.age) || 0,
      gender: eligForm.gender,
      annual_income: Number(eligForm.annual_income) || 0,
      occupation: eligForm.occupation.trim(),
      has_land: eligForm.has_land,
      has_lpg: eligForm.has_lpg,
      has_bank_account: eligForm.has_bank_account,
      has_aadhaar: eligForm.has_aadhaar,
    };

    try {
      const res = await fetch('/api/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setEligError(typeof data.error === 'string' ? data.error : 'Request failed');
        return;
      }
      if (data.error && !data.eligible_schemes) {
        setEligError(typeof data.error === 'string' ? data.error : 'Request failed');
        return;
      }
      setEligResult(data as EligibilityResult);
    } catch {
      setEligError('Network error. Try again.');
    } finally {
      setEligLoading(false);
    }
  }

  async function handleRejectionSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRejError(null);
    setRejResult(null);
    setRejLoading(true);

    const red_flags = REJECTION_RED_FLAG_OPTIONS.filter((o) => rejFlagIds[o.id]).map((o) => o.text);

    const payload = {
      claim: {
        name: rejClaimName.trim(),
        policy_number: rejPolicyNumber.trim(),
        claim_amount: Number(rejClaimAmount) || 0,
      },
      red_flags,
      language: rejLanguage,
    };

    try {
      const res = await fetch('/api/rejection-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setRejError(typeof data.error === 'string' ? data.error : 'Request failed');
        return;
      }
      if (data.error && data.rejection_letter === undefined) {
        setRejError(typeof data.error === 'string' ? data.error : 'Request failed');
        return;
      }
      setRejResult(data as RejectionResult);
    } catch {
      setRejError('Network error. Try again.');
    } finally {
      setRejLoading(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100';

  const labelClass = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300';

  const dupDisabled =
    dupLoading || dupName.trim().length === 0 || dupAadhaar.replace(/\D/g, '').length !== 4;

  const checkboxClass =
    'h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500 dark:border-zinc-600';

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 font-sans">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        BenefAI — Fraud score
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Enter applicant details to run GIA India fraud detection.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            required
            className={inputClass}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="aadhaar_last4" className={labelClass}>
            Aadhaar (last 4 digits)
          </label>
          <input
            id="aadhaar_last4"
            required
            maxLength={4}
            pattern="\d{4}"
            inputMode="numeric"
            className={inputClass}
            value={form.aadhaar_last4}
            onChange={(e) => update('aadhaar_last4', e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </div>
        <div>
          <label htmlFor="relationship" className={labelClass}>
            Relationship to policyholder
          </label>
          <input
            id="relationship"
            required
            className={inputClass}
            value={form.relationship}
            onChange={(e) => update('relationship', e.target.value)}
            placeholder="e.g. spouse, son"
          />
        </div>
        <div>
          <label htmlFor="policy_number" className={labelClass}>
            Policy number
          </label>
          <input
            id="policy_number"
            required
            className={inputClass}
            value={form.policy_number}
            onChange={(e) => update('policy_number', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="claim_amount" className={labelClass}>
            Claim amount (INR)
          </label>
          <input
            id="claim_amount"
            required
            type="number"
            min={0}
            step="1"
            className={inputClass}
            value={form.claim_amount}
            onChange={(e) => update('claim_amount', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="days_since_death" className={labelClass}>
            Days since policyholder death
          </label>
          <input
            id="days_since_death"
            required
            type="number"
            min={0}
            step="1"
            className={inputClass}
            value={form.days_since_death}
            onChange={(e) => update('days_since_death', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="documents_submitted" className={labelClass}>
            Documents submitted (comma-separated)
          </label>
          <textarea
            id="documents_submitted"
            rows={3}
            className={`${inputClass} resize-y`}
            value={form.documents_submitted}
            onChange={(e) => update('documents_submitted', e.target.value)}
            placeholder="death_certificate, bank_statement, id_proof"
          />
        </div>
        <div>
          <label htmlFor="previous_claims" className={labelClass}>
            Previous claims (count)
          </label>
          <input
            id="previous_claims"
            required
            type="number"
            min={0}
            step="1"
            className={inputClass}
            value={form.previous_claims}
            onChange={(e) => update('previous_claims', e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Analysing…' : 'Run fraud check'}
        </button>
      </form>

      {error && (
        <div
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className={`text-5xl font-semibold tabular-nums ${riskScoreClass(result.risk_level)}`}
            >
              {result.score}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <span
                className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide ${riskBadgeClass(result.risk_level)}`}
              >
                {result.risk_level}
              </span>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {result.decision.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {result.reasoning}
          </p>
          {Array.isArray(result.red_flags) && result.red_flags.length > 0 && (
            <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                Red flags
              </p>
              <ul className="mt-2 space-y-2">
                {result.red_flags.map((flag, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
                  >
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <section className="mt-16 border-t border-zinc-200 pt-12 dark:border-zinc-800">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Duplicate detection
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Compare a new applicant against five sample records (demo). Policy for the new applicant is fixed to{' '}
          <span className="font-mono text-zinc-700 dark:text-zinc-300">{DEMO_DUP_POLICY}</span> for this demo.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="dup_name" className={labelClass}>
              New applicant name
            </label>
            <input
              id="dup_name"
              className={inputClass}
              value={dupName}
              onChange={(e) => setDupName(e.target.value)}
              placeholder="e.g. Priya Sarma"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="dup_aadhaar" className={labelClass}>
              Aadhaar (last 4 digits)
            </label>
            <input
              id="dup_aadhaar"
              maxLength={4}
              inputMode="numeric"
              className={inputClass}
              value={dupAadhaar}
              onChange={(e) => setDupAadhaar(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4521"
            />
          </div>

          <button
            type="button"
            onClick={runDuplicateCheck}
            disabled={dupDisabled}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {dupLoading ? 'Checking…' : 'Run duplicate check'}
          </button>
        </div>

        {dupError && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {dupError}
          </div>
        )}

        {dupResult && (
          <div
            className={`mt-6 rounded-2xl border p-6 shadow-sm ${
              dupResult.is_duplicate
                ? 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30'
                : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30'
            }`}
          >
            <p
              className={`text-lg font-semibold ${
                dupResult.is_duplicate ? 'text-red-800 dark:text-red-200' : 'text-emerald-800 dark:text-emerald-200'
              }`}
            >
              {dupResult.is_duplicate ? 'Duplicate detected' : 'No duplicate found'}
            </p>

            {dupResult.is_duplicate && dupResult.matches.length > 0 && (
              <ul className="mt-4 space-y-3">
                {dupResult.matches.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-xl border border-red-200/80 bg-white p-4 dark:border-red-900/40 dark:bg-zinc-900/80"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {m.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${dupConfidenceBadgeClass(
                          m.confidence
                        )}`}
                      >
                        {m.confidence}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{m.reason}</p>
                  </li>
                ))}
              </ul>
            )}

            {!dupResult.is_duplicate && (
              <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/90">
                No medium- or high-confidence match to the sample records.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="mt-16 border-t border-zinc-200 pt-12 dark:border-zinc-800">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Scheme eligibility
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          PM-KISAN, PMUY, PMJJBY, and PMSBY — rules applied via AI from your inputs.
        </p>

        <form onSubmit={handleEligibilitySubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="elig_name" className={labelClass}>
                Name
              </label>
              <input
                id="elig_name"
                required
                className={inputClass}
                value={eligForm.name}
                onChange={(e) => setEligForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="elig_age" className={labelClass}>
                Age
              </label>
              <input
                id="elig_age"
                required
                type="number"
                min={0}
                max={120}
                className={inputClass}
                value={eligForm.age}
                onChange={(e) => setEligForm((f) => ({ ...f, age: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="elig_gender" className={labelClass}>
                Gender
              </label>
              <select
                id="elig_gender"
                required
                className={inputClass}
                value={eligForm.gender}
                onChange={(e) => setEligForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="elig_income" className={labelClass}>
                Annual income (INR)
              </label>
              <input
                id="elig_income"
                required
                type="number"
                min={0}
                step="1"
                className={inputClass}
                value={eligForm.annual_income}
                onChange={(e) => setEligForm((f) => ({ ...f, annual_income: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="elig_occupation" className={labelClass}>
                Occupation
              </label>
              <input
                id="elig_occupation"
                required
                className={inputClass}
                value={eligForm.occupation}
                onChange={(e) => setEligForm((f) => ({ ...f, occupation: e.target.value }))}
                placeholder="e.g. farmer, private job, homemaker"
              />
            </div>
          </div>

          <fieldset className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <legend className="px-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Applicant flags
            </legend>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-800 dark:text-zinc-200">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={eligForm.has_land}
                onChange={(e) => setEligForm((f) => ({ ...f, has_land: e.target.checked }))}
              />
              Has agricultural land
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-800 dark:text-zinc-200">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={eligForm.has_lpg}
                onChange={(e) => setEligForm((f) => ({ ...f, has_lpg: e.target.checked }))}
              />
              Has existing LPG connection
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-800 dark:text-zinc-200">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={eligForm.has_bank_account}
                onChange={(e) => setEligForm((f) => ({ ...f, has_bank_account: e.target.checked }))}
              />
              Has bank account
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-800 dark:text-zinc-200">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={eligForm.has_aadhaar}
                onChange={(e) => setEligForm((f) => ({ ...f, has_aadhaar: e.target.checked }))}
              />
              Has Aadhaar
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={eligLoading}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {eligLoading ? 'Checking eligibility…' : 'Check eligibility'}
          </button>
        </form>

        {eligError && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {eligError}
          </div>
        )}

        {eligResult && Array.isArray(eligResult.eligible_schemes) && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {eligResult.eligible_schemes.map((row) => (
                <div
                  key={row.scheme_name}
                  className={`rounded-2xl border p-5 shadow-sm ${
                    row.eligible
                      ? 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-800 dark:bg-emerald-950/40'
                      : 'border-zinc-200 bg-zinc-100/80 dark:border-zinc-700 dark:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{row.scheme_name}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.eligible
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-400 text-white dark:bg-zinc-600'
                      }`}
                    >
                      {row.eligible ? 'Eligible' : 'Not eligible'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{row.reason}</p>
                  <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Benefit: <span className="font-normal text-zinc-600 dark:text-zinc-400">{row.benefit}</span>
                  </p>
                </div>
              ))}
            </div>
            {eligResult.recommended_action && (
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Recommended action: </span>
                {eligResult.recommended_action}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-16 border-t border-zinc-200 pt-12 dark:border-zinc-800">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Rejection letter (draft)
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Generate a compassionate GIA-style letter from claim details and selected issues.
        </p>

        <form onSubmit={handleRejectionSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="rej_name" className={labelClass}>
                Claimant name
              </label>
              <input
                id="rej_name"
                required
                className={inputClass}
                value={rejClaimName}
                onChange={(e) => setRejClaimName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="rej_policy" className={labelClass}>
                Policy number
              </label>
              <input
                id="rej_policy"
                required
                className={inputClass}
                value={rejPolicyNumber}
                onChange={(e) => setRejPolicyNumber(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="rej_amount" className={labelClass}>
                Claim amount (INR)
              </label>
              <input
                id="rej_amount"
                required
                type="number"
                min={0}
                step="1"
                className={inputClass}
                value={rejClaimAmount}
                onChange={(e) => setRejClaimAmount(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rej_language" className={labelClass}>
                Language
              </label>
              <select
                id="rej_language"
                className={inputClass}
                value={rejLanguage}
                onChange={(e) => setRejLanguage(e.target.value as RejectionLanguage)}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Kannada">Kannada</option>
              </select>
            </div>
          </div>

          <fieldset className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <legend className="px-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Sample red flags (toggle any that apply)
            </legend>
            {REJECTION_RED_FLAG_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-start gap-3 text-sm text-zinc-800 dark:text-zinc-200"
              >
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={rejFlagIds[opt.id] ?? false}
                  onChange={(e) =>
                    setRejFlagIds((prev) => ({ ...prev, [opt.id]: e.target.checked }))
                  }
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </fieldset>

          <button
            type="submit"
            disabled={rejLoading}
            className="w-full rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {rejLoading ? 'Generating letter…' : 'Generate rejection letter'}
          </button>
        </form>

        {rejError && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {rejError}
          </div>
        )}

        {rejResult && (
          <div className="mt-8 space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/50 shadow-md dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="border-b border-amber-200/80 bg-amber-100/80 px-4 py-2 dark:border-amber-800 dark:bg-amber-950/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                  Rejection letter
                </p>
              </div>
              <div
                lang={
                  rejLanguage === 'Hindi' ? 'hi' : rejLanguage === 'Kannada' ? 'kn' : 'en'
                }
                className="bg-[#fffef8] px-6 py-8 font-serif text-[15px] leading-relaxed text-zinc-900 shadow-inner dark:bg-zinc-900 dark:text-zinc-100"
              >
                {rejResult.rejection_letter.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="mb-4 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            </div>

            {Array.isArray(rejResult.documents_needed) && rejResult.documents_needed.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Documents needed</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                  {rejResult.documents_needed.map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(rejResult.appeal_steps) && rejResult.appeal_steps.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Appeal steps</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                  {rejResult.appeal_steps.map((step, i) => (
                    <li key={i} className="pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Reapply eligible:</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  rejResult.reapply_eligible
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-400 text-white dark:bg-zinc-600'
                }`}
              >
                {rejResult.reapply_eligible ? 'Yes' : 'No'}
              </span>
            </div>

            {rejResult.officer_summary && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Officer summary: </span>
                {rejResult.officer_summary}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
