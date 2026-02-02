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
  discount_amount_adjustment: number = 0
) {
  // Input validation
  if (qty < 0 || price < 0 || currency_rate <= 0) {
    throw new Error('Invalid input: qty and price must be non-negative, currency_rate must be positive');
  }
  if (tax_rate < 0 || discount_rate < 0) {
    throw new Error('Invalid input: tax_rate and discount_rate must be non-negative');
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
