import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { address, annualIncome, name } = await req.json();

    const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, {
      headers: { "User-Agent": "BenefAI/1.0" }
    });
    const geoData = await geo.json();
    const lat = parseFloat(geoData[0]?.lat || "18.5204");
    const lon = parseFloat(geoData[0]?.lon || "73.8567");

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "user",
        content: `You are a satellite imagery analyst for Indian government fraud detection. Address: ${address}. Applicant: ${name}. Claimed annual income: Rs ${annualIncome}. Based on your knowledge of this location in India, analyse if this income is consistent with the area. Reply with JSON only, no markdown: {"wealthLevel": "low", "consistent": false, "note": "one sentence observation mentioning the specific area and income"}`
      }],
    });

    const text = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return NextResponse.json({
      ...parsed,
      lat,
      lon,
      mapUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.02},${lat-0.02},${lon+0.02},${lat+0.02}&layer=mapnik&marker=${lat},${lon}`
    });
  } catch (err: any) {
    console.error("SATELLITE ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}