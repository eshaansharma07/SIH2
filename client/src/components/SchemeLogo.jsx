import React from 'react';

export function SchemeLogo({ schemeId, className = "w-14 h-14" }) {
  const id = (schemeId || '').toLowerCase();

  // PM MUDRA Yojana
  if (id.includes('mudra')) {
    return (
      <div className={`flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 160 56" className="w-full h-full object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Circular red motif */}
          <circle cx="28" cy="28" r="24" fill="#E11D48" />
          <circle cx="28" cy="28" r="19" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="3 3" />
          {/* Stylized Rupee in center */}
          <text x="28" y="36" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="24">₹</text>
          {/* Typography */}
          <text x="60" y="24" fill="#E11D48" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13" letterSpacing="0.5">प्रधानमंत्री</text>
          <text x="60" y="44" fill="#E11D48" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="22" letterSpacing="1">mudra</text>
          {/* Small flag swoop */}
          <path d="M128 26C136 24 148 25 156 30" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // PM SVANidhi
  if (id.includes('svanidhi') || id.includes('street')) {
    return (
      <div className={`flex flex-col items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 100 80" className="w-full h-full object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Lotus Petals - Saffron top, Green bottom */}
          <path d="M50 8 C42 22, 42 38, 50 50 C58 38, 58 22, 50 8 Z" fill="#F97316" />
          <path d="M34 18 C26 28, 28 42, 42 50 C38 38, 36 28, 34 18 Z" fill="#EA580C" />
          <path d="M66 18 C74 28, 72 42, 58 50 C62 38, 64 28, 66 18 Z" fill="#EA580C" />
          <path d="M22 30 C16 40, 20 52, 36 54 C30 46, 26 38, 22 30 Z" fill="#16A34A" />
          <path d="M78 30 C84 40, 80 52, 64 54 C70 46, 74 38, 78 30 Z" fill="#16A34A" />
          {/* Label */}
          <text x="50" y="72" textAnchor="middle" fill="#1F2937" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="12" letterSpacing="0.5">PM SVANidhi</text>
        </svg>
      </div>
    );
  }

  // Stand Up India
  if (id.includes('stand') || id.includes('standup')) {
    return (
      <div className={`flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 150 50" className="w-full h-full object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stand Up India Typography */}
          <text x="8" y="24" fill="#0284C7" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="14">standup</text>
          <text x="8" y="44" fill="#0369A1" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="22">india</text>
          {/* Tricolor wings / bird mark */}
          <path d="M96 28 C98 16, 114 10, 130 12 C120 18, 112 24, 106 32 Z" fill="#F97316" />
          <path d="M92 34 C98 26, 112 24, 126 28 C116 32, 108 36, 100 42 Z" fill="#0284C7" />
          <path d="M88 40 C94 36, 106 38, 118 42 C108 44, 100 45, 94 48 Z" fill="#16A34A" />
        </svg>
      </div>
    );
  }

  // PM Vishwakarma
  if (id.includes('vishwakarma') || id.includes('artisan')) {
    return (
      <div className={`flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 150 50" className="w-full h-full object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="26" cy="25" r="18" fill="#F97316" />
          <circle cx="26" cy="25" r="14" fill="#FFFFFF" />
          <path d="M22 18 L30 18 L28 26 L24 26 Z" fill="#EA580C" />
          <rect x="25" y="26" width="2" height="10" fill="#EA580C" />
          <text x="54" y="22" fill="#C2410C" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="11">PM VISHWAKARMA</text>
          <text x="54" y="38" fill="#1F2937" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15">विश्वकर्मा योजना</text>
        </svg>
      </div>
    );
  }

  // PMEGP / KVIC
  if (id.includes('pmegp') || id.includes('kvic')) {
    return (
      <div className={`flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 140 50" className="w-full h-full object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="25" r="18" stroke="#15803D" strokeWidth="2.5" />
          <circle cx="24" cy="25" r="6" fill="#15803D" />
          <line x1="24" y1="7" x2="24" y2="43" stroke="#15803D" strokeWidth="1.5" />
          <line x1="6" y1="25" x2="42" y2="25" stroke="#15803D" strokeWidth="1.5" />
          <text x="50" y="24" fill="#15803D" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18">PMEGP</text>
          <text x="50" y="38" fill="#4B5563" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="10">KVIC Govt. of India</text>
        </svg>
      </div>
    );
  }

  // Generic Official India Flagship Emblem Fallback
  return (
    <div className={`flex items-center justify-center shrink-0 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center p-1 text-center">
        <span className="text-amber-800 font-serif font-black text-sm">GOI</span>
        <div className="w-6 h-1 mt-0.5 rounded-full bg-gradient-to-r from-orange-500 via-white to-green-600 border border-stone-200" />
      </div>
    </div>
  );
}
