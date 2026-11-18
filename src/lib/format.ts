/**
 * Indian Rupee (INR) formatting utility
 * e.g., 184250 -> "₹1,84,250" or "₹1,84,250.00"
 */

export function formatINR(amount: number | string, includeDecimals = false): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  
  if (isNaN(numericAmount)) {
    return '₹0';
  }

  const isNegative = numericAmount < 0;
  const absVal = Math.abs(numericAmount);
  
  const [integerPart, decimalPart] = absVal.toFixed(2).split('.');

  // Indian numbering grouping: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const result = includeDecimals 
    ? `₹${formattedInteger}.${decimalPart}` 
    : `₹${formattedInteger}`;

  return isNegative ? `-${result}` : result;
}

export function formatNumberINR(amount: number | string): string {
  const formatted = formatINR(amount, false);
  return formatted.replace('₹', '');
}
