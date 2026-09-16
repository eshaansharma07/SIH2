// Voice Hindi & English Bahi-Khata Rule-Based Parser + Claude AI Fallback

const HINDI_NUMBER_WORDS = {
  'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
  'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
  'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  'इक्कीस': 21, 'बाईस': 22, 'तेईस': 23, 'चौबीस': 24, 'पच्चीस': 25,
  'छब्बीस': 26, 'सत्ताईस': 27, 'अट्ठाईस': 28, 'उनतीस': 29, 'तीस': 30,
  'इकतीस': 31, 'बत्तीस': 32, 'तैंतीस': 33, 'चौंतीस': 34, 'पैंतीस': 35,
  'छत्तीस': 36, 'सैंतीस': 37, 'अड़तीस': 38, 'उनतालीस': 39, 'चालीस': 40,
  'इकतालीस': 41, 'बयालीस': 42, 'तैंतालीस': 43, 'चवालीस': 44, 'पैंतालीस': 45,
  'छियालीस': 46, 'सैंतालीस': 47, 'अड़तालीस': 48, 'उनचास': 49, 'पचास': 50,
  'इक्यावन': 51, 'बावन': 52, 'तिरेपन': 53, 'चौवन': 54, 'पचपन': 55,
  'छप्पन': 56, 'सत्तावन': 57, 'अट्ठावन': 58, 'उनसठ': 59, 'साठ': 60,
  'इकसठ': 61, 'बासठ': 62, 'तिरसठ': 63, 'चौंसठ': 64, 'पैंसठ': 65,
  'छियासठ': 66, 'सड़सठ': 67, 'अड़सठ': 68, 'उनहत्तर': 69, 'सत्तर': 70,
  'इकहत्तर': 71, 'बहत्तर': 72, 'तिहत्तर': 73, 'चौहत्तर': 74, 'पचहत्तर': 75,
  'छिहत्तर': 76, 'सतहत्तर': 77, 'अठहत्तर': 78, 'उनासी': 79, 'अस्सी': 80,
  'इक्यासी': 81, 'बयासी': 82, 'तिरासी': 83, 'चौरासी': 84, 'पचासी': 85,
  'छियासी': 86, 'सत्तासी': 87, 'अट्ठासी': 88, 'नवासी': 89, 'नब्बे': 90,
  'इक्यानवे': 91, 'बानवे': 92, 'तिरानवे': 93, 'चौरानवे': 94, 'पंचानवे': 95,
  'छियानवे': 96, 'सत्तानवे': 97, 'अट्ठानवे': 98, 'निन्यानवे': 99,
  // Fractions & special multiples
  'डेढ़ सौ': 150, 'डेढ सौ': 150, 'ढाई सौ': 250,
  'डेढ़ हज़ार': 1500, 'डेढ हजार': 1500, 'ढाई हज़ार': 2500, 'ढाई हजार': 2500
};

const DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

function normalizeDevanagariDigits(text) {
  return text.replace(/[०-९]/g, d => DEVANAGARI_DIGITS[d] || d);
}

export function parseHindiAmount(text) {
  if (!text) return null;
  const clean = normalizeDevanagariDigits(text.trim());

  // 1. Direct digit match e.g. "₹500", "500 रुपये", "500", "Rs 500"
  const digitMatch = clean.match(/(?:₹|rs\.?|रुपये|रु\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:₹|rs\.?|रुपये|रु\.?|inr)?/i);
  if (digitMatch && Number(digitMatch[1]) > 0) {
    const rawNum = Number(digitMatch[1]);
    // Check if followed by "हज़ार" / "सौ" / "लाख"
    if (/हज़ार|हजार|thousand|k\b/i.test(clean) && rawNum < 1000) {
      return rawNum * 1000;
    }
    if (/सौ|hundred/i.test(clean) && rawNum < 100) {
      return rawNum * 100;
    }
    if (/लाख|lakh/i.test(clean) && rawNum < 100) {
      return rawNum * 100000;
    }
    return rawNum;
  }

  // 2. Special fraction checks
  if (/डेढ़\s*सौ|डेढ\s*सौ/i.test(clean)) return 150;
  if (/ढाई\s*सौ/i.test(clean)) return 250;
  if (/डेढ़\s*(?:हज़ार|हजार)/i.test(clean)) return 1500;
  if (/ढाई\s*(?:हज़ार|हजार)/i.test(clean)) return 2500;

  // 3. Multiplier combinations (e.g. "पांच सौ", "दो हज़ार", "तीन सौ पचास", "दस हज़ार")
  let total = 0;
  let currentGroup = 0;

  const tokens = clean.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i].replace(/[.,?!]/g, '');

    if (word === 'लाख' || word === 'lakh') {
      const mult = currentGroup || 1;
      total += mult * 100000;
      currentGroup = 0;
    } else if (word === 'हज़ार' || word === 'हजार' || word === 'thousand') {
      const mult = currentGroup || 1;
      total += mult * 1000;
      currentGroup = 0;
    } else if (word === 'सौ' || word === 'hundred') {
      const mult = currentGroup || 1;
      total += mult * 100;
      currentGroup = 0;
    } else if (HINDI_NUMBER_WORDS[word] !== undefined) {
      currentGroup += HINDI_NUMBER_WORDS[word];
    }
  }

  total += currentGroup;
  return total > 0 ? total : null;
}

export function parseTransactionType(text) {
  if (!text) return 'income';
  const lower = text.toLowerCase();

  // Udhaar Repaid keywords
  if (
    lower.includes('उधार चुका') || 
    lower.includes('उधार वापस') || 
    lower.includes('खाता जमा') || 
    lower.includes('जमा किया') || 
    lower.includes('हिसाब चुकता') ||
    lower.includes('वापस मिला') ||
    lower.includes('repaid') ||
    lower.includes('settled')
  ) {
    return 'udhaar_repaid';
  }

  // Udhaar Given keywords
  if (
    lower.includes('उधार दिया') || 
    lower.includes('उधारी दी') || 
    lower.includes('उधार लिख') || 
    lower.includes('खाते में लिख') || 
    lower.includes('बाकी लिख') ||
    lower.includes('उधार') ||
    lower.includes('khata') ||
    lower.includes('credit')
  ) {
    return 'udhaar_given';
  }

  // Expense keywords
  if (
    lower.includes('खर्चा') || 
    lower.includes('खर्च') || 
    lower.includes('सामान खरीदा') || 
    lower.includes('खरीद') || 
    lower.includes('थोक खरीद') || 
    lower.includes('दुकान का सामान') || 
    lower.includes('किराया') || 
    lower.includes('बिजली बिल') || 
    lower.includes('माल मंगाया') ||
    lower.includes('expense') ||
    lower.includes('purchase')
  ) {
    return 'expense';
  }

  // Income / Sale keywords
  if (
    lower.includes('बिक्री') || 
    lower.includes('बिका') || 
    lower.includes('कैश मिला') || 
    lower.includes('नकद') || 
    lower.includes('गल्ला') || 
    lower.includes('कमाई') || 
    lower.includes('मिला') ||
    lower.includes('sale') ||
    lower.includes('income')
  ) {
    return 'income';
  }

  return 'income';
}

export function extractCustomerName(text, knownCustomers = []) {
  if (!text) return '';
  const clean = text.trim();

  // Check known customers first (direct or partial match)
  if (knownCustomers && knownCustomers.length > 0) {
    for (const c of knownCustomers) {
      const name = typeof c === 'string' ? c : (c.name || c.customerName || '');
      if (name && clean.toLowerCase().includes(name.toLowerCase())) {
        return name;
      }
      const firstName = name.split(' ')[0];
      if (firstName && firstName.length > 2 && clean.toLowerCase().includes(firstName.toLowerCase())) {
        return name;
      }
    }
  }

  // Pattern: "<Name> को <Amount> उधार दिया" or "<Name> से <Amount> मिला" or "<Name> का खाता"
  const koMatch = clean.match(/(?:श्री|श्रीमती|मास्टरजी)?\s*([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\s*(?:को|से|के|का)\s*(?:खाता|उधार|रुपये|[0-9]+|पांच|दो|तीन|चार|सौ|हजार)/i);
  if (koMatch && koMatch[1]) {
    const candidate = koMatch[1].trim();
    // Exclude common grammatical noise
    const noise = ['दुकान', 'आज', 'कल', 'सुबह', 'शाम', 'नकद', 'कैश', 'कुल', 'खाता', 'उधार', 'रुपये'];
    if (!noise.includes(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // Pattern: "उधार दिया <Name> को"
  const endMatch = clean.match(/(?:उधार दिया|खाते में लिखो)\s+([A-Za-z\u0900-\u097F]+)/i);
  if (endMatch && endMatch[1]) {
    return endMatch[1].trim();
  }

  return '';
}

export async function parseVoiceTranscriptWithFallback(transcript, { knownCustomers = [], shopId = '' } = {}) {
  const parsedAmount = parseHindiAmount(transcript);
  const parsedType = parseTransactionType(transcript);
  const parsedCustomer = extractCustomerName(transcript, knownCustomers);

  // If rule-based parser succeeded with high confidence (found amount and plausible type)
  if (parsedAmount !== null && parsedAmount > 0) {
    return {
      amount: parsedAmount,
      type: parsedType,
      customerName: parsedCustomer,
      category: parsedType === 'income' ? 'Daily Counter Sales' : parsedType === 'expense' ? 'Wholesale Stock Purchase' : 'Monthly Grocery Khata',
      method: 'rule-based',
      confidence: 'high'
    };
  }

  // If amount was missing or complex phrasing, invoke AI fallback (via server /advisor/chat or mock)
  try {
    const aiRes = await fetch('/api/advisor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId: shopId || 'ramesh-kirana',
        question: `Extract JSON only with keys "amount" (number), "type" ("income"|"expense"|"udhaar_given"|"udhaar_repaid"), "customerName" (string), "category" (string) from this rural merchant speech transcript: "${transcript}". Do not output any markdown or explanation, just the raw JSON.`
      })
    });

    if (aiRes.ok) {
      const data = await aiRes.json();
      const rawText = data?.reply || data?.answer || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.amount && Number(parsed.amount) > 0) {
          return {
            amount: Number(parsed.amount),
            type: parsed.type || parsedType,
            customerName: parsed.customerName || parsedCustomer,
            category: parsed.category || 'Daily Counter Sales',
            method: 'claude-fallback',
            confidence: 'high'
          };
        }
      }
    }
  } catch (err) {
    console.warn('[VoiceParser] AI fallback call skipped:', err.message);
  }

  // Graceful rule-based return even if partial
  return {
    amount: parsedAmount || 0,
    type: parsedType,
    customerName: parsedCustomer,
    category: parsedType === 'income' ? 'Daily Counter Sales' : parsedType === 'expense' ? 'Wholesale Stock Purchase' : 'Monthly Grocery Khata',
    method: 'rule-based',
    confidence: parsedAmount ? 'medium' : 'low'
  };
}
