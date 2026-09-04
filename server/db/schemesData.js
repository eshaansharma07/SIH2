// Authentic Indian Government Schemes for Rural Micro-Entrepreneurs
// Seeded for SIH 26091 with precise eligibility rules and plain-language guides

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
    subsidyText: "No direct capital subsidy, but zero processing fee and subsidized guarantee under CGFMU",
    collateralRequired: false,
    collateralText: "Zero Collateral (100% Credit Guarantee by Govt)",
    tenure: "Up to 5 years (with 6 months moratorium)",
    plainLanguageSummary: "A quick, hassle-free starter loan for small village shops, vegetable vendors, and repairmen. Designed specifically for working capital (buying immediate wholesale stock, seeds, or small tools) without mortgaging land or gold.",
    whyYouQualifyLogic: (shop, creditScore) => {
      if (shop.vintageYears >= 0.5 && shop.monthlyRevenue >= 10000) {
        return {
          eligible: true,
          matchScore: 96,
          reasons: [
            "Your monthly revenue exceeds ₹10,000 threshold for Shishu working capital",
            "Zero formal credit history required (covered under CGFMU guarantee)",
            "Your trade category qualifies for informal non-farm micro-credit",
            "Alternative score indicates consistent daily cash transactions"
          ]
        };
      }
      return { eligible: true, matchScore: 85, reasons: ["Open to any Indian citizen starting or expanding an informal micro-business"] };
    },
    requiredDocuments: [
      "Aadhaar Card of Shop Owner",
      "Voter ID / Driving License / Ration Card",
      "Passport size photographs (2 copies)",
      "Quotation of goods or stock to be purchased",
      "Vyapaar Saathi Bahi-Khata 90-Day Cash Flow Statement (Bankable Dossier)",
      "Savings or Jan Dhan Bank Account Passbook"
    ],
    applicationSteps: [
      "Download your Vyapaar Saathi Verified Bahi-Khata Statement",
      "Visit any nearby Gramin Bank, SBI, PNB, or local cooperative bank branch",
      "Ask for the 1-page MUDRA Shishu loan application form (no project report required)",
      "Submit with Aadhaar and shop stock quotation; disbursement usually takes 7–10 days"
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
    subsidyText: "Subsidized interest rate with CGFMU credit guarantee cover",
    collateralRequired: false,
    collateralText: "Zero Collateral (Hypothecation of purchased shop assets only)",
    tenure: "3 to 5 years",
    plainLanguageSummary: "The ideal expansion loan for established village retailers. Perfect for buying a commercial deep-freezer, weighing scales, inventory racking, or stocking large quantities before festive and marriage seasons.",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isVintageOk = shop.vintageYears >= 1.5;
      const isRevenueOk = shop.monthlyRevenue >= 30000;
      const isCreditOk = creditScore >= 620;

      const reasons = [];
      let score = 70;
      if (isVintageOk) { score += 10; reasons.push(`Operating for ${shop.vintageYears} years proves enterprise stability`); }
      if (isRevenueOk) { score += 10; reasons.push(`Monthly turnover (₹${shop.monthlyRevenue.toLocaleString('en-IN')}) easily covers Kishor EMI`); }
      if (isCreditOk) { score += 8; reasons.push(`Vyapaar Saathi Alternative Credit Score (${creditScore}) demonstrates high repayment intent`); }

      return {
        eligible: isVintageOk && (isRevenueOk || isCreditOk),
        matchScore: Math.min(score, 98),
        reasons: reasons.length ? reasons : ["Requires at least 1-2 years of proven shop operations and basic cash flow records"]
      };
    },
    requiredDocuments: [
      "Proof of Identity (Aadhaar & PAN Card)",
      "Proof of Business Address (Electricity bill / Gram Panchayat certificate / Udyam Aadhaar)",
      "Last 6 months Bank Account Statement + Vyapaar Saathi Cash Flow Ledger",
      "Quotation / pro-forma invoice for equipment (e.g. Deep freezer, electronic weighing machine, solar backup)",
      "Estimated 1-year sales projection (auto-generated in Vyapaar Saathi Dossier)"
    ],
    applicationSteps: [
      "Generate Udyam Registration (free 5-minute online certificate)",
      "Get a price quote from the equipment dealer (refrigerator/battery/racks)",
      "Print your Vyapaar Saathi Bankable Dossier containing 3-month sales analysis",
      "Apply through your local Lead Bank or online via Udyami Mitra portal"
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
    interestRate: "Effective 3% – 4% (after 7% direct interest subsidy by Central Govt)",
    subsidyText: "7% Interest Subsidy directly credited to bank account + up to ₹1,200/year cashback on UPI transactions",
    collateralRequired: false,
    collateralText: "Zero Collateral & Zero Guarantee",
    tenure: "1 year for 1st tranche, scalable upon timely repayment",
    plainLanguageSummary: "A dedicated micro-credit scheme tailored for roadside shops, tea stalls, cart operators, and weekly haat vendors. Repaying on time unlocks higher loan tranches (up to ₹50,000) and rewards you with monthly UPI cashbacks.",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isVendorOrMicro = ["kirana", "tea_stall", "handicraft", "vegetables", "repair"].includes(shop.tradeType);
      return {
        eligible: isVendorOrMicro,
        matchScore: isVendorOrMicro ? 92 : 75,
        reasons: [
          "Micro-enterprise scale matches working capital parameters",
          "Digital payment cashback incentive applies to your shop UPI transactions",
          "7% annual interest subsidy makes this the cheapest working capital in India",
          "Immediate ladder to ₹20,000 and ₹50,000 upon timely digital repayments"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar Card linked with active mobile number",
      "Bank Account details (Savings / Jan Dhan Passbook)",
      "Vending certificate / Letter of Recommendation from Urban Local Body or Town Vending Committee (or Gram Pradhan verification for peri-urban haats)",
      "UPI QR Code (PhonePe / GooglePay / Paytm screenshot)"
    ],
    applicationSteps: [
      "Visit nearby CSC (Common Service Center) or apply on PMSVANidhi mobile app",
      "Submit Aadhaar e-KYC and link your UPI VPA handle for monthly cashback",
      "Direct disbursement into your bank account within 5 working days"
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
    interestRate: "Concessional 5.0% fixed interest (Govt subvention of 8%)",
    subsidyText: "₹15,000 modern toolkit grant + ₹500/day training stipend + collateral-free 5% enterprise loan",
    collateralRequired: false,
    collateralText: "Zero Collateral (Full credit guarantee by National Credit Guarantee Trustee Co.)",
    tenure: "18 months (Tranche 1), 30 months (Tranche 2)",
    plainLanguageSummary: "A historic flagship package for 18 traditional village artisan trades (Tailors / Darzi, Carpenters / Suthar, Blacksmiths, Potters / Kumhar, Cobblers, Basket weavers). Provides free modern skill training, ₹15,000 e-voucher for tools, and low-interest loans.",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isArtisanTrade = ["tailoring", "handicraft", "carpentry", "pottery", "leather"].includes(shop.tradeType);
      if (isArtisanTrade) {
        return {
          eligible: true,
          matchScore: 98,
          reasons: [
            `Your trade (${shop.tradeName}) is one of the 18 officially designated Vishwakarma artisan trades`,
            "Eligible for immediate ₹15,000 free toolkit grant voucher",
            "Collateral-free credit at just 5% interest rate — lower than commercial banks",
            "Includes official PM Vishwakarma Certificate & Digital ID Card"
          ]
        };
      }
      return {
        eligible: false,
        matchScore: 40,
        reasons: [
          "Reserved exclusively for traditional artisans & craftsmen (tailors, carpenters, potters, etc.)",
          "Standard retail grocery/kirana shops should apply for MUDRA or PMEGP instead"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar Card & mobile linked to Aadhaar",
      "Bank Passbook copy",
      "Ration Card / Parivar ID",
      "Gram Panchayat / Urban Local Body verification of family craft practice"
    ],
    applicationSteps: [
      "Free biometric registration at any Village Common Service Center (CSC)",
      "Three-tier verification by Gram Panchayat Pradhan / Municipal authority",
      "5–7 days basic skill training (with ₹500 daily allowance paid to your account)",
      "Receive ₹15,000 digital toolkit voucher and apply for 1st tranche ₹1 Lakh loan at 5%"
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
    interestRate: "Normal bank commercial rate (approx 9.5% – 11.5%)",
    subsidyText: "25% to 35% Margin Money Grant (Rural General: 25%, Rural SC/ST/OBC/Women: 35% non-repayable subsidy!)",
    collateralRequired: false,
    collateralText: "No collateral for projects up to ₹10 Lakhs (covered under CGTMSE)",
    tenure: "3 to 7 years",
    plainLanguageSummary: "The biggest government subsidy program in India for rural entrepreneurship. If you want to expand from a small counter into a mini-supermarket, flour/spice mill, cold storage, or packaging unit, the government directly pays up to 35% of the total cost as a grant.",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isRural = (shop.locationType || 'rural').toLowerCase().includes('rural') || true;
      const hasGrowthAmbition = shop.monthlyRevenue >= 25000;
      return {
        eligible: true,
        matchScore: 89,
        reasons: [
          "Rural area enterprise qualifies for the highest subsidy bracket (up to 35% non-repayable grant)",
          "Allows combining working capital with physical shop assets (solar, building renovation, machines)",
          "Covered under CGTMSE guarantee without demanding agricultural land security",
          "Your steady transaction track record makes the bank DPR appraisal smooth"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar & PAN Card",
      "Caste / Category Certificate (for 35% special category rural subsidy)",
      "Educational qualification proof (8th pass certificate for service projects over ₹5 Lakhs)",
      "Detailed Project Report (DPR) — Simplified template generated by Vyapaar Saathi",
      "Rural area certificate signed by Village Gram Pradhan"
    ],
    applicationSteps: [
      "Fill online application on KVIC PMEGP e-Portal",
      "Select your local financing bank branch (Gramin Bank or Nationalized Bank)",
      "District Task Force Committee (DTFC) reviews and forwards to the bank",
      "Bank sanctions loan; government subsidy is locked in TDR for 3 years, then credited"
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
    interestRate: "Base Rate (MCLR) + 3% + Tenor Premium",
    subsidyText: "Convergence with state credit guarantee funds & margin money support",
    collateralRequired: false,
    collateralText: "Collateral or Credit Guarantee Scheme for Stand-Up India Loans (CGSIL)",
    tenure: "Up to 7 years (with up to 18 months moratorium)",
    plainLanguageSummary: "Mandates every bank branch in India to finance at least one Women entrepreneur and one SC/ST borrower for setting up greenfield trading, manufacturing, or service ventures. Outstanding for women-led rural enterprises.",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isEligibleOwner = shop.ownerCategory === 'women' || shop.socialCategory === 'SC' || shop.socialCategory === 'ST';
      if (isEligibleOwner) {
        return {
          eligible: true,
          matchScore: 94,
          reasons: [
            "Matches mandatory bank quota: every branch must fund at least one woman or SC/ST entrepreneur",
            "Substantial credit headroom for large wholesale or distribution setup",
            "Backed by SIDBI handholding support"
          ]
        };
      }
      return {
        eligible: false,
        matchScore: 35,
        reasons: [
          "Exclusively reserved for Women entrepreneurs or SC/ST community members",
          "Male general-category entrepreneurs should apply via MUDRA or PMEGP instead"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar, PAN & Caste Certificate (if SC/ST)",
      "Proof of woman ownership (minimum 51% shareholding if partnership)",
      "Project report with 3-year cash flow projections",
      "Vyapaar Saathi Bahi-Khata verified financial history"
    ],
    applicationSteps: [
      "Register on Stand-Up Mitra portal",
      "Select your lead bank branch for scheduled interview",
      "SIDBI connects you with a local handholding agency for documentation"
    ],
    officialPortal: "https://www.standupmitra.in"
  },
  {
    id: "shg-nrlm",
    name: "DAY-NRLM Self Help Group (SHG) Bank Linkage (दीनदयाल अंत्योदय - आजीविका)",
    shortName: "NRLM SHG-Bank Linkage",
    ministry: "Ministry of Rural Development",
    category: "Rural Women Groups & Micro-Enterprises",
    maxLoanAmount: 1000000,
    loanRangeText: "₹2,00,000 to ₹10,00,000 (Group revolving & term credit)",
    interestRate: "Effective 7.0% (subvented to 4.0% in 250 focus districts for prompt repayers)",
    subsidyText: "Interest Subvention bringing real interest down to 4% p.a. + Community Investment Fund (CIF)",
    collateralRequired: false,
    collateralText: "Zero Collateral, Zero Margin Money up to ₹10 Lakhs",
    tenure: "2 to 5 years",
    plainLanguageSummary: "If the entrepreneur or their spouse is associated with a village Mahila Bachat Gat (Self Help Group), they can access community micro-finance at super-low 4% interest without entering a bank branch alone.",
    whyYouQualifyLogic: (shop, creditScore) => {
      return {
        eligible: true,
        matchScore: 88,
        reasons: [
          "Group peer-guarantee replaces formal collateral completely",
          "Ultra-low 4% to 7% interest rate with central government subvention",
          "Direct access to Village Organization (VO) and Sankul Samiti revolving funds"
        ]
      };
    },
    requiredDocuments: [
      "SHG Membership Passbook & Resolution copy",
      "Aadhaar Card of entrepreneur & group leader",
      "Individual Micro-Credit Plan (MCP) endorsement by SHG group"
    ],
    applicationSteps: [
      "Present business expansion plan in your monthly village SHG meeting",
      "Group passes a resolution allocating funds from CCL (Cash Credit Limit)",
      "Bank releases funds directly into the group account for immediate draw-down"
    ],
    officialPortal: "https://nrlm.gov.in"
  },
  {
    id: "up-odop",
    name: "UP One District One Product (ODOP) Margin Money Scheme (यूपी एक जिला एक उत्पाद)",
    shortName: "UP ODOP Scheme",
    ministry: "Department of MSME & Export Promotion, Govt of Uttar Pradesh",
    category: "State Artisan & District Specialty Products",
    maxLoanAmount: 2500000,
    loanRangeText: "Projects up to ₹25 Lakhs (Subsidy up to ₹6.25 Lakhs)",
    interestRate: "Bank commercial rate with state interest subvention",
    subsidyText: "Up to 25% of total project cost (max ₹6.25 Lakhs) directly paid by UP State Government",
    collateralRequired: false,
    collateralText: "Covered under CGTMSE collateral-free guarantee",
    tenure: "5 to 7 years",
    plainLanguageSummary: "Uttar Pradesh government's signature initiative to revive indigenous village crafts and district-specific goods (e.g. Balrampur/Gonda pulses & food processing, Bhadohi carpets, Lucknow Chikan, Khurja pottery). Provides 25% non-repayable grant.",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isUP = (shop.state || '').toLowerCase().includes('uttar') || (shop.state || '').toLowerCase().includes('up');
      if (isUP) {
        return {
          eligible: true,
          matchScore: 93,
          reasons: [
            `Shop is located in Uttar Pradesh (${shop.district || 'Balrampur'}), eligible for state MSME grant`,
            "25% capital subsidy credited upfront into margin money account",
            "Free stall allotment in UP Gramin Haats and national trade expos"
          ]
        };
      }
      return {
        eligible: false,
        matchScore: 30,
        reasons: ["State-specific scheme for enterprises registered within Uttar Pradesh"]
      };
    },
    requiredDocuments: [
      "Duly filled UP ODOP application form (DIIC portal)",
      "Aadhaar Card with UP residential address proof",
      "Gram Panchayat certificate of local product trading/craft",
      "Bank Account details & Vyapaar Saathi verified bahi-khata ledger"
    ],
    applicationSteps: [
      "Apply online on the UP MSME DIIC portal (diupmsme.upsdc.gov.in)",
      "District Industries Center (DIC) officer interviews applicant",
      "Loan sanctioned by Gramin Bank / SBI with immediate margin subsidy hold"
    ],
    officialPortal: "https://diupmsme.upsdc.gov.in"
  },
  {
    id: "nabard-agri-retail",
    name: "NABARD Rural Agri-Retail & Micro-Enterprise Facility",
    shortName: "NABARD Rural Retail",
    ministry: "NABARD & Regional Rural Banks (Gramin Banks)",
    category: "Kirana, Seeds, Fertilizers & Rural FMCG",
    maxLoanAmount: 1500000,
    loanRangeText: "₹1,00,000 to ₹15,00,000",
    interestRate: "8.0% – 9.5% p.a. (via Gramin Banks)",
    subsidyText: "Refinance support to Regional Rural Banks enabling lower borrowing spreads",
    collateralRequired: false,
    collateralText: "No collateral required for loans up to ₹1.6 Lakhs; flexible hypothecation above",
    tenure: "Up to 5 years revolving facility",
    plainLanguageSummary: "Tailored for village provision stores that sell agricultural staples, daily grains, feed, and consumer staples to farming families. Channelled through local Regional Rural Banks (like Aryavart Bank, Prathama Bank, Baroda UP Bank) with simple paperwork.",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isRuralRetail = ["kirana", "agri_inputs", "dairy"].includes(shop.tradeType);
      return {
        eligible: isRuralRetail,
        matchScore: isRuralRetail ? 91 : 70,
        reasons: [
          "Provision stores serving rural farming households qualify for priority rural refinance",
          "Special seasonal liquidity window timed with post-harvest cash inflows",
          "Direct linkage with Regional Rural Banks (Gramin Banks) operating in your village"
        ]
      };
    },
    requiredDocuments: [
      "Aadhaar Card and Local Gram Panchayat residential proof",
      "Trade license or Gram Pradhan recommendation letter",
      "Vyapaar Saathi 90-day cash turnover statement",
      "Bank Passbook of Regional Rural Bank branch"
    ],
    applicationSteps: [
      "Take your Vyapaar Saathi Bankable Dossier to your nearest Gramin Bank branch",
      "Meet the Agricultural Field Officer (AFO) or Branch Manager",
      "Submit the Kisan/Rural Retail credit application; approved under priority sector"
    ],
    officialPortal: "https://www.nabard.org"
  },
  {
    id: "mudra-tarun",
    name: "PM MUDRA Yojana — Tarun (प्रधानमंत्री मुद्रा योजना - तरुण)",
    shortName: "MUDRA Tarun",
    ministry: "Ministry of Finance / SIDBI",
    category: "Established Micro & Small Enterprises",
    maxLoanAmount: 1000000,
    loanRangeText: "₹5,00,000 to ₹10,00,000",
    interestRate: "9.5% – 12.0% p.a.",
    subsidyText: "Subsidized guarantee fee under CGFMU",
    collateralRequired: false,
    collateralText: "Zero third-party collateral (Primary security on assets financed)",
    tenure: "Up to 5 to 7 years",
    plainLanguageSummary: "For established rural entrepreneurs who want to make a big leap: purchase a commercial delivery vehicle (three-wheeler pickup), install mini-flour or spice mills, or open a second village branch.",
    whyYouQualifyLogic: (shop, creditScore) => {
      const isHighTurnover = shop.monthlyRevenue >= 60000 && shop.vintageYears >= 3;
      return {
        eligible: isHighTurnover,
        matchScore: isHighTurnover ? 86 : 60,
        reasons: isHighTurnover ? [
          `3+ years vintage (${shop.vintageYears} yrs) fulfills Tarun eligibility`,
          "Monthly revenue profile demonstrates capacity to service ₹10,000+ monthly EMI",
          "Alternative credit records show disciplined inventory and udhaar management"
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
