import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Building2, Phone, MapPin, Package, 
  Wallet, CheckCircle2, AlertCircle, Edit, ArrowUpRight
} from 'lucide-react'
import PageWrapper from '@/components/ui/PageWrapper'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const DIST_DATA = {
  id: 1,
  name: 'Ali Khan',
  company: 'Ali Traders',
  phone: '0300-1122334',
  address: 'Main Auto Market, Multan',
  cnic: '36302-1234567-1',
  
  financials: {
    totalSuppliedValue: 1200000,
    amountPaid: 950000,
    balanceOwed: 250000,
  },
  
  supplyHistory: [
    { id: 101, date: '2026-05-10', item: 'Honda CD 70', qty: 5, unitPrice: 155000, total: 775000, status: 'partial' },
    { id: 102, date: '2026-04-15', item: 'Honda CG 125', qty: 2, unitPrice: 212500, total: 425000, status: 'paid' },
  ],

  itemsGivenOut: [
    { id: 501, item: 'Honda CD 70', engineNo: 'E-12345', customer: 'Muhammad Asif', date: '2026-05-11' },
    { id: 502, item: 'Honda CD 70', engineNo: 'E-67890', customer: 'Tariq Mehmood', date: '2026-05-12' },
    { id: 503, item: 'Honda CG 125', engineNo: 'E-54321', customer: 'Sana Bibi', date: '2026-04-16' },
  ]
}

export default function DistributorDetail() {
  const { id } = useParams()
  const data = DIST_DATA // In reality, fetch by id
  
  return (
    <PageWrapper 
      title={data.company}
      breadcrumbs={[{ label: 'Distributors', to: '/distributors' }, { label: data.name }]}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <Edit size={16} /> Edit Details
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
            <Wallet size={16} /> Record Payment
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Left Column: Profile & Financials ── */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="erp-card p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-blue-50 to-white"></div>
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 relative z-10 shadow-sm">
              <Building2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{data.company}</h2>
            <p className="text-sm font-medium text-blue-600 mb-4">{data.name}</p>
            
            <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <span>{data.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{data.address}</span>
              </div>
            </div>
          </div>

          <div className={`erp-card p-6 text-white ${data.financials.balanceOwed > 0 ? 'bg-gradient-to-br from-red-900 to-red-800' : 'bg-gradient-to-br from-emerald-900 to-emerald-800'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wallet className="opacity-70" size={20} /> Outstanding Balance
            </h3>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <span className="block text-white/60 text-xs uppercase tracking-wider mb-1">Payable to Distributor</span>
                <span className="text-3xl font-black">{formatCurrency(data.financials.balanceOwed)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">Total Supplied</span>
                  <span className="font-bold">{formatCurrency(data.financials.totalSuppliedValue)}</span>
                </div>
                <div>
                  <span className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">Total Paid</span>
                  <span className="font-bold">{formatCurrency(data.financials.amountPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: History & Track ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Supply History Table */}
          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="text-blue-600" size={20} /> Supply History (Invoices)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Item Provided</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                    <th className="px-6 py-3 text-right">Total Invoice</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.supplyHistory.map((supply) => (
                    <tr key={supply.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{formatDate(supply.date)}</td>
                      <td className="px-6 py-4 text-slate-600">{supply.item}</td>
                      <td className="px-6 py-4 text-center font-bold">{supply.qty}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(supply.total)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge 
                          status={supply.status === 'paid' ? 'completed' : supply.status === 'partial' ? 'active' : 'pending'} 
                          label={supply.status} 
                          size="sm" 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Given out to customers tracker */}
          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="text-emerald-600" size={20} /> Items Assigned to Customers
              </h3>
              <p className="text-xs text-slate-500 mt-1">Track which specific items from this distributor went to which customer.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Date Assigned</th>
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3">Engine / Serial No.</th>
                    <th className="px-6 py-3">Customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.itemsGivenOut.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-600">{formatDate(item.date)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{item.item}</td>
                      <td className="px-6 py-4 font-mono text-slate-500">{item.engineNo}</td>
                      <td className="px-6 py-4 font-medium text-blue-600 hover:underline cursor-pointer">{item.customer}</td>
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
