export interface ICreateExtraCostType {
  name?: string;
  description?: string;
  is_active?: boolean;
  note?: string;
  info?: object;
  dimension?: object;
}

export interface IUpdateExtraCostType {
  id: string;
  name?: string;
  description?: string;
  is_active?: boolean;
  note?: string;
  info?: object;
  dimension?: object;
}
