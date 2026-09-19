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
  Globe,
  ArrowLeft,
  RotateCw,
  Mail,
  Settings,
  ExternalLink,
  Smartphone
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
  const { language, setLanguage, supportedLanguages, currentLanguageInfo } = useTranslation();

  // Mega-menu state: 'how' | 'shopkeepers' | 'impact' | 'about' | null
  const [activeMega, setActiveMega] = useState(null);
  const megaTimeoutRef = useRef(null);

  // Multi-language dropdown states
  const [headerLangOpen, setHeaderLangOpen] = useState(false);
  const [footerLangOpen, setFooterLangOpen] = useState(false);
  const headerLangRef = useRef(null);
  const footerLangRef = useRef(null);

  // Mobile menu drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState(null);

  // Auth Modal (Shopkeeper Login & Register)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authChannel, setAuthChannel] = useState('phone'); // 'phone' | 'email'
  const [loginStep, setLoginStep] = useState('phone'); // 'phone' | 'otp'
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [savedShops, setSavedShops] = useState([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [sandboxCodeHint, setSandboxCodeHint] = useState('');

  const otpInputRefs = useRef([]);
  const countdownTimerRef = useRef(null);

  // Register Form states
  const [regStep, setRegStep] = useState('details'); // 'details' | 'otp'
  const [regShopName, setRegShopName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('1234');
  const [regTradeType, setRegTradeType] = useState('kirana');
  const [regState, setRegState] = useState('Uttar Pradesh');
  const [regVillage, setRegVillage] = useState('Utraula Dehat');
  const [regDistrict, setRegDistrict] = useState('Balrampur');
  const [regOtpDigits, setRegOtpDigits] = useState(['', '', '', '', '', '']);
  const [regResendCountdown, setRegResendCountdown] = useState(0);
  const [regSandboxCodeHint, setRegSandboxCodeHint] = useState('');

  // Carrier Gateway & Delivery States
  const [carrierConfigured, setCarrierConfigured] = useState(false);
  const [showSmsConfig, setShowSmsConfig] = useState(false);
  const [fast2smsKeyInput, setFast2smsKeyInput] = useState('');
  const [twilioSidInput, setTwilioSidInput] = useState('');
  const [twilioTokenInput, setTwilioTokenInput] = useState('');
  const [twilioVerifyInput, setTwilioVerifyInput] = useState('');
  const [gatewayConfigSaving, setGatewayConfigSaving] = useState(false);

  // Email Gateway & Delivery States
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [gmailUserInput, setGmailUserInput] = useState('');
  const [gmailAppPasswordInput, setGmailAppPasswordInput] = useState('');
  const [resendApiKeyInput, setResendApiKeyInput] = useState('');
  const [emailConfigSaving, setEmailConfigSaving] = useState(false);

  // Probe live carrier & email gateway status
  useEffect(() => {
    api.getGatewaysStatus?.().then(res => {
      if (res && res.success) {
        if (res.sms?.isConfigured) setCarrierConfigured(true);
        if (res.email?.isConfigured) setEmailConfigured(true);
      }
    }).catch(() => {});
  }, []);

  const regOtpInputRefs = useRef([]);
  const regCountdownTimerRef = useRef(null);

  // Watch Demo Modal
  const [watchDemoOpen, setWatchDemoOpen] = useState(false);

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

  // Dismiss language popovers on outside click
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (headerLangRef.current && !headerLangRef.current.contains(e.target)) {
        setHeaderLangOpen(false);
      }
      if (footerLangRef.current && !footerLangRef.current.contains(e.target)) {
        setFooterLangOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
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

  // Auth: Dynamic Carrier SMS Gateway Configuration
  const handleSaveSmsGateway = async (e) => {
    e?.preventDefault();
    setGatewayConfigSaving(true);
    setAuthError('');
    try {
      const res = await api.configureSMSGateway({
        fast2smsApiKey: fast2smsKeyInput.trim(),
        twilioAccountSid: twilioSidInput.trim(),
        twilioAuthToken: twilioTokenInput.trim(),
        twilioVerifySid: twilioVerifyInput.trim()
      });
      if (res && res.success) {
        setCarrierConfigured(true);
        setAuthSuccessMsg(
          language === 'hi' 
            ? 'एसएमएस गेटवे सक्रिय! कृपया पुनः ओटीपी भेजें।' 
            : 'SMS Gateway activated! Please request a new OTP to receive via cellular SMS.'
        );
        setShowSmsConfig(false);
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to configure gateway');
    } finally {
      setGatewayConfigSaving(false);
    }
  };

  // Auth: Dynamic Gmail / Email Gateway Configuration
  const handleSaveEmailGateway = async (e) => {
    e?.preventDefault();
    setEmailConfigSaving(true);
    setAuthError('');
    try {
      const res = await api.configureEmailGateway({
        gmailUser: gmailUserInput.trim(),
        gmailAppPassword: gmailAppPasswordInput.trim(),
        resendApiKey: resendApiKeyInput.trim()
      });
      if (res && res.success) {
        setEmailConfigured(true);
        setAuthSuccessMsg(
          language === 'hi' 
            ? 'जीमेल गेटवे सक्रिय! कृपया पुनः सत्यापन कोड भेजें।' 
            : 'Gmail Gateway activated! Please request a new OTP to receive in your inbox.'
        );
        setShowEmailConfig(false);
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to configure email gateway');
    } finally {
      setEmailConfigSaving(false);
    }
  };

  // Auth: Send Real SMS or Gmail OTP for Login
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');
    setSandboxCodeHint('');
    try {
      if (authChannel === 'email') {
        const cleanEmail = loginEmail.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
          throw new Error(language === 'hi' ? 'कृपया मान्य ईमेल / जीमेल आईडी दर्ज करें' : 'Please enter a valid Gmail / email address');
        }
        const res = await api.sendEmailOTP(cleanEmail, 'login');
        if (res && res.success) {
          setLoginStep('otp');
          setOtpDigits(['', '', '', '', '', '']);
          setEmailConfigured(Boolean(res.emailDelivered));
          if (res.sandboxCode) {
            setSandboxCodeHint(res.sandboxCode);
          }
          if (res.emailDelivered) {
            setAuthSuccessMsg(
              language === 'hi' 
                ? `सत्यापन कोड ${cleanEmail} के इनबॉक्स में भेज दिया गया है` 
                : `Verification code sent to ${cleanEmail} inbox via Gmail`
            );
          } else {
            setAuthSuccessMsg(
              language === 'hi'
                ? `सत्यापन कोड तैयार किया गया (${cleanEmail})`
                : `Verification code ready for ${cleanEmail}`
            );
          }
          startResendTimer();
          setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
        } else {
          throw new Error(res?.error || 'Failed to send verification code');
        }
      } else {
        const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
        if (!cleanPhone || cleanPhone.length < 10) {
          throw new Error(language === 'hi' ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
        }
        const res = await api.sendLoginOTP(cleanPhone);
        if (res && res.success) {
          setLoginStep('otp');
          setOtpDigits(['', '', '', '', '', '']);
          setCarrierConfigured(Boolean(res.carrierConfigured));
          if (res.sandboxCode) {
            setSandboxCodeHint(res.sandboxCode);
          }
          if (res.carrierConfigured) {
            setAuthSuccessMsg(
              language === 'hi' 
                ? `ओटीपी सफलतापूर्वक +91 ${cleanPhone} पर भेजा गया` 
                : `OTP sent successfully to +91 ${cleanPhone} via SMS`
            );
          } else {
            setAuthSuccessMsg(
              language === 'hi'
                ? `सत्यापन कोड तैयार किया गया (+91 ${cleanPhone})`
                : `Verification code ready for +91 ${cleanPhone}`
            );
          }
          startResendTimer();
          setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
        } else {
          throw new Error(res?.error || 'Failed to send OTP');
        }
      }
    } catch (err) {
      setAuthError(err.message || (language === 'hi' ? 'ओटीपी भेजने में असमर्थ। कृपया पुनः प्रयास करें।' : 'Failed to send verification code. Please try again.'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Resend SMS or Gmail OTP for Login
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || authLoading) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      if (authChannel === 'email') {
        const cleanEmail = loginEmail.trim().toLowerCase();
        const res = await api.sendEmailOTP(cleanEmail, 'login');
        if (res && res.success) {
          setOtpDigits(['', '', '', '', '', '']);
          setEmailConfigured(Boolean(res.emailDelivered));
          if (res.emailDelivered) {
            setAuthSuccessMsg(language === 'hi' ? 'नया सत्यापन कोड जीमेल इनबॉक्स में भेजा गया' : 'New code sent to your Gmail inbox');
          } else {
            setAuthSuccessMsg(language === 'hi' ? 'नया सत्यापन कोड तैयार किया गया' : 'New verification code ready');
          }
          if (res.sandboxCode) setSandboxCodeHint(res.sandboxCode);
          startResendTimer();
        } else {
          throw new Error(res?.error || 'Failed to resend code');
        }
      } else {
        const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
        const res = await api.sendLoginOTP(cleanPhone);
        if (res && res.success) {
          setOtpDigits(['', '', '', '', '', '']);
          setAuthSuccessMsg(language === 'hi' ? 'नया ओटीपी भेज दिया गया है' : 'New OTP sent successfully');
          if (res.sandboxCode) setSandboxCodeHint(res.sandboxCode);
          startResendTimer();
        } else {
          throw new Error(res?.error || 'Failed to resend OTP');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to resend verification code');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Verify SMS or Gmail OTP
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
      let res;
      if (authChannel === 'email') {
        const cleanEmail = loginEmail.trim().toLowerCase();
        res = await api.verifyEmailOTP(cleanEmail, enteredOtp);
      } else {
        const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
        res = await api.verifyLoginOTP(cleanPhone, enteredOtp);
      }

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
      setAuthError(err.message || (language === 'hi' ? 'गलत ओटीपी। कृपया पुनः प्रयास करें।' : 'Incorrect OTP code. Please try again.'));
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

  // Auth: Send Real SMS or Gmail OTP for Registration
  const handleRegisterSendOtp = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');
    setRegSandboxCodeHint('');
    try {
      if (!regShopName.trim()) {
        throw new Error(language === 'hi' ? 'दुकान का नाम आवश्यक है' : 'Shop name is required');
      }

      const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);
      const cleanEmail = regEmail.trim().toLowerCase();

      if (authChannel === 'email') {
        if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
          throw new Error(language === 'hi' ? 'कृपया मान्य ईमेल / जीमेल आईडी दर्ज करें' : 'Please enter a valid Gmail / email address');
        }
        const res = await api.sendEmailOTP(cleanEmail, 'register');
        if (res && res.success) {
          setRegStep('otp');
          setRegOtpDigits(['', '', '', '', '', '']);
          setEmailConfigured(Boolean(res.emailDelivered));
          if (res.sandboxCode) {
            setRegSandboxCodeHint(res.sandboxCode);
          }
          if (res.emailDelivered) {
            setAuthSuccessMsg(
              language === 'hi'
                ? `सत्यापन कोड ${cleanEmail} के इनबॉक्स में भेज दिया गया है`
                : `Verification code sent to ${cleanEmail} inbox via Gmail`
            );
          } else {
            setAuthSuccessMsg(
              language === 'hi'
                ? `सत्यापन कोड तैयार किया गया (${cleanEmail})`
                : `Verification code ready for ${cleanEmail}`
            );
          }
          startRegResendTimer();
          setTimeout(() => {
            regOtpInputRefs.current[0]?.focus();
          }, 150);
        } else {
          throw new Error(res?.error || 'Failed to send OTP to email');
        }
      } else {
        if (!cleanPhone || cleanPhone.length < 10) {
          throw new Error(language === 'hi' ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
        }
        const res = await api.sendRegisterOTP(cleanPhone);
        if (res && res.success) {
          setRegStep('otp');
          setRegOtpDigits(['', '', '', '', '', '']);
          setCarrierConfigured(Boolean(res.carrierConfigured));
          if (res.sandboxCode) {
            setRegSandboxCodeHint(res.sandboxCode);
          }
          if (res.carrierConfigured) {
            setAuthSuccessMsg(
              language === 'hi'
                ? `ओटीपी सफलतापूर्वक +91 ${cleanPhone} पर एसएमएस द्वारा भेज दिया गया है`
                : `OTP sent successfully to +91 ${cleanPhone} via cellular SMS`
            );
          } else {
            setAuthSuccessMsg(
              language === 'hi'
                ? `सत्यापन कोड तैयार किया गया (+91 ${cleanPhone})`
                : `Verification code ready for +91 ${cleanPhone}`
            );
          }
          startRegResendTimer();
          setTimeout(() => {
            regOtpInputRefs.current[0]?.focus();
          }, 150);
        } else {
          throw new Error(res?.error || 'Failed to send OTP');
        }
      }
    } catch (err) {
      setAuthError(err.message || (language === 'hi' ? 'ओटीपी भेजने में असमर्थ। कृपया पुनः प्रयास करें।' : 'Failed to send OTP. Please try again.'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Resend SMS or Gmail OTP for Registration
  const handleRegisterResendOtp = async () => {
    if (regResendCountdown > 0 || authLoading) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      if (authChannel === 'email') {
        const cleanEmail = regEmail.trim().toLowerCase();
        const res = await api.sendEmailOTP(cleanEmail, 'register');
        if (res && res.success) {
          setRegOtpDigits(['', '', '', '', '', '']);
          setEmailConfigured(Boolean(res.emailDelivered));
          if (res.emailDelivered) {
            setAuthSuccessMsg(language === 'hi' ? 'नया सत्यापन कोड जीमेल इनबॉक्स में भेजा गया' : 'New code sent to your Gmail inbox');
          } else {
            setAuthSuccessMsg(language === 'hi' ? 'नया सत्यापन कोड तैयार किया गया' : 'New verification code ready');
          }
          if (res.sandboxCode) setRegSandboxCodeHint(res.sandboxCode);
          startRegResendTimer();
          setTimeout(() => {
            regOtpInputRefs.current[0]?.focus();
          }, 100);
        } else {
          throw new Error(res?.error || 'Failed to resend code');
        }
      } else {
        const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);
        const res = await api.sendRegisterOTP(cleanPhone);
        if (res && res.success) {
          setRegOtpDigits(['', '', '', '', '', '']);
          setAuthSuccessMsg(language === 'hi' ? 'नया ओटीपी भेज दिया गया है' : 'New OTP sent successfully');
          if (res.sandboxCode) setRegSandboxCodeHint(res.sandboxCode);
          startRegResendTimer();
          setTimeout(() => {
            regOtpInputRefs.current[0]?.focus();
          }, 100);
        } else {
          throw new Error(res?.error || 'Failed to resend OTP');
        }
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
      const cleanPhone = regPhone ? regPhone.replace(/\D/g, '').slice(-10) : '';
      const cleanEmail = regEmail ? regEmail.trim().toLowerCase() : '';

      const res = await api.registerShop({
        name: regShopName.trim(),
        owner_name: regOwnerName.trim() || regShopName.trim(),
        phone: cleanPhone || (cleanEmail ? cleanEmail.split('@')[0].replace(/\D/g, '').slice(-10) : '9876543210'),
        email: cleanEmail,
        verificationMethod: authChannel,
        password: regPassword || '1234',
        trade_type: regTradeType || 'kirana',
        trade_name: regTradeType || 'Kirana & General Store',
        state: regState,
        district: regDistrict || 'Balrampur',
        village: regVillage || 'Utraula Dehat',
        vintage_years: 1,
        bank_account_type: 'State Bank of India',
        otp: enteredOtp
      });
      if (res && res.shop) {
        if (res.token) {
          safeStorage.setItem('vyapaar_auth_token', res.token);
        }
        try {
          const currentSaved = safeStorage.getJSON('vyapaar_saved_shops', []);
          const updated = [res.shop, ...currentSaved.filter(s => s.id !== res.shop.id)].slice(0, 5);
          safeStorage.setJSON('vyapaar_saved_shops', updated);
          setSavedShops(updated);
        } catch (_) {}

        setAuthModalOpen(false);
        onComplete?.(res.shop, res.token);
      } else {
        throw new Error(res?.error || 'Registration failed');
      }
    } catch (err) {
      setAuthError(err.message || (language === 'hi' ? 'गलत ओटीपी। कृपया कोड जांचें और पुनः प्रयास करें।' : 'Incorrect OTP or registration failed. Please try again.'));
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

          {/* Right: Language Selector + Shopkeeper Login Pill Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Header 12-Language Selector */}
            <div className="relative" ref={headerLangRef}>
              <button
                type="button"
                onClick={() => setHeaderLangOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#EAE3D2]/80 hover:bg-[#DFD6C2] text-xs font-bold text-[#1C1917] transition cursor-pointer border border-[#D5CCBC]"
                title="Select Language / भाषा चुनें"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#0F3E2E]" />
                <span className="hidden sm:inline font-sans">{currentLanguageInfo?.nativeName || 'English'}</span>
                <ChevronDown className={`w-3 h-3 text-[#78716C] transition-transform duration-200 ${headerLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {headerLangOpen && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-[#FAF7F2] border border-[#D5CCBC] rounded-2xl p-2.5 shadow-2xl z-50 space-y-1.5 animate-in fade-in zoom-in-[0.98] duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E7DFD5]">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#0F3E2E]" />
                      <span className="font-serif font-bold text-xs text-[#1C1917]">Select Language</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#0F3E2E] bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
                      12 Languages
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 max-h-56 overflow-y-auto pr-0.5">
                    {supportedLanguages?.map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code);
                            setHeaderLangOpen(false);
                          }}
                          className={`flex items-center justify-between p-1.5 px-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0F3E2E] text-white font-bold shadow-xs'
                              : 'bg-white/80 hover:bg-[#EAE3D2] text-[#1C1917] border border-[#E7DFD5]/70'
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs truncate font-semibold">{lang.nativeName}</span>
                            <span className={`text-[9px] truncate ${isSelected ? 'text-emerald-200' : 'text-stone-500'}`}>
                              {lang.name}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

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

              {/* Refined 12-Language Selector */}
              <div className="relative select-none" ref={footerLangRef}>
                <button
                  type="button"
                  onClick={() => setFooterLangOpen(prev => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAE3D2]/70 hover:bg-[#DFD6C2] text-xs font-bold text-[#1C1917] transition-colors cursor-pointer border border-[#D5CCBC]"
                  title="Select Language / भाषा चुनें"
                  aria-label="Select Language"
                >
                  <Globe className="w-3.5 h-3.5 text-[#0F3E2E]" />
                  <span>{currentLanguageInfo?.nativeName || 'English'}</span>
                  <ChevronDown className={`w-3 h-3 text-[#78716C] transition-transform ${footerLangOpen ? 'rotate-180' : ''}`} />
                </button>

                {footerLangOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-[#FAF7F2] border border-[#D5CCBC] rounded-2xl p-2.5 shadow-2xl z-50 space-y-1.5 animate-in fade-in zoom-in-[0.98] duration-150">
                    <div className="flex items-center justify-between pb-1 border-b border-[#E7DFD5]">
                      <span className="font-serif font-bold text-xs text-[#1C1917]">Select Language</span>
                      <span className="text-[10px] font-bold text-[#0F3E2E] bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        12 Languages
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 max-h-56 overflow-y-auto pr-0.5">
                      {supportedLanguages?.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              setLanguage(lang.code);
                              setFooterLangOpen(false);
                            }}
                            className={`flex items-center justify-between p-1.5 px-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0F3E2E] text-white font-bold'
                                : 'bg-white/80 hover:bg-[#EAE3D2] text-[#1C1917]'
                            }`}
                          >
                            <span className="text-xs truncate font-semibold">{lang.nativeName}</span>
                            {isSelected && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                    {authMode === 'login' 
                      ? (loginStep === 'otp'
                          ? (language === 'hi' ? 'सत्यापन कोड दर्ज करें' : 'Verify Code')
                          : (language === 'hi' ? 'दुकानदार लॉगिन' : 'Welcome back'))
                      : (regStep === 'otp'
                          ? (language === 'hi' ? 'सत्यापन कोड दर्ज करें' : 'Verify Enterprise')
                          : (language === 'hi' ? 'नया उद्यम पंजीकरण' : 'Register New Enterprise'))}
                  </span>
                </div>
                <p className="text-xs text-[#57534E]">
                  {authMode === 'login' 
                    ? (loginStep === 'otp'
                        ? (authChannel === 'email'
                            ? `${language === 'hi' ? 'कोड भेजा गया:' : 'Code sent to:'} ${loginEmail}`
                            : `${language === 'hi' ? 'ओटीपी भेजा गया:' : 'OTP sent to:'} +91 ${loginPhone}`)
                        : (authChannel === 'email'
                            ? (language === 'hi' ? 'अपने पंजीकृत जीमेल पते से लॉगिन करें' : 'Enter your registered Gmail / Email for OTP login')
                            : (language === 'hi' ? 'सुरक्षित एसएमएस ओटीपी के साथ प्रवेश करें' : 'Enter your registered mobile number for SMS OTP login')))
                    : (regStep === 'otp'
                        ? (authChannel === 'email'
                            ? `${language === 'hi' ? 'कोड भेजा गया:' : 'Code sent to:'} ${regEmail}`
                            : `${language === 'hi' ? 'ओटीपी भेजा गया:' : 'OTP sent to:'} +91 ${regPhone}`)
                        : (language === 'hi' ? 'अपने व्यापार के लिए डिजिटल बही-खाता बनाएं' : 'Access your validated ledger & credit files'))}
                </p>
              </div>

              {/* Mode Toggle Pills (Sign In / Register) */}
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

              {/* Channel Selector Pills (Mobile SMS vs Gmail) */}
              {(loginStep !== 'otp' && regStep !== 'otp') && (
                <div className="flex p-0.5 bg-[#F4EFE6] border border-[#D5CCBC] rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setAuthChannel('phone'); setAuthError(''); }}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      authChannel === 'phone' ? 'bg-[#0F3E2E] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'मोबाइल नंबर (SMS)' : 'Mobile Phone (SMS)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthChannel('email'); setAuthError(''); }}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      authChannel === 'email' ? 'bg-[#0F3E2E] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'जीमेल / ईमेल (Gmail)' : 'Gmail / Email'}</span>
                  </button>
                </div>
              )}

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
                  /* STATE 1: LOGIN ENTRY */
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    {/* Saved accounts if any */}
                    {savedShops.length > 0 && authChannel === 'phone' && (
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

                    {authChannel === 'email' ? (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#1C1917]">
                          {language === 'hi' ? 'जीमेल / ईमेल पता' : 'Gmail / Email Address'}
                        </label>
                        <div className="flex rounded-xl border border-[#D5CCBC] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F3E2E]/20 focus-within:border-[#0F3E2E] transition">
                          <span className="bg-[#EAE3D2]/70 text-[#1C1917] font-bold text-xs px-3.5 py-2.5 flex items-center border-r border-[#D5CCBC] select-none">
                            <Mail className="w-4 h-4 text-[#0F3E2E]" />
                          </span>
                          <input
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => {
                              setLoginEmail(e.target.value);
                              setAuthError('');
                            }}
                            placeholder="yourname@gmail.com"
                            className="w-full px-3.5 py-2.5 bg-transparent text-xs font-semibold text-[#1C1917] focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
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
                    )}

                    <button
                      type="submit"
                      disabled={authLoading || (authChannel === 'email' ? !loginEmail.includes('@') : loginPhone.length < 10)}
                      className="w-full py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (authChannel === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />)}
                      <span>
                        {authLoading 
                          ? (language === 'hi' ? 'कोड भेजा जा रहा है...' : 'Sending Code...') 
                          : (authChannel === 'email' 
                              ? (language === 'hi' ? 'जीमेल पर ओटीपी भेजें' : 'Send Gmail OTP') 
                              : (language === 'hi' ? 'ओटीपी भेजें' : 'Send OTP'))}
                      </span>
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
                        {authChannel === 'email'
                          ? (language === 'hi' ? `जीमेल (${loginEmail}) पर प्राप्त 6-अंकों का कोड दर्ज करें` : `Enter the 6-digit code received on ${loginEmail}`)
                          : (language === 'hi' ? `+91 ${loginPhone} पर प्राप्त 6-अंकों का ओटीपी दर्ज करें` : `Enter the 6-digit code sent to +91 ${loginPhone}`)}
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

                      {authChannel === 'phone' && (
                        <div className="space-y-2 pt-2 text-left">
                          {/* WhatsApp Instant Delivery Card */}
                          {sandboxCodeHint && (
                            <a
                              href={`https://wa.me/91${loginPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                                `Your Vyapaar Setu / SaakhSetu verification code is: ${sandboxCodeHint}. Valid for 10 minutes. Do not share this code with anyone.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                            >
                              <span className="text-sm">📲</span>
                              <span>
                                {language === 'hi'
                                  ? `व्हाट्सएप पर कोड प्राप्त करें (+91 ${loginPhone.slice(-10)})`
                                  : `Receive Code on WhatsApp (+91 ${loginPhone.slice(-10)})`}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          )}

                          {/* 1-Click Fill Code */}
                          {sandboxCodeHint && (
                            <button
                              type="button"
                              onClick={() => {
                                const digits = sandboxCodeHint.split('').slice(0, 6);
                                setOtpDigits(digits);
                              }}
                              className="w-full py-2 px-3 bg-[#0F3E2E]/10 hover:bg-[#0F3E2E]/15 text-[#0F3E2E] border border-[#0F3E2E]/25 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                {language === 'hi' ? 'सीधे कोड भरें:' : 'Click to Auto-Fill Code:'} <strong className="font-mono text-sm tracking-widest">{sandboxCodeHint}</strong>
                              </span>
                            </button>
                          )}

                          {/* Carrier Notice if unconfigured */}
                          {!carrierConfigured && (
                            <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{language === 'hi' ? 'फोन पर एसएमएस क्यों नहीं आया?' : 'Why is SMS not reaching the phone?'}</span>
                              </div>
                              <p className="text-[10.5px] text-amber-800/90 leading-relaxed">
                                {language === 'hi'
                                  ? 'सेलुलर नेटवर्क (टावर) से सीधे फोन पर एसएमएस भेजने के लिए Twilio या Fast2SMS एपीआई की आवश्यकता होती है। आप ऊपर दिए गए व्हाट्सएप बटन से सीधे अपने फोन पर कोड पा सकते हैं, या सर्वर में ट्विलियो/Fast2SMS कुंजी जोड़ सकते हैं।'
                                  : 'Sending cellular SMS through carrier towers requires an SMS provider (Twilio or Fast2SMS API key). You can receive the code directly on your phone via WhatsApp above, or configure Twilio/Fast2SMS below.'}
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowSmsConfig(!showSmsConfig)}
                                className="text-[10px] font-bold text-[#0F3E2E] hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                              >
                                <Settings className="w-3 h-3" />
                                <span>{showSmsConfig ? (language === 'hi' ? 'सेटिंग्स छुपाएं' : 'Hide SMS Setup') : (language === 'hi' ? '⚙️ ट्विलियो / Fast2SMS एपीआई कुंजी जोड़ें' : '⚙️ Add Twilio / Fast2SMS API Key')}</span>
                              </button>

                              {showSmsConfig && (
                                <div className="pt-2 border-t border-amber-200/60 mt-1 space-y-2">
                                  <div className="text-[10px] text-stone-700 font-semibold">
                                    Enter your Twilio or Fast2SMS API key for real-time cellular SMS:
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Fast2SMS API Key"
                                    value={fast2smsKeyInput}
                                    onChange={(e) => setFast2smsKeyInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  />
                                  <div className="text-[10px] text-stone-500 text-center font-bold">OR TWILIO</div>
                                  <input
                                    type="text"
                                    placeholder="Twilio Account SID"
                                    value={twilioSidInput}
                                    onChange={(e) => setTwilioSidInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  />
                                  <input
                                    type="password"
                                    placeholder="Twilio Auth Token"
                                    value={twilioTokenInput}
                                    onChange={(e) => setTwilioTokenInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  />
                                  <button
                                    type="button"
                                    disabled={gatewayConfigSaving || (!fast2smsKeyInput && !twilioSidInput)}
                                    onClick={handleSaveSmsGateway}
                                    className="w-full py-1.5 bg-[#0F3E2E] text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                  >
                                    {gatewayConfigSaving ? 'Saving...' : 'Save & Enable Real SMS'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {authChannel === 'email' && (
                        <div className="space-y-2 pt-2 text-left">
                          {/* Direct Open Gmail Button */}
                          <a
                            href="https://mail.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                          >
                            <Mail className="w-4 h-4" />
                            <span>
                              {language === 'hi'
                                ? `जीमेल इनबॉक्स खोलें (${loginEmail})`
                                : `Open Gmail Inbox (${loginEmail})`}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                          </a>

                          {/* 1-Click Fill Code */}
                          {sandboxCodeHint && (
                            <button
                              type="button"
                              onClick={() => {
                                const digits = sandboxCodeHint.split('').slice(0, 6);
                                setOtpDigits(digits);
                              }}
                              className="w-full py-2 px-3 bg-[#0F3E2E]/10 hover:bg-[#0F3E2E]/15 text-[#0F3E2E] border border-[#0F3E2E]/25 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                {language === 'hi' ? 'सीधे कोड भरें:' : 'Click to Auto-Fill Code:'} <strong className="font-mono text-sm tracking-widest">{sandboxCodeHint}</strong>
                              </span>
                            </button>
                          )}

                          {/* Email Gateway Notice if unconfigured */}
                          {!emailConfigured && (
                            <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{language === 'hi' ? 'जीमेल में ईमेल क्यों नहीं आया?' : 'Why is email not arriving in Gmail?'}</span>
                              </div>
                              <p className="text-[10.5px] text-amber-800/90 leading-relaxed">
                                {language === 'hi'
                                  ? 'गूगल के एसएमटीपी सर्वर से सीधे जीमेल भेजने के लिए एक निःशुल्क 16-अक्षरों का Google App Password आवश्यक होता है। आप ऊपर दिए गए सीधे कोड बटन से तुरंत लॉगिन कर सकते हैं, या नीचे अपनी जीमेल कुंजी जोड़ सकते हैं।'
                                  : 'Sending real outbound emails via Google requires a free 16-character Google App Password (or Resend API key). You can auto-fill the code above to log in immediately, or configure Google App Password below.'}
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowEmailConfig(!showEmailConfig)}
                                className="text-[10px] font-bold text-[#0F3E2E] hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                              >
                                <Settings className="w-3 h-3" />
                                <span>{showEmailConfig ? (language === 'hi' ? 'सेटिंग्स छुपाएं' : 'Hide Gmail Setup') : (language === 'hi' ? '⚙️ जीमेल ऐप पासवर्ड / Resend कुंजी जोड़ें' : '⚙️ Add Google App Password / Resend Key')}</span>
                              </button>

                              {showEmailConfig && (
                                <div className="pt-2 border-t border-amber-200/60 mt-1 space-y-2">
                                  <div className="text-[10px] text-stone-700 font-semibold">
                                    Enter your Gmail &amp; 16-char App Password (generate free at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-bold text-emerald-800">google.com/apppasswords</a>):
                                  </div>
                                  <input
                                    type="email"
                                    placeholder="Your Gmail (e.g. sender@gmail.com)"
                                    value={gmailUserInput}
                                    onChange={(e) => setGmailUserInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  />
                                  <input
                                    type="password"
                                    placeholder="16-character Google App Password"
                                    value={gmailAppPasswordInput}
                                    onChange={(e) => setGmailAppPasswordInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                                  />
                                  <div className="text-[10px] text-stone-500 text-center font-bold">OR RESEND API KEY</div>
                                  <input
                                    type="text"
                                    placeholder="re_xxxxxxxxxxxx (Resend API Key)"
                                    value={resendApiKeyInput}
                                    onChange={(e) => setResendApiKeyInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                                  />
                                  <button
                                    type="button"
                                    disabled={emailConfigSaving || (!gmailAppPasswordInput && !resendApiKeyInput)}
                                    onClick={handleSaveEmailGateway}
                                    className="w-full py-1.5 bg-[#0F3E2E] text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                  >
                                    {emailConfigSaving ? 'Saving...' : 'Save & Enable Real Gmail Delivery'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
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

                      {/* Change Number/Email Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setLoginStep('phone');
                          setAuthError('');
                          setAuthSuccessMsg('');
                          setSandboxCodeHint('');
                        }}
                        className="text-[11px] font-semibold text-[#78716C] hover:text-[#1C1917] cursor-pointer flex items-center gap-1 mt-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>{authChannel === 'email' ? (language === 'hi' ? 'ईमेल बदलें' : 'Change Email') : (language === 'hi' ? 'मोबाइल नंबर बदलें' : 'Change Number')}</span>
                      </button>
                    </div>
                  </form>
                )
              ) : (
                regStep === 'details' ? (
                  /* REGISTRATION STEP 1: SHOP DETAILS */
                  <form onSubmit={handleRegisterSendOtp} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1C1917]">
                        {language === 'hi' ? 'उद्यम का नाम' : 'Enterprise Name'} <span className="text-red-500">*</span>
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

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1C1917]">
                        {language === 'hi' ? 'मालिक का नाम' : 'Proprietor Name'}
                      </label>
                      <input
                        type="text"
                        value={regOwnerName}
                        onChange={(e) => setRegOwnerName(e.target.value)}
                        placeholder="Ramesh Kumar"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]/20"
                      />
                    </div>

                    {authChannel === 'email' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#1C1917]">
                            {language === 'hi' ? 'जीमेल / ईमेल' : 'Gmail / Email'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => {
                              setRegEmail(e.target.value);
                              setAuthError('');
                            }}
                            placeholder="yourname@gmail.com"
                            className="w-full px-3 py-2 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#1C1917]">
                            {language === 'hi' ? 'मोबाइल नंबर (वैकल्पिक)' : 'Mobile (Optional)'}
                          </label>
                          <div className="flex rounded-xl border border-[#D5CCBC] bg-white overflow-hidden">
                            <span className="bg-[#EAE3D2]/70 text-[#1C1917] font-bold text-xs px-2.5 py-2 flex items-center border-r border-[#D5CCBC] select-none">
                              +91
                            </span>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              placeholder="9876543210"
                              className="w-full px-2.5 py-2 bg-transparent text-xs font-semibold text-[#1C1917] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#1C1917]">
                            {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'} <span className="text-red-500">*</span>
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
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#1C1917]">
                            {language === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)'}
                          </label>
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="yourname@gmail.com"
                            className="w-full px-3 py-2 rounded-xl border border-[#D5CCBC] bg-white text-xs font-semibold focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

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
                      disabled={authLoading || !regShopName.trim() || (authChannel === 'email' ? !regEmail.includes('@') : regPhone.length < 10)}
                      className="w-full py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#144F3B] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 mt-2 shadow-sm"
                    >
                      {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (authChannel === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />)}
                      <span>
                        {authLoading 
                          ? (language === 'hi' ? 'ओटीपी भेजा जा रहा है...' : 'Sending OTP...') 
                          : (authChannel === 'email'
                              ? (language === 'hi' ? 'जीमेल पर ओटीपी भेजें और आगे बढ़ें' : 'Send Gmail OTP & Continue')
                              : (language === 'hi' ? 'ओटीपी भेजें और आगे बढ़ें' : 'Send SMS OTP & Continue'))}
                      </span>
                    </button>
                  </form>
                ) : (
                  /* REGISTRATION STEP 2: 6-DIGIT OTP VERIFICATION */
                  <form onSubmit={handleRegisterVerifyAndSubmit} className="space-y-5">
                    <div className="space-y-2 text-center">
                      <div className="text-xs text-[#57534E]">
                        {authChannel === 'email'
                          ? (language === 'hi' ? `जीमेल (${regEmail}) पर प्राप्त 6-अंकों का सत्यापन कोड दर्ज करें` : `Enter the 6-digit code received on ${regEmail}`)
                          : (language === 'hi' ? `+91 ${regPhone} पर प्राप्त 6-अंकों का सत्यापन कोड दर्ज करें` : `Enter the 6-digit code sent to +91 ${regPhone}`)}
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

                      {authChannel === 'phone' && (
                        <div className="space-y-2 pt-2 text-left">
                          {/* WhatsApp Instant Delivery Card */}
                          {regSandboxCodeHint && (
                            <a
                              href={`https://wa.me/91${regPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                                `Your Vyapaar Setu / SaakhSetu verification code is: ${regSandboxCodeHint}. Valid for 10 minutes. Do not share this code with anyone.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                            >
                              <span className="text-sm">📲</span>
                              <span>
                                {language === 'hi'
                                  ? `व्हाट्सएप पर कोड प्राप्त करें (+91 ${regPhone.slice(-10)})`
                                  : `Receive Code on WhatsApp (+91 ${regPhone.slice(-10)})`}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          )}

                          {/* 1-Click Fill Code */}
                          {regSandboxCodeHint && (
                            <button
                              type="button"
                              onClick={() => {
                                const digits = regSandboxCodeHint.split('').slice(0, 6);
                                setRegOtpDigits(digits);
                              }}
                              className="w-full py-2 px-3 bg-[#0F3E2E]/10 hover:bg-[#0F3E2E]/15 text-[#0F3E2E] border border-[#0F3E2E]/25 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                {language === 'hi' ? 'सीधे कोड भरें:' : 'Click to Auto-Fill Code:'} <strong className="font-mono text-sm tracking-widest">{regSandboxCodeHint}</strong>
                              </span>
                            </button>
                          )}

                          {/* Carrier Notice if unconfigured */}
                          {!carrierConfigured && (
                            <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{language === 'hi' ? 'फोन पर एसएमएस क्यों नहीं आया?' : 'Why is SMS not reaching the phone?'}</span>
                              </div>
                              <p className="text-[10.5px] text-amber-800/90 leading-relaxed">
                                {language === 'hi'
                                  ? 'सेलुलर नेटवर्क (टावर) से सीधे फोन पर एसएमएस भेजने के लिए Twilio या Fast2SMS एपीआई की आवश्यकता होती है। आप ऊपर दिए गए व्हाट्सएप बटन से सीधे अपने फोन पर कोड पा सकते हैं, या सर्वर में ट्विलियो/Fast2SMS कुंजी जोड़ सकते हैं।'
                                  : 'Sending cellular SMS through carrier towers requires an SMS provider (Twilio or Fast2SMS API key). You can receive the code directly on your phone via WhatsApp above, or configure Twilio/Fast2SMS below.'}
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowSmsConfig(!showSmsConfig)}
                                className="text-[10px] font-bold text-[#0F3E2E] hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                              >
                                <Settings className="w-3 h-3" />
                                <span>{showSmsConfig ? (language === 'hi' ? 'सेटिंग्स छुपाएं' : 'Hide SMS Setup') : (language === 'hi' ? '⚙️ ट्विलियो / Fast2SMS एपीआई कुंजी जोड़ें' : '⚙️ Add Twilio / Fast2SMS API Key')}</span>
                              </button>

                              {showSmsConfig && (
                                <div className="pt-2 border-t border-amber-200/60 mt-1 space-y-2">
                                  <div className="text-[10px] text-stone-700 font-semibold">
                                    Enter your Twilio or Fast2SMS API key for real-time cellular SMS:
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Fast2SMS API Key"
                                    value={fast2smsKeyInput}
                                    onChange={(e) => setFast2smsKeyInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  />
                                  <div className="text-[10px] text-stone-500 text-center font-bold">OR TWILIO</div>
                                  <input
                                    type="text"
                                    placeholder="Twilio Account SID"
                                    value={twilioSidInput}
                                    onChange={(e) => setTwilioSidInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  />
                                  <input
                                    type="password"
                                    placeholder="Twilio Auth Token"
                                    value={twilioTokenInput}
                                    onChange={(e) => setTwilioTokenInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  />
                                  <button
                                    type="button"
                                    disabled={gatewayConfigSaving || (!fast2smsKeyInput && !twilioSidInput)}
                                    onClick={handleSaveSmsGateway}
                                    className="w-full py-1.5 bg-[#0F3E2E] text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                  >
                                    {gatewayConfigSaving ? 'Saving...' : 'Save & Enable Real SMS'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {authChannel === 'email' && (
                        <div className="space-y-2 pt-2 text-left">
                          {/* Direct Open Gmail Button */}
                          <a
                            href="https://mail.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                          >
                            <Mail className="w-4 h-4" />
                            <span>
                              {language === 'hi'
                                ? `जीमेल इनबॉक्स खोलें (${regEmail})`
                                : `Open Gmail Inbox (${regEmail})`}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                          </a>

                          {/* 1-Click Fill Code */}
                          {regSandboxCodeHint && (
                            <button
                              type="button"
                              onClick={() => {
                                const digits = regSandboxCodeHint.split('').slice(0, 6);
                                setRegOtpDigits(digits);
                              }}
                              className="w-full py-2 px-3 bg-[#0F3E2E]/10 hover:bg-[#0F3E2E]/15 text-[#0F3E2E] border border-[#0F3E2E]/25 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                {language === 'hi' ? 'सीधे कोड भरें:' : 'Click to Auto-Fill Code:'} <strong className="font-mono text-sm tracking-widest">{regSandboxCodeHint}</strong>
                              </span>
                            </button>
                          )}

                          {/* Email Gateway Notice if unconfigured */}
                          {!emailConfigured && (
                            <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{language === 'hi' ? 'जीमेल में ईमेल क्यों नहीं आया?' : 'Why is email not arriving in Gmail?'}</span>
                              </div>
                              <p className="text-[10.5px] text-amber-800/90 leading-relaxed">
                                {language === 'hi'
                                  ? 'गूगल के एसएमटीपी सर्वर से सीधे जीमेल भेजने के लिए एक निःशुल्क 16-अक्षरों का Google App Password आवश्यक होता है। आप ऊपर दिए गए सीधे कोड बटन से तुरंत पंजीकरण पूरा कर सकते हैं, या नीचे अपनी जीमेल कुंजी जोड़ सकते हैं।'
                                  : 'Sending real outbound emails via Google requires a free 16-character Google App Password (or Resend API key). You can auto-fill the code above to register immediately, or configure Google App Password below.'}
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowEmailConfig(!showEmailConfig)}
                                className="text-[10px] font-bold text-[#0F3E2E] hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                              >
                                <Settings className="w-3 h-3" />
                                <span>{showEmailConfig ? (language === 'hi' ? 'सेटिंग्स छुपाएं' : 'Hide Gmail Setup') : (language === 'hi' ? '⚙️ जीमेल ऐप पासवर्ड / Resend कुंजी जोड़ें' : '⚙️ Add Google App Password / Resend Key')}</span>
                              </button>

                              {showEmailConfig && (
                                <div className="pt-2 border-t border-amber-200/60 mt-1 space-y-2">
                                  <div className="text-[10px] text-stone-700 font-semibold">
                                    Enter your Gmail &amp; 16-char App Password (generate free at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-bold text-emerald-800">google.com/apppasswords</a>):
                                  </div>
                                  <input
                                    type="email"
                                    placeholder="Your Gmail (e.g. sender@gmail.com)"
                                    value={gmailUserInput}
                                    onChange={(e) => setGmailUserInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                                  />
                                  <input
                                    type="password"
                                    placeholder="16-character Google App Password"
                                    value={gmailAppPasswordInput}
                                    onChange={(e) => setGmailAppPasswordInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                                  />
                                  <div className="text-[10px] text-stone-500 text-center font-bold">OR RESEND API KEY</div>
                                  <input
                                    type="text"
                                    placeholder="re_xxxxxxxxxxxx (Resend API Key)"
                                    value={resendApiKeyInput}
                                    onChange={(e) => setResendApiKeyInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                                  />
                                  <button
                                    type="button"
                                    disabled={emailConfigSaving || (!gmailAppPasswordInput && !resendApiKeyInput)}
                                    onClick={handleSaveEmailGateway}
                                    className="w-full py-1.5 bg-[#0F3E2E] text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                  >
                                    {emailConfigSaving ? 'Saving...' : 'Save & Enable Real Gmail Delivery'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
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
                          setRegSandboxCodeHint('');
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
