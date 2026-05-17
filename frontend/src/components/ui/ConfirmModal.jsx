import { AlertTriangle, X } from 'lucide-react'

/**
 * Reusable Confirmation Modal.
 *
 * @param {{
 *   isOpen: boolean,
 *   title: string,
 *   message: string,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   confirmVariant?: 'danger' | 'success' | 'primary',
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Yes, Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  const btnClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/20 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/20 text-white',
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20 text-white',
  }

  const iconColors = {
    danger: 'text-red-600 bg-red-50 border-red-100',
    success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    primary: 'text-blue-600 bg-blue-50 border-blue-100',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconColors[confirmVariant]}`}>
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-base font-black text-slate-900">{title}</h2>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <div className="p-5 text-sm text-slate-500 leading-relaxed border-b border-slate-50">
          {message}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-4 bg-slate-50/50 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors text-xs"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 font-bold rounded-xl transition-colors text-xs focus:outline-none focus:ring-4 ${btnClasses[confirmVariant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
