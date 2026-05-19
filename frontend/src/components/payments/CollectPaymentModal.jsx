import { useState } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import ProductInstallmentSelect from './ProductInstallmentSelect';
import { recordPayment } from '../../services/paymentService';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

// Payment amount options
const OPTION_EXACT    = 'exact';    // Poori Qist
const OPTION_CUSTOM   = 'custom';   // Custom / Partial
const OPTION_LUMPSUM  = 'lumpsum'; // Ikattha Bada Payment (FIFO)

const CollectPaymentModal = ({
  isOpen,
  onClose,
  customer,
  preSelectedInstallmentId = null,
  onPaymentSuccess,
  currentUser,
}) => {
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [amountOption, setAmountOption]               = useState(OPTION_EXACT);
  const [customAmount, setCustomAmount]               = useState('');
  const [note, setNote]                               = useState('');
  const [isSubmitting, setIsSubmitting]               = useState(false);
  const [success, setSuccess]                         = useState(false);
  const [lastReceipt, setLastReceipt]                 = useState(null);
  const [lastFinalAmount, setLastFinalAmount]         = useState(0);

  // Lump sum preview state
  const [lumpPreview, setLumpPreview]   = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  if (!isOpen) return null;

  const expectedAmount = selectedInstallment
    ? Math.round(selectedInstallment.perInstallmentAmount || 0)
    : 0;

  const finalAmount = (() => {
    if (!selectedInstallment) return 0;
    if (amountOption === OPTION_EXACT)   return expectedAmount;
    if (amountOption === OPTION_CUSTOM)  return Number(customAmount) || 0;
    if (amountOption === OPTION_LUMPSUM) return Number(customAmount) || 0;
    return 0;
  })();

  const handleInstallmentSelect = (installment) => {
    setSelectedInstallment(installment);
    setCustomAmount(String(Math.round(installment.perInstallmentAmount || 0)));
    setSuccess(false);
    setLastReceipt(null);
    setLumpPreview(null);
  };

  // Compute FIFO preview locally for instant feedback
  const computeLocalPreview = (schedule, totalAmount) => {
    const unpaid = [...schedule]
      .filter(e => e.status === 'pending' || e.status === 'missed' || e.status === 'partially_paid')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    let remaining = totalAmount;
    const rows = [];

    for (const entry of unpaid) {
      if (remaining <= 0) break;
      const alreadyPaid = entry.paidAmount || 0;
      const stillOwed = (entry.expectedAmount || expectedAmount) - alreadyPaid;

      let allocated;
      let newStatus;

      if (remaining >= stillOwed) {
        allocated = stillOwed;
        newStatus = 'paid';
        remaining -= stillOwed;
      } else {
        allocated = remaining;
        newStatus = 'partially_paid';
        remaining = 0;
      }

      rows.push({
        dueDate: entry.dueDate,
        expectedAmount: entry.expectedAmount || expectedAmount,
        allocated,
        newStatus,
      });
    }

    return { rows, unallocated: remaining };
  };

  const handleLumpSumAmountChange = (val) => {
    setCustomAmount(val);
    const amt = Number(val);
    if (!amt || !selectedInstallment?.paymentSchedule) {
      setLumpPreview(null);
      return;
    }
    const preview = computeLocalPreview(selectedInstallment.paymentSchedule, amt);
    setLumpPreview(preview);
  };

  const handleSubmit = async () => {
    if (!selectedInstallment) { toast.error('Pehle product select karein'); return; }
    if (finalAmount <= 0) { toast.error('Amount enter karein'); return; }

    setIsSubmitting(true);
    try {
      let result;

      if (amountOption === OPTION_LUMPSUM) {
        // Hit the bulk-payment FIFO endpoint
        const res = await api.post('/payments/bulk-payment', {
          installmentId: selectedInstallment._id,
          totalAmount: finalAmount,
          collectedBy: currentUser?._id || currentUser?.id,
        });
        result = res.data;
      } else {
        // Standard single-slot payment
        result = await recordPayment({
          installmentId: selectedInstallment._id,
          paidAmount: finalAmount,
          collectedBy: currentUser?._id || currentUser?.id,
          paidDate: new Date(),
          note,
        });
      }

      setLastFinalAmount(finalAmount);
      setSuccess(true);
      setLastReceipt(result.payment || result.data || null);
      toast.success(result.message || 'Adaigi kamyabi se darj ho gayi!');

      if (onPaymentSuccess) onPaymentSuccess(result);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment record nahi ho saka');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    const receiptId = lastReceipt?._id || lastReceipt?.id;
    if (!receiptId) { toast('Receipt ID nahi mili'); return; }
    try {
      const response = await api.post(`/pdf/receipt/${receiptId}`, {}, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt-${lastReceipt.receiptNumber || 'RCP'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Receipt download ho rahi hai!');
    } catch {
      toast.error('Receipt download failed');
    }
  };

  const handleClose = () => {
    setSelectedInstallment(null);
    setCustomAmount('');
    setNote('');
    setSuccess(false);
    setLastReceipt(null);
    setLumpPreview(null);
    setAmountOption(OPTION_EXACT);
    onClose();
  };

  // Format date helper
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtRs   = (n) => `Rs. ${(n || 0).toLocaleString('en-PK')}`;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
      }}>

        {/* HEADER */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px 16px 0 0',
        }}>
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '16px' }}>
              💰 Payment Record Karein
            </div>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>
              {customer?.fullName} — {customer?.phone}
            </div>
          </div>
          <button onClick={handleClose} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* SUCCESS STATE */}
        {success ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(22,163,74,0.25)',
            }}>
              <CheckCircle size={40} color="#16a34a" />
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#15803d', marginBottom: '6px' }}>
              Payment Ho Gayi! 🎉
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
              {fmtRs(lastFinalAmount)} — {selectedInstallment?.displayLabel}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {lastReceipt && (
                <button onClick={handleDownloadReceipt} style={{
                  padding: '10px 20px', background: '#2563eb', color: 'white',
                  border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                }}>
                  🖨 Receipt Download
                </button>
              )}
              <button onClick={() => { setSuccess(false); setSelectedInstallment(null); setCustomAmount(''); setNote(''); setLumpPreview(null); setAmountOption(OPTION_EXACT); }} style={{
                padding: '10px 20px', background: '#f1f5f9', color: '#374151',
                border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              }}>
                Aur Payment Karein
              </button>
              <button onClick={handleClose} style={{
                padding: '10px 20px', background: 'white', color: '#64748b',
                border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
              }}>
                Band Karein
              </button>
            </div>
          </div>

        ) : (
          // FORM STATE
          <div style={{ padding: '22px' }}>

            {/* STEP 1: Product Selection */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                QADAM 1 — Konsa Samaan?
              </label>
              <ProductInstallmentSelect
                customerId={customer?._id || customer?.id || customer}
                selectedInstallmentId={selectedInstallment?._id || preSelectedInstallmentId}
                onSelect={handleInstallmentSelect}
                disabled={isSubmitting}
              />
            </div>

            {/* STEP 2: Amount Option Selection */}
            {selectedInstallment && (
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  QADAM 2 — Kitna Payment?
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  {/* Option A: Exact Installment */}
                  <button onClick={() => { setAmountOption(OPTION_EXACT); setLumpPreview(null); }} style={{
                    padding: '10px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '10px', cursor: 'pointer',
                    border: amountOption === OPTION_EXACT ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                    background: amountOption === OPTION_EXACT ? '#eff6ff' : 'white',
                    color: amountOption === OPTION_EXACT ? '#1d4ed8' : '#64748b',
                    textAlign: 'center', lineHeight: 1.4,
                  }}>
                    ✅ Poori Qist<br />
                    <strong style={{ fontSize: '13px' }}>{fmtRs(expectedAmount)}</strong>
                  </button>

                  {/* Option B: Custom/Partial Amount */}
                  <button onClick={() => { setAmountOption(OPTION_CUSTOM); setLumpPreview(null); }} style={{
                    padding: '10px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '10px', cursor: 'pointer',
                    border: amountOption === OPTION_CUSTOM ? '2px solid #f59e0b' : '1.5px solid #e2e8f0',
                    background: amountOption === OPTION_CUSTOM ? '#fffbeb' : 'white',
                    color: amountOption === OPTION_CUSTOM ? '#92400e' : '#64748b',
                    textAlign: 'center', lineHeight: 1.4,
                  }}>
                    ✏️ Alag Rakam<br />
                    <strong style={{ fontSize: '12px' }}>(Custom)</strong>
                  </button>

                  {/* Option C: Lump Sum FIFO */}
                  <button onClick={() => { setAmountOption(OPTION_LUMPSUM); }} style={{
                    padding: '10px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '10px', cursor: 'pointer',
                    border: amountOption === OPTION_LUMPSUM ? '2px solid #7c3aed' : '1.5px solid #e2e8f0',
                    background: amountOption === OPTION_LUMPSUM ? '#f5f3ff' : 'white',
                    color: amountOption === OPTION_LUMPSUM ? '#5b21b6' : '#64748b',
                    textAlign: 'center', lineHeight: 1.4,
                  }}>
                    ⚡ Ikattha Bada<br />
                    <strong style={{ fontSize: '12px' }}>(Lump Sum)</strong>
                  </button>
                </div>

                {/* Custom / Lump Sum Amount Input */}
                {(amountOption === OPTION_CUSTOM || amountOption === OPTION_LUMPSUM) && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        fontWeight: '800', color: '#64748b', fontSize: '14px',
                      }}>Rs.</span>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={e => {
                          if (amountOption === OPTION_LUMPSUM) handleLumpSumAmountChange(e.target.value);
                          else setCustomAmount(e.target.value);
                        }}
                        placeholder="Raqam darj karein..."
                        min="1"
                        style={{
                          width: '100%',
                          paddingLeft: '44px', paddingRight: '12px',
                          paddingTop: '11px', paddingBottom: '11px',
                          border: `2px solid ${amountOption === OPTION_LUMPSUM ? '#7c3aed' : '#f59e0b'}`,
                          borderRadius: '10px',
                          fontSize: '16px', fontWeight: '800',
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Shortfall warning for custom partial */}
                {amountOption === OPTION_CUSTOM && finalAmount > 0 && finalAmount < expectedAmount && (
                  <div style={{
                    padding: '8px 12px',
                    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px',
                    fontSize: '12px', color: '#92400e', marginBottom: '10px',
                  }}>
                    ⚠️ Partial payment — Baqaya: {fmtRs(expectedAmount - finalAmount)}
                  </div>
                )}

                {/* LUMP SUM FIFO PREVIEW TABLE */}
                {amountOption === OPTION_LUMPSUM && lumpPreview && (
                  <div style={{
                    border: '1.5px solid #ddd6fe', borderRadius: '12px',
                    overflow: 'hidden', marginBottom: '10px',
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <Zap size={14} color="white" />
                      <span style={{ color: 'white', fontWeight: '800', fontSize: '12px' }}>
                        FIFO Taqseem — {fmtRs(finalAmount)} ka plan:
                      </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#f5f3ff' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#5b21b6', fontWeight: '700' }}>Due Date</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', color: '#5b21b6', fontWeight: '700' }}>Expected</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', color: '#5b21b6', fontWeight: '700' }}>Allocated</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center', color: '#5b21b6', fontWeight: '700' }}>New Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lumpPreview.rows.map((row, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #ede9fe' }}>
                              <td style={{ padding: '7px 12px', color: '#374151', fontWeight: '600' }}>{fmtDate(row.dueDate)}</td>
                              <td style={{ padding: '7px 12px', textAlign: 'right', color: '#64748b' }}>{fmtRs(row.expectedAmount)}</td>
                              <td style={{ padding: '7px 12px', textAlign: 'right', color: '#16a34a', fontWeight: '800' }}>{fmtRs(row.allocated)}</td>
                              <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '800',
                                  background: row.newStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                                  color: row.newStatus === 'paid' ? '#16a34a' : '#92400e',
                                }}>
                                  {row.newStatus === 'paid' ? '✅ Paid' : '⚠️ Partial'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {lumpPreview.unallocated > 0 && (
                          <tfoot>
                            <tr style={{ background: '#fef3c7' }}>
                              <td colSpan={4} style={{ padding: '7px 12px', fontSize: '11px', color: '#92400e', fontWeight: '700' }}>
                                ⚠️ Bacha hua: {fmtRs(lumpPreview.unallocated)} (koi aur pending qist nahi)
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                )}

                {/* Amount Summary */}
                {finalAmount > 0 && (
                  <div style={{
                    padding: '10px 14px',
                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
                    fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ color: '#374151' }}>Jama hogi rakam:</span>
                    <strong style={{ color: '#16a34a', fontSize: '16px' }}>
                      {fmtRs(finalAmount)}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            {selectedInstallment && amountOption !== OPTION_LUMPSUM && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Koi khas baat? (optional)"
                  style={{
                    width: '100%', padding: '8px 12px',
                    border: '1px solid #e2e8f0', borderRadius: '8px',
                    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              onClick={handleSubmit}
              disabled={!selectedInstallment || finalAmount <= 0 || isSubmitting}
              style={{
                width: '100%', padding: '14px',
                background: !selectedInstallment || finalAmount <= 0
                  ? '#e2e8f0'
                  : amountOption === OPTION_LUMPSUM
                    ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                    : 'linear-gradient(135deg, #16a34a, #15803d)',
                color: !selectedInstallment || finalAmount <= 0 ? '#94a3b8' : 'white',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '800',
                cursor: (!selectedInstallment || finalAmount <= 0 || isSubmitting) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: !selectedInstallment || finalAmount <= 0 ? 'none' : '0 4px 16px rgba(22,163,74,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Payment Record Ho Rahi Hai...</>
              ) : amountOption === OPTION_LUMPSUM ? (
                <>⚡ Ikattha {fmtRs(finalAmount)} Jama Karein</>
              ) : (
                <>✅ Payment Record Karein {finalAmount > 0 && `— ${fmtRs(finalAmount)}`}</>
              )}
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default CollectPaymentModal;
