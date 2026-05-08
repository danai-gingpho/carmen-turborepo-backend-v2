-- ============================================================================
-- Price calculation function for Carmen ERP
-- Mirrors getCalculatePriceInfo() TypeScript logic
-- ============================================================================

-- Composite return type
CREATE TYPE price_info AS (
  qty                    NUMERIC,
  price                  NUMERIC,
  currency_rate          NUMERIC,
  tax_rate               NUMERIC,
  discount_rate          NUMERIC,
  base_price             NUMERIC,
  sub_total_price        NUMERIC,
  base_sub_total_price   NUMERIC,
  discount_percentage    NUMERIC,
  discount_amount        NUMERIC,
  base_discount_amount   NUMERIC,
  net_amount             NUMERIC,
  base_net_amount        NUMERIC,
  tax_percentage         NUMERIC,
  tax_amount             NUMERIC,
  base_tax_amount        NUMERIC,
  total_price            NUMERIC,
  base_total_price       NUMERIC
);

-- Function
CREATE OR REPLACE FUNCTION get_calculate_price_info(
  p_qty                         NUMERIC,
  p_price                       NUMERIC,
  p_currency_rate               NUMERIC DEFAULT 1,
  p_tax_rate                    NUMERIC DEFAULT 7,
  p_is_tax_adjustment           BOOLEAN DEFAULT FALSE,
  p_tax_amount_adjustment       NUMERIC DEFAULT 0,
  p_discount_rate               NUMERIC DEFAULT 0,
  p_is_discount_adjustment      BOOLEAN DEFAULT FALSE,
  p_discount_amount_adjustment  NUMERIC DEFAULT 0
)
RETURNS price_info
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_sub_total_price  NUMERIC;
  v_discount_amount  NUMERIC;
  v_net_amount       NUMERIC;
  v_tax_amount       NUMERIC;
  v_total_price      NUMERIC;
  v_result           price_info;
BEGIN
  -- Input validation
  IF p_qty < 0 OR p_price < 0 OR p_currency_rate <= 0 THEN
    RAISE EXCEPTION 'Invalid input: qty and price must be non-negative, currency_rate must be positive';
  END IF;

  IF p_tax_rate < 0 OR p_discount_rate < 0 THEN
    RAISE EXCEPTION 'Invalid input: tax_rate and discount_rate must be non-negative';
  END IF;

  IF p_discount_rate > 100 THEN
    RAISE EXCEPTION 'Invalid input: discount_rate cannot exceed 100%%';
  END IF;

  -- Subtotal
  v_sub_total_price := p_qty * p_price;

  -- Discount
  v_discount_amount := CASE
    WHEN p_is_discount_adjustment THEN p_discount_amount_adjustment
    ELSE (v_sub_total_price * p_discount_rate) / 100
  END;

  -- Net (after discount, before tax)
  v_net_amount := v_sub_total_price - v_discount_amount;

  -- Tax (applied to net amount, matching TS logic)
  v_tax_amount := CASE
    WHEN p_is_tax_adjustment THEN p_tax_amount_adjustment
    ELSE (v_net_amount * p_tax_rate) / 100
  END;

  -- Total
  v_total_price := v_net_amount + v_tax_amount;

  -- Build result
  v_result.qty                  := p_qty;
  v_result.price                := p_price;
  v_result.currency_rate        := p_currency_rate;
  v_result.tax_rate             := p_tax_rate;
  v_result.discount_rate        := p_discount_rate;
  v_result.base_price           := p_price * p_currency_rate;
  v_result.sub_total_price      := v_sub_total_price;
  v_result.base_sub_total_price := v_sub_total_price * p_currency_rate;
  v_result.discount_percentage  := p_discount_rate;
  v_result.discount_amount      := v_discount_amount;
  v_result.base_discount_amount := v_discount_amount * p_currency_rate;
  v_result.net_amount           := v_net_amount;
  v_result.base_net_amount      := v_net_amount * p_currency_rate;
  v_result.tax_percentage       := p_tax_rate;
  v_result.tax_amount           := v_tax_amount;
  v_result.base_tax_amount      := v_tax_amount * p_currency_rate;
  v_result.total_price          := v_total_price;
  v_result.base_total_price     := v_total_price * p_currency_rate;

  RETURN v_result;
END;
$$;