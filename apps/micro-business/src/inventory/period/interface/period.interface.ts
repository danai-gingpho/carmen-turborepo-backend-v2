export interface ICreatePeriod {
  period: string; // YYMM format
  fiscal_year: number; // YYYY
  fiscal_month: number; // 1-12
  start_at: string | Date;
  end_at: string | Date;
  status?: 'open' | 'closed' | 'locked';
  note?: string | null;
  info?: any | null;
  dimension?: any | null;
}

export interface IUpdatePeriod {
  id: string;
  period?: string;
  fiscal_year?: number;
  fiscal_month?: number;
  start_at?: string | Date;
  end_at?: string | Date;
  status?: 'open' | 'closed' | 'locked';
  note?: string | null;
  info?: any | null;
  dimension?: any | null;
}
