export interface ICreateDeliveryPoint {
  name: string;
  is_active?: boolean;
}

export interface IUpdateDeliveryPoint {
  id: string;
  name?: string;
  is_active?: boolean;
}
