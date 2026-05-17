import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, RotateCcw, RefreshCw, AlertTriangle, Package2, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import api from '@/lib/axios'
import { formatCurrency } from '@/lib/utils'

const EVENT_CONFIG = {
  purchased:          { icon: '📦', label: 'Purchased',          color: '#10b981' },
  'sold-installment': { icon: '🤝', label: 'Issued (Installment)', color: '#3b82f6' },
  'sold-cash':        { icon: '💵', label: 'Sold (Cash)',         color: '#3b82f6' },
  returned:           { icon: '🔄', label: 'Returned',            color: '#f59e0b' },
  'resold-third-party': { icon: '🔀', label: 'Resold to 3rd Party', color: '#ef4444' },
  repossessed:        { icon: '🔒', label: 'Repossessed',         color: '#6366f1' },
  're-issued':        { icon: '🤝', label: 'RE-ISSUED (New Customer)', color: '#8b5cf6' },
  'written-off':      { icon: '⚫', label: 'Written Off',         color: '#64748b' },
}

const STATUS_LABELS = {
  'in-stock':       '🟢 In Stock',
  'on-installment': '🔵 On Installment',
  'returned':       '🟡 Returned',
  'resold-other':   '🔴 Resold to Other',
  'written-off':    '⚫ Written Off',
}

export default function AssetHistory() {
  const { id } = useParams()
  const [asset, setAsset]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showResoldModal, setShowResoldModal] = useState(false)
  const [returnNote, setReturnNote] = useState('')
  const [resoldData, setResoldData] = useState({ name: '', phone: '', address: '' })
  const [saving, setSaving]         = useState(false)

  const fetchAsset = async () => {
    try {
      const r = await api.get(`/assets/${id}/history`)
      setAsset(r.data.data)
    } catch { toast.error('Asset history load nahi ho saki') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAsset() }, [id])

  const handleReturn = async () => {
    setSaving(true)
    try {
      const activeInst = asset?.linkedInstallments?.find(i => i.status === 'active' || i.status === 'near_completion')
      await api.patch(`/assets/${id}/return`, {
        installmentId: activeInst?._id,
        customerId: asset?.currentHolder?.customerId?._id,
        note: returnNote
      })
      toast.success('Asset returned successfully!')
      setShowReturnModal(false)
      fetchAsset()
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const handleResold = async () => {
    setSaving(true)
    try {
      const activeInst = asset?.linkedInstallments?.find(i => i.status === 'active' || i.status === 'near_completion')
      await api.patch(`/assets/${id}/resold`, {
        installmentId: activeInst?._id,
        customerId: asset?.currentHolder?.customerId?._id,
        thirdPartyName: resoldData.name,
        thirdPartyPhone: resoldData.phone,
        thirdPartyAddress: resoldData.address
      })
      toast.success('Asset marked as resold!')
      setShowResoldModal(false)
      fetchAsset()
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  if (loading) return <PageWrapper title="Asset History"><div className="p-12 text-center text-slate-400">Loading...</div></PageWrapper>
  if (!asset) return <PageWrapper title="Asset History"><div className="p-12 text-center text-red-400">Asset nahi mila.</div></PageWrapper>

  const history = [...(asset.history || [])].sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <PageWrapper
      title={`${asset.brand} ${asset.model}${asset.color ? ' — ' + asset.color : ''}`}
      subtitle={`Chassis: ${asset.chassisNumber || '—'} | Engine: ${asset.engineNumber || '—'}`}
    >
      <div className="mb-4">
        <Link to="/assets" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={15} /> Back to Assets
        </Link>
      </div>

      {/* Status Card */}
      <div className="erp-card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Current Status</div>
          <div className="text-xl font-black text-slate-900">{STATUS_LABELS[asset.currentStatus]}</div>
          {asset.currentHolder?.holderType === 'customer' && asset.currentHolder?.customerId && (
            <div className="text-sm text-slate-500 mt-1">With: <b>{asset.currentHolder.customerId.fullName}</b> — {asset.currentHolder.customerId.phone}</div>
          )}
          {asset.currentHolder?.holderType === 'third-party' && (
            <div className="text-sm text-slate-500 mt-1">Third Party: <b>{asset.currentHolder.thirdPartyName}</b></div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {asset.currentStatus === 'on-installment' && (
            <>
              <button onClick={() => setShowReturnModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">
                <RotateCcw size={15} /> Mark Returned
              </button>
              <button onClick={() => setShowResoldModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                <RefreshCw size={15} /> Mark Resold to 3rd Party
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <div className="erp-card p-5">
            <h3 className="font-bold text-slate-900 mb-6">Lifecycle Timeline / پوری تاریخ</h3>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-6">
                {history.map((h, i) => {
                  const cfg = EVENT_CONFIG[h.event] || { icon: '•', label: h.event, color: '#64748b' }
                  return (
                    <div key={i} className="relative flex gap-4 pl-14">
                      <div className="absolute left-2.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-base"
                        style={{ background: cfg.color + '20', borderColor: cfg.color }}>
                        <span className="text-xs">{cfg.icon}</span>
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="font-bold text-slate-900" style={{ color: cfg.color }}>{cfg.label}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        {h.customerId && <div className="text-sm text-slate-600">Customer: <b>{h.customerId.fullName}</b> — {h.customerId.phone}</div>}
                        {h.thirdPartyName && <div className="text-sm text-slate-600">Third Party: <b>{h.thirdPartyName}</b> {h.thirdPartyPhone && `— ${h.thirdPartyPhone}`}</div>}
                        {h.amountAtEvent && <div className="text-sm font-medium text-emerald-600">Amount: {formatCurrency(h.amountAtEvent)}</div>}
                        {h.note && <div className="text-xs text-slate-400 mt-1 italic">"{h.note}"</div>}
                        {h.installmentId && (
                          <div className="text-xs text-slate-400 mt-1">
                            Khata: <b>{h.installmentId.khataNumber || h.installmentId._id?.toString().slice(-6)}</b>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Linked Installments */}
        <div>
          <div className="erp-card p-5">
            <h3 className="font-bold text-slate-900 mb-4">Linked Installments ({asset.linkedInstallments?.length || 0})</h3>
            <div className="space-y-3">
              {(asset.linkedInstallments || []).map((inst, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{inst.customer?.fullName || 'Customer'}</div>
                      <div className="text-xs text-slate-400">Khata: {inst.khataNumber || '—'}</div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      inst.status === 'completed' ? 'bg-emerald-100 text-emerald-700'
                      : inst.status === 'active' ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                    }`}>{inst.status}</span>
                  </div>
                  {inst.installmentPrice && (
                    <div className="text-xs text-slate-500 mt-1">{formatCurrency(inst.installmentPrice)}</div>
                  )}
                  <Link to={`/installments/${inst._id}`}
                    className="text-xs text-blue-600 hover:underline mt-1 block">View →</Link>
                </div>
              ))}
              {!asset.linkedInstallments?.length && (
                <div className="text-sm text-slate-400 text-center py-4">Koi installment linked nahi</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 mb-4">🔄 Mark Asset as Returned</h3>
            <p className="text-sm text-slate-500 mb-4">Asset owner ke paas wapis aa gayi. Installment record update ho jayega.</p>
            <textarea value={returnNote} onChange={e => setReturnNote(e.target.value)}
              placeholder="Note (optional): Kyun waapis aayi?" rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowReturnModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleReturn} disabled={saving}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resold Modal */}
      {showResoldModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 mb-1">🔀 Mark as Resold to 3rd Party</h3>
            <p className="text-sm text-amber-600 mb-4 flex items-center gap-1.5">
              <AlertTriangle size={14} /> Installment ACTIVE rahe gi — customer abhi bhi paisa dega.
            </p>
            {['name', 'phone', 'address'].map(field => (
              <div key={field} className="mb-3">
                <label className="text-xs font-medium text-slate-600 capitalize mb-1 block">{field} of 3rd Party</label>
                <input value={resoldData[field]} onChange={e => setResoldData(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowResoldModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleResold} disabled={saving || !resoldData.name}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
