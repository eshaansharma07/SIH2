import db from '../db/database.js';

/**
 * Sybil Attack & Sleeper Mule Ring Detector
 * Prevents syndicates from creating 100 dummy merchant accounts to claim
 * government yojana subsidies/loans routed into single sleeper accounts.
 */
export const sybilMuleDetectorService = {
  /**
   * 1. 1:1 Identity Deduplication
   * Ensures no two real shops share the same bank account number or Udyam number
   */
  checkIdentityDeduplication(bankAccount, udyamNumber, currentShopId = null) {
    // Check Bank Account uniqueness across non-demo shops
    if (bankAccount && typeof bankAccount === 'string' && bankAccount.trim()) {
      const cleanAcc = bankAccount.trim().toLowerCase();
      try {
        const query = currentShopId
          ? db.prepare(`
              SELECT id, name, phone, bank_account_type FROM shops 
              WHERE LOWER(bank_account_type) = ? AND id != ? AND is_demo = 0
            `)
          : db.prepare(`
              SELECT id, name, phone, bank_account_type FROM shops 
              WHERE LOWER(bank_account_type) = ? AND is_demo = 0
            `);

        const matches = currentShopId
          ? query.all(cleanAcc, currentShopId)
          : query.all(cleanAcc);

        if (matches && matches.length > 0) {
          return {
            allowed: false,
            field: 'bank_account',
            error: `Security Alert: This commercial bank account is already tied to active enterprise "${matches[0].name}". Multi-shop binding prohibited by RBI PML rules.`,
            existingShopId: matches[0].id
          };
        }
      } catch (e) {
        console.warn('Bank account deduplication check error:', e.message);
      }
    }

    // Check Udyam Registration number uniqueness
    if (udyamNumber && typeof udyamNumber === 'string' && udyamNumber.trim()) {
      const cleanUdyam = udyamNumber.trim().toUpperCase();
      try {
        const query = currentShopId
          ? db.prepare(`
              SELECT id, name, udyam_number FROM shops 
              WHERE UPPER(udyam_number) = ? AND id != ? AND is_demo = 0
            `)
          : db.prepare(`
              SELECT id, name, udyam_number FROM shops 
              WHERE UPPER(udyam_number) = ? AND is_demo = 0
            `);

        const matches = currentShopId
          ? query.all(cleanUdyam, currentShopId)
          : query.all(cleanUdyam);

        if (matches && matches.length > 0) {
          return {
            allowed: false,
            field: 'udyam_number',
            error: `Security Alert: Udyam certificate ${cleanUdyam} is already registered to "${matches[0].name}". One MSME enterprise per certificate allowed.`,
            existingShopId: matches[0].id
          };
        }
      } catch (e) {
        console.warn('Udyam deduplication check error:', e.message);
      }
    }

    return { allowed: true };
  },

  /**
   * 2. Device & Hardware Telemetry Clustering
   * Prohibits phone farms or emulators from operating > 2 real merchant profiles
   */
  checkDeviceClustering(deviceId, currentShopId = null) {
    if (!deviceId || typeof deviceId !== 'string' || !deviceId.trim()) {
      return { allowed: true };
    }

    const cleanDeviceId = deviceId.trim();
    try {
      // Ensure device_id column exists
      try {
        db.exec("ALTER TABLE shops ADD COLUMN device_id TEXT DEFAULT '';");
      } catch (_) {}

      const query = currentShopId
        ? db.prepare("SELECT count(*) as count FROM shops WHERE device_id = ? AND id != ? AND is_demo = 0")
        : db.prepare("SELECT count(*) as count FROM shops WHERE device_id = ? AND is_demo = 0");

      const row = currentShopId ? query.get(cleanDeviceId, currentShopId) : query.get(cleanDeviceId);
      const count = row?.count || 0;

      if (count >= 2) {
        return {
          allowed: false,
          error: 'Hardware Security Policy: Maximum permissible active enterprise registrations reached for this device terminal.',
          deviceClusteringCount: count
        };
      }
    } catch (e) {
      console.warn('Device clustering check error:', e.message);
    }

    return { allowed: true };
  },

  /**
   * 3. Hub-and-Spoke Mule Ring Graph Detection
   * Analyzes fund routing patterns to detect if multiple newly-created shops are funnelling
   * loan funds or outflow expenses to the exact same beneficiary account/phone
   */
  detectHubAndSpokeMulePattern(shopId = null) {
    try {
      const suspiciousMules = db.prepare(`
        SELECT customer_phone, COUNT(DISTINCT shop_id) as shop_count, SUM(amount) as total_diverted
        FROM transactions 
        WHERE type IN ('expense', 'udhaar_given') 
          AND customer_phone IS NOT NULL 
          AND customer_phone != ''
        GROUP BY customer_phone
        HAVING shop_count >= 2
        ORDER BY shop_count DESC, total_diverted DESC
      `).all();

      const rings = suspiciousMules.map(m => {
        const severity = m.shop_count >= 4 ? 'CRITICAL_MULE_RING' : 'ELEVATED_CONCENTRATION_RISK';
        return {
          beneficiaryPhone: m.customer_phone,
          connectedShopCount: m.shop_count,
          totalVolumeTransferred: m.total_diverted,
          severity,
          action: severity === 'CRITICAL_MULE_RING' ? 'FREEZE_SCHEME_DISBURSAL' : 'FLAG_FOR_FIELD_AUDIT'
        };
      });

      // If specific shopId checked, see if this shop touches any flagged mule node
      let shopRisk = 'LOW';
      if (shopId) {
        const shopPhones = db.prepare(`
          SELECT DISTINCT customer_phone 
          FROM transactions 
          WHERE shop_id = ? AND type IN ('expense', 'udhaar_given')
        `).all(shopId).map(r => r.customer_phone);

        const touchesMule = rings.some(r => shopPhones.includes(r.beneficiaryPhone));
        if (touchesMule) {
          shopRisk = 'HIGH_MULE_ASSOCIATION';
        }
      }

      return {
        detectedMuleRingsCount: rings.length,
        rings,
        shopRisk,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.warn('Mule detection error:', e.message);
      return { detectedMuleRingsCount: 0, rings: [], shopRisk: 'LOW' };
    }
  }
};
