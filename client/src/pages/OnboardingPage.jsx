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
  Loader2,
  ArrowLeft,
  RotateCw,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { safeStorage } from '../utils/safeStorage';
import { useTranslation } from '../i18n/LanguageContext';
import { INDIAN_STATES_AND_UTS, findStandardState } from '../data/indianStates';
import { APP_NAME_EN, APP_NAME_HI, APP_TAGLINE_EN, APP_TAGLINE_HI } from '../config/brand';
import { 
  getFirebaseAuth, 
  isFirebaseConfigured, 
  getFirebaseConfig,
  saveFirebaseConfig,
  resetFirebaseConfig,
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from '../config/firebase';

// Vector SaakhSetu Bridge Logo Icon (exact match to reference image)
export function SaakhSetuBridgeLogo({ className = "w-9 h-7 text-[#0F3E2E]" }) {
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

export function OnboardingPage({ onComplete, onSelectDemo }) {
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
  const [loginStep, setLoginStep] = useState('phone'); // 'phone' | 'otp'
  const [loginPhone, setLoginPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [savedShops, setSavedShops] = useState([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [loginSandboxCode, setLoginSandboxCode] = useState('');
  const [regSandboxCode, setRegSandboxCode] = useState('');

  const otpInputRefs = useRef([]);
  const countdownTimerRef = useRef(null);

  // Register Form states
  const [regStep, setRegStep] = useState('details'); // 'details' | 'otp'
  const [regShopName, setRegShopName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regTradeType, setRegTradeType] = useState('kirana');
  const [regState, setRegState] = useState('Uttar Pradesh');
  const [regVillage, setRegVillage] = useState('Utraula Dehat');
  const [regDistrict, setRegDistrict] = useState('Balrampur');
  const [regOtpDigits, setRegOtpDigits] = useState(['', '', '', '', '', '']);
  const [regResendCountdown, setRegResendCountdown] = useState(0);

  const regOtpInputRefs = useRef([]);
  const regCountdownTimerRef = useRef(null);

  // Watch Demo Modal
  const [watchDemoOpen, setWatchDemoOpen] = useState(false);

  // Firebase Real Phone Auth State (Any number support)
  const [firebaseModalOpen, setFirebaseModalOpen] = useState(false);
  const [firebaseActive, setFirebaseActive] = useState(() => isFirebaseConfigured());
  const [fbConfigInput, setFbConfigInput] = useState(() => {
    const cfg = getFirebaseConfig();
    return cfg.apiKey ? JSON.stringify(cfg, null, 2) : '';
  });
  const [fbSaveMsg, setFbSaveMsg] = useState('');
  const confirmationResultRef = useRef(null);
  const regConfirmationResultRef = useRef(null);

  const setupRecaptcha = (containerId = 'recaptcha-container') => {
    try {
      const auth = getFirebaseAuth();
      if (!auth) return null;
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (_) {}
        window.recaptchaVerifier = null;
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('[Firebase] reCAPTCHA verified');
        },
        'expired-callback': () => {
          setAuthError(language === 'hi' ? 'सुरक्षा सत्यापन समाप्त हो गया। कृपया पुनः प्रयास करें।' : 'reCAPTCHA expired. Please try again.');
        }
      });
      return window.recaptchaVerifier;
    } catch (err) {
      console.warn('[Firebase] Recaptcha setup error:', err);
      return null;
    }
  };

  const handleSaveFirebaseConfig = () => {
    try {
      let parsed = null;
      try {
        parsed = JSON.parse(fbConfigInput);
      } catch (_) {
        const extract = (key) => {
          const match = fbConfigInput.match(new RegExp(`${key}["']?\\s*:\\s*["']([^"']+)["']`)) ||
                        fbConfigInput.match(new RegExp(`${key}=([^\\r\\n]+)`));
          return match ? match[1].trim() : '';
        };
        parsed = {
          apiKey: extract('apiKey') || extract('VITE_FIREBASE_API_KEY'),
          authDomain: extract('authDomain') || extract('VITE_FIREBASE_AUTH_DOMAIN'),
          projectId: extract('projectId') || extract('VITE_FIREBASE_PROJECT_ID'),
          storageBucket: extract('storageBucket') || extract('VITE_FIREBASE_STORAGE_BUCKET'),
          messagingSenderId: extract('messagingSenderId') || extract('VITE_FIREBASE_MESSAGING_SENDER_ID'),
          appId: extract('appId') || extract('VITE_FIREBASE_APP_ID')
        };
      }

      if (!parsed?.apiKey || !parsed?.projectId) {
        throw new Error('Please provide at least apiKey and projectId in your Firebase configuration.');
      }

      saveFirebaseConfig(parsed);
      setFirebaseActive(true);
      setFbSaveMsg(language === 'hi' ? 'फायरबेस एसएमएस सफलतापूर्वक सक्रिय हो गया!' : 'Firebase SMS activated successfully!');
      setTimeout(() => {
        setFirebaseModalOpen(false);
        setFbSaveMsg('');
      }, 1200);
    } catch (err) {
      setFbSaveMsg(err.message || 'Invalid Firebase configuration');
    }
  };

  // Load saved device shops
  useEffect(() => {
    try {
      const parsed = safeStorage.getJSON('vyapaar_saved_shops', []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSavedShops(parsed);
        setLoginPhone(parsed[0].phone ? parsed[0].phone.replace(/\D/g, '').slice(-10) : '');
      }
    } catch (_) {}
  }, []);

  // Cleanup countdown timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (regCountdownTimerRef.current) clearInterval(regCountdownTimerRef.current);
    };
  }, []);

  const startRegResendTimer = () => {
    setRegResendCountdown(30);
    if (regCountdownTimerRef.current) clearInterval(regCountdownTimerRef.current);
    regCountdownTimerRef.current = setInterval(() => {
      setRegResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(regCountdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startResendTimer = () => {
    setResendCountdown(30);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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

  // Auth: Send Real SMS OTP (via Firebase Phone Auth or Server Gateway)
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length < 10) {
        throw new Error(language === 'hi' ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      }

      // 1. Try Firebase Phone Authentication if configured
      const auth = getFirebaseAuth();
      if (auth && isFirebaseConfigured()) {
        try {
          const appVerifier = setupRecaptcha('recaptcha-container');
          if (appVerifier) {
            const formattedPhone = `+91${cleanPhone}`;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            confirmationResultRef.current = confirmationResult;
            setLoginStep('otp');
            setLoginSandboxCode('');
            setOtpDigits(['', '', '', '', '', '']);
            setAuthSuccessMsg(
              language === 'hi'
                ? `📱 असली SMS ओटीपी +91 ${cleanPhone} पर भेज दिया गया है`
                : `📱 Real SMS OTP sent via Firebase to +91 ${cleanPhone}`
            );
            startResendTimer();
            setTimeout(() => {
              otpInputRefs.current[0]?.focus();
            }, 150);
            return;
          }
        } catch (fbErr) {
          console.warn('[Firebase Auth] Dispatch failed, falling back to server gateway:', fbErr);
        }
      }

      // 2. Server gateway fallback (Twilio / Sandbox)
      const res = await api.sendLoginOTP(cleanPhone);
      if (res && res.success) {
        setLoginStep('otp');
        if (res.sandboxCode) {
          setLoginSandboxCode(res.sandboxCode);
          setOtpDigits(res.sandboxCode.split('').slice(0, 6));
          setAuthSuccessMsg(
            language === 'hi'
              ? `⚡ सत्यापन कोड: ${res.sandboxCode} (स्वतः भरा गया)`
              : `⚡ Verification code: ${res.sandboxCode} (auto-filled)`
          );
        } else {
          setOtpDigits(['', '', '', '', '', '']);
          setAuthSuccessMsg(language === 'hi' ? 'ओटीपी सफलतापूर्वक आपके मोबाइल पर भेज दिया गया है' : 'OTP sent successfully to your mobile number');
        }
        startResendTimer();
        setTimeout(() => {
          otpInputRefs.current[5]?.focus();
        }, 150);
      } else {
        throw new Error(res?.error || 'Failed to send OTP');
      }
    } catch (err) {
      setAuthError(err.message || (language === 'hi' ? 'ओटीपी भेजने में असमर्थ। कृपया पुनः प्रयास करें।' : 'Failed to send OTP. Please try again.'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Resend SMS OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || authLoading) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);

      // Try Firebase Resend
      const auth = getFirebaseAuth();
      if (auth && isFirebaseConfigured()) {
        try {
          const appVerifier = setupRecaptcha('recaptcha-container');
          if (appVerifier) {
            const formattedPhone = `+91${cleanPhone}`;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            confirmationResultRef.current = confirmationResult;
            setOtpDigits(['', '', '', '', '', '']);
            setAuthSuccessMsg(language === 'hi' ? 'नया एसएमएस ओटीपी भेज दिया गया है' : 'New SMS OTP sent successfully via Firebase');
            startResendTimer();
            setTimeout(() => {
              otpInputRefs.current[0]?.focus();
            }, 100);
            return;
          }
        } catch (fbErr) {
          console.warn('[Firebase Auth] Resend failed, falling back:', fbErr);
        }
      }

      const res = await api.sendLoginOTP(cleanPhone);
      if (res && res.success) {
        if (res.sandboxCode) {
          setLoginSandboxCode(res.sandboxCode);
          setOtpDigits(res.sandboxCode.split('').slice(0, 6));
          setAuthSuccessMsg(
            language === 'hi'
              ? `⚡ नया सत्यापन कोड: ${res.sandboxCode} (स्वतः भरा गया)`
              : `⚡ New verification code: ${res.sandboxCode} (auto-filled)`
          );
        } else {
          setOtpDigits(['', '', '', '', '', '']);
          setAuthSuccessMsg(language === 'hi' ? 'नया ओटीपी भेज दिया गया है' : 'New OTP sent successfully');
        }
        startResendTimer();
        setTimeout(() => {
          otpInputRefs.current[5]?.focus();
        }, 100);
      } else {
        throw new Error(res?.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to resend OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Verify SMS OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setAuthError(language === 'hi' ? 'कृपया 6 अंकों का पूरा ओटीपी दर्ज करें' : 'Please enter the complete 6-digit OTP');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
      let firebaseVerified = false;

      // If Firebase OTP was sent, confirm code with Firebase
      if (confirmationResultRef.current) {
        try {
          await confirmationResultRef.current.confirm(enteredOtp);
          firebaseVerified = true;
        } catch (fbErr) {
          console.error('[Firebase Verify] Code rejected:', fbErr);
          throw new Error(language === 'hi' ? 'गलत ओटीपी। कृपया एसएमएस देखकर पुनः दर्ज करें।' : 'Incorrect OTP. Please check the SMS and try again.');
        }
      }

      const res = await api.verifyLoginOTP(cleanPhone, enteredOtp, { firebaseVerified });
      if (res && res.shop) {
        if (res.token) {
          safeStorage.setItem('vyapaar_auth_token', res.token);
        }
        setAuthModalOpen(false);
        onComplete?.(res.shop, res.token);
      } else {
        throw new Error(res?.error || 'Verification failed');
      }
    } catch (err) {
      setAuthError(err.message || (language === 'hi' ? 'गलत ओटीपी। कृपया पुनः प्रयास करें।' : 'Incorrect OTP. Please try again.'));
    } finally {
      setAuthLoading(false);
    }
  };

  // OTP Individual Digits Handlers
  const handleOtpDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const copy = [...otpDigits];
      copy[index] = '';
      setOtpDigits(copy);
      return;
    }
    const digit = cleaned.slice(-1);
    const copy = [...otpDigits];
    copy[index] = digit;
    setOtpDigits(copy);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const nextDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < digits.length; i++) {
      nextDigits[i] = digits[i];
    }
    setOtpDigits(nextDigits);
    const nextFocusIndex = Math.min(digits.length, 5);
    otpInputRefs.current[nextFocusIndex]?.focus();
  };

  // Auth: Send Real SMS OTP for Registration (via Firebase Phone Auth or Server Gateway)
  const handleRegisterSendOtp = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length < 10) {
        throw new Error(language === 'hi' ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      }
      if (!regShopName.trim()) {
        throw new Error(language === 'hi' ? 'दुकान का नाम आवश्यक है' : 'Shop name is required');
      }

      // 1. Try Firebase Phone Authentication if configured
      const auth = getFirebaseAuth();
      if (auth && isFirebaseConfigured()) {
        try {
          const appVerifier = setupRecaptcha('recaptcha-container');
          if (appVerifier) {
            const formattedPhone = `+91${cleanPhone}`;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            regConfirmationResultRef.current = confirmationResult;
            setRegStep('otp');
            setRegSandboxCode('');
            setRegOtpDigits(['', '', '', '', '', '']);
            setAuthSuccessMsg(
              language === 'hi'
                ? `📱 असली SMS ओटीपी +91 ${cleanPhone} पर भेज दिया गया है`
                : `📱 Real SMS OTP sent via Firebase to +91 ${cleanPhone}`
            );
            startRegResendTimer();
            setTimeout(() => {
              regOtpInputRefs.current[0]?.focus();
            }, 150);
            return;
          }
        } catch (fbErr) {
          console.warn('[Firebase Auth Register] Dispatch failed, falling back:', fbErr);
        }
      }

      // 2. Server gateway fallback
      const res = await api.sendRegisterOTP(cleanPhone);
      if (res && res.success) {
        setRegStep('otp');
        if (res.sandboxCode) {
          setRegSandboxCode(res.sandboxCode);
          setRegOtpDigits(res.sandboxCode.split('').slice(0, 6));
          setAuthSuccessMsg(
            language === 'hi'
              ? `⚡ सत्यापन कोड: ${res.sandboxCode} (स्वतः भरा गया)`
              : `⚡ Verification code: ${res.sandboxCode} (auto-filled)`
          );
        } else {
          setRegOtpDigits(['', '', '', '', '', '']);
          setAuthSuccessMsg(language === 'hi' ? 'ओटीपी सफलतापूर्वक आपके मोबाइल पर भेज दिया गया है' : 'OTP sent successfully to your mobile number');
        }
        startRegResendTimer();
        setTimeout(() => {
          regOtpInputRefs.current[5]?.focus();
        }, 150);
      } else {
        throw new Error(res?.error || 'Failed to send OTP');
      }
    } catch (err) {
      setAuthError(err.message || (language === 'hi' ? 'ओटीपी भेजने में असमर्थ। कृपया पुनः प्रयास करें।' : 'Failed to send OTP. Please try again.'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Resend SMS OTP for Registration
  const handleRegisterResendOtp = async () => {
    if (regResendCountdown > 0 || authLoading) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);

      // Try Firebase Resend
      const auth = getFirebaseAuth();
      if (auth && isFirebaseConfigured()) {
        try {
          const appVerifier = setupRecaptcha('recaptcha-container');
          if (appVerifier) {
            const formattedPhone = `+91${cleanPhone}`;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            regConfirmationResultRef.current = confirmationResult;
            setRegOtpDigits(['', '', '', '', '', '']);
            setAuthSuccessMsg(language === 'hi' ? 'नया एसएमएस ओटीपी भेज दिया गया है' : 'New SMS OTP sent successfully via Firebase');
            startRegResendTimer();
            setTimeout(() => {
              regOtpInputRefs.current[0]?.focus();
            }, 100);
            return;
          }
        } catch (fbErr) {
          console.warn('[Firebase Auth Register] Resend failed, falling back:', fbErr);
        }
      }

      const res = await api.sendRegisterOTP(cleanPhone);
      if (res && res.success) {
        if (res.sandboxCode) {
          setRegSandboxCode(res.sandboxCode);
          setRegOtpDigits(res.sandboxCode.split('').slice(0, 6));
          setAuthSuccessMsg(
            language === 'hi'
              ? `⚡ नया सत्यापन कोड: ${res.sandboxCode} (स्वतः भरा गया)`
              : `⚡ New verification code: ${res.sandboxCode} (auto-filled)`
          );
        } else {
          setRegOtpDigits(['', '', '', '', '', '']);
          setAuthSuccessMsg(language === 'hi' ? 'नया ओटीपी भेज दिया गया है' : 'New OTP sent successfully');
        }
        startRegResendTimer();
        setTimeout(() => {
          regOtpInputRefs.current[5]?.focus();
        }, 100);
      } else {
        throw new Error(res?.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to resend OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Verify OTP & Complete Registration
  const handleRegisterVerifyAndSubmit = async (e) => {
    e?.preventDefault();
    const enteredOtp = regOtpDigits.join('');
    if (enteredOtp.length !== 6) {
      setAuthError(language === 'hi' ? 'कृपया 6 अंकों का पूरा ओटीपी दर्ज करें' : 'Please enter the complete 6-digit OTP');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);
      let firebaseVerified = false;

      // Confirm with Firebase if OTP was sent via Firebase
      if (regConfirmationResultRef.current) {
        try {
          await regConfirmationResultRef.current.confirm(enteredOtp);
          firebaseVerified = true;
        } catch (fbErr) {
          console.error('[Firebase Register Verify] Code rejected:', fbErr);
          throw new Error(language === 'hi' ? 'गलत ओटीपी। कृपया एसएमएस जांचें और पुनः प्रयास करें।' : 'Incorrect OTP. Please check the SMS and try again.');
        }
      }

      const res = await api.registerShop({
        name: regShopName.trim(),
        owner_name: regOwnerName.trim() || regShopName.trim(),
        phone: cleanPhone,
        trade_type: regTradeType,
        trade_name: regTradeType,
        state: regState,
        district: regDistrict || 'Balrampur',
        village: regVillage || 'Utraula Dehat',
        vintage_years: 1,
        bank_account_type: 'State Bank of India',
        otp: enteredOtp,
        firebaseVerified
      });
      if (res && res.shop) {
        if (res.token) {
          safeStorage.setItem('vyapaar_auth_token', res.token);
        }
        setAuthModalOpen(false);
        onComplete?.(res.shop, res.token);
      } else {
        throw new Error(res?.error || 'Registration failed');
      }
    } catch (err) {
      setAuthError(err.message || (language === 'hi' ? 'गलत ओटीपी। कृपया एसएमएस जांचें और पुनः प्रयास करें।' : 'Incorrect OTP or registration failed. Please try again.'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Registration OTP Individual Digit Handlers
  const handleRegOtpDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const copy = [...regOtpDigits];
      copy[index] = '';
      setRegOtpDigits(copy);
      return;
    }
    const digit = cleaned.slice(-1);
    const copy = [...regOtpDigits];
    copy[index] = digit;
    setRegOtpDigits(copy);

    if (index < 5) {
      regOtpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleRegOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !regOtpDigits[index] && index > 0) {
      regOtpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleRegOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const nextDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < digits.length; i++) {
      nextDigits[i] = digits[i];
    }
    setRegOtpDigits(nextDigits);
    const nextFocusIndex = Math.min(digits.length, 5);
    regOtpInputRefs.current[nextFocusIndex]?.focus();
  };

  // Auth: fast login with saved shop
  const handleSelectSavedShop = (shop) => {
    const rawPhone = shop.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    setLoginPhone(cleanPhone);
    setLoginStep('phone');
    setAuthError('');
    setAuthSuccessMsg('');
  };

  // Launch Evaluator Demo
  const handleLaunchEvaluatorDemo = async () => {
    setAuthModalOpen(false);
    setWatchDemoOpen(false);
    try {
      const res = await api.demoLogin().catch(() => null);
      if (res?.token) {
        safeStorage.setItem('vyapaar_auth_token', res.token);
      }
    } catch (_) {}
    onSelectDemo?.();
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
            <SaakhSetuBridgeLogo className="w-8 h-7 text-[#0F3E2E] transition-transform duration-200 group-hover:scale-[1.03]" />
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
                onClick={() => scrollToSection('sih-section')}
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
                            Create your SaakhSetu profile in 30 seconds
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
                        ABOUT SAAKHSETU
                      </span>
                      <h4 className="font-serif font-black text-lg text-[#1C1917]">
                        Re-engineering Rural Lending on India's Digital Public Infrastructure
                      </h4>
                      <p className="text-xs text-[#57534E] leading-relaxed">
                        Built for Smart India Hackathon 2026. SaakhSetu bridges low-literacy shopkeepers with priority sector credit without requiring formal CA balance sheets, collateral, or traditional CIBIL histories.
                      </p>
                    </div>
                    <div className="col-span-5 border-l border-[#E7DFD5] pl-8 space-y-2.5 text-xs font-bold text-[#1C1917]">
                      <button onClick={() => scrollToSection('four-pillars')} className="block hover:text-[#0F3E2E] transition">
                        → Why SaakhSetu Matters
                      </button>
                      <button onClick={() => scrollToSection('four-pillars')} className="block hover:text-[#0F3E2E] transition">
                        → Our 4-Pillar Underwriting Approach
                      </button>
                      <button onClick={() => scrollToSection('sih-section')} className="block hover:text-[#0F3E2E] transition">
                        → Smart India Hackathon 2026 Submission
                      </button>
                      <button onClick={() => setAuthModalOpen(true)} className="block hover:text-[#0F3E2E] transition">
                        → Evaluator Demo & Documentation Access
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
                  scrollToSection('sih-section');
                }}
                className="w-full text-left py-2 flex items-center justify-between"
              >
                <span>About & SIH 2026</span>
                <span className="text-xs text-[#78716C]">Prototype</span>
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
                RBI Priority Sector Lending • Smart India Hackathon 2026
              </div>

              {/* Main Headline (Editorial Serif) */}
              <h1 className="font-serif font-black text-5xl sm:text-6xl md:text-7xl text-[#1C1917] tracking-tight leading-[1.04]">
                Credit<br />
                Closer to Home.
              </h1>

              {/* Supporting Editorial Paragraph */}
              <p className="text-base sm:text-lg text-[#57534E] font-normal leading-relaxed max-w-xl">
                SaakhSetu converts everyday transactions of rural businesses into a validated credit profile — unlocking formal loans without CIBIL.
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
      {/* 6. CTA / OPPORTUNITIES & SIH 2026 SECTION                                  */}
      {/* ========================================================================= */}
      <section id="sih-section" className="pt-14 sm:pt-16 pb-0 border-t border-[#E7DFD5]/80 bg-[#FAF7F2] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-6 relative z-10">
          
          {/* SIH 2026 National Emblem Lockup */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/90 border border-[#E7DFD5] shadow-2xs">
            <img 
              src="/assets/saakhsetu/sih-emblem.png" 
              alt="Smart India Hackathon 2026 Emblem" 
              className="w-5 h-5 object-contain"
            />
            <span className="text-xs font-semibold text-[#1C1917] tracking-tight">
              Smart India Hackathon 2026 • Ideas for a Viksit Bharat
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
              className="px-6 py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <span>{language === 'hi' ? 'दुकानदार लॉगिन / पंजीकरण →' : 'Get Started as Shopkeeper →'}</span>
            </button>
            <button
              onClick={() => setDemoTourOpen(true)}
              className="px-5 py-3 rounded-xl bg-white hover:bg-stone-50 border border-[#D5CCBC] text-[#1C1917] text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
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
                <SaakhSetuBridgeLogo className="w-6 h-5 text-[#0F3E2E]" />
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
              <button onClick={() => scrollToSection('sih-section')} className="hover:text-[#0F3E2E] cursor-pointer">
                About
              </button>
              <span className="text-[#D5CCBC]">|</span>
              <button onClick={() => alert('SaakhSetu operates on strict RBI Priority Sector Lending borrower data privacy principles.')} className="hover:text-[#0F3E2E] cursor-pointer">
                Privacy
              </button>
              <button onClick={() => alert('Prototype terms: SIH 2026 Evaluation Sandbox.')} className="hover:text-[#0F3E2E] cursor-pointer">
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
            © 2026 SaakhSetu. Smart India Hackathon Prototype. All rights reserved.
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
                  <SaakhSetuBridgeLogo className="w-6 h-5 text-[#0F3E2E]" />
                  <span className="font-serif font-black text-lg text-[#0F3E2E]">
                    {authMode === 'login' 
                      ? (loginStep === 'otp'
                          ? (language === 'hi' ? 'ओटीपी सत्यापित करें' : 'Verify Mobile')
                          : (language === 'hi' ? 'दुकानदार लॉगिन' : 'Welcome back'))
                      : (regStep === 'otp'
                          ? (language === 'hi' ? 'मोबाइल नंबर सत्यापित करें' : 'Verify Mobile Number')
                          : (language === 'hi' ? 'नया उद्यम पंजीकरण' : 'Register New Enterprise'))}
                  </span>
                </div>
                <p className="text-xs text-[#57534E]">
                  {authMode === 'login' 
                    ? (loginStep === 'otp'
                        ? `${language === 'hi' ? 'ओटीपी भेजा गया:' : 'OTP sent to'} +91 ${loginPhone.slice(0, 2)}XXX XX${loginPhone.slice(7)}`
                        : (language === 'hi' ? 'सुरक्षित एसएमएस ओटीपी के साथ प्रवेश करें' : 'Enter your registered mobile number for SMS OTP login'))
                    : (regStep === 'otp'
                        ? `${language === 'hi' ? 'ओटीपी भेजा गया:' : 'OTP sent to'} +91 ${regPhone.slice(0, 2)}XXX XX${regPhone.slice(7)}`
                        : (language === 'hi' ? 'अपने व्यापार के लिए डिजिटल बही-खाता बनाएं' : 'Access your validated ledger & credit files'))}
                </p>
              </div>

              {/* Mode Toggle Pills (only show when neither login nor register is in OTP step) */}
              {(loginStep !== 'otp' && regStep !== 'otp') && (
                <div className="flex p-1 bg-[#EAE3D2]/70 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setLoginStep('phone'); setAuthError(''); setAuthSuccessMsg(''); }}
                    className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                      authMode === 'login' ? 'bg-white text-[#1C1917] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    {language === 'hi' ? 'लॉगिन' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setRegStep('details'); setAuthError(''); setAuthSuccessMsg(''); }}
                    className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                      authMode === 'register' ? 'bg-white text-[#1C1917] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    {language === 'hi' ? 'नया खाता' : 'Register'}
                  </button>
                </div>
              )}

              {/* Firebase Real SMS Gateway Status & Configure Button */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-100/90 border border-[#D5CCBC]/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${firebaseActive ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500'}`} />
                  <span className="font-semibold text-[#1C1917] text-[11px]">
                    {firebaseActive 
                      ? (language === 'hi' ? 'फ़ायरबेस लाइव एसएमएस (सभी नंबर समर्थित)' : 'Firebase Live SMS (Any Mobile Number)')
                      : (language === 'hi' ? 'फ़ायरबेस एसएमएस: सेटअप करें' : 'Firebase SMS: Setup Required')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setFirebaseModalOpen(true); setFbSaveMsg(''); }}
                  className="text-[11px] font-bold text-[#0F3E2E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>{firebaseActive ? (language === 'hi' ? 'सेटिंग्स' : 'Config') : (language === 'hi' ? 'सेट करें' : 'Setup')}</span>
                </button>
              </div>

              {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
              <div id="recaptcha-container"></div>

              {/* Success Message */}
              {authSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{authSuccessMsg}</span>
                </div>
              )}

              {/* Error Message */}
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Form Content */}
              {authMode === 'login' ? (
                loginStep === 'phone' ? (
                  /* STATE 1: PHONE NUMBER ENTRY */
                  <form onSubmit={handleSendOtp} className="space-y-4">
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
                      <div className="flex rounded-xl border border-[#D5CCBC] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F3E2E]/20 focus-within:border-[#0F3E2E] transition">
                        <span className="bg-[#EAE3D2]/70 text-[#1C1917] font-bold text-xs px-3.5 py-2.5 flex items-center border-r border-[#D5CCBC] select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={loginPhone}
                          onChange={(e) => {
                            setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                            setAuthError('');
                          }}
                          placeholder="9876543210"
                          className="w-full px-3.5 py-2.5 bg-transparent text-xs font-semibold text-[#1C1917] tracking-wider focus:outline-none placeholder:tracking-normal"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || loginPhone.length < 10}
                      className="w-full py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                      <span>{authLoading ? (language === 'hi' ? 'ओटीपी भेजा जा रहा है...' : 'Sending OTP...') : (language === 'hi' ? 'ओटीपी भेजें' : 'Send OTP')}</span>
                    </button>

                    {/* Divider OR */}
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-[#D5CCBC]"></div>
                      <span className="flex-shrink mx-3 text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                        {language === 'hi' ? 'या' : 'OR'}
                      </span>
                      <div className="flex-grow border-t border-[#D5CCBC]"></div>
                    </div>

                    {/* Quick Evaluator Demo Callout Button */}
                    <button
                      type="button"
                      onClick={handleLaunchEvaluatorDemo}
                      className="w-full p-3 rounded-2xl bg-white hover:bg-[#EAE3D2]/50 border border-[#D5CCBC] text-[#1C1917] flex items-center justify-between transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">{language === 'hi' ? '⚡ रमेश किराना डेमो देखें' : '⚡ Try Ramesh Kirana Demo'}</div>
                          <div className="text-[10px] text-[#78716C]">{language === 'hi' ? '120 दिनों के लेन-देन और 785 स्कोर सहित' : 'Preloaded with 120-day transactions & 785 score'}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#78716C] transition-transform group-hover:translate-x-1 shrink-0" />
                    </button>
                  </form>
                ) : (
                  /* STATE 2: 6-DIGIT OTP VERIFICATION */
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="space-y-2 text-center">
                      <div className="text-xs text-[#57534E]">
                        {language === 'hi' ? 'एसएमएस में प्राप्त 6-अंकों का ओटीपी दर्ज करें' : 'Enter the 6-digit code received via SMS'}
                      </div>
                      
                      {/* 6 Discrete Digit Boxes */}
                      <div 
                        className="flex items-center justify-center gap-2 sm:gap-2.5 pt-1"
                        onPaste={handleOtpPaste}
                      >
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpInputRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-mono font-black rounded-xl border border-[#D5CCBC] bg-white text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] focus:border-[#0F3E2E] shadow-sm transition"
                          />
                        ))}
                      </div>

                      {/* SMS Carrier Delay / Evaluator Helper Banner */}
                      <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 text-left space-y-1 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>{language === 'hi' ? 'एसएमएस सहायता / त्वरित कोड' : 'SMS Helper / Quick Fill'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const codeToUse = loginSandboxCode || '123456';
                              setOtpDigits(codeToUse.split('').slice(0, 6));
                              setTimeout(() => otpInputRefs.current[5]?.focus(), 50);
                            }}
                            className="text-[11px] font-bold text-[#0F3E2E] bg-white px-2.5 py-1 rounded-lg border border-amber-300 hover:bg-amber-100 transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <span>{language === 'hi' ? 'कोड भरें' : 'Auto-fill'}</span>
                            <span className="font-mono bg-amber-100 px-1 rounded text-amber-900">{loginSandboxCode || '123456'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-snug">
                          {language === 'hi'
                            ? `यदि टेलीकॉम ऑपरेटर द्वारा एसएमएस में देरी हो, तो कोड ${loginSandboxCode || '123456'} का उपयोग करें।`
                            : `If carrier SMS is delayed, code is ${loginSandboxCode || '123456'} (or evaluation bypass 123456).`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || otpDigits.join('').length !== 6}
                      className="w-full py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>{authLoading ? (language === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...') : (language === 'hi' ? 'ओटीपी सत्यापित करें' : 'Verify OTP')}</span>
                    </button>

                    {/* Resend Countdown & Action */}
                    <div className="flex flex-col items-center gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-[#57534E]">
                        <span>{language === 'hi' ? 'ओटीपी नहीं मिला?' : "Didn't receive the OTP?"}</span>
                        {resendCountdown > 0 ? (
                          <span className="font-semibold text-[#78716C]">
                            {language === 'hi' 
                              ? `${resendCountdown}s में पुनः भेजें` 
                              : `Resend in ${resendCountdown}s`}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={authLoading}
                            onClick={handleResendOtp}
                            className="font-bold text-[#0F3E2E] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>{language === 'hi' ? 'ओटीपी दोबारा भेजें' : 'Resend OTP'}</span>
                          </button>
                        )}
                      </div>

                      {/* Change Number Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setLoginStep('phone');
                          setAuthError('');
                          setAuthSuccessMsg('');
                        }}
                        className="text-[11px] font-semibold text-[#78716C] hover:text-[#1C1917] cursor-pointer flex items-center gap-1 mt-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>{language === 'hi' ? 'मोबाइल नंबर बदलें' : 'Change Number'}</span>
                      </button>
                    </div>
                  </form>
                )
              ) : (
                regStep === 'details' ? (
                  /* REGISTRATION STEP 1: SHOP DETAILS & PHONE */
                  <form onSubmit={handleRegisterSendOtp} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1C1917]">
                        {language === 'hi' ? 'उद्यम का नाम' : 'Enterprise Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={regShopName}
                        onChange={(e) => setRegShopName(e.target.value)}
                        placeholder="e.g. Ramesh Kirana Store"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1C1917]">
                          {language === 'hi' ? 'मालिक का नाम' : 'Proprietor'}
                        </label>
                        <input
                          type="text"
                          value={regOwnerName}
                          onChange={(e) => setRegOwnerName(e.target.value)}
                          placeholder="Ramesh Kumar"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1C1917]">
                          {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                        </label>
                        <div className="flex rounded-xl border border-[#D5CCBC] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F3E2E]/20 focus-within:border-[#0F3E2E] transition">
                          <span className="bg-[#EAE3D2]/70 text-[#1C1917] font-bold text-xs px-2.5 py-2 flex items-center border-r border-[#D5CCBC] select-none">
                            +91
                          </span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            required
                            value={regPhone}
                            onChange={(e) => {
                              setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                              setAuthError('');
                            }}
                            placeholder="9876543210"
                            className="w-full px-2.5 py-2 bg-transparent text-xs font-semibold text-[#1C1917] tracking-wider focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1C1917]">
                        {language === 'hi' ? 'व्यापार श्रेणी' : 'Trade Category'}
                      </label>
                      <select
                        value={regTradeType}
                        onChange={(e) => setRegTradeType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold"
                      >
                        <option value="kirana">Kirana & Grocery (किराना)</option>
                        <option value="tailoring">Tailoring & Textiles (सिलाई एवं वस्त्र)</option>
                        <option value="dairy">Dairy & Milk (डेयरी एवं दुग्ध)</option>
                        <option value="agri">Fertilizer & Seeds (कृषि व बीज)</option>
                        <option value="hardware">Hardware & Electrical (हार्डवेयर)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1C1917]">
                          {language === 'hi' ? 'राज्य / केंद्र शासित प्रदेश' : 'State / UT'}
                        </label>
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
                        <label className="text-xs font-bold text-[#1C1917]">
                          {language === 'hi' ? 'गांव / कस्बा' : 'Village / Town'}
                        </label>
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
                      disabled={authLoading || regPhone.length < 10 || !regShopName.trim()}
                      className="w-full py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 mt-2 shadow-sm"
                    >
                      {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                      <span>{authLoading ? (language === 'hi' ? 'ओटीपी भेजा जा रहा है...' : 'Sending OTP...') : (language === 'hi' ? 'ओटीपी भेजें और आगे बढ़ें' : 'Send SMS OTP & Continue')}</span>
                    </button>
                  </form>
                ) : (
                  /* REGISTRATION STEP 2: 6-DIGIT OTP VERIFICATION */
                  <form onSubmit={handleRegisterVerifyAndSubmit} className="space-y-5">
                    <div className="space-y-2 text-center">
                      <div className="text-xs text-[#57534E]">
                        {language === 'hi' ? 'एसएमएस में प्राप्त 6-अंकों का ओटीपी दर्ज करें' : 'Enter the 6-digit verification code received via SMS'}
                      </div>
                      
                      {/* 6 Discrete Digit Boxes */}
                      <div 
                        className="flex items-center justify-center gap-2 sm:gap-2.5 pt-1"
                        onPaste={handleRegOtpPaste}
                      >
                        {regOtpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (regOtpInputRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleRegOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleRegOtpKeyDown(idx, e)}
                            className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-mono font-black rounded-xl border border-[#D5CCBC] bg-white text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] focus:border-[#0F3E2E] shadow-sm transition"
                          />
                        ))}
                      </div>

                      {/* SMS Carrier Delay / Evaluator Helper Banner */}
                      <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 text-left space-y-1 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>{language === 'hi' ? 'एसएमएस सहायता / त्वरित कोड' : 'SMS Helper / Quick Fill'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const codeToUse = regSandboxCode || '123456';
                              setRegOtpDigits(codeToUse.split('').slice(0, 6));
                              setTimeout(() => regOtpInputRefs.current[5]?.focus(), 50);
                            }}
                            className="text-[11px] font-bold text-[#0F3E2E] bg-white px-2.5 py-1 rounded-lg border border-amber-300 hover:bg-amber-100 transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <span>{language === 'hi' ? 'कोड भरें' : 'Auto-fill'}</span>
                            <span className="font-mono bg-amber-100 px-1 rounded text-amber-900">{regSandboxCode || '123456'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-snug">
                          {language === 'hi'
                            ? `यदि टेलीकॉम ऑपरेटर द्वारा एसएमएस में देरी हो, तो कोड ${regSandboxCode || '123456'} का उपयोग करें।`
                            : `If carrier SMS is delayed, code is ${regSandboxCode || '123456'} (or evaluation bypass 123456).`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || regOtpDigits.join('').length !== 6}
                      className="w-full py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>{authLoading ? (language === 'hi' ? 'खाता बन रहा है...' : 'Creating Enterprise...') : (language === 'hi' ? 'ओटीपी सत्यापित करें और खाता बनाएं' : 'Verify OTP & Create Enterprise')}</span>
                    </button>

                    {/* Resend Countdown & Action */}
                    <div className="flex flex-col items-center gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-[#57534E]">
                        <span>{language === 'hi' ? 'ओटीपी नहीं मिला?' : "Didn't receive the OTP?"}</span>
                        {regResendCountdown > 0 ? (
                          <span className="font-semibold text-[#78716C]">
                            {language === 'hi' 
                              ? `${regResendCountdown}s में पुनः भेजें` 
                              : `Resend in ${regResendCountdown}s`}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={authLoading}
                            onClick={handleRegisterResendOtp}
                            className="font-bold text-[#0F3E2E] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>{language === 'hi' ? 'ओटीपी दोबारा भेजें' : 'Resend OTP'}</span>
                          </button>
                        )}
                      </div>

                      {/* Edit Details Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setRegStep('details');
                          setAuthError('');
                          setAuthSuccessMsg('');
                        }}
                        className="text-[11px] font-semibold text-[#78716C] hover:text-[#1C1917] cursor-pointer flex items-center gap-1 mt-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>{language === 'hi' ? 'विवरण बदलें' : 'Edit Details'}</span>
                      </button>
                    </div>
                  </form>
                )
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
                  Watch SaakhSetu in Action
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

      {/* ========================================================================= */}
      {/* 11. FIREBASE SMS CONFIGURATION MODAL                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {firebaseModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#D5CCBC] shadow-2xl p-6 sm:p-7 space-y-4 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setFirebaseModalOpen(false)}
                className="absolute top-5 right-5 p-1 text-[#78716C] hover:text-[#1C1917] rounded-full transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>Real SMS to Any Indian Number (+91)</span>
                </div>
                <h3 className="font-serif font-bold text-xl text-[#1C1917]">
                  {language === 'hi' ? 'फ़ायरबेस फ़ोन ऑथेंटिकेशन सेटअप' : 'Firebase SMS Authentication Setup'}
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  {language === 'hi'
                    ? 'फ़ायरबेस कंसोल से अपने वेब ऐप की कॉन्फ़िगरेशन (JSON या JS स्निपेट) यहाँ पेस्ट करें। यह बिना किसी नंबर प्रतिबंध के सीधे भारत के किसी भी 10-अंकीय मोबाइल नंबर पर लाइव एसएमएस ओटीपी भेजेगा।'
                    : 'Paste your Firebase Web App configuration snippet from the Firebase Console. This enables real, high-delivery SMS OTP to ANY 10-digit mobile phone in India without carrier blocks.'}
                </p>
              </div>

              {fbSaveMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{fbSaveMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
                  <label htmlFor="fb-config-textarea">
                    Firebase Config ({language === 'hi' ? 'कंसोल से कॉपी किया गया स्निपेट' : 'SDK Config Snippet'}):
                  </label>
                  <span className="text-[10px] text-[#78716C] font-normal">
                    Supports JSON or `const firebaseConfig = {'{ ... }'}`
                  </span>
                </div>
                <textarea
                  id="fb-config-textarea"
                  rows={8}
                  value={fbConfigInput}
                  onChange={(e) => setFbConfigInput(e.target.value)}
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-project",\n  "storageBucket": "your-project.firebasestorage.app",\n  "messagingSenderId": "123456789",\n  "appId": "1:123:web:abc"\n}`}
                  className="w-full p-3 font-mono text-xs rounded-xl bg-white border border-[#D5CCBC] focus:ring-2 focus:ring-[#0F3E2E]/20 focus:border-[#0F3E2E] focus:outline-none"
                />
              </div>

              {/* Quick instructions */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>How to get this from Firebase Console:</span>
                </div>
                <ol className="list-decimal list-inside space-y-0.5 text-[10.5px] pl-1 text-amber-800">
                  <li>Go to <strong>Firebase Console &rarr; Project Settings &rarr; General</strong></li>
                  <li>Scroll down to <strong>Your apps</strong> &rarr; click Web App (<strong>&lt;/&gt;</strong>)</li>
                  <li>Copy the <strong>firebaseConfig</strong> object and paste it in the box above</li>
                </ol>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const ok = saveFirebaseConfig(fbConfigInput);
                    if (ok) {
                      setFirebaseActive(true);
                      setFbSaveMsg(language === 'hi' ? '✓ फ़ायरबेस सफलतापूर्वक सहेजा गया और सक्रिय है!' : '✓ Firebase configured & activated successfully!');
                      setTimeout(() => {
                        setFirebaseModalOpen(false);
                      }, 1200);
                    } else {
                      setFbSaveMsg(language === 'hi' ? '✕ अमान्य कॉन्फ़िगरेशन। कृपया apiKey और projectId जांचें।' : '✕ Invalid config. Please ensure apiKey and projectId are present.');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  {language === 'hi' ? 'सहेजें और सक्रिय करें' : 'Save & Activate'}
                </button>
                {firebaseActive && (
                  <button
                    type="button"
                    onClick={() => {
                      resetFirebaseConfig();
                      setFirebaseActive(false);
                      setFbConfigInput('');
                      setFbSaveMsg(language === 'hi' ? 'रीसेट कर दिया गया' : 'Reset to default');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-red-600 border border-red-200 text-xs font-semibold cursor-pointer"
                  >
                    {language === 'hi' ? 'रीसेट' : 'Reset'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFirebaseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#EAE3D2] text-[#1C1917] border border-[#D5CCBC] text-xs font-semibold cursor-pointer"
                >
                  {language === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
