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
import { Config_RecipeCategoryService } from './config_recipe-category.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecipeCategoryCreateRequest, RecipeCategoryUpdateRequest } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BaseHttpController, EnrichAuditUsers, Serialize } from '@/common';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ApiUserFilterQueries, ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  RecipeCategoryCreateDto, RecipeCategoryUpdateDto,
  RecipeCategoryResponseSchema, IUpdateRecipeCategory,
} from './dto/recipe-category.dto';

@Controller('api/config/:bu_code/recipe-category')
@ApiTags('Config: Recipes')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_RecipeCategoryController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(Config_RecipeCategoryController.name);

  constructor(private readonly recipeCategoryService: Config_RecipeCategoryService) {
    super();
  }

  /**
   * Retrieves a specific recipe category by ID
   * ค้นหาหมวดหมู่สูตรอาหารเดียวตาม ID สำหรับจำแนกประเภทสูตรอาหาร
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe category ID / รหัสหมวดหมู่สูตรอาหาร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('recipe-category.findOne'))
  @Serialize(RecipeCategoryResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a recipe category by ID', description: 'Retrieves a specific recipe category used to classify recipes (e.g., Appetizers, Main Course, Desserts, Beverages). Categories help organize the recipe catalog for menu planning and cost analysis.', operationId: 'configRecipeCategory_findOne', 'x-description-th': 'ดึงข้อมูลหมวดหมู่สูตรอาหารเดียวตาม ID สำหรับจำแนกประเภทสูตรอาหาร' } as any)
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, Config_RecipeCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeCategoryService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Lists all recipe categories for the business unit
   * ค้นหาหมวดหมู่สูตรอาหารทั้งหมดสำหรับการจัดระเบียบเมนูและการดำเนินงานครัว
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @UseGuards(new AppIdGuard('recipe-category.findAll'))
  @Serialize(RecipeCategoryResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all recipe categories', description: 'Returns all recipe categories configured for the business unit. Used to organize recipes by meal type or course for structured menu management and kitchen operations.', operationId: 'configRecipeCategory_findAll', 'x-description-th': 'ดึงรายการหมวดหมู่สูตรอาหารทั้งหมดสำหรับการจัดระเบียบเมนูและการดำเนินงานครัว' } as any)
  @ApiUserFilterQueries()
  async findAll(@Req() req: Request, @Res() res: Response, @Param('bu_code') bu_code: string, @Query() query?: IPaginateQuery, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version }, Config_RecipeCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query) as unknown;
    const result = await this.recipeCategoryService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  /**
   * Creates a new recipe category for organizing the recipe catalog
   * สร้างหมวดหมู่สูตรอาหารใหม่สำหรับจัดระเบียบแค็ตตาล็อกสูตรอาหาร
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Recipe category creation data / ข้อมูลสำหรับสร้างหมวดหมู่สูตรอาหาร
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @UseGuards(new AppIdGuard('recipe-category.create'))
  @Serialize(RecipeCategoryResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new recipe category', description: 'Defines a new recipe classification category for organizing the recipe catalog. Recipes can then be assigned to this category for structured menu planning.', operationId: 'configRecipeCategory_create', 'x-description-th': 'สร้างหมวดหมู่สูตรอาหารใหม่สำหรับจัดระเบียบแค็ตตาล็อกสูตรอาหาร' } as any)
  @ApiBody({ type: RecipeCategoryCreateRequest })
  async create(@Req() req: Request, @Res() res: Response, @Param('bu_code') bu_code: string, @Body() createDto: RecipeCategoryCreateDto, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, Config_RecipeCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeCategoryService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Fully updates an existing recipe category
   * อัปเดตหมวดหมู่สูตรอาหารทั้งหมด เช่น เปลี่ยนชื่อหมวดหมู่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe category ID / รหัสหมวดหมู่สูตรอาหาร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param version - API version / เวอร์ชัน API
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('recipe-category.update'))
  @Serialize(RecipeCategoryResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a recipe category', description: 'Fully updates an existing recipe category, such as renaming it. Changes affect how recipes are organized and filtered in the catalog.', operationId: 'configRecipeCategory_update', 'x-description-th': 'อัปเดตหมวดหมู่สูตรอาหารทั้งหมด เช่น เปลี่ยนชื่อหมวดหมู่' } as any)
  @ApiBody({ type: RecipeCategoryUpdateRequest })
  async update(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Body() updateDto: RecipeCategoryUpdateDto, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, Config_RecipeCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateRecipeCategory = { ...updateDto, id };
    const result = await this.recipeCategoryService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Partially updates specific fields of a recipe category
   * อัปเดตบางฟิลด์ของหมวดหมู่สูตรอาหาร เช่น สถานะการใช้งาน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe category ID / รหัสหมวดหมู่สูตรอาหาร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Partial update data / ข้อมูลสำหรับอัปเดตบางส่วน
   * @param version - API version / เวอร์ชัน API
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('recipe-category.patch'))
  @Serialize(RecipeCategoryResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Patch a recipe category', description: 'Partially updates specific fields of a recipe category without replacing the entire record. Useful for toggling active status or making minor adjustments.', operationId: 'configRecipeCategory_patch', 'x-description-th': 'อัปเดตบางฟิลด์ของหมวดหมู่สูตรอาหาร เช่น สถานะการใช้งาน' } as any)
  @ApiBody({ type: RecipeCategoryUpdateRequest })
  async patch(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Body() updateDto: RecipeCategoryUpdateDto, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'patch', id, updateDto, version }, Config_RecipeCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateRecipeCategory = { ...updateDto, id };
    const result = await this.recipeCategoryService.patch(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Removes a recipe category from the system
   * ลบหมวดหมู่สูตรอาหารออกจากระบบ ควรย้ายสูตรอาหารไปหมวดหมู่อื่นก่อนลบ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe category ID / รหัสหมวดหมู่สูตรอาหาร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('recipe-category.delete'))
  @Serialize(RecipeCategoryResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a recipe category', description: 'Removes a recipe category from the system. Recipes currently assigned to this category should be reassigned before deletion.', operationId: 'configRecipeCategory_delete', 'x-description-th': 'ลบหมวดหมู่สูตรอาหารออกจากระบบ ควรย้ายสูตรอาหารไปหมวดหมู่อื่นก่อนลบ' } as any)
  async delete(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, Config_RecipeCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeCategoryService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
