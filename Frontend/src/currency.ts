import { formatINR, formatCompactINR } from '../../src/currency';

export { formatINR, formatCompactINR };

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