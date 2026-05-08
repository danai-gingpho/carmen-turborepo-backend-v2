export interface ICreateRecipeCategory {
  code: string;
  name: string;
  description?: string | null;
  note?: string | null;
  is_active?: boolean;
  parent_id?: string | null;
  level?: number;
  default_cost_settings?: Record<string, unknown>;
  default_margins?: Record<string, unknown>;
  info?: Record<string, unknown> | null;
  dimension?: unknown[] | null;
}

export interface IUpdateRecipeCategory {
  id: string;
  code?: string;
  name?: string;
  description?: string | null;
  note?: string | null;
  is_active?: boolean;
  parent_id?: string | null;
  level?: number;
  default_cost_settings?: Record<string, unknown>;
  default_margins?: Record<string, unknown>;
  info?: Record<string, unknown> | null;
  dimension?: unknown[] | null;
}
