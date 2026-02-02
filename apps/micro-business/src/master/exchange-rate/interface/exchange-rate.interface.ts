export interface ICreateExchangeRate {
  at_date?: Date | string;
  exchange_rate?: number;
  currency_id: string;
}

export interface IUpdateExchangeRate {
  id: string;
  at_date?: Date | string;
  exchange_rate?: number;
  currency_id?: string;
}
