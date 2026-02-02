import {
  enum_location_type,
  enum_physical_count_type,
} from '@repo/prisma-shared-schema-tenant';

interface Users {
  add?: {
    id: string;
  }[];
  remove?: {
    id: string;
  }[];
}

interface Products {
  add?: {
    id: string;
    min_qty?: number;
    max_qty?: number;
    re_order_qty?: number;
    par_qty?: number;
  }[];
  update?: {
    id: string;
    min_qty?: number;
    max_qty?: number;
    re_order_qty?: number;
    par_qty?: number;
  }[];
  remove?: {
    id: string;
  }[];
}

export interface ICreateLocation {
  code: string;
  name: string;
  location_type: enum_location_type;
  physical_count_type?: enum_physical_count_type;
  delivery_point_id?: string;
  description?: string;
  is_active?: boolean;
  users?: Users;
  products?: Products;
}

export interface IUpdateLocation {
  id: string;
  code?: string;
  name?: string;
  location_type?: enum_location_type;
  physical_count_type?: enum_physical_count_type;
  delivery_point_id?: string;
  description?: string;
  is_active?: boolean;
  users?: Users;
  products?: Products;
}
