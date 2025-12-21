/**
 * Currency formatting utilities for the marketplace
 */

/**
 * Format a price amount with the appropriate currency symbol
 * @param amount - The numeric amount to format
 * @param currency - The currency code (SAR, USD, OMR)
 * @returns Formatted price string with currency symbol
 */
export function formatCurrency(amount: number, currency: string = 'OMR'): string {
    const currencySymbols: Record<string, string> = {
        SAR: 'ر.س',
        USD: '$',
        OMR: 'ر.ع.',
    };

    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Get the currency symbol for a given currency code
 * @param currency - The currency code (SAR, USD, OMR)
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string = 'OMR'): string {
    const currencySymbols: Record<string, string> = {
        SAR: 'ر.س',
        USD: '$',
        OMR: 'ر.ع.',
    };

    return currencySymbols[currency] || currency;
}
