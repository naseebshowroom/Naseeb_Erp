import { useState, useEffect, useCallback } from 'react';
import paymentService from '../services/paymentService';
import { handleApiError } from '../utils/errorHandler';

/**
 * Generic reusable fetcher hook.
 */
const useFetch = (fn) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fn();
      setData(res.data || []);
    } catch (err) {
      setError(handleApiError(err, { silent: true }));
    } finally {
      setIsLoading(false);
    }
  }, [fn]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useDueToday = () => useFetch(useCallback(() => paymentService.getDueToday(), []));
export const useOverduePayments = () => useFetch(useCallback(() => paymentService.getOverdue(), []));
export const useCollectedToday = () => useFetch(useCallback(() => paymentService.getCollectedToday(), []));
