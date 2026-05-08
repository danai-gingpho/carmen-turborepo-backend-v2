export interface ICreateCreditTerm {
  name: string;
  value?: number;
  description?: string;
  is_active?: boolean;
  note?: string;
  info?: object;
}

export interface IUpdateCreditTerm {
  id: string;
  name?: string;
  value?: number;
  description?: string;
  is_active?: boolean;
  note?: string;
  info?: object;
}

