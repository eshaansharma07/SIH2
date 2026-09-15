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
  setupShop: (data) => request('/shop/setup', { method: 'POST', body: JSON.stringify(data) }),
  loginShop: (phone, password) => request('/shop/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  resetDemoShop: () => request('/shop/reset-demo', { method: 'POST' }),
  updateShop: (id, data) => request(`/shop/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Transactions & Bahi-Khata
  getTransactions: (shopId, type = '', limit = 50) => 
    request(`/transactions?shopId=${shopId}${type ? `&type=${type}` : ''}&limit=${limit}`),
  createTransaction: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  deleteTransaction: (id, shopId = '') => 
    request(`/transactions/${id}${shopId ? `?shopId=${shopId}` : ''}`, { method: 'DELETE' }),
  getTransactionSummary: (shopId) => request(`/transactions/summary?shopId=${shopId}`),
  getUdhaarLedger: (shopId) => request(`/transactions/udhaar-ledger?shopId=${shopId}`),

  // Credit Scoring
  getCreditScore: (shopId) => request(`/credit-score?shopId=${shopId}`),
  simulateCreditScore: (payload) => request('/credit-score/simulate', { method: 'POST', body: JSON.stringify(payload) }),

  // Schemes
  getMatchedSchemes: (shopId) => request(`/schemes/match?shopId=${shopId}`),
  getAllSchemes: (category = '', maxAmount = '') => {
    let q = '';
    if (category) q += `?category=${encodeURIComponent(category)}`;
    if (maxAmount) q += `${q ? '&' : '?'}maxAmount=${maxAmount}`;
    return request(`/schemes${q}`);
  },
  getSchemeDetail: (id) => request(`/schemes/${id}`),

  // Advisory
  chatAdvisor: (shopId, question) => 
    request('/advisor/chat', { method: 'POST', body: JSON.stringify({ shopId, question }) }),
  getAdvisorHistory: (shopId) => request(`/advisor/history?shopId=${shopId}`),
  getSeasonalCues: (shopId) => request(`/advisor/cues?shopId=${shopId}`),

  // Bank Dossier
  generateDossier: (shopId) => request(`/dossier/generate?shopId=${shopId}`),
};
