import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, Plus, Filter, Download, 
  Eye, Edit, Truck, Building2
} from 'lucide-react'
import PageWrapper from '@/components/ui/PageWrapper'
import { formatCurrency } from '@/lib/utils'

// ── Dummy Data ─────────────────────────────────────────────
const MOCK_DISTRIBUTORS = [
  { id: 1, name: 'Ali Khan', company: 'Ali Traders', phone: '0300-1122334', totalSupplied: 45, amountOwed: 250000, lastTransaction: '2026-05-10' },
  { id: 2, name: 'Zafar Iqbal', company: 'Zafar Autos', phone: '0311-9988776', totalSupplied: 120, amountOwed: 0, lastTransaction: '2026-04-25' },
  { id: 3, name: 'Haji Aslam', company: 'Aslam Electronics', phone: '0333-5566778', totalSupplied: 85, amountOwed: 500000, lastTransaction: '2026-05-12' },
]

export default function DistributorsPage() {
  const navigate = useNavigate()
  const [data] = useState(MOCK_DISTRIBUTORS)
  const [search, setSearch] = useState('')

  const filteredData = data.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageWrapper 
      title="Distributors" 
      subtitle="Manage your suppliers, track stock received, and monitor outstanding balances."
      actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Add Distributor
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Distributors</p>
            <h3 className="text-2xl font-black text-slate-900">{data.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Truck size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Payable Owed</p>
            <h3 className="text-2xl font-black text-red-600">{formatCurrency(750000)}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600"><Building2 size={20} /></div>
        </div>
      </div>

      <div className="erp-card overflow-hidden">
        {/* ── Toolbar ── */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or company..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={16} /> Export List
          </button>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Company Details</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4 text-center">Total Supplied Items</th>
                <th className="px-6 py-4 text-right">Amount Owed (Payable)</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{row.company}</div>
                    <div className="text-xs text-slate-500">Last Tx: {row.lastTransaction}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-700">
                    <span className="bg-slate-100 px-3 py-1 rounded-full">{row.totalSupplied} items</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`font-bold ${row.amountOwed > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(row.amountOwed)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => navigate(`/distributors/${row.id}`)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
