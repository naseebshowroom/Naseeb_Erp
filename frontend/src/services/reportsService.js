import api from '../lib/axios';

const reportsService = {
  getFinancialSummary: async (params = {}) => {
    const res = await api.get('/reports/financial', { params });
    return res.data;
  },
  getMonthlyReport: async () => {
    const res = await api.get('/reports/monthly');
    return res.data;
  },
  getCategoryBreakdown: async () => {
    const res = await api.get('/reports/category');
    return res.data;
  },
  getOverdueReport: async () => {
    const res = await api.get('/reports/overdue');
    return res.data;
  },
  getDistributorPayables: async () => {
    const res = await api.get('/reports/distributors');
    return res.data;
  },
};

export default reportsService;
