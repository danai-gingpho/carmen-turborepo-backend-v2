
export interface ICreateTaxProfile {
  name: string;
  tax_rate?: number;
  is_active?: boolean;
}

export interface IUpdateTaxProfile {
  id: string;
  name?: string;
  tax_rate?: number;
  is_active?: boolean;
}
