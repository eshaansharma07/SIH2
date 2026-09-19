/**
 * phoneUtils.js
 * Comprehensive phone normalization and validation utilities for SaakhSetu.
 * Normalizes Indian mobile phone numbers to E.164 standard (+91XXXXXXXXXX).
 */

/**
 * Validates and normalizes an Indian phone number to E.164 format (+91XXXXXXXXXX).
 * 
 * Supports:
 * - 10 digits: "9876543210" -> "+919876543210"
 * - Country code with +: "+919876543210" -> "+919876543210"
 * - Country code without +: "919876543210" -> "+919876543210"
 * - Leading zero (STD): "09876543210" -> "+919876543210"
 * - Spaced/punctuated: "+91 98765 43210", "98765-43210", etc.
 * 
 * @param {string|number} rawPhone
 * @returns {string|null} Normalized E.164 phone or null if invalid
 */
export function normalizeIndianPhone(rawPhone) {
  if (!rawPhone) return null;
  const str = String(rawPhone).trim();
  if (!str) return null;

  // Extract all digit characters
  const digits = str.replace(/\D/g, '');

  let nationalDigits = '';

  if (digits.length === 10) {
    // Exact 10 digits: "9876543210"
    nationalDigits = digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // 11 digits starting with 0: "09876543210"
    nationalDigits = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    // 12 digits starting with 91: "919876543210"
    nationalDigits = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith('091')) {
    nationalDigits = digits.slice(3);
  } else {
    return null;
  }

  // Indian mobile numbers must be 10 digits and start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(nationalDigits)) {
    return null;
  }

  return `+91${nationalDigits}`;
}

/**
 * Extracts the 10-digit national number from any phone format.
 * Useful for legacy database lookups where numbers might have been stored without +91.
 * 
 * @param {string|number} rawPhone 
 * @returns {string|null} 10-digit string or null
 */
export function extract10Digits(rawPhone) {
  const normalized = normalizeIndianPhone(rawPhone);
  if (!normalized) return null;
  return normalized.replace('+91', '');
}

/**
 * Checks if input is a valid Indian mobile number.
 * 
 * @param {string|number} rawPhone 
 * @returns {boolean}
 */
export function isValidIndianPhone(rawPhone) {
  return normalizeIndianPhone(rawPhone) !== null;
}

/**
 * Masks a phone number for privacy display in UI.
 * e.g. "+919876543210" -> "+91 98XXX XX210"
 * 
 * @param {string|number} rawPhone 
 * @returns {string} Masked phone string
 */
export function maskPhoneNumber(rawPhone) {
  const normalized = normalizeIndianPhone(rawPhone);
  if (!normalized) return '+91 XXXXX XXXXX';
  const digits = normalized.replace('+91', '');
  return `+91 ${digits.slice(0, 2)}XXX XX${digits.slice(7)}`;
}
