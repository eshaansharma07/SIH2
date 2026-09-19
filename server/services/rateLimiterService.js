/**
 * rateLimiterService.js
 * In-memory rate limiting and cooldown enforcement for OTP dispatch and verification.
 */

// Phone -> Timestamp of last send
const sendCooldownMap = new Map();

// Phone -> { attempts: number, firstAttemptTime: number }
const verifyAttemptsMap = new Map();

// IP -> Array of timestamps
const ipRequestsMap = new Map();

const SEND_COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown
const MAX_VERIFY_ATTEMPTS = 5;       // 5 wrong attempts max
const VERIFY_WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout window
const MAX_IP_REQUESTS = 15;          // 15 requests per IP
const IP_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes

export const rateLimiterService = {
  /**
   * Checks if an OTP can be sent to the given phone number based on 30s cooldown.
   * @param {string} phone E.164 normalized phone
   * @returns {{ allowed: boolean, retryAfterSeconds: number }}
   */
  checkOtpSendCooldown(phone) {
    if (!phone) return { allowed: true, retryAfterSeconds: 0 };
    const now = Date.now();
    const lastSent = sendCooldownMap.get(phone);

    if (lastSent && (now - lastSent) < SEND_COOLDOWN_MS) {
      const remainingMs = SEND_COOLDOWN_MS - (now - lastSent);
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(remainingMs / 1000)
      };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  },

  /**
   * Records that an OTP was sent to the phone number.
   * @param {string} phone 
   */
  recordOtpSent(phone) {
    if (!phone) return;
    sendCooldownMap.set(phone, Date.now());
  },

  /**
   * Checks if verification attempts are within the allowed limit.
   * @param {string} phone E.164 normalized phone
   * @returns {{ allowed: boolean, remainingAttempts: number, retryAfterSeconds: number }}
   */
  checkVerifyAttempts(phone) {
    if (!phone) return { allowed: true, remainingAttempts: MAX_VERIFY_ATTEMPTS, retryAfterSeconds: 0 };
    const now = Date.now();
    const record = verifyAttemptsMap.get(phone);

    if (!record) {
      return { allowed: true, remainingAttempts: MAX_VERIFY_ATTEMPTS, retryAfterSeconds: 0 };
    }

    // Reset if window has expired
    if (now - record.firstAttemptTime > VERIFY_WINDOW_MS) {
      verifyAttemptsMap.delete(phone);
      return { allowed: true, remainingAttempts: MAX_VERIFY_ATTEMPTS, retryAfterSeconds: 0 };
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      const remainingMs = VERIFY_WINDOW_MS - (now - record.firstAttemptTime);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds: Math.ceil(remainingMs / 1000)
      };
    }

    return {
      allowed: true,
      remainingAttempts: MAX_VERIFY_ATTEMPTS - record.attempts,
      retryAfterSeconds: 0
    };
  },

  /**
   * Records a failed verification attempt.
   * @param {string} phone 
   */
  recordVerifyFailure(phone) {
    if (!phone) return;
    const now = Date.now();
    const record = verifyAttemptsMap.get(phone);

    if (!record || (now - record.firstAttemptTime > VERIFY_WINDOW_MS)) {
      verifyAttemptsMap.set(phone, { attempts: 1, firstAttemptTime: now });
    } else {
      record.attempts += 1;
    }
  },

  /**
   * Clears verification failure records upon successful OTP verification.
   * @param {string} phone 
   */
  resetVerifyAttempts(phone) {
    if (!phone) return;
    verifyAttemptsMap.delete(phone);
  },

  /**
   * Checks IP-level rate limiting.
   * @param {string} ip 
   * @returns {{ allowed: boolean }}
   */
  checkIpRateLimit(ip) {
    if (!ip) return { allowed: true };
    const now = Date.now();
    let timestamps = ipRequestsMap.get(ip) || [];

    // Filter out timestamps outside window
    timestamps = timestamps.filter(t => (now - t) < IP_WINDOW_MS);
    
    if (timestamps.length >= MAX_IP_REQUESTS) {
      return { allowed: false };
    }

    timestamps.push(now);
    ipRequestsMap.set(ip, timestamps);
    return { allowed: true };
  },

  /**
   * Resets all rate limit tracking (intended for unit tests).
   */
  resetForTesting() {
    sendCooldownMap.clear();
    verifyAttemptsMap.clear();
    ipRequestsMap.clear();
  }
};
