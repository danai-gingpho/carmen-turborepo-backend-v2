export interface ICreatePriceList {
    vendor_id: string;
    effective_from_date: Date;
    effective_to_date?: Date;
    product_id?: string;
    product_name?: string;
    unit_id?: string;
    unit_name?: string;

    moq_qty?: number;
    price_without_tax?: number;
    tax_amt?: number;
    price?: number;

    tax_profile_id?: string;
    tax_profile_name?: string;
    tax_rate?: number;

    lead_time_days?: number;

    is_active?: boolean;
    note?: string;
    info?: object;
    dimension?: string;
}

export interface IUpdatePriceList {
    id: string;
    vendor_id?: string;
    effective_from_date?: Date;
    effective_to_date?: Date;
    product_id?: string;
    product_name?: string;
    unit_id?: string;
    unit_name?: string;

    moq_qty?: number;
    price_without_tax?: number;
    tax_amt?: number;
    price?: number;

    lead_time_days?: number;

    tax_profile_id?: string;
    tax_profile_name?: string;
    tax_rate?: number;
    is_active?: boolean;
    note?: string;
    info?: object;
    dimension?: string;
}
