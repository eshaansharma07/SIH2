/**
 * customerMatcher.js
 * Unified customer lookup, live search suggestions, and phone management
 * for SaakhSetu Bahi-Khata transaction recording.
 */

import { DEMO_UDHAAR_LEDGER } from '../data/demoData.js';
import { safeStorage } from './safeStorage.js';

// Strips common honorifics, titles, and extra whitespace for fuzzy matching
export function normalizeCustomerName(rawName) {
  if (!rawName) return '';
  return String(rawName)
    .trim()
    .toLowerCase()
    .replace(/^(?:shri|smt|shrimati|mr|mrs|masterji|chacha|chachi|bhaiya|didi|panditji|sethji|dada|babu|ji)\b\s*/i, '')
    .replace(/\s+(?:ji|bhai|bhaiya|sahab|saheb|seth)$/i, '')
    .trim();
}

// Cleans phone to last 10 digits
export function cleanIndianPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-10);
}

// Validates 10-digit Indian mobile (starts with 6, 7, 8, 9)
export function isValidIndianPhone(phone) {
  const clean = cleanIndianPhone(phone);
  return /^[6-9]\d{9}$/.test(clean);
}

// Formats phone as "98765xxxxx"
export function maskIndianPhone(phone) {
  const clean = cleanIndianPhone(phone);
  if (!clean || clean.length < 5) return clean || '';
  return `${clean.slice(0, 5)}xxxxx`;
}

// Extracts standard fields from customer object or string
export function getCustomerDetails(c) {
  if (!c) return { id: '', name: '', phone: '', cleanPhone: '', village: '', balanceOwed: 0, txCount: 0, udhaarStatus: 'No Pending Udhaar', createdAt: null, notes: '', creditLimit: 5000 };
  if (typeof c === 'string') {
    return { id: '', name: c, phone: '', cleanPhone: '', village: '', balanceOwed: 0, txCount: 0, udhaarStatus: 'No Pending Udhaar', createdAt: null, notes: '', creditLimit: 5000 };
  }
  const name = String(c.name || c.customerName || c.customer_vendor_name || '').trim();
  const rawPhone = String(c.phone || c.customerPhone || c.customer_phone || '').trim();
  const cleanPhone = cleanIndianPhone(rawPhone);
  const village = String(c.village || c.village_address || '').trim();
  const balanceOwed = Number(c.balanceOwed ?? c.balance_owed ?? 0) || 0;
  const id = String(c.id || c.customerId || '');
  const txCount = Number(c.txCount ?? c.totalTransactions ?? (Array.isArray(c.history) ? c.history.length : 0)) || 0;
  const udhaarStatus = balanceOwed > 0 ? 'Udhaar Active' : 'No Pending Udhaar';
  const createdAt = c.created_at || c.createdAt || c.customerSince || null;
  const notes = String(c.notes || '');
  const creditLimit = Number(c.credit_limit ?? c.creditLimit ?? 5000) || 5000;

  return { 
    id, 
    name, 
    phone: rawPhone, 
    cleanPhone, 
    village, 
    balanceOwed, 
    txCount,
    udhaarStatus,
    createdAt,
    notes,
    creditLimit,
    raw: c 
  };
}

// Find customer by exact 10-digit clean phone
export function findCustomerByPhone(phone, customerList = []) {
  if (!phone || !customerList || customerList.length === 0) return null;
  const clean = cleanIndianPhone(phone);
  if (clean.length < 10) return null;
  for (const item of customerList) {
    const details = getCustomerDetails(item);
    if (details.cleanPhone === clean) {
      return details;
    }
  }
  return null;
}

/**
 * Robust multi-pass matcher:
 * Returns the best matching customer object or null.
 */
export function findMatchingCustomer(query, customerList = []) {
  if (!query || typeof query !== 'string' || !customerList || customerList.length === 0) {
    return null;
  }

  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return null;
  const normQuery = normalizeCustomerName(cleanQuery);

  let bestMatch = null;
  let highestScore = 0;

  for (const item of customerList) {
    const details = getCustomerDetails(item);
    if (!details.name) continue;

    const rawNameLower = details.name.trim().toLowerCase();
    const normName = normalizeCustomerName(rawNameLower);

    // 1. Exact match (score: 100)
    if (rawNameLower === cleanQuery) {
      return details;
    }

    // 2. Exact match on normalized name (score: 90)
    if (normQuery && normName === normQuery) {
      return details;
    }

    // 3. One starts with the other (score: 80)
    if (normName.startsWith(normQuery) || rawNameLower.startsWith(cleanQuery)) {
      if (highestScore < 80) {
        highestScore = 80;
        bestMatch = details;
      }
      continue;
    }

    // 4. Substring match (score: 60)
    if (rawNameLower.includes(cleanQuery) || cleanQuery.includes(rawNameLower)) {
      if (highestScore < 60) {
        highestScore = 60;
        bestMatch = details;
      }
      continue;
    }

    if (normQuery.length >= 3 && (normName.includes(normQuery) || normQuery.includes(normName))) {
      if (highestScore < 50) {
        highestScore = 50;
        bestMatch = details;
      }
      continue;
    }

    // 5. Word-boundary match (e.g. "Ramswaroop" in "Masterji Ramswaroop")
    const words = rawNameLower.split(/\s+/);
    const queryWords = cleanQuery.split(/\s+/);
    const hasWordMatch = words.some(w => queryWords.includes(w) || (w.length >= 3 && cleanQuery.includes(w)));
    if (hasWordMatch) {
      if (highestScore < 40) {
        highestScore = 40;
        bestMatch = details;
      }
    }
  }

  return bestMatch;
}

/**
 * Filter customerList for live search suggestions dropdown.
 * Matches anywhere in the name or phone, prioritizing exact and prefix matches.
 */
export function searchCustomerSuggestions(query, customerList = [], limit = 6) {
  if (!customerList || customerList.length === 0) return [];

  const rawQuery = (query || '').trim().toLowerCase();

  // If no query, return first `limit` registered customers with valid names
  if (!rawQuery) {
    return customerList
      .map(getCustomerDetails)
      .filter(c => c.name)
      .slice(0, limit);
  }

  const normQuery = normalizeCustomerName(rawQuery);
  const cleanDigits = rawQuery.replace(/\D/g, '');

  const scored = [];

  for (const item of customerList) {
    const details = getCustomerDetails(item);
    if (!details.name) continue;

    const rawNameLower = details.name.toLowerCase();
    const normName = normalizeCustomerName(rawNameLower);

    let score = 0;

    // Phone match
    if (cleanDigits && details.cleanPhone && details.cleanPhone.includes(cleanDigits)) {
      score = 70;
    }

    // Name exact match
    if (rawNameLower === rawQuery) {
      score = Math.max(score, 100);
    } else if (normName && normName === normQuery) {
      score = Math.max(score, 90);
    } else if (rawNameLower.startsWith(rawQuery) || normName.startsWith(normQuery)) {
      score = Math.max(score, 80);
    } else if (rawNameLower.includes(rawQuery) || normName.includes(normQuery)) {
      score = Math.max(score, 60);
    } else {
      // Word-level match
      const words = rawNameLower.split(/\s+/);
      if (words.some(w => w.startsWith(rawQuery) || (normQuery && w.startsWith(normQuery)))) {
        score = Math.max(score, 50);
      }
    }

    if (score > 0) {
      scored.push({ details, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.details);
}

/**
 * Synchronously retrieve cached customers from localStorage
 * or fallback to DEMO_UDHAAR_LEDGER for instant frame-0 rendering.
 */
export function getCachedCustomers(shopId) {
  if (!shopId) return [];
  try {
    const parsed = safeStorage.getJSON(`vyapaar_customers_${shopId}`);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (_) {}

  // Instant fallback for demo shop
  if (shopId === 'ramesh-kirana' || shopId === 'shop-demo-01') {
    return DEMO_UDHAAR_LEDGER;
  }

  return [];
}

/**
 * Cache customer list in safeStorage for offline resiliency & zero-latency startup.
 */
export function setCachedCustomers(shopId, customers) {
  if (!shopId || !Array.isArray(customers)) return;
  try {
    safeStorage.setJSON(`vyapaar_customers_${shopId}`, customers);
  } catch (_) {}
}
