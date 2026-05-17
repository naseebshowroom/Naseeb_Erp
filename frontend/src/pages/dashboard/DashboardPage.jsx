import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, CreditCard, Wallet, AlertCircle, 
  TrendingUp, Activity, Plus, CheckCircle2,
  ChevronRight, CalendarClock, Phone, Package, ListChecks
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import PageWrapper from '@/components/ui/PageWrapper';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/axios';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [statsRes, stockRes, activityRes, calRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/dashboard/stock-overview'),
        api.get('/dashboard/activity/recent'),
        api.get(`/dashboard/payments/calendar?month=${currentMonth}&year=${currentYear}`)
      ]);

      if (statsRes.status === 'fulfilled')    setStats(statsRes.value.data.data);
      if (stockRes.status === 'fulfilled')    setStock(stockRes.value.data.data);
      if (activityRes.status === 'fulfilled') setRecentActivity(activityRes.value.data.data);
      if (calRes.status === 'fulfilled')      setCalendar(calRes.value.data.data);

      // Only show error if ALL requests failed
      const allFailed = [statsRes, stockRes, activityRes, calRes].every(r => r.status === 'rejected');
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
            </div>
          </div>

        </div>

      </div>
    </PageWrapper>
  );
}
