import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  Package, Calendar, Wallet, CheckCircle2, 
  Clock, Edit, FileText, X, User, DollarSign, BookOpen, Printer, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/ui/PageWrapper'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import installmentService from '@/services/installmentService'
import paymentService from '@/services/paymentService'
import { handleApiError } from '@/utils/errorHandler'
import DocumentModal from '@/components/documents/DocumentModal'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'

// ── Payment Modal ──────────────────────────────────────────────
function VasooliModal({ installment, onClose, onSuccess }) {
  const { user } = useAuthStore()
  const [currentInst, setCurrentInst] = useState(installment)
  const [amount, setAmount]       = useState(Math.round(installment.perInstallmentAmount || 0))
  const [paymentMode, setPaymentMode] = useState('cash')
  const [collectedBy, setCollectedBy] = useState(user?._id || user?.id || '')
  const [collectorName, setCollectorName] = useState(user?.name || user?.fullName || 'Owner')
  const [notes, setNotes]         = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [customerInstallments, setCustomerInstallments] = useState([])
  const [submitting, setSubmitting] = useState(false)

  // Fetch all active installments for this customer
  useEffect(() => {
    const fetchOthers = async () => {
      try {
        const customerId = installment.customer?._id || installment.customer;
        const res = await installmentService.getInstallments({ customer: customerId });
        if (res.success) {
          setCustomerInstallments(res.data.filter(i => i.status !== 'completed' && !i.isDeleted));
        }
      } catch (err) { console.error(err) }
    }
    fetchOthers()
  }, [installment.customer])

  // Which schedule slot is next pending?
  const nextSlot = currentInst.paymentSchedule?.find(s => s.status === 'pending')

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Rakam darj karein')
      return
    }
    setSubmitting(true)
    try {
      await paymentService.recordPayment({
        installment:    currentInst._id,
        customer:       currentInst.customer?._id || currentInst.customer,
        amount:         Number(amount),
        paymentMode,
        scheduleEntryId: nextSlot?._id,
        paymentDate,
        notes,
        receivedBy:     collectedBy || undefined,
        collectorName,
      })
      toast.success('Adaigi kamyabi se darj ho gayi!')
      onSuccess()
    } catch (err) {
      handleApiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const collectors = [
    { id: user?._id || user?.id, name: user?.name || user?.fullName || 'Owner (Aap)' },
    { id: 'worker1', name: 'Worker 1' },
    { id: 'worker2', name: 'Worker 2' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="text-emerald-600" size={20} /> Adaigi Darj Karein
            </h2>
            <div className="flex flex-col mt-0.5">
              <span className="text-sm font-bold text-slate-700">{currentInst.customer?.fullName}</span>
              {customerInstallments.length > 1 ? (
                <select 
                  className="mt-1 text-xs font-medium text-blue-600 bg-blue-50 border-none rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  value={currentInst._id}
                  onChange={(e) => {
                    const selected = customerInstallments.find(i => i._id === e.target.value)
                    if (selected) {
                      setCurrentInst(selected)
                      setAmount(Math.round(selected.perInstallmentAmount || 0))
                    }
                  }}
                >
                  {customerInstallments.map(i => (
                    <option key={i._id} value={i._id}>{i.brand} {i.model} ({i.category})</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-500">{currentInst.brand} {currentInst.model}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Next due info */}
          {nextSlot && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
              <span className="text-amber-700 font-medium">Agli Qist Ki Tareekh: </span>
              <span className="font-bold text-amber-900">{formatDate(nextSlot.dueDate)}</span>
              <span className="ml-4 text-amber-700">Rakam: </span>
              <span className="font-bold text-amber-900">{formatCurrency(installment.perInstallmentAmount)}</span>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Adaigi Rakam (Amount)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rs.</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                placeholder="e.g. 5000"
              />
            </div>
          </div>

          {/* Collected By */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <User size={14} /> Kisne Wasool Ki (Collected By)
            </label>
            <input
              type="text"
              value={collectorName}
              onChange={e => setCollectorName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Naam darj karein (e.g. Naseeb, Worker Ali)"
            />
          </div>

          {/* Date & Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Adaigi Ki Tareekh</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="cash">Cash (Naqd)</option>
                <option value="bank">Bank / Transfer</option>
                <option value="other">Other (Digar)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nuktaat (Notes) — Ikhtyari</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              placeholder="Koi khas baat..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">
            Waapis
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
          >
            <DollarSign size={16} />
            {submitting ? 'Darj ho raha hai...' : 'Adaigi Darj Karein'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function InstallmentDetail() {
  const { id } = useParams()
  const [data, setData]               = useState(null)
  const [isLoading, setIsLoading]     = useState(true)
  const [agreementOpen, setAgreementOpen] = useState(false)
  const [vasooliOpen, setVasooliOpen] = useState(false)
  const [activeTab, setActiveTab]     = useState('overview') // 'overview' | 'khata'
  const [ledger, setLedger]           = useState(null)
  const [ledgerLoading, setLedgerLoading] = useState(false)
  const [bulkPayModal, setBulkPayModal] = useState(false)
  const [bulkAmount, setBulkAmount]   = useState('')
  const [bulkSaving, setBulkSaving]   = useState(false)

  const loadData = async () => {
    try {
      const res = await installmentService.getInstallment(id)
      if (res.success) setData(res.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id])

  const loadLedger = async () => {
    setLedgerLoading(true)
    try {
      const r = await api.get(`/installments/${id}/ledger`)
      setLedger(r.data.data)
    } catch { toast.error('Ledger load nahi ho saka') }
    finally { setLedgerLoading(false) }
  }

  useEffect(() => { if (activeTab === 'khata') loadLedger() }, [activeTab])

  const handleBulkPay = async () => {
    if (!bulkAmount || Number(bulkAmount) <= 0) { toast.error('Raqam darj karein'); return }
    setBulkSaving(true)
    try {
      await api.post('/payments/schedule/bulk-pay', { installmentId: id, amount: Number(bulkAmount) })
      toast.success('Payment FIFO se lagayi gayi!')
      setBulkPayModal(false); setBulkAmount('')
      loadLedger(); loadData()
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setBulkSaving(false) }
  }

  const handleSlotStatus = async (slotId, status) => {
    // 1. Save state for rollback
    const previousLedger = ledger ? { ...ledger } : null;

    // 2. Perform optimistic state update
    if (ledger && ledger.schedule) {
      const updatedSchedule = ledger.schedule.map(slot => {
        if (slot._id === slotId) {
          return { ...slot, status };
        }
        return slot;
      });
      setLedger(prev => ({ ...prev, schedule: updatedSchedule }));
    }

    try {
      // 3. Perform background API call
      await api.patch(`/payments/schedule/${slotId}/status`, { status, installmentId: id });
      toast.success(`Slot ${status === 'paid' ? '✅ Paid' : '❌ Missed'} mark ho gaya!`);
      // 4. Background refetch to ensure exact sync
      loadLedger();
      loadData();
    } catch (e) {
      // 5. Rollback on failure
      if (previousLedger) setLedger(previousLedger);
      toast.error(e.response?.data?.message || 'Error');
    }
  }

  const printStatement = async () => {
    try {
      const r = await api.post('/pdf/customer-statement', { installmentId: id }, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch { toast.error('Print nahi ho saka') }
  }

  if (isLoading) {
    return (
      <PageWrapper title="Khata Tafseel" breadcrumbs={[{ label: 'Khatey', to: '/installments' }, { label: 'Tafseel' }]}>
        <div className="flex justify-center items-center h-64 text-slate-500 font-medium animate-pulse">Khata load ho raha hai...</div>
      </PageWrapper>
    )
  }

  if (!data) {
    return (
      <PageWrapper title="Khata Tafseel" breadcrumbs={[{ label: 'Khatey', to: '/installments' }, { label: 'Tafseel' }]}>
        <div className="flex justify-center items-center h-64 text-red-500 font-medium">Khata nahi mila.</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper 
      title={`Khata #${data._id.substring(data._id.length - 6).toUpperCase()}`}
      breadcrumbs={[{ label: 'Khatey', to: '/installments' }, { label: `Tafseel` }]}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setAgreementOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
          >
            <FileText size={16} /> Documents
          </button>
          <Link to={`/installments/${data._id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <Edit size={16} /> Edit Karein
          </Link>
          <button
            onClick={() => setVasooliOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Wallet size={16} /> Adaigi Wasool Karein
          </button>
        </div>
      }
    >
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
        {[['overview','📋 Overview'], ['khata','📒 Khata (Ledger)']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>{label}</button>
        ))}
      </div>

      {activeTab === 'khata' && (
        <div className="space-y-4">
          {/* Khata Summary */}
          {ledger && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[['Total Price', ledger.installment.installmentPrice, '#1a1a6e'],
                  ['Total Paid', ledger.summary.totalPaid, '#166534'],
                  ['Arrears (Baqaya)', ledger.summary.arrears, '#dc2626'],
                  ['Remaining', ledger.installment.remainingAmount, '#92400e']
                ].map(([label, val, color]) => (
                  <div key={label} className="erp-card p-4 text-center">
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className="text-lg font-black" style={{color}}>{formatCurrency(val)}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <div className="flex gap-2">
                  <button onClick={() => setBulkPayModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700">
                    <DollarSign size={15} /> Pay Custom Amount (FIFO)
                  </button>
                  <button onClick={printStatement}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-medium rounded-xl hover:bg-indigo-100">
                    <Printer size={15} /> Print Khata
                  </button>
                </div>
                {ledger.installment.assetId && (
                  <Link to={`/assets/${ledger.installment.assetId}/history`}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                    <ExternalLink size={14} /> View Asset History
                  </Link>
                )}
              </div>
              {/* Schedule table */}
              <div className="erp-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['#', 'Due Date', 'Amount', 'Status', 'Paid On', 'Collected By', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledger.schedule.map((slot, i) => (
                        <tr key={slot._id} className={`${slot.status === 'missed' ? 'bg-red-50/60' : slot.status === 'paid' ? 'bg-emerald-50/40' : 'bg-white'}`}>
                          <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-700">
                            {slot.dueDate ? new Date(slot.dueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                          </td>
                          <td className="px-4 py-2.5 font-bold">{formatCurrency(slot.paidAmount || ledger.installment.perInstallmentAmount)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              slot.status === 'paid' ? 'bg-emerald-100 text-emerald-700'
                              : slot.status === 'missed' ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                            }`}>
                              {slot.status === 'paid' ? '✅ Paid' : slot.status === 'missed' ? '❌ Missed' : '🟡 Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">
                            {slot.paidDate ? new Date(slot.paidDate).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{slot.collectedBy?.name || '—'}</td>
                          <td className="px-4 py-2.5">
                            {slot.status !== 'paid' && (
                              <button onClick={() => handleSlotStatus(slot._id, 'paid')}
                                className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 mr-1">✅ Mark Paid</button>
                            )}
                            {slot.status !== 'missed' && slot.status !== 'paid' && (
                              <button onClick={() => handleSlotStatus(slot._id, 'missed')}
                                className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">❌ Missed</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {ledgerLoading && <div className="erp-card p-10 text-center text-slate-400 animate-pulse">Ledger load ho raha hai...</div>}
        </div>
      )}

      {activeTab === 'overview' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Left Column: Product & Financials ── */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="erp-card p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="text-blue-600" size={20} /> Samaan Ki Tafseel
              </h3>
              <StatusBadge status={data.status} />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Qisam (Category)</span>
                <span className="font-medium text-slate-900 capitalize">{data.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Samaan</span>
                <span className="font-bold text-slate-900">{data.brand} {data.model}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Rang (Color)</span>
                <span className="font-medium text-slate-900">{data.color || 'N/A'}</span>
              </div>
              {data.engineNumber && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Engine No.</span>
                  <span className="font-mono text-slate-900">{data.engineNumber}</span>
                </div>
              )}
              {data.chassisNumber && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Chassis No.</span>
                  <span className="font-mono text-slate-900">{data.chassisNumber}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to={`/customers/${data.customer?._id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {data.customer?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{data.customer?.fullName}</p>
                    <p className="text-xs text-slate-500">{data.customer?.phone}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="erp-card p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wallet className="text-blue-400" size={20} /> Rakam Ka Khulasa
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Kul Qistain Wali Keemat</span>
                <span className="text-2xl font-black text-white">{formatCurrency(data.installmentPrice)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/50">
                  <span className="block text-emerald-400 text-xs uppercase tracking-wider mb-1">Kul Adaigi (Paid)</span>
                  <span className="text-lg font-bold text-emerald-100">{formatCurrency(data.totalPaid)}</span>
                </div>
                <div className="bg-red-900/30 p-3 rounded-xl border border-red-800/50">
                  <span className="block text-red-400 text-xs uppercase tracking-wider mb-1">Baqaya Rakam</span>
                  <span className="text-lg font-bold text-red-100">{formatCurrency(data.remainingAmount)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-700 text-sm">
                <span className="text-slate-400">Peshgi Rakam (Advance)</span>
                <span className="font-bold">{formatCurrency(data.advanceAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-slate-400">Munafa</span>
                <span className="font-bold text-blue-300">{formatCurrency(data.installmentPrice - data.purchasePrice)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right Column: Schedule & History ── */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} /> Qiston Ka Schedule
              </h3>
              <div className="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                {formatCurrency(data.perInstallmentAmount)} / {data.scheduleType} | Shuru: {formatDate(data.startDate)}
              </div>
            </div>
            
            <div className="p-6">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Qiston Ka Status (Status)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.paymentSchedule && (() => {
                  // Show the last paid one and the next 2 pending ones for context
                  const paidCount = data.paymentSchedule.filter(s => s.status === 'paid').length;
                  const startIndex = Math.max(0, paidCount - 1);
                  const displaySlots = data.paymentSchedule.slice(startIndex, startIndex + 3);

                  return displaySlots.map((schedule, idx) => {
                    const isPaid = schedule.status === 'paid';
                    const isNext = !isPaid && schedule._id === data.paymentSchedule?.find(s => s.status === 'pending')?._id;
                    const isLate = isPaid && new Date(schedule.paidDate) > new Date(schedule.dueDate);

                    return (
                      <div key={schedule._id} className={`p-4 rounded-xl border transition-all ${
                        isPaid ? 'bg-emerald-50 border-emerald-100 opacity-80' : 
                        isNext ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/10' : 
                        'bg-white border-slate-200'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          {isPaid ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Clock size={16} className={isNext ? 'text-amber-500' : 'text-slate-400'} />}
                          <div className="flex flex-col items-end gap-1">
                            {isPaid && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase tracking-wider">Paid</span>}
                            {isLate && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase tracking-wider">Late</span>}
                            {isNext && <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded uppercase tracking-wider">Agli</span>}
                          </div>
                        </div>
                        <div className={`text-lg font-black ${isPaid ? 'text-emerald-700' : isNext ? 'text-amber-700' : 'text-slate-900'}`}>
                          {formatCurrency(isPaid ? (schedule.paidAmount || data.perInstallmentAmount) : data.perInstallmentAmount)}
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-1">
                          {isPaid ? `Adaigi: ${formatDate(schedule.paidDate)}` : `Aakhri Tareekh: ${formatDate(schedule.dueDate)}`}
                        </div>
                        {isPaid && isLate && (
                          <div className="text-[10px] text-red-500 font-bold mt-1">
                            {Math.ceil((new Date(schedule.paidDate) - new Date(schedule.dueDate)) / (1000 * 60 * 60 * 24))} din late
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
                {(!data.paymentSchedule || data.paymentSchedule.length === 0) && (
                  <div className="col-span-3 text-center text-slate-500 py-4">Koi schedule nahi mila.</div>
                )}
              </div>
            </div>
          </div>

          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={20} /> Pichli Adaigiyan (History)
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Tareekh</th>
                    <th className="px-6 py-3">Rakam</th>
                    <th className="px-6 py-3">Haisiyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.paymentSchedule && data.paymentSchedule.filter(p => p.status === 'paid').length > 0 ? (
                    data.paymentSchedule.filter(p => p.status === 'paid').map((payment) => (
                      <tr key={payment._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{formatDate(payment.paidDate)}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(payment.paidAmount || data.perInstallmentAmount)}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">Paid</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-slate-500">Abhi tak koi adaigi nahi hui.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
      )}

      {/* Vasooli Modal */}
      {vasooliOpen && data && (
        <VasooliModal
          installment={data}
          onClose={() => setVasooliOpen(false)}
          onSuccess={() => { setVasooliOpen(false); setIsLoading(true); loadData() }}
        />
      )}

      {/* Document Modal */}
      {agreementOpen && data && (
        <DocumentModal
          installment={data}
          customer={data.customer}
          onClose={() => setAgreementOpen(false)}
        />
      )}

      {/* Bulk Pay Modal */}
      {bulkPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-1">💰 Pay Custom Amount (FIFO)</h3>
            <p className="text-sm text-slate-500 mb-4">Raqam enter karein. System oldest missed/pending installments pehle mark karega.</p>
            <input type="number" value={bulkAmount} onChange={e => setBulkAmount(e.target.value)}
              placeholder="e.g. 15000" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setBulkPayModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleBulkPay} disabled={bulkSaving}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {bulkSaving ? 'Lag rahi hai...' : 'Apply Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
