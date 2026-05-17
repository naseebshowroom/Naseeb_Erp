import { useState, useEffect, useRef } from 'react'
import { X, Download, Loader2, CheckCircle, ArrowLeft, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import MotorcycleAgreement from './MotorcycleAgreement'
import ElectronicsAgreement from './ElectronicsAgreement'
import CarAgreement from './CarAgreement'
import SaleReceipt from './SaleReceipt'
import { agreementService } from '@/services/agreementService'

// Map internal doc-type IDs → backend route slugs
const PDF_ROUTE = {
  electronics_agreement: 'electronics-agreement',
  motorcycle_agreement:  'motorcycle-agreement',
  car_agreement:         'car-agreement',
  sale_receipt:          'sale-receipt',
}

export default function DocumentModal({ installment, customer, onClose, onRefresh, initialTab }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [marking, setMarking] = useState(false)
  const [activeTab, setActiveTab] = useState(null)
  const pendingRef = useRef(false)

  const category = installment?.category?.toLowerCase()
  const isMotorcycle = category === 'motorcycle'
  const isCar = category === 'car'

  // Build tab list based on product category
  const tabs = []
  if (isMotorcycle) {
    tabs.push({ id: 'motorcycle_agreement', label: 'Motorcycle Agreement', component: MotorcycleAgreement })
    tabs.push({ id: 'sale_receipt',          label: 'Sale Receipt',          component: SaleReceipt })
  } else if (isCar) {
    tabs.push({ id: 'car_agreement', label: 'Car Agreement', component: CarAgreement })
    tabs.push({ id: 'sale_receipt',   label: 'Sale Receipt',  component: SaleReceipt })
  } else {
    // Default: electronics
    tabs.push({ id: 'electronics_agreement', label: 'Electronics Agreement', component: ElectronicsAgreement })
  }

  useEffect(() => {
    if (initialTab && tabs.some(t => t.id === initialTab)) {
      setActiveTab(initialTab)
    } else if (tabs.length > 0) {
      setActiveTab(tabs[0].id)
    }
  }, [installment, initialTab])

  const activeTabData = tabs.find(t => t.id === activeTab)
  const ActiveComponent = activeTabData?.component

  // ── Download PDF from server ──────────────────────────────────────────────
  const downloadPDF = async () => {
    if (pendingRef.current) return
    pendingRef.current = true
    setIsGenerating(true)

    const route = PDF_ROUTE[activeTab]
    if (!route) {
      toast.error('PDF generation is not available for this document type.')
      pendingRef.current = false
      setIsGenerating(false)
      return
    }

    try {
      const response = await api.post(
        `/pdf/${route}`,
        { installmentId: installment._id },
        { responseType: 'blob' }
      )

      // Trigger browser download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url  = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `${route}-${(customer?.fullName || 'Agreement').replace(/\s+/g, '-')}-${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('PDF downloaded successfully!')

      // Silently mark as printed
      markAsPrinted(false)

    } catch (err) {
      console.error('[DocumentModal] PDF download error:', err)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      pendingRef.current = false
      setIsGenerating(false)
    }
  }

  // ── Mark as printed ───────────────────────────────────────────────────────
  const markAsPrinted = async (showToast = true) => {
    if (showToast) setMarking(true)
    try {
      await agreementService.markAsPrinted({
        installmentId: installment._id,
        documentType:  activeTab,
      })
      if (showToast) toast.success('Marked as printed!')
      if (onRefresh) onRefresh()
    } catch (err) {
      if (showToast) toast.error('Failed to update status.')
      console.error(err)
    } finally {
      if (showToast) setMarking(false)
    }
  }

  if (!activeTab) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[94vh] overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Generate Official PDF</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {customer?.fullName} — {installment?.brand} {installment?.model}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div className="flex px-6 border-b border-slate-100 bg-slate-50/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-bold transition-all relative ${
                activeTab === tab.id
                  ? 'text-black'
                  : 'text-slate-400 hover:text-black'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── Document preview ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-start">
          <div style={{ transform: 'scale(0.6)', transformOrigin: 'top left', flexShrink: 0 }}>
            <div className="bg-white shadow-2xl border border-slate-200">
              {ActiveComponent && (
                <ActiveComponent installment={installment} customer={customer} />
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
            >
              <ArrowLeft size={18} /> Back
            </button>

            <div className="flex items-center gap-3">
              {/* Download PDF */}
              {PDF_ROUTE[activeTab] && (
                <button
                  onClick={downloadPDF}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-bold rounded-xl
                             hover:bg-slate-800 transition-all shadow-sm
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating
                    ? <><Loader2 size={18} className="animate-spin" /> Generating PDF...</>
                    : <><Download size={18} /> Download Official PDF</>
                  }
                </button>
              )}

              {/* Mark as printed */}
              <button
                onClick={() => markAsPrinted(true)}
                disabled={marking}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-black
                           font-bold rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                {marking
                  ? <Loader2 size={18} className="animate-spin" />
                  : <CheckCircle size={18} />
                }
                Mark as Printed
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <Info size={14} className="text-blue-400 shrink-0" />
            <span>
              PDFs are generated server-side using Puppeteer for pixel-perfect Urdu typography.
              Generation takes ~10s on first run; subsequent PDFs are faster.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
