import { enqueueTransaction, syncPendingTransactions } from './offlineQueue';
import { safeStorage } from './safeStorage';

let API_BASE_URL = '/api';

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

  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('saakhsetu_admin_unlocked') === 'true') {
      defaultHeaders['x-admin-access'] = '7788';
    }
  } catch (_) {}

  const fetchOptions = {
    ...options,
    cache: 'no-store',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP error ${response.status}`);
    }

    return response.json();
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
          return directRes.json();
        }
      } catch (_) {
        // Continue to throw original error if both fail
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
    try {
      return await request('/shop/setup', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      console.warn('[API] Server error during shop registration, creating local offline shop profile:', err.message);
      const fallbackShop = {
        id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: data.name || 'My Enterprise',
        owner_name: data.owner_name || data.name || 'Enterprise Owner',
        trade_type: data.trade_type || data.trade_name || 'kirana',
        trade_name: data.trade_name || data.trade_type || 'Micro-Enterprise',
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
  },
  sendOTP: (phone, type = 'login') => request('/shop/send-otp', { method: 'POST', body: JSON.stringify({ phone, type }) }),
  sendLoginOTP: (phone) => api.sendOTP(phone, 'login'),
  sendRegisterOTP: (phone) => api.sendOTP(phone, 'register'),
  verifyLoginOTP: (phone, otp) => request('/shop/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
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
  updateTransaction: (id, data, shopId = '') => 
    request(`/transactions/${id}${shopId ? `?shopId=${shopId}` : ''}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  syncSchemes: () => request('/schemes/sync', { method: 'POST' }),
  scrapeCustomScheme: (payload) => request('/schemes/scrape-custom', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload) 
  }),
  getScraperStatus: () => request('/schemes/status'),

  // Advisory
  chatAdvisor: (shopId, question) => {
    let userApiKey = '';
    try {
      userApiKey = safeStorage.getItem('vyapaar_gemini_api_key', '');
    } catch (_) {}
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
  createProduct: (data) => request(`/accounting/products?shopId=${encodeURIComponent(data?.shopId || '')}`, { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/accounting/products/${id}?shopId=${encodeURIComponent(data?.shopId || '')}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id, shopId) => request(`/accounting/products/${id}?shopId=${shopId}`, { method: 'DELETE' }),

  getInventorySummary: (shopId) => request(`/accounting/inventory?shopId=${shopId}`),
  adjustStock: (data) => request(`/accounting/inventory/adjust?shopId=${encodeURIComponent(data?.shopId || '')}`, { method: 'POST', body: JSON.stringify(data) }),
  getStockMovements: (shopId, { productId = '', limit = 50, offset = 0 } = {}) => {
    let q = `?shopId=${shopId}`;
    if (productId) q += `&productId=${encodeURIComponent(productId)}`;
    if (limit) q += `&limit=${limit}`;
    if (offset) q += `&offset=${offset}`;
    return request(`/accounting/inventory/movements${q}`);
  },

  getSuppliers: (shopId) => request(`/accounting/suppliers?shopId=${shopId}`),
  getSupplier: (shopId, id) => request(`/accounting/suppliers/${id}?shopId=${shopId}`),
  createSupplier: (data) => request(`/accounting/suppliers?shopId=${encodeURIComponent(data?.shopId || '')}`, { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/accounting/suppliers/${id}?shopId=${encodeURIComponent(data?.shopId || '')}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  createInvoice: (data) => request(`/accounting/invoices?shopId=${encodeURIComponent(data?.shopId || '')}`, { method: 'POST', body: JSON.stringify(data) }),

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
  createPurchase: (data) => request(`/accounting/purchases?shopId=${encodeURIComponent(data?.shopId || '')}`, { method: 'POST', body: JSON.stringify(data) }),

  getReceivables: (shopId) => request(`/accounting/receivables?shopId=${shopId}`),
  recordPayment: (data) => request(`/accounting/payments?shopId=${encodeURIComponent(data?.shopId || '')}`, { method: 'POST', body: JSON.stringify(data) }),

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

  // Admin & Institutional Telemetry
  getAdminMetrics: () => request('/admin/metrics'),
  getAdminShops: ({ search = '', state = '', milestone = '', limit = 100, offset = 0 } = {}) => {
    let q = `?limit=${limit}&offset=${offset}`;
    if (search) q += `&search=${encodeURIComponent(search)}`;
    if (state && state !== 'all') q += `&state=${encodeURIComponent(state)}`;
    if (milestone && milestone !== 'all') q += `&milestone=${encodeURIComponent(milestone)}`;
    return request(`/admin/shops${q}`);
  },
  syncAdminSchemes: () => request('/admin/sync-schemes', { method: 'POST' }),
};


