import { Loader2 } from 'lucide-react'

/**
 * LoadingSpinner — used inside cards, pages, or buttons.
 *
 * @param {{ size?: 'sm'|'md'|'lg', label?: string, fullPage?: boolean }} props
 */
export default function LoadingSpinner({ size = 'md', label = 'Loading…', fullPage = false }) {
  const iconSize = { sm: 16, md: 24, lg: 40 }[size]
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size]

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        size={iconSize}
        className="animate-spin text-blue-600"
        strokeWidth={2}
      />
      {label && (
        <p className={`${textSize} text-slate-500 font-medium`}>{label}</p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-16 w-full">
      {spinner}
    </div>
  )
}
