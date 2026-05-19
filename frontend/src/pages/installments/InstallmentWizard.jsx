import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Check, AlertTriangle, Info, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { formatCurrency } from '@/lib/utils'
import { formatCNIC, formatPhone } from '@/utils/formatters'

const STEPS = ['Customer', 'Product', 'Schedule', 'Review']

const INVESTOR_OPTIONS = ['Owner', 'Partner-Brother', 'Partner-1', 'Partner-2', 'Other']
const CATEGORIES = ['motorcycle', 'car', 'mobile', 'ac', 'lcd', 'fridge', 'washing_machine', 'other']
const SCHEDULE_TYPES = ['daily', 'weekly', '5-day', '10-day', 'monthly']
const ASSET_STATUSES = ['In-Use', 'Returned', 'Resold-to-Other']

// Form context to pass form & set safely without losing focus
const FormContext = createContext(null)

const Input = ({ label, field, type = 'text', placeholder, required, hint }) => {
  const ctx = useContext(FormContext)
  if (!ctx) return null
  const { form, set } = ctx

  const handleChange = (e) => {
    let val = e.target.value
    // Auto format if it's a CNIC field
    if (field === 'cnic' || field.endsWith('Cnic') || field === 'g1_cnic' || field === 'g2_cnic') {
      val = formatCNIC(val)
    }
    // Auto format if it's a Phone field
    else if (field === 'phone' || field.endsWith('Phone') || field === 'g1_phone' || field === 'g2_phone' || field === 'resoldToPhone') {
      val = formatPhone(val)
    }
    set(field, val)
  }

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={form[field] || ''} onChange={handleChange}
        placeholder={placeholder} required={required}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

const Select = ({ label, field, options, required }) => {
  const ctx = useContext(FormContext)
  if (!ctx) return null
  const { form, set } = ctx
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={form[field] || ''} onChange={e => set(field, e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

const INIT = {
  // Customer
  fullName: '', fatherName: '', cnic: '', phone: '', city: '', address: '',
  khataNumber: '', investorName: 'Owner',
  // Guarantor 1
  g1_name: '', g1_fatherName: '', g1_phone: '', g1_cnic: '', g1_relation: '', g1_relationUrdu: '', g1_workDepartment: '', g1_businessAddress: '',
  // Guarantor 2
  g2_name: '', g2_fatherName: '', g2_phone: '', g2_cnic: '', g2_relation: '', g2_relationUrdu: '', g2_workDepartment: '', g2_businessAddress: '',
  // Product
  category: 'motorcycle', customCategory: '', customItemName: '', brand: '', model: '', color: '',
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
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [step, setStep]         = useState(0)
  const [form, setForm]         = useState(INIT)
  const [loading, setLoading]   = useState(isEditing)
  const [saving, setSaving]     = useState(false)
  const [distributors, setDistributors] = useState([])
  const [activeGuarantorAccordion, setActiveGuarantorAccordion] = useState(null) // 'g1', 'g2', or null
  
  // Chassis detection state
  const [chassisSearch, setChassisSearch] = useState({ loading: false, found: null, conflict: false })
  const chassisTimer = useRef(null)

  useEffect(() => {
    api.get('/distributors').then(r => setDistributors(r.data.data || [])).catch(() => {})
  }, [])

  // Load existing data if editing
  useEffect(() => {
    if (!isEditing) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/installments/${id}`)
        const d = res.data.data
        if (d) {
          const cust = d.customer || {}
          const g1 = cust.guarantors?.[0] || {}
          const g2 = cust.guarantors?.[1] || {}

          setForm({
            // Customer
            fullName: cust.fullName || '',
            fatherName: cust.fatherName || '',
            cnic: cust.cnic || '',
            phone: cust.phone || '',
            city: cust.city || '',
            address: cust.address || '',
            khataNumber: d.khataNumber || cust.khataNumber || '',
            investorName: d.investorName || 'Owner',

            // Guarantor 1
            g1_name: g1.fullName || '',
            g1_fatherName: g1.fatherName || '',
            g1_phone: g1.phone || '',
            g1_cnic: g1.cnic || '',
            g1_relation: g1.relation || '',
            g1_relationUrdu: g1.relationUrdu || '',
            g1_workDepartment: g1.workDepartment || '',
            g1_businessAddress: g1.businessAddress || '',

            // Guarantor 2
            g2_name: g2.fullName || '',
            g2_fatherName: g2.fatherName || '',
            g2_phone: g2.phone || '',
            g2_cnic: g2.cnic || '',
            g2_relation: g2.relation || '',
            g2_relationUrdu: g2.relationUrdu || '',
            g2_workDepartment: g2.workDepartment || '',
            g2_businessAddress: g2.businessAddress || '',

            // Product
            category: d.category || 'motorcycle',
            customCategory: d.customCategory || '',
            customItemName: d.customItemName || '',
            brand: d.brand || '',
            model: d.model || '',
            color: d.color || '',
            engineNumber: d.engineNumber || '',
            chassisNumber: d.chassisNumber || '',
            serialNumber: d.serialNumber || '',
            condition: d.condition || 'new',
            distributor: d.distributor?._id || d.distributor || '',
            purchasePrice: String(d.purchasePrice || ''),
            installmentPrice: String(d.installmentPrice || ''),
            isCashSale: d.isCashSale || false,
            registrationFee: String(d.registrationFee || ''),
            assetStatus: d.assetStatus || 'In-Use',
            resoldToName: d.resoldToName || '',
            resoldToPhone: d.resoldToPhone || '',

            // asset lifecycle
            assetId: d.assetId || '',
            assetConflictNote: d.assetConflictNote || '',

            // Schedule
            advanceAmount: String(d.advanceAmount || ''),
            noAdvance: d.advanceAmount === 0,
            perInstallmentAmount: String(d.perInstallmentAmount || ''),
            totalInstallments: String(d.totalInstallments || ''),
            openEnded: !d.totalInstallments,
            scheduleType: d.scheduleType || 'monthly',
            startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],

            // Notes
            notes: d.notes || ''
          })
        }
      } catch (err) {
        toast.error('Khaata details load karne mein masla hua')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isEditing])

  // Auto-calculate totalInstallments and update form state
  useEffect(() => {
    const price = Number(form.installmentPrice) || 0;
    const advance = form.noAdvance ? 0 : Number(form.advanceAmount) || 0;
    const remainingAmount = price - advance;
    const perInst = Number(form.perInstallmentAmount) || 0;
    if (remainingAmount > 0 && perInst > 0) {
      const calculatedTotal = Math.ceil(remainingAmount / perInst);
      if (form.totalInstallments !== String(calculatedTotal)) {
        setForm(p => ({ ...p, totalInstallments: String(calculatedTotal) }));
      }
    } else {
      if (form.totalInstallments !== '') {
        setForm(p => ({ ...p, totalInstallments: '' }));
      }
    }
  }, [form.installmentPrice, form.advanceAmount, form.noAdvance, form.perInstallmentAmount, form.totalInstallments]);

  const getLocalSchedulePreview = () => {
    const price = Number(form.installmentPrice) || 0;
    const advance = form.noAdvance ? 0 : Number(form.advanceAmount) || 0;
    const remainingAmount = price - advance;
    const perInst = Number(form.perInstallmentAmount) || 0;

    if (remainingAmount <= 0 || perInst <= 0 || !form.startDate) return [];

    const schedule = [];
    const currentDate = new Date(form.startDate);
    currentDate.setHours(0, 0, 0, 0);

    const count = Math.ceil(remainingAmount / perInst);
    let balanceTracker = remainingAmount;

    for (let i = 0; i < count; i++) {
      const dueDate = new Date(currentDate);
      const expectedAmount = balanceTracker >= perInst ? perInst : balanceTracker;

      schedule.push({
        qistNo: i + 1,
        dueDate: dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        expectedAmount,
      });

      balanceTracker -= expectedAmount;

      switch (form.scheduleType) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case '5-day':
        case '5day':
          currentDate.setDate(currentDate.getDate() + 5);
          break;
        case '10-day':
        case '10day':
          currentDate.setDate(currentDate.getDate() + 10);
          break;
        case 'monthly':
        default:
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }
    return schedule;
  };

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
    if (form.category === 'other' && !form.customItemName.trim()) {
      toast.error('Other category ke liye samaan ka naam (customItemName) likhna zaroori hai!')
      return
    }
    setSaving(true)
    try {
      const payload = {
        customer: {
          fullName: form.fullName, fatherName: form.fatherName,
          ...(form.cnic ? { cnic: form.cnic } : {}),
          phone: form.phone, city: form.city, address: form.address,
          khataNumber: form.khataNumber,
          guarantors: [
            {
              fullName: form.g1_name,
              fatherName: form.g1_fatherName,
              phone: form.g1_phone,
              cnic: form.g1_cnic,
              relation: form.g1_relation,
              relationUrdu: form.g1_relationUrdu,
              workDepartment: form.g1_workDepartment,
              businessAddress: form.g1_businessAddress
            },
            {
              fullName: form.g2_name,
              fatherName: form.g2_fatherName,
              phone: form.g2_phone,
              cnic: form.g2_cnic,
              relation: form.g2_relation,
              relationUrdu: form.g2_relationUrdu,
              workDepartment: form.g2_workDepartment,
              businessAddress: form.g2_businessAddress
            }
          ].filter(g => g.fullName && g.phone)
        },
        khataNumber:      form.khataNumber,
        investorName:     form.investorName,
        category:         form.category,
        customCategory:   form.customCategory,
        customItemName:   form.category === 'other' ? form.customItemName : undefined,
        brand: form.category === 'other' ? '' : form.brand, 
        model: form.category === 'other' ? '' : form.model, 
        color: form.color,
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
      let r;
      if (isEditing) {
        r = await api.put(`/installments/${id}`, payload)
        toast.success('Installment successfully update kar di!')
      } else {
        r = await api.post('/installments', payload)
        toast.success('Installment successfully bana di!')
      }
      navigate(`/installments/${r.data.data._id || id}`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error')
    } finally { setSaving(false) }
  }



  // ── Step 0: Customer ─────────────────────────────────────────────────────────
  const StepCustomer = () => (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Customer Details / Grahak ki Maaloomat</h3>
      </div>
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

      {/* Guarantors Accordion Section */}
      <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">Guarantors / Zamin (Optional)</h3>
          <p className="text-xs text-slate-500">Provide details for up to two guarantors to print on the agreement</p>
        </div>

        {/* Guarantor 1 */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveGuarantorAccordion(activeGuarantorAccordion === 'g1' ? null : 'g1')}
            className={`w-full px-5 py-4 flex items-center justify-between text-left font-bold text-sm ${activeGuarantorAccordion === 'g1' ? 'bg-blue-50/50 text-blue-700 border-b border-slate-100' : 'bg-slate-50/50 text-slate-700 hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${form.g1_name && form.g1_phone ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span>Guarantor 1 / Pehla Zamin (Zamin Awwal)</span>
            </div>
            <span className="text-xs text-slate-400 font-normal">{activeGuarantorAccordion === 'g1' ? 'Collapse ▲' : 'Expand ▼'}</span>
          </button>
          {activeGuarantorAccordion === 'g1' && (
            <div className="p-5 bg-white space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Name (Naam)" field="g1_name" placeholder="Name of Guarantor 1" />
                <Input label="Father's Name (Walid ka Naam)" field="g1_fatherName" placeholder="Father name" />
                <Input label="CNIC (Optional)" field="g1_cnic" placeholder="XXXXX-XXXXXXX-X" />
                <Input label="Phone (Mobile)" field="g1_phone" placeholder="0300-1234567" />
                <Input label="Relation (Rishta)" field="g1_relation" placeholder="e.g. Brother, Friend" />
                <Input label="Relation in Urdu (Rishta Urdu)" field="g1_relationUrdu" placeholder="e.g. بھائی, دوست" />
                <Input label="Work Department / Job (Mulazmat)" field="g1_workDepartment" placeholder="e.g. Police, Education, Business" />
              </div>
              <Input label="Business / Shop Address (Karobaar/Dukaan ka Pata)" field="g1_businessAddress" placeholder="Full shop or business address" />
            </div>
          )}
        </div>

        {/* Guarantor 2 */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveGuarantorAccordion(activeGuarantorAccordion === 'g2' ? null : 'g2')}
            className={`w-full px-5 py-4 flex items-center justify-between text-left font-bold text-sm ${activeGuarantorAccordion === 'g2' ? 'bg-blue-50/50 text-blue-700 border-b border-slate-100' : 'bg-slate-50/50 text-slate-700 hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${form.g2_name && form.g2_phone ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span>Guarantor 2 / Doosra Zamin (Zamin Doam)</span>
            </div>
            <span className="text-xs text-slate-400 font-normal">{activeGuarantorAccordion === 'g2' ? 'Collapse ▲' : 'Expand ▼'}</span>
          </button>
          {activeGuarantorAccordion === 'g2' && (
            <div className="p-5 bg-white space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Name (Naam)" field="g2_name" placeholder="Name of Guarantor 2" />
                <Input label="Father's Name (Walid ka Naam)" field="g2_fatherName" placeholder="Father name" />
                <Input label="CNIC (Optional)" field="g2_cnic" placeholder="XXXXX-XXXXXXX-X" />
                <Input label="Phone (Mobile)" field="g2_phone" placeholder="0300-1234567" />
                <Input label="Relation (Rishta)" field="g2_relation" placeholder="e.g. Brother, Friend" />
                <Input label="Relation in Urdu (Rishta Urdu)" field="g2_relationUrdu" placeholder="e.g. بھائی, دوست" />
                <Input label="Work Department / Job (Mulazmat)" field="g2_workDepartment" placeholder="e.g. Police, Education, Business" />
              </div>
              <Input label="Business / Shop Address (Karobaar/Dukaan ka Pata)" field="g2_businessAddress" placeholder="Full shop or business address" />
            </div>
          )}
        </div>
      </div>
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
        {form.category === 'other' && <Input label="Custom Category (Qisam ka Naam)" field="customCategory" placeholder="Fan, Speaker, etc." />}
        
        {form.category === 'other' ? (
          <Input 
            label="Samaan ka Naam (e.g., Orient Fan, Sony Speaker) *" 
            field="customItemName" 
            placeholder="Orient Fan..." 
            required 
          />
        ) : (
          <>
            <Input label="Brand (Kumpani)" field="brand" placeholder="Honda, Samsung, etc." />
            <Input label="Model" field="model" placeholder="CD70, Galaxy S23, etc." />
          </>
        )}
        
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
  const StepSchedule = () => {
    const localSchedule = getLocalSchedulePreview();

    return (
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 text-sm text-blue-700">
          <Info size={15} className="mt-0.5 flex-shrink-0" />
          Khaata qist ki schedule details. Peshgi aur har qist ki raqam daalney par duration khud-ba-khud calculate ho jaye gi.
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
          <Input label="Per Installment Amount / Qist (Rs.)" field="perInstallmentAmount" type="number" required placeholder="5000" hint="Enter per-installment amount" />
          <Select label="Schedule Type (Qist ki Qisam)" field="scheduleType" options={SCHEDULE_TYPES} />
          <Input label="Start Date (Shuru ki Tariikh)" field="startDate" type="date" />
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Calculated Duration (Kul Qistain)</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 h-[38px] flex items-center">
              {localSchedule.length > 0 ? `${localSchedule.length} Payments / Qistain` : 'Enter prices above to calculate'}
            </div>
          </div>
        </div>

        {localSchedule.length > 0 && (
          <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">🗓️ Payment Schedule Preview</h4>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden max-h-[300px] overflow-y-auto erp-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 backdrop-blur-md">
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Qist No.</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700">Tareekh / Due Date</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-700 text-right">Rakam / Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {localSchedule.map((item) => (
                    <tr key={item.qistNo} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2 font-medium text-slate-900">Qist {item.qistNo}</td>
                      <td className="px-4 py-2 text-slate-600">{item.dueDate}</td>
                      <td className="px-4 py-2 text-slate-900 font-bold text-right">{formatCurrency(item.expectedAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-medium">
              💡 Dynamic duration calculated perfectly! Remaining Balance: <b>{formatCurrency(Number(form.installmentPrice || 0) - (form.noAdvance ? 0 : Number(form.advanceAmount || 0)))}</b>.
            </div>
          </div>
        )}
      </div>
    )
  }

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
      ...(form.g1_name ? [['Zamin Awwal (1)', `${form.g1_name} (${form.g1_phone})`]] : []),
      ...(form.g2_name ? [['Zamin Doam (2)', `${form.g2_name} (${form.g2_phone})`]] : []),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center font-semibold text-slate-500 animate-pulse">
          Khaata details load ho rahi hain, baraye meharbani intezar karein...
        </div>
      </div>
    )
  }

  return (
    <FormContext.Provider value={{ form, set }}>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900">
              {isEditing ? 'Edit Installment / Khaata Tabdeeli' : 'New Installment / Naya Khaata'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isEditing ? 'Khaatey ki details update karein' : 'Customer aur item ki poori details bharein'}
            </p>
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
            {CurrentStep()}
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
    </FormContext.Provider>
  )
}
