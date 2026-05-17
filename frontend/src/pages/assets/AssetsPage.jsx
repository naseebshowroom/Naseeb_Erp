import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle2, AlertTriangle, Search, Filter } from 'lucide-react'
import PageWrapper from '@/components/ui/PageWrapper'
import api from '@/lib/axios'
import { formatCurrency } from '@/lib/utils'

const STATUS_CONFIG = {
  'in-stock':       { label: 'In Stock',        color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'on-installment': { label: 'On Installment',   color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  'returned':       { label: 'Returned',          color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
  'resold-other':   { label: 'Resold to Other',  color: 'bg-red-100 text-red-700',         dot: 'bg-red-500' },
  'written-off':    { label: 'Written Off',       color: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-400' },
}

export default function AssetsPage() {
  const [assets, setAssets]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [search, setSearch]         = useState('')

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const r = await api.get(`/assets${params}`)
      setAssets(r.data.data || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAssets() }, [filter])

  const filtered = assets.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (a.chassisNumber||'').toLowerCase().includes(q)
        || (a.engineNumber||'').toLowerCase().includes(q)
        || (a.brand||'').toLowerCase().includes(q)
        || (a.model||'').toLowerCase().includes(q)
  })

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'in-stock', label: '🟢 In Stock' },
    { id: 'on-installment', label: '🔵 On Installment' },
    { id: 'returned', label: '🟡 Returned' },
    { id: 'resold-other', label: '🔴 Resold to Other' },
  ]

  return (
    <PageWrapper title="Assets / Inventory" subtitle="Sab physical items ki poori history ek jagah">
      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${filter === f.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chassis / Engine / Brand search..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>

      {/* Table */}
      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading assets...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  {['Item', 'Chassis #', 'Engine #', 'Color', 'Status', 'Current Holder', 'Times Issued', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length > 0 ? filtered.map(asset => {
                  const cfg = STATUS_CONFIG[asset.currentStatus] || STATUS_CONFIG['in-stock']
                  return (
                    <tr key={asset._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{asset.brand} {asset.model}</div>
                        <div className="text-xs text-slate-400 capitalize">{asset.assetType}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">{asset.chassisNumber || '—'}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{asset.engineNumber || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{asset.color || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {asset.currentHolder?.holderType === 'customer'
                          ? asset.currentHolder?.customerId?.fullName || 'Customer'
                          : asset.currentHolder?.holderType === 'third-party'
                            ? asset.currentHolder?.thirdPartyName || 'Third Party'
                            : 'Owner'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded">
                          {asset.linkedInstallments?.length || 0}×
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/assets/${asset._id}/history`}
                          className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                          View History
                        </Link>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Package size={36} className="mx-auto mb-2 opacity-30" />
                    Koi asset nahi mila.
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
