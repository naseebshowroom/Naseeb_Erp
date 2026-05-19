import { useState, useEffect } from 'react'
import { Users, CheckCircle2, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/axios'

export default function WorkerReport() {
  const [workers, setWorkers] = useState([])
  const [selectedWorker, setSelectedWorker] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/auth/users').then(r => setWorkers(r.data.data || [])).catch(() => {})
  }, [])

  const fetchReport = async () => {
    if (!selectedWorker) { toast.error('Worker chunein'); return }
    setLoading(true)
    try {
      const r = await api.get(`/workers/${selectedWorker}/collection-report?date=${date}`)
      setReport(r.data.data)
    } catch { toast.error('Report load nahi ho saka') }
    finally { setLoading(false) }
  }

  const statusBadge = (s) => {
    if (s === 'paid') return <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded">✅ Paid</span>
    if (s === 'missed') return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded">❌ Missed</span>
    return <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded">🟡 Pending</span>
  }

  const allRows = report ? [
    ...report.paid.map(r => ({ ...r, _status: 'paid' })),
    ...report.missed.map(r => ({ ...r, _status: 'missed' })),
    ...report.pending.map(r => ({ ...r, _status: 'pending' })),
  ] : []

  return (
    <PageWrapper title="Worker Collection Report" subtitle="Kisi bhi worker ki roz ki vasooli dekhein">
      {/* Filters */}
      <div className="erp-card p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1 flex-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700">Worker Chunein</label>
            <select value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">-- Worker Select Karein --</option>
              {workers.map(w => <option key={w._id} value={w._id}>{w.fullName || w.name || w.username}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Tariikh</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <button onClick={fetchReport} disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Load ho raha...' : 'Report Dekhein'}
          </button>
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="erp-card p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl"><Users className="text-blue-600" size={22} /></div>
              <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Assigned</div>
                <div className="text-2xl font-black text-slate-900">{report.totals.assignedCount}</div>
                <div className="text-xs text-slate-400">customers today</div>
              </div>
            </div>
            <div className="erp-card p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl"><CheckCircle2 className="text-emerald-600" size={22} /></div>
              <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Collected</div>
                <div className="text-2xl font-black text-emerald-600">{formatCurrency(report.totals.totalCollected)}</div>
                <div className="text-xs text-slate-400">{report.totals.collectedCount} customers</div>
              </div>
            </div>
            <div className="erp-card p-5 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl"><XCircle className="text-red-600" size={22} /></div>
              <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Missed</div>
                <div className="text-2xl font-black text-red-600">{report.totals.missedCount}</div>
                <div className="text-xs text-slate-400">customers</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="erp-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Collection Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    {['Customer', 'Item', 'Khata #', 'Due Amount', 'Collected', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allRows.length > 0 ? allRows.map((row, i) => (
                    <tr key={i} className={`hover:bg-slate-50 ${row._status === 'missed' ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.customer?.fullName || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{row.brand} {row.model}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{row.khataNumber || '—'}</td>
                      <td className="px-4 py-3 font-bold">{formatCurrency(row.perInstallmentAmount)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">
                        {row._status === 'paid' ? formatCurrency(row.scheduleEntry?.paidAmount || row.perInstallmentAmount) : '—'}
                      </td>
                      <td className="px-4 py-3">{statusBadge(row._status)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Koi data nahi mila.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="erp-card p-16 text-center text-slate-400">
          <Clock size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Worker aur tariikh chunein, phir "Report Dekhein" click karein.</p>
        </div>
      )}
    </PageWrapper>
  )
}
