import { useState, Fragment } from 'react';
import { DollarSign, Printer, ExternalLink, X, Check, ChevronDown, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { recordBulkPayment } from '../../../services/paymentService';
import ReceiptButton from '../../../components/payments/ReceiptButton';
import StatusBadge from '../../../components/shared/StatusBadge';
import Pagination, { usePagination } from '@/components/ui/Pagination';
import CollectPaymentModal from '../../../components/payments/CollectPaymentModal';

const VIEW_DUE_DATE = 'due_date';
const VIEW_HISTORY  = 'history';

export default function KhataTab({
  installmentId, ledger, ledgerLoading, fetchLedger, formatCurrency, currentUser
}) {
  const [activeView, setActiveView]       = useState(VIEW_DUE_DATE);
  const [expandedSlots, setExpandedSlots] = useState({});

  // Bulk pay modal
  const [bulkPayModal, setBulkPayModal] = useState(false);
  const [bulkAmount, setBulkAmount]     = useState('');
  const [bulkLoading, setBulkLoading]   = useState(false);

  // CollectPaymentModal — dedicated state so data is always set BEFORE modal opens
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // ── Payment History pagination ─────────────────────────────────────────────
  // usePagination MUST be called unconditionally at the top level (Rules of Hooks).
  // We compute the grouped array here; it will be empty until ledger loads.
  const _paymentHistory = ledger?.paymentHistory ?? [];
  const _historyGroups = (() => {
    const groups = {};
    _paymentHistory.forEach(pmt => {
      const dayKey = pmt.paidDate
        ? new Date(pmt.paidDate).toLocaleDateString('en-CA')
        : 'unknown';
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(pmt);
    });
    return Object.entries(groups).sort(([a], [b]) => new Date(a) - new Date(b));
  })();
  const historyPg = usePagination(_historyGroups, 10);

  const toggleSlot = (slotId) => setExpandedSlots(prev => ({ ...prev, [slotId]: !prev[slotId] }));

  const printStatement = async () => {
    try {
      toast.loading('Statement tayyar ho rahi hai...');
      const r = await api.post('/pdf/customer-statement', { installmentId }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      toast.dismiss();
      window.open(url, '_blank');
      toast.success('Statement print ho gayi!');
    } catch { toast.dismiss(); toast.error('Statement generation failed'); }
  };

  const handleBulkPaySubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(bulkAmount);
    if (!amountNum || amountNum <= 0) { toast.error('Sahi raqam darj karein!'); return; }
    try {
      setBulkLoading(true);
      const res = await recordBulkPayment(installmentId, amountNum, currentUser?._id || currentUser?.id);
      if (res.success) {
        toast.success(`Rs. ${amountNum.toLocaleString()} bulk payment process ho gayi!`);
        setBulkPayModal(false); setBulkAmount(''); fetchLedger();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk payment failed.');
    } finally { setBulkLoading(false); }
  };

  // Open CollectPaymentModal for a specific schedule slot
  const openSlotPayModal = (slot) => {
    setSelectedEntry(slot);   // data is set BEFORE modal opens — no race condition
    setIsModalOpen(true);
  };

  // Called by CollectPaymentModal after a successful payment
  const handlePaymentSuccessRefetch = () => {
    fetchLedger();
  };

  const handleMarkMissed = async (slotId) => {
    if (!confirm('Kya is qist ko missed mark karna chahte hain?')) return;
    try {
      await api.patch(`/payments/schedule/${slotId}/status`, {
        status: 'missed', paidAmount: 0,
        collectedBy: currentUser?._id || currentUser?.id, paidDate: new Date()
      });
      toast.success('Qist missed mark ho gayi.'); fetchLedger();
    } catch { toast.error('Status update mein masla hua.'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (ledgerLoading) return (
    <div className="erp-card p-12 text-center text-slate-400 animate-pulse bg-white border border-slate-200 rounded-2xl">
      Ledger load ho rahi hai, intezar karein...
    </div>
  );

  if (!ledger) return null;

  const { schedule = [], paymentHistory = [], summary = {}, installment: inst = {} } = ledger;

  return (
    <div className="space-y-5">

      {/* ── Khata Number Header ── */}
      {inst.khataNumber && (
        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0">#</div>
          <div>
            <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Khata Number</div>
            <div className="text-2xl font-black text-indigo-900 tracking-widest font-mono">{inst.khataNumber}</div>
          </div>
          {inst.customer && (
            <div className="ml-auto text-right">
              <div className="text-xs text-indigo-500 font-bold">Gahak</div>
              <div className="font-bold text-indigo-900">{inst.customer.fullName}</div>
              <div className="text-xs text-indigo-600">{inst.customer.phone}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Summary Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Kul Keemat', val: inst.installmentPrice, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Jama Shuda', val: summary.totalPaid ?? inst.totalPaid, color: 'text-emerald-700 font-extrabold', bg: 'bg-emerald-50' },
          { label: 'Arrears (Shortfall)', val: summary.totalArrears ?? inst.totalArrears, color: 'text-red-600 font-extrabold', bg: 'bg-red-50' },
          { label: 'Baqaya Rakam', val: inst.remainingAmount, color: 'text-amber-700 font-extrabold', bg: 'bg-amber-50' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className={`erp-card p-4 rounded-xl border border-slate-200 text-center ${bg}`}>
            <div className="text-xs font-bold text-slate-500 mb-1">{label}</div>
            <div className={`text-lg font-black ${color}`}>{formatCurrency(val || 0)}</div>
          </div>
        ))}
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap gap-2 justify-between items-center bg-white p-4 border border-slate-200 rounded-xl">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setBulkPayModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95">
            <DollarSign size={15} /> Ikattha FIFO Payment
          </button>
          <button onClick={printStatement}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-sm font-bold rounded-xl transition-all active:scale-95">
            <Printer size={15} /> Print Statement
          </button>
        </div>
        {inst.assetId && (
          <Link to={`/assets/${inst.assetId}/history`}
            className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline">
            <ExternalLink size={13} /> Asset History
          </Link>
        )}
      </div>

      {/* ── View Toggle ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
        <button onClick={() => setActiveView(VIEW_DUE_DATE)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeView === VIEW_DUE_DATE ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Calendar size={14} /> Qist Dates (Due Date)
        </button>
        <button onClick={() => setActiveView(VIEW_HISTORY)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeView === VIEW_HISTORY ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Clock size={14} /> Payment History
        </button>
      </div>

      {/* ── DUE DATE VIEW ── */}
      {activeView === VIEW_DUE_DATE && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['#', 'Due Date', 'Expected', 'Collected', 'Progress', 'Status', 'Collector', 'Receipt', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedule.map((slot, i) => {
                  const statusLower   = slot.status?.toLowerCase() || 'pending';
                  const isPaid        = statusLower === 'paid';
                  const isPartial     = statusLower === 'partially_paid';
                  const isMissed      = statusLower === 'missed';
                  const isExpanded    = !!expandedSlots[slot._id];
                  const hasSubRows    = (slot.payments?.length ?? 0) > 0;
                  const progress      = slot.progressPercent ?? (isPaid ? 100 : 0);
                  let rowBg = 'bg-white';
                  if (isMissed) rowBg = 'bg-red-50/30';
                  else if (isPaid) rowBg = 'bg-emerald-50/20';
                  else if (isPartial) rowBg = 'bg-amber-50/20';

                  return (
                    <Fragment key={slot._id}>
                      <tr key={slot._id} className={`${rowBg} hover:bg-slate-50/50 transition-colors`}>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                          <div className="flex items-center gap-1">
                            {hasSubRows && (
                              <button onClick={() => toggleSlot(slot._id)} className="text-slate-400 hover:text-slate-700">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            )}
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">{fmtDate(slot.dueDate)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{formatCurrency(slot.expectedAmount)}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">
                          {slot.paidAmount > 0 ? formatCurrency(slot.paidAmount) : '—'}
                          {slot.isSplit && <span className="ml-1 text-[9px] bg-violet-100 text-violet-700 font-black px-1 rounded">×{slot.paymentCount}</span>}
                        </td>
                        <td className="px-4 py-3 min-w-[90px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{
                                  width: `${progress}%`,
                                  background: isPaid ? 'hsl(142,71%,45%)' : isPartial ? 'hsl(38,92%,50%)' : isMissed ? 'hsl(0,85%,60%)' : '#e2e8f0',
                                }} />
                            </div>
                            <span className="text-xs font-bold text-slate-500">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={slot.status} showDot={true} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {slot.collectedBy?.name || slot.collectedBy?.fullName || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {(slot.paymentId || isPaid || isPartial) ? (
                            <ReceiptButton paymentId={slot.paymentId || slot._id} paymentStatus={slot.status} receiptNumber={slot.receiptNumber || 'RCP'} variant="icon" />
                          ) : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {!isPaid && (
                              <button onClick={() => openSlotPayModal(slot)}
                                className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center gap-0.5">
                                <Check size={11} /> Pay
                              </button>
                            )}
                            {!isPaid && !isMissed && (
                              <button onClick={() => handleMarkMissed(slot._id)}
                                className="px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg border border-red-200">
                                Miss
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Split sub-rows */}
                      {isExpanded && hasSubRows && slot.payments.map((pmt, pi) => (
                        <tr key={pmt._id} className="bg-violet-50/30">
                          <td />
                          <td className="px-4 py-2 pl-10 text-xs text-slate-500 font-medium">
                            ↳ {fmtDate(pmt.paidDate)} <span className="text-violet-500 font-bold">#{pi + 1}</span>
                          </td>
                          <td />
                          <td className="px-4 py-2 text-xs font-bold text-emerald-600">{formatCurrency(pmt.amount)}</td>
                          <td colSpan={3} className="px-4 py-2 text-xs text-slate-400">
                            {pmt.collectedBy?.name || pmt.collectedBy?.fullName || 'Owner'} • {pmt.receiptNumber}
                          </td>
                          <td className="px-4 py-2">
                            <ReceiptButton paymentId={pmt._id} paymentStatus="paid" receiptNumber={pmt.receiptNumber} variant="icon" />
                          </td>
                          <td />
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PAYMENT HISTORY VIEW ── */}
      {activeView === VIEW_HISTORY && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <span className="font-bold text-slate-700 text-sm">Tamam Adaigiyan (Chronological)</span>
            <span className="ml-auto text-xs font-bold text-slate-400">{paymentHistory.length} transactions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Date Paid', 'Total Paid', 'Qistain Covered', 'Receipt(s)', 'Collector'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyPg.paginated.map(([dayKey, pmts]) => {
                  const totalForDay = pmts.reduce((s, p) => s + (p.amount || 0), 0);
                  const qistCount   = pmts.length;
                  const isBulk      = qistCount > 1;
                  const receipts    = pmts.map(p => p.receiptNumber).filter(Boolean);
                  const collector   = pmts[0]?.collectedBy?.name || pmts[0]?.collectedBy?.fullName || 'Owner';
                  const displayDate = fmtDate(pmts[0]?.paidDate);

                  return (
                    <tr key={dayKey} className={`transition-colors hover:bg-slate-50 ${isBulk ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-4 py-3 font-bold text-slate-800">{displayDate}</td>
                      <td className="px-4 py-3 font-black text-emerald-600 text-base">
                        {formatCurrency(totalForDay)}
                      </td>
                      <td className="px-4 py-3">
                        {isBulk ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                            ⚡ {qistCount} qistain aik saath
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">1 qist</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {receipts.length === 1
                          ? receipts[0]
                          : receipts.length > 1
                            ? `${receipts[0]} +${receipts.length - 1}`
                            : '—'
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{collector}</td>
                    </tr>
                  );
                })}
                {paymentHistory.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 italic font-medium">Koi payment record abhi tak nahi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {_historyGroups.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50">
              <Pagination {...historyPg} onPageChange={historyPg.setPage} label="records" />
            </div>
          )}
        </div>
      )}

      {/* ── BULK PAY MODAL ── */}
      {bulkPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-md font-black text-slate-900">⚡ Ikattha FIFO Payment</h2>
              <button onClick={() => setBulkPayModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleBulkPaySubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-500">Raqam darj karein — system purani qistain pehle mark karega (FIFO).</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rs.</span>
                <input type="number" value={bulkAmount} onChange={e => setBulkAmount(e.target.value)} required placeholder="E.g. 20000"
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setBulkPayModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={bulkLoading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                  {bulkLoading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── COLLECT PAYMENT MODAL (slot-level) ── */}
      <CollectPaymentModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedEntry(null); }}
        installment={inst}
        scheduleEntry={selectedEntry}
        onSuccess={handlePaymentSuccessRefetch}
        currentUser={currentUser}
      />
    </div>
  );
}
