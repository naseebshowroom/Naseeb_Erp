import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ── Hook ───────────────────────────────────────────────────────
export function usePagination(data = [], pageSize = 20) {
  const [page, setPage] = useState(1)

  // Reset to page 1 whenever data changes (filter/search)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const safePage   = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, safePage, pageSize])

  return {
    page: safePage,
    setPage,
    totalPages,
    paginated,
    total: data.length,
    pageSize,
    from: data.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to:   Math.min(safePage * pageSize, data.length),
  }
}

// ── Component ──────────────────────────────────────────────────
export default function Pagination({ page, totalPages, total, from, to, onPageChange, pageSize, label = 'records' }) {
  if (total === 0) return null

  const pages = buildPages(page, totalPages)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm">
      <span className="text-slate-500">
        <span className="font-semibold text-slate-700">{from}–{to}</span> / {total} {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-2 text-slate-400 select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}
