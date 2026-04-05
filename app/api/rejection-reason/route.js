export async function POST(req) {
  const body = await req.json();
  const claim = body.claim;
  const red_flags = Array.isArray(body.red_flags) ? body.red_flags : [];
  const language = typeof body.language === 'string' ? body.language : 'English';

  if (!claim || typeof claim !== 'object') {
    return Response.json({ error: 'Missing claim object' }, { status: 400 });
  }

  const prompt = `
You are a compassionate, professional officer of GIA (Grievance & Insurance Authority) India.
Write a formal rejection communication for an insurance beneficiary claim. Be respectful and clear — never blame the claimant personally.

CLAIM (use for facts only):
${JSON.stringify(claim, null, 2)}

RED FLAGS / ISSUES TO ADDRESS (explain each relevant point plainly; if empty, refer to standard documentation gaps):
${JSON.stringify(red_flags, null, 2)}

LANGUAGE FOR ALL USER-FACING TEXT IN THE JSON:
"${language}"
- If English: write in clear Indian English.
- If Hindi: write rejection_letter, documents_needed entries, and appeal_steps entries in simple, polite Hindi (Devanagari).
- If Kannada: write those fields in polite Kannada (Kannada script).

Requirements for the rejection letter:
- Address the claimant by name (${claim.name ?? 'the claimant'}) in the salutation or first sentence.
- State that the claim cannot be approved at this time and why, referencing the issues above.
- Tell them clearly what documents or corrections are needed.
- Keep tone warm but official.

Return ONLY valid JSON — no markdown fences, no text before or after. Exact shape:
{
  "rejection_letter": "<full letter body with paragraphs separated by \\n\\n>",
  "documents_needed": [ "<string>", "..." ],
  "appeal_steps": [ "<step 1>", "<step 2>", "..." ],
  "reapply_eligible": <true if they may reapply after fixing docs; false if appeal-only or not eligible to reapply>,
  "officer_summary": "<one short factual line for the case file — may be in English for audit>"
}
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
        max_tokens: 2000,
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
