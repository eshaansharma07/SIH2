/**
 * twilioVerifyService.js
 * Twilio Verify v2 service integration for SaakhSetu.
 * Handles real-time SMS OTP dispatch and verification.
 * 
 * Never logs OTPs.
 * Never exposes credentials to client.
 * Maps raw provider errors to clean, safe user-facing error messages.
 */

import twilio from 'twilio';

let twilioClientInstance = null;
let mockClientOverride = null;

export const twilioVerifyService = {
  /**
   * Checks whether all required Twilio Verify v2 credentials are present.
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
    );
  },

  /**
   * Allows injecting a mock client for automated testing.
   * @param {object|null} mock 
   */
  setMockClient(mock) {
    mockClientOverride = mock;
  },

  /**
   * Gets or initializes the Twilio client.
   * @returns {object}
   */
  getClient() {
    if (mockClientOverride) {
      return mockClientOverride;
    }

    if (!this.isConfigured()) {
      throw new Error("We couldn't send the OTP right now. Please try again shortly.");
    }

    if (!twilioClientInstance) {
      twilioClientInstance = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }

    return twilioClientInstance;
  },

  /**
   * Returns configured Verify Service SID.
   * @returns {string}
   */
  getServiceSid() {
    if (mockClientOverride) {
      return 'VA_MOCK_VERIFY_SERVICE_SID';
    }
    return process.env.TWILIO_VERIFY_SERVICE_SID;
  },

  /**
   * Sends an SMS OTP to a normalized E.164 phone number.
   * @param {string} normalizedPhone e.g. "+919876543210"
   * @returns {Promise<{ success: boolean, status: string }>}
   */
  async sendVerification(normalizedPhone) {
    try {
      const client = this.getClient();
      const serviceSid = this.getServiceSid();

      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications
        .create({ to: normalizedPhone, channel: 'sms' });

      return {
        success: true,
        status: verification.status
      };
    } catch (err) {
      console.error('[Twilio Verify] Send failed:', err.message || 'Unknown error');

      // Map Twilio error codes to clean, secure messages
      if (err.code === 60200) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }
      if (err.code === 60203) {
        throw new Error('Too many verification attempts. Please wait and try again later.');
      }
      if (err.code === 60202) {
        throw new Error('Too many verification attempts. Please wait and try again later.');
      }

      throw new Error("We couldn't send the OTP right now. Please try again shortly.");
    }
  },

  /**
   * Verifies an OTP code submitted by the user.
   * @param {string} normalizedPhone e.g. "+919876543210"
   * @param {string} code 6-digit OTP
   * @returns {Promise<{ success: boolean, approved: boolean }>}
   */
  async checkVerification(normalizedPhone, code) {
    try {
      const client = this.getClient();
      const serviceSid = this.getServiceSid();

      const check = await client.verify.v2
        .services(serviceSid)
        .verificationChecks
        .create({ to: normalizedPhone, code });

      if (check.status === 'approved') {
        return {
          success: true,
          approved: true
        };
      }

      return {
        success: false,
        approved: false,
        error: 'Incorrect OTP. Please check the SMS and try again.'
      };
    } catch (err) {
      console.error('[Twilio Verify] Verification check failed:', err.message || 'Unknown error');

      if (err.code === 20404) {
        throw new Error('OTP expired. Please request a new OTP.');
      }
      if (err.code === 60202) {
        throw new Error('Too many verification attempts. Please wait and try again later.');
      }
      if (err.code === 60200) {
        throw new Error('Please enter a valid 6-digit OTP.');
      }

      throw new Error(err.message || 'Verification failed. Please try again.');
    }
  }
};
