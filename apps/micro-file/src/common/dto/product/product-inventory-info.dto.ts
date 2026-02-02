import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import { ApiProperty } from "@nestjs/swagger";

export const ProductInventoryInfoSchema = z.object({
  on_hand_qty: z.number().optional(),
  on_order_qty: z.number().optional(),
  re_order_qty: z.number().optional(),
  re_stock_qty: z.number().optional(),
});

export type IProductInventoryInfo = z.infer<typeof ProductInventoryInfoSchema>;

export class ProductInventoryInfoDto extends createZodDto(ProductInventoryInfoSchema) {}

export const ProductInventoryInfoDtoSchema = ProductInventoryInfoDto.schema;