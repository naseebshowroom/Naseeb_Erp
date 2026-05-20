import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import api from '@/lib/axios'
import { formatCurrency } from '@/lib/utils'

// ── Event configuration for infinite chain ───────────────────────────────────
const EVENT_CFG = {
  'purchased':          { icon: '📦', color: '#16a34a', bg: '#f0fdf4', label: 'Purchased' },
  'sold-installment':   { icon: '🤝', color: '#2563eb', bg: '#eff6ff', label: 'Issued (Installment)' },
  'sold-cash':          { icon: '💵', color: '#2563eb', bg: '#eff6ff', label: 'Sold (Cash)' },
  'issued-installment': { icon: '🤝', color: '#2563eb', bg: '#eff6ff', label: 'Issued (Installment)' },
  'issued-cash':        { icon: '💵', color: '#2563eb', bg: '#eff6ff', label: 'Sold (Cash)' },
  'resold-third-party': { icon: '🔄', color: '#f59e0b', bg: '#fffbeb', label: 'Resold to 3rd Party' },
  'resold-3rd-party':   { icon: '🔄', color: '#f59e0b', bg: '#fffbeb', label: 'Resold to 3rd Party' },
  'resold-nth-party':   { icon: '🔄', color: '#f59e0b', bg: '#fffbeb', label: 'Resold to Next Party' },
  'returned':           { icon: '⬅️', color: '#0891b2', bg: '#ecfeff', label: 'Returned to Owner' },
  'returned-to-owner':  { icon: '⬅️', color: '#0891b2', bg: '#ecfeff', label: 'Returned to Owner' },
  'repossessed':        { icon: '⚠️', color: '#dc2626', bg: '#fef2f2', label: 'Repossessed' },
  're-issued':          { icon: '🔁', color: '#7c3aed', bg: '#f5f3ff', label: 'Re-Issued' },
  'written-off':        { icon: '❌', color: '#6b7280', bg: '#f9fafb', label: 'Written Off' },
}

// ── Inline ResoldModal ────────────────────────────────────────────────────────
function ResoldModal({ asset, onClose, onSuccess }) {
  const chainPosition = (asset.totalHolderCount || 1) + 1
  const partyLabel = chainPosition === 3 ? '3rd Party' : chainPosition === 4 ? '4th Party' : `Party #${chainPosition}`
  const activeInst = asset.linkedInstallments?.find(i => i.status === 'active' || i.status === 'near_completion')

  const [form, setForm] = useState({
    thirdPartyName: '', thirdPartyPhone: '', thirdPartyAddress: '',
    soldByName: '', note: '', installmentId: activeInst?._id || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.thirdPartyName.trim() || !form.thirdPartyPhone.trim()) {
      toast.error('Naam aur phone number zaruri hain')
      return
    }
    setLoading(true)
    try {
      await api.patch(`/assets/${asset._id}/resold-next`, form)
      toast.success(`Asset sold to ${form.thirdPartyName} (${partyLabel})`)
      onSuccess()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px' }}>
      <div style={{ background:'white',borderRadius:'14px',padding:'24px',width:'100%',maxWidth:'460px',boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin:'0 0 4px',fontSize:'18px',fontWeight:'700' }}>🔄 Asset Aagay Bech Diya</h3>
        <p style={{ margin:'0 0 16px',fontSize:'13px',color:'#64748b' }}>{asset.brand} {asset.model} — Chain Position #{chainPosition} ({partyLabel})</p>

        {[
          { key:'thirdPartyName', label:`${partyLabel} ka Naam *`, ph:'Naye holder ka naam' },
          { key:'thirdPartyPhone', label:'Phone Number *', ph:'0300-0000000' },
          { key:'thirdPartyAddress', label:'Address (Optional)', ph:'' },
          { key:'soldByName', label:'Kisne Becha (Optional)', ph:'e.g. Atta Muhammad' },
          { key:'note', label:'Note (Optional)', ph:'' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom:'10px' }}>
            <label style={{ fontSize:'12px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'3px' }}>{f.label}</label>
            <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph}
              style={{ width:'100%',padding:'8px 10px',border:'1px solid #e2e8f0',borderRadius:'7px',fontSize:'13px',boxSizing:'border-box' }} />
          </div>
        ))}

        <div style={{ background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'7px',padding:'9px 12px',fontSize:'12px',color:'#92400e',marginBottom:'16px' }}>
          ⚠️ Installment active rahega. Original customer ka qist account band nahi hoga.
        </div>

        <div style={{ display:'flex',gap:'8px' }}>
          <button onClick={onClose} style={{ flex:1,padding:'10px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',fontWeight:'600' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex:2,padding:'10px',background:'#f59e0b',color:'white',border:'none',borderRadius:'8px',fontWeight:'700',cursor:'pointer',opacity:loading?0.6:1 }}>
            {loading ? 'Saving...' : `Confirm — Sold to ${partyLabel}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inline ReturnedModal ──────────────────────────────────────────────────────
function ReturnedModal({ asset, onClose, onSuccess }) {
  const activeInst = asset.linkedInstallments?.find(i => i.status === 'active' || i.status === 'near_completion')
  const [form, setForm] = useState({
    returnedBy: '', returnedByPhone: '', isRepossession: false,
    condition: 'good', reason: 'voluntary', note: '', installmentId: activeInst?._id || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await api.patch(`/assets/${asset._id}/returned`, form)
      toast.success('Asset returned to owner!')
      onSuccess()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving')
    } finally { setLoading(false) }
  }

  const inputStyle = { width:'100%',padding:'8px 10px',border:'1px solid #e2e8f0',borderRadius:'7px',fontSize:'13px',boxSizing:'border-box' }
  const labelStyle = { fontSize:'12px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'3px' }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px' }}>
      <div style={{ background:'white',borderRadius:'14px',padding:'24px',width:'100%',maxWidth:'460px',boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin:'0 0 16px',fontSize:'18px',fontWeight:'700' }}>⬅️ Asset Wapas Aa Gaya</h3>

        <div style={{ marginBottom:'10px' }}><label style={labelStyle}>Kisne Wapas Kiya?</label>
          <input value={form.returnedBy} onChange={e => set('returnedBy',e.target.value)} placeholder="Naam" style={inputStyle} /></div>

        <div style={{ marginBottom:'10px' }}><label style={labelStyle}>Phone</label>
          <input value={form.returnedByPhone} onChange={e => set('returnedByPhone',e.target.value)} placeholder="0300-0000000" style={inputStyle} /></div>

        <div style={{ marginBottom:'10px' }}><label style={labelStyle}>Wapasi ki Wajah</label>
          <select value={form.reason} onChange={e => set('reason',e.target.value)} style={inputStyle}>
            <option value="voluntary">Khud wapas kiya</option>
            <option value="repossession">Humne wapas liya (Default)</option>
            <option value="deal-cancelled">Deal cancel</option>
            <option value="upgrade">Naya liya, purana wapas</option>
          </select></div>

        <div style={{ marginBottom:'10px' }}><label style={labelStyle}>Asset ki Halat</label>
          <select value={form.condition} onChange={e => set('condition',e.target.value)} style={inputStyle}>
            <option value="good">Theek hai</option>
            <option value="damaged">Kuch nuqsan hai</option>
            <option value="needs-repair">Repair chahiye</option>
          </select></div>

        <div style={{ marginBottom:'12px' }}>
          <label style={{ display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'600',color:'#dc2626' }}>
            <input type="checkbox" checked={form.isRepossession} onChange={e => set('isRepossession',e.target.checked)} />
            Yeh repossession tha (humne zabardasti wapas liya)
          </label>
        </div>

        <div style={{ marginBottom:'16px' }}><label style={labelStyle}>Note (Optional)</label>
          <input value={form.note} onChange={e => set('note',e.target.value)} placeholder="Koi khas baat?" style={inputStyle} /></div>

        <div style={{ display:'flex',gap:'8px' }}>
          <button onClick={onClose} style={{ flex:1,padding:'10px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',fontWeight:'600' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex:2,padding:'10px',background:'#16a34a',color:'white',border:'none',borderRadius:'8px',fontWeight:'700',cursor:'pointer',opacity:loading?0.6:1 }}>
            {loading ? 'Saving...' : '✅ Confirm — Wapas Aa Gaya'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main AssetHistory component ───────────────────────────────────────────────
export default function AssetHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [asset, setAsset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showResoldModal, setShowResoldModal] = useState(false)
  const [showReturnedModal, setShowReturnedModal] = useState(false)

  const fetchAsset = async () => {
    setLoading(true)
    try {
      const r = await api.get(`/assets/${id}/history`)
      setAsset(r.data.data)
    } catch { toast.error('Asset history load nahi ho saki') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAsset() }, [id])

  // Auto-open modal from ?action= query param (used by AssetsPage quick buttons)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const action = params.get('action')
    if (action === 'resold') setShowResoldModal(true)
    if (action === 'returned') setShowReturnedModal(true)
  }, [location.search])

  if (loading) return <PageWrapper title="Asset History"><div className="p-12 text-center text-slate-400">Loading...</div></PageWrapper>
  if (!asset) return <PageWrapper title="Asset History"><div className="p-12 text-center text-red-400">Asset nahi mila.</div></PageWrapper>

  const sorted = [...(asset.history || [])].sort((a, b) => new Date(a.eventDate || a.date) - new Date(b.eventDate || b.date))

  // ── Status Banner ──────────────────────────────────────────────────────────
  const bannerBtnBase = { border:'none',borderRadius:'8px',padding:'8px 15px',fontWeight:'700',fontSize:'13px',cursor:'pointer' }

  const StatusBanner = () => {
    const s = asset.currentStatus
    const holder = asset.currentHolder
    const isAvailable = s === 'returned' || s === 'repossessed' || s === 'in-stock'

    if (isAvailable) return (
      <div style={{ background:'#f0fdf4',border:'1.5px solid #16a34a',borderRadius:'10px',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px',marginBottom:'20px' }}>
        <div>
          <div style={{ fontSize:'16px',fontWeight:'700',color:'#15803d' }}>
            {s === 'repossessed' ? '✅ WAPAS LE LIYA GAYA — Available' : '✅ YEH ASSET AAPKE PAAS HAI — Issue karne ke liye tayar'}
          </div>
          <div style={{ fontSize:'12px',color:'#166534',marginTop:'2px' }}>Chassis: {asset.chassisNumber || '—'} | Chain holders: {asset.totalHolderCount || 1}</div>
        </div>
        <div style={{ display:'flex',gap:'8px' }}>
          <button onClick={() => navigate(`/installments/new?chassisNumber=${asset.chassisNumber || ''}&assetId=${asset._id}`)}
            style={{ ...bannerBtnBase,background:'#16a34a',color:'white' }}>➕ Installment Par De Dein</button>
          <button onClick={() => navigate(`/installments/new?assetId=${asset._id}&isCashSale=true`)}
            style={{ ...bannerBtnBase,background:'#2563eb',color:'white' }}>💵 Cash Sale</button>
        </div>
      </div>
    )

    if (s === 'on-installment') return (
      <div style={{ background:'#eff6ff',border:'1.5px solid #2563eb',borderRadius:'10px',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px',marginBottom:'20px' }}>
        <div>
          <div style={{ fontSize:'16px',fontWeight:'700',color:'#1d4ed8' }}>🔵 ON INSTALLMENT</div>
          <div style={{ fontSize:'12px',color:'#1e40af',marginTop:'2px' }}>
            Current holder: <strong>{holder?.customerId?.fullName || 'Customer'}</strong>
            {holder?.customerId?.phone && ` — ${holder.customerId.phone}`}
          </div>
        </div>
        <div style={{ display:'flex',gap:'8px' }}>
          <button onClick={() => setShowResoldModal(true)} style={{ ...bannerBtnBase,background:'#f59e0b',color:'white' }}>🔄 Customer ne Bech Diya</button>
          <button onClick={() => setShowReturnedModal(true)} style={{ ...bannerBtnBase,background:'#0f172a',color:'white' }}>⬅️ Wapas Aa Gaya</button>
        </div>
      </div>
    )

    if (s === 'resold-other') return (
      <div style={{ background:'#fffbeb',border:'1.5px solid #f59e0b',borderRadius:'10px',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px',marginBottom:'20px' }}>
        <div>
          <div style={{ fontSize:'16px',fontWeight:'700',color:'#92400e' }}>🔄 RESOLD — {holder?.thirdPartyName || 'Unknown'}</div>
          <div style={{ fontSize:'12px',color:'#78350f',marginTop:'2px' }}>
            Phone: {holder?.thirdPartyPhone || '—'} | Chain position #{asset.totalHolderCount || '?'}
          </div>
        </div>
        <div style={{ display:'flex',gap:'8px' }}>
          <button onClick={() => setShowResoldModal(true)} style={{ ...bannerBtnBase,background:'#f59e0b',color:'white' }}>🔄 Aur Aagay Bech Diya</button>
          <button onClick={() => setShowReturnedModal(true)} style={{ ...bannerBtnBase,background:'#16a34a',color:'white' }}>⬅️ Mere Paas Wapas Aa Gaya</button>
        </div>
      </div>
    )

    return null
  }

  // ── Timeline ────────────────────────────────────────────────────────────────
  const Timeline = () => (
    <div style={{ position:'relative',paddingLeft:'40px' }}>
      <div style={{ position:'absolute',left:'15px',top:'8px',bottom:'8px',width:'2px',background:'#e2e8f0' }} />
      {sorted.map((entry, i) => {
        const cfg = EVENT_CFG[entry.event] || { icon:'●',color:'#64748b',bg:'#f8fafc',label:entry.event }
        const d = entry.eventDate || entry.date
        const pos = entry.chainPosition || (i + 1)
        return (
          <div key={entry._id || i} style={{ position:'relative',marginBottom:'14px' }}>
            <div style={{ position:'absolute',left:'-32px',top:'12px',width:'28px',height:'28px',borderRadius:'50%',background:cfg.bg,border:`2px solid ${cfg.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',zIndex:1 }}>
              {cfg.icon}
            </div>
            <div style={{ background:cfg.bg,border:`1px solid ${cfg.color}30`,borderRadius:'8px',padding:'11px 14px' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'4px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                  <span style={{ background:cfg.color,color:'white',fontSize:'10px',fontWeight:'700',padding:'1px 7px',borderRadius:'10px' }}>#{pos}</span>
                  <span style={{ fontWeight:'700',color:cfg.color,fontSize:'14px' }}>{cfg.label}</span>
                </div>
                <span style={{ fontSize:'11px',color:'#64748b' }}>
                  {d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                </span>
              </div>
              <div style={{ marginTop:'5px',fontSize:'12px',color:'#374151',display:'flex',flexDirection:'column',gap:'2px' }}>
                {entry.customerName && <span>Customer: <strong>{entry.customerName}</strong></span>}
                {entry.customerId?.fullName && <span>Customer: <strong>{entry.customerId.fullName}</strong>{entry.customerId.phone && ` — ${entry.customerId.phone}`}</span>}
                {entry.thirdPartyName && (
                  <span>
                    {(entry.event.includes('return') || entry.event === 'repossessed') ? 'Returned by' : 'Sold to'}:{' '}
                    <strong>{entry.thirdPartyName}</strong>
                    {entry.thirdPartyPhone && ` — ${entry.thirdPartyPhone}`}
                    {entry.thirdPartyAddress && ` | ${entry.thirdPartyAddress}`}
                  </span>
                )}
                {entry.installmentId && (
                  <span
                    onClick={() => navigate(`/installments/${entry.installmentId?._id || entry.installmentId}`)}
                    style={{ fontSize:'11px',color:'#2563eb',cursor:'pointer',textDecoration:'underline' }}>
                    Installment: {entry.installmentId?.khataNumber || 'View →'}
                  </span>
                )}
                {entry.amountAtEvent > 0 && <span style={{ color:'#16a34a',fontWeight:'600' }}>Amount: {formatCurrency(entry.amountAtEvent)}</span>}
                {entry.note && <span style={{ color:'#6b7280',fontStyle:'italic' }}>"{entry.note}"</span>}
              </div>
            </div>
          </div>
        )
      })}
      {/* Chain continues indicator */}
      <div style={{ position:'relative',marginTop:'4px' }}>
        <div style={{ position:'absolute',left:'-32px',top:'6px',width:'28px',height:'28px',borderRadius:'50%',background:'#f8fafc',border:'2px dashed #94a3b8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#94a3b8' }}>…</div>
        <div style={{ padding:'10px 14px',border:'1px dashed #94a3b8',borderRadius:'8px',fontSize:'12px',color:'#94a3b8',fontStyle:'italic' }}>
          Chain continues… (Total holders so far: {asset.totalHolderCount || 1})
        </div>
      </div>
    </div>
  )

  return (
    <PageWrapper title={`${asset.brand || ''} ${asset.model || ''}${asset.color ? ' — ' + asset.color : ''}`}
      subtitle={`Chassis: ${asset.chassisNumber || '—'} | Engine: ${asset.engineNumber || '—'}`}>
      <div className="mb-4">
        <Link to="/assets" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={15} /> Back to Assets
        </Link>
      </div>

      <StatusBanner />

      <div style={{ display:'grid',gridTemplateColumns:'1fr 300px',gap:'20px',alignItems:'start' }} className="max-lg:grid-cols-1">
        {/* Timeline */}
        <div className="erp-card p-5">
          <h3 className="font-bold text-slate-900 mb-5">Lifecycle Timeline / پوری تاریخ</h3>
          {sorted.length === 0
            ? <p className="text-sm text-slate-400 text-center py-6">Koi history entry nahi hai.</p>
            : <Timeline />
          }
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Asset info card */}
          <div className="erp-card p-4">
            <h4 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Asset Info</h4>
            <div className="space-y-1.5 text-sm">
              {[
                ['Type', asset.assetType],
                ['Brand', asset.brand],
                ['Model', asset.model],
                ['Color', asset.color],
                ['Year', asset.year],
                ['Chassis #', asset.chassisNumber],
                ['Engine #', asset.engineNumber],
                ['Chain Holders', asset.totalHolderCount || 1],
                ['History Entries', asset.history?.length || 0],
              ].map(([k, v]) => v ? (
                <div key={k} className="flex gap-2">
                  <span className="text-slate-400 min-w-[100px]">{k}</span>
                  <span className="font-medium text-slate-800">{v}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Linked installments */}
          <div className="erp-card p-4">
            <h4 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">
              Linked Installments ({asset.linkedInstallments?.length || 0})
            </h4>
            <div className="space-y-2">
              {(asset.linkedInstallments || []).map((inst, i) => (
                <div key={inst._id || i} className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{inst.customer?.fullName || 'Customer'}</div>
                      <div className="text-xs text-slate-400">Khata: {inst.khataNumber || '—'}</div>
                      {inst.installmentPrice && <div className="text-xs text-slate-500">{formatCurrency(inst.installmentPrice)}</div>}
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      inst.status === 'completed' ? 'bg-emerald-100 text-emerald-700'
                      : inst.status === 'active' ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'}`}>{inst.status}</span>
                  </div>
                  <Link to={`/installments/${inst._id}`} className="text-xs text-blue-600 hover:underline mt-1 block">View →</Link>
                </div>
              ))}
              {!asset.linkedInstallments?.length && <p className="text-sm text-slate-400 text-center py-3">Koi installment linked nahi</p>}
            </div>
          </div>
        </div>
      </div>

      {showResoldModal && (
        <ResoldModal asset={asset} onClose={() => setShowResoldModal(false)} onSuccess={() => { setShowResoldModal(false); fetchAsset() }} />
      )}
      {showReturnedModal && (
        <ReturnedModal asset={asset} onClose={() => setShowReturnedModal(false)} onSuccess={() => { setShowReturnedModal(false); fetchAsset() }} />
      )}
    </PageWrapper>
  )
}
