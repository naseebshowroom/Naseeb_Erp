import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Check, ChevronRight, ChevronLeft, Save, Search, UserPlus, Smartphone, Snowflake, Monitor, Combine, Refrigerator, Bike, Car, Box } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import { formatCurrency } from '@/lib/utils'
import installmentService from '@/services/installmentService'
import { handleApiError } from '@/utils/errorHandler'
import customerService from '@/services/customerService'

// ── Icons for categories ──
const CATEGORIES = [
  { id: 'mobile', label: 'Mobile Phone', icon: Smartphone },
  { id: 'ac', label: 'Air Conditioner', icon: Snowflake },
  { id: 'tv', label: 'LCD / TV', icon: Monitor },
  { id: 'washing_machine', label: 'Washing Machine', icon: Combine },
  { id: 'fridge', label: 'Refrigerator', icon: Refrigerator },
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'other', label: 'Other', icon: Box },
]

// ── Validation Schemas ──
const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/
const phoneRegex = /^03[0-9]{2}-[0-9]{7}$/

const customerCreateSchema = z.object({
  customerName: z.string().min(1, "Gahak ka naam zaroori hai"),
  fatherName: z.string().min(1, "Walid ka naam zaroori hai"),
  cnic: z.string().regex(cnicRegex, "Must be format: 00000-0000000-0"),
  phone: z.string().regex(phoneRegex, "Must be format: 0300-0000000"),
  city: z.string().min(1, "Shehar ka naam zaroori hai"),
  address: z.string().min(1, "Mukammal pata zaroori hai"),
})

const baseProductSchema = z.object({
  category: z.string().min(1, "Category chunna zaroori hai"),
  ownerPurchasePrice: z.number().min(1, "Khareed keemat zaroori hai"),
  installmentPrice: z.number().min(1, "Sale keemat zaroori hai"),
})

const electronicsSchema = baseProductSchema.extend({
  brand: z.string().min(1, "Brand/Company zaroori hai"),
  model: z.string().min(1, "Model zaroori hai"),
  color: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.enum(['new', 'used']),
})

const motorcycleSchema = baseProductSchema.extend({
  brand: z.string().min(1, "Company zaroori hai"),
  model: z.string().min(1, "Model zaroori hai"),
  color: z.string().min(1, "Rang zaroori hai"),
  engineNo: z.string().min(1, "Engine No. zaroori hai"),
  chassisNo: z.string().min(1, "Chassis No. zaroori hai"),
  regNo: z.string().optional(),
  distributor: z.string().min(1, "Distributor zaroori hai"),
  marketPrice: z.number().optional(),
})

const carSchema = baseProductSchema.extend({
  brand: z.string().min(1, "Make/Brand zaroori hai"),
  model: z.string().min(1, "Model zaroori hai"),
  year: z.string().min(4, "Model ka saal zaroori hai"),
  color: z.string().min(1, "Rang zaroori hai"),
  engineNo: z.string().min(1, "Engine No. zaroori hai"),
  chassisNo: z.string().min(1, "Chassis No. zaroori hai"),
  regNo: z.string().optional(),
})

const scheduleSchema = z.object({
  advancePayment: z.number().min(0, "Peshgi rakam manfi (negative) nahi ho sakti"),
  installmentsCount: z.number().min(1, "Kam az kam 1 qist zaroori hai"),
  scheduleType: z.enum(['daily', 'weekly', '5-day', '10-day', 'monthly']),
  startDate: z.string().min(1, "Shuru ki tareekh zaroori hai"),
  notes: z.string().optional(),
})

// ── Shared UI Utilities ──
const inputCls = (hasError, prefix) =>
  `w-full px-3 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-colors ${prefix ? 'pl-10' : ''} ${hasError ? 'border-red-300' : 'border-slate-200'}`

// ── Auto-format helpers ──
function formatCNIC(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 13)
  let res = ''
  if (digits.length > 0) res += digits.slice(0, 5)
  if (digits.length > 5) res += '-' + digits.slice(5, 12)
  if (digits.length > 12) res += '-' + digits.slice(12, 13)
  return res
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  let res = ''
  if (digits.length > 0) res += digits.slice(0, 4)
  if (digits.length > 4) res += '-' + digits.slice(4, 11)
  return res
}

// ── Reusable Input Components (OUTSIDE to prevent focus loss) ──
function InputField({ label, name, placeholder, type = "text", as = "input", prefix, register, errors }) {
  const err = errors[name]
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">
        {label} {err && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {prefix && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">{prefix}</div>}
        {as === "textarea" ? (
          <textarea 
            {...register(name)} rows={3} placeholder={placeholder}
            className={inputCls(err, prefix)}
          />
        ) : (
          <input 
            type={type} {...register(name, { valueAsNumber: type === 'number' })} placeholder={placeholder}
            className={inputCls(err, prefix)}
          />
        )}
      </div>
      {err && <p className="text-xs text-red-500 font-medium">{err.message}</p>}
    </div>
  )
}

function MaskedInput({ label, name, placeholder, formatter, control, errors, maxLength }) {
  const err = errors[name]
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ref } }) => (
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            {label} {err && <span className="text-red-500">*</span>}
          </label>
          <input
            ref={ref}
            value={value || ''}
            onChange={(e) => onChange(formatter(e.target.value))}
            placeholder={placeholder}
            maxLength={maxLength}
            inputMode="numeric"
            className={inputCls(err)}
          />
          {err && <p className="text-xs text-red-500 font-medium">{err.message}</p>}
        </div>
      )}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function InstallmentWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const customerIdParam = searchParams.get('customerId')
  const isEditing = Boolean(id)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const getProductSchema = () => {
    if (!selectedCategory) return z.object({})
    if (selectedCategory === 'motorcycle') return motorcycleSchema
    if (selectedCategory === 'car') return carSchema
    return electronicsSchema
  }

  const stepSchemas = [
    customerCreateSchema,
    getProductSchema(),
    scheduleSchema,
    z.object({})
  ]

  const { register, handleSubmit, trigger, watch, setValue, getValues, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(stepSchemas[currentStep]),
    mode: 'onTouched',
    defaultValues: {
      category: '', condition: 'new', scheduleType: 'monthly', installmentsCount: 12, startDate: new Date().toISOString().split('T')[0]
    }
  })

  const wInstallmentPrice = watch('installmentPrice') || 0
  const wPurchasePrice = watch('ownerPurchasePrice') || 0
  const profitMargin = wInstallmentPrice - wPurchasePrice

  // Hydrate if editing
  useEffect(() => {
    if (!isEditing) return
    const fetch = async () => {
      try {
        const res = await installmentService.getInstallment(id)
        if (res.success) {
          const d = res.data
          setSelectedCategory(d.category)
          reset({
            customerName: d.customer?.fullName,
            fatherName: d.customer?.fatherName,
            cnic: d.customer?.cnic,
            phone: d.customer?.phone,
            city: d.customer?.city,
            address: d.customer?.address,
            category: d.category,
            brand: d.brand,
            model: d.model,
            color: d.color,
            engineNo: d.engineNumber,
            chassisNo: d.chassisNumber,
            regNo: d.registrationNumber,
            distributor: d.distributor?._id || d.distributor,
            ownerPurchasePrice: d.purchasePrice,
            installmentPrice: d.installmentPrice,
            advancePayment: d.advanceAmount,
            installmentsCount: d.totalInstallments,
            scheduleType: d.scheduleType,
            startDate: d.startDate?.split('T')[0],
          })
        }
      } catch (err) { handleApiError(err) }
      finally { setIsLoading(false) }
    }
    fetch()
  }, [id, isEditing, reset])

  // Hydrate customer if pre-selected via URL
  useEffect(() => {
    if (isEditing || !customerIdParam) return
    const fetchCust = async () => {
      setIsLoading(true)
      try {
        const res = await customerService.getCustomer(customerIdParam)
        if (res.success) {
          const c = res.data
          reset({
            ...getValues(),
            customerName: c.fullName,
            fatherName: c.fatherName,
            cnic: c.cnic,
            phone: c.phone,
            city: c.city,
            address: c.address,
          })
          setCurrentStep(1) // Advance to Product step automatically
        }
      } catch (err) { handleApiError(err) }
      finally { setIsLoading(false) }
    }
    fetchCust()
  }, [customerIdParam, isEditing, reset])

  const steps = [
    { id: 1, title: 'Gahak (Customer)', desc: 'Bunyadi maloomat' },
    { id: 2, title: 'Samaan (Product)', desc: 'Item ki tafseel' },
    { id: 3, title: 'Qistain (Plan)', desc: 'Payment schedule' },
    { id: 4, title: 'Review', desc: 'Confirm & Save' },
  ]

  const nextStep = async () => {
    const valid = await trigger()
    if (valid) setCurrentStep(p => Math.min(p + 1, 3))
  }
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 0))

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId)
    setValue('category', catId)
  }

  const onSubmit = async () => {
    // Use getValues() directly — the zodResolver on step 4 is z.object({})
    // which strips all values from the `data` param, so we read the store directly
    const data = getValues()
    setIsSubmitting(true)
    try {
      const payload = {
        customer: customerIdParam || {
          fullName:   data.customerName,
          fatherName: data.fatherName,
          cnic:       data.cnic,
          phone:      data.phone,
          city:       data.city,
          address:    data.address,
          guarantors: [],
        },
        category:           data.category,
        brand:              data.brand,
        model:              data.model,
        color:              data.color,
        engineNumber:       data.engineNo,
        chassisNumber:      data.chassisNo,
        registrationNumber: data.regNo,
        distributor:        data.distributor,
        purchasePrice:      Number(data.ownerPurchasePrice),
        installmentPrice:   Number(data.installmentPrice),
        advanceAmount:      Number(data.advancePayment),
        totalInstallments:  Number(data.installmentsCount),
        scheduleType:       data.scheduleType,
        startDate:          data.startDate,
      }
      await installmentService.createInstallment(payload)
      toast.success('Naya khata kamyabi se ban gaya!')
      navigate('/installments')
    } catch (err) { handleApiError(err) }
    finally { setIsSubmitting(false) }
  }

  const fieldProps = { register, errors }

  return (
    <PageWrapper 
      title={isEditing ? 'Khata Edit Karein' : 'Naya Khata'}
      subtitle="Naya khata shuru karne ke liye darj zail steps mukammal karein."
      breadcrumbs={[{ label: 'Khatey', to: '/installments' }, { label: isEditing ? 'Edit' : 'Naya' }]}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-slate-500 font-medium">Khata load ho raha hai...</div>
      ) : (
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ── Stepper ── */}
        <div className="erp-card p-6">
          <div className="flex items-center justify-between relative">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center z-10 w-1/4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300 ${
                  currentStep > idx ? 'bg-emerald-500 border-emerald-500 text-white' : 
                  currentStep === idx ? 'bg-blue-600 border-blue-600 text-white' : 
                  'bg-white border-slate-200 text-slate-400'
                }`}>
                  {currentStep > idx ? <Check size={18} strokeWidth={3} /> : step.id}
                </div>
                <div className="mt-3 text-center">
                  <div className={`text-sm font-bold ${currentStep >= idx ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</div>
                  <div className="text-[10px] text-slate-500 hidden sm:block">{step.desc}</div>
                </div>
              </div>
            ))}
            <div className="absolute top-5 left-[12%] right-[12%] h-1 bg-slate-100 z-0">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(currentStep / 3) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="erp-card overflow-hidden min-h-[400px]">
          <div className="p-6 md:p-8">
            
            {/* STEP 1: Customer */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-4">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Naya Gahak (Customer)</h3>
                  <p className="text-sm text-slate-500 mt-1">Gahak ki bunyadi maloomat darj karein.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Gahak ka Naam" name="customerName" placeholder="Muhammad Ali" {...fieldProps} />
                  <InputField label="Walid ka Naam" name="fatherName" placeholder="Ahmad Khan" {...fieldProps} />
                  <MaskedInput label="Shanakhti Card (CNIC)" name="cnic" placeholder="00000-0000000-0" formatter={formatCNIC} control={control} errors={errors} maxLength={15} />
                  <MaskedInput label="Mobile Number" name="phone" placeholder="0300-0000000" formatter={formatPhone} control={control} errors={errors} maxLength={12} />
                  <InputField label="Shehar" name="city" placeholder="Lahore" {...fieldProps} />
                  <div className="md:col-span-2">
                    <InputField label="Mukammal Pata (Address)" name="address" as="textarea" placeholder="Ghar ka mukammal pata..." {...fieldProps} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Product */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Samaan Ki Qisam (Category)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon
                      const isSelected = selectedCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                            isSelected ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm ring-1 ring-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Icon size={24} strokeWidth={isSelected ? 2 : 1.5} />
                          <span className={`text-xs font-medium text-center ${isSelected ? 'font-bold' : ''}`}>{cat.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {selectedCategory && (
                  <div className="pt-6 border-t border-slate-100 animate-slide-up">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Samaan Ki Tafseel</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {selectedCategory === 'motorcycle' ? (
                        <>
                          <InputField label="Company (Make)" name="brand" placeholder="e.g. Honda" {...fieldProps} />
                          <InputField label="Model" name="model" placeholder="e.g. CD 70" {...fieldProps} />
                          <InputField label="Color" name="color" {...fieldProps} />
                          <InputField label="Engine Number" name="engineNo" {...fieldProps} />
                          <InputField label="Chassis Number" name="chassisNo" {...fieldProps} />
                          <InputField label="Registration Number" name="regNo" placeholder="Optional" {...fieldProps} />
                          <InputField label="Distributor" name="distributor" placeholder="Select or type..." {...fieldProps} />
                          <InputField label="Market Price" name="marketPrice" type="number" prefix="Rs." {...fieldProps} />
                        </>
                      ) : selectedCategory === 'car' ? (
                        <>
                          <InputField label="Make" name="brand" placeholder="e.g. Suzuki" {...fieldProps} />
                          <InputField label="Model" name="model" placeholder="e.g. Alto VXR" {...fieldProps} />
                          <InputField label="Year" name="year" placeholder="e.g. 2024" type="number" {...fieldProps} />
                          <InputField label="Color" name="color" {...fieldProps} />
                          <InputField label="Engine Number" name="engineNo" {...fieldProps} />
                          <InputField label="Chassis Number" name="chassisNo" {...fieldProps} />
                          <div className="md:col-span-2">
                            <InputField label="Registration Number" name="regNo" placeholder="Optional" {...fieldProps} />
                          </div>
                        </>
                      ) : (
                        <>
                          <InputField label="Brand" name="brand" placeholder="e.g. Samsung" {...fieldProps} />
                          <InputField label="Model" name="model" placeholder="e.g. Galaxy A54" {...fieldProps} />
                          <InputField label="Color" name="color" placeholder="Optional" {...fieldProps} />
                          <InputField label="Serial Number" name="serialNumber" placeholder="Optional" {...fieldProps} />
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Haisiyat (Condition)</label>
                            <select {...register('condition')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm">
                              <option value="new">Bilkul Naya</option>
                              <option value="used">Istemaal Shuda</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 mt-8">Keemat (Pricing)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <InputField label="Dukaan Ki Khareed (Purchase Price)" name="ownerPurchasePrice" type="number" prefix="Rs." {...fieldProps} />
                      <InputField label="Qistain Wali Keemat (Sale Price)" name="installmentPrice" type="number" prefix="Rs." {...fieldProps} />
                      <div className="md:col-span-2 pt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-medium">Munafa (Profit):</span>
                        <span className={`font-bold ${profitMargin > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(profitMargin)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Schedule */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Kul Rakam (Total Price)</span>
                  <div className="text-2xl font-black text-slate-900">{formatCurrency(wInstallmentPrice)}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <InputField label="Peshgi Rakam (Advance Payment)" name="advancePayment" type="number" prefix="Rs." {...fieldProps} />
                    <InputField label="Qiston Ki Tadad (No. of Installments)" name="installmentsCount" type="number" placeholder="e.g. 12" {...fieldProps} />
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Adaigi Ka Tareeqa (Schedule Type)</label>
                      <select {...register('scheduleType')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm">
                        <option value="daily">Rozana (Daily)</option>
                        <option value="weekly">Hafta War (Weekly)</option>
                        <option value="5-day">5 Din Baad</option>
                        <option value="10-day">10 Din Baad</option>
                        <option value="monthly">Mahana (Monthly)</option>
                      </select>
                    </div>
                    <InputField label="Shuru Ki Tareekh (Start Date)" name="startDate" type="date" {...fieldProps} />
                  </div>
                </div>

                {/* Live calculation preview */}
                {watch('advancePayment') >= 0 && watch('installmentsCount') > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Baqaya Rakam</div>
                        <div className="font-bold text-slate-900">{formatCurrency(wInstallmentPrice - (watch('advancePayment') || 0))}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Qiston Ki Tadad</div>
                        <div className="font-bold text-blue-600">{watch('installmentsCount') || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Ek Qist</div>
                        <div className="font-bold text-emerald-600">{formatCurrency((wInstallmentPrice - (watch('advancePayment') || 0)) / (watch('installmentsCount') || 1))}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Review */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Tafseelat Ka Jaiza (Review)</h3>
                <div className="bg-slate-50 p-6 rounded-xl space-y-6 text-sm">
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-3 uppercase tracking-wide text-xs">Gahak Ki Maloomat</h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <p><span className="text-slate-500">Naam:</span> <strong>{getValues('customerName')}</strong></p>
                      <p><span className="text-slate-500">CNIC:</span> <strong>{getValues('cnic')}</strong></p>
                      <p><span className="text-slate-500">Phone:</span> <strong>{getValues('phone')}</strong></p>
                      <p><span className="text-slate-500">Shehar:</span> <strong>{getValues('city')}</strong></p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-blue-600 mb-3 uppercase tracking-wide text-xs">Samaan Ki Tafseel</h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <p><span className="text-slate-500">Category:</span> <strong className="capitalize">{getValues('category')}</strong></p>
                      <p><span className="text-slate-500">Samaan:</span> <strong>{getValues('brand')} {getValues('model')}</strong></p>
                      <p><span className="text-slate-500">Khareed Keemat:</span> <strong>{formatCurrency(getValues('ownerPurchasePrice'))}</strong></p>
                      <p><span className="text-slate-500">Sale Keemat:</span> <strong>{formatCurrency(wInstallmentPrice)}</strong></p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-blue-600 mb-3 uppercase tracking-wide text-xs">Qiston Ka Plan</h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <p><span className="text-slate-500">Peshgi:</span> <strong>{formatCurrency(getValues('advancePayment'))}</strong></p>
                      <p><span className="text-slate-500">Qiston Ki Tadad:</span> <strong>{getValues('installmentsCount')}</strong></p>
                      <p><span className="text-slate-500">Tareeqa:</span> <strong className="capitalize">{getValues('scheduleType')}</strong></p>
                      <p><span className="text-slate-500">Ek Qist:</span> <strong className="text-emerald-600">{formatCurrency((wInstallmentPrice - (getValues('advancePayment')||0)) / (getValues('installmentsCount')||1))}</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button type="button" onClick={prevStep} disabled={currentStep === 0} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"><ChevronLeft size={18} /> Back</button>
            <div className="flex gap-3">
              {currentStep < 3 ? (
                <button type="button" onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Next Step <ChevronRight size={18} /></button>
              ) : (
                <button type="button" onClick={onSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"><Save size={18} /> {isSubmitting ? 'Bana raha hai...' : 'Khatma Karein (Save)'}</button>
              )}
            </div>
          </div>
        </form>
      </div>
      )}
    </PageWrapper>
  )
}
