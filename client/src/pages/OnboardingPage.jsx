import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Play, 
  X, 
  Check, 
  Menu, 
  ChevronDown, 
  ShieldCheck, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Store, 
  Phone, 
  Lock, 
  UserPlus, 
  LogIn, 
  Activity, 
  Landmark, 
  Link2,
  Users,
  Award,
  Linkedin,
  Twitter,
  Youtube,
  Clock,
  HelpCircle,
  FileText,
  Building2,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { safeStorage } from '../utils/safeStorage';
import { useTranslation } from '../i18n/LanguageContext';
import { INDIAN_STATES_AND_UTS, findStandardState } from '../data/indianStates';
import { APP_NAME_EN, APP_NAME_HI, APP_TAGLINE_EN, APP_TAGLINE_HI } from '../config/brand';

// Vector Vyapaar Setu Bridge Logo Icon (exact match to reference image)
export function VyapaarSetuBridgeLogo({ className = "w-9 h-7 text-[#0F3E2E]" }) {
  return (
    <svg 
      viewBox="0 0 48 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Road deck */}
      <path d="M 2 24 C 14 22.5, 34 22.5, 46 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Arch beneath */}
      <path d="M 6 32 C 16 23, 32 23, 42 32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Left Tower */}
      <path d="M 14 32 L 14 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Right Tower */}
      <path d="M 34 32 L 34 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Tower crossbeams */}
      <path d="M 12 10 L 16 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 32 10 L 36 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Suspension Cables */}
      <path d="M 2 24 C 8 16, 14 5, 14 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 14 5 C 24 16, 34 5, 34 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 34 5 C 40 16, 46 24, 46 24" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* Vertical suspender stays */}
      <line x1="20" y1="13" x2="20" y2="23" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      <line x1="24" y1="15" x2="24" y2="23" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      <line x1="28" y1="13" x2="28" y2="23" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}
export const SaakhSetuBridgeLogo = VyapaarSetuBridgeLogo;

export function OnboardingPage({ onComplete, onSelectDemo, onStartDemoTour }) {
  const { language, setLanguage } = useTranslation();

  // Mega-menu state: 'how' | 'shopkeepers' | 'impact' | 'about' | null
  const [activeMega, setActiveMega] = useState(null);
  const megaTimeoutRef = useRef(null);

  // Mobile menu drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState(null);

  // Auth Modal (Shopkeeper Login & Register)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('1234');
  const [savedShops, setSavedShops] = useState([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Register Form states
  const [regShopName, setRegShopName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('1234');
  const [regTradeType, setRegTradeType] = useState('kirana');
  const [regState, setRegState] = useState('Uttar Pradesh');
  const [regVillage, setRegVillage] = useState('Utraula Dehat');
  const [regDistrict, setRegDistrict] = useState('Balrampur');

  // Watch Demo Modal
  const [watchDemoOpen, setWatchDemoOpen] = useState(false);

  // Load saved device shops
  useEffect(() => {
    try {
      const parsed = safeStorage.getJSON('vyapaar_saved_shops', []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSavedShops(parsed);
        setLoginPhone(parsed[0].phone || '');
      }
    } catch (_) {}
  }, []);

  // Listen for global open register modal event (e.g. from bottom-left Chatbot)
  useEffect(() => {
    const handler = () => {
      setAuthMode('register');
      setAuthError('');
      setAuthModalOpen(true);
    };
    window.addEventListener('saakhsetu:open-register-modal', handler);
    return () => window.removeEventListener('saakhsetu:open-register-modal', handler);
  }, []);

  // Mega-menu hover handlers with 120ms debounce to prevent flicker
  const handleMouseEnter = (menuKey) => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    setActiveMega(menuKey);
  };

  const handleMouseLeave = () => {
    megaTimeoutRef.current = setTimeout(() => {
      setActiveMega(null);
    }, 150);
  };

  // Auth: handle Login
  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const cleanPhone = loginPhone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        throw new Error(language === 'hi' ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit phone number');
      }
      const res = await api.loginShop(cleanPhone, loginPassword || '1234');
      if (res && res.shop) {
        setAuthModalOpen(false);
        onComplete?.(res.shop);
      } else {
        throw new Error(res?.error || 'Login failed');
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: handle Register
  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const cleanPhone = regPhone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        throw new Error(language === 'hi' ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      }
      if (!regShopName.trim()) {
        throw new Error(language === 'hi' ? 'दुकान का नाम आवश्यक है' : 'Shop name is required');
      }
      const res = await api.registerShop({
        name: regShopName.trim(),
        owner_name: regOwnerName.trim() || regShopName.trim(),
        phone: cleanPhone,
        password: regPassword || '1234',
        trade_type: regTradeType || 'kirana',
        trade_name: regTradeType || 'Kirana & General Store',
        state: regState,
        district: regDistrict || 'Balrampur',
        village: regVillage || 'Utraula Dehat',
        vintage_years: 1,
        bank_account_type: 'State Bank of India'
      });
      if (res && res.shop) {
        setAuthModalOpen(false);
        onComplete?.(res.shop);
      } else {
        throw new Error(res?.error || 'Registration failed');
      }
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: fast login with saved shop
  const handleSelectSavedShop = (shop) => {
    setLoginPhone(shop.phone || '');
    setAuthLoading(true);
    api.loginShop(shop.phone, '1234')
      .then(res => {
        if (res?.shop) {
          setAuthModalOpen(false);
          onComplete?.(res.shop);
        } else {
          onComplete?.(shop);
        }
      })
      .catch(() => {
        onComplete?.(shop);
      })
      .finally(() => setAuthLoading(false));
  };

  // Launch Evaluator Demo
  const handleLaunchEvaluatorDemo = () => {
    setAuthModalOpen(false);
    setWatchDemoOpen(false);
    if (onStartDemoTour) {
      onStartDemoTour();
    } else {
      onSelectDemo?.();
    }
  };

  // Smooth scroll helper
  const scrollToSection = (id) => {
    setActiveMega(null);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] font-sans antialiased selection:bg-[#EAE3D2] selection:text-[#0F3E2E] overflow-x-hidden relative">
      
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION WITH APPLE-STYLE HOVER MEGA-MENUS                       */}
      {/* ========================================================================= */}
      <header 
        className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E7DFD5]/60 transition-all"
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand Lockup */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <VyapaarSetuBridgeLogo className="w-8 h-7 text-[#0F3E2E] transition-transform duration-200 group-hover:scale-[1.03]" />
            <div className="flex flex-col leading-tight">
              <span className="font-serif font-black text-base tracking-tight text-[#0F3E2E]">
                {APP_NAME_HI}
              </span>
              <span className="text-[11px] font-bold tracking-normal text-[#1C1917] -mt-0.5 font-sans">
                {APP_NAME_EN}
              </span>
            </div>
          </div>

          {/* Desktop Nav Links with Hover Mega-Menus */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-[#57534E]">
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-[#0F3E2E] transition-colors cursor-pointer py-2 border-b-2 border-[#0F3E2E] text-[#0F3E2E] font-bold"
            >
              Home
            </button>

            {/* How it Works Nav Item */}
            <div 
              className="relative py-2"
              onMouseEnter={() => handleMouseEnter('how')}
            >
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className={`flex items-center gap-1 hover:text-[#0F3E2E] transition-colors cursor-pointer ${
                  activeMega === 'how' ? 'text-[#0F3E2E] font-bold' : ''
                }`}
              >
                <span>How it Works</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMega === 'how' ? 'rotate-180 text-[#0F3E2E]' : 'opacity-60'}`} />
              </button>
            </div>

            {/* For Shopkeepers Nav Item */}
            <div 
              className="relative py-2"
              onMouseEnter={() => handleMouseEnter('shopkeepers')}
            >
              <button 
                onClick={() => setAuthModalOpen(true)}
                className={`flex items-center gap-1 hover:text-[#0F3E2E] transition-colors cursor-pointer ${
                  activeMega === 'shopkeepers' ? 'text-[#0F3E2E] font-bold' : ''
                }`}
              >
                <span>For Shopkeepers</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMega === 'shopkeepers' ? 'rotate-180 text-[#0F3E2E]' : 'opacity-60'}`} />
              </button>
            </div>

            {/* Impact Nav Item */}
            <div 
              className="relative py-2"
              onMouseEnter={() => handleMouseEnter('impact')}
            >
              <button 
                onClick={() => scrollToSection('four-pillars')}
                className={`flex items-center gap-1 hover:text-[#0F3E2E] transition-colors cursor-pointer ${
                  activeMega === 'impact' ? 'text-[#0F3E2E] font-bold' : ''
                }`}
              >
                <span>Impact</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMega === 'impact' ? 'rotate-180 text-[#0F3E2E]' : 'opacity-60'}`} />
              </button>
            </div>

            {/* About Nav Item */}
            <div 
              className="relative py-2"
              onMouseEnter={() => handleMouseEnter('about')}
            >
              <button 
                onClick={() => scrollToSection('opportunities-section')}
                className={`flex items-center gap-1 hover:text-[#0F3E2E] transition-colors cursor-pointer ${
                  activeMega === 'about' ? 'text-[#0F3E2E] font-bold' : ''
                }`}
              >
                <span>About</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMega === 'about' ? 'rotate-180 text-[#0F3E2E]' : 'opacity-60'}`} />
              </button>
            </div>

          </nav>

          {/* Right: Shopkeeper Login Pill Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-[13px] font-bold tracking-tight shadow-sm transition-all duration-150 cursor-pointer active:scale-98"
            >
              <span>{language === 'hi' ? 'दुकानदार लॉगिन' : 'Shopkeeper Login'}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#1C1917] hover:bg-[#EAE3D2]/40 transition cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* APPLE-STYLE MEGA-MENU PANELS (200-300ms transition, restrained, elegant)*/}
        {/* ======================================================================= */}
        <AnimatePresence>
          {activeMega && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:block absolute top-full inset-x-0 bg-[#FAF7F2] border-b border-[#E7DFD5] shadow-xl z-50 overflow-hidden"
              onMouseEnter={() => {
                if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
              }}
              onMouseLeave={handleMouseLeave}
            >
              <div className="max-w-7xl mx-auto px-8 py-9">

                {/* 1. FOR SHOPKEEPERS MEGA MENU */}
                {activeMega === 'shopkeepers' && (
                  <div className="grid grid-cols-12 gap-8 items-start">
                    <div className="col-span-8 space-y-6">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-[#78716C]">
                        FOR SHOPKEEPERS • ग्रामीण दुकानदारों के लिए
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <button
                          onClick={() => {
                            setAuthMode('register');
                            setAuthModalOpen(true);
                            setActiveMega(null);
                          }}
                          className="text-left group space-y-1 p-3 -m-3 rounded-xl hover:bg-[#F2ECE1] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-sm text-[#1C1917] group-hover:text-[#0F3E2E]">
                            <span>Start Here</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-xs text-[#78716C] leading-relaxed">
                            Create your Vyapaar Setu profile in 30 seconds
                          </p>
                        </button>

                        <button
                          onClick={() => {
                            scrollToSection('four-pillars');
                            setActiveMega(null);
                          }}
                          className="text-left group space-y-1 p-3 -m-3 rounded-xl hover:bg-[#F2ECE1] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-sm text-[#1C1917] group-hover:text-[#0F3E2E]">
                            <span>How Your Score Works</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-xs text-[#78716C] leading-relaxed">
                            Understand the 4 transparent non-CIBIL pillars
                          </p>
                        </button>

                        <button
                          onClick={() => {
                            scrollToSection('how-it-works');
                            setActiveMega(null);
                          }}
                          className="text-left group space-y-1 p-3 -m-3 rounded-xl hover:bg-[#F2ECE1] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-sm text-[#1C1917] group-hover:text-[#0F3E2E]">
                            <span>Your Transactions</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-xs text-[#78716C] leading-relaxed">
                            Turn daily bahi-khata into useful credit data
                          </p>
                        </button>

                        <button
                          onClick={() => {
                            handleLaunchEvaluatorDemo();
                            setActiveMega(null);
                          }}
                          className="text-left group space-y-1 p-3 -m-3 rounded-xl hover:bg-[#F2ECE1] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-sm text-[#1C1917] group-hover:text-[#0F3E2E]">
                            <span>Credit Opportunities</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-xs text-[#78716C] leading-relaxed">
                            Explore formal financing (PM MUDRA, SVANidhi, CGTMSE)
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="col-span-4 border-l border-[#E7DFD5] pl-8 space-y-4">
                      <p className="font-serif italic text-base text-[#1C1917] leading-snug">
                        “Your daily business activity can become your financial history.”
                      </p>
                      <button
                        onClick={() => {
                          setAuthMode('login');
                          setAuthModalOpen(true);
                          setActiveMega(null);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F3E2E] hover:underline cursor-pointer"
                      >
                        <span>Open Shopkeeper Portal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. HOW IT WORKS MEGA MENU */}
                {activeMega === 'how' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-[#E7DFD5]/70 pb-3">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#78716C]">
                        THE SAAKHSETU JOURNEY • फ्रॉम ट्रांजैक्शन टू लोन
                      </span>
                      <button 
                        onClick={() => scrollToSection('how-it-works')} 
                        className="text-xs font-bold text-[#0F3E2E] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>View Step-by-Step Architecture</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-6">
                      <div className="space-y-1.5">
                        <span className="font-mono text-xs font-bold text-[#0F3E2E]">01</span>
                        <h4 className="font-bold text-sm text-[#1C1917]">Connect Data</h4>
                        <p className="text-xs text-[#78716C] leading-relaxed">
                          Link registered mobile and basic enterprise profile.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="font-mono text-xs font-bold text-[#0F3E2E]">02</span>
                        <h4 className="font-bold text-sm text-[#1C1917]">Analyse Transactions</h4>
                        <p className="text-xs text-[#78716C] leading-relaxed">
                          Audit seasonal cash flows, monsoon dips, and udhaar discipline.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="font-mono text-xs font-bold text-[#0F3E2E]">03</span>
                        <h4 className="font-bold text-sm text-[#1C1917]">Get Saakh Score</h4>
                        <p className="text-xs text-[#78716C] leading-relaxed">
                          Receive validated 300–850 PSL-format alternative score.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="font-mono text-xs font-bold text-[#0F3E2E]">04</span>
                        <h4 className="font-bold text-sm text-[#1C1917]">Access Opportunities</h4>
                        <p className="text-xs text-[#78716C] leading-relaxed">
                          Generate printable bank dossiers & auto-match 10 GOI schemes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. IMPACT MEGA MENU */}
                {activeMega === 'impact' && (
                  <div className="grid grid-cols-12 gap-8 items-center">
                    <div className="col-span-8 grid grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <div className="font-serif font-black text-2xl sm:text-3xl text-[#0F3E2E]">63M+</div>
                        <div className="text-xs font-bold text-[#1C1917]">Rural Micro-Enterprises</div>
                        <p className="text-[11px] text-[#78716C]">In formal credit shadow</p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-serif font-black text-2xl sm:text-3xl text-[#0F3E2E]">300–850</div>
                        <div className="text-xs font-bold text-[#1C1917]">Saakh Score Range</div>
                        <p className="text-[11px] text-[#78716C]">Aligned to RBI PSL norms</p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-serif font-black text-2xl sm:text-3xl text-[#0F3E2E]">10+</div>
                        <div className="text-xs font-bold text-[#1C1917]">Integrated Schemes</div>
                        <p className="text-[11px] text-[#78716C]">MUDRA, PM SVANidhi, ODOP</p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-serif font-black text-2xl sm:text-3xl text-[#0F3E2E]">0%</div>
                        <div className="text-xs font-bold text-[#1C1917]">Collateral Required</div>
                        <p className="text-[11px] text-[#78716C]">Cash flow based underwriting</p>
                      </div>
                    </div>
                    <div className="col-span-4 border-l border-[#E7DFD5] pl-8 space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F3E2E]">Built for Bharat</span>
                      <p className="text-xs text-[#57534E] leading-relaxed">
                        Unlocking working capital for underserved micro-merchants across India's villages and peri-urban mandis.
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. ABOUT MEGA MENU */}
                {activeMega === 'about' && (
                  <div className="grid grid-cols-12 gap-8 items-start">
                    <div className="col-span-7 space-y-3">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#78716C]">
                        ABOUT VYAPAAR SETU
                      </span>
                      <h4 className="font-serif font-black text-lg text-[#1C1917]">
                        Re-engineering Rural Lending on India's Digital Public Infrastructure
                      </h4>
                      <p className="text-xs text-[#57534E] leading-relaxed">
                        Vyapaar Setu bridges low-literacy shopkeepers with priority sector credit without requiring formal CA balance sheets, collateral, or traditional CIBIL histories.
                      </p>
                    </div>
                    <div className="col-span-5 border-l border-[#E7DFD5] pl-8 space-y-2.5 text-xs font-bold text-[#1C1917]">
                      <button onClick={() => scrollToSection('four-pillars')} className="block hover:text-[#0F3E2E] transition">
                        → Why Vyapaar Setu Matters
                      </button>
                      <button onClick={() => scrollToSection('four-pillars')} className="block hover:text-[#0F3E2E] transition">
                        → Our 4-Pillar Underwriting Approach
                      </button>
                      <button onClick={() => scrollToSection('opportunities-section')} className="block hover:text-[#0F3E2E] transition">
                        → Priority Sector Lending Architecture
                      </button>
                      <button onClick={() => handleLaunchEvaluatorDemo()} className="block hover:text-[#0F3E2E] transition">
                        → Live Interactive Demo Tour
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E7DFD5] bg-[#FAF7F2] p-5 space-y-4 animate-fadeIn">
            <div className="space-y-2 text-sm font-bold text-[#1C1917]">
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 border-b border-[#E7DFD5]/60"
              >
                Home
              </button>

              <button 
                onClick={() => {
                  scrollToSection('how-it-works');
                }}
                className="w-full text-left py-2 border-b border-[#E7DFD5]/60 flex items-center justify-between"
              >
                <span>How it Works</span>
                <span className="text-xs text-[#78716C]">01–04</span>
              </button>

              <button 
                onClick={() => {
                  setAuthModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 border-b border-[#E7DFD5]/60 flex items-center justify-between"
              >
                <span>For Shopkeepers</span>
                <span className="text-xs text-[#0F3E2E]">Portal →</span>
              </button>

              <button 
                onClick={() => {
                  scrollToSection('four-pillars');
                }}
                className="w-full text-left py-2 border-b border-[#E7DFD5]/60 flex items-center justify-between"
              >
                <span>Impact</span>
                <span className="text-xs text-[#78716C]">63M+</span>
              </button>

              <button 
                onClick={() => {
                  scrollToSection('opportunities-section');
                }}
                className="w-full text-left py-2 flex items-center justify-between"
              >
                <span>About Vyapaar Setu</span>
                <span className="text-xs text-[#78716C]">PSL Platform</span>
              </button>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 rounded-full bg-[#0F3E2E] text-white text-xs font-bold text-center flex items-center justify-center gap-2"
              >
                <span>Shopkeeper Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleLaunchEvaluatorDemo}
                className="w-full py-3 rounded-full bg-[#EAE3D2] text-[#0F3E2E] text-xs font-bold text-center"
              >
                Launch Ramesh Kirana Demo
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. THE HERO SECTION (Exact Match to Reference Image)                      */}
      {/* ========================================================================= */}
      <section className="relative pt-6 sm:pt-10 pb-16 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: Editorial Headline, Copy, Actions, Stats (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-[#D5CCBC] bg-[#FAF7F2] text-[11px] font-semibold text-[#57534E] tracking-tight">
                Priority Sector Lending (PSL) • Alternative Credit Infrastructure
              </div>

              {/* Main Headline (Editorial Serif) */}
              <h1 className="font-serif font-black text-5xl sm:text-6xl md:text-7xl text-[#1C1917] tracking-tight leading-[1.04]">
                Credit<br />
                Closer to Home.
              </h1>

              {/* Supporting Editorial Paragraph */}
              <p className="text-base sm:text-lg text-[#57534E] font-normal leading-relaxed max-w-xl">
                Vyapaar Setu converts everyday transactions of rural businesses into a validated credit profile — unlocking formal loans without CIBIL.
              </p>

              {/* Primary Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-sm font-bold tracking-tight shadow-sm transition-all duration-150 cursor-pointer active:scale-98"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => setWatchDemoOpen(true)}
                  className="group inline-flex items-center gap-2.5 px-4 py-3.5 rounded-full text-sm font-bold text-[#1C1917] hover:text-[#0F3E2E] transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full border border-[#1C1917]/30 group-hover:border-[#0F3E2E] flex items-center justify-center transition-colors">
                    <Play className="w-3.5 h-3.5 fill-[#1C1917] group-hover:fill-[#0F3E2E] translate-x-0.5" />
                  </div>
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Three Key Metrics Strip (Below Hero Copy) */}
              <div className="pt-8 border-t border-[#E7DFD5]/80 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg">
                <div>
                  <div className="font-serif font-black text-2xl sm:text-3xl text-[#1C1917]">
                    63M+
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#78716C] font-medium mt-0.5">
                    Rural Micro-Enterprises
                  </div>
                </div>

                <div className="border-l border-[#E7DFD5] pl-4 sm:pl-8">
                  <div className="font-serif font-black text-2xl sm:text-3xl text-[#1C1917]">
                    300–850
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#78716C] font-medium mt-0.5">
                    Saakh Score Range
                  </div>
                </div>

                <div className="border-l border-[#E7DFD5] pl-4 sm:pl-8">
                  <div className="font-serif font-black text-2xl sm:text-3xl text-[#1C1917]">
                    0
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#78716C] font-medium mt-0.5">
                    Collateral Required
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Authentic Kirana Shopkeeper Editorial Image (5 Cols) */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-md lg:max-w-none">
                {/* Seamless Background Image blending with canvas */}
                <img
                  src="/assets/saakhsetu/hero-shopkeeper.png"
                  alt="Rural Kirana Shopkeeper in Utraula Dehat Village"
                  className="w-full h-auto object-contain rounded-2xl border border-[#E7DFD5]/80 shadow-md select-none pointer-events-none"
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FOUR PILLARS FOR REAL IMPACT (PRODUCT STORY)                           */}
      {/* ========================================================================= */}
      <section id="four-pillars" className="py-16 sm:py-24 border-t border-[#E7DFD5]/80 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12 sm:space-y-16">
          
          {/* Header Split: Headline Left, Narrative Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pb-8 border-b border-[#E7DFD5]/60">
            <div className="md:col-span-7 space-y-2">
              <div className="text-[11px] uppercase font-bold tracking-widest text-[#78716C] flex items-center gap-1.5">
                <span>—</span>
                <span>BUILT FOR BHARAT</span>
              </div>
              <h2 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-[#1C1917] tracking-tight leading-[1.08]">
                Four Pillars<br />
                for Real Impact.
              </h2>
            </div>
            <div className="md:col-span-5">
              <p className="text-sm sm:text-base text-[#57534E] leading-relaxed font-sans">
                We make credit accessible for every small business by using everyday transaction data and India's digital infrastructure.
              </p>
            </div>
          </div>

          {/* 4 Pillars Horizontal Row (Generous Spacing, Subtle Icons, NO Large Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            
            {/* Pillar 1: Cash Flow Velocity */}
            <div className="space-y-3.5">
              <div className="w-11 h-11 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">
                Cash Flow Velocity
              </h3>
              <p className="text-xs sm:text-[13px] text-[#78716C] leading-relaxed">
                Turn daily transactions into meaningful insights.
              </p>
            </div>

            {/* Pillar 2: Community Credit Health */}
            <div className="space-y-3.5 lg:border-l lg:border-[#E7DFD5] lg:pl-10">
              <div className="w-11 h-11 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">
                Community Credit Health
              </h3>
              <p className="text-xs sm:text-[13px] text-[#78716C] leading-relaxed">
                Build trust through local data and disciplined udhaar turnaround.
              </p>
            </div>

            {/* Pillar 3: Seasonal Demand Radar */}
            <div className="space-y-3.5 lg:border-l lg:border-[#E7DFD5] lg:pl-10">
              <div className="w-11 h-11 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">
                Seasonal Demand Radar
              </h3>
              <p className="text-xs sm:text-[13px] text-[#78716C] leading-relaxed">
                Prepare for what's next with real festival and mandi trends.
              </p>
            </div>

            {/* Pillar 4: Sovereign DPI Gateway */}
            <div className="space-y-3.5 lg:border-l lg:border-[#E7DFD5] lg:pl-10">
              <div className="w-11 h-11 rounded-full bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">
                Sovereign DPI Gateway
              </h3>
              <p className="text-xs sm:text-[13px] text-[#78716C] leading-relaxed">
                Connect to ONDC, Udyam, GeM and statutory government schemes.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS (CLEAN HORIZONTAL PROCESS)                                */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-16 sm:py-24 border-t border-[#E7DFD5]/80 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12 sm:space-y-16">
          
          <div className="space-y-2">
            <div className="text-[11px] uppercase font-bold tracking-widest text-[#78716C] flex items-center gap-1.5">
              <span>—</span>
              <span>HOW IT WORKS</span>
            </div>
            <h2 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-[#1C1917] tracking-tight leading-[1.08]">
              From Transactions<br />
              to Opportunities.
            </h2>
          </div>

          {/* Connected 4-Step Horizontal Track */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="space-y-3 relative">
              <div className="w-8 h-8 rounded-full border border-[#1C1917] text-[#1C1917] flex items-center justify-center font-bold text-xs font-mono">
                01
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">
                Connect Data
              </h3>
              <p className="text-xs sm:text-[13px] text-[#78716C] leading-relaxed">
                Link registered mobile and business details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 relative">
              <div className="w-8 h-8 rounded-full border border-[#1C1917] text-[#1C1917] flex items-center justify-center font-bold text-xs font-mono">
                02
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">
                Analyse Transactions
              </h3>
              <p className="text-xs sm:text-[13px] text-[#78716C] leading-relaxed">
                We analyse cash flow, seasonal trends and community behaviour.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 relative">
              <div className="w-8 h-8 rounded-full border border-[#1C1917] text-[#1C1917] flex items-center justify-center font-bold text-xs font-mono">
                03
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">
                Get Saakh Score
              </h3>
              <p className="text-xs sm:text-[13px] text-[#78716C] leading-relaxed">
                Receive a validated credit profile (300–850).
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-3 relative">
              <div className="w-8 h-8 rounded-full border border-[#1C1917] text-[#1C1917] flex items-center justify-center font-bold text-xs font-mono">
                04
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">
                Access Opportunities
              </h3>
              <p className="text-xs sm:text-[13px] text-[#78716C] leading-relaxed">
                Apply for formal loans and government schemes.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ONE HUMAN STORY SECTION                                                */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 border-t border-[#E7DFD5]/80 bg-[#FAF7F2]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14">
            
            {/* Shopkeeper Portrait */}
            <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-full overflow-hidden shrink-0 border-2 border-[#D5CCBC] shadow-sm">
              <img
                src="/assets/saakhsetu/ramesh-portrait.png"
                alt="Ramesh Yadav - Kirana Store Owner"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Human Quote */}
            <div className="space-y-4 text-center md:text-left">
              <blockquote className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-[#1C1917] leading-snug">
                “Pehle sirf udhaar mila karta tha,<br className="hidden sm:inline" />
                ab mauke milte hain.”
              </blockquote>
              <div className="space-y-0.5 text-sm text-[#57534E]">
                <div className="font-bold text-[#1C1917]">— Ramesh Yadav</div>
                <div>Kirana Store, Balrampur (Uttar Pradesh)</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CTA / OPPORTUNITIES SECTION */}
      {/* ========================================================================= */}
      <section id="opportunities-section" className="pt-14 sm:pt-16 pb-0 border-t border-[#E7DFD5]/80 bg-[#FAF7F2] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-6 relative z-10">
          
          {/* Sovereign PSL Accreditation Lockup */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#E7DFD5] shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#0F3E2E]" />
            <span className="text-xs font-semibold text-[#1C1917] tracking-tight">
              {language === 'hi' ? 'प्राथमिकता क्षेत्र ऋण (PSL) • आत्मनिर्भर भारत' : 'Priority Sector Lending • Empowering Rural Enterprises'}
            </span>
          </div>

          {/* Editorial Headline & Supporting Copy */}
          <div className="space-y-2.5">
            <h2 className="font-serif font-black text-3xl sm:text-4xl text-[#1C1917] tracking-tight">
              {language === 'hi' 
                ? 'आज ही अपने बही-खाते को बैंक से जोड़ें।' 
                : 'Bridge Your Bahi-Khata to Credit Today.'}
            </h2>
            <p className="text-sm sm:text-base text-[#57534E] max-w-xl mx-auto leading-relaxed">
              {language === 'hi'
                ? 'दैनिक लेन-देन दर्ज करें, वैकल्पिक साख स्कोर बनाएं और बिना किसी बंधक के प्राथमिक क्षेत्र ऋण (PSL) का लाभ उठाएं।'
                : 'Transform daily counter sales into a verified credit score and access collateral-free Priority Sector Lending.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2 btn-tactile"
            >
              <span>{language === 'hi' ? 'दुकानदार लॉगिन / पंजीकरण →' : 'Get Started as Shopkeeper →'}</span>
            </button>
            <button
              onClick={handleLaunchEvaluatorDemo}
              className="px-5 py-3 rounded-xl bg-white hover:bg-stone-50 border border-[#D5CCBC] text-[#1C1917] text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-2xs btn-tactile"
            >
              <span className="text-[#0F3E2E]">▶</span>
              <span>{language === 'hi' ? 'डेमो देखें' : 'Watch Evaluator Demo'}</span>
            </button>
          </div>

          {/* Calligraphic Accent: Gaon Se Growth Tak */}
          <div className="pt-2 flex items-center justify-center">
            <img 
              src="/assets/saakhsetu/gaon-se-growth.png" 
              alt="Gaon Se Growth Tak" 
              className="h-9 sm:h-10 w-auto object-contain select-none opacity-90"
            />
          </div>

        </div>

        {/* Panoramic Rural Village Landscape grounding the section directly into footer */}
        <div className="w-full mt-8 select-none pointer-events-none">
          <img
            src="/assets/saakhsetu/rural-landscape.png"
            alt="Rural Indian Village Landscape Line Art"
            className="w-full h-auto max-h-44 sm:max-h-52 md:max-h-60 object-contain object-bottom opacity-85 block mx-auto"
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER WITH SUBTLE LANGUAGE TOGGLE                                     */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#E7DFD5] bg-[#FAF7F2] py-12 text-[#78716C] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Logo & Tagline */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <VyapaarSetuBridgeLogo className="w-6 h-5 text-[#0F3E2E]" />
                <span className="font-serif font-black text-sm text-[#0F3E2E]">
                  {APP_NAME_HI} {APP_NAME_EN}
                </span>
              </div>
              <p className="text-[11px] text-[#78716C]">
                Bridging Businesses to Credit • Built for Bharat
              </p>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-medium text-[#57534E]">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#0F3E2E] cursor-pointer">
                Home
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#0F3E2E] cursor-pointer">
                How it Works
              </button>
              <button onClick={() => setAuthModalOpen(true)} className="hover:text-[#0F3E2E] cursor-pointer">
                For Shopkeepers
              </button>
              <button onClick={() => scrollToSection('four-pillars')} className="hover:text-[#0F3E2E] cursor-pointer">
                Impact
              </button>
              <button onClick={() => scrollToSection('opportunities-section')} className="hover:text-[#0F3E2E] cursor-pointer">
                About
              </button>
              <span className="text-[#D5CCBC]">|</span>
              <button onClick={() => alert('Vyapaar Setu operates on strict RBI Priority Sector Lending borrower data privacy principles.')} className="hover:text-[#0F3E2E] cursor-pointer">
                Privacy
              </button>
              <button onClick={() => alert('Vyapaar Setu operates under standard Priority Sector Lending data governance norms.')} className="hover:text-[#0F3E2E] cursor-pointer">
                Terms
              </button>
            </div>

            {/* Social Icons & Refined Language Toggle */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3 text-[#78716C]">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#0F3E2E] transition" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-[#0F3E2E] transition" aria-label="Twitter / X">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-[#0F3E2E] transition" aria-label="YouTube">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>

              <span className="text-[#D5CCBC]">|</span>

              {/* Refined Language Toggle (हिन्दी | English) */}
              <div className="flex items-center gap-1.5 text-xs font-semibold select-none">
                <button
                  onClick={() => setLanguage('hi')}
                  className={`transition-colors cursor-pointer ${language === 'hi' ? 'font-bold text-[#0F3E2E]' : 'text-[#78716C] hover:text-[#1C1917]'}`}
                >
                  हिन्दी
                </button>
                <span className="text-[#D5CCBC]">|</span>
                <button
                  onClick={() => setLanguage('en')}
                  className={`transition-colors cursor-pointer ${language === 'en' ? 'font-bold text-[#0F3E2E]' : 'text-[#78716C] hover:text-[#1C1917]'}`}
                >
                  English
                </button>
              </div>
            </div>

          </div>

          <div className="text-[11px] text-[#A8A29E] text-center sm:text-left border-t border-[#E7DFD5]/60 pt-4">
            © 2026 Vyapaar Setu (व्यापार सेतु). Priority Sector Lending & Micro-Enterprise Credit Architecture. All rights reserved.
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. SHOPKEEPER AUTHENTICATION & LOGIN MODAL                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-md animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md bg-[#FAF7F2] rounded-3xl border border-[#D5CCBC] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setAuthModalOpen(false)}
                className="absolute top-5 right-5 p-1 text-[#78716C] hover:text-[#1C1917] rounded-full transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <VyapaarSetuBridgeLogo className="w-6 h-5 text-[#0F3E2E]" />
                  <span className="font-serif font-black text-lg text-[#0F3E2E]">
                    {authMode === 'login' ? (language === 'hi' ? 'दुकानदार लॉगिन' : 'Shopkeeper Login') : (language === 'hi' ? 'नया उद्यम पंजीकरण' : 'Register New Enterprise')}
                  </span>
                </div>
                <p className="text-xs text-[#57534E]">
                  {language === 'hi' ? 'अपने पंजीकृत मोबाइल नंबर से प्रवेश करें' : 'Access your validated ledger & credit files'}
                </p>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex p-1 bg-[#EAE3D2]/70 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === 'login' ? 'bg-white text-[#1C1917] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  {language === 'hi' ? 'लॉगिन' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === 'register' ? 'bg-white text-[#1C1917] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  {language === 'hi' ? 'नया खाता' : 'Register'}
                </button>
              </div>

              {/* Quick Evaluator Demo Callout Button */}
              <button
                type="button"
                onClick={handleLaunchEvaluatorDemo}
                className="w-full p-3 rounded-2xl bg-[#0F3E2E] hover:bg-[#144F3B] text-white flex items-center justify-between transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">⚡ Launch Ramesh Kirana Demo</div>
                    <div className="text-[10px] text-stone-300">Preloaded with 120-day audited rural transactions & 785 score</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0" />
              </button>

              {/* Error Message */}
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Form Content */}
              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  
                  {/* Saved accounts if any */}
                  {savedShops.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C]">
                        {language === 'hi' ? 'इस डिवाइस पर सहेजे गए खाते' : 'Saved Accounts on Device'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {savedShops.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSavedShop(s)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EAE3D2] border border-[#D5CCBC] text-xs font-semibold text-[#1C1917] transition cursor-pointer"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1917]">
                      {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="9839124789"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]/20 focus:border-[#0F3E2E]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1917]">
                      {language === 'hi' ? '4-अंकों का पिन (PIN)' : '4-Digit PIN'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        maxLength={4}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]/20 focus:border-[#0F3E2E]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    <span>{authLoading ? 'Verifying...' : (language === 'hi' ? 'सुरक्षित लॉगिन करें' : 'Sign In to Store')}</span>
                  </button>

                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1917]">Enterprise Name</label>
                    <input
                      type="text"
                      required
                      value={regShopName}
                      onChange={(e) => setRegShopName(e.target.value)}
                      placeholder="e.g. Ramesh Kirana Store"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1C1917]">Proprietor</label>
                      <input
                        type="text"
                        value={regOwnerName}
                        onChange={(e) => setRegOwnerName(e.target.value)}
                        placeholder="Ramesh Kumar"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1C1917]">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1C1917]">Trade Category</label>
                      <select
                        value={regTradeType}
                        onChange={(e) => setRegTradeType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold"
                      >
                        <option value="kirana">Kirana & Grocery</option>
                        <option value="tailoring">Tailoring & Textiles</option>
                        <option value="dairy">Dairy & Milk</option>
                        <option value="agri">Fertilizer & Seeds</option>
                        <option value="hardware">Hardware & Electrical</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1C1917]">4-Digit PIN</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="1234"
                        className="w-full px-3 py-2 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1C1917]">State / UT</label>
                      <select
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold"
                      >
                        {INDIAN_STATES_AND_UTS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1C1917]">Village / Town</label>
                      <input
                        type="text"
                        value={regVillage}
                        onChange={(e) => setRegVillage(e.target.value)}
                        placeholder="Utraula Dehat"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    <span>{authLoading ? 'Registering...' : 'Create Enterprise Profile'}</span>
                  </button>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 10. WATCH DEMO MODAL                                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {watchDemoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-md animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#D5CCBC] shadow-2xl p-6 sm:p-8 space-y-5 relative"
            >
              <button
                onClick={() => setWatchDemoOpen(false)}
                className="absolute top-5 right-5 p-1 text-[#78716C] hover:text-[#1C1917] rounded-full transition cursor-pointer"
                aria-label="Close demo"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F3E2E]/10 text-[#0F3E2E] text-xs font-bold">
                  <Play className="w-3 h-3 fill-current" />
                  <span>Interactive Evaluator Walkthrough</span>
                </div>
                <h3 className="font-serif font-black text-2xl text-[#1C1917]">
                  Watch Vyapaar Setu in Action
                </h3>
                <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                  Experience how Ramesh Yadav (a kirana shopkeeper in Balrampur, UP) logs everyday counter sales and unlocks a 785/850 prime credit score without a CIBIL history.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E7DFD5] space-y-2.5 text-xs text-[#57534E]">
                <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                  <Check className="w-4 h-4 text-[#0F3E2E]" />
                  <span>Real 4-Month Rural Lifecycle: -32% July monsoon dip & +88% festival surge</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                  <Check className="w-4 h-4 text-[#0F3E2E]" />
                  <span>Interactive What-If Score Simulator boosting credit headroom</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                  <Check className="w-4 h-4 text-[#0F3E2E]" />
                  <span>Downloadable Bankable CAM Dossier formatted per RBI PSL guidelines</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleLaunchEvaluatorDemo}
                  className="flex-1 py-3 rounded-full bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Launch Live Interactive Tour</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setWatchDemoOpen(false)}
                  className="px-5 py-3 rounded-full bg-white hover:bg-[#EAE3D2] text-[#1C1917] border border-[#D5CCBC] text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
