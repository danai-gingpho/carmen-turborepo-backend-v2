import { PatternMapper } from './common.interface'

interface IPattern {
  type: string,
  pattern: string,
  ch?: string
}

export function getPattern(pattern: PatternMapper) {
  // TODO NOW SUPPOER ONLY DATE AND RUNNING PATTERN 
  const result: IPattern[] = []
  for (const key in pattern) {
    const value = pattern[key]
    if(value.includes('date')) {
      result.push(getDatePattern(value))
    } else if(value.includes('running')) {
      result.push(getRunningPattern(value))
    }
  }

  return result
}

function getDatePattern(pattern: string): IPattern {
  let datePattern = ''
  const MATCH_INSIDE_PARENTHESES = /(?<=\(['"]).*?(?=['"]\))/
  datePattern = pattern.match(MATCH_INSIDE_PARENTHESES)[0]

  return {
    type: 'date',
    pattern: datePattern,
  }
}

export const calcBaseQty = (qty: unknown, factor: unknown): number =>
  Math.round(Number(qty ?? 0) * Number(factor ?? 0) * 100) / 100;

export const calcBase = (value: unknown, rate: unknown): number => {
  const r = Number(rate ?? 1);
  const effectiveRate = r > 0 ? r : 1;
  return Math.round(Number(value ?? 0) * effectiveRate * 100000) / 100000;
};

export interface DetailPriceLike {
  price?: unknown;
  pricelist_price?: unknown;
  sub_total_price?: unknown;
  discount_amount?: unknown;
  net_amount?: unknown;
  tax_amount?: unknown;
  total_price?: unknown;
}

export const calcBasePrices = (
  detail: DetailPriceLike,
  exchange_rate: unknown,
) => ({
  base_price: calcBase(detail.price ?? detail.pricelist_price, exchange_rate),
  base_sub_total_price: calcBase(detail.sub_total_price, exchange_rate),
  base_discount_amount: calcBase(detail.discount_amount, exchange_rate),
  base_net_amount: calcBase(detail.net_amount, exchange_rate),
  base_tax_amount: calcBase(detail.tax_amount, exchange_rate),
  base_total_price: calcBase(detail.total_price, exchange_rate),
});

function getRunningPattern(pattern: string): IPattern {
  const RUNNING_PATTERN = /\((\d+),(.*?)\)/
  const match = pattern.match(RUNNING_PATTERN)
  const [, running, setChar] = match

  return {
    type: 'running',
    pattern: running,
    ch: setChar
  }
}