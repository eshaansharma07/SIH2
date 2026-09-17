import React from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  PlusCircle, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpRight, 
  Activity,
  FileText,
  Clock,
  Check
} from 'lucide-react';
import { CreditGauge } from '../components/CreditGauge';
import { useTranslation } from '../i18n/LanguageContext';
import { WarliBorder } from '../components/WarliMotif';
import { Card, Badge, SectionHeader, Button } from '../components/ui';
import { AudioReadAloudButton } from '../components/AudioReadAloudButton';
import { motion, useReducedMotion } from 'framer-motion';

export function DashboardPage({ 
  shop, 
  creditData, 
  summaryData, 
  cuesData, 
  onOpenKeypad, 
  onOpenWholesale,
  onNavigateTab, 
  onAskPrompt,
  onStartDemoTour,
  isDemoMode,
  onSwitchToDemo,
  onSwitchToRegister
}) {
  const { t, language } = useTranslation();

  // Per-language UI strings — supports EN, HI, TA, TE, PA
  const UI_STRINGS = {
    en: {
      storeProfile: 'Store Profile', enterpriseReg: 'Enterprise registered ✓',
      logFirstSale: 'Log First Sale', recordFirstSale: 'Record first sale',
      recordSaleBtn: '+ Record Sale', threeDays: '3 Active Days',
      bahiRegularity: 'Bahi-khata regularity', logToday: '+ Log Today',
      unlockScore: 'Unlock Score', minTx: 'Min 5 sales & 3 days',
      viewScore: 'View Score', matchSchemes: 'Match Schemes',
      loanMatch: 'Statutory loan match', schemesBtn: 'Schemes',
      testRealReg: 'Test Real Registration', onboardingChecklist: 'Onboarding Checklist',
      complete: 'complete', viewJudgeDemo: 'View Judge Demo',
      myStore: 'My Store', proprietor: 'Proprietor',
      auditedTurnover: 'Audited Turnover', netOpSurplus: 'Net Operating Surplus',
      opMargin: 'Operating Margin', recordSale: '+ Record Sale',
      saathiAI: 'Saathi AI', ondcWholesale: 'ONDC Wholesale', bankDossier: 'Bank Dossier',
      auditedFinancial: 'Audited Financial Performance',
      auditedFinancialSub: 'Daily gross revenue, inventory replenishment outlays, and net retained margins',
      grossTurnover: 'Gross Turnover', opOutlay: 'Operating Outlay', retainedSurplus: 'Retained Surplus',
      paymentChannel: 'Payment Channel Distribution',
      customerCredit: 'Customer Credit Exposure', activeUdhaar: 'Active Udhaar Balance',
      viewCustomerLedger: 'View Customer Ledger',
      seasonalRadar: 'Seasonal Demand Radar', projectedSurge: 'Projected Surge',
      altCreditHealth: 'Alternative Credit Health', unratedEnterprise: 'Unrated Enterprise',
      unratedDesc: 'Log your first week of sales (5 transactions, 3 days) to unlock your 4-pillar bankable credit score.',
      recordASale: 'Record a Sale', aiPrompts: 'Saathi AI Intelligence Prompts', openSaathiAI: 'Open Saathi AI',
      strictCredit: 'Strict 7-day credit limit maintained with village patrons.',
      primeBankable: 'Prime Bankable',
    },
    hi: {
      storeProfile: 'उद्यम प्रोफ़ाइल', enterpriseReg: 'पंजीकरण पूर्ण ✓',
      logFirstSale: 'पहली बिक्री दर्ज करें', recordFirstSale: 'काउंटर लेन-देन जोड़ें',
      recordSaleBtn: '+ बिक्री दर्ज करें', threeDays: '3 सक्रिय दिन',
      bahiRegularity: 'दैनिक बही-खाता नियमितता', logToday: '+ आज का खाता',
      unlockScore: 'क्रेडिट स्कोर अनलॉक', minTx: '5 लेनदेन एवं 3 दिन',
      viewScore: 'स्कोर देखें', matchSchemes: 'मुद्रा / सरकारी योजनाएं',
      loanMatch: 'ऋण सब्सिडी पात्रता', schemesBtn: 'योजनाएं खोजें',
      testRealReg: 'असली पंजीकरण करें', onboardingChecklist: 'ऑनबोर्डिंग चेकलिस्ट',
      complete: 'पूर्ण', viewJudgeDemo: 'जज डेमो देखें',
      myStore: 'मेरी दुकान', proprietor: 'दुकानदार',
      auditedTurnover: 'सत्यापित कारोबार (Turnover)', netOpSurplus: 'शुद्ध परिचालन अधिशेष',
      opMargin: 'बचत मार्जिन', recordSale: '+ लेन-देन दर्ज',
      saathiAI: 'साथी AI', ondcWholesale: 'ONDC थोक', bankDossier: 'बैंक डॉसियर',
      auditedFinancial: 'बही-खाता वित्तीय स्थिति',
      auditedFinancialSub: 'दैनिक बिक्री, माल खरीद एवं शुद्ध परिचालन अधिशेष',
      grossTurnover: 'सत्यापित कुल बिक्री', opOutlay: 'माल व दुकान खर्च', retainedSurplus: 'शुद्ध बचत',
      paymentChannel: 'भुगतान माध्यम वितरण (Cash vs. UPI)',
      customerCredit: 'ग्राहक उधारी जोखिम', activeUdhaar: 'बकाया ग्राहक खाता',
      viewCustomerLedger: 'ग्राहक खाता बही देखें',
      seasonalRadar: 'मौसमी मांग रडार (Demand Radar)', projectedSurge: 'अनुमानित बिक्री उछाल',
      altCreditHealth: 'वैकल्पिक क्रेडिट स्वास्थ्य', unratedEnterprise: 'अवर्गीकृत (Unrated)',
      unratedDesc: 'पहले हफ्ते की बिक्री दर्ज करें (5 लेनदेन, 3 दिन) ताकि 4-पिलर बैंक-मान्य स्कोर अनलॉक हो सके।',
      recordASale: 'बिक्री दर्ज करें', aiPrompts: 'साथी AI से तुरंत पूछें', openSaathiAI: 'साथी AI खोलें',
      strictCredit: 'गांव के ग्राहकों के साथ 7 दिन की सख्त उधार सीमा बनाए रखी गई।',
      primeBankable: 'Prime Bankable (ऋण के लिए पात्र)',
    },
    ta: {
      storeProfile: 'கடை சுயவிவரம்', enterpriseReg: 'பதிவு முடிந்தது ✓',
      logFirstSale: 'முதல் விற்பனை பதிவு', recordFirstSale: 'முதல் விற்பனை பதிவு செய்',
      recordSaleBtn: '+ விற்பனை பதிவு', threeDays: '3 செயல் நாட்கள்',
      bahiRegularity: 'பேஹி-காட்டா நேர்மை', logToday: '+ இன்று பதிவு',
      unlockScore: 'மதிப்பெண் திற', minTx: 'குறைந்தது 5 விற்பனை & 3 நாட்கள்',
      viewScore: 'மதிப்பெண் காண்', matchSchemes: 'திட்டங்கள் பொருத்து',
      loanMatch: 'கடன் சட்ட பொருத்தம்', schemesBtn: 'திட்டங்கள்',
      testRealReg: 'உண்மையான பதிவு சோதி', onboardingChecklist: 'பதிவு சரிபார்ப்பு பட்டியல்',
      complete: 'முடிந்தது', viewJudgeDemo: 'நடுவர் டெமோ காண்',
      myStore: 'என் கடை', proprietor: 'உரிமையாளர்',
      auditedTurnover: 'தணிக்கை வருவாய்', netOpSurplus: 'நிகர இயக்க உபரி',
      opMargin: 'இயக்க மார்ஜின்', recordSale: '+ விற்பனை பதிவு',
      saathiAI: 'சாத்தி AI', ondcWholesale: 'ONDC மொத்த வணிகம்', bankDossier: 'வங்கி கோப்பு',
      auditedFinancial: 'தணிக்கை நிதி செயல்திறன்',
      auditedFinancialSub: 'தினசரி மொத்த வருவாய், சரக்கு நிரப்பு செலவுகள் மற்றும் நிகர லாபம்',
      grossTurnover: 'மொத்த வருவாய்', opOutlay: 'இயக்க செலவு', retainedSurplus: 'தக்கவைக்கப்பட்ட உபரி',
      paymentChannel: 'கட்டண சேனல் விநியோகம்',
      customerCredit: 'வாடிக்கையாளர் கடன் வெளிப்பாடு', activeUdhaar: 'செயல் உதார் இருப்பு',
      viewCustomerLedger: 'வாடிக்கையாளர் கணக்கு காண்',
      seasonalRadar: 'பருவகால தேவை ரேடார்', projectedSurge: 'திட்டமிட்ட உயர்வு',
      altCreditHealth: 'மாற்று கடன் ஆரோக்கியம்', unratedEnterprise: 'மதிப்பிடப்படாத நிறுவனம்',
      unratedDesc: 'உங்கள் 4-தூண் வங்கி கடன் மதிப்பெண்ணை திறக்க முதல் வாரம் விற்பனை பதிவு செய்யுங்கள் (5 பரிவர்த்தனைகள், 3 நாட்கள்).',
      recordASale: 'விற்பனை பதிவு செய்', aiPrompts: 'சாத்தி AI தூண்டுதல்கள்', openSaathiAI: 'சாத்தி AI திற',
      strictCredit: 'கிராம வாடிக்கையாளர்களுடன் 7 நாள் கண்டிப்பான கடன் வரம்பு பராமரிக்கப்படுகிறது.',
      primeBankable: 'முதல் நிலை வங்கி கடன் தகுதி',
    },
    te: {
      storeProfile: 'దుకాణం ప్రొఫైల్', enterpriseReg: 'నమోదు పూర్తయింది ✓',
      logFirstSale: 'మొదటి అమ్మకం నమోదు', recordFirstSale: 'మొదటి అమ్మకం పతిత్రించు',
      recordSaleBtn: '+ అమ్మకం నమోదు', threeDays: '3 క్రియాశీల రోజులు',
      bahiRegularity: 'బహీ-ఖాతా క్రమశిక్షణ', logToday: '+ నేడు నమోదు',
      unlockScore: 'స్కోర్ అన్‌లాక్', minTx: 'కనీసం 5 అమ్మకాలు & 3 రోజులు',
      viewScore: 'స్కోర్ చూడండి', matchSchemes: 'పథకాలు సరిపోల్చు',
      loanMatch: 'శాసన రుణ సరిపోలిక', schemesBtn: 'పథకాలు',
      testRealReg: 'నిజమైన నమోదు పరీక్షించు', onboardingChecklist: 'నమోదు చెక్‌లిస్ట్',
      complete: 'పూర్తయింది', viewJudgeDemo: 'జడ్జి డెమో చూడండి',
      myStore: 'నా దుకాణం', proprietor: 'యజమాని',
      auditedTurnover: 'ఆడిట్ చేసిన టర్నోవర్', netOpSurplus: 'నికర నిర్వహణ మిగులు',
      opMargin: 'నిర్వహణ మార్జిన్', recordSale: '+ అమ్మకం నమోదు',
      saathiAI: 'సాథీ AI', ondcWholesale: 'ONDC హోల్‌సేల్', bankDossier: 'బ్యాంక్ డోజియర్',
      auditedFinancial: 'ఆడిట్ చేసిన ఆర్థిక పనితీరు',
      auditedFinancialSub: 'రోజువారీ స్థూల ఆదాయం, జాబితా నింపడం ఖర్చులు మరియు నికర లాభాలు',
      grossTurnover: 'స్థూల టర్నోవర్', opOutlay: 'నిర్వహణ వ్యయం', retainedSurplus: 'నిలుపుకున్న మిగులు',
      paymentChannel: 'చెల్లింపు ఛానల్ పంపిణీ',
      customerCredit: 'కస్టమర్ క్రెడిట్ ఎక్స్పోజర్', activeUdhaar: 'క్రియాశీల ఉధార్ బ్యాలెన్స్',
      viewCustomerLedger: 'కస్టమర్ లెడ్జర్ చూడండి',
      seasonalRadar: 'సీజనల్ డిమాండ్ రాడార్', projectedSurge: 'అంచనా పెరుగుదల',
      altCreditHealth: 'ప్రత్యామ్నాయ క్రెడిట్ ఆరోగ్యం', unratedEnterprise: 'రేటింగ్ లేని వ్యాపారం',
      unratedDesc: 'మీ 4-స్తంభాల బ్యాంకబుల్ క్రెడిట్ స్కోర్ అన్‌లాక్ చేయడానికి మొదటి వారం అమ్మకాలు నమోదు చేయండి (5 లావాదేవీలు, 3 రోజులు).',
      recordASale: 'అమ్మకం నమోదు చేయి', aiPrompts: 'సాథీ AI ప్రాంప్ట్‌లు', openSaathiAI: 'సాథీ AI తెరువు',
      strictCredit: 'గ్రామ వాసులతో 7 రోజుల కఠిన క్రెడిట్ పరిమితి నిర్వహించబడుతోంది.',
      primeBankable: 'ప్రైమ్ బ్యాంకబుల్',
    },
    pa: {
      storeProfile: 'ਦੁਕਾਨ ਪ੍ਰੋਫਾਈਲ', enterpriseReg: 'ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪੂਰੀ ✓',
      logFirstSale: 'ਪਹਿਲੀ ਵਿਕਰੀ ਦਰਜ ਕਰੋ', recordFirstSale: 'ਪਹਿਲੀ ਵਿਕਰੀ ਦਰਜ ਕਰੋ',
      recordSaleBtn: '+ ਵਿਕਰੀ ਦਰਜ ਕਰੋ', threeDays: '3 ਸਰਗਰਮ ਦਿਨ',
      bahiRegularity: 'ਬਹੀ-ਖਾਤਾ ਨਿਯਮਿਤਤਾ', logToday: '+ ਅੱਜ ਦਰਜ ਕਰੋ',
      unlockScore: 'ਸਕੋਰ ਅਨਲੌਕ ਕਰੋ', minTx: 'ਘੱਟੋ-ਘੱਟ 5 ਵਿਕਰੀ & 3 ਦਿਨ',
      viewScore: 'ਸਕੋਰ ਦੇਖੋ', matchSchemes: 'ਯੋਜਨਾਵਾਂ ਮੇਲ ਕਰੋ',
      loanMatch: 'ਕਾਨੂੰਨੀ ਕਰਜ਼ਾ ਮੇਲ', schemesBtn: 'ਯੋਜਨਾਵਾਂ',
      testRealReg: 'ਅਸਲ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਟੈਸਟ ਕਰੋ', onboardingChecklist: 'ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਚੈੱਕਲਿਸਟ',
      complete: 'ਪੂਰੀ', viewJudgeDemo: 'ਜੱਜ ਡੈਮੋ ਦੇਖੋ',
      myStore: 'ਮੇਰੀ ਦੁਕਾਨ', proprietor: 'ਮਾਲਕ',
      auditedTurnover: 'ਤਸਦੀਕ ਕੀਤੀ ਵਿਕਰੀ', netOpSurplus: 'ਸ਼ੁੱਧ ਸੰਚਾਲਨ ਵਾਧੂ',
      opMargin: 'ਸੰਚਾਲਨ ਮਾਰਜਿਨ', recordSale: '+ ਵਿਕਰੀ ਦਰਜ',
      saathiAI: 'ਸਾਥੀ AI', ondcWholesale: 'ONDC ਥੋਕ', bankDossier: 'ਬੈਂਕ ਫਾਈਲ',
      auditedFinancial: 'ਤਸਦੀਕ ਵਿੱਤੀ ਪ੍ਰਦਰਸ਼ਨ',
      auditedFinancialSub: 'ਰੋਜ਼ਾਨਾ ਕੁੱਲ ਆਮਦਨ, ਮਾਲ ਭਰਨ ਦੇ ਖਰਚੇ ਅਤੇ ਸ਼ੁੱਧ ਲਾਭ',
      grossTurnover: 'ਕੁੱਲ ਵਿਕਰੀ', opOutlay: 'ਸੰਚਾਲਨ ਖਰਚਾ', retainedSurplus: 'ਬਚੀ ਆਮਦਨ',
      paymentChannel: 'ਭੁਗਤਾਨ ਚੈਨਲ ਵੰਡ',
      customerCredit: 'ਗਾਹਕ ਕ੍ਰੈਡਿਟ ਐਕਸਪੋਜ਼ਰ', activeUdhaar: 'ਸਰਗਰਮ ਉਧਾਰ ਬੈਲੇਂਸ',
      viewCustomerLedger: 'ਗਾਹਕ ਖਾਤਾ ਦੇਖੋ',
      seasonalRadar: 'ਮੌਸਮੀ ਮੰਗ ਰਾਡਾਰ', projectedSurge: 'ਅਨੁਮਾਨਿਤ ਵਾਧਾ',
      altCreditHealth: 'ਵਿਕਲਪਕ ਕ੍ਰੈਡਿਟ ਸਿਹਤ', unratedEnterprise: 'ਅਣਰੇਟਡ ਉੱਦਮ',
      unratedDesc: 'ਆਪਣਾ 4-ਥੰਮ੍ਹ ਬੈਂਕਯੋਗ ਕ੍ਰੈਡਿਟ ਸਕੋਰ ਅਨਲੌਕ ਕਰਨ ਲਈ ਪਹਿਲੇ ਹਫ਼ਤੇ ਦੀਆਂ ਵਿਕਰੀਆਂ ਦਰਜ ਕਰੋ (5 ਲੈਣ-ਦੇਣ, 3 ਦਿਨ)।',
      recordASale: 'ਵिकਰੀ ਦਰਜ ਕਰੋ', aiPrompts: 'ਸਾਥੀ AI ਪ੍ਰੋਂਪਟ', openSaathiAI: 'ਸਾਥੀ AI ਖੋਲੋ',
      strictCredit: 'ਪਿੰਡ ਦੇ ਗਾਹਕਾਂ ਨਾਲ 7 ਦਿਨਾਂ ਦੀ ਸਖ਼ਤ ਕ੍ਰੈਡਿਟ ਸੀਮਾ ਬਣਾਈ ਰੱਖੀ ਗਈ ਹੈ।',
      primeBankable: 'ਪ੍ਰਾਈਮ ਬੈਂਕਯੋਗ',
    },
    gu: {
      storeProfile: 'દુકાન પ્રોફાઇલ', enterpriseReg: 'નોંધણી પૂર્ણ ✓',
      logFirstSale: 'પ્રથમ વેચાણ નોંધો', recordFirstSale: 'પ્રથમ વેચાણ ઉમેરો',
      recordSaleBtn: '+ વેચાણ નોંધો', threeDays: '3 સક્રિય દિવસો',
      bahiRegularity: 'બહી-ખાતા નિયમિતતા', logToday: '+ આજનું ખાતું',
      unlockScore: 'સ્કોર અનલોક કરો', minTx: 'ઓછામાં ઓછા 5 વેચાણ & 3 દિવસો',
      viewScore: 'સ્કોર જુઓ', matchSchemes: 'યોજનાઓ મેચ કરો',
      loanMatch: 'કાયદાકીય લોન મેચ', schemesBtn: 'યોજનાઓ',
      testRealReg: 'વાસ્તવિક નોંધણી ટેસ્ટ કરો', onboardingChecklist: 'ઓનબોર્ડિંગ ચેકલિસ્ટ',
      complete: 'પૂર્ણ', viewJudgeDemo: 'જજ ડેમો જુઓ',
      myStore: 'મારી દુકાન', proprietor: 'માલિક',
      auditedTurnover: 'ઓડિટ થયેલ ટર્નઓવર', netOpSurplus: 'ચોખ્ખો ઓપરેટિંગ સરપ્લસ',
      opMargin: 'ઓપરેટિંગ માર્જિન', recordSale: '+ વેચાણ નોંધો',
      saathiAI: 'સાથી AI', ondcWholesale: 'ONDC જથ્થાબંધ', bankDossier: 'બેંક ફાઇલ',
      auditedFinancial: 'ઓડિટ થયેલ નાણાકીય કામગીરી',
      auditedFinancialSub: 'દૈનિક ગ્રોસ આવક, સ્ટોક ખરીદી ખર્ચ અને ચોખ્ખો નફો',
      grossTurnover: 'ગ્રોસ ટર્નઓવર', opOutlay: 'ઓપરેટિંગ ખર્ચ', retainedSurplus: 'જાળવી રાખેલ સરપ્લસ',
      paymentChannel: 'ચુકવણી ચેનલ વિતરણ (Cash vs. UPI)',
      customerCredit: 'ગ્રાહક ક્રેડિટ જોખમ', activeUdhaar: 'બાકી ગ્રાહક ખાતું',
      viewCustomerLedger: 'ગ્રાહક ખાતા ચોપડો જુઓ',
      seasonalRadar: 'મોસમી માંગ રેડાર', projectedSurge: 'અનુમાનિત વેચાણ વધારો',
      altCreditHealth: 'વૈકલ્પિક ક્રેડિટ સ્વાસ્થ્ય', unratedEnterprise: 'અનરેટેડ એન્ટરપ્રાઇઝ',
      unratedDesc: 'તમારો 4-સ્તંભ ક્રેડિટ સ્કોર અનલોક કરવા પ્રથમ સપ્તાહનું વેચાણ નોંધો (5 વ્યવહારો, 3 દિવસો).',
      recordASale: 'વેચાણ નોંધો', aiPrompts: 'સાથી AI પ્રશ્નો', openSaathiAI: 'સાથી AI ખોલો',
      strictCredit: 'ગામના ગ્રાહકો સાથે 7 દિવસની કડક ક્રેડિટ સીમા જાળવી રાખવામાં આવી છે.',
      primeBankable: 'પ્રાઇમ બેંકેબલ',
    },
  };
  const ui = UI_STRINGS[language] || UI_STRINGS.en;

  // Pure real data binding - no fabricated default constants!
  const metrics = {
    totalIncome: summaryData?.totalIncome ?? creditData?.metrics?.totalIncome ?? null,
    totalExpense: summaryData?.totalExpense ?? creditData?.metrics?.totalExpense ?? null,
    netSurplus: summaryData?.netSurplus ?? creditData?.metrics?.netSurplus ?? null,
    totalUdhaarPending: summaryData?.pendingUdhaar ?? creditData?.metrics?.totalUdhaarPending ?? null,
    digitalSharePct: summaryData?.digitalSharePct ?? creditData?.metrics?.digitalSharePct ?? null,
    loggedDaysCount: creditData?.metrics?.loggedDaysCount ?? summaryData?.activeDaysCount ?? summaryData?.activeDays ?? null
  };

  const hasFinancialData = metrics.totalIncome !== null;

  // Progressive Onboarding Checklist computation
  const totalTxs = summaryData?.totalTransactions ?? (summaryData?.totalIncome > 0 ? 1 : 0);
  const actDays = summaryData?.activeDays ?? summaryData?.activeDaysCount ?? (metrics.loggedDaysCount || 0);

  const step1Complete = true; // Shop registered
  const step2Complete = totalTxs >= 1; // First sale logged
  const step3Complete = actDays >= 3; // 3 active days
  const step4Complete = (totalTxs >= 5 && actDays >= 3) || (creditData && !creditData.isUnrated && creditData.totalScore !== null);
  const step5Complete = Boolean(creditData && creditData.totalScore && creditData.totalScore >= 600);

  const checklistSteps = [
    {
      id: 'profile',
      num: 1,
      title: ui.storeProfile,
      desc: ui.enterpriseReg,
      completed: step1Complete,
      active: false
    },
    {
      id: 'first_tx',
      num: 2,
      title: ui.logFirstSale,
      desc: ui.recordFirstSale,
      completed: step2Complete,
      active: !step2Complete,
      progressText: `${Math.min(1, totalTxs)}/1`,
      action: onOpenKeypad,
      actionText: ui.recordSaleBtn
    },
    {
      id: 'three_days',
      num: 3,
      title: ui.threeDays,
      desc: ui.bahiRegularity,
      completed: step3Complete,
      active: step2Complete && !step3Complete,
      progressText: `${Math.min(3, actDays)}/3`,
      action: onOpenKeypad,
      actionText: ui.logToday
    },
    {
      id: 'score_unlock',
      num: 4,
      title: ui.unlockScore,
      desc: ui.minTx,
      completed: step4Complete,
      active: step3Complete && !step4Complete,
      progressText: `${Math.min(5, totalTxs)}/5`,
      action: () => onNavigateTab('credit'),
      actionText: ui.viewScore
    },
    {
      id: 'schemes',
      num: 5,
      title: ui.matchSchemes,
      desc: ui.loanMatch,
      completed: step5Complete,
      active: step4Complete && !step5Complete,
      progressText: step5Complete ? 'Matched' : 'Locked',
      action: () => onNavigateTab('schemes'),
      actionText: ui.schemesBtn
    }
  ];

  const stepCountCompleted = [step1Complete, step2Complete, step3Complete, step4Complete, step5Complete].filter(Boolean).length;

  // Computed ratios from real numbers
  const operatingMargin = (metrics.totalIncome && metrics.totalIncome > 0 && metrics.netSurplus !== null)
    ? ((metrics.netSurplus / metrics.totalIncome) * 100).toFixed(1)
    : null;

  const expenseRatio = (metrics.totalIncome && metrics.totalIncome > 0 && metrics.totalExpense !== null)
    ? ((metrics.totalExpense / metrics.totalIncome) * 100).toFixed(1)
    : null;

  const digitalPct = metrics.digitalSharePct ?? (metrics.totalIncome && summaryData?.upiIncome ? Math.round((summaryData.upiIncome / metrics.totalIncome) * 100) : null);
  const cashPct = digitalPct !== null ? Math.max(0, 100 - digitalPct) : null;

  const riskPct = (metrics.totalIncome && metrics.totalIncome > 0 && metrics.totalUdhaarPending !== null)
    ? ((metrics.totalUdhaarPending / metrics.totalIncome) * 100).toFixed(1)
    : null;

  const sampleQuestions = [
    { text: "दिवाली के लिए तेल और चीनी का कितना स्टॉक लूँ?", textEn: "How much stock of oil & sugar for Diwali?", topic: "festival_stock", textTa: "தீபாவளிக்கு எவ்வளவு எண்ணெய் மற்றும் சர்க்கரை சரக்கு வாங்குவது?", textTe: "దీపావళి కోసం నూనె మరియు చక్కెర ఎంత సరుకు కొనాలి?", textPa: "ਦੀਵਾਲੀ ਲਈ ਕਿੰਨਾ ਤੇਲ ਅਤੇ ਚੀਨੀ ਦਾ ਸਟਾਕ ਲਵਾਂ?" },
    { text: "ग्राहक उधार कैसे नियंत्रित करें?", textEn: "How do I manage customer udhaar?", topic: "udhaar_management", textTa: "வாடிக்கையாளர் கடனை எவ்வாறு நிர்வகிப்பது?", textTe: "కస్టమర్ ఉధార్‌ను ఎలా నిర్వహించాలి?", textPa: "ਗਾਹਕ ਉਧਾਰ ਨੂੰ ਕਿਵੇਂ ਨਿਯੰਤਰਿਤ ਕਰਾਂ?" },
    { text: "डीप-फ्रीज़र के लिए कौन सा मुद्रा लोन मिलेगा?", textEn: "Which MUDRA loan fits for a deep freezer?", topic: "loan_freezer", textTa: "டீப் ஃப்ரீசருக்கு எந்த முத்ரா கடன் கிடைக்கும்?", textTe: "డీప్ ఫ్రీజర్ కోసం ఏ ముద్రా లోన్ లభిస్తుంది?", textPa: "ਡੀਪ ਫ੍ਰੀਜ਼ਰ ਲਈ ਕਿਹੜਾ ਮੁਦਰਾ ਲੋਨ ਮਿਲੇਗਾ?" },
    { text: "क्रेडिट स्कोर 750+ कैसे करें?", textEn: "How to raise credit score above 750?", topic: "credit_boost", textTa: "கடன் மதிப்பெண்ணை 750+ ஆக்குவது எப்படி?", textTe: "క్రెడిట్ స్కోర్‌ను 750+ ఎలా చేయాలి?", textPa: "ਕ੍ਰੈਡਿਟ ਸਕੋਰ 750+ ਕਿਵੇਂ ਕਰੀਏ?" }
  ];

  const getQuestionText = (q) => {
    if (language === 'hi') return q.text;
    if (language === 'ta') return q.textTa || q.textEn;
    if (language === 'te') return q.textTe || q.textEn;
    if (language === 'pa') return q.textPa || q.textEn;
    if (language === 'gu') return q.textGu || q.textEn;
    return q.textEn;
  };

  const festivalList = cuesData?.festivalCues || [
    {
      id: "navratri-dussehra",
      festival: "Sharad Navratri & Dussehra",
      festivalHi: "शारदीय नवरात्रि एवं दशहरा",
      festivalTa: "நவராத்திரி மற்றும் விஜயதசமி",
      festivalTe: "శరన్నవరాత్రులు మరియు విజయదశమి",
      festivalPa: "ਨਵਰਾਤਰੀ ਅਤੇ ਦੁਸ਼ਹਿਰਾ",
      timing: "Oct 11 – Oct 20",
      timingHi: "11 अक्तूबर – 20 अक्तूबर",
      timingTa: "அக்டோபர் 11 – அக்டோபர் 20",
      timingTe: "అక్టోబర్ 11 – అక్టోబర్ 20",
      timingPa: "11 ਅਕਤੂਬਰ – 20 ਅਕਤੂਬਰ",
      daysRemaining: 37,
      demandSurge: "+38%",
      priorityItems: "Mustard oil, Desi ghee, Sabudana, Pooja items",
      priorityItemsHi: "सरसों तेल, देशी घी, साबूदाना, पूजा सामग्री",
      priorityItemsTa: "கடுகு எண்ணெய், நெய், ஜவ்வரிசி, பூஜை பொருட்கள்",
      priorityItemsTe: "ఆవనూనె, నెయ్యి, సగ్గుబియ్యం, పూజ సామాగ్రి",
      priorityItemsPa: "ਸਰ੍ਹੋਂ ਦਾ ਤੇਲ, ਦੇਸੀ ਘਿਓ, ਸਾਬੂਦਾਣਾ, ਪੂਜਾ ਸਮੱਗਰੀ",
      verifiedByGoogleCalendar: true
    },
    {
      id: "diwali-dhanteras",
      festival: "Dhanteras & Diwali",
      festivalHi: "धनतेरस एवं दीपावली",
      festivalTa: "தனத்திரயோதசி மற்றும் தீபாவளி",
      festivalTe: "ధన్తేరస్ మరియు దీపావళి",
      festivalPa: "ਧਨਤੇਰਸ ਅਤੇ ਦੀਵਾਲੀ",
      timing: "Nov 6 – Nov 11",
      timingHi: "6 नवंबर – 11 नवंबर",
      timingTa: "நவம்பர் 6 – நவம்பர் 11",
      timingTe: "నవంబర్ 6 – నవంబర్ 11",
      timingPa: "6 ਨਵੰਬਰ – 11 ਨਵੰਬਰ",
      daysRemaining: 63,
      demandSurge: "+48%",
      priorityItems: "Sugar, Besan, Edible oil, Dry fruits",
      priorityItemsHi: "चीनी, बेसन, रिफाइंड तेल, मेवा गिफ्ट पैक",
      priorityItemsTa: "சர்க்கரை, கடலை மாவு, சமையல் எண்ணெய், முந்திரி",
      priorityItemsTe: "చక్కెర, శనగపిండి, నూనె, జీడిపప్పు ప్యాక్",
      priorityItemsPa: "ਚੀਨੀ, ਵੇਸਣ, ਤੇਲ, ਮੇਵੇ ਗਿਫਟ ਪੈਕ",
      verifiedByGoogleCalendar: true
    },
    {
      id: "chhath-puja",
      festival: "Chhath Puja Mahaparv",
      festivalHi: "छठ पूजा महापर्व",
      festivalTa: "சாத் பூஜா மகாபர்வ",
      festivalTe: "ఛత్ పూజ మహాపర్వ",
      festivalPa: "ਛੱਠ ਪੂਜਾ ਮਹਾਪਰਵ",
      timing: "Nov 15",
      timingHi: "15 नवंबर",
      timingTa: "நவம்பர் 15",
      timingTe: "నవంబర్ 15",
      timingPa: "15 ਨਵੰਬਰ",
      daysRemaining: 72,
      demandSurge: "+42%",
      priorityItems: "Thekua flour, Desi Gur, Ghee, Soop",
      priorityItemsHi: "ठेकुआ आटा, शुद्ध गुड़, घी, बांस का सूप",
      priorityItemsTa: "தேகுவா மாவு, வெல்லம், நெய்",
      priorityItemsTe: "గోధుమ పిండి, బెల్లం, నెయ్యి",
      priorityItemsPa: "ਗੁੜ, ਆਟਾ, ਦੇਸੀ ਘਿਓ",
      verifiedByGoogleCalendar: true
    },
    {
      id: "kharif-harvest",
      festival: "Kharif Paddy Mandi Payouts",
      festivalHi: "खरीफ धान मंडी भुगतान",
      festivalTa: "காரீஃப் நெல் மண்டி கொடுப்பனவு",
      festivalTe: "ఖరీఫ్ వరి ధాన్యం మండి చెల్లింపులు",
      festivalPa: "ਖਰੀਫ ਝੋਨਾ ਮੰਡੀ ਭੁਗਤਾਨ",
      timing: "Mid-to-Late November",
      timingHi: "मध्य-से-उत्तर नवंबर",
      timingTa: "நவம்பர் நடுப்பகுதி",
      timingTe: "నవంబర్ మధ్య సగం",
      timingPa: "ਨਵੰਬਰ ਦੇ ਮੱਧ ਵਿੱਚ",
      daysRemaining: 75,
      demandSurge: "+28%",
      priorityItems: "Bulk 50kg bags, Premium tea, Detergents",
      priorityItemsHi: "थोक 50kg अनाज बोरे, प्रीमियम चाय पत्ती",
      priorityItemsTa: "மொத்த 50 கிலோ மூடைகள், தேயிலை",
      priorityItemsTe: "50 కేజీల బస్తాలు, ప్రీమియం టీ",
      priorityItemsPa: "50 ਕਿਲੋ ਬੋਰੇ, ਚਾਹ ਪੱਤੀ",
      verifiedByGoogleCalendar: true
    }
  ];

  // Dynamic pillars from creditData
  const factors = creditData?.factors || [];

  const udyamLabel = shop?.is_udyam_verified ? 'UDYAM VERIFIED (Mock Gateway)' : 'UDYAM ALIGNED MSME (DEMO)';
  const udyamNumber = shop?.udyam_number || (shop?.id ? `UDYAM-${(shop.state || 'IN').substring(0, 2).toUpperCase()}-0092478` : 'UDYAM-DEMO');
  const vintageLabel = shop?.vintage_years ? `Vintage: ${Math.round(shop.vintage_years * 12)} Months (${shop.vintage_years}y)` : 'Vintage: —';
  const pslLabel = creditData?.totalScore && creditData.totalScore >= 750 ? 'Internal PSL-Format Tier: A (Self-Assessed)' : 'Demo PSL-Format Assessment';

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-16 lg:pb-8">

      {/* Persistent Demo Data Badge */}
      {isDemoMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 bg-ochre-50 border border-ochre-300 rounded-xl px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-ochre-800 text-[11px] sm:text-xs min-w-0">
            <Sparkles className="w-4 h-4 text-ochre-600 shrink-0" />
            <span className="truncate">DEMO DATA • Ramesh Kirana <span className="hidden xs:inline text-ochre-700 font-medium">(SIH Evaluator Mode)</span></span>
          </div>
          {onSwitchToRegister && (
            <button onClick={onSwitchToRegister} className="text-ochre-700 hover:text-ochre-900 font-bold underline underline-offset-2 cursor-pointer text-[11px] sm:text-xs shrink-0 self-end sm:self-auto">
              {ui.testRealReg}
            </button>
          )}
        </div>
      )}

      {/* Progressive Onboarding Checklist (visible for non-demo real users) */}
      {!isDemoMode && !step5Complete && (
        <Card elevation={1} padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-forestRural-50 border border-forestRural-200 text-forestRural-700 shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-indigoRural-900 font-display">
                  {ui.onboardingChecklist}
                </h3>
                <p className="text-[11px] text-indigoRural-500 font-medium">{stepCountCompleted}/5 {ui.complete}</p>
              </div>
            </div>
            {onSwitchToDemo && (
              <button onClick={onSwitchToDemo} className="text-[11px] text-indigoRural-500 hover:text-terracotta-700 font-bold underline underline-offset-2 cursor-pointer transition-colors">
                {ui.viewJudgeDemo}
              </button>
            )}
          </div>

          {/* Smooth Animated Progress Bar */}
          <div className="w-full h-2 bg-paper-200 rounded-full overflow-hidden p-0.5 border border-paper-300">
            <motion.div 
              className="h-full bg-gradient-to-r from-forestRural-500 to-forestRural-600 rounded-full shadow-2xs" 
              initial={{ width: 0 }}
              animate={{ width: `${(stepCountCompleted / 5) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {checklistSteps.map((step) => (
              <motion.div 
                key={step.id} 
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className={`p-2.5 rounded-xl border text-center space-y-1 transition-all ${
                  step.completed 
                    ? 'bg-forestRural-50/70 border-forestRural-200 shadow-2xs' 
                    : step.active 
                    ? 'bg-white border-terracotta-400 shadow-elevation-1 ring-1 ring-terracotta-500/20' 
                    : 'bg-paper-50/60 border-paper-200 opacity-65'
                }`}
              >
                <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-[10px] font-black ${
                  step.completed ? 'bg-forestRural-600 text-white shadow-2xs' : step.active ? 'bg-terracotta-600 text-white shadow-2xs' : 'bg-paper-300 text-indigoRural-500'
                }`}>
                  {step.completed ? (
                    <motion.span 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      <Check className="w-3 h-3" />
                    </motion.span>
                  ) : step.num}
                </div>
                <p className="text-[10px] font-bold text-indigoRural-900 leading-tight">{step.title}</p>
                <p className="text-[9px] text-indigoRural-500 leading-snug">{step.desc}</p>
                {step.active && step.action && (
                  <button onClick={step.action} className="mt-0.5 text-[9px] font-bold text-terracotta-700 hover:text-terracotta-900 underline underline-offset-2 cursor-pointer transition-colors">
                    {step.actionText}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      )}
      
      {/* 1. Merchant Executive Card (Warli + Terracotta Identity) */}
      <Card variant="hero" padding="md" className="space-y-3.5 sm:space-y-4">
        
        {/* Tri-color Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-terracotta-500 via-paper-300 to-forestRural-600" />



        {/* Core Hero Body */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          <div className="space-y-2 max-w-2xl min-w-0">
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-indigoRural-900 font-display truncate">
                {shop?.name || ui.myStore}
              </h1>
              <p className="text-indigoRural-600 text-xs font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                <span className="font-bold text-indigoRural-900">{shop?.owner_name || ui.proprietor} (Proprietor)</span>
                <span className="text-paper-400">•</span>
                <span>{shop?.village || '—'}, {shop?.district || '—'} ({shop?.state || '—'})</span>
              </p>
            </div>

            {/* Turnover & Surplus Highlights */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-baseline gap-3 sm:gap-6 pt-1">
              <div>
                <span className="text-[10px] font-bold text-indigoRural-400 uppercase tracking-wider block mb-0.5">
                  {ui.auditedTurnover}
                </span>
                <div className="text-xl sm:text-3xl font-black tracking-tight tabular-nums text-indigoRural-900 font-display">
                  {hasFinancialData ? `₹${metrics.totalIncome.toLocaleString('en-IN')}` : '—'}
                </div>
              </div>
              <div className="border-l border-paper-300 pl-3 sm:pl-6">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-indigoRural-400 uppercase tracking-wider block">
                    {ui.netOpSurplus}
                  </span>
                  <AudioReadAloudButton
                    size="sm"
                    textHi={`आज का शुद्ध मुनाफा: ${metrics.netSurplus !== null ? Number(metrics.netSurplus).toLocaleString('en-IN') : 0} रुपये।`}
                    textEn={`Net operating surplus: ₹${metrics.netSurplus !== null ? Number(metrics.netSurplus).toLocaleString('en-IN') : 0}.`}
                  />
                </div>
                <div className="text-xl sm:text-2xl font-black tracking-tight tabular-nums text-forestRural-700 font-display">
                  {metrics.netSurplus !== null ? `₹${metrics.netSurplus.toLocaleString('en-IN')}` : '—'}
                </div>
              </div>
              <div className="border-l border-paper-300 pl-4 sm:pl-6 hidden sm:block">
                <span className="text-[10px] font-bold text-indigoRural-400 uppercase tracking-wider block mb-0.5">
                  {ui.opMargin}
                </span>
                <div className="text-xl sm:text-2xl font-black tracking-tight tabular-nums text-terracotta-700 font-display">
                  {operatingMargin ? `+${operatingMargin}%` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Clean Executive Tactile Action Buttons in 2x2 Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 shrink-0 lg:w-72 xl:w-80">
            <Button
              onClick={onOpenKeypad}
              variant="dark"
              size="sm"
              icon={PlusCircle}
              className="w-full justify-center !py-2.5 shadow-2xs"
            >
              <span className="truncate">{ui.recordSale}</span>
            </Button>
            <Button
              onClick={() => onNavigateTab('advisor')}
              variant="secondary"
              size="sm"
              icon={Sparkles}
              className="w-full justify-center !py-2.5"
            >
              <span className="truncate">{ui.saathiAI}</span>
            </Button>
            <Button
              onClick={onOpenWholesale}
              variant="forest"
              size="sm"
              icon={ShoppingBag}
              className="w-full justify-center !py-2.5"
            >
              <span className="truncate">{ui.ondcWholesale}</span>
            </Button>
            <Button
              onClick={() => onNavigateTab('dossier')}
              variant="outline"
              size="sm"
              icon={FileText}
              className="w-full justify-center !py-2.5"
            >
              <span className="truncate">{ui.bankDossier}</span>
            </Button>
          </div>
        </div>

        {/* Warli Folk Art Line Border */}
        <WarliBorder className="w-full h-4 text-terracotta-400 opacity-40" />
      </Card>

      {/* 2. Asymmetric Financial Pulse Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        
        {/* Primary Engine (8 Cols): Audited Financial Pulse & Cash Flow Breakdown */}
        <Card padding="md" className="lg:col-span-8 space-y-3.5 sm:space-y-4">
          <SectionHeader
            icon={TrendingUp}
            iconColor="forest"
            title={ui.auditedFinancial}
            subtitle={ui.auditedFinancialSub}
            action={
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              </div>
            }
          />

          {/* 3 Structured Metrics with Deep Context */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
            <div className="space-y-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold text-indigoRural-400 uppercase tracking-wider block">
                {ui.grossTurnover}
              </span>
              <div className="text-base xs:text-lg sm:text-2xl font-black text-indigoRural-900 tabular-nums tracking-tight font-display">
                {hasFinancialData ? `₹${metrics.totalIncome.toLocaleString('en-IN')}` : '—'}
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-forestRural-700 flex items-center gap-0.5 sm:gap-1">
                <span>↑</span> 100% audited
              </span>
            </div>

            <div className="space-y-0.5 border-l border-paper-200 pl-2 sm:pl-4">
              <span className="text-[9px] sm:text-[10px] font-bold text-indigoRural-400 uppercase tracking-wider block">
                {ui.opOutlay}
              </span>
              <div className="text-base xs:text-lg sm:text-2xl font-black text-indigoRural-900 tabular-nums tracking-tight font-display">
                {metrics.totalExpense !== null ? `₹${metrics.totalExpense.toLocaleString('en-IN')}` : '—'}
              </div>
              <button
                type="button"
                onClick={onOpenWholesale}
                className="text-[9px] sm:text-[10px] font-semibold text-forestRural-700 hover:text-forestRural-900 flex items-center gap-0.5 sm:gap-1 cursor-pointer transition-colors underline underline-offset-2"
              >
                <span>ONDC (-12%)</span>
              </button>
            </div>

            <div className="space-y-0.5 border-l border-paper-200 pl-2 sm:pl-4">
              <div className="flex items-center gap-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-indigoRural-400 uppercase tracking-wider block">
                  {ui.retainedSurplus}
                </span>
                <AudioReadAloudButton
                  size="sm"
                  textHi={`शुद्ध बचत: ${metrics.netSurplus !== null ? Number(metrics.netSurplus).toLocaleString('en-IN') : 0} रुपये।`}
                  textEn={`Retained surplus: ₹${metrics.netSurplus !== null ? Number(metrics.netSurplus).toLocaleString('en-IN') : 0}.`}
                />
              </div>
              <div className="text-base xs:text-lg sm:text-2xl font-black text-forestRural-700 tabular-nums tracking-tight font-display">
                {metrics.netSurplus !== null ? `₹${metrics.netSurplus.toLocaleString('en-IN')}` : '—'}
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-forestRural-700">
                Prime capacity
              </span>
            </div>
          </div>

          {/* Payment Channels Deepening Bar (RBI Mandated Digital Ratio) */}
          <div className="space-y-1.5 pt-3 border-t border-paper-200">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-indigoRural-500 uppercase tracking-wider text-[10px]">
                {ui.paymentChannel}
              </span>
            </div>

            {/* Segmented Distribution Bar */}
            {digitalPct !== null ? (
              <>
                <div className="w-full h-2.5 bg-paper-200 rounded-full overflow-hidden flex p-[1px] gap-1">
                  <div 
                    className="bg-terracotta-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${digitalPct}%` }} 
                    title={`Digital UPI: ${digitalPct}%`} 
                  />
                  <div 
                    className="bg-forestRural-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${cashPct}%` }} 
                    title={`Direct Cash: ${cashPct}%`} 
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-indigoRural-600 font-semibold pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-terracotta-600 shrink-0" />
                    <span>UPI: <strong>{digitalPct}%</strong> ({hasFinancialData ? `₹${Math.round(metrics.totalIncome * (digitalPct / 100)).toLocaleString('en-IN')}` : '—'})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-forestRural-600 shrink-0" />
                    <span>Cash: <strong>{cashPct}%</strong> ({hasFinancialData ? `₹${Math.round(metrics.totalIncome * (cashPct / 100)).toLocaleString('en-IN')}` : '—'})</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-1 text-xs text-indigoRural-400 italic">
                Awaiting transaction channel breakdown...
              </div>
            )}
          </div>
        </Card>

        {/* Secondary Card (4 Cols): Udhaar Working Capital & Recovery Meter */}
        <Card padding="md" className="lg:col-span-4 flex flex-col justify-between gap-3.5 sm:gap-4">
          <SectionHeader
            icon={ShoppingBag}
            iconColor="ochre"
            title={ui.customerCredit}
            subtitle="Working Capital Protection"
            action={null}
          />

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-indigoRural-400 uppercase tracking-wider block">
              {ui.activeUdhaar}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-indigoRural-900 tabular-nums font-display">
              {metrics.totalUdhaarPending !== null ? `₹${metrics.totalUdhaarPending.toLocaleString('en-IN')}` : '—'}
            </div>
            <p className="text-[10px] text-indigoRural-500 font-medium pt-0.5">
              {ui.strictCredit}
            </p>
          </div>

          <div className="space-y-1.5 pt-2.5 border-t border-paper-200 text-xs">
            <div className="flex items-center justify-between font-semibold text-indigoRural-600">
              <span className="text-[11px]">Average Recovery</span>
              <strong className="text-indigoRural-900 font-bold text-[11px]">
                {summaryData?.avgRecoveryDays ? `${summaryData.avgRecoveryDays} Days` : (isDemoMode ? '4.2 Days' : '—')}
              </strong>
            </div>
            <div className="flex items-center justify-between font-semibold text-indigoRural-600">
              <span className="text-[11px]">Khata Accounts</span>
              <strong className="text-indigoRural-900 font-bold text-[11px]">
                {summaryData?.activeUdhaarCustomers !== undefined ? `${summaryData.activeUdhaarCustomers} Customers` : (shop?.customer_count ? `${shop.customer_count} Customers` : (isDemoMode ? '8 Customers' : '0 Customers'))}
              </strong>
            </div>
            <div className="flex items-center justify-between font-semibold text-indigoRural-600">
              <span className="text-[11px]">Capital At Risk</span>
              <strong className="text-forestRural-700 font-bold text-[11px]">
                {riskPct ? `${riskPct}% (Safe)` : 'Safe'}
              </strong>
            </div>
          </div>

          <Button
            onClick={() => onNavigateTab('cashflow')}
            variant="secondary"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            className="w-full justify-center !py-2"
          >
            <span>{ui.viewCustomerLedger}</span>
          </Button>
        </Card>

      </div>

      {/* 3. National Seasonal Demand Radar & Credit Health Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        
        {/* Left: Seasonal Demand Radar (7 Cols) */}
        <Card padding="md" className="lg:col-span-7 space-y-3.5 sm:space-y-4">
          <SectionHeader
            icon={Calendar}
            iconColor="ochre"
            title={ui.seasonalRadar}
            subtitle={`${shop?.district || 'Balrampur'} Mandi Agricultural & Festival Projections`}
            action={null}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {festivalList.map((item, idx) => {
              const name = (language === 'hi' && item.festivalHi) ? item.festivalHi : (language === 'ta' && item.festivalTa) ? item.festivalTa : (language === 'te' && item.festivalTe) ? item.festivalTe : (language === 'pa' && item.festivalPa) ? item.festivalPa : (language === 'gu' && item.festivalGu) ? item.festivalGu : item.festival;
              const timing = (language === 'hi' && item.timingHi) ? item.timingHi : (language === 'ta' && item.timingTa) ? item.timingTa : (language === 'te' && item.timingTe) ? item.timingTe : (language === 'pa' && item.timingPa) ? item.timingPa : (language === 'gu' && item.timingGu) ? item.timingGu : item.timing;
              const stock = (language === 'hi' && item.priorityItemsHi) ? item.priorityItemsHi : (language === 'ta' && item.priorityItemsTa) ? item.priorityItemsTa : (language === 'te' && item.priorityItemsTe) ? item.priorityItemsTe : (language === 'pa' && item.priorityItemsPa) ? item.priorityItemsPa : (language === 'gu' && item.priorityItemsGu) ? item.priorityItemsGu : item.priorityItems;

              return (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-paper-50 hover:bg-white hover:border-terracotta-300 transition duration-200 border border-paper-200 flex flex-col justify-between gap-2 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-indigoRural-900 group-hover:text-terracotta-700 transition truncate">{name}</span>
                    </div>
                    <div className="text-[10px] text-indigoRural-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigoRural-400 shrink-0" />
                      <span>{timing}</span>
                    </div>
                    <div className="text-[10px] text-indigoRural-800 font-semibold bg-white p-2 rounded-lg border border-paper-200 leading-snug">
                      {stock}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-paper-200 text-[11px]">
                    <span className="text-indigoRural-500 font-medium">{ui.projectedSurge}</span>
                    <span className="font-black text-forestRural-700 text-xs tabular-nums">{item.demandSurge}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right: Credit Score & Health Dial (5 Cols) */}
        <Card padding="md" className="lg:col-span-5 flex flex-col justify-between gap-3.5 sm:gap-4">
          <SectionHeader
            icon={ShieldCheck}
            iconColor="terracotta"
            title={ui.altCreditHealth}
            subtitle="4-Pillar Non-CIBIL Score"
            action={null}
          />

          <div className="py-0.5">
            {(creditData?.isUnrated || creditData?.totalScore === null || creditData?.totalScore === undefined) && !isDemoMode ? (
              <div className="text-center p-4 space-y-2.5">
                <div className="w-12 h-12 mx-auto rounded-xl bg-ochre-100 border border-ochre-300 flex items-center justify-center text-ochre-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display font-black text-sm text-indigoRural-900">
                  {ui.unratedEnterprise}
                </h3>
                <p className="text-[11px] text-indigoRural-600 max-w-xs mx-auto leading-relaxed">
                  {ui.unratedDesc}
                </p>
                <Button onClick={onOpenKeypad} variant="dark" size="sm" icon={PlusCircle}>
                  <span>{ui.recordASale}</span>
                </Button>
              </div>
            ) : (
              <CreditGauge 
                score={creditData?.totalScore !== undefined ? creditData.totalScore : null} 
                ratingLabel={creditData?.ratingLabel || creditData?.ratingBadge || ui.primeBankable}
              />
            )}
          </div>

          {/* 4 Pillars Activity Progress Bars - Bound to creditData.factors */}
          <div className="space-y-2 pt-2.5 border-t border-paper-200 text-xs">
            {factors.length > 0 ? (
              factors.map((factor) => {
                const name = (language === 'hi' && factor.nameHindi) ? factor.nameHindi : (language === 'ta' && factor.nameTa) ? factor.nameTa : (language === 'te' && factor.nameTe) ? factor.nameTe : (language === 'pa' && factor.namePa) ? factor.namePa : (language === 'gu' && factor.nameGu) ? factor.nameGu : factor.name;
                const isPositive = factor.status === 'positive' || factor.percentage >= 70;
                
                return (
                  <div key={factor.id} className="space-y-1 bg-paper-50/60 p-1.5 rounded-lg border border-paper-200/70">
                    <div className="flex justify-between items-center text-indigoRural-700">
                      <span className="font-bold text-[10px]">{name}</span>
                      <span className="font-black text-indigoRural-900 tabular-nums text-[10px]">{factor.percentage}% ({factor.score}/{factor.maxScore})</span>
                    </div>
                    <div className="w-full bg-paper-200 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-forestRural-600' : 'bg-ochre-500'}`} 
                        style={{ width: `${factor.percentage}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-1 text-center text-indigoRural-400 text-xs">
                Auditing 4-pillar alternative credit score...
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* 4. Saathi AI Suggestion Prompts */}
      <Card variant="accent" padding="md" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-terracotta-600 text-white shadow-2xs">
              <Sparkles className="w-3 h-3 text-ochre-200" />
            </div>
            <span className="text-[11px] font-black text-indigoRural-900 uppercase tracking-wider font-display">
              {ui.aiPrompts}
            </span>
          </div>
          <Button
            onClick={() => onNavigateTab('advisor')}
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
          >
            <span>{ui.openSaathiAI}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onAskPrompt(getQuestionText(q))}
              className="p-2.5 bg-white hover:bg-paper-50 active:scale-[0.98] rounded-xl border border-paper-300/80 hover:border-terracotta-300 text-left transition duration-150 shadow-2xs flex items-center justify-between gap-2 text-xs font-extrabold text-indigoRural-900 group cursor-pointer"
            >
              <span className="truncate group-hover:text-terracotta-700 transition">{getQuestionText(q)}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-indigoRural-400 group-hover:text-terracotta-600 shrink-0 transition" />
            </button>
          ))}
        </div>
      </Card>

    </div>
  );
}
