import { format, formatDistanceToNow, isValid, parseISO, differenceInDays } from 'date-fns';

/**
 * Format a date string or Date object to a human-readable format.
 * e.g. "15 May 2026"
 */
export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, fmt) : '—';
};

/**
 * Format a date as a short date: "15/05/2026"
 */
export const formatDateShort = (date) => formatDate(date, 'dd/MM/yyyy');

/**
 * Format a date with time: "15 May 2026, 10:30 AM"
 */
export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, hh:mm a');

/**
 * Format relative time: "3 days ago", "in 5 hours"
 */
export const timeAgo = (date) => {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
};

/**
 * Calculate days overdue (negative means future, positive means overdue).
 * Returns null for invalid dates.
 */
export const daysOverdue = (dueDate) => {
  if (!dueDate) return null;
  const d = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  if (!isValid(d)) return null;
  return differenceInDays(new Date(), d);
};

/**
 * Returns true if the date is in the past.
 */
export const isOverdue = (dueDate) => {
  const days = daysOverdue(dueDate);
  return days !== null && days > 0;
};

/**
 * Format PKR currency amount.
 * e.g. 150000 → "Rs. 1,50,000"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Math.round(Number(amount)).toLocaleString('en-PK')}`;
};

/**
 * Returns an array of the last N months as abbreviated names.
 * e.g. ['Dec', 'Jan', 'Feb', ...]
 */
export const getLastNMonths = (n = 6) => {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (n - 1 - i));
    return format(d, 'MMM');
  });
};

/**
 * Convert a JS Date or ISO string to YYYY-MM-DD for HTML date inputs.
 */
export const toInputDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'yyyy-MM-dd') : '';
};
