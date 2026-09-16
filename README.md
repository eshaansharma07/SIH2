<div align="center">

# व्यापार साथी (Vyapaar Saathi)
### *"Your Rural Micro-Enterprise Companion & Credit Structuring Engine"*
**Smart India Hackathon (SIH 2026) — Problem Statement 26091**

[![Vercel Deployment](https://img.shields.io/badge/Live_Production-vyapaar--saathi--nine.vercel.app-000000.svg?logo=vercel)](https://vyapaar-saathi-nine.vercel.app)
[![Tests Passing](https://img.shields.io/badge/Node_Test_Suite-11%2F11_Passing-forestgreen.svg)](https://nodejs.org/)
[![React 18](https://img.shields.io/badge/Frontend-React_18_%2B_TailwindCSS-C15324.svg)](https://reactjs.org/)
[![Recharts](https://img.shields.io/badge/Charts-Recharts_Time--Series-D97706.svg)](https://recharts.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express-339933.svg)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite_WAL-003B57.svg)](https://www.sqlite.org/)
[![Anthropic Claude API](https://img.shields.io/badge/AI_Engine-Claude_3.5_Sonnet-D97706.svg)](https://www.anthropic.com/)
[![RBI PSL Compliant](https://img.shields.io/badge/Framework-RBI_Priority_Sector_Lending-1E293B.svg)](https://rbi.org.in/)

<p align="center">
  <em>An AI-powered, DPI-aligned sovereign micro-enterprise ledger, hyper-local demand forecasting radar, and transparent 4-pillar alternative credit underwriting engine for India's 63+ million rural micro-entrepreneurs.</em>
</p>

### 🌐 **Live Production App:** [https://vyapaar-saathi-nine.vercel.app](https://vyapaar-saathi-nine.vercel.app)

[Architecture](#-architecture--data-flow) • [Dual Entry Modes](#-dual-entry-modes-judge-demo-vs-real-merchant) • [Core Modules](#-core-modules) • [Underwriting Engine](#-4-pillar-alternative-credit-scoring-math) • [Statutory Schemes](#-verified-statutory-schemes-library) • [Quick Start](#-quick-start-instructions)

---

</div>

## 🌾 The Core Problem & Context

India's 63+ million rural micro-entrepreneurs (kirana grocers, village tailors, rural artisans, dairy shops, agro-input dealers) drive the rural economy. Yet:
1. **Zero CIBIL History**: Over 85% have never taken a formal commercial loan, leaving them with an empty credit bureau record.
2. **Rejection by Commercial Banks**: Despite running cash-flow positive, resilient shops for years, traditional banks reject their loan applications due to lack of audited ITRs, formal balance sheets, or collateral.
3. **Informal Udhaar & Vulnerability**: Merchants maintain handwritten ledgers, absorbing delayed customer udhaar and facing volatile monsoon/festival demand swings without working capital support.

**Vyapaar Saathi bridges this gap** by converting daily bahi-khata cash-flow entries into an explainable, non-CIBIL credit pass and official Bank Loan Dossier aligned with the **Reserve Bank of India (RBI) Priority Sector Lending (PSL)** framework and the **Nayak Committee cash-flow method**.

---

## 🏛️ Architecture & Data Flow

```
   ┌────────────────────────────────────────────────────────────────────────────┐
   │                          VYAPAAR SAATHI PLATFORM                           │
   │           DPI India Stack Aligned • Mobile-First Responsive Web           │
   └─────────────────────────────────────┬──────────────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │  EVALUATOR DEMO MODE      │                   │  REAL ENTERPRISE MODE     │
   │  - Ramesh's Kirana Store  │                   │  - Clean Day-1 Onboarding │
   │  - 48 Months Vintage      │                   │  - 5-Step Checklist       │
   │  - 4-Month Seeded Data    │                   │  - Unrated Credit State   │
   │  - 785 / 850 Credit Score │                   │  - Unlocks upon 5 sales   │
   └─────────────┬─────────────┘                   └─────────────┬─────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                       CORE ENGINE CAPABILITIES                            │
   ├──────────────────────────────┬────────────────────────────────────────────┤
   │ 1. Tactile Bahi-Khata Ledger │ Daily income, expenses, udhaar & UPI tracking │
   │ 2. Recharts Seasonal Curves  │ Area curves of gross revenue & inventory outlays │
   │ 3. 4-Pillar Credit Scorer    │ Explainable 300-850 score based on cash flows │
   │ 4. Statutory Scheme Matcher  │ Rule-based matching against 10 official schemes │
   │ 5. Saathi AI Advisor         │ Grounded Claude 3.5 Sonnet with fallback net │
   │ 6. Bank Loan Dossier         │ Printable official RBI PSL-compliant statement│
   └───────────────────────────────────────────────────────────────────────────┘
```

---

## ⚖️ Dual Entry Modes: Judge Demo vs Real Merchant

To maintain technical due-diligence credibility during the SIH 2026 Grand Finale judging, the application enforces a strict separation between demo data and live enterprise onboarding:

### 1. SIH 2026 Grand Finale • Evaluator Demo Mode (`ramesh-kirana`)
- **Single-Click Access**: Dedicated Evaluator Card on the landing page or Navbar.
- **Seeded Persona**: *Ramesh Kumar*, 48 months vintage, Utraula Dehat village, Balrampur (UP).
- **Realistic Time-Series**: 120 days of continuous transactions modeling a 32% monsoon dip (July) and a 105% festive surge (September).
- **Audit Badges**: Persistent `[DEMO DATA • Ramesh Kirana]` banner displays across all views to eliminate confusion.
- **Instant Reset**: 1-click database reset restores pristine 4-month seeded state anytime.

### 2. Live Micro-Enterprise Onboarding (Real Merchant Journey)
- **Zero Demo Leakage**: Real registrations begin with an honest Day-1 empty slate: ₹0 revenue, 0 transactions, unrated credit status.
- **Progressive 5-Step Onboarding Checklist**:
  1. *Profile Setup* (Complete on registration)
  2. *First Transaction* (Unlocks active bahi-khata)
  3. *3 Days of Regular Logging* (Builds consistency metric)
  4. *Unlock 4-Pillar Credit Score* (Unlocks upon 5 transactions over 3+ days)
  5. *Govt Scheme Pre-Qualification* (Recommends capital facilities once credit score >= 600)
- **Unrated Enterprise Protection**: Real merchants see an informative **Unrated Enterprise** badge with clear guidance rather than arbitrary or fake scores.

---

## 🎨 Authentic Indian Village Bazaar Design System

Vyapaar Saathi replaces generic blue fintech corporate styling with an authentic, grounded rural aesthetic:

- **Earthy Terracotta & Ochre Palette**:
  - **Terracotta** (`#C15324`): Primary earthen clay tone representing warmth and stability.
  - **Turmeric Ochre** (`#D97706`): Marigold and harvest mustard tone.
  - **Handloom Indigo** (`#1E293B`): Deep textile indigo for crisp, readable typography.
  - **Harvest Forest** (`#1E523A`): Agricultural surplus and verified metrics.
  - **Handmade Paper Canvas** (`#FAF7F2`): High-tactility organic parchment background.
- **Warli Folk Art Linework**: Handcrafted SVG geometric motifs (celebration circles, harvest sheaves, rural bullock carts).
- **Tactile Numeric Keypad**: Designed for low-literacy and mobile merchants with large touch targets (48px+), quick presets (+₹50, +₹100, +₹500, +₹1,000), and minimal typing.

---

## 🚀 Core Modules

### 1. Recharts Seasonal Cash Flow Trend
- High-fidelity **Recharts Area Chart** plotting 4-month audited time-series: recorded sales vs inventory replenishment outlays.
- Visualizes the agricultural economy cycle: summer baseline, monsoon waterlogging dip, and pre-festival harvest recovery.
- Real dynamic summary metrics: gross sales, net surplus, working capital at risk, and digital payment ratio.

### 2. 4-Pillar Alternative Credit Scoring Math
The **Vikasit Saathi Score** (300–850) is fully deterministic and explainable:

$$\text{Total Score} = 300 + 550 \times \sum_{i=1}^{4} (w_i \times s_i)$$

| Pillar | Weight | Metric Measured | Scoring Logic |
| :--- | :---: | :--- | :--- |
| **Pillar 1: Cash Flow Regularity** | 30% | Logging frequency & net operating margin | $\text{Min}(1, \frac{\text{Active Days}}{30}) \times 0.6 + \text{Min}(1, \frac{\text{Margin}}{0.25}) \times 0.4$ |
| **Pillar 2: Revenue Stability** | 25% | Monthly revenue consistency & growth | $\text{Min}(1, \frac{\text{Current Month Sales}}{\text{Average Sales}}) \times 0.7 + \text{Bonus}$ |
| **Pillar 3: Udhaar Discipline** | 25% | Working capital recovery & exposure | $(1 - \frac{\text{Pending Udhaar}}{\text{Total Income}}) \times 0.6 + \frac{\text{Repaid}}{\text{Given}} \times 0.4$ |
| **Pillar 4: Vintage & Digital Footprint** | 20% | Business vintage & UPI QR share | $\text{Min}(1, \frac{\text{Vintage Months}}{36}) \times 0.6 + \text{UPI Share} \times 0.4$ |

- **Interactive Score Simulator**: Real-time slider simulation allowing merchants to see how +30 days of logging, recovering ₹4,000 in udhaar, or increasing UPI adoption by 50% boosts their score.

### 3. Verified Statutory Schemes Library
Every scheme in the catalog is fact-checked against official Government of India gazettes and portals:

| Scheme Name | Ministry / Agency | Target Scale & Terms | Official Source |
| :--- | :--- | :--- | :--- |
| **PM MUDRA Shishu** | Ministry of Finance / PMMY | Up to ₹50,000, 0% collateral, working capital | [mudra.org.in](https://www.mudra.org.in) |
| **PM MUDRA Kishor** | Ministry of Finance / SIDBI | ₹50,000 to ₹5,00,000, 0% collateral, equipment | [udyamimitra.in](https://www.udyamimitra.in) |
| **PM MUDRA Tarun / Tarun Plus** | Ministry of Finance / SIDBI | ₹5 Lakh to ₹20 Lakh (Union Budget 2024 revised) | [udyamimitra.in](https://www.udyamimitra.in) |
| **PM SVANidhi** | MoHUA | ₹10k → ₹20k → ₹50k, 7% interest subsidy + UPI cashback | [pmsvanidhi.mohua.gov.in](https://pmsvanidhi.mohua.gov.in) |
| **PMEGP** | KVIC / Ministry of MSME | 15% to 35% margin subsidy, project cost up to ₹50 Lakh | [kviconline.gov.in](https://www.kviconline.gov.in) |
| **PM Vishwakarma Scheme** | Ministry of MSME | ₹15,000 toolkit grant + 5% fixed interest loan up to ₹3 Lakh | [pmvishwakarma.gov.in](https://pmvishwakarma.gov.in) |
| **Stand-Up India** | SIDBI / Ministry of Finance | ₹10 Lakh to ₹1 Crore for Women & SC/ST enterprises | [standupmitra.in](https://www.standupmitra.in) |
| **DAY-NRLM SHG Linkage** | Ministry of Rural Development | Collateral-free SHG credit up to ₹20 Lakh | [nrlm.gov.in](https://nrlm.gov.in) |
| **UP ODOP Margin Money** | UP State Govt (DIUP MSME) | 25% margin grant up to ₹20 Lakh for regional crafts | [diupmsme.upsdc.gov.in](https://diupmsme.upsdc.gov.in) |
| **NABARD Rural Retail Refinance** | NABARD / Regional Rural Banks | ₹1 Lakh to ₹15 Lakh refinance for village provision stores | [nabard.org](https://www.nabard.org) |

### 4. Saathi AI Advisor (Anthropic Claude 3.5 Sonnet)
- **Strict Grounding**: Context injects trade category, location, vintage in months, last 30-day itemized turnover, and upcoming APMC mandi harvest dates.
- **6-Scenario Offline Fallback Net**: If an external API key is absent or rate-limited, the advisory gracefully defaults to data-grounded guidance for festive stock planning, udhaar recovery, margin optimization, and MUDRA equipment loans.
- **Transparency Drawer**: "Inspect Data Fed to AI" allows judges to view the exact JSON payload passed to the model.

### 5. Bankable Loan Application Dossier
- 1-click printable Priority Sector Lending (PSL) statement.
- Structured according to the **RBI Master Direction on Priority Sector Lending (FIDD.CO.Plan.BC.5/04.09.01/2020-21)**.
- Features formal verification stamp, unique document control ID (`VS-DOC-...`), monthly cash turnover audit, and credit officer underwriting checklist.
- Formatted with print-optimized CSS for paper printing or PDF export.

---

## 🧪 Verification & Test Suite

The project includes an automated test suite running with Node.js built-in test runner:

```bash
npm --prefix server test
```

### Test Coverage (11 / 11 Passing):
- **AI Advisory Offline Fallback Suite**:
  - Festival query triggers grounded festive stock advisory without API key
  - Loan enquiry triggers MUDRA advisory with alternative credit score grounding
- **Credit Scoring Service Suite**:
  - Baseline score calculated within valid [300, 850] range
  - Unpaid udhaar significantly penalizes the discipline factor
  - Total score is mathematically clamped within [300, 850]
- **Government Scheme Matcher Suite**:
  - Scheme library returns all 10 verified statutory schemes with valid URLs
  - Kirana shop matches MUDRA Kishor and NABARD Refinance
  - Tailoring/Handicrafts enterprise matches PM Vishwakarma

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

---

<div align="center">
  <sub>Built with ❤️ for Indian Rural Micro-Entrepreneurs • Smart India Hackathon 2026</sub>
</div>
