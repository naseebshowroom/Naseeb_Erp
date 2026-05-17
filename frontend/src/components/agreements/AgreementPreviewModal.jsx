/**
 * AgreementPreviewModal.jsx
 * Shows the agreement, allows Print (browser dialog) and Download PDF.
 * Also records generation to backend via POST /api/agreements.
 */
import { useRef, useState } from 'react'
import { X, Printer, Download, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AgreementTemplate from './AgreementTemplate'
import { generateAgreementPDF } from '@/utils/generateAgreementPDF'
import api from '@/lib/axios'

export default function AgreementPreviewModal({ data, onClose }) {
  const templateRef = useRef(null)
  const [generating, setGenerating] = useState(false)

  // ── Record to backend ─────────────────────────────────────
  const recordGeneration = async () => {
    try {
      await api.post('/agreements', { installmentId: data.installment?._id || data.installment })
    } catch {
      // Silent — doesn't block printing
    }
  }

  // ── Print (browser dialog) ────────────────────────────────
  const handlePrint = async () => {
    await recordGeneration()
    window.print()
  }

  // ── Download PDF ──────────────────────────────────────────
  const handleDownload = async () => {
    setGenerating(true)
    try {
      await recordGeneration()
      await generateAgreementPDF(templateRef, data.customer?.fullName)
      toast.success('PDF download ho gayi!')
    } catch (err) {
      toast.error('PDF generate karne mein masla hua.')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      {/* Print CSS — hides everything except agreement */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #agreement-modal-overlay { display: block !important; position: static !important; background: none !important; padding: 0 !important; }
          #agreement-modal-box { box-shadow: none !important; max-width: 100% !important; height: auto !important; overflow: visible !important; }
          #agreement-modal-actions { display: none !important; }
        }
      `}</style>

      <div
        id="agreement-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      >
        <div
          id="agreement-modal-box"
          className="bg-white rounded-2xl shadow-2xl flex flex-col"
          style={{ width: '820px', maxWidth: '98vw', maxHeight: '92vh' }}
        >
          {/* ── Header bar ── */}
          <div
            id="agreement-modal-actions"
            className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0"
          >
            <div>
              <h2 className="font-bold text-slate-900 text-base">ایگریمنٹ پریویو</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {data.customer?.fullName} — {data.installment?.brand} {data.installment?.model}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Printer size={15} /> Print
              </button>
              <button
                onClick={handleDownload}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {generating
                  ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                  : <><Download size={14} /> PDF Download</>
                }
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Scrollable preview ── */}
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
            <div className="shadow-lg bg-white mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
              <AgreementTemplate ref={templateRef} data={data} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
