let API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

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
        const directRes = await fetch(`http://127.0.0.1:3001/api${endpoint}`, {
          ...options,
          headers: {
            ...defaultHeaders,
            ...options.headers,
          },
        });
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
  getShopCurrent: (shopId = 'ramesh-kirana') => request(`/shop/current?shopId=${shopId}`),
  setupShop: (data) => request('/shop/setup', { method: 'POST', body: JSON.stringify(data) }),
  resetDemoShop: () => request('/shop/reset-demo', { method: 'POST' }),
  updateShop: (id, data) => request(`/shop/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Transactions & Bahi-Khata
  getTransactions: (shopId = 'ramesh-kirana', type = '', limit = 50) => 
    request(`/transactions?shopId=${shopId}${type ? `&type=${type}` : ''}&limit=${limit}`),
  createTransaction: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  getTransactionSummary: (shopId = 'ramesh-kirana') => request(`/transactions/summary?shopId=${shopId}`),
  getUdhaarLedger: (shopId = 'ramesh-kirana') => request(`/transactions/udhaar-ledger?shopId=${shopId}`),

  // Credit Scoring
  getCreditScore: (shopId = 'ramesh-kirana') => request(`/credit-score?shopId=${shopId}`),
  simulateCreditScore: (payload) => request('/credit-score/simulate', { method: 'POST', body: JSON.stringify(payload) }),

  // Schemes
  getMatchedSchemes: (shopId = 'ramesh-kirana') => request(`/schemes/match?shopId=${shopId}`),
  getAllSchemes: (category = '', maxAmount = '') => {
    let q = '';
    if (category) q += `?category=${encodeURIComponent(category)}`;
    if (maxAmount) q += `${q ? '&' : '?'}maxAmount=${maxAmount}`;
    return request(`/schemes${q}`);
  },
  getSchemeDetail: (id) => request(`/schemes/${id}`),

  // Advisory
  chatAdvisor: (shopId = 'ramesh-kirana', question) => 
    request('/advisor/chat', { method: 'POST', body: JSON.stringify({ shopId, question }) }),
  getAdvisorHistory: (shopId = 'ramesh-kirana') => request(`/advisor/history?shopId=${shopId}`),
  getSeasonalCues: (shopId = 'ramesh-kirana') => request(`/advisor/cues?shopId=${shopId}`),

  // Bank Dossier
  generateDossier: (shopId = 'ramesh-kirana') => request(`/dossier/generate?shopId=${shopId}`),
};
