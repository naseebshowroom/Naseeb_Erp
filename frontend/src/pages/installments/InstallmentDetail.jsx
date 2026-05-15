import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  Package, Calendar, Wallet, CheckCircle2, 
  Clock, AlertCircle, Edit, Printer, ChevronRight, User
} from 'lucide-react'
import PageWrapper from '@/components/ui/PageWrapper'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const INSTALLMENT_DATA = {
  id: 1,
  customer: { id: 1, name: 'Muhammad Asif', cnic: '34201-1234567-1', phone: '0300-1234567' },
  product: {
    category: 'Motorcycle',
    brand: 'Honda',
    model: 'CD 70',
    color: 'Red',
    engineNo: 'E-987654321',
    chassisNo: 'C-123456789',
  },
  financials: {
    purchasePrice: 160000,
    salePrice: 210000,
    advance: 30000,
    totalRemaining: 87500,
    totalPaid: 92500,
    profit: 50000,
  },
  schedule: {
    type: 'monthly',
    installmentsCount: 24,
    perInstallment: 7500,
    startDate: '2025-01-01',
  },
  status: 'active',
  
  payments: [
    { id: 501, date: '2026-05-01', amount: 7500, collector: 'Raheem Bux', receipt: 'REC-0501' },
    { id: 502, date: '2026-04-01', amount: 7500, collector: 'Raheem Bux', receipt: 'REC-0401' },
    { id: 503, date: '2026-03-01', amount: 7500, collector: 'Office', receipt: 'REC-0301' },
  ],
  
  upcomingSchedule: [
    { id: 1, dueDate: '2026-06-01', amount: 7500, status: 'upcoming' },
    { id: 2, dueDate: '2026-07-01', amount: 7500, status: 'upcoming' },
    { id: 3, dueDate: '2026-08-01', amount: 7500, status: 'upcoming' },
  ]
}

export default function InstallmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = INSTALLMENT_DATA // Fetch by id in reality

  return (
    <PageWrapper 
      title={`Installment #INST-${data.id}`}
      breadcrumbs={[{ label: 'Installments', to: '/installments' }, { label: `Details` }]}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={16} /> Print Agreement
          </button>
          <Link to={`/installments/${data.id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <Edit size={16} /> Edit
          </Link>
          <button onClick={() => navigate('/payments')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
            <Wallet size={16} /> Collect Payment
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Left Column: Product & Financials ── */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="erp-card p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="text-blue-600" size={20} /> Product Info
              </h3>
              <StatusBadge status={data.status} />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="font-medium text-slate-900">{data.product.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Item</span>
                <span className="font-bold text-slate-900">{data.product.brand} {data.product.model}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Color</span>
                <span className="font-medium text-slate-900">{data.product.color}</span>
              </div>
              {data.product.engineNo && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Engine No.</span>
                  <span className="font-mono text-slate-900">{data.product.engineNo}</span>
                </div>
              )}
              {data.product.chassisNo && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Chassis No.</span>
                  <span className="font-mono text-slate-900">{data.product.chassisNo}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to={`/customers/${data.customer.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {data.customer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{data.customer.name}</p>
                    <p className="text-xs text-slate-500">{data.customer.phone}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600" />
              </Link>
            </div>
          </div>

          <div className="erp-card p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wallet className="text-blue-400" size={20} /> Financial Summary
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Total Sale Price</span>
                <span className="text-2xl font-black text-white">{formatCurrency(data.financials.salePrice)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/50">
                  <span className="block text-emerald-400 text-xs uppercase tracking-wider mb-1">Total Paid</span>
                  <span className="text-lg font-bold text-emerald-100">{formatCurrency(data.financials.totalPaid)}</span>
                </div>
                <div className="bg-red-900/30 p-3 rounded-xl border border-red-800/50">
                  <span className="block text-red-400 text-xs uppercase tracking-wider mb-1">Remaining</span>
                  <span className="text-lg font-bold text-red-100">{formatCurrency(data.financials.totalRemaining)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-700 text-sm">
                <span className="text-slate-400">Advance Paid</span>
                <span className="font-bold">{formatCurrency(data.financials.advance)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-slate-400">Owner Profit</span>
                <span className="font-bold text-blue-300">{formatCurrency(data.financials.profit)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right Column: Schedule & History ── */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} /> Payment Schedule
              </h3>
              <div className="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                {formatCurrency(data.schedule.perInstallment)} / {data.schedule.type}
              </div>
            </div>
            
            <div className="p-6">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Upcoming Dues</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.upcomingSchedule.map((schedule, idx) => (
                  <div key={schedule.id} className={`p-4 rounded-xl border ${idx === 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <Clock size={16} className={idx === 0 ? 'text-amber-500' : 'text-slate-400'} />
                      {idx === 0 && <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded uppercase tracking-wider">Next</span>}
                    </div>
                    <div className={`text-lg font-black ${idx === 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                      {formatCurrency(schedule.amount)}
                    </div>
                    <div className="text-xs font-medium text-slate-500 mt-1">
                      Due: {formatDate(schedule.dueDate)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={20} /> Payment History
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Receipt No</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Collector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{formatDate(payment.date)}</td>
                      <td className="px-6 py-4 text-blue-600 font-medium">{payment.receipt}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 text-slate-500">{payment.collector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </PageWrapper>
  )
}
