import { Injectable } from '@nestjs/common';

@Injectable()
export class StockOutLogic {
  /**
   * Validate and enrich header fields (location, adjustment_type)
   * ตรวจสอบและเติมข้อมูล header (สถานที่, ประเภทการปรับปรุง)
   * Mutates data in place. Returns error string if validation fails, null if OK.
   */
  async validateAndEnrichHeader(
    prisma: any,
    data: {
      location_id?: string | null;
      location_code?: string | null;
      location_name?: string | null;
      adjustment_type_id?: string | null;
      adjustment_type_code?: string | null;
    },
  ): Promise<string | null> {
    if (data.location_id) {
      const location = await prisma.tb_location.findFirst({
        where: { id: data.location_id },
      });
      if (!location) {
        return 'Location not found';
      }
      data.location_code = location.code;
      data.location_name = location.name;
    }

    if (data.adjustment_type_id) {
      const adjustmentType = await prisma.tb_adjustment_type.findFirst({
        where: { id: data.adjustment_type_id },
      });
      if (!adjustmentType) {
        return 'Adjustment type not found';
      }
      data.adjustment_type_code = adjustmentType.code;
    }

    return null;
  }

  /**
   * Validate and enrich product fields in detail items
   * ตรวจสอบและเติมข้อมูลสินค้าในรายการย่อย
   * Mutates items in place. Returns error string if validation fails, null if OK.
   */
  async validateAndEnrichDetailItems(
    prisma: any,
    items: Array<{
      product_id?: string;
      product_name?: string | null;
      product_code?: string | null;
      product_sku?: string | null;
      product_local_name?: string | null;
    }>,
  ): Promise<string | null> {
    const productNotFound: string[] = [];

    await Promise.all(
      items.map(async (item) => {
        if (item.product_id) {
          const product = await prisma.tb_product.findFirst({
            where: { id: item.product_id },
          });
          if (!product) {
            productNotFound.push(item.product_id);
          } else {
            item.product_name = product.name;
            item.product_code = product.code;
            item.product_sku = product.code;
            item.product_local_name = product.local_name;
          }
        }
      }),
    );

    if (productNotFound.length > 0) {
      return `Product not found: ${productNotFound.join(', ')}`;
    }

    return null;
  }
}
