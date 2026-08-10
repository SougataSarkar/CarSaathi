
export function formatINR(amount: number): string {

    let formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);

    return formatted;
}
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