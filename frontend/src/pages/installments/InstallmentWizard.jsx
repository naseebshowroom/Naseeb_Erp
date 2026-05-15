import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Check, ChevronRight, ChevronLeft, Save, Search, UserPlus, Smartphone, Snowflake, Monitor, Combine, Refrigerator, Bike, Car, Box } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import { formatCurrency } from '@/lib/utils'
import installmentService from '@/services/installmentService'
import { handleApiError } from '@/utils/errorHandler'

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
const customerSelectSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
})

// Dynamic schemas based on category group
const baseProductSchema = z.object({
  category: z.string().min(1, "Category is required"),
  ownerPurchasePrice: z.number().min(1, "Required"),
  installmentPrice: z.number().min(1, "Required"),
})

const electronicsSchema = baseProductSchema.extend({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  color: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.enum(['new', 'used']),
})

const motorcycleSchema = baseProductSchema.extend({
  brand: z.string().min(1, "Company is required"),
  model: z.string().min(1, "Model is required"),
  color: z.string().min(1, "Color is required"),
  engineNo: z.string().min(1, "Engine No. is required"),
  chassisNo: z.string().min(1, "Chassis No. is required"),
  regNo: z.string().optional(),
  distributor: z.string().min(1, "Distributor is required"),
  marketPrice: z.number().optional(),
})

const carSchema = baseProductSchema.extend({
  brand: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(4, "Year is required"),
  color: z.string().min(1, "Color is required"),
  engineNo: z.string().min(1, "Engine No. is required"),
  chassisNo: z.string().min(1, "Chassis No. is required"),
  regNo: z.string().optional(),
})

const scheduleSchema = z.object({
  advancePayment: z.number().min(0, "Advance payment cannot be negative"),
  installmentsCount: z.number().min(1, "Must have at least 1 installment"),
  scheduleType: z.enum(['daily', 'weekly', '5-day', '10-day', 'monthly']),
  startDate: z.string().min(1, "Start date is required"),
  notes: z.string().optional(),
})

export default function InstallmentWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // To handle dynamic schemas in step 2
  const getProductSchema = () => {
    if (!selectedCategory) return z.object({}) // will fail validation if required fields aren't there later, but we block next step
    if (selectedCategory === 'motorcycle') return motorcycleSchema
    if (selectedCategory === 'car') return carSchema
    return electronicsSchema
  }

  const stepSchemas = [
    customerSelectSchema,
    getProductSchema(),
    scheduleSchema,
    z.object({}) // Review step has no inputs
  ]

  const { register, handleSubmit, trigger, getValues, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(stepSchemas[currentStep]),
    mode: 'onTouched',
    defaultValues: {
      customerId: '',
      category: '',
      brand: '', model: '', color: '', condition: 'new', serialNumber: '',
      engineNo: '', chassisNo: '', regNo: '', distributor: '', year: '',
      ownerPurchasePrice: 0, installmentPrice: 0, marketPrice: 0,
      advancePayment: 0, installmentsCount: 1, scheduleType: 'monthly', startDate: new Date().toISOString().split('T')[0], notes: ''
    }
  })

  // Hydrate data if editing
  useEffect(() => {
    if (!isEditing) return

    const loadInstallment = async () => {
      try {
        const res = await installmentService.getInstallment(id)
        if (res.success && res.data) {
          const d = res.data
          const cat = d.category === 'lcd' ? 'tv' : d.category
          
          setSelectedCategory(cat)
          
          // Map backend scheduleType back to frontend
          const sType = d.scheduleType === '10day' ? '10-day' : d.scheduleType === '5day' ? '5-day' : d.scheduleType

          setValue('customerId', d.customer?._id || d.customer)
          setValue('category', cat)
          setValue('brand', d.brand || d.company || '')
          setValue('model', d.model || '')
          setValue('color', d.color || '')
          setValue('condition', d.condition || 'new')
          setValue('serialNumber', d.serialNumber || '')
          setValue('engineNo', d.engineNumber || '')
          setValue('chassisNo', d.chassisNumber || '')
          setValue('regNo', d.registrationNumber || '')
          setValue('year', d.year ? String(d.year) : '')
          
          setValue('ownerPurchasePrice', d.purchasePrice || 0)
          setValue('installmentPrice', d.installmentPrice || 0)
          setValue('advancePayment', d.advanceAmount || 0)
          setValue('installmentsCount', d.totalInstallments || 1)
          setValue('scheduleType', sType || 'monthly')
          setValue('startDate', d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '')
          setValue('notes', d.notes || '')
        }
      } catch (err) {
        handleApiError(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadInstallment()
  }, [id, isEditing, setValue])

  // Watch values for auto-calculations
  const wInstallmentPrice = watch('installmentPrice') || 0
  const wAdvancePayment = watch('advancePayment') || 0
  const wInstallmentsCount = watch('installmentsCount') || 1
  const wPurchasePrice = watch('ownerPurchasePrice') || 0

  const remainingAmount = Math.max(0, wInstallmentPrice - wAdvancePayment)
  const perInstallment = wInstallmentsCount > 0 ? remainingAmount / wInstallmentsCount : 0
  const profitMargin = wInstallmentPrice - wPurchasePrice

  const steps = [
    { id: 1, title: 'Customer', desc: 'Select or create' },
    { id: 2, title: 'Product', desc: 'Item details' },
    { id: 3, title: 'Schedule', desc: 'Payment plan' },
    { id: 4, title: 'Review', desc: 'Confirm & save' },
  ]

  const nextStep = async () => {
    if (currentStep === 1 && !selectedCategory) {
      toast.error('Please select a category first.')
      return
    }
    const isStepValid = await trigger()
    if (isStepValid) setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // Map frontend category to backend enum
      const backendCategory = data.category === 'tv' ? 'lcd' : data.category
      
      // Map frontend schedule type to backend enum
      const backendSchedule = data.scheduleType.replace('-', '') // '10-day' -> '10day'
      
      const payload = {
        customer: data.customerId,
        category: backendCategory,
        
        brand: data.brand,
        company: data.brand,
        model: data.model,
        color: data.color,
        serialNumber: data.serialNumber,
        engineNumber: data.engineNo,
        chassisNumber: data.chassisNo,
        registrationNumber: data.regNo,
        year: data.year ? Number(data.year) : undefined,
        condition: data.condition,
        
        purchasePrice: data.ownerPurchasePrice,
        installmentPrice: data.installmentPrice,
        
        advanceAmount: data.advancePayment,
        totalInstallments: data.installmentsCount,
        scheduleType: backendSchedule,
        startDate: data.startDate,
        notes: data.notes
      }
      
      if (isEditing) {
        await installmentService.updateInstallment(id, payload)
        toast.success('Installment plan updated successfully!')
      } else {
        await installmentService.createInstallment(payload)
        toast.success('Installment plan created successfully!')
      }
      navigate('/installments')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId)
    setValue('category', catId)
  }

  // Common Input
  const InputField = ({ label, name, placeholder, type = "text", as = "input", prefix }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">
        {label} {errors[name] && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {prefix && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">{prefix}</div>}
        {as === "textarea" ? (
          <textarea 
            {...register(name)} rows={3} placeholder={placeholder}
            className={`w-full px-3 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-colors ${prefix ? 'pl-8' : ''} ${errors[name] ? 'border-red-300' : 'border-slate-200'}`}
          />
        ) : (
          <input 
            type={type} {...register(name, { valueAsNumber: type === 'number' })} placeholder={placeholder}
            className={`w-full px-3 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-colors ${prefix ? 'pl-10' : ''} ${errors[name] ? 'border-red-300' : 'border-slate-200'}`}
          />
        )}
      </div>
      {errors[name] && <p className="text-xs text-red-500 font-medium">{errors[name].message}</p>}
    </div>
  )

  return (
    <PageWrapper 
      title={isEditing ? 'Edit Installment' : 'New Installment'}
      subtitle="Follow the steps to create a new installment agreement."
      breadcrumbs={[{ label: 'Installments', to: '/installments' }, { label: isEditing ? 'Edit' : 'New' }]}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-slate-500 font-medium">Loading installment data...</div>
      ) : (
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ── Stepper Header ── */}
        <div className="erp-card p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center relative z-10 w-1/4">
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
            <div className="absolute top-[44px] left-[12%] right-[12%] h-1 bg-slate-100 z-0">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(currentStep / 3) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* ── Form Content ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="erp-card overflow-hidden min-h-[400px]">
          <div className="p-6 md:p-8">
            
            {/* STEP 1: Customer */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-fade-in max-w-lg mx-auto py-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900">Select Customer</h3>
                  <p className="text-sm text-slate-500 mt-1">Search for an existing customer to begin.</p>
                </div>
                
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name or CNIC..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-base"
                    onChange={(e) => {
                      // Mock auto-select for demonstration
                      if(e.target.value.length > 3) setValue('customerId', 'mock-id-1')
                    }}
                  />
                </div>
                
                {watch('customerId') ? (
                  <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">M</div>
                      <div>
                        <h4 className="font-bold text-slate-900">Muhammad Asif</h4>
                        <p className="text-sm text-slate-500">34201-1234567-1</p>
                      </div>
                    </div>
                    <Check className="text-emerald-500" size={24} />
                  </div>
                ) : (
                  <div className="text-center mt-6">
                    <span className="text-sm text-slate-500">Don't see them? </span>
                    <Link to="/customers/new" className="text-sm font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
                      <UserPlus size={16} /> Add New Customer
                    </Link>
                  </div>
                )}
                {errors.customerId && <p className="text-sm text-red-500 font-medium text-center">{errors.customerId.message}</p>}
              </div>
            )}

            {/* STEP 2: Product */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Select Category</h3>
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
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Product Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Common fields based on group */}
                      {selectedCategory === 'motorcycle' ? (
                        <>
                          <InputField label="Company (Make)" name="brand" placeholder="e.g. Honda" />
                          <InputField label="Model" name="model" placeholder="e.g. CD 70" />
                          <InputField label="Color" name="color" />
                          <InputField label="Engine Number" name="engineNo" />
                          <InputField label="Chassis Number" name="chassisNo" />
                          <InputField label="Registration Number" name="regNo" placeholder="Optional" />
                          <InputField label="Distributor" name="distributor" placeholder="Select or type..." />
                          <InputField label="Market Price" name="marketPrice" type="number" prefix="Rs." />
                        </>
                      ) : selectedCategory === 'car' ? (
                        <>
                          <InputField label="Make" name="brand" placeholder="e.g. Suzuki" />
                          <InputField label="Model" name="model" placeholder="e.g. Alto VXR" />
                          <InputField label="Year" name="year" placeholder="e.g. 2024" type="number" />
                          <InputField label="Color" name="color" />
                          <InputField label="Engine Number" name="engineNo" />
                          <InputField label="Chassis Number" name="chassisNo" />
                          <div className="md:col-span-2">
                            <InputField label="Registration Number" name="regNo" placeholder="Optional" />
                          </div>
                        </>
                      ) : (
                        <>
                          <InputField label="Brand" name="brand" placeholder="e.g. Samsung" />
                          <InputField label="Model" name="model" placeholder="e.g. Galaxy A54" />
                          <InputField label="Color" name="color" placeholder="Optional" />
                          <InputField label="Serial Number" name="serialNumber" placeholder="Optional" />
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Condition</label>
                            <select {...register('condition')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm">
                              <option value="new">Brand New</option>
                              <option value="used">Used / Second Hand</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 mt-8">Pricing (Owner Config)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <InputField label="Your Purchase Price (Private)" name="ownerPurchasePrice" type="number" prefix="Rs." />
                      <InputField label="Installment Sale Price" name="installmentPrice" type="number" prefix="Rs." />
                      
                      <div className="md:col-span-2 pt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-medium">Estimated Profit Margin:</span>
                        <span className={`font-bold ${profitMargin > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(profitMargin)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Schedule */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Total Sale Price</span>
                    <div className="text-2xl font-black text-slate-900">{formatCurrency(wInstallmentPrice)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <InputField label="Advance Payment" name="advancePayment" type="number" prefix="Rs." />
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-bold uppercase">Remaining Amount</span>
                      <div className="text-xl font-bold text-red-600">{formatCurrency(remainingAmount)}</div>
                    </div>

                    <InputField label="Number of Installments" name="installmentsCount" type="number" />
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Payment Frequency</label>
                      <select {...register('scheduleType')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm">
                        <option value="monthly">Monthly (Every 30 days)</option>
                        <option value="10-day">10-Day (Every 10 days)</option>
                        <option value="weekly">Weekly (Every 7 days)</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>

                    <InputField label="Start Date (First Installment)" name="startDate" type="date" />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 border-b pb-2">Plan Preview</h4>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col h-full">
                      <div className="mb-4 text-center">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-1">Per Installment</span>
                        <span className="text-3xl font-black text-blue-600">{formatCurrency(perInstallment)}</span>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between text-sm py-2 border-b border-slate-200/60">
                          <span className="text-slate-600">Installment 1</span>
                          <span className="font-medium text-slate-900">{watch('startDate')}</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-slate-200/60">
                          <span className="text-slate-600">Installment 2</span>
                          <span className="font-medium text-slate-400">Auto-calculated...</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-slate-200/60">
                          <span className="text-slate-600">Installment 3</span>
                          <span className="font-medium text-slate-400">Auto-calculated...</span>
                        </div>
                        <div className="text-center pt-2 text-xs text-slate-400 font-medium italic">
                          and {Math.max(0, wInstallmentsCount - 3)} more payments
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <InputField label="Notes / Special Conditions" name="notes" as="textarea" placeholder="Any special agreements with the customer..." />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Review */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Review & Confirm</h3>
                  <p className="text-sm text-slate-500">Please review the details before creating the agreement.</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 space-y-6 text-sm border border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-slate-200">
                    <div><span className="block text-xs text-slate-500 uppercase">Customer</span><span className="font-bold text-slate-900">Muhammad Asif</span></div>
                    <div><span className="block text-xs text-slate-500 uppercase">Category</span><span className="font-bold text-slate-900 capitalize">{getValues('category')}</span></div>
                    <div><span className="block text-xs text-slate-500 uppercase">Item</span><span className="font-bold text-slate-900">{getValues('brand')} {getValues('model')}</span></div>
                    <div><span className="block text-xs text-slate-500 uppercase">Condition</span><span className="font-bold text-slate-900 capitalize">{getValues('condition') || 'New'}</span></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-slate-200">
                    <div><span className="block text-xs text-slate-500 uppercase">Total Price</span><span className="font-bold text-blue-600">{formatCurrency(getValues('installmentPrice'))}</span></div>
                    <div><span className="block text-xs text-slate-500 uppercase">Advance</span><span className="font-bold text-emerald-600">{formatCurrency(getValues('advancePayment'))}</span></div>
                    <div><span className="block text-xs text-slate-500 uppercase">Remaining</span><span className="font-bold text-red-600">{formatCurrency(remainingAmount)}</span></div>
                    <div><span className="block text-xs text-slate-500 uppercase">Owner Profit</span><span className="font-bold text-slate-900">{formatCurrency(profitMargin)}</span></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><span className="block text-xs text-slate-500 uppercase">Installments</span><span className="font-bold text-slate-900">{getValues('installmentsCount')}</span></div>
                    <div><span className="block text-xs text-slate-500 uppercase">Frequency</span><span className="font-bold text-slate-900 capitalize">{getValues('scheduleType')}</span></div>
                    <div><span className="block text-xs text-slate-500 uppercase">Per Payment</span><span className="font-bold text-slate-900">{formatCurrency(perInstallment)}</span></div>
                    <div><span className="block text-xs text-slate-500 uppercase">Start Date</span><span className="font-bold text-slate-900">{getValues('startDate')}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer Actions ── */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
            >
              <ChevronLeft size={18} /> Back
            </button>
            
            <div className="flex gap-3">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save size={18} /> {isSubmitting ? 'Saving...' : 'Confirm & Create'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      )}
    </PageWrapper>
  )
}
