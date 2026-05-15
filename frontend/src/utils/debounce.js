/**
 * Returns a debounced version of the provided function.
 * The function will only be invoked after `delay` ms have
 * elapsed since the last invocation.
 *
 * Usage in components:
 *   const debouncedSearch = useMemo(() => debounce(setSearch, 400), []);
 *
 * @param {Function} fn    - function to debounce
 * @param {number}   delay - delay in milliseconds (default 400ms)
 */
export const debounce = (fn, delay = 400) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * React hook that returns a debounced version of a value.
 * Triggers a re-render only after the delay has passed.
 *
 * Usage:
 *   const debouncedSearch = useDebouncedValue(searchInput, 400);
 *   // Use debouncedSearch in your useEffect to trigger API calls.
 */
import { useState, useEffect } from 'react';

export const useDebouncedValue = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
