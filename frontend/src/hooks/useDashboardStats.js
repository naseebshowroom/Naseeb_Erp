import { useState, useEffect, useCallback } from 'react';
import installmentService from '../services/installmentService';
import paymentService from '../services/paymentService';
import { handleApiError } from '../utils/errorHandler';

/**
 * Aggregates all data needed by the Dashboard page
 * into a single hook call — prevents multiple loading spinners.
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [dueToday, setDueToday] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Parallel fetch for speed
      const [statsRes, dueTodayRes] = await Promise.all([
        installmentService.getStats(),
        paymentService.getDueToday(),
      ]);

      setStats(statsRes.data);
      setDueToday(dueTodayRes.data || []);
    } catch (err) {
      setError(handleApiError(err, { silent: true }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    // Polling every 60 seconds for "live" dashboard feel
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { stats, dueToday, isLoading, error, refetch: fetch };
};
