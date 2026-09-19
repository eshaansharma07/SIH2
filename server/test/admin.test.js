process.env.NODE_ENV = 'test';
import { test, after } from 'node:test';
import assert from 'node:assert';
import app from '../server.js';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

test('Banker & MSME Admin Command Center API Test Suite', async (t) => {
  seedDatabase();

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  after(() => {
    server.close();
  });

  await t.test('1. Database has seeded loan applications and enterprises', async () => {
    const apps = db.prepare('SELECT * FROM loan_applications').all();
    assert.ok(apps.length >= 4, 'Should have at least 4 seeded loan applications');

    const pending = apps.find(a => a.status === 'pending');
    assert.ok(pending, 'Should have at least one pending application');
    assert.ok(pending.requested_amount > 0, 'Requested amount must be positive');
    assert.ok(pending.scheme_name, 'Scheme name must be populated');
  });

  await t.test('2. GET /api/admin/metrics returns aggregated underwriting KPIs and PSL 7.5% meter', async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const m = body.metrics;
    assert.ok(m.district.includes('Balrampur'));
    assert.ok(m.totalRegisteredEnterprises >= 4);
    assert.ok(m.activeApplicationsCount >= 4);
    assert.ok(m.totalRequestedVolume > 0);
    assert.ok(m.rbiPSLBenchmark);
    assert.strictEqual(m.rbiPSLBenchmark.targetSubtargetPct, 7.5);
    assert.strictEqual(m.rbiPSLBenchmark.complianceStatus, 'ON_TRACK');
  });

  await t.test('3. GET /api/admin/applications returns filterable queue', async () => {
    // Unfiltered
    const resAll = await fetch(`${baseUrl}/api/admin/applications`);
    assert.strictEqual(resAll.status, 200);
    const bodyAll = await resAll.json();
    assert.strictEqual(bodyAll.success, true);
    assert.ok(bodyAll.applications.length >= 4);

    // Filter by status=pending
    const resPending = await fetch(`${baseUrl}/api/admin/applications?status=pending`);
    assert.strictEqual(resPending.status, 200);
    const bodyPending = await resPending.json();
    bodyPending.applications.forEach(appItem => {
      assert.strictEqual(appItem.status, 'pending');
    });

    // Search by name
    const resSearch = await fetch(`${baseUrl}/api/admin/applications?search=Shukla`);
    assert.strictEqual(resSearch.status, 200);
    const bodySearch = await resSearch.json();
    assert.ok(bodySearch.applications.length >= 1);
    assert.ok(
      bodySearch.applications[0].applicant_name.includes('Shukla') || 
      bodySearch.applications[0].trade_name.includes('Shukla')
    );
  });

  await t.test('4. GET /api/admin/applications/:id returns detail with shop CAM', async () => {
    const apps = db.prepare('SELECT id FROM loan_applications').all();
    const testId = apps[0].id;

    const res = await fetch(`${baseUrl}/api/admin/applications/${testId}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.application.id, testId);
    assert.ok(body.shop, 'Shop profile must be included');
  });

  await t.test('5. POST /api/admin/applications/:id/review validates & processes loan review', async () => {
    // Find a pending application for testing
    const pendingApp = db.prepare("SELECT * FROM loan_applications WHERE status = 'pending' LIMIT 1").get();
    assert.ok(pendingApp, 'Pending application needed for review test');

    // Validation: Invalid action
    const invalidRes = await fetch(`${baseUrl}/api/admin/applications/${pendingApp.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalid_action' })
    });
    assert.strictEqual(invalidRes.status, 400);

    // Validation: Rejection without notes
    const rejectNoNotes = await fetch(`${baseUrl}/api/admin/applications/${pendingApp.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', notes: 'bad' })
    });
    assert.strictEqual(rejectNoNotes.status, 400);
    const rejectBody = await rejectNoNotes.json();
    assert.ok(rejectBody.error.includes('mandatory'));

    // Approval with sanctioned amount
    const sanctionAmount = 180000;
    const approveRes = await fetch(`${baseUrl}/api/admin/applications/${pendingApp.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve',
        sanctionedAmount: sanctionAmount,
        notes: 'Underwriting approved on basis of 740 SaakhScore and high cash consistency.',
        officerName: 'Chief Branch Manager, SBI Utraula'
      })
    });

    assert.strictEqual(approveRes.status, 200);
    const approveBody = await approveRes.json();
    assert.strictEqual(approveBody.success, true);
    assert.strictEqual(approveBody.application.status, 'approved');
    assert.strictEqual(approveBody.application.sanctioned_amount, sanctionAmount);
    assert.ok(approveBody.application.sanction_ref.startsWith('SBI-SANCT-'));
    assert.ok(approveBody.application.reviewed_at);
  });

  await t.test('6. GET /api/admin/fraud-radar performs district-wide syndicate surveillance', async () => {
    const res = await fetch(`${baseUrl}/api/admin/fraud-radar`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.enterprises.length >= 4);

    // Check that mule shop has critical risk detected
    const muleEnterprise = body.enterprises.find(e => e.shopId === 'mule-shell-shop');
    assert.ok(muleEnterprise, 'Mule shell shop must be in radar');
    assert.ok(muleEnterprise.muleRisk.includes('CRITICAL'));
  });

  await t.test('7. GET /api/admin/shops and POST /api/admin/shops for merchant onboarding', async () => {
    const resList = await fetch(`${baseUrl}/api/admin/shops`);
    assert.strictEqual(resList.status, 200);
    const bodyList = await resList.json();
    assert.ok(bodyList.shops.length >= 4);

    const testPhone = '9876543210';
    db.prepare("DELETE FROM shops WHERE phone = ?").run(testPhone);

    const createRes = await fetch(`${baseUrl}/api/admin/shops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Gupta Medical Store',
        owner_name: 'Dinesh Gupta',
        trade_type: 'pharmacy',
        village: 'Utraula Main',
        district: 'Balrampur',
        phone: testPhone,
        monthly_revenue: 60000
      })
    });

    assert.strictEqual(createRes.status, 201);
    const createBody = await createRes.json();
    assert.strictEqual(createBody.success, true);
    assert.strictEqual(createBody.shop.owner_name, 'Dinesh Gupta');
  });

  await t.test('8. POST /api/admin/shops/:id/verify-udyam verifies enterprise MSME', async () => {
    const res = await fetch(`${baseUrl}/api/admin/shops/shukla-agri/verify-udyam`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.shop.is_udyam_verified, 1);
    assert.ok(body.shop.udyam_number.startsWith('UDYAM-'));
  });

  await t.test('9. GET /api/admin/system-telemetry returns server and gateway probes', async () => {
    const res = await fetch(`${baseUrl}/api/admin/system-telemetry`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.telemetry.uptimeSeconds >= 0);
    assert.ok(body.telemetry.gateways.length >= 5);
  });

  await t.test('10. API Catch-all 404 returns clean JSON error', async () => {
    const res = await fetch(`${baseUrl}/api/non-existent-endpoint-test`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('API endpoint not found'));
  });
});
