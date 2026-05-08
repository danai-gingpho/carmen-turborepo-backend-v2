import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_RecipeService } from './config_recipe.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecipeCreateRequestDto, RecipeUpdateRequestDto } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BaseHttpController, EnrichAuditUsers, Serialize } from '@/common';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  RecipeCreateDto,
  RecipeUpdateDto,
  RecipeResponseSchema,
  IUpdateRecipe,
} from './dto/recipe.dto';

@Controller('api/config/:bu_code/recipe')
@ApiTags('Config: Recipes')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_RecipeController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_RecipeController.name,
  );

  constructor(private readonly recipeService: Config_RecipeService) {
    super();
  }

  /**
   * Retrieves a specific recipe with full ingredient details
   * ค้นหาสูตรอาหารเดียวตาม ID พร้อมรายการส่วนผสม ปริมาณ และขั้นตอนการเตรียม
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe ID / รหัสสูตรอาหาร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('recipe.findOne'))
  @Serialize(RecipeResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a recipe by ID',
    description: 'Retrieves a specific recipe with its full ingredient list, quantities, preparation steps, and yield information. Used by kitchen and F&B teams to manage standardized recipes for cost control.',
    operationId: 'configRecipe_findOne',
    responses: { 200: { description: 'Recipe retrieved successfully' } },
    'x-description-th': 'ดึงข้อมูลสูตรอาหารเดียวตาม ID พร้อมรายการส่วนผสม ปริมาณ และขั้นตอนการเตรียม',
  } as any)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findOne', id, version },
      Config_RecipeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Lists all configured recipes with ingredient compositions
   * ค้นหาสูตรอาหารทั้งหมดพร้อมส่วนผสมสำหรับการคำนวณต้นทุนเมนู
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @UseGuards(new AppIdGuard('recipe.findAll'))
  @Serialize(RecipeResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all recipes',
    description: 'Returns all configured recipes with their ingredient compositions. Used by administrators and chefs to manage the recipe catalog for menu costing and ingredient demand forecasting.',
    operationId: 'configRecipe_findAll',
    responses: { 200: { description: 'Recipes retrieved successfully' } },
    'x-description-th': 'ดึงรายการสูตรอาหารทั้งหมดพร้อมส่วนผสมสำหรับการคำนวณต้นทุนเมนู',
  } as any)
  @ApiUserFilterQueries()
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findAll', query, version },
      Config_RecipeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query) as unknown;
    const result = await this.recipeService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  /**
   * Creates a new recipe linking products as ingredients
   * สร้างสูตรอาหารใหม่เชื่อมโยงสินค้าเป็นส่วนผสมพร้อมปริมาณและขั้นตอนการเตรียม
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Recipe creation data / ข้อมูลสำหรับสร้างสูตรอาหาร
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @UseGuards(new AppIdGuard('recipe.create'))
  @Serialize(RecipeResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new recipe',
    description: 'Creates a new recipe linking products as ingredients with specified quantities and preparation steps. The recipe can then be used for menu costing, food cost analysis, and inventory consumption tracking.',
    operationId: 'configRecipe_create',
    responses: { 201: { description: 'Recipe created successfully' } },
    'x-description-th': 'สร้างสูตรอาหารใหม่เชื่อมโยงสินค้าเป็นส่วนผสมพร้อมปริมาณและขั้นตอนการเตรียม',
  } as any)
  @ApiBody({ type: RecipeCreateRequestDto })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: RecipeCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'create', createDto, version },
      Config_RecipeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Fully updates a recipe including ingredients and preparation instructions
   * อัปเดตสูตรอาหารทั้งหมดรวมถึงรายการส่วนผสม ปริมาณ และคำแนะนำการเตรียม
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe ID / รหัสสูตรอาหาร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param version - API version / เวอร์ชัน API
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('recipe.update'))
  @Serialize(RecipeResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a recipe',
    description: 'Fully updates a recipe including its ingredient list, quantities, and preparation instructions. Changes are reflected in menu cost calculations and ingredient demand projections.',
    operationId: 'configRecipe_update',
    responses: { 200: { description: 'Recipe updated successfully' } },
    'x-description-th': 'อัปเดตสูตรอาหารทั้งหมดรวมถึงรายการส่วนผสม ปริมาณ และคำแนะนำการเตรียม',
  } as any)
  @ApiBody({ type: RecipeUpdateRequestDto })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: RecipeUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'update', id, updateDto, version },
      Config_RecipeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateRecipe = { ...updateDto, id };
    const result = await this.recipeService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Partially updates specific fields of a recipe
   * อัปเดตบางฟิลด์ของสูตรอาหาร เช่น ปริมาณส่วนผสมหรือสถานะการใช้งาน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe ID / รหัสสูตรอาหาร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Partial update data / ข้อมูลสำหรับอัปเดตบางส่วน
   * @param version - API version / เวอร์ชัน API
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('recipe.patch'))
  @Serialize(RecipeResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Patch a recipe',
    description: 'Partially updates specific fields of a recipe without replacing the entire record. Useful for adjusting individual ingredient quantities or toggling active status.',
    operationId: 'configRecipe_patch',
    responses: { 200: { description: 'Recipe patched successfully' } },
    'x-description-th': 'อัปเดตบางฟิลด์ของสูตรอาหาร เช่น ปริมาณส่วนผสมหรือสถานะการใช้งาน',
  } as any)
  @ApiBody({ type: RecipeUpdateRequestDto })
  async patch(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: RecipeUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'patch', id, updateDto, version },
      Config_RecipeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateRecipe = { ...updateDto, id };
    const result = await this.recipeService.patch(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Removes a recipe from the active catalog
   * ลบสูตรอาหารออกจากแค็ตตาล็อก ข้อมูลต้นทุนในอดีตยังคงอยู่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe ID / รหัสสูตรอาหาร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('recipe.delete'))
  @Serialize(RecipeResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a recipe',
    description: 'Removes a recipe from the active catalog. The recipe will no longer be used for menu costing or ingredient consumption calculations, but historical cost data is preserved.',
    operationId: 'configRecipe_delete',
    responses: { 200: { description: 'Recipe deleted successfully' } },
    'x-description-th': 'ลบสูตรอาหารออกจากแค็ตตาล็อก ข้อมูลต้นทุนในอดีตยังคงอยู่',
  } as any)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'delete', id, version },
      Config_RecipeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
