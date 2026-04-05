export async function POST(req) {
  const body = await req.json();
  const newApplicant = body.newApplicant;
  const existingRecords = Array.isArray(body.existingRecords) ? body.existingRecords : [];

  if (!newApplicant || typeof newApplicant !== 'object') {
    return Response.json({ error: 'Missing newApplicant object' }, { status: 400 });
  }

  const prompt = `
You are a duplicate detection system for GIA (Grievance & Insurance Authority) India.
Compare NEW_APPLICANT against EXISTING_RECORDS and return ONLY valid JSON — no markdown, no extra text.

NEW_APPLICANT:
${JSON.stringify(newApplicant, null, 2)}

EXISTING_RECORDS (each object must include an "id" field):
${JSON.stringify(existingRecords, null, 2)}

Task:
- Decide if NEW_APPLICANT is the same person / same claim identity as any existing record, accounting for:
  - Name spelling variations, typos, extra spaces
  - Transliteration differences (e.g. Sharma / Sarma, regional spellings)
  - Same aadhaar_last4 and policy_number strongly indicate the same individual

Return ONLY this JSON shape:
{
  "is_duplicate": <true if any MEDIUM or HIGH confidence match exists, else false>,
  "matches": [
    { "id": "<existing record id>", "confidence": "HIGH" | "MEDIUM" | "LOW", "reason": "<brief factual reason>" }
  ]
}

Rules:
- Include at most one match per existing record id.
- Use confidence HIGH when aadhaar_last4 and policy_number both match and name is consistent (including minor spelling/transliteration).
- Use MEDIUM when policy matches and name is likely the same person but aadhaar differs or one field is ambiguous.
- Use LOW for weak or coincidental similarity.
- **In the "matches" array, include ONLY entries with confidence MEDIUM or HIGH.** Do not include LOW confidence entries in "matches".
- If there are no MEDIUM or HIGH matches, return "is_duplicate": false and "matches": [].
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
        max_tokens: 900,
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
    const parsed = JSON.parse(clean);

    const rawMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
    const matches = rawMatches.filter(
      (m) => m && (m.confidence === 'MEDIUM' || m.confidence === 'HIGH')
    );
    const is_duplicate = matches.length > 0;

    return Response.json({ is_duplicate, matches });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
