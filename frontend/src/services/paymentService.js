import api from '../lib/axios';
import { API_ENDPOINTS } from '../constants/api';

// ─── NAMED EXPORTS (NEW DESIGN SYSTEM) ───

/**
 * Record an installment payment.
 * Runs in a secure backend transaction.
 * Supports both new parameter naming and legacy fallbacks.
 */
export const recordPayment = async (data) => {
  // Map fields to ensure safety for both formats
  const payload = {
    installmentId: data.installmentId || data.installment,
    scheduleEntryId: data.scheduleEntryId,
    paidAmount: data.paidAmount !== undefined ? data.paidAmount : data.amount,
    collectedBy: data.collectedBy || data.receivedBy,
    paidDate: data.paidDate || data.paymentDate,
    notes: data.notes || data.note,
    paymentMode: data.paymentMode || 'cash'
  };
  const res = await api.post(API_ENDPOINTS?.PAYMENTS?.RECORD || '/payments', payload);
  return res.data;
};

/**
 * Get all payment history logs.
 * Supports filtering by customer, installmentId, and date.
 */
export const getPaymentHistory = async (params = {}) => {
  const queryParams = {
    customer: params.customer,
    installmentId: params.installmentId || params.installment,
    collectedBy: params.collectedBy || params.worker,
    date: params.date,
    startDate: params.startDate,
    endDate: params.endDate,
    page: params.page,
    limit: params.limit
  };
  const res = await api.get(API_ENDPOINTS?.PAYMENTS?.GET_ALL || '/payments', { params: queryParams });
  return res.data;
};

/**
 * Get field worker assignments / collections for today.
 */
export const getWorkerCollections = async (workerId) => {
  const res = await api.get(`/collections/today`, { params: { workerId } });
  return res.data;
};

/**
 * Get payments that are due or overdue.
 */
export const getDuePayments = async () => {
  const res = await api.get('/installments/vasooli');
  return res.data;
};

/**
 * Record a bulk installment payment distributed via FIFO.
 */
export const recordBulkPayment = async (installmentId, totalAmount, collectedBy) => {
  const res = await api.post(API_ENDPOINTS?.PAYMENTS?.BULK || '/payments/bulk-payment', {
    installmentId,
    totalAmount,
    collectedBy
  });
  return res.data;
};

// ─── COMPATIBILITY DEFAULT EXPORT (OLD HOOKS & COMPONENTS) ───

const paymentService = {
  getAll: getPaymentHistory,
  
  getDueToday: async () => {
    const res = await api.get(API_ENDPOINTS?.PAYMENTS?.DUE_TODAY || '/payments/collected-today'); // Fallback or route mapping
    return res.data;
  },

  getOverdue: async () => {
    const res = await api.get('/installments/vasooli');
    if (res.data && res.data.data) {
      // Filter only overdue ones
      return {
        ...res.data,
        data: res.data.data.filter(v => !v.isDueToday && v.cumulativeDue > 0)
      };
    }
    return res.data;
  },

  getCollectedToday: async () => {
    const res = await api.get(API_ENDPOINTS?.PAYMENTS?.COLLECTED_TODAY || '/payments/collected-today');
    return res.data;
  },

  getDailySummary: async (date) => {
    const res = await api.get(API_ENDPOINTS?.PAYMENTS?.SUMMARY_DAILY || '/payments/summary/daily', { params: { date } });
    return res.data;
  },

  getMonthlySummary: async () => {
    const res = await api.get(API_ENDPOINTS?.PAYMENTS?.SUMMARY_MONTHLY || '/payments/summary/monthly');
    return res.data;
  },

  recordPayment: recordPayment,

  getReceiptData: async (id) => {
    const res = await api.get(API_ENDPOINTS?.PAYMENTS?.RECEIPT?.(id) || `/payments/receipt/${id}`);
    return res.data;
  },

  deletePayment: async (id) => {
    const res = await api.delete(API_ENDPOINTS?.PAYMENTS?.DELETE?.(id) || `/payments/${id}`);
    return res.data;
  },
};

export default paymentService;
