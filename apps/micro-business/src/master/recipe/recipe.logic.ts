import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

@Injectable()
export class RecipeLogic {
  private prismaService: PrismaClient;

  setPrismaService(prismaService: PrismaClient): void {
    this.prismaService = prismaService;
  }

  async validateCategory(categoryId: string): Promise<{ id: string; name: string } | null> {
    return this.prismaService.tb_recipe_category.findFirst({
      where: { id: categoryId, deleted_at: null },
      select: { id: true, name: true },
    });
  }

  async validateCuisine(cuisineId: string): Promise<{ id: string; name: string } | null> {
    return this.prismaService.tb_recipe_cuisines.findFirst({
      where: { id: cuisineId, deleted_at: null },
      select: { id: true, name: true },
    });
  }

  convertDecimalFields(recipe: Record<string, unknown>): Record<string, unknown> {
    const decimalFields = [
      'base_yield', 'total_ingredient_cost', 'labor_cost', 'overhead_cost',
      'cost_per_portion', 'suggested_price', 'selling_price',
      'target_food_cost_percentage', 'actual_food_cost_percentage',
      'gross_margin', 'gross_margin_percentage',
      'labor_cost_percentage', 'overhead_percentage', 'carbon_footprint',
    ];

    const converted = { ...recipe };
    for (const field of decimalFields) {
      if (converted[field] !== undefined && converted[field] !== null) {
        converted[field] = Number(converted[field]);
      }
    }
    return converted;
  }
}
