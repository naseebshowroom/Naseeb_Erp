import api from '../lib/axios';
import { API_ENDPOINTS } from '../constants/api';

export const inventoryService = {
  getAll: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.INVENTORY.GET_ALL, { params });
    return res.data;
  },
  getStats: async () => {
    const res = await api.get(API_ENDPOINTS.INVENTORY.STATS);
    return res.data;
  },
  getAlerts: async () => {
    const res = await api.get(API_ENDPOINTS.INVENTORY.ALERTS);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post(API_ENDPOINTS.INVENTORY.CREATE, data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(API_ENDPOINTS.INVENTORY.UPDATE(id), data);
    return res.data;
  },
};

export const distributorService = {
  getAll: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.DISTRIBUTORS.GET_ALL, { params });
    return res.data;
  },
  getOne: async (id) => {
    const res = await api.get(API_ENDPOINTS.DISTRIBUTORS.GET_ONE(id));
    return res.data;
  },
  create: async (data) => {
    const res = await api.post(API_ENDPOINTS.DISTRIBUTORS.CREATE, data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(API_ENDPOINTS.DISTRIBUTORS.UPDATE(id), data);
    return res.data;
  },
  recordPayment: async (id, data) => {
    const res = await api.post(API_ENDPOINTS.DISTRIBUTORS.PAYMENTS(id), data);
    return res.data;
  },
};

export const workerService = {
  getAll: async () => {
    const res = await api.get(API_ENDPOINTS.WORKERS.GET_ALL);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post(API_ENDPOINTS.WORKERS.CREATE, data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(API_ENDPOINTS.WORKERS.UPDATE(id), data);
    return res.data;
  },
  deactivate: async (id) => {
    const res = await api.put(API_ENDPOINTS.WORKERS.DEACTIVATE(id));
    return res.data;
  },
  saveAssignment: async (data) => {
    const res = await api.post(API_ENDPOINTS.WORKERS.ASSIGN, data);
    return res.data;
  },
  getMyRoute: async () => {
    const res = await api.get(API_ENDPOINTS.WORKERS.MY_ROUTE);
    return res.data;
  },
  getProgress: async () => {
    const res = await api.get(API_ENDPOINTS.WORKERS.PROGRESS);
    return res.data;
  },
};

export const reportService = {
  getFinancial: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.REPORTS.FINANCIAL, { params });
    return res.data;
  },
  getMonthly: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.REPORTS.MONTHLY, { params });
    return res.data;
  },
  getOverdue: async () => {
    const res = await api.get(API_ENDPOINTS.REPORTS.OVERDUE);
    return res.data;
  },
};

export const settingsService = {
  get: async () => {
    const res = await api.get(API_ENDPOINTS.SETTINGS.GET);
    return res.data;
  },
  update: async (data) => {
    const isFormData = data instanceof FormData;
    const res = await api.put(API_ENDPOINTS.SETTINGS.UPDATE, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return res.data;
  },
};
