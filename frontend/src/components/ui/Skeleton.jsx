/**
 * Skeleton loader components for professional loading states.
 * Prevents layout shift — same size as the content they replace.
 */

// Base pulse block
export const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

// Single-line text skeleton
export const SkeletonText = ({ className = 'h-4 w-3/4' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} />
);

// Summary card skeleton (matches the 6 dashboard cards)
export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-3 w-24 bg-slate-200 rounded-md" />
      <div className="h-8 w-8 bg-slate-200 rounded-xl" />
    </div>
    <div className="h-8 w-32 bg-slate-200 rounded-lg mb-2" />
    <div className="h-3 w-20 bg-slate-200 rounded-md" />
  </div>
);

// Table row skeleton
export const SkeletonRow = ({ cols = 6 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded-md animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
      </td>
    ))}
  </tr>
);

// Full table skeleton
export const SkeletonTable = ({ rows = 5, cols = 6 }) => (
  <div className="erp-card overflow-hidden">
    {/* Header */}
    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
      <div className="h-9 w-64 bg-slate-200 rounded-xl animate-pulse" />
      <div className="h-9 w-32 bg-slate-200 rounded-xl animate-pulse ml-auto" />
    </div>
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-100">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-6 py-4">
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

// Page header skeleton
export const SkeletonPageHeader = () => (
  <div className="flex justify-between items-center mb-8 animate-pulse">
    <div>
      <div className="h-8 w-48 bg-slate-200 rounded-xl mb-2" />
      <div className="h-4 w-72 bg-slate-200 rounded-lg" />
    </div>
    <div className="h-10 w-32 bg-slate-200 rounded-xl" />
  </div>
);

// Dashboard skeleton (6 cards + chart placeholder)
export const SkeletonDashboard = () => (
  <div className="space-y-6">
    <SkeletonPageHeader />
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
    <div className="erp-card p-6 animate-pulse">
      <div className="h-6 w-48 bg-slate-200 rounded-lg mb-6" />
      <div className="h-64 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

// Error state with retry
export const ErrorState = ({ message = 'Failed to load data.', onRetry }) => (
  <div className="erp-card p-12 flex flex-col items-center justify-center text-center gap-4">
    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
      <span className="text-3xl">⚠️</span>
    </div>
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">Something went wrong</h3>
      <p className="text-sm text-slate-500 max-w-md">{message}</p>
    </div>
    {onRetry && (
      <button onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm">
        Try Again
      </button>
    )}
  </div>
);

// Empty state
export const EmptyState = ({ title = 'No records found', description = 'Try adjusting your search or filters.', icon = '📋', action }) => (
  <div className="erp-card p-12 flex flex-col items-center justify-center text-center gap-4">
    <span className="text-5xl">{icon}</span>
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md">{description}</p>
    </div>
    {action}
  </div>
);
