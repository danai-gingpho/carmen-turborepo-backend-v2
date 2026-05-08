export interface ICreateRecipeEquipmentCategory {
  name: string;
  description?: string | null;
  note?: string | null;
  is_active?: boolean;
  info?: object | null;
  dimension?: object | null;
}

export interface IUpdateRecipeEquipmentCategory {
  id: string;
  name?: string;
  description?: string | null;
  note?: string | null;
  is_active?: boolean;
  info?: object | null;
  dimension?: object | null;
}
