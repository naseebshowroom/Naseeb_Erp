import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Check, ChevronRight, ChevronLeft, Save, UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import customerService from '@/services/customerService'
import { handleApiError } from '@/utils/errorHandler'

// ── Validation Schemas ─────────────────────────────────────
const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/
const phoneRegex = /^03[0-9]{2}-[0-9]{7}$/

const customerSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  fatherName: z.string().min(3, "Father's name is required"),
  cnic: z.string().regex(cnicRegex, "Must be format: 00000-0000000-0"),
  phone: z.string().regex(phoneRegex, "Must be format: 0300-0000000"),
  altPhone: z.string().optional().or(z.literal('')),
  address: z.string().min(10, "Address is required (min 10 chars)"),
  city: z.string().min(3, "City is required"),
})

const guarantor1Schema = z.object({
  g1Name: z.string().min(3, "Name is required"),
  g1Cnic: z.string().regex(cnicRegex, "Must be format: 00000-0000000-0"),
  g1Phone: z.string().regex(phoneRegex, "Must be format: 0300-0000000"),
  g1Address: z.string().min(10, "Address is required"),
  g1Business: z.string().min(3, "Business Name is required"),
  g1Type: z.string().min(3, "Business Type is required"),
})

const guarantor2Schema = z.object({
  g2Name: z.string().min(3, "Name is required"),
  g2Cnic: z.string().regex(cnicRegex, "Must be format: 00000-0000000-0"),
  g2Phone: z.string().regex(phoneRegex, "Must be format: 0300-0000000"),
  g2Address: z.string().min(10, "Address is required"),
  g2Dept: z.string().min(3, "Department is required"),
  g2Desig: z.string().min(3, "Designation is required"),
  g2EmpId: z.string().optional().or(z.literal('')),
})

// Schema mapping for steps
const stepSchemas = [customerSchema, guarantor1Schema, guarantor2Schema, z.object({})]

export default function CustomerWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const [currentStep, setCurrentStep] = useState(0)
  
  const { register, handleSubmit, trigger, getValues, reset, formState: { errors } } = useForm({
    resolver: zodResolver(stepSchemas[currentStep]),
    mode: 'onTouched',
    defaultValues: {
      fullName: '', fatherName: '', cnic: '', phone: '', altPhone: '', address: '', city: '',
      g1Name: '', g1Cnic: '', g1Phone: '', g1Address: '', g1Business: '', g1Type: '',
      g2Name: '', g2Cnic: '', g2Phone: '', g2Address: '', g2Dept: '', g2Desig: '', g2EmpId: ''
    }
  })

  const [isLoading, setIsLoading] = useState(isEditing)

  // Hydrate data if editing
  useEffect(() => {
    if (!isEditing) return

    const loadCustomer = async () => {
      try {
        const res = await customerService.getCustomer(id)
        if (res.success && res.data) {
          const d = res.data
          const g1 = d.guarantors?.find(g => g.type === 'business') || {}
          const g2 = d.guarantors?.find(g => g.type === 'government') || {}
          
          reset({
            fullName: d.fullName || '', fatherName: d.fatherName || '', cnic: d.cnic || '', 
            phone: d.phone || '', altPhone: d.alternatePhone || '', address: d.address || '', city: d.city || '',
            
            g1Name: g1.fullName || '', g1Cnic: g1.cnic || '', g1Phone: g1.phone || '', 
            g1Address: g1.address || '', g1Business: g1.businessName || '', g1Type: g1.businessType || '',
            
            g2Name: g2.fullName || '', g2Cnic: g2.cnic || '', g2Phone: g2.phone || '', 
            g2Address: g2.address || '', g2Dept: g2.department || '', g2Desig: g2.designation || '', g2EmpId: g2.employeeId || ''
          })
        }
      } catch (err) {
        handleApiError(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadCustomer()
  }, [id, isEditing, reset])

  const steps = [
    { id: 1, title: 'Basic Info', desc: 'Personal details & CNIC' },
    { id: 2, title: 'Guarantor 1', desc: 'Business Sector' },
    { id: 3, title: 'Guarantor 2', desc: 'Government Servant' },
    { id: 4, title: 'Review', desc: 'Confirm & Submit' },
  ]

  const nextStep = async () => {
    const isStepValid = await trigger()
    if (isStepValid) setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('fullName', data.fullName)
      formData.append('fatherName', data.fatherName)
      formData.append('cnic', data.cnic)
      formData.append('phone', data.phone)
      formData.append('alternatePhone', data.altPhone || '')
      formData.append('address', data.address)
      formData.append('city', data.city)

      const guarantors = [
        {
          type: 'business',
          fullName: data.g1Name,
          cnic: data.g1Cnic,
          phone: data.g1Phone,
          address: data.g1Address,
          businessName: data.g1Business,
          businessType: data.g1Type,
        },
        {
          type: 'government',
          fullName: data.g2Name,
          cnic: data.g2Cnic,
          phone: data.g2Phone,
          address: data.g2Address,
          department: data.g2Dept,
          designation: data.g2Desig,
          employeeId: data.g2EmpId,
        }
      ]
      
      formData.append('guarantors', JSON.stringify(guarantors))

      // Handle Files
      if (data.photo?.[0]) formData.append('photo', data.photo[0])
      if (data.cnicFront?.[0]) formData.append('cnicFront', data.cnicFront[0])
      if (data.cnicBack?.[0]) formData.append('cnicBack', data.cnicBack[0])
      
      if (isEditing) {
        await customerService.updateCustomer(id, formData)
        toast.success('Customer updated successfully!')
      } else {
        await customerService.createCustomer(formData)
        toast.success('Customer registered successfully!')
      }
      navigate('/customers')
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Common Input Field Component
  const InputField = ({ label, name, placeholder, type = "text", as = "input" }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">
        {label} {errors[name] && <span className="text-red-500">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea 
          {...register(name)} 
          rows={3}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-colors ${errors[name] ? 'border-red-300' : 'border-slate-200'}`}
        />
      ) : (
        <input 
          type={type}
          {...register(name)} 
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-colors ${errors[name] ? 'border-red-300' : 'border-slate-200'}`}
        />
      )}
      {errors[name] && (
        <p className="text-xs text-red-500 font-medium">{errors[name].message}</p>
      )}
    </div>
  )

  const ImageUpload = ({ label, name }) => {
    const fileList = getValues(name)
    const hasFile = fileList && fileList.length > 0
    
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
          <input 
            type="file" 
            accept="image/jpeg, image/png"
            {...register(name)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${hasFile ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
            {hasFile ? <Check size={20} /> : <UploadCloud size={20} />}
          </div>
          <span className={`text-xs font-medium ${hasFile ? 'text-emerald-700' : 'text-slate-600'}`}>
            {hasFile ? fileList[0].name : 'Click to upload image'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">JPEG, PNG (Max 5MB)</span>
        </div>
      </div>
    )
  }

  return (
    <PageWrapper 
      title={isEditing ? 'Edit Customer' : 'Add New Customer'}
      subtitle="Complete the wizard to register a customer and guarantors."
      breadcrumbs={[{ label: 'Customers', to: '/customers' }, { label: isEditing ? 'Edit' : 'New' }]}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-slate-500 font-medium">Loading customer data...</div>
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
            {/* Progress line */}
            <div className="absolute top-[44px] left-[12%] right-[12%] h-1 bg-slate-100 z-0">
              <div 
                className="h-full bg-blue-600 transition-all duration-300" 
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Form Content ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="erp-card overflow-hidden">
          <div className="p-6 md:p-8">
            
            {/* STEP 1 */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Full Name" name="fullName" placeholder="e.g. Muhammad Ali" />
                  <InputField label="Father's Name" name="fatherName" placeholder="e.g. Ahmad Khan" />
                  <InputField label="CNIC Number" name="cnic" placeholder="00000-0000000-0" />
                  <InputField label="City" name="city" placeholder="e.g. Lahore" />
                  <InputField label="Primary Phone" name="phone" placeholder="0300-0000000" />
                  <InputField label="Alternate Phone" name="altPhone" placeholder="Optional" />
                  <div className="md:col-span-2">
                    <InputField label="Complete Address" name="address" placeholder="House/Street info..." as="textarea" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 border-b pb-3 pt-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <ImageUpload label="Customer Photo" name="photo" />
                  <ImageUpload label="CNIC Front" name="cnicFront" />
                  <ImageUpload label="CNIC Back" name="cnicBack" />
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Guarantor 1 (Business Sector)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Full Name" name="g1Name" />
                  <InputField label="CNIC Number" name="g1Cnic" placeholder="00000-0000000-0" />
                  <InputField label="Phone Number" name="g1Phone" placeholder="0300-0000000" />
                  <div className="md:col-span-2">
                    <InputField label="Home Address" name="g1Address" as="textarea" />
                  </div>
                  <InputField label="Business Name" name="g1Business" placeholder="e.g. Ali Traders" />
                  <InputField label="Business Type" name="g1Type" placeholder="e.g. Electronics Shop" />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Guarantor 2 (Government Servant)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Full Name" name="g2Name" />
                  <InputField label="CNIC Number" name="g2Cnic" placeholder="00000-0000000-0" />
                  <InputField label="Phone Number" name="g2Phone" placeholder="0300-0000000" />
                  <div className="md:col-span-2">
                    <InputField label="Home Address" name="g2Address" as="textarea" />
                  </div>
                  <InputField label="Department/Office" name="g2Dept" placeholder="e.g. WAPDA" />
                  <InputField label="Designation" name="g2Desig" placeholder="e.g. Line Superintendent" />
                  <InputField label="Employee ID" name="g2EmpId" placeholder="Optional" />
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Review Information</h3>
                <div className="bg-slate-50 p-6 rounded-xl space-y-6 text-sm">
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2 uppercase tracking-wide text-xs">Customer Detail</h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <p><span className="text-slate-500">Name:</span> {getValues('fullName')}</p>
                      <p><span className="text-slate-500">CNIC:</span> {getValues('cnic')}</p>
                      <p><span className="text-slate-500">Phone:</span> {getValues('phone')}</p>
                      <p><span className="text-slate-500">City:</span> {getValues('city')}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-blue-600 mb-2 uppercase tracking-wide text-xs">Guarantor 1</h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <p><span className="text-slate-500">Name:</span> {getValues('g1Name')}</p>
                      <p><span className="text-slate-500">CNIC:</span> {getValues('g1Cnic')}</p>
                      <p><span className="text-slate-500">Business:</span> {getValues('g1Business')}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-blue-600 mb-2 uppercase tracking-wide text-xs">Guarantor 2</h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <p><span className="text-slate-500">Name:</span> {getValues('g2Name')}</p>
                      <p><span className="text-slate-500">CNIC:</span> {getValues('g2Cnic')}</p>
                      <p><span className="text-slate-500">Dept:</span> {getValues('g2Dept')}</p>
                    </div>
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
              <button
                type="button"
                className="px-5 py-2.5 text-slate-600 font-medium hover:text-slate-900 transition-colors"
              >
                Save as Draft
              </button>
              
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
                  <Save size={18} /> {isSubmitting ? 'Saving...' : 'Confirm & Save'}
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
