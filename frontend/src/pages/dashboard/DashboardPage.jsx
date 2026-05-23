import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, CreditCard, Wallet, AlertCircle, 
  TrendingUp, Activity, Plus, CheckCircle2,
  ChevronRight, CalendarClock, Phone, Package, ListChecks
} from 'lucide-react';
import { getItemDisplayName, getItemIcon } from '@/utils/itemHelper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import PageWrapper from '@/components/ui/PageWrapper';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/axios';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import toast from 'react-hot-toast';
import ReceiptButton from '@/components/payments/ReceiptButton';
import CollectPaymentModal from '@/components/payments/CollectPaymentModal';
import { useAuthStore } from '@/store/authStore';

// ── Components ──────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, colorClass }) {
  return (
    <div className="erp-card p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`p-2 rounded-xl ${colorClass}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [stats, setStats] = useState({
    totalOutstanding: 0,
    collectedToday: 0,
    overdueCount: 0,
    activeInstallments: 0
  });
  const [stock, setStock] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [analyticalStats, setAnalyticalStats] = useState({
    statusStats: [],
    monthlyRecovery: []
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [statsRes, stockRes, activityRes, calRes, recoveryStatsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/dashboard/stock-overview'),
        api.get('/dashboard/activity/recent'),
        api.get(`/dashboard/payments/calendar?month=${currentMonth}&year=${currentYear}`),
        api.get('/installments/stats')
      ]);

      if (statsRes.status === 'fulfilled')    setStats(statsRes.value.data.data);
      if (stockRes.status === 'fulfilled')    setStock(stockRes.value.data.data);
      if (activityRes.status === 'fulfilled') setRecentActivity(activityRes.value.data.data);
      if (calRes.status === 'fulfilled')      setCalendar(calRes.value.data.data);
      if (recoveryStatsRes.status === 'fulfilled') {
        setAnalyticalStats(recoveryStatsRes.value.data.data || { statusStats: [], monthlyRecovery: [] });
      }

      // Only show error if ALL requests failed
      const allFailed = [statsRes, stockRes, activityRes, calRes, recoveryStatsRes].every(r => r.status === 'rejected');
      if (allFailed) setError('Dashboard data load nahi ho saka. Network check karein.');

    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <PageWrapper><SkeletonDashboard /></PageWrapper>;
  if (error) return <PageWrapper><ErrorState message={error} onRetry={fetchData} /></PageWrapper>;

  return (
    <PageWrapper 
      title="Dashboard" 
      subtitle="Karobar ki majmooi karkardagi (Business Overview)."
    >
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Outstanding"
          value={formatCurrency(stats.totalOutstanding)}
          icon={Wallet}
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="Collected Today"
          value={formatCurrency(stats.collectedToday)}
          icon={CheckCircle2}
          colorClass="bg-emerald-100 text-emerald-600"
        />
        <StatCard 
          title="Overdue Accounts"
          value={stats.overdueCount}
          icon={AlertCircle}
          colorClass="bg-red-100 text-red-600"
        />
        <StatCard 
          title="Active Installments"
          value={stats.activeInstallments}
          icon={Activity}
          colorClass="bg-indigo-100 text-indigo-600"
        />
      </div>

      {/* ── Analytical Recovery & Status Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recovery Expected vs Actual Bar Chart */}
        <div className="erp-card lg:col-span-2">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">📊 Recovery Expected vs Actual (6-Month Trend)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Qist expected aur wasool shuda raqam ka mawazna</p>
            </div>
            <div className="flex gap-3 text-xs font-bold shrink-0">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Expected</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Collected</span>
            </div>
          </div>
          <div className="p-6 h-[280px]">
            {analyticalStats.monthlyRecovery?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticalStats.monthlyRecovery} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v) => `Rs ${v >= 1000 ? (v / 1000) + 'k' : v}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }}
                    formatter={(value) => [formatCurrency(value)]}
                  />
                  <Bar dataKey="expected" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Recovery trends are loading or not available.
              </div>
            )}
          </div>
        </div>

        {/* Installment Status Pie Chart */}
        <div className="erp-card">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900">📈 Active Khata Status Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">Khata status ki tafseel</p>
          </div>
          <div className="p-6 flex flex-col justify-between h-[280px]">
            {analyticalStats.statusStats?.length > 0 ? (
              <div className="flex items-center justify-between gap-2 h-full">
                <div className="w-[140px] h-[140px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticalStats.statusStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="_id"
                      >
                        {analyticalStats.statusStats.map((entry, index) => {
                          const statusColors = {
                            active: '#3b82f6',
                            completed: '#10b981',
                            near_completion: '#8b5cf6',
                            defaulted: '#ef4444',
                          }
                          return <Cell key={`cell-${index}`} fill={statusColors[entry._id] || '#64748b'} />
                        })}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Khatey`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5 max-w-[140px] overflow-y-auto">
                  {analyticalStats.statusStats.map((item) => {
                    const statusColors = {
                      active: 'bg-blue-500',
                      completed: 'bg-emerald-500',
                      near_completion: 'bg-purple-500',
                      defaulted: 'bg-red-500',
                    }
                    const statusNames = {
                      active: 'Active (Chalu)',
                      completed: 'Completed',
                      near_completion: 'Near Complete',
                      defaulted: 'Defaulted',
                    }
                    return (
                      <div key={item._id} className="flex justify-between items-center text-xs gap-1">
                        <span className="flex items-center gap-1.5 overflow-hidden">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[item._id] || 'bg-slate-400'}`}></span>
                          <span className="truncate capitalize text-slate-600 font-medium">{statusNames[item._id] || item._id}</span>
                        </span>
                        <span className="font-bold text-slate-800 shrink-0">{item.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Status data loading.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ── Payment Calendar ── */}
        <div className="xl:col-span-2 space-y-8">
          <div className="erp-card">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Mahana Vasooli (Monthly Collections)</h2>
            </div>
            <div className="p-6 h-[350px]">
              {calendar.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calendar} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `Rs ${value >= 1000 ? (value / 1000) + 'k' : value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [formatCurrency(value), 'Vasooli']}
                    />
                    <Bar dataKey="totalAmount" fill="#000000" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  Koi data majood nahi hai chart ke liye.
                </div>
              )}
            </div>
          </div>
          
          {/* ── Recent Activity ── */}
          <div className="erp-card">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Recent Payments</h2>
            </div>
            <div className="divide-y divide-slate-100">
               {recentActivity.length > 0 ? recentActivity.map(activity => (
                 <div key={activity._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                         <Wallet size={18} />
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-slate-900">{activity.customer?.fullName}</p>
                         <p className="text-xs text-slate-500">{activity.installment?.brand} {activity.installment?.model}</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">+{formatCurrency(activity.amount)}</p>
                      <p className="text-xs text-slate-400">{new Date(activity.paymentDate).toLocaleDateString()}</p>
                    </div>
                 </div>
               )) : (
                 <div className="p-8 text-center text-slate-500">No recent activity.</div>
               )}
            </div>
          </div>
        </div>

        {/* ── Stock Overview ── */}
        <div className="space-y-8">
          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Package className="text-indigo-500" size={20} />
                Stock Overview
              </h2>
            </div>
            <div className="p-6">
              {stock.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stock}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="active"
                        nameKey="category"
                      >
                        {stock.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {stock.map((item, index) => (
                      <div key={item.category} className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="capitalize">{item.category}</span>
                        </span>
                        <span className="font-bold">{item.active} active</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No stock data available.</div>
              )}
            </div>
          </div>

          {/* Quick Actions Replaced with simple links since nav handles it mostly */}
          <div className="erp-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Links</h2>
            <div className="space-y-3">
              <button onClick={() => navigate('/customers')} className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-black hover:bg-slate-50 transition-colors">
                 <span className="flex items-center gap-3 font-medium text-sm text-slate-700"><Users size={18}/> View Customers</span>
                 <ChevronRight size={16} className="text-slate-400"/>
              </button>
              <button onClick={() => navigate('/installments')} className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-black hover:bg-slate-50 transition-colors">
                 <span className="flex items-center gap-3 font-medium text-sm text-slate-700"><ListChecks size={18}/> Manage Installments</span>
                 <ChevronRight size={16} className="text-slate-400"/>
              </button>
              <button onClick={() => navigate('/assets')} className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-black hover:bg-slate-50 transition-colors">
                 <span className="flex items-center gap-3 font-medium text-sm text-slate-700"><Package size={18}/> Assets / Inventory</span>
                 <ChevronRight size={16} className="text-slate-400"/>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ═══ AAJ KI VASOOLI SECTION ════════════════════════════════════════════ */}
      <VasooliSection />

    </PageWrapper>
  );
}

// ── Aaj Ki Vasooli ─────────────────────────────────────────────────────────────
function VasooliSection() {
  const TABS = [
    { id: 'daily',   label: 'Rozana (Daily)' },
    { id: 'weekly',  label: 'Haftawar (Weekly)' },
    { id: 'monthly', label: 'Mahana (Monthly)' },
  ]
  const [activeTab, setActiveTab] = useState('daily')
  const [rows, setRows]           = useState([])
  const [loading, setLoading]     = useState(false)

  // Collect modal states — pass full installment + scheduleEntry so modal shows correct data
  const [isPaymentModalOpen, setIsPaymentModalOpen]   = useState(false)
  const [selectedPaymentData, setSelectedPaymentData] = useState(null)

  const { user: currentUser } = useAuthStore()

  const load = async (type) => {
    setLoading(true)
    try {
      const r = await api.get(`/installments/due-today?type=${type}`)
      setRows(r.data.data || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load(activeTab) }, [activeTab])

  const markStatus = async (scheduleId, installmentId, status) => {
    try {
      await api.patch(`/payments/schedule/${scheduleId}/status`, { status, installmentId });
      toast.success(`Qist status '${status}' kar di gayi.`);
      load(activeTab);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error in registering payment');
    }
  }

  // Set BOTH installment and scheduleEntry BEFORE opening the modal — no race condition
  const handleOpenCollectModal = (row) => {
    setSelectedPaymentData({
      installment:   row,                  // the full installment row (has .customer, .khataNumber, etc.)
      scheduleEntry: row.scheduleEntry,    // the specific due slot for today
    });
    setIsPaymentModalOpen(true);
  }

  const totalDue = rows.reduce((s, r) => s + (r.perInstallmentAmount || 0), 0)
  const paidRows = rows.filter(r => r.scheduleEntry?.status === 'paid')
  const totalCollected = paidRows.reduce((s, r) => s + (r.scheduleEntry?.paidAmount || r.perInstallmentAmount || 0), 0)

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900">💰 Aaj Ki Vasooli (Today's Collection)</h2>
          <p className="text-sm text-slate-500 mt-0.5">Aaj ki qistain jo wasool karni hain</p>
        </div>
        <div className="flex gap-4 text-sm shrink-0">
          <div className="text-right">
            <div className="text-slate-400 font-medium">Total Due</div>
            <div className="font-black text-slate-900">{formatCurrency(totalDue)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 font-medium">Collected</div>
            <div className="font-black text-emerald-600">{formatCurrency(totalCollected)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4 w-fit border border-slate-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="erp-card overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse font-medium">Loading vasooli list...</div>
        ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[750px] text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Customer (Gahak)', 'Item (Samaan)', 'Khata #', 'Due Amount', 'Schedule', 'Status', 'Receipt', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length > 0 ? rows.map((row, i) => {
                  const status = row.scheduleEntry?.status || 'pending'
                  const statusLower = status.toLowerCase().trim();
                  const isPaid = statusLower === 'paid';
                  const isMissed = statusLower === 'missed';
                  
                  return (
                    <tr key={i} className={`${isMissed ? 'bg-red-50/20' : isPaid ? 'bg-emerald-50/10' : 'bg-white'} hover:bg-slate-50 transition-colors`}>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{row.customer?.fullName || '—'}</div>
                        <div className="text-xs text-slate-400 font-medium">{row.customer?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        <div className="flex items-center gap-2">
                          {getItemIcon(row.category)}
                          <span>{getItemDisplayName(row)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 font-bold">{row.khataNumber || '—'}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(row.perInstallmentAmount)}</td>
                      <td className="px-4 py-3 text-slate-500 capitalize text-xs font-medium">{row.scheduleType}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                          isPaid ? 'bg-emerald-100 text-emerald-700'
                          : isMissed ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isPaid ? '✅ Paid' : isMissed ? '❌ Missed' : '🟡 Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <ReceiptButton
                            paymentId={row.scheduleEntry?.paymentId || row.scheduleEntry?._id}
                            paymentStatus={status}
                            receiptNumber={row.scheduleEntry?.receiptNumber || 'RCP'}
                            variant="icon"
                          />
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isPaid && (
                          <button onClick={() => handleOpenCollectModal(row)}
                            className="px-3 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition-all mr-1.5 active:scale-95">
                            ✅ Paise Mil Gaye
                          </button>
                        )}
                        {status === 'pending' && row.scheduleEntry?._id && (
                           <button onClick={() => markStatus(row.scheduleEntry?._id, row._id, 'missed')}
                            className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 transition-all active:scale-95">
                            ❌ Nahi Diye
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-medium">
                    <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-300" />
                    Is waqt koi qist due nahi hai! 🎉
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CollectPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setSelectedPaymentData(null)
        }}
        installment={selectedPaymentData?.installment}
        scheduleEntry={selectedPaymentData?.scheduleEntry}
        currentUser={currentUser}
        onSuccess={() => load(activeTab)}
      />
    </div>
  )
}
