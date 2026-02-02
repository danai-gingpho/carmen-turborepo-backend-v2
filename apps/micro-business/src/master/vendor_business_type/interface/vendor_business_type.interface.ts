export interface ICreateVendorBusinessType {
  name: string;
  description?: string;
  is_active?: boolean;
  note?: string;
  info?: object;
  dimension?: object;
}

export interface IUpdateVendorBusinessType {
  id: string;
  name?: string;
  description?: string;
  is_active?: boolean;
  note?: string;
  info?: object;
  dimension?: object;
}



