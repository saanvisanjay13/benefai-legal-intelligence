# BenefAI — Digital Beneficiary Identification for GIA India

> AI-powered platform to digitize and automate government scheme beneficiary identification for India's Grievance & Insurance Authority (GIA)

**Live Demo:** [https://fraud-dashboard-green.vercel.app/](https://fraud-dashboard-green.vercel.app/)

---

## The Problem

India has 800 million beneficiaries across government schemes. GIA processes thousands of claims manually — slow, error-prone, and opaque. Vulnerable citizens wait months for decisions they don't understand, in a language they can't read.

**BenefAI solves this with AI.**

---

## Features

### 🗄️ Data & Storage
- **Beneficiary intake form** — structured form with Supabase database integration
- **AI verification decision logging** — every decision saved with full audit trail
- **Analytics dashboard** — real-time stats and verification trends using Recharts

### 🤖 AI Features
- **Duplicate detection** — fuzzy name matching to catch fraudulent double registrations
- **Scheme eligibility checker** — instant eligibility across PM-KISAN, PMUY, PMJJBY, PMSBY
- **Multilingual rejection letters** — plain-language explanations in Hindi, Kannada, English with appeal steps

### 👁️ Vision & External APIs
- **Document OCR** — auto-fill forms from Aadhaar and PAN card uploads
- **Satellite wealth verification** — Google Maps imagery analysis of applicant addresses
- **WhatsApp notifications** — instant approval alerts via Twilio
- **Batch CSV verification** — bulk applicant scoring with flagged export

### 🎨 Visualisation & Voice
- **Live India fraud heatmap** — district-level fraud rates on interactive map
- **Fraud ring network graph** — visualise connected suspicious applicants
- **Voice verification** — Hindi, Tamil, English support via Web Speech API
- **Real-time score monitor** — live Supabase Realtime dashboard with threshold alerts

  ---

  ## Tech Stack

  | Layer | Technology |
  |---|---|
  | Frontend | Next.js 16, React 19, Tailwind CSS |
  | AI / LLM | Groq API, LLaMA 3.3 70B, Claude Vision |
  | Database | Supabase (PostgreSQL) |
  | External APIs | Google Maps Static, Twilio WhatsApp |
  | Visualisation | Recharts, react-force-graph-2d, react-simple-maps |
  | Voice | Web Speech API, Whisper |
  | Deployment | Vercel |
  | Version Control | Git, GitHub |

  ---

  ## Team

  | Name | Role |
  |---|---|
  | Pujitha Kakarlapudi | Intake form, database, audit trail |
  | V Deepthi Priya | Duplicate detection, scheme eligibility, rejection letter generator |
  | Saanvi Sanjay| Document OCR, satellite verification, WhatsApp notifications |
  | Sharvani S | Fraud heatmap, network graph, voice verification, analytics |

  ---

  ## Getting Started

  ```bash
  # Clone the repo
  git clone https://github.com/saanvisanjay13/benefai-legal-intelligence.git
  cd benefai-legal-intelligence

  # Install dependencies
  npm install

  # Add environment variables
  cp .env.example .env.local
  # Fill in your GROQ_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY

  # Run locally
  npm run dev
  ```

  Open [http://localhost:3000](http://localhost:3000) to view the app.

  ---

  ## Impact

- Reduces claim processing time from **90 days to under 72 hours**
- Catches duplicate registrations saving crores in fraudulent payouts
- Makes rejection reasons accessible to **rural citizens in their own language**
- Covers **4 major government schemes** in one unified platform

    ---

    *Built at a hackathon in under 24 hours — April 2026*
