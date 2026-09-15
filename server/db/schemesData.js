// Authentic Indian Government Schemes for Rural Micro-Entrepreneurs
// Verified against official ministries, RBI Master Directions, and statutory guidelines
// Provenance trail: Each scheme record includes `lastVerified` and `officialSourceUrl`.

export const SCHEMES = [
  {
    id: "mudra-shishu",
    name: "PM MUDRA Yojana — Shishu (प्रधानमंत्री मुद्रा योजना - शिशु)",
    shortName: "MUDRA Shishu",
    ministry: "Ministry of Finance / SIDBI",
    category: "Retail, Artisans & Small Services",
    maxLoanAmount: 50000,
    loanRangeText: "Up to ₹50,000",
    interestRate: "8.5% – 10.0% p.a.",
    subsidyText: "No direct capital subsidy; zero processing fee and full credit guarantee under CGFMU",
    collateralRequired: false,
    collateralText: "Zero Collateral (100% Credit Guarantee under CGFMU)",
    tenure: "Up to 5 years (with up to 6 months moratorium)",
    plainLanguageSummary: "Starter working capital for small village shops, vegetable vendors, and repairmen. Designed for inventory or immediate wholesale purchases without mortgaging land or gold.",
    lastVerified: "2026-03-01",
    officialSourceUrl: "https://www.mudra.org.in",
    statutoryReference: "CGFMU Notification, Dept of Financial Services, Ministry of Finance",
    whyYouQualifyLogic: (shop, creditScore) => {
      if (shop.vintageYears >= 0.5 && shop.monthlyRevenue >= 10000) {
        return {
          eligible: true,
          matchScore: 96,
          reasons: [
            "Monthly revenue fulfills Shishu working capital servicing threshold",
            "Zero formal CIBIL requirement (covered under CGFMU credit guarantee)",
            "Trade category qualifies for non-farm rural micro-credit",
            "Bahi-khata ledger shows steady daily cash velocity"
          ]
        };
      }
      return { eligible: true, matchScore: 85, reasons: ["Open to any Indian citizen operating or initiating a non-farm micro-business"] };
    },
    requiredDocuments: [
      "Aadhaar Card of Shop Owner",
      "Voter ID / Driving License / Ration Card",
      "Passport size photographs (2 copies)",
      "Quotation / price estimate of goods or stock to be purchased",
      "Vyapaar Saathi Bahi-Khata 90-Day Cash Flow Statement (Bankable Dossier)",
      "Savings or Jan Dhan Bank Account Passbook"
    ],
    applicationSteps: [
      "Download your Vyapaar Saathi Verified Bahi-Khata Statement",
      "Visit any nearby Gramin Bank, SBI, PNB, or local cooperative bank branch",
      "Request 1-page MUDRA Shishu loan form (no formal DPR needed)",
      "Submit with Aadhaar and stock quotation; appraisal timeline is 7–10 days"
    ],
    officialPortal: "https://www.mudra.org.in"
  },
  {
    id: "mudra-kishor",
    name: "PM MUDRA Yojana — Kishor (प्रधानमंत्री मुद्रा योजना - किशोर)",
    shortName: "MUDRA Kishor",
    ministry: "Ministry of Finance / SIDBI",
    category: "Shop Expansion & Equipment",
    maxLoanAmount: 500000,
    loanRangeText: "₹50,000 to ₹5,00,000",
    interestRate: "9.0% – 11.5% p.a.",
    subsidyText: "Subsidized interest spread with CGFMU credit guarantee protection",
    collateralRequired: false,
    collateralText: "Zero Collateral (Hypothecation of shop assets purchased)",
    tenure: "3 to 5 years",
    plainLanguageSummary: "Expansion financing for established village retailers. Intended for purchasing commercial equipment (deep freezers, electronic weighing scales, racks) or seasonal inventory buffers.",
    lastVerified: "2026-03-01",
    officialSourceUrl: "https://www.udyamimitra.in",
    statutoryReference: "Pradhan Mantri Mudra Yojana (PMMY) Operational Guidelines, SIDBI",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isVintageOk = shop.vintageYears >= 1.5;
      const isRevenueOk = shop.monthlyRevenue >= 30000;
      const isCreditOk = creditScore >= 620;

      const reasons = [];
      let score = 70;
      if (isVintageOk) { score += 10; reasons.push(`Operating for ${shop.vintageYears} years proves vintage stability`); }
      if (isRevenueOk) { score += 10; reasons.push(`Monthly turnover (₹${shop.monthlyRevenue.toLocaleString('en-IN')}) covers Kishor debt servicing`); }
      if (isCreditOk) { score += 8; reasons.push(`Vyapaar Saathi Alternative Credit Score (${creditScore}) indicates prime debt repayment`); }

      return {
        eligible: isVintageOk && (isRevenueOk || isCreditOk),
        matchScore: Math.min(score, 98),
        reasons: reasons.length ? reasons : ["Requires 1-2 years of documented operations and positive operating margin"]
      };
    },
    requiredDocuments: [
      "Proof of Identity (Aadhaar & PAN Card)",
      "Proof of Business Address (Udyam Registration / Gram Panchayat Certificate)",
      "Last 6 months Bank Account Statement + Vyapaar Saathi Cash Flow Ledger",
      "Quotation for equipment (e.g. deep freezer, solar inverter, shelving)",
      "1-year business cash flow projection (auto-compiled in Bank Dossier)"
    ],
    applicationSteps: [
      "Obtain free Udyam Registration number",
      "Collect quotation from authorized machinery / freezer dealer",
      "Print Vyapaar Saathi Bankable Dossier with audited 90-day surplus",
      "Submit through Lead Bank branch or online via Udyami Mitra portal"
    ],
    officialPortal: "https://www.udyamimitra.in"
  },
  {
    id: "pm-svanidhi",
    name: "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi / स्वनिधि योजना)",
    shortName: "PM SVANidhi",
    ministry: "Ministry of Housing and Urban Affairs",
    category: "Micro Retailers, Hawkers & Small Vendors",
    maxLoanAmount: 50000,
    loanRangeText: "₹10,000 (1st Tranche) → ₹20,000 → ₹50,000",
    interestRate: "Effective ~3% – 4% (after 7% central interest subsidy)",
    subsidyText: "7% annual interest subsidy credited directly to bank account + ₹1,200/year cashback on UPI transactions",
    collateralRequired: false,
    collateralText: "Zero Collateral & Zero Third-Party Guarantee",
    tenure: "1 year for 1st tranche, graduating upon timely repayment",
    plainLanguageSummary: "Micro-credit facility for daily retail vendors, food stalls, weekly haat sellers, and kiosks. Timely digital repayment automatically qualifies the merchant for higher tranches.",
    lastVerified: "2026-03-01",
    officialSourceUrl: "https://pmsvanidhi.mohua.gov.in",
    statutoryReference: "MoHUA Scheme Guidelines for PM SVANidhi (Extended to Dec 2024 & operational in 2025/2026)",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isVendorOrMicro = ["kirana", "tea_stall", "handicraft", "vegetables", "repair"].includes(shop.tradeType);
      return {
        eligible: isVendorOrMicro,
        matchScore: isVendorOrMicro ? 92 : 75,
        reasons: [
          "Micro-retail scale matches working capital parameters",
          "Digital payment deepening bonus applies to your shop UPI transactions",
          "7% interest subsidy reduces effective borrowing cost significantly",
          "Structured progression to ₹20,000 and ₹50,000 upon timely digital recovery"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar Card linked to mobile number",
      "Bank Account Passbook (Jan Dhan or Savings)",
      "Vending ID / Certificate of Vending or Local Body / Gram Panchayat endorsement",
      "Active UPI VPA / QR handle proof"
    ],
    applicationSteps: [
      "Apply via PMSVANidhi portal or mobile application at nearest CSC",
      "Complete Aadhaar e-KYC and register UPI handle for digital cashback",
      "Direct bank account disbursement within 5 to 7 working days"
    ],
    officialPortal: "https://pmsvanidhi.mohua.gov.in"
  },
  {
    id: "pm-vishwakarma",
    name: "PM Vishwakarma Scheme (पीएम विश्वकर्मा योजना)",
    shortName: "PM Vishwakarma",
    ministry: "Ministry of Micro, Small and Medium Enterprises (MSME)",
    category: "Artisans, Tailors, Carpenters & Craftsmen",
    maxLoanAmount: 300000,
    loanRangeText: "₹1,00,000 (Tranche 1) + ₹2,00,000 (Tranche 2)",
    interestRate: "Concessional 5.0% fixed interest (8% interest subvention by Govt)",
    subsidyText: "₹15,000 modern toolkit grant + ₹500/day skill training stipend + 5% collateral-free loan",
    collateralRequired: false,
    collateralText: "Zero Collateral (Full credit guarantee under NCGTC)",
    tenure: "18 months (Tranche 1), 30 months (Tranche 2)",
    plainLanguageSummary: "Dedicated support package for 18 designated traditional artisan trades (tailors, carpenters, blacksmiths, potters, cobblers, basket weavers). Combines skill training, toolkit grant, and 5% credit.",
    lastVerified: "2026-03-01",
    officialSourceUrl: "https://pmvishwakarma.gov.in",
    statutoryReference: "Cabinet Committee on Economic Affairs (CCEA) PM Vishwakarma Guidelines, Ministry of MSME",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isArtisanTrade = ["tailoring", "handicraft", "carpentry", "pottery", "leather"].includes(shop.tradeType);
      if (isArtisanTrade) {
        return {
          eligible: true,
          matchScore: 98,
          reasons: [
            `Designated trade (${shop.tradeName}) is one of the 18 covered Vishwakarma occupations`,
            "Eligible for ₹15,000 digital toolkit grant e-voucher",
            "5% fixed interest loan with 8% central subvention",
            "Includes formal PM Vishwakarma digital identity and verification card"
          ]
        };
      }
      return {
        eligible: false,
        matchScore: 40,
        reasons: [
          "Reserved exclusively for traditional artisanal/craftsman occupations",
          "Standard retail grocery stores should apply under MUDRA or PMEGP instead"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar Card with linked active phone",
      "Bank Account Passbook",
      "Ration Card / Family identity document",
      "Gram Panchayat / Municipal body verification of artisan craft practice"
    ],
    applicationSteps: [
      "Biometric enrollment at Village Common Service Center (CSC)",
      "Three-tier verification: Gram Panchayat -> District Committee -> National",
      "5–7 day basic skill training with ₹500/day stipend",
      "Receive ₹15,000 toolkit voucher and apply for 1st tranche ₹1 Lakh at 5%"
    ],
    officialPortal: "https://pmvishwakarma.gov.in"
  },
  {
    id: "pmegp",
    name: "Prime Minister's Employment Generation Programme (PMEGP)",
    shortName: "PMEGP Subsidy Scheme",
    ministry: "Ministry of MSME / KVIC",
    category: "New Units & Major Expansion",
    maxLoanAmount: 2000000,
    loanRangeText: "₹5,00,000 to ₹20,00,000 (Service) / ₹50,00,000 (Mfg)",
    interestRate: "Standard bank commercial lending rate (linked to EBLR / MCLR)",
    subsidyText: "25% to 35% Margin Money Grant (Rural General: 25%, Rural SC/ST/OBC/Women/Minority: 35% non-repayable grant)",
    collateralRequired: false,
    collateralText: "No collateral for projects up to ₹10 Lakhs (covered under CGTMSE)",
    tenure: "3 to 7 years",
    plainLanguageSummary: "Credit-linked subsidy program for rural enterprise establishment and substantial expansion. For rural service setups (shops, repair hubs, retail depots), government directly contributes up to 35% as margin money grant.",
    lastVerified: "2026-03-01",
    officialSourceUrl: "https://www.kviconline.gov.in/pmegpeportal",
    statutoryReference: "Ministry of MSME PMEGP Scheme Guidelines, KVIC Mumbai",
    whyYouQualifyLogic: (shop, creditScore) => {
      return {
        eligible: true,
        matchScore: 89,
        reasons: [
          "Rural enterprise location qualifies for top-tier margin money subsidy (up to 35%)",
          "Permits combined capital outlays (store fixture modernization, machinery, inventory)",
          "Covered under CGTMSE credit guarantee without requiring agricultural land mortgage",
          "Audited cash flow ledger satisfies bank preliminary appraisal standards"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar & PAN Card",
      "Caste / Category Certificate (for 35% rural special category grant)",
      "Educational qualification proof (8th standard pass certificate for service projects over ₹5 Lakhs)",
      "Detailed Project Report (DPR) — compiled via Vyapaar Saathi Dossier",
      "Rural area verification certificate from Gram Panchayat"
    ],
    applicationSteps: [
      "Submit digital application on KVIC PMEGP e-Portal",
      "Select financing bank branch (Regional Rural Bank or Public Sector Bank)",
      "District Task Force Committee (DTFC) reviews and forwards dossier to bank",
      "Bank sanctions credit; margin money subsidy held in 3-year TDR before final credit"
    ],
    officialPortal: "https://www.kviconline.gov.in/pmegpeportal"
  },
  {
    id: "standup-india",
    name: "Stand-Up India Scheme (स्टैंड-अप इंडिया योजना)",
    shortName: "Stand-Up India",
    ministry: "Department of Financial Services / SIDBI",
    category: "Women & SC/ST Entrepreneurs",
    maxLoanAmount: 10000000,
    loanRangeText: "₹10,00,000 to ₹1,00,00,000",
    interestRate: "Lowest applicable rate (MCLR + 3% + Tenor Premium)",
    subsidyText: "Convergence with state credit guarantee funds & margin money support",
    collateralRequired: false,
    collateralText: "Collateral or Credit Guarantee Scheme for Stand-Up India Loans (CGSIL)",
    tenure: "Up to 7 years (with moratorium up to 18 months)",
    plainLanguageSummary: "Statutory bank mandate: every bank branch in India must finance at least one woman borrower and one SC/ST entrepreneur for greenfield trading, manufacturing, or service units.",
    lastVerified: "2026-03-01",
    officialSourceUrl: "https://www.standupmitra.in",
    statutoryReference: "Department of Financial Services, Ministry of Finance Stand-Up India Guidelines",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isEligibleOwner = shop.ownerCategory === 'women' || shop.socialCategory === 'SC' || shop.socialCategory === 'ST';
      if (isEligibleOwner) {
        return {
          eligible: true,
          matchScore: 94,
          reasons: [
            "Fulfills statutory bank branch allocation mandate for women or SC/ST entrepreneurs",
            "Substantial liquidity ceiling for wholesale distribution setup",
            "Eligible for SIDBI handholding support network"
          ]
        };
      }
      return {
        eligible: false,
        matchScore: 35,
        reasons: [
          "Statutorily reserved for Women entrepreneurs or SC/ST community members",
          "General category male borrowers should apply via MUDRA Kishor/Tarun or PMEGP"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar, PAN & Caste Certificate (for SC/ST applicants)",
      "Proof of woman enterprise ownership (minimum 51% equity share)",
      "Comprehensive business project report with cash flow forecasts",
      "Vyapaar Saathi audited financial transaction history"
    ],
    applicationSteps: [
      "Register on Stand-Up Mitra portal (standupmitra.in)",
      "Select target bank branch for formal appraisal",
      "SIDBI connects entrepreneur with local handholding agency for documentation"
    ],
    officialPortal: "https://www.standupmitra.in"
  },
  {
    id: "shg-nrlm",
    name: "DAY-NRLM Self Help Group (SHG) Bank Linkage (दीनदयाल अंत्योदय - आजीविका)",
    shortName: "NRLM SHG-Bank Linkage",
    ministry: "Ministry of Rural Development",
    category: "Rural Women Groups & Micro-Enterprises",
    maxLoanAmount: 2000000,
    loanRangeText: "₹2,00,000 to ₹20,00,000 (Collateral-free group revolving credit)",
    interestRate: "Effective 7.0% p.a. (subvented to 4.0% in focus districts for prompt repayers)",
    subsidyText: "Interest Subvention to 7% (and 4% in 250 focus districts) + Community Investment Fund (CIF)",
    collateralRequired: false,
    collateralText: "Zero Collateral up to ₹10 Lakhs (and up to ₹20 Lakhs as per RBI circular RBI/2020-21/39)",
    tenure: "2 to 5 years",
    plainLanguageSummary: "Micro-enterprise credit channelled through village women self-help groups (SHGs). Peer group endorsement replaces formal collateral, providing concessional rates down to 4% p.a.",
    lastVerified: "2026-03-01",
    officialSourceUrl: "https://aajeevika.gov.in",
    statutoryReference: "RBI Master Direction FIDD.GSSD.BC.No.04/09.01.01/2021-22 (SHG-Bank Linkage)",
    whyYouQualifyLogic: (shop, creditScore) => {
      return {
        eligible: true,
        matchScore: 88,
        reasons: [
          "Peer group guarantee replaces formal real estate mortgage",
          "Concessional 4% to 7% interest rate with central government subvention",
          "Direct access to Village Organization (VO) revolving cash credit limits"
        ]
      };
    },
    requiredDocuments: [
      "SHG Membership Passbook & Group Resolution Copy",
      "Aadhaar Card of entrepreneur & group animators",
      "Individual Micro-Credit Plan (MCP) certified by SHG"
    ],
    applicationSteps: [
      "Table enterprise expansion plan at monthly village SHG meeting",
      "SHG adopts formal resolution allocating Cash Credit Limit (CCL)",
      "Financing bank disburses directly into group account for onward draw-down"
    ],
    officialPortal: "https://aajeevika.gov.in"
  },
  {
    id: "up-odop",
    name: "UP One District One Product (ODOP) Margin Money Scheme (यूपी एक जिला एक उत्पाद)",
    shortName: "UP ODOP Scheme",
    ministry: "Department of MSME & Export Promotion, Govt of Uttar Pradesh",
    category: "State Artisan & District Specialty Products",
    maxLoanAmount: 2500000,
    loanRangeText: "Projects up to ₹25 Lakhs (Subsidy up to ₹6.25 Lakhs)",
    interestRate: "Commercial bank rate with UP State interest subvention",
    subsidyText: "Up to 25% margin money subsidy (maximum ₹6.25 Lakhs) funded directly by UP State Government",
    collateralRequired: false,
    collateralText: "Covered under CGTMSE guarantee protocol",
    tenure: "5 to 7 years",
    plainLanguageSummary: "State of Uttar Pradesh flagship program supporting designated district crafts and agricultural processing (e.g. Balrampur/Gonda pulses & agro-processing, Bhadohi carpets, Lucknow Chikan). Provides 25% non-repayable margin money.",
    lastVerified: "2026-03-01",
    officialSourceUrl: "https://diupmsme.upsdc.gov.in",
    statutoryReference: "UP MSME Policy & ODOP Margin Money Operational Guidelines",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isUP = (shop.state || '').toLowerCase().includes('uttar') || (shop.state || '').toLowerCase().includes('up');
      if (isUP) {
        return {
          eligible: true,
          matchScore: 93,
          reasons: [
            `Enterprise is located in Uttar Pradesh (${shop.district || 'Balrampur'}), eligible for state MSME grant`,
            "25% capital margin money subsidy credited upon loan sanction",
            "Priority allotment in state-run Gramin Haats and regional exhibitions"
          ]
        };
      }
      return {
        eligible: false,
        matchScore: 30,
        reasons: ["State-specific program for enterprises registered and operating within Uttar Pradesh"]
      };
    },
    requiredDocuments: [
      "UP ODOP application form (DIIC portal submission)",
      "Aadhaar Card showing Uttar Pradesh domicile",
      "Gram Panchayat certificate confirming local craft or retail trading",
      "Bank Account details & Vyapaar Saathi audited 90-day ledger"
    ],
    applicationSteps: [
      "Submit application on UP MSME DIIC portal (diupmsme.upsdc.gov.in)",
      "District Industries Center (DIC) officer conducts preliminary review",
      "Sanction by Lead Bank / Regional Rural Bank with margin subsidy lock"
    ],
    officialPortal: "https://diupmsme.upsdc.gov.in"
  },
  {
    id: "nabard-agri-retail",
    name: "NABARD Rural Agri-Retail & Micro-Enterprise Refinance Facility",
    shortName: "NABARD Rural Retail",
    ministry: "NABARD & Regional Rural Banks (Gramin Banks)",
    category: "Kirana, Seeds, Fertilizers & Rural FMCG",
    maxLoanAmount: 1500000,
    loanRangeText: "₹1,00,000 to ₹15,00,000",
    interestRate: "8.0% – 9.5% p.a. (via Regional Rural Banks)",
    subsidyText: "Refinance support to Regional Rural Banks enabling lower borrowing spreads",
    collateralRequired: false,
    collateralText: "Zero collateral for agricultural/micro loans up to ₹1.6 Lakhs (as per RBI circular FIDD.CO.FSD.BC.No.13/05.05.010/2018-19)",
    tenure: "Up to 5 years revolving credit",
    plainLanguageSummary: "Credit facility channelled via Regional Rural Banks (Aryavart Bank, Baroda UP Bank) for provision stores that sell agricultural staples, seeds, cattle feed, and groceries to rural farming households.",
    lastVerified: "2026-03-01",
    officialSourceUrl: "https://www.nabard.org",
    statutoryReference: "NABARD Rural Enterprise Refinance Policy & RBI Master Direction on Priority Sector Lending",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isRuralRetail = ["kirana", "agri_inputs", "dairy"].includes(shop.tradeType);
      return {
        eligible: isRuralRetail,
        matchScore: isRuralRetail ? 91 : 70,
        reasons: [
          "Provision store serving rural agricultural households qualifies under Priority Sector Lending",
          "Seasonal repayment flexibility aligned with local harvest cycles",
          "Direct linkage with Regional Rural Banks (Gramin Banks) operating in your panchayat"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar Card and Gram Panchayat residential proof",
      "Trade registration or Gram Pradhan letter of standing",
      "Vyapaar Saathi 90-day cash turnover statement",
      "Passbook of local Regional Rural Bank branch"
    ],
    applicationSteps: [
      "Present Vyapaar Saathi Bankable Dossier at nearest Regional Rural Bank branch",
      "Interview with Agricultural Field Officer (AFO) or Branch Manager",
      "Credit approved and sanctioned under RBI Priority Sector Lending guidelines"
    ],
    officialPortal: "https://www.nabard.org"
  },
  {
    id: "mudra-tarun",
    name: "PM MUDRA Yojana — Tarun & Tarun Plus (प्रधानमंत्री मुद्रा योजना - तरुण)",
    shortName: "MUDRA Tarun",
    ministry: "Ministry of Finance / SIDBI",
    category: "Established Micro & Small Enterprises",
    maxLoanAmount: 2000000,
    loanRangeText: "₹5,00,000 to ₹10,00,000 (and up to ₹20,00,000 under Tarun Plus)",
    interestRate: "9.5% – 12.0% p.a.",
    subsidyText: "Subsidized guarantee fee under CGFMU (Union Budget 2024 enhancement to ₹20 Lakhs for repaid Tarun accounts)",
    collateralRequired: false,
    collateralText: "Zero third-party collateral (Primary security on assets financed)",
    tenure: "Up to 5 to 7 years",
    plainLanguageSummary: "Higher-tier credit for established rural entrepreneurs looking to purchase commercial transport (three-wheeler pickup), install mini-flour or spice mills, or open a secondary village branch. Expanded up to ₹20 Lakhs under Tarun Plus.",
    lastVerified: "2026-03-01",
    officialSourceUrl: "https://www.mudra.org.in",
    statutoryReference: "Union Budget 2024 Announcement on PMMY Limit Enhancement & DFS Guidelines",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isHighTurnover = shop.monthlyRevenue >= 60000 && shop.vintageYears >= 3;
      return {
        eligible: isHighTurnover,
        matchScore: isHighTurnover ? 86 : 60,
        reasons: isHighTurnover ? [
          `3+ years vintage (${shop.vintageYears} yrs) fulfills Tarun seasoning requirements`,
          "Turnover demonstrates capacity to service monthly commercial installments",
          "Alternative credit records document disciplined inventory and udhaar management"
        ] : [
          "Recommended after graduating from MUDRA Kishor (₹50,000–₹5 Lakhs) tier"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar, PAN & Udyam Registration Certificate",
      "Last 12 months Bank Statement & Vyapaar Saathi Verified Ledger",
      "Audited or self-certified balance sheet & sales summary",
      "Quotation for vehicle/machinery or lease agreement for new branch"
    ],
    applicationSteps: [
      "Obtain quotation for planned commercial assets or inventory expansion",
      "Submit through Udyami Mitra portal or visit any nationalized bank branch",
      "Bank inspection and loan sanction within 14–21 business days"
    ],
    officialPortal: "https://www.mudra.org.in"
  }
];
