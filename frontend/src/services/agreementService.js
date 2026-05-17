import api from '../lib/axios';

export const agreementService = {
  getAgreements: async (params = {}) => {
    const res = await api.get('/agreements', { params });
    return res.data;
  },
  getInstallmentRecords: async (installmentId) => {
    const res = await api.get(`/agreements/installment/${installmentId}`);
    return res.data;
  },
  markAsPrinted: async (data) => {
    const res = await api.post('/agreements/mark-printed', data);
    return res.data;
  }
};
