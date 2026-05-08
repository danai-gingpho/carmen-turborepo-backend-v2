import { enum_cuisine_region } from '@repo/prisma-shared-schema-tenant';

export interface ICreateRecipeCuisine {
  name: string;
  description?: string | null;
  note?: string | null;
  is_active?: boolean;
  region: enum_cuisine_region;
  popular_dishes?: string[];
  key_ingredients?: string[];
  info?: Record<string, unknown> | null;
  dimension?: unknown[] | null;
}

export interface IUpdateRecipeCuisine {
  id: string;
  name?: string;
  description?: string | null;
  note?: string | null;
  is_active?: boolean;
  region?: enum_cuisine_region;
  popular_dishes?: string[];
  key_ingredients?: string[];
  info?: Record<string, unknown> | null;
  dimension?: unknown[] | null;
}
