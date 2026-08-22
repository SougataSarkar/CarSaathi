/**
 * Formats a number into standard Indian Rupee currency notation (e.g. ₹5,00,000.00)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a number into compact Indian Rupee format (e.g. ₹5.00 Lakh or ₹1.50 Cr)
 */
export function formatCompactINR(amount: number): string {
  if (amount === 0) return '₹0';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  let formatted = '';

  if (absAmount >= 10000000) {
    formatted = (absAmount / 10000000).toFixed(2) + ' Cr';
  } else if (absAmount >= 100000) {
    formatted = (absAmount / 100000).toFixed(2) + ' Lakh';
  } else {
    formatted = absAmount.toFixed(2);
  }

  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Formats a number into standard British Pound notation (e.g., £5,000.00)
 */
export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2
  }).format(amount);
}