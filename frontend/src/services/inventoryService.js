import api from '../lib/axios';
import { API_ENDPOINTS } from '../constants/api';

const inventoryService = {
  /**
   * Get all inventory items with optional filters.
   * @param {{ category?: string, search?: string }} params
   */
  getInventory: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.INVENTORY.GET_ALL, { params });
    return res.data;
  },

  /**
   * Add new stock item(s).
   * @param {object} data
   */
  addInventory: async (data) => {
    const res = await api.post(API_ENDPOINTS.INVENTORY.CREATE, data);
    return res.data;
  },

  /**
   * Get summary stats (total, available, on_installment, sold).
   */
  getStats: async () => {
    const res = await api.get(API_ENDPOINTS.INVENTORY.STATS);
    return res.data;
  },

  /**
   * Get low-stock and completion alerts.
   */
  getAlerts: async () => {
    const res = await api.get(API_ENDPOINTS.INVENTORY.ALERTS);
    return res.data;
  },
};

export default inventoryService;
