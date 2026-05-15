import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Users, CreditCard, Wallet, AlertCircle, 
  TrendingUp, Activity, Plus, CheckCircle2,
  ChevronRight, CalendarClock, Phone
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts'
import PageWrapper from '@/components/ui/PageWrapper'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const MOCK_STATS = {
  todaysCollections: { value: 145000, trend: '+12% vs yesterday', up: true },
  pendingPayments: { count: 24, amount: 89000, trend: 'Due today', up: false },
  overdueAccounts: { count: 18, trend: '4 critical', up: false },
  activeInstallments: { count: 432, trend: '+5 this week', up: true },
  totalOutstanding: { value: 8450000, trend: 'Across 432 accounts', up: null },
  monthlyProfit: { value: 420000, trend: '+8% vs last month', up: true },
}

const CHART_DATA = [
  { month: 'Dec', amount: 850000 },
  { month: 'Jan', amount: 920000 },
  { month: 'Feb', amount: 1100000 },
  { month: 'Mar', amount: 980000 },
  { month: 'Apr', amount: 1350000 },
  { month: 'May', amount: 145000 }, // Current month partial
]

const DUE_PAYMENTS = [
  { id: 1, name: 'Muhammad Asif', item: 'Honda CD 70', due: 4500, remaining: 45000, status: 'pending' },
  { id: 2, name: 'Sana Bibi', item: 'Haier AC 1.5T', due: 6000, remaining: 18000, status: 'paid' },
  { id: 3, name: 'Tariq Mehmood', item: 'Samsung TV', due: 8500, remaining: 54000, status: 'overdue' },
  { id: 4, name: 'Ali Hassan', item: 'Suzuki Mehran', due: 15000, remaining: 450000, status: 'pending' },
  { id: 5, name: 'Zainab Khatoon', item: 'Dawlance Fridge', due: 5000, remaining: 25000, status: 'pending' },
]

const OVERDUE_CUSTOMERS = [
  { id: 1, name: 'Farrukh Tashkentov', phone: '0312-9876543', overdueSince: '2026-04-10', amount: 8500, daysLate: 35 },
  { id: 2, name: 'Usman Ghani', phone: '0345-6677889', overdueSince: '2026-04-20', amount: 4500, daysLate: 25 },
  { id: 3, name: 'Nasreen Akhtar', phone: '0300-1122334', overdueSince: '2026-05-01', amount: 6000, daysLate: 14 },
  { id: 4, name: 'Rukhsana Bibi', phone: '0333-4455667', overdueSince: '2026-05-05', amount: 5500, daysLate: 10 },
]

// ── Components ──────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, trend, up, loading, colorClass }) {
  if (loading) {
    return (
      <div className="erp-card p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
      </div>
    )
  }

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
        {trend && (
          <p className={`text-xs mt-1.5 font-medium flex items-center gap-1
            ${up === true ? 'text-emerald-600' : up === false ? 'text-red-600' : 'text-slate-400'}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <PageWrapper 
      title="Dashboard" 
      subtitle="Overview of your installment business performance."
    >
      
      {/* ── Summary Cards (6) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Today's Collections"
          value={formatCurrency(MOCK_STATS.todaysCollections.value)}
          trend={MOCK_STATS.todaysCollections.trend}
          up={MOCK_STATS.todaysCollections.up}
          icon={Wallet}
          colorClass="bg-emerald-100 text-emerald-600"
          loading={loading}
        />
        <StatCard 
          title="Pending Payments (Today)"
          value={`${MOCK_STATS.pendingPayments.count} (${formatCurrency(MOCK_STATS.pendingPayments.amount)})`}
          trend={MOCK_STATS.pendingPayments.trend}
          up={MOCK_STATS.pendingPayments.up}
          icon={CalendarClock}
          colorClass="bg-amber-100 text-amber-600"
          loading={loading}
        />
        <StatCard 
          title="Overdue Accounts"
          value={MOCK_STATS.overdueAccounts.count}
          trend={MOCK_STATS.overdueAccounts.trend}
          up={MOCK_STATS.overdueAccounts.up}
          icon={AlertCircle}
          colorClass="bg-red-100 text-red-600"
          loading={loading}
        />
        <StatCard 
          title="Active Installments"
          value={MOCK_STATS.activeInstallments.count}
          trend={MOCK_STATS.activeInstallments.trend}
          up={MOCK_STATS.activeInstallments.up}
          icon={Activity}
          colorClass="bg-blue-100 text-blue-600"
          loading={loading}
        />
        <StatCard 
          title="Total Outstanding"
          value={formatCurrency(MOCK_STATS.totalOutstanding.value)}
          trend={MOCK_STATS.totalOutstanding.trend}
          up={MOCK_STATS.totalOutstanding.up}
          icon={CreditCard}
          colorClass="bg-indigo-100 text-indigo-600"
          loading={loading}
        />
        <StatCard 
          title="This Month's Profit"
          value={formatCurrency(MOCK_STATS.monthlyProfit.value)}
          trend={MOCK_STATS.monthlyProfit.trend}
          up={MOCK_STATS.monthlyProfit.up}
          icon={TrendingUp}
          colorClass="bg-emerald-100 text-emerald-600"
          loading={loading}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => navigate('/customers')} className="erp-card-hover p-4 flex flex-col items-center justify-center gap-3 bg-white text-slate-700">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users size={24} />
            </div>
            <span className="font-medium text-sm">Add Customer</span>
          </button>
          <button onClick={() => navigate('/payments')} className="erp-card-hover p-4 flex flex-col items-center justify-center gap-3 bg-white text-slate-700">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wallet size={24} />
            </div>
            <span className="font-medium text-sm">Collect Payment</span>
          </button>
          <button onClick={() => navigate('/payments')} className="erp-card-hover p-4 flex flex-col items-center justify-center gap-3 bg-white text-slate-700">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <CalendarClock size={24} />
            </div>
            <span className="font-medium text-sm">View Pending</span>
          </button>
          <button onClick={() => navigate('/installments')} className="erp-card-hover p-4 flex flex-col items-center justify-center gap-3 bg-white text-slate-700">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Plus size={24} />
            </div>
            <span className="font-medium text-sm">New Installment</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ── Chart Area ── */}
        <div className="xl:col-span-2 space-y-8">
          <div className="erp-card">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Monthly Collections</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="h-[300px] bg-slate-50 animate-pulse rounded-xl w-full"></div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CHART_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={(val) => `Rs ${val / 1000}k`}
                        dx={-10}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [formatCurrency(value), 'Collection']}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="#2563EB" 
                        radius={[4, 4, 0, 0]} 
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ── Today's Due Table ── */}
          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Today's Due Payments</h2>
              <Link to="/payments" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 animate-pulse rounded"></div>)}
              </div>
            ) : DUE_PAYMENTS.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4 text-right">Due Amount</th>
                      <th className="px-6 py-4 text-right">Remaining</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DUE_PAYMENTS.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                        <td className="px-6 py-4 text-slate-600">{row.item}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(row.due)}</td>
                        <td className="px-6 py-4 text-right text-slate-500">{formatCurrency(row.remaining)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={row.status} size="sm" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.status !== 'paid' ? (
                            <button className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors">
                              Collect
                            </button>
                          ) : (
                            <div className="flex items-center justify-center text-emerald-500">
                              <CheckCircle2 size={20} />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No payments due today.</div>
            )}
          </div>
        </div>

        {/* ── Overdue Customers ── */}
        <div className="space-y-8">
          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <AlertCircle className="text-red-500" size={20} />
                Critical Overdue
              </h2>
            </div>
            
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded"></div>)}
              </div>
            ) : OVERDUE_CUSTOMERS.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {OVERDUE_CUSTOMERS.map((customer) => (
                  <div key={customer.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">{customer.name}</h4>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Phone size={12} /> {customer.phone}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">
                          {customer.daysLate} days late
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-3">
                      <span className="text-slate-500">Since {new Date(customer.overdueSince).toLocaleDateString()}</span>
                      <span className="font-bold text-red-600">{formatCurrency(customer.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No overdue customers. Great job!</div>
            )}
            {OVERDUE_CUSTOMERS.length > 0 && !loading && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                <Link to="/customers?filter=overdue" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View all overdue accounts
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
