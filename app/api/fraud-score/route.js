export async function POST(req) {
  const applicant = await req.json();

  const prompt = `
You are a fraud detection officer for GIA (Grievance & Insurance Authority) India.
Analyse this insurance beneficiary claim and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Applicant data:
- Name: ${applicant.name}
- Aadhaar last 4: ${applicant.aadhaar_last4}
- Relationship to policyholder: ${applicant.relationship}
- Policy number: ${applicant.policy_number}
- Claim amount (INR): ${applicant.claim_amount}
- Days since policyholder death: ${applicant.days_since_death}
- Documents submitted: ${JSON.stringify(applicant.documents_submitted ?? [])}
- Previous claims: ${applicant.previous_claims}

You must return ONLY a JSON object with exactly these keys (types as specified):
{
  "score": <number from 0 to 100>,
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "decision": "AUTO_APPROVE" | "HUMAN_REVIEW" | "REJECT",
  "reasoning": "<2-3 sentences in plain English>",
  "red_flags": [ "<string>", ... ]
}

Scoring rules (you must follow these when setting score, risk_level, and decision):
- score below 30 → decision AUTO_APPROVE, risk_level LOW
- score 30 to 69 → decision HUMAN_REVIEW, risk_level MEDIUM
- score 70 or above → decision REJECT, risk_level HIGH

Also consider: very fast high-value claims after death, multiple claims on the same policy, missing critical documents — add these to red_flags when relevant.
`;

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
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
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
