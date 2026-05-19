import { useState, useEffect } from 'react';
import { Loader2, Package } from 'lucide-react';
import api from '../../lib/axios';

const ProductInstallmentSelect = ({
  customerId,
  selectedInstallmentId,
  onSelect,
  // onSelect receives the full installment object
  // not just the ID
  disabled = false,
  showCompleted = false,
}) => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customerId) {
      setInstallments([]);
      return;
    }
    fetchInstallments();
  }, [customerId]);

  const fetchInstallments = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusFilter = showCompleted
        ? ''
        : '&status=active';
      
      const res = await api.get(
        `/installments?customerId=${customerId}${statusFilter}&limit=100`
      );
      
      const data = res.data.data || [];
      setInstallments(data);

      // If only ONE installment, auto-select it
      if (data.length === 1 && !selectedInstallmentId) {
        onSelect(data[0]);
      }

    } catch (err) {
      setError('Products load nahi ho sake');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // No customer selected yet
  if (!customerId) {
    return (
      <div style={{
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '10px 12px',
        color: '#94a3b8',
        fontSize: '13px',
        background: '#f8fafc',
      }}>
        Pehle customer select karein
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        color: '#64748b',
        fontSize: '13px',
      }}>
        <Loader2 size={14} className="animate-spin" />
        Products load ho rahe hain...
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{
        padding: '10px 12px',
        border: '1px solid #fca5a5',
        borderRadius: '6px',
        background: '#fef2f2',
        color: '#dc2626',
        fontSize: '13px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>{error}</span>
        <button
          onClick={fetchInstallments}
          style={{
            fontSize: '12px',
            color: '#dc2626',
            textDecoration: 'underline',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Dobara try karein
        </button>
      </div>
    );
  }

  // No active installments
  if (installments.length === 0) {
    return (
      <div style={{
        padding: '10px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        background: '#f8fafc',
        color: '#64748b',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <Package size={14} />
        Is customer ka koi active installment nahi hai
      </div>
    );
  }

  // THE DROPDOWN
  return (
    <div>
      <select
        value={selectedInstallmentId || ''}
        onChange={(e) => {
          const selected = installments.find(
            inst => inst._id === e.target.value
          );
          if (selected) onSelect(selected);
        }}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1.5px solid #2563eb',
          borderRadius: '6px',
          fontSize: '13px',
          fontFamily: 'inherit',
          color: '#1e293b',
          background: 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          appearance: 'auto',
        }}
      >
        <option value="">
          -- Product select karein ({installments.length} available) --
        </option>
        {installments.map(inst => (
          <option key={inst._id} value={inst._id}>
            {inst.displayLabel}
          </option>
        ))}
      </select>

      {/* Show selected product details below dropdown */}
      {selectedInstallmentId && (() => {
        const selected = installments.find(
          i => i._id === selectedInstallmentId
        );
        if (!selected) return null;
        return (
          <div style={{
            marginTop: '8px',
            padding: '10px 12px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            fontSize: '12px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '4px',
            }}>
              <span>
                <strong>Khata #:</strong> {selected.khataNumber}
              </span>
              <span>
                <strong>Qist:</strong> Rs.{' '}
                {Math.round(
                  selected.perInstallmentAmount || 0
                ).toLocaleString('en-PK')}
              </span>
              <span style={{ color: '#dc2626', fontWeight: '700' }}>
                <strong>Baqaya:</strong> Rs.{' '}
                {Math.round(
                  selected.remainingAmount || 0
                ).toLocaleString('en-PK')}
              </span>
              <span>
                <strong>Schedule:</strong>{' '}
                {selected.scheduleType}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ProductInstallmentSelect;
