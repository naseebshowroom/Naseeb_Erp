/**
 * StatusBadge — renders a coloured pill for any entity status.
 *
 * Supported statuses (case-insensitive):
 *   paid | overdue | upcoming | active | completed | defaulted | pending
 *   available | inactive | cancelled
 */

const VARIANTS = {
  paid:      { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Paid' },
  active:    { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Active' },
  upcoming:  { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Upcoming' },
  pending:   { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Pending' },
  overdue:   { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',     label: 'Overdue' },
  defaulted: { bg: 'bg-red-200',     text: 'text-red-800',     dot: 'bg-red-700',     label: 'Defaulted' },
  completed: { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-500',  label: 'Completed' },
  available: { bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-500',   label: 'Available' },
  inactive:  { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400',   label: 'Inactive' },
  cancelled: { bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400',   label: 'Cancelled' },
}

/**
 * @param {{ status: string, showDot?: boolean, size?: 'sm'|'md' }} props
 */
export default function StatusBadge({ status = 'pending', showDot = true, size = 'md' }) {
  const key = status.toLowerCase()
  const v = VARIANTS[key] ?? VARIANTS.pending

  const padding  = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  const dotSize  = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold leading-none
        ${padding} ${v.bg} ${v.text}`}
    >
      {showDot && <span className={`rounded-full flex-shrink-0 ${dotSize} ${v.dot}`} />}
      {v.label}
    </span>
  )
}
