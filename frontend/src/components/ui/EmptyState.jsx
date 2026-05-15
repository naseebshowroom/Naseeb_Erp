import { PackageOpen } from 'lucide-react'

/**
 * EmptyState — shown when a list or table has no data.
 *
 * @param {{
 *   icon?: React.ElementType,
 *   title?: string,
 *   message?: string,
 *   action?: React.ReactNode
 * }} props
 */
export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Nothing here yet',
  message = 'There is no data to display at the moment.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <Icon size={30} className="text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
