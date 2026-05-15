import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'Rs. 0'
  return `Rs. ${Number(amount).toLocaleString('en-PK')}`
}

export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'active':    return 'badge badge-active'
    case 'overdue':   return 'badge badge-overdue'
    case 'completed': return 'badge badge-completed'
    case 'paid':      return 'badge badge-paid'
    default:          return 'badge badge-pending'
  }
}

export function truncate(str, n = 30) {
  return str && str.length > n ? str.slice(0, n) + '…' : str
}
