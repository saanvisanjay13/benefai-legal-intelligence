import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { name, aadhaar, annualIncome, district, scheme } = await req.json();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "user",
        content: `You are a fraud detection system for Indian government grants. Applicant: name=${name}, aadhaar=${aadhaar}, income=Rs ${annualIncome}, district=${district}, scheme=${scheme}. Give a fraud risk score 0-100. Under 30 is APPROVED, 30-65 is REVIEW, above 65 is REJECTED. Reply with JSON only, no markdown, no explanation: {"fraudScore": 75, "decision": "REJECTED", "reason": "one sentence explanation"}`
      }],
    });
    const text = response.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!["APPROVED", "REVIEW", "REJECTED"].includes(parsed.decision)) {
      parsed.decision = parsed.fraudScore >= 66 ? "REJECTED" : parsed.fraudScore >= 31 ? "REVIEW" : "APPROVED";
    }
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("VERIFY ERROR:", err.message, err.status, err.error);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}