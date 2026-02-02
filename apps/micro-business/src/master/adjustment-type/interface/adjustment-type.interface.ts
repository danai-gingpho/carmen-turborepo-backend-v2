export interface ICreateAdjustmentType {
  code: string;
  name: string;
  type: 'STOCK_IN' | 'STOCK_OUT';
  description?: string;
  is_active?: boolean;
  note?: string;
  info?: Record<string, any>;
  dimension?: any[];
}

export interface IUpdateAdjustmentType {
  id: string;
  code?: string;
  name?: string;
  type?: 'STOCK_IN' | 'STOCK_OUT';
  description?: string;
  is_active?: boolean;
  note?: string;
  info?: Record<string, any>;
  dimension?: any[];
}
