import { useState } from 'react'
import { 
  Download, FileText, FileSpreadsheet, TrendingUp, 
  Wallet, DollarSign, Activity, AlertCircle, Calendar, CheckCircle2
} from 'lucide-react'
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import { formatCurrency } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const MOCK_FINANCIALS = {
  investment: 2500000,
  saleValue: 3500000,
  recovered: 1800000,
  outstanding: 1700000,
}
const netProfit = MOCK_FINANCIALS.recovered - MOCK_FINANCIALS.investment
const profitMargin = ((netProfit / MOCK_FINANCIALS.investment) * 100).toFixed(1)

const MONTHLY_DATA = [
  { name: 'Jan', due: 400000, collected: 380000, rate: 95 },
  { name: 'Feb', due: 450000, collected: 420000, rate: 93 },
  { name: 'Mar', due: 420000, collected: 390000, rate: 92 },
  { name: 'Apr', due: 500000, collected: 480000, rate: 96 },
  { name: 'May', due: 550000, collected: 500000, rate: 90 },
  { name: 'Jun', due: 480000, collected: 480000, rate: 100 },
]

const CATEGORY_DATA = [
  { name: 'Motorcycles', value: 45, investment: 1200000, outstanding: 800000, profit: 350000 },
  { name: 'Electronics', value: 35, investment: 800000, outstanding: 500000, profit: 250000 },
  { name: 'Mobile Phones', value: 20, investment: 500000, outstanding: 400000, profit: 150000 },
]
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444']

const OVERDUE_ACCOUNTS = [
  { id: 1, customer: 'Tariq Mehmood', cnic: '36302-9876543-9', phone: '0312-9876543', product: 'Samsung A54', overdueSince: '2026-05-01', daysLate: 14, amount: 5000 },
  { id: 2, customer: 'Saleem Raza', cnic: '34201-1112223-4', phone: '0300-5556667', product: 'Haier 1.5T AC', overdueSince: '2026-05-05', daysLate: 10, amount: 8000 },
]

const DISTRIBUTOR_BALANCES = [
  { id: 1, name: 'Ali Traders', supplied: 1200000, paid: 950000, balance: 250000 },
  { id: 2, name: 'Zafar Autos', supplied: 850000, paid: 850000, balance: 0 },
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({ from: '2026-01-01', to: '2026-05-15' })
  const [category, setCategory] = useState('all')

  const exportPDF = () => {
    toast.success('Generating PDF Report...')
    const doc = new jsPDF()
    
    // Simple jsPDF export logic matching specs loosely
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("KIRAYA ERP - EXECUTIVE REPORT", 14, 20)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Report Period: ${dateRange.from} to ${dateRange.to}`, 14, 30)
    
    doc.setLineWidth(0.5)
    doc.line(14, 35, 196, 35)

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("1. Financial Overview", 14, 45)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Total Investment: Rs. ${MOCK_FINANCIALS.investment.toLocaleString()}`, 14, 55)
    doc.text(`Total Sale Value: Rs. ${MOCK_FINANCIALS.saleValue.toLocaleString()}`, 14, 62)
    doc.text(`Total Recovered: Rs. ${MOCK_FINANCIALS.recovered.toLocaleString()}`, 14, 69)
    doc.text(`Total Outstanding: Rs. ${MOCK_FINANCIALS.outstanding.toLocaleString()}`, 14, 76)
    
    doc.setFont("helvetica", "bold")
    doc.text(`Net Profit Generated: Rs. ${netProfit.toLocaleString()} (${profitMargin}%)`, 14, 88)

    // Watermark
    doc.setTextColor(230, 230, 230)
    doc.setFontSize(60)
    doc.text("CONFIDENTIAL", 30, 150, { angle: 45 })

    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
  }

  const exportExcel = () => {
    // Generate simple CSV logic as mock for Excel
    const headers = "Customer,CNIC,Phone,Product,Overdue Since,Days Late,Amount\n"
    const rows = OVERDUE_ACCOUNTS.map(o => `${o.customer},${o.cnic},${o.phone},${o.product},${o.overdueSince},${o.daysLate},${o.amount}`).join("\n")
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "kiraya_overdue_report.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Excel (CSV) exported successfully')
  }

  return (
    <PageWrapper 
      title="Reports & Analytics" 
      subtitle="Comprehensive financial insights, metrics, and data exports."
    >
      
      {/* ── Top Filter Bar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-6 sticky top-20 z-10">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-full sm:w-auto">
            <Calendar size={16} className="text-slate-400" />
            <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent text-sm font-medium focus:outline-none" />
            <span className="text-slate-400">-</span>
            <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent text-sm font-medium focus:outline-none" />
          </div>
          
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none">
            <option value="all">All Categories</option>
            <option value="motorcycles">Motorcycles</option>
            <option value="electronics">Electronics</option>
          </select>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={exportPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 font-bold text-sm rounded-lg hover:bg-rose-100 transition-colors border border-rose-200">
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={exportExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200">
            <FileSpreadsheet size={16} /> Export Excel
          </button>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── SECTION 1: Financial Overview ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Wallet size={14} /> Total Investment</p>
            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(MOCK_FINANCIALS.investment)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><TrendingUp size={14} /> Expected Sale Value</p>
            <h3 className="text-2xl font-black text-blue-600">{formatCurrency(MOCK_FINANCIALS.saleValue)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Activity size={14} /> Total Outstanding</p>
            <h3 className="text-2xl font-black text-amber-500">{formatCurrency(MOCK_FINANCIALS.outstanding)}</h3>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl shadow-sm xl:col-span-3 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Total Recovered</p>
              <h3 className="text-3xl font-black text-emerald-700">{formatCurrency(MOCK_FINANCIALS.recovered)}</h3>
            </div>
            <div className="h-12 w-px bg-emerald-200 hidden md:block"></div>
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Net Profit Generated</p>
              <h3 className="text-3xl font-black text-emerald-700">{formatCurrency(netProfit)}</h3>
            </div>
            <div className="h-12 w-px bg-emerald-200 hidden md:block"></div>
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Profit Margin (ROI)</p>
              <div className="inline-flex items-center justify-center bg-emerald-600 text-white font-black text-xl px-4 py-2 rounded-lg">
                {profitMargin}%
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2 & 3: Charts ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Monthly Collection Chart */}
          <div className="xl:col-span-2 erp-card p-6 border-t-4 border-t-blue-600">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Activity size={18} className="text-blue-600"/> Monthly Collection Velocity</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={MONTHLY_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis yAxisId="left" tickFormatter={(value) => `Rs ${value/1000}k`} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    formatter={(value, name) => [name === 'rate' ? `${value}%` : formatCurrency(value), name === 'due' ? 'Amount Due' : name === 'collected' ? 'Amount Collected' : 'Collection Rate']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar yAxisId="left" dataKey="due" barSize={30} fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Expected Collection" />
                  <Line yAxisId="left" type="monotone" dataKey="collected" stroke="#2563eb" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} name="Actual Collected" />
                  <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Collection Rate %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="erp-card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><PieChart size={18} className="text-blue-600"/> Category Distribution</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {CATEGORY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              {CATEGORY_DATA.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="font-medium text-slate-700">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Overdue Report ── */}
        <div className="erp-card overflow-hidden border-t-4 border-t-red-500">
          <div className="p-4 border-b border-slate-100 bg-red-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2"><AlertCircle size={18} /> High Risk: Overdue Accounts</h3>
            <button onClick={exportExcel} className="text-sm font-bold text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-50 transition-colors flex items-center gap-2">
              <Download size={14} /> CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Overdue Since</th>
                  <th className="px-6 py-4 text-center">Days Late</th>
                  <th className="px-6 py-4 text-right">Amount Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {OVERDUE_ACCOUNTS.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.customer}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{row.phone}</div>
                      <div className="text-xs text-slate-500">{row.cnic}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{row.product}</td>
                    <td className="px-6 py-4 text-slate-600">{row.overdueSince}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-red-100 text-red-800 font-bold px-2 py-1 rounded-md text-xs">{row.daysLate} Days</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-red-600">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SECTION 5 & 6: Balances & Completed ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Distributor Balances */}
          <div className="erp-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Distributor Payables</h3>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Distributor</th>
                  <th className="px-6 py-3 text-right">Balance Owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DISTRIBUTOR_BALANCES.map(d => (
                  <tr key={d.id}>
                    <td className="px-6 py-4 font-bold text-slate-900">{d.name}</td>
                    <td className="px-6 py-4 text-right">
                      {d.balance > 0 ? (
                        <span className="font-bold text-red-600">{formatCurrency(d.balance)}</span>
                      ) : (
                        <span className="font-bold text-emerald-600 flex items-center justify-end gap-1"><CheckCircle2 size={14} /> Clear</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Completed Deals Summary */}
          <div className="erp-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Completed Deals Profit</h3>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Realized Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CATEGORY_DATA.map(c => (
                  <tr key={c.name}>
                    <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(c.profit)}</td>
                  </tr>
                ))}
                <tr className="bg-emerald-50">
                  <td className="px-6 py-4 font-black text-emerald-900">Total Realized Profit</td>
                  <td className="px-6 py-4 text-right font-black text-emerald-700">
                    {formatCurrency(CATEGORY_DATA.reduce((sum, c) => sum + c.profit, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </PageWrapper>
  )
}
