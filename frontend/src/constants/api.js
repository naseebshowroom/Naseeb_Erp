// ─────────────────────────────────────────────────────────
// Centralized API Endpoint Constants
// Single source of truth for all backend routes.
// Changing a backend route only requires editing this file.
// ─────────────────────────────────────────────────────────

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:           '/auth/login',
    LOGOUT:          '/auth/logout',
    REFRESH:         '/auth/refresh',
    ME:              '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  CUSTOMERS: {
    GET_ALL:   '/customers',
    GET_ONE:   (id) => `/customers/${id}`,
    CREATE:    '/customers',
    UPDATE:    (id) => `/customers/${id}`,
    DELETE:    (id) => `/customers/${id}`,
    SUMMARY:   (id) => `/customers/${id}/summary`,
  },

  INSTALLMENTS: {
    GET_ALL:  '/installments',
    GET_ONE:  (id) => `/installments/${id}`,
    CREATE:   '/installments',
    UPDATE:   (id) => `/installments/${id}`,
    OVERDUE:  '/installments/overdue',
    STATS:    '/installments/stats',
  },

  PAYMENTS: {
    GET_ALL:         '/payments',
    DUE_TODAY:       '/payments/today',
    OVERDUE:         '/payments/overdue',
    COLLECTED_TODAY: '/payments/collected-today',
    RECORD:          '/payments',
    RECEIPT:         (id) => `/payments/receipt/${id}`,
    DELETE:          (id) => `/payments/${id}`,
  },

  INVENTORY: {
    GET_ALL:      '/inventory',
    GET_ONE:      (id) => `/inventory/${id}`,
    CREATE:       '/inventory',
    UPDATE:       (id) => `/inventory/${id}`,
    STATS:        '/inventory/stats',
    ALERTS:       '/inventory/alerts',
  },

  DISTRIBUTORS: {
    GET_ALL:   '/distributors',
    GET_ONE:   (id) => `/distributors/${id}`,
    CREATE:    '/distributors',
    UPDATE:    (id) => `/distributors/${id}`,
    PAYMENTS:  (id) => `/distributors/${id}/payments`,
  },

  WORKERS: {
    GET_ALL:    '/workers',
    GET_ONE:    (id) => `/workers/${id}`,
    CREATE:     '/workers',
    UPDATE:     (id) => `/workers/${id}`,
    DEACTIVATE: (id) => `/workers/${id}/deactivate`,
    ASSIGN:     '/workers/assignments',
    MY_ROUTE:   '/workers/my-route',
    PROGRESS:   '/workers/progress',
  },

  REPORTS: {
    FINANCIAL:    '/reports/financial',
    MONTHLY:      '/reports/monthly',
    OVERDUE:      '/reports/overdue',
    DISTRIBUTORS: '/reports/distributors',
    COMPLETED:    '/reports/completed',
    EXPORT_PDF:   '/reports/export/pdf',
    EXPORT_EXCEL: '/reports/export/excel',
  },

  SETTINGS: {
    GET:    '/settings',
    UPDATE: '/settings',
  },
};
