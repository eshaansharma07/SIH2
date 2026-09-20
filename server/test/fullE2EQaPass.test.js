process.env.NODE_ENV = 'test';
import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../server.js';
import { seedDatabase } from '../db/seed.js';

import { twilioVerifyService } from '../services/twilioVerifyService.js';

test('Full End-to-End API Pass — All Endpoints, Verified with Real HTTP Requests', async (t) => {
  seedDatabase();

  const mockTwilioClient = {
    verify: {
      v2: {
        services: () => ({
          verifications: {
            create: async () => ({ status: 'pending' })
          },
          verificationChecks: {
            create: async ({ code }) => ({
              status: code === '123456' ? 'approved' : 'pending'
            })
          }
        })
      }
    }
  };
  twilioVerifyService.setMockClient(mockTwilioClient);

  // Spin up real ephemeral HTTP server to test live network traffic
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let authShopToken = '';
  let createdTxId = '';
  let createdCustomerId = '';

  t.after(async () => {
    twilioVerifyService.setMockClient(null);
    try {
      const { closeMongoConnection } = await import('../db/mongoClient.js');
      await closeMongoConnection();
    } catch (_) {}
    await new Promise((resolve) => server.close(resolve));
  });

  // --------------------------------------------------------------------------
  // 1. SYSTEM HEALTH
  // --------------------------------------------------------------------------
  await t.test('1.1 GET /api/health and GET /health return operational status', async () => {
    const res1 = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res1.status, 200);
    const data1 = await res1.json();
    assert.strictEqual(data1.status, 'ok');
    assert.strictEqual(data1.service, 'SaakhSetu API');

    const res2 = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res2.status, 200);
    const data2 = await res2.json();
    assert.strictEqual(data2.status, 'ok');
  });

  // --------------------------------------------------------------------------
  // 2. AUTH & SHOP PROFILES
  // --------------------------------------------------------------------------
  await t.test('2.1 POST /api/auth/demo-login initializes authenticated demo session', async () => {
    const res = await fetch(`${baseUrl}/api/auth/demo-login`, { method: 'POST' });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.token, 'Must return JWT token');
    assert.strictEqual(body.shop.id, 'ramesh-kirana');
    authShopToken = body.token;
  });

  await t.test('2.2 POST /api/auth/login validates 4-digit PIN for demo shopkeeper', async () => {
    // Valid login
    const resSuccess = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9839124789', password: '1234' })
    });
    assert.strictEqual(resSuccess.status, 200);
    const bodySuccess = await resSuccess.json();
    assert.strictEqual(bodySuccess.success, true);

    // Invalid PIN
    const resFail = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9839124789', password: '9999' })
    });
    assert.strictEqual(resFail.status, 401);
  });

  await t.test('2.3 POST /api/auth/send-otp handles valid & invalid numbers', async () => {
    // Invalid phone
    const resBad = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '12345' })
    });
    assert.strictEqual(resBad.status, 400);

    // Valid demo phone
    const resGood = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9839124789', type: 'login' })
    });
    // Can be 200 or 429 if cooldown active
    assert.ok([200, 429].includes(resGood.status));

    // Verify valid OTP
    const resVerify = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9839124789', otp: '123456' })
    });
    assert.strictEqual(resVerify.status, 200);
    const bodyVerify = await resVerify.json();
    assert.strictEqual(bodyVerify.success, true);
    assert.ok(bodyVerify.token);
  });

  await t.test('2.4 POST /api/auth/reset-demo restores demo store data', async () => {
    const res = await fetch(`${baseUrl}/api/auth/reset-demo`, { method: 'POST' });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.message.includes('Demo shop reloaded'));
  });

  await t.test('2.5 GET /api/auth/current returns shop info when queried with shopId', async () => {
    const res = await fetch(`${baseUrl}/api/auth/current?shopId=ramesh-kirana`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.shop.id, 'ramesh-kirana');

    // Without shopId
    const resNull = await fetch(`${baseUrl}/api/auth/current`);
    assert.strictEqual(resNull.status, 200);
    const bodyNull = await resNull.json();
    assert.strictEqual(bodyNull.shop, null);
  });

  await t.test('2.6 POST /api/auth/register & PUT /api/auth/:id create & update shop', async () => {
    const newPhone = `9810${Math.floor(100000 + Math.random() * 900000)}`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Suresh Hardware Store',
        owner_name: 'Suresh Verma',
        trade_type: 'hardware',
        phone: newPhone,
        village: 'Kalyanpur',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        monthly_revenue: 120000,
        vintage_years: 3
      })
    });
    assert.strictEqual(regRes.status, 200);
    const regBody = await regRes.json();
    assert.strictEqual(regBody.success, true);
    assert.ok(regBody.shop.id);
    const newShopId = regBody.shop.id;

    // Update shop
    const updateRes = await fetch(`${baseUrl}/api/auth/${newShopId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regBody.token}`
      },
      body: JSON.stringify({
        monthly_revenue: 150000,
        name: 'Suresh Hardware & Electricals'
      })
    });
    assert.strictEqual(updateRes.status, 200);
    const updateBody = await updateRes.json();
    assert.strictEqual(updateBody.success, true);
    assert.strictEqual(updateBody.shop.monthly_revenue, 150000);
  });

  // --------------------------------------------------------------------------
  // 3. TRANSACTIONS & BAHI-KHATA (CRUD, SUMMARY, SYNC)
  // --------------------------------------------------------------------------
  await t.test('3.1 POST /api/transactions creates all 4 transaction types', async () => {
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authShopToken}`
    };

    // 1. Income
    const resSale = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        shopId: 'ramesh-kirana',
        type: 'income',
        amount: 850,
        category: 'Counter Sales',
        payment_mode: 'cash',
        notes: 'End-to-End QA Test Sale'
      })
    });
    assert.strictEqual(resSale.status, 201);
    const bodySale = await resSale.json();
    assert.strictEqual(bodySale.success, true);
    assert.strictEqual(bodySale.transaction.amount, 850);
    createdTxId = bodySale.transaction.id;

    // 2. Expense
    const resExpense = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        shopId: 'ramesh-kirana',
        type: 'expense',
        amount: 400,
        category: 'Stock Replenishment',
        payment_mode: 'upi'
      })
    });
    assert.strictEqual(resExpense.status, 201);

    // 3. Udhaar Given
    const resUdhaarGiven = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        shopId: 'ramesh-kirana',
        type: 'udhaar_given',
        amount: 250,
        customer_vendor_name: 'Dinesh Yadav',
        customer_phone: '9876543210'
      })
    });
    assert.strictEqual(resUdhaarGiven.status, 201);

    // 4. Udhaar Repaid
    const resUdhaarRepaid = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        shopId: 'ramesh-kirana',
        type: 'udhaar_repaid',
        amount: 150,
        customer_vendor_name: 'Dinesh Yadav',
        customer_phone: '9876543210'
      })
    });
    assert.strictEqual(resUdhaarRepaid.status, 201);
  });

  await t.test('3.2 PUT /api/transactions/:id edits an existing transaction', async () => {
    assert.ok(createdTxId, 'Requires transaction id from creation');
    const res = await fetch(`${baseUrl}/api/transactions/${createdTxId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authShopToken}`
      },
      body: JSON.stringify({
        shopId: 'ramesh-kirana',
        amount: 950,
        notes: 'Updated note via PUT test'
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.transaction.amount, 950);
    assert.strictEqual(body.transaction.notes, 'Updated note via PUT test');
  });

  await t.test('3.3 GET /api/transactions & summary & udhaar-ledger return computed metrics', async () => {
    // List transactions
    const resList = await fetch(`${baseUrl}/api/transactions?shopId=ramesh-kirana&limit=10`, {
      headers: { 'Authorization': `Bearer ${authShopToken}` }
    });
    assert.strictEqual(resList.status, 200);
    const bodyList = await resList.json();
    assert.strictEqual(bodyList.success, true);
    assert.ok(Array.isArray(bodyList.transactions));
    assert.ok(bodyList.transactions.length > 0);

    // Summary
    const resSummary = await fetch(`${baseUrl}/api/transactions/summary?shopId=ramesh-kirana`, {
      headers: { 'Authorization': `Bearer ${authShopToken}` }
    });
    assert.strictEqual(resSummary.status, 200);
    const bodySummary = await resSummary.json();
    assert.strictEqual(bodySummary.success, true);
    assert.ok(bodySummary.summary.totalIncome > 0);
    assert.ok(Array.isArray(bodySummary.summary.monthlyTrend));

    // Udhaar Ledger
    const resLedger = await fetch(`${baseUrl}/api/transactions/udhaar-ledger?shopId=ramesh-kirana`, {
      headers: { 'Authorization': `Bearer ${authShopToken}` }
    });
    assert.strictEqual(resLedger.status, 200);
    const bodyLedger = await resLedger.json();
    assert.strictEqual(bodyLedger.success, true);
    assert.ok(Array.isArray(bodyLedger.ledger));
  });

  await t.test('3.4 POST /api/transactions/sync handles offline queue replay with deduplication', async () => {
    const offlineBatch = [
      {
        id: `tx-offline-${Date.now()}-1`,
        shopId: 'ramesh-kirana',
        type: 'income',
        amount: 320,
        category: 'Counter Sales',
        payment_mode: 'cash',
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: `tx-offline-${Date.now()}-2`,
        shopId: 'ramesh-kirana',
        type: 'income',
        amount: 450,
        category: 'Counter Sales',
        payment_mode: 'upi',
        date: new Date().toISOString().split('T')[0]
      }
    ];

    // First sync
    const resSync1 = await fetch(`${baseUrl}/api/transactions/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authShopToken}`
      },
      body: JSON.stringify({ transactions: offlineBatch })
    });
    assert.strictEqual(resSync1.status, 200);
    const bodySync1 = await resSync1.json();
    assert.strictEqual(bodySync1.success, true);
    assert.strictEqual(bodySync1.processed, 2);

    // Replay same batch (should be idempotent with no duplicates)
    const resSync2 = await fetch(`${baseUrl}/api/transactions/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authShopToken}`
      },
      body: JSON.stringify({ transactions: offlineBatch })
    });
    assert.strictEqual(resSync2.status, 200);
    const bodySync2 = await resSync2.json();
    assert.strictEqual(bodySync2.success, true);
  });

  await t.test('3.5 DELETE /api/transactions/:id removes transaction', async () => {
    const res = await fetch(`${baseUrl}/api/transactions/${createdTxId}?shopId=ramesh-kirana`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authShopToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.deletedId, createdTxId);
  });

  // --------------------------------------------------------------------------
  // 4. CREDIT SCORING, CAM & WHAT-IF SIMULATOR
  // --------------------------------------------------------------------------
  await t.test('4.1 GET /api/credit-score returns score, riskTier and Nayak-aligned metrics', async () => {
    const res = await fetch(`${baseUrl}/api/credit-score?shopId=ramesh-kirana`, {
      headers: { 'Authorization': `Bearer ${authShopToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.totalScore >= 300 && body.totalScore <= 850);
    assert.ok(body.riskTier);
    assert.ok(Array.isArray(body.factors));
  });

  await t.test('4.2 GET /api/credit-score/:shopId/cam supports JSON & HTML verification views', async () => {
    // JSON view
    const resJson = await fetch(`${baseUrl}/api/credit-score/ramesh-kirana/cam?format=json`, {
      headers: { 
        'Accept': 'application/json',
        'Authorization': `Bearer ${authShopToken}`
      }
    });
    assert.strictEqual(resJson.status, 200);
    const bodyJson = await resJson.json();
    assert.strictEqual(bodyJson.success, true);
    assert.strictEqual(bodyJson.cam.documentType, 'CREDIT_APPRAISAL_MEMORANDUM');
    assert.ok(bodyJson.cam.workingCapitalAssessment.nayakCommitteeNorms);

    // HTML view (browser scan)
    const resHtml = await fetch(`${baseUrl}/api/credit-score/ramesh-kirana/cam`, {
      headers: { 
        'Accept': 'text/html,application/xhtml+xml',
        'Authorization': `Bearer ${authShopToken}`
      }
    });
    assert.strictEqual(resHtml.status, 200);
    const htmlText = await resHtml.text();
    assert.ok(htmlText.includes('SAAKHSETU'));
    assert.ok(htmlText.includes('Nayak Committee Working Capital Assessment'));
  });

  await t.test('4.3 POST /api/credit-score/simulate calculates projected score delta', async () => {
    const res = await fetch(`${baseUrl}/api/credit-score/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authShopToken}`
      },
      body: JSON.stringify({
        shopId: 'ramesh-kirana',
        additionalLoggingDays: 30,
        udhaarRecoveryAmount: 5000,
        targetUpiSharePct: 60
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.projectedScore >= body.currentScore);
    assert.ok(body.projectedDelta > 0);
  });

  // --------------------------------------------------------------------------
  // 5. GOVERNMENT SCHEMES & LIVE SCRAPER
  // --------------------------------------------------------------------------
  await t.test('5.1 GET /api/schemes, /match, /status return matched schemes & scraper health', async () => {
    const resCatalog = await fetch(`${baseUrl}/api/schemes`);
    assert.strictEqual(resCatalog.status, 200);
    const bodyCatalog = await resCatalog.json();
    assert.strictEqual(bodyCatalog.success, true);
    assert.ok(bodyCatalog.schemes.length >= 14);

    const resMatch = await fetch(`${baseUrl}/api/schemes/match?shopId=ramesh-kirana`);
    assert.strictEqual(resMatch.status, 200);
    const bodyMatch = await resMatch.json();
    assert.strictEqual(bodyMatch.success, true);
    assert.ok(bodyMatch.eligibleCount > 0);

    const resStatus = await fetch(`${baseUrl}/api/schemes/status`);
    assert.strictEqual(resStatus.status, 200);
    const bodyStatus = await resStatus.json();
    assert.strictEqual(bodyStatus.success, true);
    assert.ok(bodyStatus.monitoredSources.length > 0);
  });

  await t.test('5.2 POST /api/schemes/scrape-custom enforces statutory .gov.in domain security', async () => {
    // Valid .gov.in URL
    const resValid = await fetch(`${baseUrl}/api/schemes/scrape-custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://msme.gov.in/schemes/sample-rural-credit-circular.pdf',
        rawText: 'Ministry of MSME announces special interest subsidy for rural retail merchants.',
        title: 'MSME Rural Retail Subsidy Scheme'
      })
    });
    assert.strictEqual(resValid.status, 200);

    // Phishing / non-gov URL rejection
    const resBad = await fetch(`${baseUrl}/api/schemes/scrape-custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://attacker-fake-loan-site.com/scheme.html',
        rawText: 'Fraudulent loan offer'
      })
    });
    assert.strictEqual(resBad.status, 400);
  });

  // --------------------------------------------------------------------------
  // 6. AI ADVISORY & DEMAND CUES
  // --------------------------------------------------------------------------
  await t.test('6.1 POST /api/advisor/chat & GET cues/history operate with offline fallback', async () => {
    const resChat = await fetch(`${baseUrl}/api/advisor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId: 'ramesh-kirana',
        message: 'Diwali is approaching, how much stock should I keep?'
      })
    });
    assert.strictEqual(resChat.status, 200);
    const bodyChat = await resChat.json();
    assert.strictEqual(bodyChat.success, true);
    assert.ok(bodyChat.response.length > 0);

    const resHistory = await fetch(`${baseUrl}/api/advisor/history?shopId=ramesh-kirana`);
    assert.strictEqual(resHistory.status, 200);

    const resCues = await fetch(`${baseUrl}/api/advisor/cues?shopId=ramesh-kirana`);
    assert.strictEqual(resCues.status, 200);
    const bodyCues = await resCues.json();
    assert.strictEqual(bodyCues.success, true);
  });

  // --------------------------------------------------------------------------
  // 7. PRIORITY SECTOR LENDING BANK DOSSIER
  // --------------------------------------------------------------------------
  await t.test('7.1 GET /api/dossier/generate produces PSL-compliant bank dossier', async () => {
    const res = await fetch(`${baseUrl}/api/dossier/generate?shopId=ramesh-kirana`, {
      headers: { 'Authorization': `Bearer ${authShopToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.dossier.dossierNumber.startsWith('SS-DOC-'));
    assert.ok(body.dossier.pslClassification.includes('7.5% Sub-target'));
    assert.ok(body.dossier.creditEvaluation.totalScore >= 300);
  });

  // --------------------------------------------------------------------------
  // 8. CUSTOMERS & WHATSAPP REMINDERS
  // --------------------------------------------------------------------------
  await t.test('8.1 Customer CRUD and reminder-sent recording flow', async () => {
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authShopToken}`
    };

    // 1. Create customer
    const resCreate = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        shopId: 'ramesh-kirana',
        name: 'Sunita Devi',
        phone: '9876501234',
        village_address: 'Utraula Dehat',
        credit_limit: 6000,
        initialBalance: 1200
      })
    });
    assert.strictEqual(resCreate.status, 201);
    const bodyCreate = await resCreate.json();
    assert.strictEqual(bodyCreate.success, true);
    createdCustomerId = bodyCreate.customer.id;
    assert.strictEqual(bodyCreate.customer.balanceOwed, 1200);

    // 2. List customers
    const resList = await fetch(`${baseUrl}/api/customers?shopId=ramesh-kirana`, { headers });
    assert.strictEqual(resList.status, 200);
    const bodyList = await resList.json();
    assert.strictEqual(bodyList.success, true);
    assert.ok(bodyList.customers.some(c => c.id === createdCustomerId));

    // 3. Update customer
    const resUpdate = await fetch(`${baseUrl}/api/customers/${createdCustomerId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ credit_limit: 8000 })
    });
    assert.strictEqual(resUpdate.status, 200);
    const bodyUpdate = await resUpdate.json();
    assert.strictEqual(bodyUpdate.customer.credit_limit, 8000);

    // 4. Record reminder sent
    const resReminder = await fetch(`${baseUrl}/api/customers/${createdCustomerId}/reminder-sent`, {
      method: 'POST',
      headers
    });
    assert.strictEqual(resReminder.status, 200);
    const bodyReminder = await resReminder.json();
    assert.strictEqual(bodyReminder.success, true);
    assert.ok(bodyReminder.lastReminderSent);

    // 5. Delete customer
    const resDelete = await fetch(`${baseUrl}/api/customers/${createdCustomerId}`, {
      method: 'DELETE',
      headers
    });
    assert.strictEqual(resDelete.status, 200);
  });

  // --------------------------------------------------------------------------
  // 9. DPI GATEWAY (ACCOUNT AGGREGATOR, UDYAM, DIGILOCKER)
  // --------------------------------------------------------------------------
  await t.test('9.1 DPI Account Aggregator, Udyam regex format, and DigiLocker APIs', async () => {
    // 1. AA Consent
    const resConsent = await fetch(`${baseUrl}/api/dpi/account-aggregator/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: 'ramesh-kirana' })
    });
    assert.strictEqual(resConsent.status, 200);
    const bodyConsent = await resConsent.json();
    assert.strictEqual(bodyConsent.success, true);
    assert.ok(bodyConsent.consentHandle.startsWith('AA-CONSENT-'));

    // 2. AA Fetch
    const resFetch = await fetch(`${baseUrl}/api/dpi/account-aggregator/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentHandle: bodyConsent.consentHandle, shopId: 'ramesh-kirana' })
    });
    assert.strictEqual(resFetch.status, 200);
    const bodyFetch = await resFetch.json();
    assert.strictEqual(bodyFetch.success, true);
    assert.ok(bodyFetch.statement.totalCredits > 0);

    // 3. Udyam valid format
    const resUdyamGood = await fetch(`${baseUrl}/api/dpi/udyam-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ udyamNumber: 'UDYAM-UP-01-0024891', shopId: 'ramesh-kirana' })
    });
    assert.strictEqual(resUdyamGood.status, 200);
    const bodyUdyamGood = await resUdyamGood.json();
    assert.strictEqual(bodyUdyamGood.verified, true);
    assert.strictEqual(bodyUdyamGood.stateCode, 'UP');

    // 4. Udyam invalid format
    const resUdyamBad = await fetch(`${baseUrl}/api/dpi/udyam-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ udyamNumber: 'UDYAM-INVALID-123' })
    });
    assert.strictEqual(resUdyamBad.status, 400);

    // 5. DigiLocker verify
    const resDigi = await fetch(`${baseUrl}/api/dpi/digilocker-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentType: 'PAN', docNumber: 'ABCDE1234F', shopId: 'ramesh-kirana' })
    });
    assert.strictEqual(resDigi.status, 200);
    const bodyDigi = await resDigi.json();
    assert.strictEqual(bodyDigi.verified, true);
  });

  // --------------------------------------------------------------------------
  // 10. ONDC WHOLESALE PROCUREMENTS
  // --------------------------------------------------------------------------
  await t.test('10.1 ONDC Wholesale catalog & item comparison with local mandi prices', async () => {
    const resCatalog = await fetch(`${baseUrl}/api/ondc/wholesale-catalog`);
    assert.strictEqual(resCatalog.status, 200);
    const bodyCatalog = await resCatalog.json();
    assert.strictEqual(bodyCatalog.success, true);
    assert.ok(bodyCatalog.catalog.length >= 8);

    const resCompare = await fetch(`${baseUrl}/api/ondc/compare/ondc-atta-50kg`);
    assert.strictEqual(resCompare.status, 200);
    const bodyCompare = await resCompare.json();
    assert.strictEqual(bodyCompare.success, true);
    assert.ok(bodyCompare.procurementAnalysis.monthlySavings > 0);
    assert.ok(bodyCompare.supplierProfile.name);
  });

  // --------------------------------------------------------------------------
  // 11. ADMIN INSTITUTIONAL PORTAL & METRICS
  // --------------------------------------------------------------------------
  await t.test('11.1 Admin institutional command center endpoints', async () => {
    const resMetrics = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.strictEqual(resMetrics.status, 200);
    const bodyMetrics = await resMetrics.json();
    assert.strictEqual(bodyMetrics.success, true);
    assert.ok(bodyMetrics.metrics.totalShops >= 1);

    const resShops = await fetch(`${baseUrl}/api/admin/shops`);
    assert.strictEqual(resShops.status, 200);
    const bodyShops = await resShops.json();
    assert.strictEqual(bodyShops.success, true);
    assert.ok(Array.isArray(bodyShops.shops));
  });

  // --------------------------------------------------------------------------
  // 12. ACCOUNTING DASHBOARD & INVENTORY
  // --------------------------------------------------------------------------
  await t.test('12.1 Vyapaar Accounting dashboard and products', async () => {
    const resDashboard = await fetch(`${baseUrl}/api/accounting/dashboard?shopId=ramesh-kirana`, {
      headers: { 'Authorization': `Bearer ${authShopToken}` }
    });
    assert.strictEqual(resDashboard.status, 200);
    const bodyDashboard = await resDashboard.json();
    assert.strictEqual(bodyDashboard.success, true);

    const resProducts = await fetch(`${baseUrl}/api/accounting/products?shopId=ramesh-kirana`, {
      headers: { 'Authorization': `Bearer ${authShopToken}` }
    });
    assert.strictEqual(resProducts.status, 200);
    const bodyProducts = await resProducts.json();
    assert.strictEqual(bodyProducts.success, true);
    assert.ok(Array.isArray(bodyProducts.products));
  });
});
