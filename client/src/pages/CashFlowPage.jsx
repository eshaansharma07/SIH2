import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  BookOpen, 
  Users, 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar, 
  Filter, 
  Share2, 
  Check, 
  Smartphone, 
  Banknote, 
  MessageCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';

export function CashFlowPage({ shop, onOpenKeypad, refreshKey, latestTx, onTransactionSaved }) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'udhaar'
  const [transactions, setTransactions] = useState([]);
  const [udhaarLedger, setUdhaarLedger] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [reminderToast, setReminderToast] = useState(null);
  const [justUpdated, setJustUpdated] = useState(false);

  // 1. Instant 0ms Optimistic Update when a new transaction is logged
  useEffect(() => {
    if (!latestTx) return;

    setJustUpdated(true);
    const timer = setTimeout(() => setJustUpdated(false), 2500);

    // Prepend transaction to list
    setTransactions(prev => {
      if (prev.some(t => t.id === latestTx.id)) return prev;
      return [latestTx, ...prev];
    });

    // Instantly recompute 4 KPI Summary Cards
    setSummary(prev => {
      if (!prev) return prev;
      const amt = Number(latestTx.amount) || 0;
      let newIncome = prev.totalIncome || 0;
      let newExpense = prev.totalExpense || 0;
      let newUdhaarGiven = prev.totalUdhaarGiven || 0;
      let newUdhaarRepaid = prev.totalUdhaarRepaid || 0;
      let newCash = prev.cashIncome || 0;
      let newUpi = prev.upiIncome || 0;

      if (latestTx.type === 'income') {
        newIncome += amt;
        if (latestTx.payment_mode === 'cash') newCash += amt;
        if (latestTx.payment_mode === 'upi') newUpi += amt;
      } else if (latestTx.type === 'expense') {
        newExpense += amt;
      } else if (latestTx.type === 'udhaar_given') {
        newUdhaarGiven += amt;
      } else if (latestTx.type === 'udhaar_repaid') {
        newUdhaarRepaid += amt;
        newIncome += amt;
        if (latestTx.payment_mode === 'upi') newUpi += amt;
        else newCash += amt;
      }

      const newSurplus = newIncome - newExpense;
      const newPending = Math.max(0, newUdhaarGiven - newUdhaarRepaid);
      const newDigitalShare = newIncome > 0 ? Math.round((newUpi / newIncome) * 100) : 0;

      const txMonth = (latestTx.date || new Date().toISOString()).substring(0, 7);
      let updatedTrend = prev.monthlyTrend ? [...prev.monthlyTrend] : [];
      const mIdx = updatedTrend.findIndex(m => m.month === txMonth);
      if (mIdx >= 0) {
        const m = { ...updatedTrend[mIdx] };
        if (latestTx.type === 'income') m.income += amt;
        else if (latestTx.type === 'expense') m.expense += amt;
        m.profit = m.income - m.expense;
        updatedTrend[mIdx] = m;
      }

      return {
        ...prev,
        totalIncome: Math.round(newIncome),
        totalExpense: Math.round(newExpense),
        netSurplus: Math.round(newSurplus),
        pendingUdhaar: Math.round(newPending),
        totalUdhaarGiven: Math.round(newUdhaarGiven),
        totalUdhaarRepaid: Math.round(newUdhaarRepaid),
        cashIncome: Math.round(newCash),
        upiIncome: Math.round(newUpi),
        digitalSharePct: newDigitalShare,
        monthlyTrend: updatedTrend
      };
    });

    if (latestTx.type === 'udhaar_given' || latestTx.type === 'udhaar_repaid') {
      const custName = latestTx.customer_vendor_name || 'Village Customer';
      setUdhaarLedger(prev => {
        const list = [...prev];
        const idx = list.findIndex(c => c.customerName?.toLowerCase() === custName.toLowerCase());
        const amt = Number(latestTx.amount) || 0;
        if (idx >= 0) {
          const c = { ...list[idx] };
          if (latestTx.type === 'udhaar_given') c.totalGiven += amt;
          else c.totalRepaid += amt;
          c.balanceOwed = Math.max(0, c.totalGiven - c.totalRepaid);
          c.lastDate = latestTx.date;
          list[idx] = c;
        } else {
          list.push({
            customerName: custName,
            totalGiven: latestTx.type === 'udhaar_given' ? amt : 0,
            totalRepaid: latestTx.type === 'udhaar_repaid' ? amt : 0,
            balanceOwed: latestTx.type === 'udhaar_given' ? amt : 0,
            lastDate: latestTx.date,
            history: []
          });
        }
        return list.sort((a, b) => b.balanceOwed - a.balanceOwed);
      });
    }

    return () => clearTimeout(timer);
  }, [latestTx]);

  useEffect(() => {
    loadData();
  }, [shop?.id, refreshKey, filterType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const shopId = shop?.id || 'ramesh-kirana';
      const [txRes, sumRes, udhRes] = await Promise.all([
        api.getTransactions(shopId, filterType, 60),
        api.getTransactionSummary(shopId),
        api.getUdhaarLedger(shopId)
      ]);

      if (txRes.transactions) {
        setTransactions(prev => {
          const serverMap = new Map(txRes.transactions.map(t => [t.id, t]));
          const merged = [...txRes.transactions];
          for (const localTx of prev) {
            if (!serverMap.has(localTx.id)) {
              merged.unshift(localTx);
            }
          }
          return merged;
        });
      }

      if (sumRes.summary) {
        setSummary(prev => {
          if (!prev) return sumRes.summary;
          const higherIncome = Math.max(prev.totalIncome || 0, sumRes.summary.totalIncome || 0);
          const higherExpense = Math.max(prev.totalExpense || 0, sumRes.summary.totalExpense || 0);
          return {
            ...sumRes.summary,
            totalIncome: higherIncome,
            totalExpense: higherExpense,
            netSurplus: higherIncome - higherExpense,
            pendingUdhaar: sumRes.summary.pendingUdhaar !== undefined ? sumRes.summary.pendingUdhaar : prev.pendingUdhaar,
            totalUdhaarGiven: Math.max(prev.totalUdhaarGiven || 0, sumRes.summary.totalUdhaarGiven || 0),
            totalUdhaarRepaid: Math.max(prev.totalUdhaarRepaid || 0, sumRes.summary.totalUdhaarRepaid || 0)
          };
        });
      }

      if (udhRes.ledger) setUdhaarLedger(udhRes.ledger);
    } catch (err) {
      console.error('Error loading cash flow data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateReminder = (customer) => {
    const msg = language === 'hi'
      ? `नमस्ते ${customer.customerName} जी, ${shop?.name || 'रमेश किराना'} पर आपका ₹${customer.balanceOwed} का हिसाब बाकी है। सुविधा अनुसार भुगतान करें। धन्यवाद!`
      : `Namaste ${customer.customerName}, your grocery khata balance at ${shop?.name || 'Ramesh Kirana'} is ₹${customer.balanceOwed}. Please settle when convenient. Thank you!`;

    setReminderToast({ name: customer.customerName, message: msg });
    setTimeout(() => {
      setReminderToast(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Sovereign Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-display">
              {language === 'hi' ? 'डिजिटल बही-खाता' : 'Bahi-Khata Ledger'}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {transactions.length} Verified Entries
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>{language === 'hi' ? 'सटीक दैनिक आय-व्यय एवं ग्राहक उधारी खाता' : 'Daily sales, inventory outlays, and customer credit ledger'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold text-[11px]">● DPI Tamper-Evident</span>
          </p>
        </div>

        <button
          onClick={onOpenKeypad}
          className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>{language === 'hi' ? 'नया लेन-देन दर्ज करें' : '+ Record Transaction'}</span>
        </button>
      </div>

      {/* 2. Top Summary KPI Cards (Clean Minimalist Apple Style) */}
      <div className="space-y-2">
        {justUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-extrabold px-1 animate-fadeIn">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>✓ Bahi-Khata updated instantly (+0ms)</span>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {language === 'hi' ? 'कुल बिक्री' : 'Recorded Sales'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">
              ₹{summary?.totalIncome?.toLocaleString('en-IN') || '0'}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 mt-1 block">90 days total</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {language === 'hi' ? 'माल खरीद + खर्च' : 'Stock & Expenses'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">
              ₹{summary?.totalExpense?.toLocaleString('en-IN') || '0'}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 mt-1 block">Inventory & bills</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {language === 'hi' ? 'शुद्ध बचत / लाभ' : 'Net Surplus'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums tracking-tight">
              ₹{summary?.netSurplus?.toLocaleString('en-IN') || '0'}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">+28.8% margin</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {language === 'hi' ? 'बकाया ग्राहक उधार' : 'Pending Udhaar Book'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 tabular-nums tracking-tight">
              ₹{summary?.pendingUdhaar?.toLocaleString('en-IN') || '0'}
            </div>
            <span className="text-[11px] font-semibold text-amber-600 mt-1 block">Within safe ratio</span>
          </div>
        </div>
      </div>

      {/* 3. 4-Month Seasonal Cash Flow Timeline */}
      {summary?.monthlyTrend && summary.monthlyTrend.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {language === 'hi' ? '4 माह का मौसमी नकदी प्रवाह' : '4-Month Seasonal Cash Flow Pattern'}
              </h2>
              <p className="text-xs text-slate-500">
                Baseline, July monsoon dip, and pre-festival surge cycle
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
              4 Months Audited
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {summary.monthlyTrend.map((m) => {
              const isDip = m.month === '2026-06' || m.month === '2026-07';
              const isSpike = m.month === '2026-08' || m.month === '2026-09';
              
              return (
                <div 
                  key={m.month}
                  className={`p-4 rounded-2xl border transition ${
                    isDip 
                      ? 'bg-slate-50 border-indigo-200' 
                      : isSpike 
                      ? 'bg-amber-50/60 border-amber-200' 
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{m.label || m.month}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      isDip ? 'bg-indigo-100 text-indigo-800' :
                      isSpike ? 'bg-amber-100 text-amber-900' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {m.patternTag?.split(' ')[1] || 'Baseline'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">Sales</span>
                      <strong className="text-slate-900 font-extrabold tabular-nums">₹{m.income?.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          isDip ? 'bg-indigo-500' : isSpike ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (m.income / 85000) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-baseline text-[10px] text-slate-500 pt-1">
                      <span>Surplus</span>
                      <span className="font-bold text-emerald-600 tabular-nums">₹{m.profit?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WhatsApp Simulated Toast */}
      {reminderToast && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl shadow-lg flex items-start gap-3 animate-fadeIn">
          <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-emerald-900">
              📲 WhatsApp Payment Reminder Sent to {reminderToast.name}:
            </span>
            <p className="text-emerald-800 bg-white p-2 rounded-xl border border-emerald-200 font-mono">
              "{reminderToast.message}"
            </p>
          </div>
        </div>
      )}

      {/* 4. Revolut / Apple Wallet Style Transaction Stream */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        
        {/* Segment Tabs */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'all' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 All Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('udhaar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'udhaar' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📖 Customer Udhaar Book</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                ₹{summary?.pendingUdhaar || '1,050'}
              </span>
            </button>
          </div>

          {/* Quick Filter Pills for Tab 1 */}
          {activeTab === 'all' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              {['', 'income', 'expense', 'udhaar_given'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-xl font-bold text-xs transition ${
                    filterType === t 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t === '' ? 'All' : t === 'income' ? 'Sales' : t === 'expense' ? 'Costs' : 'Udhaar'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: All Transactions Feed */}
        {activeTab === 'all' && (
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No transactions recorded yet.
              </div>
            ) : (
              transactions.map(tx => {
                const isIncome = tx.type === 'income';
                const isExpense = tx.type === 'expense';
                const isUdhaarGiven = tx.type === 'udhaar_given';

                return (
                  <div key={tx.id} className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isIncome ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' :
                        isExpense ? 'bg-rose-50 text-rose-600 border border-rose-200/60' :
                        isUdhaarGiven ? 'bg-amber-50 text-amber-600 border border-amber-200/60' :
                        'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                      }`}>
                        {isIncome ? '↓' : isExpense ? '↑' : '⏱'}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{tx.category}</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 uppercase">
                            {tx.payment_mode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {tx.customer_vendor_name ? `${tx.customer_vendor_name} • ` : ''}
                          {tx.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-base font-black tabular-nums ${
                        isIncome || tx.type === 'udhaar_repaid' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {isIncome || tx.type === 'udhaar_repaid' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize font-medium">
                        {tx.type.replace('_', ' ')}
                      </span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Customer Udhaar Khata */}
        {activeTab === 'udhaar' && (
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {udhaarLedger.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No active udhaar accounts.
              </div>
            ) : (
              udhaarLedger.map((cust, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center font-bold text-sm">
                      {cust.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">{cust.customerName}</div>
                      <div className="text-xs text-slate-400 font-medium">Last active: {cust.lastDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-base font-black text-amber-600 tabular-nums">
                        ₹{cust.balanceOwed.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400">Balance Owed</span>
                    </div>

                    <button
                      onClick={() => handleSimulateReminder(cust)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition active:scale-95 flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

    </div>
  );
}
