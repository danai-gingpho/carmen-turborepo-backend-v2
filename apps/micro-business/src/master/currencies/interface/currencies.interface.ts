export interface ICreateCurrencies {
  code: string;
  name: string;
  symbol?: string;
  description?: string;
  decimal_places?: number;
  is_active?: boolean;
  exchange_rate?: number;
  exchange_rate_at?: Date | string;
}

export interface IUpdateCurrencies {
  id: string;
  code?: string;
  name?: string;
  symbol?: string;
  description?: string;
  decimal_places?: number;
  is_active?: boolean;
  exchange_rate?: number;
  exchange_rate_at?: Date | string;
}