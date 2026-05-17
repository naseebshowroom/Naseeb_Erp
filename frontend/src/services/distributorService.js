import api from '../lib/axios';
import { API_ENDPOINTS } from '../constants/api';

const distributorService = {
  getDistributors: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.DISTRIBUTORS.GET_ALL, { params });
    return res.data;
  },

  getDistributor: async (id) => {
    const res = await api.get(API_ENDPOINTS.DISTRIBUTORS.GET_ONE(id));
    return res.data;
  },

  getStats: async () => {
    const res = await api.get(API_ENDPOINTS.DISTRIBUTORS.GET_STATS || '/distributors/stats');
    return res.data;
  },

  createDistributor: async (data) => {
    const res = await api.post(API_ENDPOINTS.DISTRIBUTORS.CREATE, data);
    return res.data;
  },

  updateDistributor: async (id, data) => {
    const res = await api.put(API_ENDPOINTS.DISTRIBUTORS.UPDATE(id), data);
    return res.data;
  },

  recordSupply: async (id, data) => {
    const res = await api.post(`${API_ENDPOINTS.DISTRIBUTORS.GET_ONE(id)}/supply`, data);
    return res.data;
  },

  recordPayment: async (id, data) => {
    const res = await api.post(`${API_ENDPOINTS.DISTRIBUTORS.GET_ONE(id)}/payment`, data);
    return res.data;
  }
};

export default distributorService;
