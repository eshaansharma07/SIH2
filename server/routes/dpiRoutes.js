import express from 'express';
import dataStore from '../db/dataStore.js';

const router = express.Router();

const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i;

// Reusable mock data disclosures conforming to SIH guidelines
const DPI_DISCLOSURES = {
  accountAggregator: {
    isMock: true,
    protocol: 'RBI NBFC-AA Sahamati FIU/FIP v1.1',
    reason: 'Live Account Aggregator access requires regulated financial institution credentials. This simulator synthesizes bank statements directly from merchant ledger data into the Sahamati FIStatement schema.'
  },
  udyam: {
    isMock: true,
    protocol: 'Ministry of MSME Udyam Aadhaar Verification Gateway',
    reason: 'Live Udyam API access requires direct NIC/GSTN integration restricted to scheduled commercial banks. Format validation adheres to official UDYAM-XX-00-0000000 specification.'
  },
  digiLocker: {
    isMock: true,
    protocol: 'MeitY DigiLocker Requester API v2.0',
    reason: 'Simulates Aadhaar, PAN, and Trade License cryptographic authenticity verification from national identity lockers for rural MSME underwriting.'
  }
};

/**
 * POST /api/dpi/account-aggregator/consent
 * Initiates an Account Aggregator consent request
 */
router.post('/account-aggregator/consent', (req, res) => {
  try {
    const { shopId, customerVpa, fiTypes = ['DEPOSIT'], purpose = 'MSME Working Capital Underwriting' } = req.body || {};

    const consentHandle = `AA-CONSENT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    res.json({
      success: true,
      consentHandle,
      status: 'PENDING',
      consentExpiry: expiresAt,
      consentDetails: {
        shopId: shopId || 'ramesh-kirana',
        customerVpa: customerVpa || 'merchant@upi',
        fiTypes,
        purpose,
        dataConsumer: 'Vyapaar Saathi Underwriting Engine (RBI PSL Compliant)',
        frequency: { unit: 'MONTH', value: 1 }
      },
      mockDataDisclosure: DPI_DISCLOSURES.accountAggregator
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/dpi/account-aggregator/fetch
 * Pulls real 6-month transaction ledger data for shop and formats it as Sahamati FIStatement
 */
router.post('/account-aggregator/fetch', async (req, res) => {
  try {
    const { consentHandle, shopId = 'ramesh-kirana' } = req.body || {};

    const shop = (await dataStore.findShopById(shopId)) || (await dataStore.findShopById('ramesh-kirana')) || {
      id: shopId,
      name: "Ramesh's Kirana Store",
      bank_account_type: 'Aryavart Gramin Bank',
      district: 'Varanasi',
      state: 'Uttar Pradesh'
    };

    // Query real bahi-khata transactions from dataStore
    let txs = await dataStore.findTransactions({ shop_id: shop.id });
    if (!txs || txs.length === 0) {
      // Fall back to ramesh-kirana if active shop has no transactions yet
      txs = await dataStore.findTransactions({ shop_id: 'ramesh-kirana' });
    }

    // Group transactions by month (up to 6 months)
    const monthlyMap = {};
    let totalCredits = 0;
    let totalDebits = 0;
    let upiCreditCount = 0;
    let totalCreditCount = 0;

    for (const tx of txs) {
      const dateStr = tx.date ? tx.date.substring(0, 7) : 'Current';
      if (!monthlyMap[dateStr]) {
        monthlyMap[dateStr] = {
          month: dateStr,
          credits: 0,
          debits: 0,
          transactionCount: 0,
          closingBalance: 0
        };
      }

      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income' || tx.type === 'udhaar_repaid') {
        monthlyMap[dateStr].credits += amt;
        totalCredits += amt;
        totalCreditCount++;
        if (tx.payment_mode === 'upi') upiCreditCount++;
      } else if (tx.type === 'expense') {
        monthlyMap[dateStr].debits += amt;
        totalDebits += amt;
      }
      monthlyMap[dateStr].transactionCount++;
    }

    // Convert to sorted month list
    const sortedMonths = Object.keys(monthlyMap).sort();
    let rollingBalance = 25000;
    const monthlyAggregates = sortedMonths.map((mKey) => {
      const m = monthlyMap[mKey];
      rollingBalance += (m.credits - m.debits);
      m.closingBalance = Math.max(8000, rollingBalance);
      return {
        month: mKey,
        totalCredits: Math.round(m.credits),
        totalDebits: Math.round(m.debits),
        netFlow: Math.round(m.credits - m.debits),
        transactionCount: m.transactionCount,
        averageDailyBalance: Math.round(m.closingBalance * 0.85),
        bounces: 0
      };
    });

    const avgMonthlyBal = monthlyAggregates.length > 0
      ? Math.round(monthlyAggregates.reduce((s, m) => s + m.averageDailyBalance, 0) / monthlyAggregates.length)
      : 32500;

    const upiSharePct = totalCreditCount > 0 ? Math.round((upiCreditCount / totalCreditCount) * 100) : 58;

    res.json({
      success: true,
      consentHandle: consentHandle || 'AA-CONSENT-VERIFIED',
      status: 'COMPLETED',
      accountNumber: 'XXXX-XXXX-' + (shop.phone ? shop.phone.slice(-4) : '4892'),
      bankName: shop.bank_account_type || 'Aryavart Gramin Bank',
      ifsc: 'BARB0INDBAN',
      accountType: 'SAVINGS_MERCHANT',
      statement: {
        totalCredits: Math.round(totalCredits),
        totalDebits: Math.round(totalDebits),
        netOperatingSurplus: Math.round(totalCredits - totalDebits),
        averageMonthlyBalance: avgMonthlyBal,
        inwardBounces: 0,
        upiSharePct,
        monthlyAggregates: monthlyAggregates.slice(-6)
      },
      mockDataDisclosure: DPI_DISCLOSURES.accountAggregator
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/dpi/udyam-verify
 * Validates Udyam registration format (^UDYAM-[A-Z]{2}-\d{2}-\d{7}$) and updates shop verification
 */
router.post('/udyam-verify', async (req, res) => {
  try {
    const { udyamNumber, udyam_number, shopId } = req.body || {};
    const regNum = (udyamNumber || udyam_number || '').trim().toUpperCase();

    if (!regNum) {
      return res.status(400).json({
        success: false,
        error: 'Udyam registration number is required. Format: UDYAM-XX-00-0000000'
      });
    }

    if (!UDYAM_REGEX.test(regNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Udyam registration format. Expected format: UDYAM-XX-00-0000000 (e.g., UDYAM-UP-01-0024891)',
        provided: regNum
      });
    }

    // Format is valid! Extract state code
    const parts = regNum.split('-');
    const stateCode = parts[1];

    let shop = null;
    if (shopId) {
      shop = await dataStore.findShopById(shopId);
      if (shop) {
        await dataStore.updateShop(shop.id, {
          is_udyam_verified: 1,
          udyam_number: regNum
        });
      }
    }

    res.json({
      success: true,
      verified: true,
      udyamNumber: regNum,
      enterpriseName: shop?.name || "Ramesh's Kirana Store",
      enterpriseType: 'Micro (Investment < ₹1 Cr, Turnover < ₹5 Cr)',
      majorActivity: 'Retail Trade of Food, Groceries & General Provisions (NIC 4711)',
      stateCode,
      state: shop?.state || (stateCode === 'UP' ? 'Uttar Pradesh' : 'Maharashtra'),
      district: shop?.district || 'Varanasi',
      dateOfRegistration: '2021-06-14',
      status: 'ACTIVE_VERIFIED',
      mockDataDisclosure: DPI_DISCLOSURES.udyam
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/dpi/digilocker-verify
 * Simulates MeitY DigiLocker verified document pull for PAN/Aadhaar/Trade License
 */
router.post('/digilocker-verify', async (req, res) => {
  try {
    const { documentType = 'PAN', docNumber, shopId } = req.body || {};

    let issuer = 'Income Tax Department, Govt of India';
    if (documentType.toUpperCase() === 'AADHAAR') issuer = 'UIDAI (Unique Identification Authority of India)';
    if (documentType.toUpperCase() === 'TRADE_LICENSE') issuer = 'Municipal Corporation / Zilla Parishad';

    const shop = shopId ? await dataStore.findShopById(shopId) : null;

    res.json({
      success: true,
      verified: true,
      documentType: documentType.toUpperCase(),
      docNumber: docNumber || 'ABCDE1234F',
      holderName: shop?.owner_name || 'Ramesh Kumar',
      issuer,
      timestamp: new Date().toISOString(),
      uri: `in.gov.digilocker.${documentType.toLowerCase()}:${Date.now()}`,
      mockDataDisclosure: DPI_DISCLOSURES.digiLocker
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
