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
import KhataTab from './components/KhataTab'
import ReceiptButton from '@/components/payments/ReceiptButton'
import { getItemDisplayName, getItemIcon } from '@/utils/itemHelper'
import CollectPaymentModal from '@/components/payments/CollectPaymentModal'
import Pagination, { usePagination } from '@/components/ui/Pagination'



// ── Main Component ─────────────────────────────────────────────
export default function InstallmentDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
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
  const [paymentsList, setPaymentsList] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const paymentsPg = usePagination(paymentsList, 10)

  const fetchPaymentsList = async () => {
    try {
      setPaymentsLoading(true)
      const res = await api.get('/payments', { params: { installmentId: id } })
      setPaymentsList(res.data.data || [])
    } catch (err) {
      console.error('[History Fetch Error]', err)
    } finally {
      setPaymentsLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const res = await installmentService.getInstallment(id)
      if (res.success) {
        setData(res.data)
        fetchPaymentsList()
      }
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
      title={data.khataNumber ? `Khata # ${data.khataNumber}` : `Khata #${data._id.substring(data._id.length - 6).toUpperCase()}`}
      breadcrumbs={[{ label: 'Khatey', to: '/installments' }, { label: data.khataNumber ? `Khata #${data.khataNumber}` : 'Tafseel' }]}
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
        <KhataTab
          installmentId={id}
          ledger={ledger}
          ledgerLoading={ledgerLoading}
          fetchLedger={() => { loadLedger(); loadData(); }}
          formatCurrency={formatCurrency}
          currentUser={user}
        />
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
              {data.khataNumber && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Khata Number</span>
                  <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs tracking-widest">{data.khataNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Qisam (Category)</span>
                <span className="font-medium text-slate-900 capitalize">{data.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Samaan</span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  {getItemIcon(data.category, 14)}
                  <span>{getItemDisplayName(data)}</span>
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Rang (Color)</span>
                <span className="font-medium text-slate-900">{data.color || 'N/A'}</span>
              </div>
              {/* BUG 3 FIX: Show item ownership (Malikiyat) */}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Malikiyat (Ownership)</span>
                <span className="font-bold text-slate-900">
                  {!data.investorName || data.investorName === 'Owner'
                    ? '🏠 Apna (Owner)'
                    : `🤝 Partner ka — ${data.investorName}`}
                </span>
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
              
              {data.paymentSchedule && data.paymentSchedule.length > 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden max-h-[350px] overflow-y-auto erp-scrollbar">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 backdrop-blur-md">
                        <th className="px-4 py-2.5 font-bold text-slate-700">Qist No.</th>
                        <th className="px-4 py-2.5 font-bold text-slate-700">Tareekh / Due Date</th>
                        <th className="px-4 py-2.5 font-bold text-slate-700">Rakam / Amount</th>
                        <th className="px-4 py-2.5 font-bold text-slate-700">Mili Rakam (Paid)</th>
                        <th className="px-4 py-2.5 font-bold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.paymentSchedule.map((schedule, idx) => {
                        const statusLower = schedule.status ? schedule.status.toLowerCase().trim() : 'pending';
                        const isPaid = statusLower === 'paid';
                        const isPartiallyPaid = statusLower === 'partially_paid';
                        const isMissed = statusLower === 'missed';
                        const isNext = !isPaid && !isPartiallyPaid && !isMissed && schedule._id === data.paymentSchedule?.find(s => s.status === 'pending')?._id;

                        let rowBg = 'bg-white';
                        if (isPaid) rowBg = 'bg-emerald-50/10';
                        else if (isMissed) rowBg = 'bg-red-50/10';
                        else if (isNext) rowBg = 'bg-amber-50/20';

                        return (
                          <tr key={schedule._id || idx} className={`${rowBg} hover:bg-slate-50/50 transition-colors`}>
                            <td className="px-4 py-2.5 font-bold text-slate-900">Qist {idx + 1}</td>
                            <td className="px-4 py-2.5 text-slate-600 font-medium">
                              {schedule.dueDate ? formatDate(schedule.dueDate) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-900 font-bold">
                              {formatCurrency(schedule.expectedAmount || data.perInstallmentAmount)}
                            </td>
                            <td className={`px-4 py-2.5 font-black ${schedule.paidAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {schedule.paidAmount > 0 ? formatCurrency(schedule.paidAmount) : '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              <StatusBadge status={schedule.status} showDot={true} size="sm" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  Koi schedule nahi mila.
                </div>
              )}
            </div>
          </div>

          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={20} /> Pichli Adaigiyan (History)
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
                True Payment Records
              </span>
            </div>
            
            <div className="overflow-x-auto bg-white">
              {paymentsLoading ? (
                <div className="p-8 text-center text-slate-400 animate-pulse font-medium">History load ho rahi hai...</div>
              ) : (
                <table className="w-full min-w-[700px] text-sm text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Receipt #</th>
                      <th className="px-6 py-3.5">Tareekh (Paid Date)</th>
                      <th className="px-6 py-3.5">Rakam (Amount)</th>
                      <th className="px-6 py-3.5">Collector</th>
                      <th className="px-6 py-3.5 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentsList.length > 0 ? (
                      paymentsPg.paginated.map((payment) => (
                        <tr key={payment._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">{payment.receiptNumber || 'RCP'}</td>
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-6 py-4 font-black text-emerald-600">{formatCurrency(payment.amount)}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600">
                            {payment.collectedBy?.fullName || payment.collectedBy?.name || 'Owner'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <ReceiptButton
                              paymentId={payment._id}
                              paymentStatus="paid"
                              receiptNumber={payment.receiptNumber}
                              variant="icon"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-medium">Abhi tak koi rasmi payment record nahi mila.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {!paymentsLoading && paymentsList.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/50">
                <Pagination {...paymentsPg} onPageChange={paymentsPg.setPage} label="payments" />
              </div>
            )}
          </div>

        </div>
      </div>
      )}

      {/* Vasooli Modal — pass full installment so modal auto-finds next pending slot */}
      <CollectPaymentModal
        isOpen={vasooliOpen}
        onClose={() => { setVasooliOpen(false); }}
        installment={data}
        currentUser={user}
        onSuccess={() => {
          loadData();
          if (activeTab === 'khata') loadLedger();
        }}
      />

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
