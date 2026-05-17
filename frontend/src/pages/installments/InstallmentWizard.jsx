import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Check, AlertTriangle, Info, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { formatCurrency } from '@/lib/utils'

const STEPS = ['Customer', 'Product', 'Schedule', 'Review']

const INVESTOR_OPTIONS = ['Owner', 'Partner-Brother', 'Partner-1', 'Partner-2', 'Other']
const CATEGORIES = ['motorcycle', 'car', 'mobile', 'ac', 'lcd', 'fridge', 'washing_machine', 'other']
const SCHEDULE_TYPES = ['daily', 'weekly', '5-day', '10-day', 'monthly']
const ASSET_STATUSES = ['In-Use', 'Returned', 'Resold-to-Other']

const INIT = {
  // Customer
  fullName: '', fatherName: '', cnic: '', phone: '', city: '', address: '',
  khataNumber: '', investorName: 'Owner',
  // Product
  category: 'motorcycle', customCategory: '', brand: '', model: '', color: '',
  engineNumber: '', chassisNumber: '', serialNumber: '', condition: 'new',
  distributor: '', purchasePrice: '', installmentPrice: '',
  isCashSale: false, registrationFee: '',
  assetStatus: 'In-Use', resoldToName: '', resoldToPhone: '',
  // asset lifecycle
  assetId: '', assetConflictNote: '',
  // Schedule
  advanceAmount: '', noAdvance: false,
  perInstallmentAmount: '', totalInstallments: '', openEnded: false,
  scheduleType: 'monthly', startDate: new Date().toISOString().split('T')[0],
  // Notes
  notes: ''
}

export default function InstallmentWizard() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(0)
  const [form, setForm]         = useState(INIT)
  const [saving, setSaving]     = useState(false)
  const [distributors, setDistributors] = useState([])

  // Chassis detection state
  const [chassisSearch, setChassisSearch] = useState({ loading: false, found: null, conflict: false })
  const chassisTimer = useRef(null)

  useEffect(() => {
    api.get('/distributors').then(r => setDistributors(r.data.data || [])).catch(() => {})
  }, [])

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  // Debounced chassis lookup
  const onChassisChange = (val) => {
    set('chassisNumber', val)
    set('assetId', '')
    setChassisSearch({ loading: false, found: null, conflict: false })
    clearTimeout(chassisTimer.current)
    if (!val || val.length < 4) return
    chassisTimer.current = setTimeout(async () => {
      setChassisSearch(p => ({ ...p, loading: true }))
      try {
        const r = await api.get(`/assets/search?chassis=${encodeURIComponent(val)}`)
        const assets = r.data.data || []
        if (assets.length === 0) {
          setChassisSearch({ loading: false, found: null, conflict: false })
        } else {
          const asset = assets[0]
          const conflict = asset.currentStatus === 'on-installment'
          setChassisSearch({ loading: false, found: asset, conflict })
        }
      } catch {
        setChassisSearch({ loading: false, found: null, conflict: false })
      }
    }, 600)
  }

  const useExistingAsset = () => {
    set('assetId', chassisSearch.found._id)
    toast.success('Existing asset record linked!')
  }

  const effectiveStep = form.isCashSale && step >= 2 ? step + 1 : step
  const maxSteps = form.isCashSale ? 3 : 4

  const next = () => {
    if (form.isCashSale && step === 1) { setStep(3); return }
    setStep(s => Math.min(s + 1, maxSteps - 1))
  }
  const prev = () => {
    if (form.isCashSale && step === 3) { setStep(1); return }
    setStep(s => Math.max(s - 1, 0))
  }

  const submit = async () => {
    setSaving(true)
    try {
      const payload = {
        customer: {
          fullName: form.fullName, fatherName: form.fatherName,
          ...(form.cnic ? { cnic: form.cnic } : {}),
          phone: form.phone, city: form.city, address: form.address,
          khataNumber: form.khataNumber,
        },
        khataNumber:      form.khataNumber,
        investorName:     form.investorName,
        category:         form.category,
        customCategory:   form.customCategory,
        brand: form.brand, model: form.model, color: form.color,
        engineNumber: form.engineNumber, chassisNumber: form.chassisNumber,
        serialNumber: form.serialNumber, condition: form.condition,
        distributor: form.distributor || undefined,
        purchasePrice:    Number(form.purchasePrice),
        installmentPrice: Number(form.installmentPrice),
        isCashSale:       form.isCashSale,
        registrationFee:  Number(form.registrationFee) || 0,
        assetStatus:      form.assetStatus,
        ...(form.assetStatus === 'Resold-to-Other' ? { resoldToName: form.resoldToName, resoldToPhone: form.resoldToPhone } : {}),
        assetId:          form.assetId || undefined,
        ...(form.assetConflictNote ? { assetConflictNote: form.assetConflictNote } : {}),
        advanceAmount:    form.noAdvance ? 0 : Number(form.advanceAmount) || 0,
        perInstallmentAmount: Number(form.perInstallmentAmount) || undefined,
        totalInstallments: form.openEnded ? undefined : Number(form.totalInstallments) || undefined,
        scheduleType:     form.isCashSale ? undefined : form.scheduleType,
        startDate:        form.isCashSale ? undefined : form.startDate,
        notes:            form.notes,
      }
      const r = await api.post('/installments', payload)
      toast.success('Installment successfully bana di!')
      navigate(`/installments/${r.data.data._id}`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error')
    } finally { setSaving(false) }
  }

  const Input = ({ label, field, type = 'text', placeholder, required, hint }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={form[field]} onChange={e => set(field, e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )

  const Select = ({ label, field, options, required }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={form[field]} onChange={e => set(field, e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  // ── Step 0: Customer ─────────────────────────────────────────────────────────
  const StepCustomer = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name (Poora Naam)" field="fullName" required placeholder="e.g. Muhammad Ali" />
        <Input label="Father's Name (Walid ka Naam)" field="fatherName" required placeholder="e.g. Muhammad Hussain" />
        <Input label="CNIC (Optional)" field="cnic" placeholder="XXXXX-XXXXXXX-X" hint="Leave blank if no CNIC available" />
        <Input label="Phone (Mobile)" field="phone" required placeholder="0300-1234567" />
        <Input label="City" field="city" required placeholder="e.g. Khuzdar" />
        <Input label="Khata Number (Daftar Nambur)" field="khataNumber" placeholder="e.g. 047" hint="Owner types manually — appears on all documents" />
      </div>
      <Input label="Address (Ghar ka Pata)" field="address" required placeholder="Full address" />
      <Select label="Investor / Capital (Sarmaaya Kisne Lagaya)" field="investorName" options={INVESTOR_OPTIONS} />
    </div>
  )

  // ── Step 1: Product ──────────────────────────────────────────────────────────
  const StepProduct = () => (
    <div className="space-y-4">
      {/* Cash Sale Toggle */}
      <div
        onClick={() => set('isCashSale', !form.isCashSale)}
        className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition-colors ${form.isCashSale ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.isCashSale ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
          {form.isCashSale && <Check size={11} className="text-white" />}
        </div>
        <div>
          <div className="font-bold text-slate-900">💵 Direct Cash Sale (Naqd Farokht)</div>
          <div className="text-xs text-slate-500">No installment plan — full cash payment only. Schedule step will be skipped.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Category (Qisam)" field="category" options={CATEGORIES} required />
        {form.category === 'other' && <Input label="Custom Category" field="customCategory" placeholder="Fan, Speaker, etc." />}
        <Input label="Brand (Kumpani)" field="brand" placeholder="Honda, Samsung, etc." />
        <Input label="Model" field="model" placeholder="CD70, Galaxy S23, etc." />
        <Input label="Color (Rang)" field="color" placeholder="Red, Black, White..." />
        <Select label="Condition (Haalat)" field="condition" options={[{value:'new',label:'New'},{value:'used',label:'Used'}]} />
      </div>

      {/* Chassis detection (motorcycles/cars) */}
      {['motorcycle','car'].includes(form.category) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Chassis # (Chassis Nambur)</label>
            <div className="relative">
              <input value={form.chassisNumber} onChange={e => onChassisChange(e.target.value)}
                placeholder="Enter chassis number..."
                className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              {chassisSearch.loading && <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-pulse" />}
            </div>
            {/* Chassis search results */}
            {!chassisSearch.loading && chassisSearch.found && !chassisSearch.conflict && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-sm font-bold text-blue-800">ℹ️ This chassis is in your system</div>
                <div className="text-xs text-blue-600 mt-1">{chassisSearch.found.brand} {chassisSearch.found.model} — {chassisSearch.found.color}</div>
                <div className="text-xs text-blue-500">Status: {chassisSearch.found.currentStatus}</div>
                {!form.assetId && (
                  <button onClick={useExistingAsset}
                    className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    ✓ Use This Existing Asset Record
                  </button>
                )}
                {form.assetId && <div className="mt-1 text-xs text-emerald-600 font-bold">✅ Linked to existing asset</div>}
              </div>
            )}
            {!chassisSearch.loading && chassisSearch.conflict && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-xl">
                <div className="text-sm font-bold text-amber-800 flex items-center gap-1.5"><AlertTriangle size={14} /> WARNING: Bike currently on installment!</div>
                <div className="text-xs text-amber-700 mt-1">{chassisSearch.found.brand} {chassisSearch.found.model} is with another customer.</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { set('chassisNumber', ''); setChassisSearch({ loading: false, found: null, conflict: false }) }}
                    className="px-3 py-1 text-xs bg-white border border-amber-300 text-amber-700 rounded-lg font-medium">Cancel</button>
                  <button onClick={() => { set('assetId', chassisSearch.found._id); set('assetConflictNote', 'Asset on-installment at time of creation'); setChassisSearch(p => ({ ...p, conflict: false })) }}
                    className="px-3 py-1 text-xs bg-amber-500 text-white rounded-lg font-medium">Yes, Proceed Anyway</button>
                </div>
              </div>
            )}
            {!chassisSearch.loading && form.chassisNumber && form.chassisNumber.length >= 4 && !chassisSearch.found && (
              <div className="mt-1 text-xs text-emerald-600">✅ New asset — not in system</div>
            )}
          </div>
          <Input label="Engine # (Engine Nambur)" field="engineNumber" placeholder="Enter engine number" />
        </div>
      )}

      {/* Electronics serial */}
      {!['motorcycle','car'].includes(form.category) && (
        <Input label="Serial Number" field="serialNumber" placeholder="IMEI or serial" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Purchase Price / Laagte (Rs.)" field="purchasePrice" type="number" required placeholder="85000" hint="What owner paid to distributor" />
        <Input label={`${form.isCashSale ? 'Cash Sale' : 'Installment'} Price / Bechne ki Qeemat (Rs.)`} field="installmentPrice" type="number" required placeholder="120000" />
        <Input label="Registration Fee (Rirjistrishun) (Rs.)" field="registrationFee" type="number" placeholder="0" />
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Distributor (Supplier)</label>
          <select value={form.distributor} onChange={e => set('distributor', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
            <option value="">-- Select Distributor --</option>
            {distributors.map(d => <option key={d._id} value={d._id}>{d.name} — {d.companyName}</option>)}
          </select>
        </div>
      </div>

      <Select label="Asset Status (Maal ki Halat)" field="assetStatus" options={ASSET_STATUSES} />
      {form.assetStatus === 'Resold-to-Other' && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
          <Input label="3rd Party Name" field="resoldToName" placeholder="Name of person" />
          <Input label="3rd Party Phone" field="resoldToPhone" placeholder="0300-0000000" />
        </div>
      )}
    </div>
  )

  // ── Step 2: Schedule ─────────────────────────────────────────────────────────
  const StepSchedule = () => (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 text-sm text-blue-700">
        <Info size={15} className="mt-0.5 flex-shrink-0" />
        Qist ki scheule banayein. Agar total number nahi pata, "Open-Ended" chunein.
      </div>
      {/* No Advance toggle */}
      <div
        onClick={() => { set('noAdvance', !form.noAdvance); if (!form.noAdvance) set('advanceAmount', '0') }}
        className={`cursor-pointer border rounded-xl p-3 flex items-center gap-3 text-sm ${form.noAdvance ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${form.noAdvance ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
          {form.noAdvance && <Check size={10} className="text-white" />}
        </div>
        <span className="font-medium text-slate-800">No Advance Given (Koi Peshgi Nahi)</span>
      </div>
      {!form.noAdvance && (
        <Input label="Advance Amount (Peshgi Raqam) (Rs.)" field="advanceAmount" type="number" placeholder="10000" hint="If no advance, tick 'No Advance Given' above" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Per Installment Amount / Qist (Rs.)" field="perInstallmentAmount" type="number" required placeholder="5000" hint="Enter manually — not auto-calculated" />
        <Select label="Schedule Type (Qist ki Qisam)" field="scheduleType" options={SCHEDULE_TYPES} />
        <Input label="Start Date (Shuru ki Tariikh)" field="startDate" type="date" />
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Total Installments (Kul Qistain)</label>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => set('openEnded', !form.openEnded)}>
              <div className={`w-9 h-5 rounded-full flex items-center transition-colors px-0.5 ${form.openEnded ? 'bg-purple-500 justify-end' : 'bg-slate-200 justify-start'}`}>
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </div>
              <span className="text-xs text-slate-500">Open-Ended</span>
            </div>
          </div>
          {!form.openEnded
            ? <input type="number" value={form.totalInstallments} onChange={e => set('totalInstallments', e.target.value)}
                placeholder="e.g. 12" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
            : <div className="px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700 font-medium">Open-ended — no fixed total</div>
          }
        </div>
      </div>

      {form.perInstallmentAmount && !form.openEnded && form.totalInstallments && (
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600">
          💡 Estimated Total: <b className="text-slate-900">{formatCurrency(Number(form.perInstallmentAmount) * Number(form.totalInstallments))}</b>
          {' '}over {form.totalInstallments} installments
        </div>
      )}
    </div>
  )

  // ── Step 3: Review ───────────────────────────────────────────────────────────
  const StepReview = () => {
    const rows = [
      ['Customer', form.fullName],
      ['Father', form.fatherName],
      ['CNIC', form.cnic || 'Not provided'],
      ['Phone', form.phone],
      ['Khata #', form.khataNumber || '—'],
      ['Investor', form.investorName],
      ['Category', form.category + (form.customCategory ? ` (${form.customCategory})` : '')],
      ['Item', `${form.brand} ${form.model} ${form.color}`.trim()],
      ['Sale Type', form.isCashSale ? '💵 CASH SALE' : '📋 Installment Plan'],
      ['Sale Price', formatCurrency(Number(form.installmentPrice))],
      ['Purchase Price', formatCurrency(Number(form.purchasePrice))],
      ['Registration Fee', form.registrationFee ? formatCurrency(Number(form.registrationFee)) : 'None'],
      ['Advance', form.noAdvance ? 'No Advance Given' : formatCurrency(Number(form.advanceAmount) || 0)],
      ...(!form.isCashSale ? [
        ['Per Qist', formatCurrency(Number(form.perInstallmentAmount))],
        ['Total Qistain', form.openEnded ? 'Open-Ended' : form.totalInstallments],
        ['Schedule', form.scheduleType],
        ['Start Date', form.startDate],
      ] : []),
      ['Asset Status', form.assetStatus],
      ...(form.assetId ? [['Asset Linked', '✅ Existing asset record']] : []),
    ]
    return (
      <div className="space-y-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
          ✅ Review karein aur submit karein. Sab kuch theek hai?
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-sm py-1.5 border-b border-slate-100">
              <span className="text-slate-500 min-w-[130px] flex-shrink-0">{k}</span>
              <span className="font-semibold text-slate-900">{v}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
        </div>
      </div>
    )
  }

  const STEP_COMPONENTS = [StepCustomer, StepProduct, StepSchedule, StepReview]
  const visibleStepLabels = form.isCashSale ? ['Customer', 'Product', 'Review'] : STEPS
  const CurrentStep = STEP_COMPONENTS[step]

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">New Installment / Naya Khaata</h1>
          <p className="text-sm text-slate-500 mt-1">Customer aur item ki poori details bharein</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 mb-6 overflow-x-auto">
          {visibleStepLabels.map((label, i) => {
            const actualStep = form.isCashSale && i === 2 ? 3 : i
            const active = step === actualStep
            const done   = step > actualStep
            return (
              <div key={label} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${active ? 'bg-blue-600 text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-white/20' : ''}`}>
                    {done ? <Check size={11} /> : i + 1}
                  </span>
                  {label}
                </div>
                {i < visibleStepLabels.length - 1 && <ChevronRight size={16} className="text-slate-300 mx-1 flex-shrink-0" />}
              </div>
            )
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <CurrentStep />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button onClick={step === 0 ? () => navigate('/installments') : prev}
            className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <ChevronLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < (form.isCashSale ? 2 : 3) ? (
            <button onClick={next}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={saving}
              className="flex items-center gap-1.5 px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : '✅ Submit / Jama Karein'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
