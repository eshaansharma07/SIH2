import { enqueueTransaction, syncPendingTransactions } from './offlineQueue';
import { safeStorage } from './safeStorage';

let API_BASE_URL = '/api';

const FALLBACK_RESPONSES = {
  '/shop/current': {
    success: true,
    shop: {
      id: 'ramesh-kirana',
      name: "Ramesh's Kirana Store",
      owner_name: 'Ramesh Kumar',
      trade_type: 'kirana',
      trade_name: "Ramesh's Kirana Store",
      village: 'Utraula Dehat',
      district: 'Balrampur',
      state: 'Uttar Pradesh',
      vintage_years: 4,
      monthly_revenue: 45000,
      is_udyam_verified: 1,
      udyam_number: 'UDYAM-UP-24-0019284',
      bank_account_type: 'savings',
      owner_category: 'OBC'
    },
    offline: true
  },
  '/transactions': { success: true, transactions: [], count: 0, offline: true },
  '/transactions/summary': {
    success: true,
    summary: {
      totalIncome: 180000,
      totalExpense: 142000,
      netProfit: 38000,
      transactionCount: 140
    },
    offline: true
  },
  '/customers': { success: true, customers: [], count: 0, offline: true },
  '/credit-score': {
    success: true,
    score: 720,
    tier: 'Prime',
    breakdown: { cashDiscipline: 85, digitalAdoption: 70, seasonalResilience: 80 },
    offline: true
  },
  '/schemes': { success: true, schemes: [], count: 0, offline: true },
  '/schemes/match': { success: true, schemes: [], matchedCount: 0, offline: true },
  '/accounting/dashboard': {
    success: true,
    dashboard: {
      totalProducts: 12,
      lowStockCount: 1,
      totalSalesMonth: 45000,
      pendingReceivables: 12500
    },
    offline: true
  },
  '/admin/metrics': {
    success: true,
    metrics: {
      district: 'Balrampur (Aspirational District, UP)',
      totalRegisteredEnterprises: 5,
      totalTransactionsCount: 140,
      totalTurnoverAudited: 450000,
      activeApplicationsCount: 5,
      pendingReviewCount: 1,
      approvedCount: 2,
      rejectedCount: 1,
      underReviewCount: 1,
      totalRequestedVolume: 1400000,
      totalSanctionedVolume: 500000,
      avgDistrictCreditScore: 710,
      fraudAlertsCount: 1,
      rbiPSLBenchmark: {
        targetSubtargetPct: 7.5,
        currentFulfillmentPct: 8.5,
        complianceStatus: 'ON_TRACK',
        regulatoryRef: 'RBI/FIDD.CO.Plan.BC.5/04.09.01/2020-21'
      }
    },
    offline: true
  },
  '/admin/applications': { success: true, applications: [], count: 0, offline: true },
  '/admin/fraud-radar': {
    success: true,
    summary: { totalInspected: 5, criticalRiskCount: 1, moderateWarningCount: 1, cleanEnterprisesCount: 3, detectedMuleRingsCount: 0 },
    muleRings: [],
    enterprises: [],
    offline: true
  },
  '/admin/shops': { success: true, shops: [], count: 0, offline: true },
  '/admin/system-telemetry': {
    success: true,
    telemetry: {
      uptimeSeconds: 120,
      memoryUsageMb: 48,
      gateways: [
        { name: 'SQLite Storage Engine (WAL)', status: 'OPERATIONAL', latencyMs: 2 },
        { name: 'Twilio SMS OTP Gateway', status: 'ONLINE', latencyMs: 120 },
        { name: 'AI Advisory LLM Engine', status: 'ONLINE', latencyMs: 340 }
      ]
    },
    offline: true
  }
};

async function request(endpoint, options = {}) {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  let cleanEndpoint = endpoint;
  if (isGet) {
    const separator = cleanEndpoint.includes('?') ? '&' : '?';
    cleanEndpoint = `${cleanEndpoint}${separator}_t=${Date.now()}`;
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  const authToken = safeStorage.getItem('vyapaar_auth_token');
  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const fetchOptions = {
    ...options,
    cache: 'no-store',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const basePath = endpoint.split('?')[0];
  const cacheKey = `vyapaar_cache_${basePath}`;

  try {
    const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (isGet && data) {
      try {
        safeStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (_) {}
    }
    return data;
  } catch (err) {
    // If the proxied /api call fails during local dev (e.g. Vite proxy socket drop),
    // failover to direct local backend at http://127.0.0.1:3001/api
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (API_BASE_URL === '/api' && isLocalhost) {
      try {
        const directRes = await fetch(`http://127.0.0.1:3001/api${cleanEndpoint}`, fetchOptions);
        if (directRes.ok) {
          API_BASE_URL = 'http://127.0.0.1:3001/api';
          const directData = await directRes.json();
          if (isGet && directData) {
            try {
              safeStorage.setItem(cacheKey, JSON.stringify(directData));
            } catch (_) {}
          }
          return directData;
        }
      } catch (_) {
        // Fall through to cache/resilience fallback
      }
    }

    // 1. Try serving from safeStorage cache
    if (isGet) {
      const cached = safeStorage.getJSON(cacheKey, null);
      if (cached) {
        console.warn(`[API Resilience] Serving cached response for ${endpoint} due to network error:`, err.message);
        return { ...cached, _cached: true, _offline: true };
      }

      // 2. Try static fallback if available
      if (FALLBACK_RESPONSES[basePath]) {
        console.warn(`[API Resilience] Serving static fallback for ${endpoint} due to network error:`, err.message);
        return { ...FALLBACK_RESPONSES[basePath], _fallback: true, _networkError: err.message };
      }
    }

    throw err;
  }
}

export const api = {
  // Shop profile
  getShopCurrent: (shopId = '') => request(`/shop/current${shopId ? `?shopId=${shopId}` : ''}`),
  setupShop: (data) => api.registerShop(data),
  registerShop: async (data) => {
    const payload = {
      ...data,
      trade_type: data.trade_type || data.trade_name || 'kirana',
      trade_name: data.trade_name || data.trade_type || 'Kirana & General Store',
    };
    try {
      return await request('/shop/register', { method: 'POST', body: JSON.stringify(payload) });
    } catch (err) {
      try {
        return await request('/shop/setup', { method: 'POST', body: JSON.stringify(payload) });
      } catch (err2) {
        console.warn('[API] Server error during shop registration, creating local offline shop profile:', err2.message);
        const fallbackShop = {
          id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: data.name || 'My Enterprise',
          owner_name: data.owner_name || data.name || 'Enterprise Owner',
          trade_type: payload.trade_type,
          trade_name: payload.trade_name,
          village: data.village || 'Utraula Dehat',
          district: data.district || 'Balrampur',
          state: data.state || 'Uttar Pradesh',
          vintage_years: Math.max(0, Number(data.vintage_years) || 1),
          monthly_revenue: Math.max(0, Number(data.monthly_revenue) || 0),
          ownership: data.ownership || 'rented',
          bank_account_type: data.bank_account_type || 'savings',
          phone: data.phone ? String(data.phone).trim() : '',
          password: (data.password && String(data.password).trim()) || '1234',
          owner_category: data.owner_category || 'general',
          is_demo: 0,
          is_udyam_verified: 0,
          udyam_number: '',
          created_at: new Date().toISOString()
        };
        return { success: true, shop: fallbackShop, offline: true };
      }
    }
  },
  sendOTP: (phone, type = 'login') => request('/shop/send-otp', { method: 'POST', body: JSON.stringify({ phone, type }) }),
  sendLoginOTP: (phone) => api.sendOTP(phone, 'login'),
  sendRegisterOTP: (phone) => api.sendOTP(phone, 'register'),
  verifyLoginOTP: (phone, otp) => request('/shop/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  sendEmailOTP: (email, type = 'login') => request('/shop/send-email-otp', { method: 'POST', body: JSON.stringify({ email, type }) }),
  verifyEmailOTP: (email, otp) => request('/shop/verify-email-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  configureSMSGateway: (config) => request('/shop/configure-sms', { method: 'POST', body: JSON.stringify(config) }),
  configureEmailGateway: (config) => request('/shop/configure-email', { method: 'POST', body: JSON.stringify(config) }),
  getGatewaysStatus: () => request('/shop/gateways-status'),
  demoLogin: () => request('/shop/demo-login', { method: 'POST' }),
  loginShop: async (phone, password) => {
    try {
      return await request('/shop/login', { method: 'POST', body: JSON.stringify({ phone, password }) });
    } catch (err) {
      // Check local saved shops if offline or network error
      const cleanPhone = String(phone).replace(/\D/g, '');
      const saved = safeStorage.getJSON('vyapaar_saved_shops', []);
      const matched = saved.find(s => (s.phone && String(s.phone).replace(/\D/g, '') === cleanPhone) || s.id === phone);
      if (matched) {
        return { success: true, shop: matched, offline: true };
      }
      throw err;
    }
  },
  resetDemoShop: () => request('/shop/reset-demo', { method: 'POST' }),
  updateShop: (id, data) => request(`/shop/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Transactions & Bahi-Khata
  getTransactions: (shopId, type = '', limit = 50) => 
    request(`/transactions?shopId=${shopId}${type ? `&type=${type}` : ''}&limit=${limit}`),
  createTransaction: async (data) => {
    const id = data.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const txPayload = { ...data, id };

    // Explicit offline check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[API] Offline detected, queuing transaction locally:', id);
      await enqueueTransaction(txPayload);
      return { success: true, transaction: txPayload, offline: true };
    }

    try {
      const res = await request('/transactions', { method: 'POST', body: JSON.stringify(txPayload) });
      return res;
    } catch (err) {
      console.warn('[API] Network error during transaction creation, queuing offline:', err.message);
      await enqueueTransaction(txPayload);
      return { success: true, transaction: txPayload, offline: true, error: err.message };
    }
  },
  syncPendingTransactions: () => syncPendingTransactions(),
  deleteTransaction: (id, shopId = '') => 
    request(`/transactions/${id}${shopId ? `?shopId=${shopId}` : ''}`, { method: 'DELETE' }),
  getTransactionSummary: (shopId) => request(`/transactions/summary?shopId=${shopId}`),
  getUdhaarLedger: (shopId) => request(`/transactions/udhaar-ledger?shopId=${shopId}`),

  // Customers & WhatsApp Khata
  getCustomers: (shopId) => request(`/customers?shopId=${shopId}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  recordReminderSent: (id) => request(`/customers/${id}/reminder-sent`, { method: 'POST' }),

  // Credit Scoring & CAM
  getCreditScore: (shopId) => request(`/credit-score?shopId=${shopId}`),
  getCAM: (shopId) => request(`/credit-score/${shopId}/cam`),
  simulateCreditScore: (payload) => request('/credit-score/simulate', { method: 'POST', body: JSON.stringify(payload) }),

  // DPI Mock Gateway (Sahamati AA, Udyam MSME, DigiLocker)
  requestAAConsent: (data) => request('/dpi/account-aggregator/consent', { method: 'POST', body: JSON.stringify(data) }),
  fetchAAStatement: (data) => request('/dpi/account-aggregator/fetch', { method: 'POST', body: JSON.stringify(data) }),
  verifyUdyam: (data) => request('/dpi/udyam-verify', { method: 'POST', body: JSON.stringify(data) }),
  verifyDigiLocker: (data) => request('/dpi/digilocker-verify', { method: 'POST', body: JSON.stringify(data) }),

  // ONDC B2B Wholesale Price Discovery
  getWholesaleCatalog: (category = '', search = '') => {
    let q = '';
    if (category) q += `?category=${encodeURIComponent(category)}`;
    if (search) q += `${q ? '&' : '?'}search=${encodeURIComponent(search)}`;
    return request(`/ondc/wholesale-catalog${q}`);
  },
  compareWholesalePrice: (itemName) => request(`/ondc/compare/${encodeURIComponent(itemName)}`),

  // Schemes
  getMatchedSchemes: (shopId) => request(`/schemes/match?shopId=${shopId}`),
  getAllSchemes: (category = '', maxAmount = '') => {
    let q = '';
    if (category) q += `?category=${encodeURIComponent(category)}`;
    if (maxAmount) q += `${q ? '&' : '?'}maxAmount=${maxAmount}`;
    return request(`/schemes${q}`);
  },
  getSchemeDetail: (id) => request(`/schemes/${id}`),
  getJanSamarthPacket: (schemeId, shopId = '') => 
    request(`/schemes/${schemeId}/jan-samarth-packet${shopId ? `?shopId=${shopId}` : ''}`),
  syncSchemes: () => request('/schemes/sync', { method: 'POST' }),
  scrapeCustomScheme: (payload) => request('/schemes/scrape-custom', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload) 
  }),
  getScraperStatus: () => request('/schemes/status'),

  // Advisory
  chatAdvisor: (shopId, question, apiKey) => {
    let userApiKey = apiKey || '';
    if (!userApiKey) {
      try {
        userApiKey = safeStorage.getItem('vyapaar_claude_api_key', '') ||
                     safeStorage.getItem('vyapaar_gemini_api_key', '') ||
                     (typeof localStorage !== 'undefined' ? (localStorage.getItem('vyapaar_claude_api_key') || localStorage.getItem('vyapaar_gemini_api_key')) : '');
      } catch (_) {}
    }
    return request('/advisor/chat', { 
      method: 'POST', 
      body: JSON.stringify({ 
        shopId, 
        question, 
        apiKey: userApiKey || undefined 
      }) 
    });
  },
  getAdvisorHistory: (shopId) => request(`/advisor/history?shopId=${shopId}`),
  getSeasonalCues: (shopId) => request(`/advisor/cues?shopId=${shopId}`),

  // Bank Dossier
  generateDossier: (shopId) => request(`/dossier/generate?shopId=${shopId}`),

  // Vyapaar Accounting & Inventory
  getAccountingDashboard: (shopId) => request(`/accounting/dashboard?shopId=${shopId}`),
  
  getProducts: (shopId, { search = '', category = '', lowStockOnly = false, limit = 100, offset = 0 } = {}) => {
    let q = `?shopId=${shopId}`;
    if (search) q += `&search=${encodeURIComponent(search)}`;
    if (category) q += `&category=${encodeURIComponent(category)}`;
    if (lowStockOnly) q += `&lowStockOnly=true`;
    if (limit) q += `&limit=${limit}`;
    if (offset) q += `&offset=${offset}`;
    return request(`/accounting/products${q}`);
  },
  getProduct: (shopId, id) => request(`/accounting/products/${id}?shopId=${shopId}`),
  createProduct: (data) => request('/accounting/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/accounting/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id, shopId) => request(`/accounting/products/${id}?shopId=${shopId}`, { method: 'DELETE' }),

  getInventorySummary: (shopId) => request(`/accounting/inventory?shopId=${shopId}`),
  adjustStock: (data) => request('/accounting/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  getStockMovements: (shopId, { productId = '', limit = 50, offset = 0 } = {}) => {
    let q = `?shopId=${shopId}`;
    if (productId) q += `&productId=${encodeURIComponent(productId)}`;
    if (limit) q += `&limit=${limit}`;
    if (offset) q += `&offset=${offset}`;
    return request(`/accounting/inventory/movements${q}`);
  },

  getSuppliers: (shopId) => request(`/accounting/suppliers?shopId=${shopId}`),
  getSupplier: (shopId, id) => request(`/accounting/suppliers/${id}?shopId=${shopId}`),
  createSupplier: (data) => request('/accounting/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/accounting/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id, shopId) => request(`/accounting/suppliers/${id}?shopId=${shopId}`, { method: 'DELETE' }),

  getInvoices: (shopId, { search = '', status = '', paymentMode = '', from = '', to = '', limit = 50, offset = 0 } = {}) => {
    let q = `?shopId=${shopId}`;
    if (search) q += `&search=${encodeURIComponent(search)}`;
    if (status) q += `&status=${encodeURIComponent(status)}`;
    if (paymentMode) q += `&paymentMode=${encodeURIComponent(paymentMode)}`;
    if (from) q += `&from=${from}`;
    if (to) q += `&to=${to}`;
    if (limit) q += `&limit=${limit}`;
    if (offset) q += `&offset=${offset}`;
    return request(`/accounting/invoices${q}`);
  },
  getInvoice: (shopId, id) => request(`/accounting/invoices/${id}?shopId=${shopId}`),
  createInvoice: (data) => request('/accounting/invoices', { method: 'POST', body: JSON.stringify(data) }),

  getPurchases: (shopId, { search = '', status = '', from = '', to = '', limit = 50, offset = 0 } = {}) => {
    let q = `?shopId=${shopId}`;
    if (search) q += `&search=${encodeURIComponent(search)}`;
    if (status) q += `&status=${encodeURIComponent(status)}`;
    if (from) q += `&from=${from}`;
    if (to) q += `&to=${to}`;
    if (limit) q += `&limit=${limit}`;
    if (offset) q += `&offset=${offset}`;
    return request(`/accounting/purchases${q}`);
  },
  getPurchase: (shopId, id) => request(`/accounting/purchases/${id}?shopId=${shopId}`),
  createPurchase: (data) => request('/accounting/purchases', { method: 'POST', body: JSON.stringify(data) }),

  getReceivables: (shopId) => request(`/accounting/receivables?shopId=${shopId}`),
  recordPayment: (data) => request('/accounting/payments', { method: 'POST', body: JSON.stringify(data) }),

  getGstReport: (shopId, { from = '', to = '' } = {}) => {
    let q = `?shopId=${shopId}`;
    if (from) q += `&from=${from}`;
    if (to) q += `&to=${to}`;
    return request(`/accounting/reports/gst${q}`);
  },
  getPnlReport: (shopId, { from = '', to = '' } = {}) => {
    let q = `?shopId=${shopId}`;
    if (from) q += `&from=${from}`;
    if (to) q += `&to=${to}`;
    return request(`/accounting/reports/pnl${q}`);
  },
  getSalesReport: (shopId, { from = '', to = '', limit = 1000 } = {}) => {
    let q = `?shopId=${shopId}`;
    if (from) q += `&from=${from}`;
    if (to) q += `&to=${to}`;
    if (limit) q += `&limit=${limit}`;
    return request(`/accounting/reports/sales${q}`);
  },
  getPurchasesReport: (shopId, { from = '', to = '', limit = 1000 } = {}) => {
    let q = `?shopId=${shopId}`;
    if (from) q += `&from=${from}`;
    if (to) q += `&to=${to}`;
    if (limit) q += `&limit=${limit}`;
    return request(`/accounting/reports/purchases${q}`);
  },

  // Banker & MSME Admin Command Center
  getAdminMetrics: (district = '') => 
    request(`/admin/metrics${district ? `?district=${encodeURIComponent(district)}` : ''}`),

  getAdminApplications: ({ status = '', district = '', riskTier = '', search = '' } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (district) params.append('district', district);
    if (riskTier) params.append('riskTier', riskTier);
    if (search) params.append('search', search);
    const qs = params.toString();
    return request(`/admin/applications${qs ? `?${qs}` : ''}`);
  },

  getAdminApplicationDetail: (id) => 
    request(`/admin/applications/${id}`),

  reviewApplication: (id, { action, sanctionedAmount, notes, officerName }) => 
    request(`/admin/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, sanctionedAmount, notes, officerName })
    }),

  getAdminFraudRadar: () => 
    request('/admin/fraud-radar'),

  getAdminShops: (search = '') => 
    request(`/admin/shops${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  createAdminShop: (shopData) => 
    request('/admin/shops', {
      method: 'POST',
      body: JSON.stringify(shopData)
    }),

  verifyAdminShopUdyam: (shopId) => 
    request(`/admin/shops/${shopId}/verify-udyam`, {
      method: 'POST'
    }),

  getAdminTelemetry: () => 
    request('/admin/system-telemetry')
};

