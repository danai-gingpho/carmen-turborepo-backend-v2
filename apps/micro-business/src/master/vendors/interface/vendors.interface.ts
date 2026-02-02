
import { enum_vendor_address_type } from "@repo/prisma-shared-schema-tenant";

export interface IVendorBusinessType {
  id: string;
  name: string;
}

export interface IVendorAddress {
  address_type?: enum_vendor_address_type;
  data?: object;
}

export interface IVendorContact {
  name: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  description?: string;
  info?: object;
}

export interface IVendorAddressUpdate {
  vendor_address_id: string;
  address_type?: enum_vendor_address_type;
  data?: object;
}

export interface IVendorContactUpdate {
  vendor_contact_id: string;
  name?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  description?: string;
  info?: object;
}

export interface ICreateVendor {
  code: string;
  name: string;
  business_type?: IVendorBusinessType[];
  description?: string;
  info?: object;
  vendor_address?: IVendorAddress[];
  vendor_contact?: IVendorContact[];
}

export interface IUpdateVendor {
  id: string;
  code?: string;
  name?: string;
  business_type?: IVendorBusinessType[];
  description?: string;
  info?: object;
  vendor_address?: {
    add?: IVendorAddress[];
    update?: IVendorAddressUpdate[];
    remove?: { vendor_address_id: string }[];
  };
  vendor_contact?: {
    add?: IVendorContact[];
    update?: IVendorContactUpdate[];
    remove?: { vendor_contact_id: string }[];
  };
}
