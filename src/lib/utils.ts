import { FixedIncomeAsset, CurrencyCode } from '@/types';

/**
 * Currency formatting options interface
 */
interface CurrencyFormatOptions {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  excludeSymbol?: boolean;
}

/**
 * Format a currency value with the appropriate locale and symbol
 */
export function formatCurrency(
  amount: number, 
  currencyCode: CurrencyCode = 'EUR',
  options: CurrencyFormatOptions = {}
): string {
  if (amount === undefined || amount === null) return '';
  
  // Map currency codes to appropriate locales
  const currencyLocaleMap: Record<CurrencyCode, string> = {
    EUR: 'de-DE',
    GBP: 'en-GB',
    USD: 'en-US',
    CHF: 'de-CH',
    JPY: 'ja-JP',
    SEK: 'sv-SE',
    NOK: 'no-NO',
    DKK: 'da-DK',
    PLN: 'pl-PL',
    CZK: 'cs-CZ'
  };
  
  const locale = currencyLocaleMap[currencyCode] || 'de-DE';
  const { excludeSymbol, minimumFractionDigits = 0, maximumFractionDigits = 0 } = options;
  
  if (excludeSymbol) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Parse numeric value from a formatted string input
 * Handles inputs with commas, dots, and other separators
 */
export function parseInputValue(value: string): number {
  if (!value) return 0;
  
  // Remove all non-numeric characters except the last decimal point
  // This allows for thousands separators (commas, spaces, etc.) in the input
  const cleanedValue = value.replace(/[^\d.]/g, '');
  
  // Ensure there's only one decimal point
  const decimalPoints = cleanedValue.match(/\./g);
  if (decimalPoints && decimalPoints.length > 1) {
    // Keep only the last decimal point
    const lastIndex = cleanedValue.lastIndexOf('.');
    const beforeLastDecimal = cleanedValue.substring(0, lastIndex).replace(/\./g, '');
    const afterLastDecimal = cleanedValue.substring(lastIndex);
    return parseFloat(beforeLastDecimal + afterLastDecimal);
  }
  
  const parsedValue = parseFloat(cleanedValue);
  return isNaN(parsedValue) ? 0 : parsedValue;
}

/**
 * Format a number with thousand separators for display
 * Useful for input fields where we want to show formatted numbers
 */
export function formatNumberWithCommas(value: number | string): string {
  if (!value && value !== 0) return '';
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  
  // Format with thousands separators but preserve decimal places as entered
  const parts = numValue.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
}

/**
 * Get the current market value of an asset
 */
export function getMarketValue(asset: FixedIncomeAsset): number {
  // Check if current_price exists AND is not null/undefined
  // If it's 0 or any other valid number, fall back to purchase_price
  return (asset.current_price !== null && asset.current_price !== undefined && asset.current_price > 0) 
    ? asset.current_price 
    : asset.purchase_price;
}

/**
 * Calculate the total market value of multiple assets
 */
export function getTotalMarketValue(assets: FixedIncomeAsset[]): number {
  if (!assets || assets.length === 0) return 0;
  return assets.reduce((sum, asset) => sum + getMarketValue(asset), 0);
}

/**
 * Calculate weighted average value by market value
 */
export function calculateWeightedAverage(
  assets: FixedIncomeAsset[], 
  valueSelector: (asset: FixedIncomeAsset) => number
): number {
  if (!assets || assets.length === 0) return 0;
  
  const totalValue = getTotalMarketValue(assets);
  if (totalValue === 0) return 0;
  
  return assets.reduce(
    (sum, asset) => {
      const marketValue = getMarketValue(asset);
      const selectedValue = valueSelector(asset);
      return sum + (selectedValue * marketValue);
    }, 0
  ) / totalValue;
}

/**
 * Calculate the Yield to Maturity (YTM) for a fixed income asset
 */
export function calculateYTM(asset: FixedIncomeAsset): number {
  // Return the nominal interest rate for perpetual bonds
  if (asset.type === 'perpetualBond' || !asset.maturity_date) {
    return asset.interest_rate;
  }
  
  const now = new Date();
  const maturityDate = new Date(asset.maturity_date);
  
  // Guard against invalid date
  if (isNaN(maturityDate.getTime())) {
    return asset.interest_rate;
  }
  
  // Get years to maturity (minimum 0.01 years to avoid division by zero)
  const yearsToMaturity = Math.max(
    0.01,
    (maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365)
  );
  
  const purchasePrice = asset.purchase_price;
  const faceValue = asset.face_value;
  
  // For zero-coupon bonds or discount instruments
  if (asset.interest_rate === 0) {
    return ((faceValue / purchasePrice) ** (1 / yearsToMaturity) - 1) * 100;
  }
  
  // For coupon-bearing instruments, use a simplified YTM approximation
  // YTM ≈ (C + (F-P)/n) / ((F+P)/2)
  const annualCoupon = faceValue * (asset.interest_rate / 100);
  const priceGain = (faceValue - purchasePrice) / yearsToMaturity;
  const averageInvestment = (faceValue + purchasePrice) / 2;
  
  return ((annualCoupon + priceGain) / averageInvestment) * 100;
}