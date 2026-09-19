<div align="center">

# साखसेतु / व्यापार साथी (SaakhSetu • Vyapaar Saathi)
### *"India's Sovereign Rural Micro-Enterprise Ledger, DPI Scheme Radar & Cash-Flow Underwriting Engine"*
**Smart India Hackathon (SIH 2026) — Problem Statement 26091**

<p align="center">
  <em>An AI-powered, DPI-aligned micro-enterprise ledger, hyper-local demand forecasting radar, authentic statutory scheme pipeline, and transparent 4-pillar alternative credit underwriting engine for India's 63+ million rural micro-entrepreneurs.</em>
</p>

### 🌐 **Live Production App:** [https://saakhsetu.vercel.app](https://saakhsetu.vercel.app) *(Mirror: [vyapaar-saathi-nine.vercel.app](https://vyapaar-saathi-nine.vercel.app))*

[Architecture](#-architecture--data-flow) • [Dual Entry Modes](#-dual-entry-modes-evaluator-demo-vs-real-merchant) • [Core Modules](#-core-modules) • [SMS OTP & Security](#-real-time-sms-otp-authentication--jwt-security) • [Verified Scheme Pipeline](#-verified-scheme-database--structured-ingestion-pipeline) • [Underwriting Engine](#-4-pillar-alternative-credit-scoring-math) • [Test Suite (49/49)](#-automated-test-suite-4949-passing) • [Quick Start](#-quick-start-instructions)

---

</div>

## 🌾 The Core Problem & Context

India's 63+ million rural micro-entrepreneurs (kirana grocers, village tailors, rural artisans, dairy shops, agro-input dealers) drive the rural economy. Yet:
1. **Zero CIBIL History**: Over 85% have never taken a formal commercial loan, leaving them with an empty credit bureau record.
2. **Rejection by Commercial Banks**: Despite running cash-flow positive, resilient shops for years, traditional banks reject their loan applications due to lack of audited ITRs, formal balance sheets, or collateral.
3. **Informal Udhaar & Vulnerability**: Merchants maintain handwritten ledgers, absorbing delayed customer udhaar and facing volatile monsoon/festival demand swings without working capital support.

**SaakhSetu bridges this gap** by converting daily bahi-khata cash-flow entries into an explainable, non-CIBIL credit pass and official Bank Loan Dossier aligned with the **Reserve Bank of India (RBI) Priority Sector Lending (PSL)** framework and the **Nayak Committee cash-flow method**.

---

## 🏛️ Architecture & Data Flow

```
   ┌────────────────────────────────────────────────────────────────────────────┐
   │                          SAAKHSETU / VYAPAAR SAATHI                        │
   │           DPI India Stack Aligned • Mobile-First Responsive PWA           │
   └─────────────────────────────────────┬──────────────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │  EVALUATOR DEMO MODE      │                   │  REAL ENTERPRISE MODE     │
   │  - Ramesh's Kirana Store  │                   │  - 2-Step SMS OTP Signup  │
   │  - 48 Months Vintage      │                   │  - Clean Day-1 Empty Slate│
   │  - 120-Day Seeded Ledger  │                   │  - 50-Tx Milestone Audit  │
   │  - 809 / 850 Credit Score │                   │  - Zero Fabricated Score  │
   └─────────────┬─────────────┘                   └─────────────┬─────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                       CORE ENGINE CAPABILITIES                            │
   ├──────────────────────────────┬────────────────────────────────────────────┤
   │ 1. Tactile Bahi-Khata Ledger │ Daily income, expenses, udhaar & UPI tracking │
   │ 2. Real-Time SMS OTP Auth    │ Twilio Verify v2 + Trial Sandbox Resilience│
   │ 3. 4-Pillar Credit Scorer    │ 50-Tx Milestone Audit & Explainable 300-850 │
   │ 4. Verified Scheme Radar     │ Live portal probes + PIB RSS live feed scan   │
   │ 5. Scheme Ingestion Sandbox  │ Sub-30s dynamic AST parsing & shop matching   │
   │ 6. Saathi AI Advisor         │ Grounded Gemini 2.5 Flash with fallback net   │
   │ 7. Bank Loan Dossier (CAM)   │ Printable official RBI PSL & Nayak memo       │
   │ 8. ONDC Wholesale Discovery  │ Direct commodity wholesale procurement quotes │
   └───────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Real-Time SMS OTP Authentication & JWT Security

SaakhSetu eliminates insecure static passwords and pins, replacing them with a secure 2-step mobile verification pipeline:

1. **Twilio Verify v2 Engine (`server/services/twilioVerifyService.js`)**:
   - Programmatically provisions SMS OTP verification codes dispatched over global cellular networks.
   - Enforces canonical Indian E.164 phone normalization (`+91XXXXXXXXXX`) and UI phone masking (`+91 98XXX XX789`).
2. **Trial Account Sandbox Fallback & Universal Evaluator Bypass**:
   - Detects Twilio trial limitations, unverified carrier ID restrictions, and gateway blocks automatically.
   - When trial limitations arise, issues an authentic 6-digit sandbox verification code stored with a 10-minute TTL, displaying an amber banner with auto-filled input boxes for instant 1-click verification.
   - Hackathon judges can also verify with universal evaluation bypass code `123456`.
3. **JWT Session Authentication & Cryptographic Protection (`server/middleware/auth.js`)**:
   - Successfully verified phone numbers receive signed JSON Web Tokens (7-day validity).
   - `requireShopAccess` middleware strictly prevents cross-shop ledger tampering.
4. **Brute-Force & Rate Limiting Guardrails (`server/services/rateLimiterService.js`)**:
   - Strict 30-second cooldown per mobile number before requesting another OTP.
   - 5 failed consecutive attempts trigger an automatic temporary security lockout.

---

## 🏛️ Verified Scheme Database & Structured Ingestion Pipeline

SaakhSetu features an authentic statutory scheme catalog aligned with Government of India priority lending guidelines, paired with active portal monitoring:

### 1. 14 Verified Baseline Statutory Schemes
- **PM MUDRA (Shishu, Kishor, Tarun)** — ₹50,000 to ₹20,00,000 collateral-free non-farm working capital.
- **SCA Concessional Micro Finance Scheme (90:10 Framework)** — 90% concessional credit up to ₹1.25 Lakh at 6.5% p.a. for marginalized communities (SC/ST/OBC/Minorities) with 10% margin money and 3-month moratorium.
- **PM SVANidhi** — Micro-credit working capital with 7% interest subsidy & UPI cashback.
- **PM Vishwakarma** — ₹15,000 digital toolkit voucher + 5% concessional credit up to ₹3 Lakh.
- **PMEGP, Stand-Up India, PMFME, CGTMSE, NABARD Micro-Credit, and State Initiatives (UP ODOP, Maha CMEGP, TN UYEGP, GJ SVBS, RJ MLUPY)**.

### 2. Live Government Infrastructure Health Probes
- Actively probes official statutory endpoints:
  - **Press Information Bureau (PIB)**: `https://pib.gov.in`
  - **MyScheme National Discovery Portal**: `https://www.myscheme.gov.in`
  - **Ministry of MSME Circulars**: `https://msme.gov.in`
  - **JanSamarth National Credit Platform**: `https://www.jansamarth.in`
- Measures genuine roundtrip millisecond latency and captures real HTTP status codes.

### 3. Live PIB RSS Press Release Scanner
- Genuinely contacts `https://pib.gov.in/RssMain.aspx?ModId=6` to discover newly published Government of India press releases in real time, parsing official release titles and statutory links.

### 4. Sub-30s Dynamic Scheme Ingestion Sandbox (Evaluator Demonstration)
- Demonstrates how the system handles newly gazetted schemes:
  1. **Validation**: Strict domain guardrail enforces authentic `.gov.in` / `.nic.in` domains.
  2. **Rule AST Parsing**: Converts raw circular text into computable eligibility rules (vintage, monthly turnover, category, margin money).
  3. **Dual-Tier Persistence**: Upserts into SQLite and MongoDB Atlas dynamic collections without server restart.
  4. **Instant Matching (< 15ms)**: Evaluates merchant bahi-khata ledgers against new parameters immediately.

---

## ⚖️ Dual Entry Modes: Evaluator Demo vs Real Merchant

To maintain technical due-diligence credibility during evaluations:

### 1. Evaluator Demo Mode (`ramesh-kirana`)
- **Single-Click Access**: Dedicated Evaluator Card on the landing page or Navbar.
- **Seeded Persona**: *Ramesh Kumar*, 48 months vintage, Utraula Dehat village, Balrampur (UP).
- **Realistic Time-Series**: 120 days of continuous transactions modeling a 32% monsoon dip (July) and a 105% festive surge (September).
- **Audit Badges**: Persistent `[DEMO DATA • Ramesh Kirana]` banner displays across all views.
- **Instant Reset**: 1-click database reset restores pristine 4-month seeded state anytime.

### 2. Live Micro-Enterprise Onboarding (Real Merchant Journey)
- **Zero Demo Leakage**: Real registrations begin with an honest Day-1 empty slate.
- **SMS OTP Verification**: Requires mobile verification via Twilio Verify or Sandbox Fallback.
- **50-Transaction Audit Milestone**: To preserve alternative credit underwriting integrity, real merchant accounts remain locked as *Under Audit* (`isUnrated: true`, `totalScore: null`, zero fabricated baselines) until 50 bahi-khata ledger transactions are recorded. An interactive 50-transaction milestone progress bar guides merchants to log daily counter cash, expenses, and digital sales, unlocking the formal 4-pillar rating (300–850) and MUDRA loan eligibility upon reaching 50 entries.

---

## 🎨 Authentic Indian Village Bazaar Design System

- **Earthy Terracotta & Ochre Palette**: Terracotta (`#C15324`), Turmeric Ochre (`#D97706`), Handloom Indigo (`#1E293B`), Harvest Forest (`#1E523A`), and Handmade Paper Canvas (`#FAF7F2`).
- **Warli Folk Art Linework**: Handcrafted SVG geometric motifs representing celebration and agriculture.
- **Tactile Numeric Keypad**: Designed for mobile merchants with large touch targets (48px+), quick presets (+₹50, +₹100, +₹500, +₹1,000), and minimal typing.
- **Single-Glance Modals**: Compact 2-column modal architectures escaping CSS transforms via React Portals (`createPortal(..., document.body)`).

---

## 🚀 Core Modules

### 1. Recharts Seasonal Cash Flow Trend
- High-fidelity **Recharts Area Chart** plotting 4-month audited time-series: recorded sales vs inventory replenishment outlays.
- Visualizes the agricultural economy cycle: summer baseline, monsoon waterlogging dip, and pre-festival harvest recovery.
- Dynamic summary metrics: gross sales, net surplus, working capital at risk, and digital payment ratio.

### 2. 4-Pillar Alternative Credit Scoring Math & 50-Transaction Audit Milestone

To preserve banking underwriting credibility, SaakhSetu enforces a strict **50-Transaction Minimum Threshold**:

#### A. 50-Transaction Audit Milestone (< 50 Transactions)
- **Zero Fabricated Scores**: Micro-enterprises lacking transaction history are classified as **Under Audit** (`isUnrated: true`, `totalScore: null`, `score: null`, `previousScore: null`, `scoreDelta: null`).
- **Milestone Progress Tracker**: The UI renders an informative progress dial and linear tracker showing `X / 50 Transactions logged`, progress percentage, and remaining count.
- **Credit Appraisal Memo (CAM)**: Automatically designates facility as `"Onboarding Evaluation (Requires 50 verified transactions)"` and marks score audit status as `UNDER_AUDIT`.
- **Structured 3-Stage Progression Timeline**:
  1. *Milestone 1: Merchant Registration* (Completed)
  2. *Milestone 2: 50 Ledger Transactions* (In Progress: `X/50 logged`)
  3. *Milestone 3: Alternative Credit Rating & Loan Eligibility* (Locked until Milestone 2 is achieved)

#### B. 4-Pillar Transparent Underwriting Math ($\ge$ 50 Transactions or Evaluator Demo)
Once 50 transactions are recorded, the **SaakhSetu Credit Score** (300–850) is computed across 4 explainable pillars:

$$\text{Total Score} = 300 + 550 \times \left( \frac{\text{Consistency} + \text{Growth} + \text{Discipline} + \text{Vintage}}{850} \right)$$

| Pillar | Weight | Max Pts | Metric Measured | Scoring Sub-Factors |
| :--- | :---: | :---: | :--- | :--- |
| **1. Cash Flow & Logging Regularity** | 30% | 255 pts | Daily ledger logging discipline & cash margin predictability | Daily logging regularity (160 pts) + Cash flow stability & low CV (95 pts) |
| **2. Turnover Growth & Stability** | 25% | 212 pts | Turnover momentum & seasonal dip resilience | Revenue growth momentum (130 pts) + Monsoon/off-season resiliency (82 pts) |
| **3. Working Capital & Udhaar Discipline** | 25% | 213 pts | Udhaar recovery cycle & digital payment adoption | Udhaar-to-income control (140 pts) + Timely collection cycle & UPI velocity (73 pts) |
| **4. Business Vintage & Formal Linkage** | 20% | 170 pts | Commercial banking linkage & enterprise vintage | Operating vintage in locality (110 pts) + Commercial bank account & Udyam KYC (60 pts) |

#### C. Rating Bands & Banking Tiers
- **$\ge 750$ — Prime Bankable**: Tier 1 — Low Risk / Preferred PSL Micro-Enterprise (₹5,00,000 - ₹20,00,000 MUDRA Tarun)
- **$680 - 749$ — Loan Ready**: Tier 2 — Moderate Risk / Standard MUDRA Kishor (₹50,000 - ₹5,00,000)
- **$580 - 679$ — Fair Eligibility**: Tier 3 — Acceptable Risk / CGTMSE Credit Guarantee Recommended (₹10,000 - ₹50,000)
- **$< 580$ — Needs Work**: Tier 4 — Early Stage / High Supervision (Micro-Credit Shishu)

### 3. Saathi AI Advisor (Google Gemini Multi-Model Failover)
- **Strict Grounding**: Context injects trade category, location, vintage, 30-day turnover, and APMC mandi harvest dates.
- **Candidate Model Failover**: Automatic rotation across `gemini-2.5-flash`, `gemini-flash-latest`, and `gemini-flash-lite-latest` to avoid 429 quota exhaustion.
- **6-Scenario Dynamic Fallback Net**: Operates even without external API keys for stock planning, udhaar recovery, margin optimization, and MUDRA equipment loans.

### 4. Bankable Loan Application Dossier (CAM)
- 1-click printable Priority Sector Lending (PSL) statement.
- Structured according to the **RBI Master Direction on Priority Sector Lending (FIDD.CO.Plan.BC.5/04.09.01/2020-21)**.
- Features formal verification stamp, unique document control ID (`VS-DOC-...`), monthly cash turnover audit, and credit officer underwriting checklist.

---

## 🛡️ Resilience & Production Hardening

1. **Vercel Serverless Statement Caching**:
   - Wrapped `db.prepare` statements with a persistent memory cache (`statementCache = new Map()`), eliminating Node.js native destructor crashes (`SIGABRT: Assertion failed: (env) != nullptr`).
2. **MongoDB Atlas Connection Pool Management**:
   - Configured `maxPoolSize: 1`, `minPoolSize: 0`, and `maxIdleTimeMS: 5000` to prevent Lambda cold starts from saturating M0 cluster limits.
3. **PWA Precache Optimization**:
   - Slashed initial precache bundle size by 88% (from 18 MB down to 2.2 MB), using on-demand `CacheFirst` caching for media.
4. **Error Isolation**:
   - `PageErrorBoundary` around tabs and `ModalErrorBoundary` around dialogs ensure transient exceptions never crash the navigation bar or dashboard layout.

---

## 🧪 Automated Test Suite (49/49 Passing)

The project includes an automated test suite running with the Node.js built-in test runner:

```bash
npm --prefix server test
```

### 100% Pass Rate Across 8 Test Suites:
- **AI Advisory Offline Fallback Suite** (2/2):
  - Festival queries trigger grounded festive stock advisory without API key.
  - Loan enquiries trigger MUDRA advisory with alternative credit score grounding.
- **Shop Auth & Transaction Operations Suite** (5/5):
  - Phone and credentials validation in database.
  - Transaction creation, deletion, and customer phone linking.
  - Backend idempotency protection against replay attacks.
- **Credit Scoring Service Suite** (4/4):
  - Ramesh Kirana baseline score within valid [300, 850] range.
  - Unpaid udhaar penalties on discipline factor.
  - Score clamping within bounds [300, 850].
  - 50-transaction threshold: shops with < 50 transactions remain locked under audit (`totalScore: null`); unlocks formal 4-pillar score at 50 transactions.
- **Customer Credit & WhatsApp Reminders Suite** (5/5):
  - Customer records and credit limits.
  - Udhaar cycle and WhatsApp payment reminder deep link formatting.
- **DPI Gateway, Credit CAM & ONDC Wholesale Suite** (4/4):
  - CAM Generation with Nayak Committee norms.
  - Udyam registration regex validator strictly adheres to `UDYAM-XX-00-0000000`.
  - ONDC Wholesale Catalog pricing and margin calculations.
- **Real-Time SMS OTP Authentication & Security Suite** (11/11):
  - E.164 phone normalization and Indian cellular prefix validation.
  - 30-second send cooldown and lockout after 5 failed attempts.
  - JWT session token generation, verification, and tamper protection.
  - Twilio Verify v2 mock integration and secure registration enforcement.
- **Government Scheme Matcher Suite** (4/4):
  - 14 statutory baseline schemes with official source portals.
  - Kirana shop matching with MUDRA Kishor, NABARD, and UP ODOP.
  - State isolation guarantees (Maharashtra CMEGP vs UP vs TN vs GJ vs RJ).
- **Government Scheme Scraping & Real-Time Ingestion Suite** (6/6):
  - Statutory domain guardrails (.gov.in / .nic.in).
  - Raw circular AST parsing.
  - Live scraper sync & dynamic database upsert.
  - In-memory rule engine execution (< 15ms).
  - On-demand custom circular simulator.
  - Scraper status endpoint reporting.

---

## ⚡ Quick Start Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/eshaansharma07/SIH2.git
cd SIH2

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Start Local Development
```bash
# Terminal 1: Backend Server (Port 3001)
cd server
npm start

# Terminal 2: Frontend App (Port 5173)
cd client
npm run dev
```

Open: **`http://localhost:5173`**

### 3. Run Automated Tests
```bash
npm --prefix server test
```

### 4. Production Build
```bash
npm --prefix client run build
```

---

<div align="center">
  <sub>Built with ❤️ for Indian Rural Micro-Entrepreneurs • Smart India Hackathon 2026</sub>
</div>
