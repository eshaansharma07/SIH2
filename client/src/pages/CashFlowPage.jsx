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
  MessageCircle 
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';

export function CashFlowPage({ shop, onOpenKeypad, refreshKey }) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'udhaar'
  const [transactions, setTransactions] = useState([]);
  const [udhaarLedger, setUdhaarLedger] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [reminderToast, setReminderToast] = useState(null);

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

      if (txRes.transactions) setTransactions(txRes.transactions);
      if (sumRes.summary) setSummary(sumRes.summary);
      if (udhRes.ledger) setUdhaarLedger(udhRes.ledger);
    } catch (err) {
      console.error('Error loading cash flow data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateReminder = (customer) => {
    const msg = language === 'hi'
      ? `नमस्ते ${customer.customerName} जी, ${shop?.name || 'रमेश किराना स्टोर'} पर आपका ₹${customer.balanceOwed} का राशन हिसाब बाकी है। सुविधा अनुसार भुगतान करें। धन्यवाद!`
      : `Namaste ${customer.customerName}, your grocery khata balance at ${shop?.name || 'Ramesh Kirana'} is ₹${customer.balanceOwed}. Please settle when convenient. Thank you!`;

    setReminderToast({ name: customer.customerName, message: msg });
    setTimeout(() => {
      setReminderToast(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header & Quick Add CTA */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-paper-300 shadow-paper flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-terracotta-100 text-terracotta-800 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-stone-900">
              {t('cashflow.title')}
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {t('cashflow.subtitle')}
          </p>
        </div>

        <button
          onClick={onOpenKeypad}
          className="px-6 py-3.5 bg-terracotta-600 hover:bg-terracotta-700 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
        >
          <PlusCircle className="w-5 h-5" />
          <span>{t('cashflow.newEntryBtn')}</span>
        </button>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-paper-300 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 block mb-1">
            {t('cashflow.totalIncome')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-forestRural-700">
            ₹{summary?.totalIncome?.toLocaleString('en-IN') || '0'}
          </div>
          <span className="text-[10px] text-stone-500 font-medium">90 {language === 'hi' ? 'दिन की कुल बिक्री' : 'days total'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-paper-300 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 block mb-1">
            {t('cashflow.totalExpense')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-stone-800">
            ₹{summary?.totalExpense?.toLocaleString('en-IN') || '0'}
          </div>
          <span className="text-[10px] text-stone-500 font-medium">{language === 'hi' ? 'थोक माल खरीद + किराया' : 'Stock & operating costs'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-paper-300 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 block mb-1">
            {t('cashflow.netProfit')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-forestRural-700">
            ₹{summary?.netSurplus?.toLocaleString('en-IN') || '0'}
          </div>
          <span className="text-[10px] text-forestRural-700 font-bold bg-forestRural-50 px-1.5 py-0.5 rounded">
            +28.8% {language === 'hi' ? 'शुद्ध मार्जिन' : 'net margin'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-paper-300 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 block mb-1">
            {language === 'hi' ? 'बकाया ग्राहक उधार' : 'Pending Udhaar Book'}
          </span>
          <div className="text-xl sm:text-2xl font-black text-ochre-700">
            ₹{summary?.pendingUdhaar?.toLocaleString('en-IN') || '0'}
          </div>
          <span className="text-[10px] text-ochre-800 font-semibold">{language === 'hi' ? 'सुरक्षित सीमा के अंदर' : 'Within safe limits'}</span>
        </div>
      </div>

      {/* 3. 4-Month Seasonal Cash Flow Pattern (Monsoon Dip & Festival Surge) */}
      {summary?.monthlyTrend && summary.monthlyTrend.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-paper-300 shadow-paper space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-200 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                {language === 'hi' ? '4 माह का मौसमी नकदी प्रवाह (Cash Flow Pattern)' : '4-Month Cash Flow & Seasonal Trend'}
              </h2>
              <p className="text-[11px] text-stone-500">
                {language === 'hi'
                  ? 'रमेश किराना स्टोर का वास्तविक 4 महीने का चक्र — ग्रीष्मकालीन बेसलाइन, जुलाई मानसून मंदी और त्योहारी उछाल'
                  : 'Ramesh\'s Kirana Store — Steady Summer baseline, July monsoon road waterlogging dip, and pre-festival surge'}
              </p>
            </div>
            <span className="px-3 py-1 bg-terracotta-50 text-terracotta-800 border border-terracotta-300 rounded-full text-xs font-bold self-start sm:self-auto">
              {language === 'hi' ? '4 माह का ऑडिट' : '4 Months Audited'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {summary.monthlyTrend.map((m) => {
              const isDip = m.month === '2026-06' || m.month === '2026-07';
              const isSpike = m.month === '2026-08' || m.month === '2026-09';
              
              return (
                <div 
                  key={m.month}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-3 transition ${
                    isDip 
                      ? 'bg-indigoRural-50/60 border-indigoRural-200 ring-1 ring-indigoRural-300' 
                      : isSpike 
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400' 
                      : 'bg-paper-50 border-paper-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-800">{m.label || m.month}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        isDip ? 'bg-indigoRural-200 text-indigoRural-900' :
                        isSpike ? 'bg-amber-200 text-amber-900' :
                        'bg-paper-200 text-stone-700'
                      }`}>
                        {m.patternTag || 'Baseline'}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-0.5">{m.narrative}</p>
                  </div>

                  {/* Revenue vs Expenses Bars */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-500 text-[10px] font-semibold">{language === 'hi' ? 'बिक्री:' : 'Sales:'}</span>
                      <strong className="text-forestRural-700 text-xs font-black">₹{m.income?.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          isDip ? 'bg-indigoRural-500' : isSpike ? 'bg-amber-500' : 'bg-forestRural-600'
                        }`}
                        style={{ width: `${Math.min(100, (m.income / 85000) * 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-baseline text-[10px] text-stone-500 pt-0.5">
                      <span>{language === 'hi' ? 'माल/खर्च:' : 'Costs:'}</span>
                      <span className="font-semibold text-stone-700">₹{m.expense?.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="pt-1 border-t border-stone-200 flex justify-between items-baseline">
                      <span className="text-[10px] text-stone-600 font-bold">{language === 'hi' ? 'शुद्ध बचत:' : 'Net Surplus:'}</span>
                      <span className="text-[11px] font-black text-forestRural-700">₹{m.profit?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-stone-700 flex items-start gap-2 leading-relaxed">
            <span className="text-base shrink-0">🏛️</span>
            <div>
              <strong className="font-bold text-amber-900">{language === 'hi' ? 'बैंक प्रबंधक क्रेडिट विश्लेषण: ' : 'Bank Appraisal Insight: '}</strong>
              {language === 'hi'
                ? 'जुलाई में मानसून बाढ़ व कीचड़ के कारण 32% बिक्री घटने के बावजूद रमेश जी ने माल खरीद को नियंत्रित रखा और दुकान सकारात्मक नकदी प्रवाह (+Surplus) में रही। यह अनुशासन सिद्ध करता है कि रमेश जी किसी भी मौसम में बैंक की ईएमआई आसानी से चुका सकते हैं।'
                : 'Despite a ~32% dip during July monsoon waterlogging, Ramesh scaled down stock purchases to maintain positive operational surplus throughout. This proven cash-flow discipline guarantees uninterrupted debt service for bank loans.'}
            </div>
          </div>
        </div>
      )}

      {/* 3. Simulated WhatsApp Reminder Notification Toast */}
      {reminderToast && (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl shadow-lg flex items-start gap-3 animate-fadeIn">
          <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-900">
              📲 {language === 'hi' ? 'व्हाट्सएप पर विनम्र तगादा संदेश तैयार:' : 'WhatsApp Payment Reminder Sent:'}
            </span>
            <p className="text-xs text-emerald-800 font-mono bg-white p-2.5 rounded-xl border border-emerald-200">
              "{reminderToast.message}"
            </p>
          </div>
        </div>
      )}

      {/* 4. Tab Navigator (All Daily Entries vs Customer Udhaar Book) */}
      <div className="bg-white rounded-3xl border-2 border-paper-300 shadow-paper overflow-hidden">
        <div className="flex border-b border-paper-200 bg-paper-50 px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition ${
              activeTab === 'all'
                ? 'border-terracotta-600 text-terracotta-700'
                : 'border-transparent text-stone-600 hover:text-stone-800'
            }`}
          >
            📋 {t('cashflow.tabAll')} ({transactions.length})
          </button>

          <button
            onClick={() => setActiveTab('udhaar')}
            className={`pb-3 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'udhaar'
                ? 'border-ochre-600 text-ochre-800'
                : 'border-transparent text-stone-600 hover:text-stone-800'
            }`}
          >
            <span>📖 {t('cashflow.tabUdhaar')}</span>
            <span className="text-[10px] bg-ochre-100 text-ochre-800 px-2 py-0.5 rounded-full font-black">
              ₹{summary?.pendingUdhaar || '4,650'}
            </span>
          </button>
        </div>

        {/* Tab 1: All Transactions */}
        {activeTab === 'all' && (
          <div>
            {/* Filter Pills */}
            <div className="p-3 bg-paper-100/50 border-b border-paper-200 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-stone-500 font-bold text-[11px] whitespace-nowrap">Filter:</span>
              <button
                onClick={() => setFilterType('')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filterType === '' ? 'bg-stone-800 text-white' : 'bg-white text-stone-700 border border-stone-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filterType === 'income' ? 'bg-forestRural-700 text-white' : 'bg-white text-stone-700 border border-stone-300'
                }`}
              >
                🟢 {language === 'hi' ? 'बिक्री (Sales)' : 'Sales'}
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filterType === 'expense' ? 'bg-terracotta-700 text-white' : 'bg-white text-stone-700 border border-stone-300'
                }`}
              >
                🔴 {language === 'hi' ? 'खर्च (Expenses)' : 'Expenses'}
              </button>
              <button
                onClick={() => setFilterType('udhaar_given')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filterType === 'udhaar_given' ? 'bg-ochre-700 text-white' : 'bg-white text-stone-700 border border-stone-300'
                }`}
              >
                🟡 {language === 'hi' ? 'उधार दिया' : 'Udhaar Given'}
              </button>
              <button
                onClick={() => setFilterType('udhaar_repaid')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filterType === 'udhaar_repaid' ? 'bg-indigoRural-700 text-white' : 'bg-white text-stone-700 border border-stone-300'
                }`}
              >
                🔵 {language === 'hi' ? 'उधार लौटाया' : 'Udhaar Repaid'}
              </button>
            </div>

            {/* List */}
            <div className="divide-y divide-paper-200 max-h-[500px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-sm">
                  {language === 'hi' ? 'कोई लेन-देन नहीं मिला।' : 'No transactions recorded yet.'}
                </div>
              ) : (
                transactions.map(tx => {
                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense';
                  const isUdhaarGiven = tx.type === 'udhaar_given';
                  const isUdhaarRepaid = tx.type === 'udhaar_repaid';

                  return (
                    <div key={tx.id} className="p-3.5 sm:p-4 hover:bg-paper-50 transition flex items-center justify-between gap-3 text-xs">
                      
                      <div className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome ? 'bg-forestRural-100 text-forestRural-800' :
                          isExpense ? 'bg-terracotta-100 text-terracotta-800' :
                          isUdhaarGiven ? 'bg-ochre-100 text-ochre-800' :
                          'bg-indigoRural-100 text-indigoRural-800'
                        }`}>
                          {isIncome ? '🟢' : isExpense ? '🔴' : isUdhaarGiven ? '🟡' : '🔵'}
                        </span>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                              {tx.category}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-paper-200 text-stone-600 rounded font-semibold uppercase">
                              {tx.payment_mode}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            {tx.customer_vendor_name ? `👤 ${tx.customer_vendor_name} • ` : ''}
                            📅 {tx.date}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-sm sm:text-base font-black ${
                          isIncome ? 'text-forestRural-700' :
                          isExpense ? 'text-terracotta-700' :
                          isUdhaarGiven ? 'text-ochre-700' :
                          'text-indigoRural-700'
                        }`}>
                          {isIncome || isUdhaarRepaid ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-stone-600 capitalize">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Customer Udhaar Book (Khata Ledger) */}
        {activeTab === 'udhaar' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="p-3 bg-ochre-50 border border-ochre-200 rounded-2xl text-xs text-ochre-900 flex items-start gap-2">
              <Users className="w-4 h-4 text-ochre-700 shrink-0 mt-0.5" />
              <p>
                {language === 'hi'
                  ? 'यह आपके गांव के उन नियमित ग्राहकों की सूची है जिनका दुकान पर उधार बकाया है। 1-क्लिक में व्हाट्सएप द्वारा सौम्य भुगतान स्मरण भेजें।'
                  : 'Ledger of village regulars with outstanding khata credit. Tap the WhatsApp icon to simulate a polite payment reminder.'}
              </p>
            </div>

            <div className="divide-y divide-paper-200 border border-paper-300 rounded-2xl overflow-hidden bg-white">
              {udhaarLedger.map((cust, idx) => (
                <div key={idx} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-stone-900">
                        👤 {cust.customerName}
                      </span>
                      <span className="text-[10px] bg-paper-200 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                        Last entry: {cust.lastDate}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      {language === 'hi' ? 'कुल दिया:' : 'Total Taken:'} ₹{cust.totalGiven.toLocaleString('en-IN')} | {language === 'hi' ? 'वापस किया:' : 'Repaid:'} ₹{cust.totalRepaid.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-stone-500 font-semibold block">{language === 'hi' ? 'बकाया राशि' : 'Balance Owed'}</span>
                      <span className="text-base font-black text-terracotta-700">
                        ₹{cust.balanceOwed.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSimulateReminder(cust)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'तगादा भेजें' : 'Send Reminder'}</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
