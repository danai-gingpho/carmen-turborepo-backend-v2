/**
 * Price calculation utilities for handling taxes, discounts, and currency conversion
 */

// ============================================
// Type Definitions
// ============================================

export interface PriceCalculationInput {
  qty: number;
  price: number;
  currency_rate?: number;
  tax_rate?: number;
  is_tax_adjustment?: boolean;
  tax_amount_adjustment?: number;
  discount_rate?: number;
  is_discount_adjustment?: boolean;
  discount_amount_adjustment?: number;
}

export interface PriceCalculationResult {
  // Input parameters
  qty: number;
  price: number;
  currency_rate: number;
  tax_rate: number;
  discount_rate: number;

  // Base currency price
  base_price: number;

  // Subtotal calculations
  sub_total_price: number;
  base_sub_total_price: number;

  // Discount calculations
  discount_percentage: number;
  discount_amount: number;
  base_discount_amount: number;

  // Net amount (after discount, before tax)
  net_amount: number;
  base_net_amount: number;

  // Tax calculations
  tax_percentage: number;
  tax_amount: number;
  base_tax_amount: number;

  // Final total
  total_price: number;
  base_total_price: number;
}

export interface TotalSummary {
  total_qty: number;
  total_sub_total: number;
  total_discount: number;
  total_net: number;
  total_tax: number;
  total_amount: number;
  base_total_sub_total: number;
  base_total_discount: number;
  base_total_net: number;
  base_total_tax: number;
  base_total_amount: number;
}

// ============================================
// Main Calculation Functions
// ============================================

/**
 * Calculates comprehensive price information including taxes, discounts, and currency conversion
 *
 * @param qty - Quantity of items
 * @param price - Unit price per item
 * @param currency_rate - Exchange rate to base currency (default: 1)
 * @param tax_rate - Tax percentage rate (default: 7%)
 * @param is_tax_adjustment - Whether to use manual tax adjustment instead of calculated tax
 * @param tax_amount_adjustment - Manual tax amount (used when is_tax_adjustment is true)
 * @param discount_rate - Discount percentage rate (default: 0%)
 * @param is_discount_adjustment - Whether to use manual discount adjustment instead of calculated discount
 * @param discount_amount_adjustment - Manual discount amount (used when is_discount_adjustment is true)
 * @returns Object containing all calculated price components
 */
export function getCalculatePriceInfo(
  qty: number,
  price: number,
  currency_rate: number = 1,
  tax_rate: number = 7,
  is_tax_adjustment: boolean = false,
  tax_amount_adjustment: number = 0,
  discount_rate: number = 0,
  is_discount_adjustment: boolean = false,
  discount_amount_adjustment: number = 0,
): PriceCalculationResult {
  // Input validation
  if (qty < 0 || price < 0 || currency_rate <= 0) {
    throw new Error(
      'Invalid input: qty and price must be non-negative, currency_rate must be positive',
    );
  }
  if (tax_rate < 0 || discount_rate < 0) {
    throw new Error(
      'Invalid input: tax_rate and discount_rate must be non-negative',
    );
  }
  if (discount_rate > 100) {
    throw new Error('Invalid input: discount_rate cannot exceed 100%');
  }

  // Calculate subtotal (base calculation)
  const sub_total_price = qty * price;

  // Calculate discount amount
  const discount_amount = is_discount_adjustment
    ? discount_amount_adjustment
    : (sub_total_price * discount_rate) / 100;

  // Calculate net amount after discount
  const net_amount = sub_total_price - discount_amount;

  // Calculate tax amount (applied to net amount after discount for consistency)
  const tax_amount = is_tax_adjustment
    ? tax_amount_adjustment
    : (net_amount * tax_rate) / 100;

  // Calculate total price
  const total_price = net_amount + tax_amount;

  // Convert all amounts to base currency
  const base_price = price * currency_rate;
  const base_sub_total_price = sub_total_price * currency_rate;
  const base_discount_amount = discount_amount * currency_rate;
  const base_net_amount = net_amount * currency_rate;
  const base_tax_amount = tax_amount * currency_rate;
  const base_total_price = total_price * currency_rate;

  return {
    // Input parameters
    qty,
    price,
    currency_rate,
    tax_rate,
    discount_rate,

    // Base currency price
    base_price,

    // Subtotal calculations
    sub_total_price,
    base_sub_total_price,

    // Discount calculations
    discount_percentage: discount_rate,
    discount_amount,
    base_discount_amount,

    // Net amount (after discount, before tax)
    net_amount,
    base_net_amount,

    // Tax calculations
    tax_percentage: tax_rate,
    tax_amount,
    base_tax_amount,

    // Final total
    total_price,
    base_total_price,
  };
}

/**
 * Calculates price info from an input object
 */
export function calculatePriceFromInput(
  input: PriceCalculationInput,
): PriceCalculationResult {
  return getCalculatePriceInfo(
    input.qty,
    input.price,
    input.currency_rate ?? 1,
    input.tax_rate ?? 7,
    input.is_tax_adjustment ?? false,
    input.tax_amount_adjustment ?? 0,
    input.discount_rate ?? 0,
    input.is_discount_adjustment ?? false,
    input.discount_amount_adjustment ?? 0,
  );
}

/**
 * Calculates total summary from an array of price calculation results
 */
export function calculateTotalSummary(
  items: PriceCalculationResult[],
): TotalSummary {
  return items.reduce(
    (acc, item) => ({
      total_qty: acc.total_qty + item.qty,
      total_sub_total: acc.total_sub_total + item.sub_total_price,
      total_discount: acc.total_discount + item.discount_amount,
      total_net: acc.total_net + item.net_amount,
      total_tax: acc.total_tax + item.tax_amount,
      total_amount: acc.total_amount + item.total_price,
      base_total_sub_total: acc.base_total_sub_total + item.base_sub_total_price,
      base_total_discount: acc.base_total_discount + item.base_discount_amount,
      base_total_net: acc.base_total_net + item.base_net_amount,
      base_total_tax: acc.base_total_tax + item.base_tax_amount,
      base_total_amount: acc.base_total_amount + item.base_total_price,
    }),
    {
      total_qty: 0,
      total_sub_total: 0,
      total_discount: 0,
      total_net: 0,
      total_tax: 0,
      total_amount: 0,
      base_total_sub_total: 0,
      base_total_discount: 0,
      base_total_net: 0,
      base_total_tax: 0,
      base_total_amount: 0,
    },
  );
}

// ============================================
// Utility Functions
// ============================================

/**
 * Rounds a number to specified decimal places
 */
export function roundToDecimal(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculates discount amount from percentage
 */
export function calculateDiscountAmount(
  amount: number,
  discountRate: number,
): number {
  if (discountRate < 0 || discountRate > 100) {
    throw new Error('Discount rate must be between 0 and 100');
  }
  return (amount * discountRate) / 100;
}

/**
 * Calculates tax amount from percentage
 */
export function calculateTaxAmount(amount: number, taxRate: number): number {
  if (taxRate < 0) {
    throw new Error('Tax rate must be non-negative');
  }
  return (amount * taxRate) / 100;
}

/**
 * Converts amount to base currency
 */
export function convertToBaseCurrency(
  amount: number,
  currencyRate: number,
): number {
  if (currencyRate <= 0) {
    throw new Error('Currency rate must be positive');
  }
  return amount * currencyRate;
}

/**
 * Calculates percentage of a value
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Safely parses a numeric value, returning default if invalid
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
