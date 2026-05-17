import { AlertTriangle, RefreshCcw } from 'lucide-react'

/**
 * ErrorState — shown when an API call fails.
 *
 * @param {{
 *   message?: string,
 *   onRetry?: () => void
 * }} props
 */
export default function ErrorState({
  message = 'Failed to load data. Please try again.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5 border border-red-100">
        <AlertTriangle size={30} className="text-red-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">Something went wrong</h3>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
        >
          <RefreshCcw size={16} />
          Retry Request
        </button>
      )}
    </div>
  )
}
