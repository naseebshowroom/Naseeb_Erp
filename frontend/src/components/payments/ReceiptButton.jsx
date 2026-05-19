import { useState } from 'react';
import { Printer, Loader } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

/**
 * Universal ReceiptButton Component
 * Fetches the dynamic receipt PDF and opens it in a new window/printing dialog.
 *
 * @param {object} props
 * @param {string} props.paymentId - The ID of the Payment document
 * @param {string} props.paymentStatus - Optional: to style depending on status ('paid', 'missed', etc.)
 * @param {string} props.receiptNumber - Optional: printed receipt number
 * @param {'icon' | 'btn' | 'full'} [props.variant='btn'] - Visual style variant
 */
export default function ReceiptButton({ paymentId, paymentStatus = 'paid', receiptNumber = '', variant = 'btn' }) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!paymentId) {
      toast.error('Payment ID nahi mili!');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/pdf/receipt/${paymentId}`, {}, { responseType: 'blob' });
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Open in a new tab for instant printing/viewing
      window.open(url, '_blank');
      toast.success('Receipt download ho rahi hai!');
    } catch (err) {
      console.error('[ReceiptButton Error]', err);
      toast.error('Receipt print karne mein masla aya.');
    } finally {
      setLoading(false);
    }
  };

  const isPaid = paymentStatus?.toLowerCase() === 'paid' || paymentStatus?.toLowerCase() === 'partially_paid';

  if (!isPaid) {
    return (
      <span className="text-xs text-slate-400 font-medium italic">
        No Receipt (Unpaid)
      </span>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handlePrint}
        disabled={loading}
        title="Print Receipt / رسید پرنٹ کریں"
        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
      >
        {loading ? (
          <Loader size={16} className="animate-spin text-blue-500" />
        ) : (
          <Printer size={16} />
        )}
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        onClick={handlePrint}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50"
      >
        {loading ? (
          <Loader size={18} className="animate-spin" />
        ) : (
          <Printer size={18} />
        )}
        <span>Print Receipt / رسید حاصل کریں ({receiptNumber || 'RCP'})</span>
      </button>
    );
  }

  // Standard 'btn' variant
  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-xs font-bold rounded-lg transition-all border border-blue-200 active:scale-95 disabled:opacity-50"
    >
      {loading ? (
        <Loader size={12} className="animate-spin" />
      ) : (
        <Printer size={12} />
      )}
      <span>Print Receipt ({receiptNumber || 'RCP'})</span>
    </button>
  );
}
