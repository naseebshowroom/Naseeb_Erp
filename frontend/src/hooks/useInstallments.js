import { useState, useEffect, useCallback } from 'react';
import installmentService from '../services/installmentService';
import { handleApiError } from '../utils/errorHandler';
import { useDebouncedValue } from '../utils/debounce';

export const useInstallments = (initialParams = {}) => {
  const [installments, setInstallments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState(initialParams.search || '');
  const [category, setCategory] = useState(initialParams.category || '');
  const [status, setStatus] = useState(initialParams.status || '');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const debouncedSearch = useDebouncedValue(search, 400);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await installmentService.getInstallments({
        page, limit, search: debouncedSearch, category, status,
      });
      setInstallments(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(handleApiError(err, { silent: true }));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, category, status]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [debouncedSearch, category, status]);

  return { installments, pagination, isLoading, error, refetch: fetch, search, setSearch, category, setCategory, status, setStatus, page, setPage };
};

export const useInstallmentStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await installmentService.getStats();
      setStats(res.data);
    } catch (err) {
      setError(handleApiError(err, { silent: true }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, isLoading, error, refetch: fetch };
};
