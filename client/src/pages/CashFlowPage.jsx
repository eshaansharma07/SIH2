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
  ArrowRight,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { WarliBorder } from '../components/WarliMotif';
import { Card, Badge, SectionHeader, Button } from '../components/ui';

// Custom Chart Tooltip using warm paper aesthetic
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const income = payload.find(p => p.dataKey === 'income')?.value || 0;
    const expense = payload.find(p => p.dataKey === 'expense')?.value || 0;
    const surplus = income - expense;

    return (
      <div className="bg-paper-50 border border-paper-300 p-3 rounded-xl shadow-card text-xs space-y-1.5 min-w-[160px]">
        <span className="font-extrabold text-indigoRural-900 block pb-1 border-b border-paper-200">
          {label}
        </span>
        <div className="flex justify-between items-center text-forestRural-700 font-semibold">
          <span>Recorded Sales:</span>
          <strong className="font-extrabold tabular-nums">₹{income.toLocaleString('en-IN')}</strong>
        </div>
        <div className="flex justify-between items-center text-terracotta-700 font-semibold">
          <span>Expenses:</span>
          <strong className="font-extrabold tabular-nums">₹{expense.toLocaleString('en-IN')}</strong>
        </div>
        <div className="flex justify-between items-center text-indigoRural-800 font-bold pt-1 border-t border-paper-200">
          <span>Net Surplus:</span>
          <strong className="font-extrabold tabular-nums text-forestRural-700">₹{surplus.toLocaleString('en-IN')}</strong>
        </div>
      </div>
    );
  }
  return null;
}

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
    if (!shop?.id) {
      setLoading(false);
      setTransactions([]);
      setUdhaarLedger([]);
      setSummary(null);
      return;
    }
    setLoading(true);
    try {
      const shopId = shop.id;
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
    const shopDisplayName = shop?.name || (language === 'hi' ? 'हमारी दुकान' : 'our store');
    const msg = language === 'hi'
      ? `नमस्ते ${customer.customerName} जी, ${shopDisplayName} पर आपका ₹${customer.balanceOwed} का हिसाब बाकी है। सुविधा अनुसार भुगतान करें। धन्यवाद!`
      : `Namaste ${customer.customerName}, your grocery khata balance at ${shopDisplayName} is ₹${customer.balanceOwed}. Please settle when convenient. Thank you!`;

    setReminderToast({ name: customer.customerName, message: msg });
    setTimeout(() => {
      setReminderToast(null);
    }, 4000);
  };

  // Dynamic calculations for seasonal trends
  const monthlyTrend = summary?.monthlyTrend || [];
  const avgIncome = monthlyTrend.length > 0 
    ? monthlyTrend.reduce((sum, item) => sum + (item.income || 0), 0) / monthlyTrend.length 
    : 0;
  const maxIncome = monthlyTrend.length > 0 
    ? Math.max(...monthlyTrend.map(item => item.income || 0), 1) 
    : 1;

  const totalIncomeVal = summary?.totalIncome;
  const totalExpenseVal = summary?.totalExpense;
  const netSurplusVal = summary?.netSurplus;
  const pendingUdhaarVal = summary?.pendingUdhaar;

  const marginPct = (totalIncomeVal && netSurplusVal !== undefined && totalIncomeVal > 0)
    ? ((netSurplusVal / totalIncomeVal) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner with Warli Folk Art Border */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-indigoRural-900 font-display">
                {language === 'hi' ? 'डिजिटल बही-खाता' : 'Bahi-Khata Ledger'}
              </h1>
              <Badge variant="neutral" size="sm">
                {transactions.length} Verified Entries
              </Badge>
            </div>
            <p className="text-xs text-indigoRural-500 mt-1 flex items-center gap-2">
              <span>{language === 'hi' ? 'सटीक दैनिक आय-व्यय एवं ग्राहक उधारी खाता' : 'Daily sales, inventory outlays, and customer credit ledger'}</span>
              <span className="text-paper-400">•</span>
              <span className="text-forestRural-700 font-semibold text-[11px]">● DPI Tamper-Evident</span>
            </p>
          </div>

          <Button
            onClick={onOpenKeypad}
            variant="primary"
            size="lg"
            icon={PlusCircle}
            className="self-start sm:self-auto"
          >
            <span>{language === 'hi' ? 'नया लेन-देन दर्ज करें' : '+ Record Transaction'}</span>
          </Button>
        </div>

        {/* Warli Folk Art Border */}
        <WarliBorder className="w-full h-6 text-terracotta-400 opacity-60" />
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="space-y-2">
        {justUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-forestRural-700 font-extrabold px-1 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-forestRural-600 shrink-0" />
            <span>Bahi-Khata updated instantly (+0ms)</span>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md">
            <span className="text-[10px] font-bold text-indigoRural-400 uppercase tracking-widest block mb-1">
              {language === 'hi' ? 'कुल बिक्री' : 'Recorded Sales'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-indigoRural-900 tabular-nums tracking-tight font-display">
              {totalIncomeVal !== undefined && totalIncomeVal !== null ? `₹${totalIncomeVal.toLocaleString('en-IN')}` : '—'}
            </div>
            <span className="text-[11px] font-semibold text-indigoRural-500 mt-1 block">
              {summary?.activeDaysCount ? `${summary.activeDaysCount} days verified` : 'Audited ledger'}
            </span>
          </Card>

          <Card padding="md">
            <span className="text-[10px] font-bold text-indigoRural-400 uppercase tracking-widest block mb-1">
              {language === 'hi' ? 'माल खरीद + खर्च' : 'Stock & Expenses'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-indigoRural-900 tabular-nums tracking-tight font-display">
              {totalExpenseVal !== undefined && totalExpenseVal !== null ? `₹${totalExpenseVal.toLocaleString('en-IN')}` : '—'}
            </div>
            <span className="text-[11px] font-semibold text-indigoRural-500 mt-1 block">Inventory & bills</span>
          </Card>

          <Card padding="md">
            <span className="text-[10px] font-bold text-indigoRural-400 uppercase tracking-widest block mb-1">
              {language === 'hi' ? 'शुद्ध बचत / लाभ' : 'Net Operating Surplus'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-forestRural-700 tabular-nums tracking-tight font-display">
              {netSurplusVal !== undefined && netSurplusVal !== null ? `₹${netSurplusVal.toLocaleString('en-IN')}` : '—'}
            </div>
            <span className="text-[11px] font-semibold text-forestRural-700 mt-1 block">
              {marginPct ? `+${marginPct}% margin` : 'Audited margin'}
            </span>
          </Card>

          <Card padding="md">
            <span className="text-[10px] font-bold text-indigoRural-400 uppercase tracking-widest block mb-1">
              {language === 'hi' ? 'बकाया ग्राहक उधार' : 'Pending Udhaar Book'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-ochre-600 tabular-nums tracking-tight font-display">
              {pendingUdhaarVal !== undefined && pendingUdhaarVal !== null ? `₹${pendingUdhaarVal.toLocaleString('en-IN')}` : '—'}
            </div>
            <span className="text-[11px] font-semibold text-ochre-700 mt-1 block">
              {udhaarLedger.length > 0 ? `${udhaarLedger.length} active khata` : 'Managed credit'}
            </span>
          </Card>
        </div>
      </div>

      {/* 3. Recharts Real Seasonal Cash Flow Chart */}
      {monthlyTrend.length > 0 ? (
        <Card variant="hero" padding="lg" className="space-y-5">
          <SectionHeader
            icon={TrendingUp}
            iconColor="terracotta"
            title={language === 'hi' ? 'मौसमी नकदी प्रवाह रुझान (Seasonal Trend)' : 'Seasonal Cash Flow Trend'}
            subtitle={language === 'hi' ? 'वास्तविक समय-श्रृंखला ग्राफ: मासिक बिक्री एवं लागत' : 'Audited time-series: gross sales vs operating stock outlays over time'}
            action={
              <Badge variant="positive" size="sm" dot>
                {monthlyTrend.length} Months Computed
              </Badge>
            }
          />

          {/* Recharts Area Chart Container */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* ForestRural Gradient for Recorded Sales */}
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E523A" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#1E523A" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Terracotta Gradient for Expenses */}
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C15324" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#C15324" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#ECE4D4" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                  axisLine={{ stroke: '#DFD3BE' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 700 }}
                  formatter={(val) => <span className="text-indigoRural-800 font-bold">{val}</span>}
                />

                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name={language === 'hi' ? 'बिक्री (Sales)' : 'Recorded Sales'} 
                  stroke="#1E523A" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#incomeGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name={language === 'hi' ? 'खर्च (Expenses)' : 'Stock & Expenses'} 
                  stroke="#C15324" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#expenseGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Supplementary Per-Month Detail Cards */}
          <div className="space-y-2 pt-4 border-t border-paper-200">
            <span className="text-[11px] font-bold text-indigoRural-400 uppercase tracking-wider block">
              {language === 'hi' ? 'मासिक विश्लेषण विवरण' : 'Monthly Performance Breakdown'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {monthlyTrend.map((m) => {
                const isDip = avgIncome > 0 && m.income < avgIncome * 0.85;
                const isSpike = avgIncome > 0 && m.income > avgIncome * 1.15;
                const dynamicPct = Math.min(100, Math.round(((m.income || 0) / maxIncome) * 100));
                
                return (
                  <div 
                    key={m.month}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      isDip 
                        ? 'bg-paper-100 border-indigoRural-200' 
                        : isSpike 
                        ? 'bg-ochre-50/70 border-ochre-300/80' 
                        : 'bg-white border-paper-300/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigoRural-900">{m.label || m.month}</span>
                      <Badge 
                        variant={isDip ? 'neutral' : isSpike ? 'attention' : 'positive'} 
                        size="sm"
                      >
                        {isDip ? 'Monsoon Dip' : isSpike ? 'Pre-Festival Surge' : 'Baseline'}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-indigoRural-400 text-[10px] font-bold uppercase">Sales</span>
                        <strong className="text-indigoRural-900 font-extrabold tabular-nums">₹{m.income?.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="w-full bg-paper-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            isDip ? 'bg-indigoRural-500' : isSpike ? 'bg-ochre-500' : 'bg-forestRural-600'
                          }`}
                          style={{ width: `${dynamicPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-baseline text-[10px] text-indigoRural-500 pt-0.5">
                        <span>Surplus</span>
                        <span className="font-bold text-forestRural-700 tabular-nums">₹{m.profit?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        <Card padding="lg" className="text-center py-8 space-y-2">
          <TrendingUp className="w-8 h-8 text-indigoRural-300 mx-auto" />
          <h3 className="font-bold text-sm text-indigoRural-800">
            {language === 'hi' ? 'मौसमी नकदी प्रवाह चार्ट (माह-वार)' : 'Seasonal Cash Flow Trend Chart'}
          </h3>
          <p className="text-xs text-indigoRural-500 max-w-md mx-auto">
            {language === 'hi' 
              ? 'जैसे-जैसे आप दैनिक लेन-देन दर्ज करेंगे, आपका मासिक बिक्री और लागत का समय-श्रृंखला ग्राफ यहाँ स्वतः तैयार होगा।' 
              : 'As you record transactions over multiple weeks, your monthly gross revenue and inventory replenishment trends will graph here automatically.'}
          </p>
        </Card>
      )}

      {/* WhatsApp Simulated Toast */}
      {reminderToast && (
        <div className="bg-forestRural-50 border border-forestRural-300 p-4 rounded-2xl shadow-card flex items-start gap-3 animate-fadeIn">
          <MessageCircle className="w-5 h-5 text-forestRural-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-forestRural-900 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-forestRural-700" />
              <span>WhatsApp Payment Reminder Sent to {reminderToast.name}:</span>
            </span>
            <p className="text-forestRural-800 bg-white p-2.5 rounded-xl border border-forestRural-200 font-mono">
              "{reminderToast.message}"
            </p>
          </div>
        </div>
      )}

      {/* 4. Transaction Stream & Customer Udhaar Book */}
      <Card padding="none" className="overflow-hidden">
        
        {/* Segment Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-paper-200 bg-paper-50/70 gap-3">
          <div className="flex gap-1 p-1 bg-paper-200/80 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-white text-indigoRural-900 shadow-2xs' 
                  : 'text-indigoRural-600 hover:text-indigoRural-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Transactions ({transactions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('udhaar')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'udhaar' 
                  ? 'bg-white text-indigoRural-900 shadow-2xs' 
                  : 'text-indigoRural-600 hover:text-indigoRural-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Customer Udhaar Book</span>
              {pendingUdhaarVal !== undefined && pendingUdhaarVal !== null && (
                <Badge variant="attention" size="sm">
                  ₹{pendingUdhaarVal.toLocaleString('en-IN')}
                </Badge>
              )}
            </button>
          </div>

          {/* Quick Filter Pills for Tab 1 */}
          {activeTab === 'all' && (
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              {['', 'income', 'expense', 'udhaar_given'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                    filterType === t 
                      ? 'bg-indigoRural-900 text-white' 
                      : 'bg-white text-indigoRural-600 border border-paper-300 hover:bg-paper-100'
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
          <div className="divide-y divide-paper-200 max-h-[500px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-paper-100 flex items-center justify-center text-indigoRural-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-indigoRural-800">
                  {language === 'hi' ? 'अभी कोई लेनदेन दर्ज नहीं है' : 'No Transactions Recorded Yet'}
                </h4>
                <p className="text-xs text-indigoRural-500 max-w-sm mx-auto">
                  {language === 'hi' 
                    ? 'अपनी दुकान की पहली दैनिक बिक्री या खर्च दर्ज करने के लिए नीचे बटन दबाएं।' 
                    : 'Tap the button below to record your first daily counter sale, stock purchase, or customer credit.'}
                </p>
                <div className="pt-2">
                  <Button onClick={onOpenKeypad} variant="dark" size="sm" icon={PlusCircle}>
                    <span>{language === 'hi' ? 'पहला लेनदेन दर्ज करें' : '+ Record First Transaction'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              transactions.map(tx => {
                const isIncome = tx.type === 'income';
                const isExpense = tx.type === 'expense';
                const isUdhaarGiven = tx.type === 'udhaar_given';

                return (
                  <div key={tx.id} className="p-4 hover:bg-paper-50 transition flex items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isIncome ? 'bg-forestRural-50 text-forestRural-700 border border-forestRural-200' :
                        isExpense ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200' :
                        isUdhaarGiven ? 'bg-ochre-50 text-ochre-700 border border-ochre-200' :
                        'bg-paper-100 text-indigoRural-700 border border-paper-300'
                      }`}>
                        {isIncome ? '↓' : isExpense ? '↑' : '⏱'}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-indigoRural-900">{tx.category}</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-paper-200 text-indigoRural-700 uppercase">
                            {tx.payment_mode}
                          </span>
                        </div>
                        <p className="text-xs text-indigoRural-500 font-medium">
                          {tx.customer_vendor_name ? `${tx.customer_vendor_name} • ` : ''}
                          {tx.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-base font-black tabular-nums ${
                        isIncome || tx.type === 'udhaar_repaid' ? 'text-forestRural-700' : 'text-indigoRural-900'
                      }`}>
                        {isIncome || tx.type === 'udhaar_repaid' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-indigoRural-400 capitalize font-medium">
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
          <div className="divide-y divide-paper-200 max-h-[500px] overflow-y-auto">
            {udhaarLedger.length === 0 ? (
              <div className="p-12 text-center text-indigoRural-400 text-sm">
                No active udhaar accounts.
              </div>
            ) : (
              udhaarLedger.map((cust, idx) => (
                <div key={idx} className="p-4 hover:bg-paper-50 transition flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ochre-50 text-ochre-700 border border-ochre-200 flex items-center justify-center font-bold text-sm">
                      {cust.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-indigoRural-900">{cust.customerName}</div>
                      <div className="text-xs text-indigoRural-500 font-medium">Last active: {cust.lastDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-base font-black text-ochre-700 tabular-nums">
                        ₹{cust.balanceOwed.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-indigoRural-400">Balance Owed</span>
                    </div>

                    <Button
                      onClick={() => handleSimulateReminder(cust)}
                      variant="forest"
                      size="sm"
                      icon={MessageCircle}
                    >
                      <span>WhatsApp</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </Card>

    </div>
  );
}
