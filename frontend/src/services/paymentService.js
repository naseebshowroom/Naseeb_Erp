import api from '../lib/axios';
import { API_ENDPOINTS } from '../constants/api';

const paymentService = {
  getAll: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.PAYMENTS.GET_ALL, { params });
    return res.data;
  },

  getDueToday: async () => {
    const res = await api.get(API_ENDPOINTS.PAYMENTS.DUE_TODAY);
    return res.data;
  },

  getOverdue: async () => {
    const res = await api.get(API_ENDPOINTS.PAYMENTS.OVERDUE);
    return res.data;
  },

  getCollectedToday: async () => {
    const res = await api.get(API_ENDPOINTS.PAYMENTS.COLLECTED_TODAY);
    return res.data;
  },

  /**
   * Record a payment. Backend runs this in a MongoDB transaction.
   * @param {{ installmentId, amount, receivedBy, notes, scheduleEntryId }} data
   */
  recordPayment: async (data) => {
    const res = await api.post(API_ENDPOINTS.PAYMENTS.RECORD, data);
    return res.data;
  },

  getReceiptData: async (id) => {
    const res = await api.get(API_ENDPOINTS.PAYMENTS.RECEIPT(id));
    return res.data;
  },

  deletePayment: async (id) => {
    const res = await api.delete(API_ENDPOINTS.PAYMENTS.DELETE(id));
    return res.data;
  },
};

export default paymentService;
