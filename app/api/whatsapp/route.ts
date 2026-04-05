import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, decision, fraudScore, scheme } = body;

    const d = (decision || "").toString().trim().toUpperCase();
    if (!["APPROVED", "REVIEW", "REJECTED"].includes(d)) {
      return NextResponse.json({ error: `decision must be APPROVED or REJECTED, got: "${d}"` }, { status: 400 });
    }

    const emoji = d === "APPROVED" ? "✅" : d === "REJECTED" ? "❌" : "⚠️";
    const message = `${emoji} BenefAI Alert\nApplicant: ${name}\nScheme: ${scheme}\nStatus: ${d}\nFraud Score: ${fraudScore}/100\nThis is an automated notification from BenefAI.`;

    const msg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:+91${phone}`,
      body: message,
    });

    return NextResponse.json({ success: true, sid: msg.sid });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}