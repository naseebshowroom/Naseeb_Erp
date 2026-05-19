/**
 * Auto-format and restrict CNIC values to the XXXXX-XXXXXXX-X format.
 * Expects exactly 13 digits max. Total formatted length: 15 chars.
 */
export function formatCNIC(raw) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').slice(0, 13)
  if (digits.length <= 5)  return digits
  if (digits.length <= 12) return `${digits.slice(0,5)}-${digits.slice(5)}`
  return `${digits.slice(0,5)}-${digits.slice(5,12)}-${digits.slice(12)}`
}

/**
 * Auto-format and restrict Phone values to the XXXX-XXXXXXX format.
 * Expects exactly 11 digits max. Total formatted length: 12 chars.
 */
export function formatPhone(raw) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 4) return digits
  return `${digits.slice(0,4)}-${digits.slice(4)}`
}
