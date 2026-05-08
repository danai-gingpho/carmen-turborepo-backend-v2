export interface ICreateUnits {
  name: string;
  description?: string;
  is_active?: boolean;
  decimal_place?: number;
}

export interface IUpdateUnits {
  id: string;
  name?: string;
  description?: string;
  is_active?: boolean;
  decimal_place?: number;
}
