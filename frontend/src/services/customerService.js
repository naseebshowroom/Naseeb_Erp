import api from '../lib/axios';
import { API_ENDPOINTS } from '../constants/api';

const customerService = {
  /**
   * Get paginated, searchable, filterable customer list.
   * @param {{ page?: number, limit?: number, search?: string, status?: string }} params
   */
  getCustomers: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.CUSTOMERS.GET_ALL, { params });
    return res.data; // { success, data: [], pagination: { total, page, pages } }
  },

  getCustomer: async (id) => {
    const res = await api.get(API_ENDPOINTS.CUSTOMERS.GET_ONE(id));
    return res.data;
  },

  getCustomerSummary: async (id) => {
    const res = await api.get(API_ENDPOINTS.CUSTOMERS.SUMMARY(id));
    return res.data;
  },

  /**
   * Create customer with optional photo uploads (multipart form-data).
   * @param {FormData} formData
   */
  createCustomer: async (formData) => {
    const res = await api.post(API_ENDPOINTS.CUSTOMERS.CREATE, formData);
    return res.data;
  },

  updateCustomer: async (id, data) => {
    const res = await api.put(API_ENDPOINTS.CUSTOMERS.UPDATE(id), data);
    return res.data;
  },

  /**
   * Soft-delete: marks customer as deleted, never permanently removes.
   */
  deleteCustomer: async (id) => {
    const res = await api.delete(API_ENDPOINTS.CUSTOMERS.DELETE(id));
    return res.data;
  },
};

export default customerService;
