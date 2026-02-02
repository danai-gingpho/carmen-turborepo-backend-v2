import { enum_data_type } from "@repo/prisma-shared-schema-tenant";

export interface ICreateCurrencies {
  code: string;
  name: string;
  symbol?: string;
  description?: string;
  is_active?: boolean;
  exchange_rate?: number;
}

export interface IUpdateCurrencies {
  id: string;
  code?: string;
  name?: string;
  symbol?: string;
  description?: string;
  is_active?: boolean;
  exchange_rate?: number;
}

export interface IBusinessUnitConfig {
  id?: string;
  key?: string;
  label?: string;
  datatype?: enum_data_type;
  value?: any;
}