import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Check, 
  Copy, 
  Store, 
  ShieldCheck, 
  Smartphone, 
  ArrowUpRight
} from 'lucide-react';
import { api } from '../utils/api';

export function PublicPayPage() {
  const [copied, setCopied] = useState(false);
  const [shopData, setShopData] = useState(null);

  // Parse path & search params
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

  // Extract shopId from /pay/:shopId or query
  const pathParts = pathname.split('/').filter(Boolean);
  const shopIdFromPath = pathParts[0] === 'pay' && pathParts[1] ? pathParts[1] : '';
  const shopId = shopIdFromPath || searchParams.get('shopId') || 'ramesh-kirana';

  const amount = searchParams.get('amt') || searchParams.get('amount') || '';
  const customerName = searchParams.get('customer') || searchParams.get('name') || '';
  const shopNameParam = searchParams.get('shopName') || '';
  const upiIdParam = searchParams.get('upi') || '';

  useEffect(() => {
    if (!shopId) return;
    api.getShopCurrent(shopId)
      .then(res => {
        if (res?.shop) setShopData(res.shop);
      })
      .catch(() => {});
  }, [shopId]);

  const effectiveShopName = shopNameParam || shopData?.name || "Ramesh's Kirana Store";
  const effectiveUpi = upiIdParam || (shopData?.phone ? `${shopData.phone.replace(/\D/g, '').slice(-10)}@upi` : '9839124789@upi');
  const numAmount = Number(amount) || 0;

  const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(effectiveUpi)}&pn=${encodeURIComponent(effectiveShopName)}${numAmount > 0 ? `&am=${numAmount}` : ''}&cu=INR&tn=${encodeURIComponent('Khata Settle ' + (customerName || effectiveShopName))}`;

  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(effectiveUpi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between py-6 px-4 font-sans text-stone-900">
      {/* Top Header */}
      <header className="max-w-md mx-auto w-full text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Merchant Payment Portal • व्यापार सेतु</span>
        </div>
      </header>

      {/* Main Payment Card */}
      <main className="max-w-md mx-auto w-full my-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-300 shadow-elevation-2 space-y-6 text-center">
          
          {/* Shop Header */}
          <div className="space-y-1.5 border-b border-stone-200 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 text-stone-900 flex items-center justify-center mx-auto shadow-apple-card">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
              {effectiveShopName}
            </h1>
            {customerName && (
              <p className="text-xs font-semibold text-stone-500">
                खाता बकाया निपटान • <strong className="text-stone-800">{customerName}</strong>
              </p>
            )}
          </div>

          {/* Amount Display */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              भुगतान राशि (Amount to Pay)
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-800 tabular-nums font-display">
              {numAmount > 0 ? `₹${numAmount.toLocaleString('en-IN')}` : 'Any Amount'}
            </div>
          </div>

          {/* Scannable High-Contrast UPI QR Code */}
          <div className="space-y-3">
            <div className="p-4 bg-white rounded-2xl border-2 border-stone-900 inline-block shadow-sm">
              <QRCodeSVG
                value={upiPaymentUri}
                size={220}
                level="M"
                includeMargin={false}
                imageSettings={{
                  src: "/diya.svg",
                  x: undefined,
                  y: undefined,
                  height: 34,
                  width: 34,
                  excavate: true,
                }}
              />
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              किसी भी UPI ऐप (GPay, PhonePe, Paytm, BHIM) से QR कोड स्कैन करें
            </p>
          </div>

          {/* Direct One-Tap Pay Link for Mobile Users */}
          <div className="space-y-2 pt-2">
            <a
              href={upiPaymentUri}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Smartphone className="w-4 h-4" />
              <span>UPI ऐप से सीधे भुगतान करें (Tap to Pay)</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            {/* Copy UPI ID */}
            <button
              type="button"
              onClick={handleCopyUpi}
              className="w-full py-2.5 px-3 rounded-xl bg-[#FAF8F5] hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-stone-300/80"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copied ? 'UPI ID कॉपी हो गया!' : `UPI ID: ${effectiveUpi}`}</span>
            </button>
          </div>

          {/* Security & Authenticity Note */}
          <div className="pt-2 border-t border-stone-200 text-[10px] text-stone-400 space-y-0.5">
            <p>100% सुरक्षित एवं प्रत्यक्ष बैंक खाता अंतरण (Direct-to-Merchant Settlement)</p>
            <p className="font-semibold">Powered by Vyapaar Setu • ग्रामीण डिजिटल बही-खाता</p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full text-center text-[10px] text-stone-400">
        व्यापार सेतु (Vyapaar Setu) • ग्रामीण डिजिटल बही-खाता एवं साख मंच
      </footer>
    </div>
  );
}
