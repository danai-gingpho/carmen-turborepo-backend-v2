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
import { Config_RecipeEquipmentService } from './config_recipe-equipment.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecipeEquipmentCreateRequest, RecipeEquipmentUpdateRequest } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BaseHttpController, EnrichAuditUsers, Serialize } from '@/common';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ApiUserFilterQueries, ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  RecipeEquipmentCreateDto, RecipeEquipmentUpdateDto,
  RecipeEquipmentResponseSchema, IUpdateRecipeEquipment,
} from './dto/recipe-equipment.dto';

@Controller('api/config/:bu_code/recipe-equipment')
@ApiTags('Config: Recipes')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_RecipeEquipmentController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(Config_RecipeEquipmentController.name);

  constructor(private readonly recipeEquipmentService: Config_RecipeEquipmentService) {
    super();
  }

  /**
   * Retrieves a specific recipe equipment by ID
   * ค้นหาอุปกรณ์ครัวเดียวตาม ID สำหรับติดตามอุปกรณ์ที่จำเป็นในการเตรียมสูตรอาหาร
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe equipment ID / รหัสอุปกรณ์ครัว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('recipe-equipment.findOne'))
  @Serialize(RecipeEquipmentResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a recipe equipment by ID', description: 'Retrieves a specific kitchen equipment definition (e.g., oven, mixer, blender, sous vide) that can be associated with recipes to track required equipment for preparation.', operationId: 'configRecipeEquipment_findOne', 'x-description-th': 'ดึงข้อมูลอุปกรณ์ทำอาหารเดียวตาม ID สำหรับติดตามอุปกรณ์ที่จำเป็นในการเตรียมสูตรอาหาร' } as any)
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, Config_RecipeEquipmentController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeEquipmentService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Lists all recipe equipment types for the business unit
   * ค้นหาอุปกรณ์ครัวทั้งหมดสำหรับการวางแผนกำลังการผลิตครัวและการประเมินความเป็นไปได้
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @UseGuards(new AppIdGuard('recipe-equipment.findAll'))
  @Serialize(RecipeEquipmentResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all recipe equipment', description: 'Returns all kitchen equipment types configured for the business unit. Used to tag recipes with required equipment for kitchen capacity planning and recipe feasibility assessment.', operationId: 'configRecipeEquipment_findAll', 'x-description-th': 'ดึงรายการอุปกรณ์ทำอาหารทั้งหมดสำหรับการวางแผนกำลังการผลิตครัว' } as any)
  @ApiUserFilterQueries()
  async findAll(@Req() req: Request, @Res() res: Response, @Param('bu_code') bu_code: string, @Query() query?: IPaginateQuery, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version }, Config_RecipeEquipmentController.name);
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query) as unknown;
    const result = await this.recipeEquipmentService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  /**
   * Creates a new kitchen equipment type for recipe association
   * สร้างอุปกรณ์ครัวใหม่สำหรับเชื่อมโยงกับสูตรอาหาร
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Recipe equipment creation data / ข้อมูลสำหรับสร้างอุปกรณ์ครัว
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @UseGuards(new AppIdGuard('recipe-equipment.create'))
  @Serialize(RecipeEquipmentResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new recipe equipment', description: 'Defines a new kitchen equipment type that can be associated with recipes. Helps track which tools and appliances are needed for recipe preparation.', operationId: 'configRecipeEquipment_create', 'x-description-th': 'สร้างอุปกรณ์ทำอาหารใหม่สำหรับเชื่อมโยงกับสูตรอาหาร' } as any)
  @ApiBody({ type: RecipeEquipmentCreateRequest })
  async create(@Req() req: Request, @Res() res: Response, @Param('bu_code') bu_code: string, @Body() createDto: RecipeEquipmentCreateDto, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, Config_RecipeEquipmentController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeEquipmentService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Fully updates an existing kitchen equipment type
   * อัปเดตอุปกรณ์ครัวทั้งหมด การเปลี่ยนแปลงส่งผลต่อสูตรอาหารที่อ้างอิงอุปกรณ์นี้
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe equipment ID / รหัสอุปกรณ์ครัว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param version - API version / เวอร์ชัน API
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('recipe-equipment.update'))
  @Serialize(RecipeEquipmentResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a recipe equipment', description: 'Fully updates an existing kitchen equipment type definition. Changes affect how recipes reference this equipment.', operationId: 'configRecipeEquipment_update', 'x-description-th': 'อัปเดตอุปกรณ์ทำอาหารทั้งหมด การเปลี่ยนแปลงส่งผลต่อสูตรอาหารที่อ้างอิงอุปกรณ์นี้' } as any)
  @ApiBody({ type: RecipeEquipmentUpdateRequest })
  async update(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Body() updateDto: RecipeEquipmentUpdateDto, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, Config_RecipeEquipmentController.name);
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateRecipeEquipment = { ...updateDto, id };
    const result = await this.recipeEquipmentService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Partially updates specific fields of a kitchen equipment type
   * อัปเดตบางฟิลด์ของอุปกรณ์ครัวโดยไม่แทนที่ข้อมูลทั้งหมด
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe equipment ID / รหัสอุปกรณ์ครัว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Partial update data / ข้อมูลสำหรับอัปเดตบางส่วน
   * @param version - API version / เวอร์ชัน API
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('recipe-equipment.patch'))
  @Serialize(RecipeEquipmentResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Patch a recipe equipment', description: 'Partially updates specific fields of a kitchen equipment definition without replacing the entire record.', operationId: 'configRecipeEquipment_patch', 'x-description-th': 'อัปเดตบางฟิลด์ของอุปกรณ์ทำอาหารโดยไม่แทนที่ข้อมูลทั้งหมด' } as any)
  @ApiBody({ type: RecipeEquipmentUpdateRequest })
  async patch(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Body() updateDto: RecipeEquipmentUpdateDto, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'patch', id, updateDto, version }, Config_RecipeEquipmentController.name);
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateRecipeEquipment = { ...updateDto, id };
    const result = await this.recipeEquipmentService.patch(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Removes a kitchen equipment type from the system
   * ลบอุปกรณ์ครัวออกจากระบบ ควรอัปเดตสูตรอาหารที่อ้างอิงอุปกรณ์นี้ก่อนลบ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Recipe equipment ID / รหัสอุปกรณ์ครัว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('recipe-equipment.delete'))
  @Serialize(RecipeEquipmentResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a recipe equipment', description: 'Removes a kitchen equipment type from the system. Recipes referencing this equipment should be updated before deletion.', operationId: 'configRecipeEquipment_delete', 'x-description-th': 'ลบอุปกรณ์ทำอาหารออกจากระบบ ควรอัปเดตสูตรอาหารที่อ้างอิงอุปกรณ์นี้ก่อนลบ' } as any)
  async delete(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, Config_RecipeEquipmentController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeEquipmentService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
