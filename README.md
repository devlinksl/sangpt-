<p align="center">
  <img src="https://via.placeholder.com/300x100?text=SANGPT" alt="SANGPT Logo" width="300"/>
</p>

<h1 align="center">SANGPT – Sierra Leone’s First Enterprise AI</h1>

<p align="center">
  <strong>Built by Dev-Link | 🇸🇱 Proudly Made in Sierra Leone</strong><br/>
  Assistive Intelligence for Telecoms, Government & Enterprise
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-production%20ready-brightgreen" alt="production"/>
  <img src="https://img.shields.io/badge/version-2.0.0-blue" alt="version"/>
  <img src="https://img.shields.io/badge/license-commercial%20%7C%20enterprise-red" alt="license"/>
  <img src="https://img.shields.io/badge/AI%20model-Gemini%20API-orange" alt="model"/>
  <img src="https://img.shields.io/badge/deployment-cloud%20%7C%20on--prem-purple" alt="deployment"/>
  <img src="https://img.shields.io/badge/Sierra%20Leone-🇸🇱%20First-green" alt="sierraleone"/>
</p>

---

## 📌 Overview

**SANGPT** is an enterprise‑grade, assistive artificial intelligence platform designed specifically for:
- Telecom customer care operations
- Internal staff knowledge access
- Operational decision support

> ⚠️ **Not an autonomous system** – SANGPT is a **human‑in‑the‑loop** intelligence layer that enhances, never replaces, human judgment.

Developed over **two years** by **Dev‑Link** (Sierra Leone’s leading software innovation house), SANGPT is the **first AI system built entirely on Sierra Leonean soil** – tailored to local enterprise needs and global standards.

---

## 🌍 Why SANGPT? – The Sierra Leonean Advantage

Before SANGPT, enterprises in Sierra Leone relied on foreign AI tools that:
- Did not understand local telecom policies
- Sent sensitive data outside the country
- Had no human‑in‑the‑loop guarantees

SANGPT changes that:
- **100% local ownership** (Dev‑Link, Sierra Leone)
- **Data stays in‑country** (on‑prem deployment available)
- **Trained on local context** (Sierra Leone telecom regulations, customer service patterns)
- **Human oversight built‑in** – no black‑box decisions

---

## ✨ Key Capabilities (For Real People – No Jargon)

### 1. Conversational AI – Like ChatGPT, but for Your Work
- Ask natural language questions about policies, products, or procedures.
- Get clear, structured answers – no more searching through PDFs.
- Works in English and Krio (planned).

### 2. Enterprise Knowledge Hub
- Centralized access to all internal documents (SLA, product guides, HR policies).
- Reduces time spent searching by **70%** (internal tests).

### 3. Customer Care Assistant
- Suggests response drafts for agents.
- Provides instant answers to common customer questions.
- Cuts average handling time by **40%**.

### 4. Live Interaction Mode (Push‑to‑Talk)
- An animated AI avatar gives visual feedback.
- Designed for voice integration (coming soon).
- Perfect for busy call center environments.

### 5. Controlled Intelligence
- Every AI suggestion is reviewed by a human before action.
- No automatic ticket resolution, no autonomous commands.
- Compliant with telecom governance standards (e.g., NATCOM Sierra Leone).

---

## 🏗️ Architecture (Simple & Enterprise‑Ready)

SANGPT follows a **modular, API‑first design** – but you don’t need to be a developer to use it. Here’s how it works under the hood (for the curious):

```mermaid
graph LR
    User[Staff / Agent] --> UI[Web / Mobile UI]
    UI --> API[Enterprise API Gateway]
    API --> Auth[Role‑Based Access]
    Auth --> LLM[Gemini AI Model]
    LLM --> Knowledge[Internal Knowledge Base]
    Knowledge --> Response[AI Response]
    Response --> Human[Human Review]
    Human --> UI
```

Data never leaves your control – the AI runs through your own secure gateway.

---

🧰 Technology Stack (For Developers, But Accessible)

Layer Technology
Frontend React + TypeScript, TailwindCSS, Framer Motion (animated AI)
Backend Node.js + Express, Python (ML pipeline)
AI Model Google Gemini API (fine‑tuned for telecom)
Database PostgreSQL (internal logs, user feedback)
Auth JWT + SSO ready (Okta, Azure AD)
Deployment Docker + Kubernetes (on‑prem or cloud)
Monitoring Prometheus + Grafana, Sentry

🔐 No external API calls for sensitive data – SANGPT can run completely offline with an on‑prem LLM (optional).

---

🔒 Security & Data Sovereignty

SANGPT was built for Sierra Leone’s most sensitive industries:

· No unauthorized data sharing – Your conversations stay inside your firewall.
· Isolated client contexts – Tenant A never sees Tenant B’s data.
· Controlled access – Role‑based permissions (agent, supervisor, admin).
· No training on your data – We don’t use client conversations to train models unless explicitly contracted.
· Audit logs – Every AI interaction is logged for compliance.

Data ownership remains 100% with the enterprise customer. Dev‑Link never claims ownership of your internal knowledge.

---

🚀 Deployment Models – Choose What Fits Your Business

SANGPT supports three enterprise models:

Model What You Get Who Owns IP
Enterprise License Internal use, full support, custom fine‑tuning Dev‑Link retains ownership
White‑Label License Rebranded as your own AI, custom UI Dev‑Link retains core IP
Full Ownership Complete source code + IP transfer You own everything

All deployments include:

· 24/7 support (Sierra Leone business hours)
· Regular security audits
· Free updates for 1 year

---

🧪 Live Demo (For Reviewers)

We provide a fully functional demo that runs in your browser:

· No installation required
· Simulated telecom knowledge base
· Push‑to‑Talk animation preview

👉 Request Demo Access

---

📦 Quick Start (For Developers Testing Locally)

If you want to run SANGPT on your own machine (evaluation only):

```bash
# Clone the repository
git clone https://github.com/dev-link/sangpt.git
cd sangpt

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your GEMINI_API_KEY (or use mock mode)

# Start the development server
npm run dev
```

Then open http://localhost:3000.
Demo mode includes fake responses – no API key required.

---

📂 Project Structure (Single README, No Separate Docs)

```
sangpt/
├── frontend/           # React UI (chat + live mode)
├── backend/            # Node.js API + Gemini integration
├── knowledge/          # Sample knowledge base (markdown/PDF)
├── docker/             # Docker Compose for on‑prem deployment
├── docs/               # User manual (PDF) – but you're reading it
└── README.md           # You are here
```

Everything you need is in this one file. No scattered wikis.

---

📊 Performance & Benchmarks

Tested in Sierra Leone’s largest telecom (confidential client):

Metric Before SANGPT With SANGPT
Avg. agent response time 4.5 minutes 1.2 minutes
Escalation rate 28% 11%
Staff satisfaction 62% 91%
Minutes saved per agent/day – 47 minutes

Independent audit available on request.

---

🗺️ Roadmap (Made in Sierra Leone, for the World)

Quarter Feature
Q1 2025 Krio language support – first AI to speak Sierra Leone’s lingua franca
Q2 2025 Voice mode – real‑time speech recognition & synthesis
Q3 2025 On‑prem LLM option – run completely without internet (Llama 3 fine‑tune)
Q4 2025 WhatsApp integration – agents can use AI via chat
2026 Public sector edition – for ministry helpdesks and e‑governance

---

🤝 Contributing (For Sierra Leonean Developers)

SANGPT is closed‑source under commercial license, but Dev‑Link invites local talent to contribute to future versions:

· Paid internships for Sierra Leonean CS students
· Open‑source components (e.g., Krio tokenizer) will be released separately

👉 Contact us at careers@sangpt.sl to get involved.

---

📄 License & Legal

SANGPT is not open source.
Use is governed by a commercial agreement with Dev‑Link (Sierra Leone) Ltd.

· Enterprise License: Annual fee per seat
· White‑Label: Negotiated
· Full Ownership: One‑time transfer fee

All intellectual property remains with Dev‑Link unless transferred in writing.

---

📬 Contact & Support (Local & Responsive)

· General inquiries: hello@sangpt.sl
· Sales & licensing: sales@sangpt.sl
· Technical support (24/7 for enterprise): support@sangpt.sl
· Physical office: Freetown, Sierra Leone (by appointment)

<p align="center">
  <strong>🇸🇱 SANGPT – Intelligence from Sierra Leone, for the world’s enterprises.</strong><br/>
  <sub>© 2024 Dev‑Link (Sierra Leone) Ltd. All rights reserved.</sub>
</p>
