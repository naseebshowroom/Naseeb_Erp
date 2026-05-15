import { useState, useEffect, useCallback } from 'react';
import customerService from '../services/customerService';
import { handleApiError } from '../utils/errorHandler';
import { useDebouncedValue } from '../utils/debounce';

/**
 * useCustomers — server-paginated, debounced-search customer list hook.
 *
 * @param {object} [initialParams]
 * @returns {{ customers, pagination, isLoading, error, refetch, setSearch, setStatus, setPage }}
 */
export const useCustomers = (initialParams = {}) => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState(initialParams.search || '');
  const [status, setStatus] = useState(initialParams.status || '');
  const [page, setPage] = useState(initialParams.page || 1);
  const [limit] = useState(initialParams.limit || 10);

  const debouncedSearch = useDebouncedValue(search, 400);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await customerService.getCustomers({
        page,
        limit,
        search: debouncedSearch,
        status,
      });
      setCustomers(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      const msg = handleApiError(err, { silent: true });
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  return { customers, pagination, isLoading, error, refetch: fetch, search, setSearch, status, setStatus, page, setPage };
};
