import api from '../lib/axios';
import { API_ENDPOINTS } from '../constants/api';

const installmentService = {
  getInstallments: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.INSTALLMENTS.GET_ALL, { params });
    return res.data;
  },

  getInstallment: async (id) => {
    const res = await api.get(API_ENDPOINTS.INSTALLMENTS.GET_ONE(id));
    return res.data;
  },

  createInstallment: async (data) => {
    const res = await api.post(API_ENDPOINTS.INSTALLMENTS.CREATE, data);
    return res.data;
  },

  updateInstallment: async (id, data) => {
    const res = await api.put(API_ENDPOINTS.INSTALLMENTS.UPDATE(id), data);
    return res.data;
  },

  getOverdue: async () => {
    const res = await api.get(API_ENDPOINTS.INSTALLMENTS.OVERDUE);
    return res.data;
  },

  getStats: async () => {
    const res = await api.get(API_ENDPOINTS.INSTALLMENTS.STATS);
    return res.data;
  },
};

export default installmentService;
