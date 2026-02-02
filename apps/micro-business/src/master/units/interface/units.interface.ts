export interface ICreateUnits {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface IUpdateUnits {
  id: string;
  name?: string;
  description?: string;
  is_active?: boolean;
}
