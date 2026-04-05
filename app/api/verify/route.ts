import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { supabase } from '@/lib/supabase'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { full_name, aadhaar, annual_income, district, scheme_name, id } = body

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are a government fraud detection engine for welfare schemes in India.

Analyze this beneficiary and return ONLY a valid JSON object, no extra text, no markdown:
{"score":25,"risk_level":"green","decision":"approved","reason":"Applicant meets eligibility criteria."}

Applicant:
- Name: ${full_name}
- Aadhaar: ${aadhaar}
- Annual Income: Rs.${annual_income}
- District: ${district}
- Scheme: ${scheme_name}

Score guide: 0-40 = green approved, 41-70 = yellow review, 71-100 = red rejected.
Return ONLY the JSON object on a single line, nothing else.`
        }
      ]
    })

    const text = response.choices[0].message.content || ''
    const jsonMatch = text.match(/\{.*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const result = JSON.parse(jsonMatch[0])

    await supabase
      .from('beneficiaries')
      .update({
        fraud_score: result.score,
        risk_level: result.risk_level,
        decision: result.decision,
        reason: result.reason,
      })
      .eq('id', id)

    await supabase.from('audit_logs').insert({
      applicant_name: full_name,
      decision: result.decision,
      fraud_score: result.score,
      reason: result.reason,
    })

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}