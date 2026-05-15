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
import installmentService from '@/services/installmentService'
import paymentService from '@/services/paymentService'
import { handleApiError } from '@/utils/errorHandler'

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
  
  const [stats, setStats] = useState({
    totalActive: 0,
    totalOutstanding: 0,
    totalProfitExpected: 0,
  })
  
  const [daily, setDaily] = useState({
    totalCollectedAmount: 0,
    totalDue: 0,
    totalMissedPending: 0
  })
  
  const [overdueAccounts, setOverdueAccounts] = useState([])
  const [dueTodayList, setDueTodayList] = useState([]) // Placeholder if we build an endpoint for it
  
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [statsRes, dailyRes, overdueRes] = await Promise.all([
          installmentService.getStats(),
          paymentService.getDailySummary(),
          installmentService.getOverdue()
        ])
        
        if (statsRes.success) setStats(statsRes.data)
        if (dailyRes.success) setDaily(dailyRes.data)
        if (overdueRes.success) setOverdueAccounts(overdueRes.data.slice(0, 5)) // Top 5 critical
        
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return (
    <PageWrapper 
      title="Dashboard" 
      subtitle="Karobar ki majmooi karkardagi (Business Overview)."
    >
      
      {/* ── Summary Cards (6) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Aaj Ki Vasooli"
          value={formatCurrency(daily.totalCollectedAmount)}
          trend="Aaj ka din"
          up={true}
          icon={Wallet}
          colorClass="bg-emerald-100 text-emerald-600"
          loading={loading}
        />
        <StatCard 
          title="Aaj Ki Due Qistain"
          value={`${daily.totalDue} Khatey`}
          trend={`${daily.totalMissedPending} pending hain`}
          up={false}
          icon={CalendarClock}
          colorClass="bg-amber-100 text-amber-600"
          loading={loading}
        />
        <StatCard 
          title="Zayed-ul-Miad (Overdue)"
          value={overdueAccounts.length > 0 ? 'Critical' : '0'}
          trend="Jald wasooli karein"
          up={false}
          icon={AlertCircle}
          colorClass="bg-red-100 text-red-600"
          loading={loading}
        />
        <StatCard 
          title="Chalu Khatey (Active)"
          value={stats.totalActive}
          trend="Abhi chal rahay hain"
          up={true}
          icon={Activity}
          colorClass="bg-blue-100 text-blue-600"
          loading={loading}
        />
        <StatCard 
          title="Kul Baqaya Rakam"
          value={formatCurrency(stats.totalOutstanding)}
          trend="Market mein baqi hai"
          up={null}
          icon={CreditCard}
          colorClass="bg-indigo-100 text-indigo-600"
          loading={loading}
        />
        <StatCard 
          title="Kul Munafa (Expected Profit)"
          value={formatCurrency(stats.totalProfitExpected)}
          trend="Karobar ka munafa"
          up={true}
          icon={TrendingUp}
          colorClass="bg-emerald-100 text-emerald-600"
          loading={loading}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Tez Actions (Quick Actions)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => navigate('/customers')} className="erp-card-hover p-4 flex flex-col items-center justify-center gap-3 bg-white text-slate-700">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users size={24} />
            </div>
            <span className="font-medium text-sm text-center">Baqaya Vasooli</span>
          </button>
          <button onClick={() => navigate('/payments')} className="erp-card-hover p-4 flex flex-col items-center justify-center gap-3 bg-white text-slate-700">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wallet size={24} />
            </div>
            <span className="font-medium text-sm text-center">Nayi Adaigi (Payment)</span>
          </button>
          <button onClick={() => navigate('/installments/new')} className="erp-card-hover p-4 flex flex-col items-center justify-center gap-3 bg-white text-slate-700">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Plus size={24} />
            </div>
            <span className="font-medium text-sm text-center">Naya Khata</span>
          </button>
          <button onClick={() => navigate('/reports')} className="erp-card-hover p-4 flex flex-col items-center justify-center gap-3 bg-white text-slate-700">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Activity size={24} />
            </div>
            <span className="font-medium text-sm text-center">Reports Dekhein</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ── Chart Area ── */}
        <div className="xl:col-span-2 space-y-8">
          <div className="erp-card">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Mahana Vasooli (Monthly Collections)</h2>
            </div>
            <div className="p-6 flex items-center justify-center h-[300px] text-slate-400 font-medium bg-slate-50/50">
              Chart Data abhi form nahi kiya gaya backend par.
            </div>
          </div>

          {/* ── Critical Overdue ── */}
          <div className="erp-card overflow-hidden h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <AlertCircle className="text-red-500" size={20} />
                Critical Vasooli (Overdue)
              </h2>
            </div>
            
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded"></div>)}
              </div>
            ) : overdueAccounts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {overdueAccounts.map((account) => (
                  <div key={account._id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">{account.customer?.fullName || 'Naam na-maloom'}</h4>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Phone size={12} /> {account.customer?.phone || 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">
                          {account.daysOverdue} din late
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-3">
                      <span className="text-slate-500 capitalize">{account.category} {account.brand}</span>
                      <span className="font-bold text-red-600">{formatCurrency(account.perInstallmentAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">Koi Vasooli late nahi hai. Zabardast!</div>
            )}
            {overdueAccounts.length > 0 && !loading && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                <Link to="/customers" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Sab late khatey dekhein
                </Link>
              </div>
            )}
          </div>
        </div>


      </div>
    </PageWrapper>
  )
}
