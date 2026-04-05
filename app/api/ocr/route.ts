import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json();
    const mime = mediaType || "image/jpeg";

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mime};base64,${imageBase64}` }
          },
          {
            type: "text",
            text: `You are extracting fields from an Indian government document (Aadhaar card, income certificate, etc).

Look carefully for ALL of these fields and extract them:
- full_name: the person's full name
- aadhaar_number: 12-digit Aadhaar number (may have spaces like "1234 5678 9012")
- annual_income: income amount (e.g. "Rs 38000" or "38000")
- phone: mobile/phone number — look for labels like "Phone:", "Mobile:", "Mob:", "Ph:" or any 10-digit number
- address: full address
- district: district name
- state: state name
- date_of_birth: date of birth if present

Reply with ONLY a JSON object, no markdown, no explanation:
{"full_name": "...", "aadhaar_number": "...", "annual_income": "...", "phone": "...", "address": "...", "district": "...", "state": "...", "date_of_birth": "..."}`
          }
        ]
      }],
    });

    const text = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    
    console.log("OCR RESULT:", JSON.stringify(parsed));
    return NextResponse.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error("OCR ERROR:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}