import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * PageWrapper — standard page header used on every page.
 *
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   breadcrumbs?: Array<{ label: string, to?: string }>,
 *   actions?: React.ReactNode,
 *   children: React.ReactNode
 * }} props
 */
export default function PageWrapper({ title, subtitle, breadcrumbs = [], actions, children }) {
  return (
    <div className="space-y-6">
      {/* Header block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          {/* Breadcrumb */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-slate-400 mb-1.5 flex-wrap">
              <Link to="/dashboard" className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                <Home size={11} />
                Home
              </Link>
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight size={11} />
                  {crumb.to ? (
                    <Link to={crumb.to} className="hover:text-slate-600 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-500">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {/* Title */}
          <h1 className="text-xl font-bold text-slate-900 leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Actions slot */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  )
}
