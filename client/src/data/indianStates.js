// Standardized List of 28 Indian States and 8 Union Territories
// Format: { id: 'StateName', labelEn: 'State Name', labelHi: 'हिंदी नाम', isUt: boolean }

export const INDIAN_STATES_AND_UTS = [
  // 28 States
  { id: 'Andhra Pradesh', labelEn: 'Andhra Pradesh', labelHi: 'आंध्र प्रदेश', isUt: false },
  { id: 'Arunachal Pradesh', labelEn: 'Arunachal Pradesh', labelHi: 'अरुणाचल प्रदेश', isUt: false },
  { id: 'Assam', labelEn: 'Assam', labelHi: 'असम', isUt: false },
  { id: 'Bihar', labelEn: 'Bihar', labelHi: 'बिहार', isUt: false },
  { id: 'Chhattisgarh', labelEn: 'Chhattisgarh', labelHi: 'छत्तीसगढ़', isUt: false },
  { id: 'Goa', labelEn: 'Goa', labelHi: 'गोवा', isUt: false },
  { id: 'Gujarat', labelEn: 'Gujarat', labelHi: 'गुजरात', isUt: false },
  { id: 'Haryana', labelEn: 'Haryana', labelHi: 'हरियाणा', isUt: false },
  { id: 'Himachal Pradesh', labelEn: 'Himachal Pradesh', labelHi: 'हिमाचल प्रदेश', isUt: false },
  { id: 'Jharkhand', labelEn: 'Jharkhand', labelHi: 'झारखंड', isUt: false },
  { id: 'Karnataka', labelEn: 'Karnataka', labelHi: 'कर्नाटक', isUt: false },
  { id: 'Kerala', labelEn: 'Kerala', labelHi: 'केरल', isUt: false },
  { id: 'Madhya Pradesh', labelEn: 'Madhya Pradesh', labelHi: 'मध्य प्रदेश', isUt: false },
  { id: 'Maharashtra', labelEn: 'Maharashtra', labelHi: 'महाराष्ट्र', isUt: false },
  { id: 'Manipur', labelEn: 'Manipur', labelHi: 'मणिपुर', isUt: false },
  { id: 'Meghalaya', labelEn: 'Meghalaya', labelHi: 'मेघालय', isUt: false },
  { id: 'Mizoram', labelEn: 'Mizoram', labelHi: 'मिजोरम', isUt: false },
  { id: 'Nagaland', labelEn: 'Nagaland', labelHi: 'नागालैंड', isUt: false },
  { id: 'Odisha', labelEn: 'Odisha', labelHi: 'ओडिशा', isUt: false },
  { id: 'Punjab', labelEn: 'Punjab', labelHi: 'पंजाब', isUt: false },
  { id: 'Rajasthan', labelEn: 'Rajasthan', labelHi: 'राजस्थान', isUt: false },
  { id: 'Sikkim', labelEn: 'Sikkim', labelHi: 'सिक्किम', isUt: false },
  { id: 'Tamil Nadu', labelEn: 'Tamil Nadu', labelHi: 'तमिलनाडु', isUt: false },
  { id: 'Telangana', labelEn: 'Telangana', labelHi: 'तेलंगाना', isUt: false },
  { id: 'Tripura', labelEn: 'Tripura', labelHi: 'त्रिपुरा', isUt: false },
  { id: 'Uttar Pradesh', labelEn: 'Uttar Pradesh', labelHi: 'उत्तर प्रदेश', isUt: false },
  { id: 'Uttarakhand', labelEn: 'Uttarakhand', labelHi: 'उत्तराखंड', isUt: false },
  { id: 'West Bengal', labelEn: 'West Bengal', labelHi: 'पश्चिम बंगाल', isUt: false },

  // 8 Union Territories
  { id: 'Andaman and Nicobar Islands', labelEn: 'Andaman & Nicobar Islands (UT)', labelHi: 'अंडमान और निकोबार द्वीप समूह (UT)', isUt: true },
  { id: 'Chandigarh', labelEn: 'Chandigarh (UT)', labelHi: 'चंडीगढ़ (UT)', isUt: true },
  { id: 'Dadra and Nagar Haveli and Daman and Diu', labelEn: 'Dadra & Nagar Haveli and Daman & Diu (UT)', labelHi: 'दादरा और नगर हवेली एवं दमन और दीव (UT)', isUt: true },
  { id: 'Delhi', labelEn: 'Delhi (NCT)', labelHi: 'दिल्ली (NCT)', isUt: true },
  { id: 'Jammu and Kashmir', labelEn: 'Jammu & Kashmir (UT)', labelHi: 'जम्मू और कश्मीर (UT)', isUt: true },
  { id: 'Ladakh', labelEn: 'Ladakh (UT)', labelHi: 'लद्दाख (UT)', isUt: true },
  { id: 'Lakshadweep', labelEn: 'Lakshadweep (UT)', labelHi: 'लक्षद्वीप (UT)', isUt: true },
  { id: 'Puducherry', labelEn: 'Puducherry (UT)', labelHi: 'पुदुचेरी (UT)', isUt: true }
];

export function findStandardState(input) {
  if (!input || typeof input !== 'string') return '';
  const clean = input.trim().toLowerCase();
  const match = INDIAN_STATES_AND_UTS.find(
    s => s.id.toLowerCase() === clean || 
         s.labelEn.toLowerCase().includes(clean) || 
         s.labelHi.includes(clean)
  );
  return match ? match.id : input;
}
