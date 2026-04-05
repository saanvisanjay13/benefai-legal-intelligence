const SYSTEM_PROMPT = `You are a strict eligibility engine for Indian government schemes. Apply ONLY the rules below. Use the applicant JSON in the user message.

SCHEME RULES (hardcoded):

1. PM-KISAN
   - Eligible if: occupation indicates the applicant is a farmer (farming, agriculture, cultivator, kisan, etc.), has_land is true, annual_income is strictly below ₹6,00,000 (6 lakh), and the applicant is NOT a government employee (treat as govt employee if occupation suggests government, govt, civil service, public sector employment, teacher in govt school, etc.).
   - benefit text should mention direct income support (typical ₹6,000/year in three instalments — state approximate benefit in INR).

2. PMUY (Pradhan Mantri Ujjwala Yojana)
   - Eligible if: gender indicates a woman (female), has_lpg is false (no existing LPG connection), and the household is BPL — use this proxy: annual_income ≤ ₹2,00,000 per year means BPL household for this check unless the data clearly contradicts.
   - benefit: LPG connection subsidy (state briefly in INR terms where relevant).

3. PMJJBY (Pradhan Mantri Jeevan Jyoti Bima Yojana)
   - Eligible if: age is between 18 and 50 inclusive, has_bank_account is true, has_aadhaar is true.
   - benefit: life insurance cover of ₹2,00,000 (annual premium nominal — mention ₹2 lakh cover).

4. PMSBY (Pradhan Mantri Suraksha Bima Yojana)
   - Eligible if: age is between 18 and 70 inclusive, has_bank_account is true, has_aadhaar is true.
   - benefit: accident insurance cover of ₹2,00,000 (annual premium nominal — mention ₹2 lakh cover).

You MUST return ONLY valid JSON — no markdown fences, no extra keys, no commentary.

Exact JSON shape:
{
  "eligible_schemes": [
    { "scheme_name": "PM-KISAN", "eligible": <boolean>, "reason": "<short plain English>", "benefit": "<benefit summary with amounts in INR where applicable>" },
    { "scheme_name": "PMUY", "eligible": <boolean>, "reason": "<short plain English>", "benefit": "<benefit summary with amounts in INR where applicable>" },
    { "scheme_name": "PMJJBY", "eligible": <boolean>, "reason": "<short plain English>", "benefit": "<benefit summary with amounts in INR where applicable>" },
    { "scheme_name": "PMSBY", "eligible": <boolean>, "reason": "<short plain English>", "benefit": "<benefit summary with amounts in INR where applicable>" }
  ],
  "recommended_action": "<one sentence: what the applicant should do next>"
}

Include exactly these four schemes in this order. Reasons must cite which rule passed or failed.`;

export async function POST(req) {
  const applicant = await req.json();

  const userContent = `Applicant details (evaluate eligibility):\n${JSON.stringify(applicant, null, 2)}`;

  try {
    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 1400,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return Response.json(
        { error: data?.error?.message ?? 'Groq API error', details: data },
        { status: response.status }
      );
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      return Response.json({ error: 'Empty model response' }, { status: 502 });
    }

    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
