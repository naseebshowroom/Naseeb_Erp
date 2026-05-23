import { useState, useEffect } from 'react'
import {
  Download, FileText, FileSpreadsheet, TrendingUp,
  Wallet, DollarSign, Activity, AlertCircle, Calendar,
  CheckCircle2, RefreshCw, Package, Truck, Users
} from 'lucide-react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import Pagination, { usePagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/lib/utils'
import reportsService from '@/services/reportsService'
import { handleApiError } from '@/utils/errorHandler'

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#e5e5e5']

const CATEGORY_LABELS = {
  motorcycle:      'Motorcycle',
  mobile:          'Mobile Phone',
  ac:              'Air Conditioner',
  lcd:             'LCD / TV',
  washing_machine: 'Washing Machine',
  fridge:          'Refrigerator',
  car:             'Car',
  other:           'Kuch Aur',
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'text-slate-900', bg = 'bg-slate-100', isLoading }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      {isLoading
        ? <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
        : <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
      }
    </div>
  )
}

// ── OverdueTable sub-component with pagination ─────────────────────────────

const OVERDUE_PAGE_SIZE = 25

function OverdueTable({ overdueData, isLoading, exportCSV }) {
  const pg = usePagination(overdueData, OVERDUE_PAGE_SIZE)
  return (
    <div className="erp-card overflow-hidden border-t-4 border-t-red-500">
      <div className="p-4 border-b border-slate-100 bg-red-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-red-600" />
          <h3 className="text-base font-bold text-red-900">Late Adaigiyan (Overdue Accounts)</h3>
          {overdueData.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">{overdueData.length}</span>
          )}
        </div>
        <button onClick={exportCSV} className="text-sm font-bold text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-50 transition-colors flex items-center gap-2">
          <Download size={13} /> CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32 text-slate-500 text-sm">Data load ho raha hai...</div>
        ) : (
            <table className="w-full min-w-[600px] text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Gahak</th>
                <th className="px-6 py-3">Rabta</th>
                <th className="px-6 py-3">Samaan</th>
                <th className="px-6 py-3 text-center">Din Baad</th>
                <th className="px-6 py-3 text-right">Overdue Rakam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pg.total === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-emerald-600 font-medium">
                    <CheckCircle2 size={20} className="inline mr-2" /> Koi late adayigi nahi! Sab theek hai.
                  </td>
                </tr>
              ) : (
                pg.paginated.map((row, i) => (
                  <tr key={i} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-4 text-slate-400 text-xs">{pg.from + i}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{row.customer?.fullName || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{row.customer?.phone || '—'}</div>
                      <div className="text-xs text-slate-400">{row.customer?.cnic || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-medium">{row.brand} {row.model}</div>
                      <div className="text-xs text-slate-400 capitalize">{CATEGORY_LABELS[row.category] || row.category}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold px-2.5 py-1 rounded-lg text-xs ${
                        row.daysLate > 30 ? 'bg-black text-white' :
                        row.daysLate > 14 ? 'bg-slate-800 text-white' :
                        'bg-slate-200 text-black'
                      }`}>{row.daysLate} Din</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-black">{formatCurrency(row.overdueAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <Pagination {...pg} onPageChange={pg.setPage} label="accounts" />
    </div>
  )
}

// ── DistributorTable sub-component with pagination ──────────────────────
function DistributorTable({ distributorData, isLoading }) {
  const pg = usePagination(distributorData, 15)
  return (
    <div className="erp-card overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <Truck size={18} className="text-slate-500" />
        <h3 className="text-base font-bold text-slate-900">Distributor Payables (Baqaya Rakam)</h3>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase">
          <tr>
            <th className="px-6 py-3">Distributor</th>
            <th className="px-6 py-3 text-right">Kul Maal</th>
            <th className="px-6 py-3 text-right">Baqaya</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
          ) : pg.total === 0 ? (
            <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">Koi distributor nahi mila.</td></tr>
          ) : (
            pg.paginated.map(d => (
              <tr key={d._id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{d.companyName || d.name}</div>
                  <div className="text-xs text-slate-400">{d.contact || ''}</div>
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-700">{formatCurrency(d.total)}</td>
                <td className="px-6 py-4 text-right">
                  {d.balance > 0
                    ? <span className="font-bold text-red-600">{formatCurrency(d.balance)}</span>
                    : <span className="font-bold text-emerald-600 flex items-center justify-end gap-1"><CheckCircle2 size={14} /> Saaf</span>
                  }
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <Pagination {...pg} onPageChange={pg.setPage} label="distributors" />
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to:   new Date().toISOString().split('T')[0],
  })
  const [financials, setFinancials] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [overdueData, setOverdueData] = useState([])
  const [distributorData, setDistributorData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [finRes, monthRes, catRes, overdueRes, distRes] = await Promise.all([
        reportsService.getFinancialSummary({ from: dateRange.from, to: dateRange.to }),
        reportsService.getMonthlyReport(),
        reportsService.getCategoryBreakdown(),
        reportsService.getOverdueReport(),
        reportsService.getDistributorPayables(),
      ])
      if (finRes.success)     setFinancials(finRes.data)
      if (monthRes.success)   setMonthlyData(monthRes.data)
      if (catRes.success)     setCategoryData(catRes.data)
      if (overdueRes.success) setOverdueData(overdueRes.data)
      if (distRes.success)    setDistributorData(distRes.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [dateRange.from, dateRange.to])

  // ── PDF Export ───────────────────────────────────────────────
  const exportPDF = () => {
    if (!financials) { toast.error('Data load ho raha hai...'); return }
    toast.success('PDF Report tayar ho rahi hai...')
    const doc = new jsPDF()
    const f = financials
    const profit = f.saleValue - f.investment
    const roi = f.investment > 0 ? ((profit / f.investment) * 100).toFixed(1) : 0

    doc.setFontSize(20); doc.setFont('helvetica', 'bold')
    doc.text('NASEEB AUTOS & SHOWROOM — EXECUTIVE REPORT', 14, 20)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text(`Report Period: ${dateRange.from}  to  ${dateRange.to}`, 14, 30)
    doc.line(14, 34, 196, 34)

    doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text('1. Maaliyati Khulasa (Financial Overview)', 14, 44)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text(`Kul Investment:      Rs. ${Math.round(f.investment).toLocaleString()}`, 14, 54)
    doc.text(`Kul Sale Keemat:     Rs. ${Math.round(f.saleValue).toLocaleString()}`, 14, 61)
    doc.text(`Wapas Aaya Hua:      Rs. ${Math.round(f.recovered).toLocaleString()}`, 14, 68)
    doc.text(`Abhi Baqaya:         Rs. ${Math.round(f.outstanding).toLocaleString()}`, 14, 75)
    doc.setFont('helvetica', 'bold')
    doc.text(`Net Munafa:          Rs. ${Math.round(profit).toLocaleString()} (${roi}%)`, 14, 86)

    doc.setFontSize(13)
    doc.text('2. Overdue Accounts', 14, 100)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    overdueData.slice(0, 10).forEach((row, i) => {
      const y = 110 + i * 7
      const name = row.customer?.fullName || 'N/A'
      const product = `${row.brand || ''} ${row.model || ''}`
      doc.text(`${i + 1}. ${name} — ${product} — ${row.daysLate} din baad — Rs. ${Math.round(row.overdueAmount || 0).toLocaleString()}`, 14, y)
    })

    doc.setTextColor(230, 230, 230); doc.setFontSize(55)
    doc.text('CONFIDENTIAL', 28, 150, { angle: 45 })
    doc.setTextColor(0, 0, 0)

    window.open(doc.output('bloburl'), '_blank')
  }

  // ── CSV Export ───────────────────────────────────────────────
  const exportCSV = () => {
    if (!overdueData.length) { toast.error('Overdue data nahi mila.'); return }
    const headers = 'Gahak,Phone,CNIC,Samaan,Din Baad,Overdue Rakam\n'
    const rows = overdueData.map(o =>
      `"${o.customer?.fullName || ''}","${o.customer?.phone || ''}","${o.customer?.cnic || ''}","${o.brand || ''} ${o.model || ''}",${o.daysLate || 0},${o.overdueAmount || 0}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'naseeb_autos_overdue_report.csv'
    a.click(); URL.revokeObjectURL(url)
    toast.success('CSV Report download ho gayi!')
  }

  const profitMargin = financials && financials.investment > 0
    ? ((financials.netProfit / financials.investment) * 100).toFixed(1)
    : '0.0'

  return (
    <PageWrapper
      title="Reports aur Analytics"
      subtitle="Maaliyati khulasa, charts aur data exports — sab kuch ek jagah."
    >
      {/* ── Sticky Filter Bar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-6 sticky top-20 z-10">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full sm:w-auto">
            <Calendar size={15} className="text-slate-400 shrink-0" />
            <input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
              className="bg-transparent text-sm font-medium focus:outline-none"
            />
            <span className="text-slate-400 font-bold">—</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
              className="bg-transparent text-sm font-medium focus:outline-none"
            />
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={exportPDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-black text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <FileText size={15} /> PDF Export
          </button>
          <button
            onClick={exportCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-bold text-sm rounded-lg hover:bg-slate-100 transition-colors border border-black shadow-sm"
          >
            <FileSpreadsheet size={15} /> CSV Export
          </button>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── Section 1: Financial KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard icon={Wallet}       label="Kul Investment"    value={formatCurrency(financials?.investment)}   color="text-black"   bg="bg-slate-100"   isLoading={isLoading} />
          <StatCard icon={TrendingUp}   label="Sale Keemat"       value={formatCurrency(financials?.saleValue)}    color="text-black"    bg="bg-slate-100"     isLoading={isLoading} />
          <StatCard icon={Activity}     label="Abhi Baqaya"       value={formatCurrency(financials?.outstanding)}  color="text-black"   bg="bg-slate-100"    isLoading={isLoading} />
          <StatCard icon={Users}        label="Kul Khatey"        value={financials?.counts?.total ?? '—'}         color="text-black"   bg="bg-slate-100"   isLoading={isLoading} />
        </div>

        {/* ── Highlight Banner ── */}
        <div className="bg-black rounded-xl p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Wapas Aaya Hua (Total Recovered)</p>
            {isLoading
              ? <div className="h-10 w-48 bg-white/20 rounded-lg animate-pulse" />
              : <h2 className="text-4xl font-black">{formatCurrency(financials?.recovered)}</h2>
            }
          </div>
          <div className="hidden md:block h-16 w-px bg-slate-800" />
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Net Munafa (Profit)</p>
            {isLoading
              ? <div className="h-10 w-40 bg-white/20 rounded-lg animate-pulse" />
              : <h2 className="text-4xl font-black">{formatCurrency(financials?.netProfit)}</h2>
            }
          </div>
          <div className="hidden md:block h-16 w-px bg-slate-800" />
          <div className="text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Munafa Ki Dar (ROI)</p>
            <div className="inline-flex items-center justify-center bg-white text-black font-black text-2xl px-5 py-2 rounded-xl shadow">
              {profitMargin}%
            </div>
          </div>
        </div>

        {/* ── Section 2: Charts ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Monthly Chart */}
          <div className="xl:col-span-2 erp-card p-6 border-t-4 border-t-black">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity size={18} className="text-black" /> Mahana Collection (Last 6 Months)
            </h3>
            <div className="h-[280px] w-full">
              {isLoading ? (
                <div className="h-full bg-slate-50 rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={8} />
                    <YAxis yAxisId="left" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'rate' ? `${value}%` : formatCurrency(value),
                        name === 'due' ? 'Expected' : name === 'collected' ? 'Collected' : 'Rate %'
                      ]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="due" barSize={28} fill="#e2e8f0" radius={[4,4,0,0]} name="Expected" />
                    <Line yAxisId="left" type="monotone" dataKey="collected" stroke="#000000" strokeWidth={3} dot={{ r: 4 }} name="Collected" />
                    <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Rate %" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category Pie */}
          <div className="erp-card p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package size={18} className="text-black" /> Category Breakdown
            </h3>
            {isLoading ? (
              <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={70}
                        paddingAngle={4} dataKey="value"
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v}%`, CATEGORY_LABELS[n] || n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-2">
                  {categoryData.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium text-slate-700">{CATEGORY_LABELS[cat.name] || cat.name}</span>
                      </div>
                      <span className="font-black text-slate-900">{cat.value}%</span>
                    </div>
                  ))}
                  {categoryData.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-4">Koi data nahi mila</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Section 3: Overdue Report ── */}
        <OverdueTable overdueData={overdueData} isLoading={isLoading} exportCSV={exportCSV} />

        {/* ── Section 4: Distributor Payables + Category Profit ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Distributor Payables */}
          <DistributorTable distributorData={distributorData} isLoading={isLoading} />

          {/* Category Profit */}
          <div className="erp-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <DollarSign size={18} className="text-black" />
              <h3 className="text-base font-bold text-slate-900">Category-Wise Munafa</h3>
            </div>
              <table className="w-full min-w-[600px] text-sm text-left">
              <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Qisam</th>
                  <th className="px-6 py-3 text-right">Khatey</th>
                  <th className="px-6 py-3 text-right">Munafa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : categoryData.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">Koi data nahi mila.</td></tr>
                ) : (
                  <>
                    {categoryData.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="font-bold text-slate-900">{CATEGORY_LABELS[c.name] || c.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-600">{c.count}</td>
                        <td className="px-6 py-4 text-right font-black text-black">{formatCurrency(c.profit)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100">
                      <td className="px-6 py-4 font-black text-black" colSpan={2}>Kul Munafa</td>
                      <td className="px-6 py-4 text-right font-black text-black">
                        {formatCurrency(categoryData.reduce((s, c) => s + (c.profit || 0), 0))}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
