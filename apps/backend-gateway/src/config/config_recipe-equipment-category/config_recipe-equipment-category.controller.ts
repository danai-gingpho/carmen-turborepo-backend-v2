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
import { Config_RecipeEquipmentCategoryService } from './config_recipe-equipment-category.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecipeEquipmentCategoryCreateRequest, RecipeEquipmentCategoryUpdateRequest } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BaseHttpController, EnrichAuditUsers, Serialize } from '@/common';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ApiUserFilterQueries, ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  RecipeEquipmentCategoryCreateDto, RecipeEquipmentCategoryUpdateDto,
  RecipeEquipmentCategoryResponseSchema, IUpdateRecipeEquipmentCategory,
} from './dto/recipe-equipment-category.dto';

@Controller('api/config/:bu_code/recipe-equipment-category')
@ApiTags('Config: Recipes')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_RecipeEquipmentCategoryController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(Config_RecipeEquipmentCategoryController.name);

  constructor(private readonly recipeEquipmentCategoryService: Config_RecipeEquipmentCategoryService) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('recipe-equipment-category.findOne'))
  @Serialize(RecipeEquipmentCategoryResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a recipe equipment category by ID', operationId: 'configRecipeEquipmentCategory_findOne', 'x-description-th': 'ดึงข้อมูลหมวดหมู่อุปกรณ์ทำอาหารเดียวตาม ID' } as any)
  async findOne(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, Config_RecipeEquipmentCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeEquipmentCategoryService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('recipe-equipment-category.findAll'))
  @Serialize(RecipeEquipmentCategoryResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all recipe equipment categories', operationId: 'configRecipeEquipmentCategory_findAll', 'x-description-th': 'ดึงรายการหมวดหมู่อุปกรณ์ทำอาหารทั้งหมด' } as any)
  @ApiUserFilterQueries()
  async findAll(@Req() req: Request, @Res() res: Response, @Param('bu_code') bu_code: string, @Query() query?: IPaginateQuery, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version }, Config_RecipeEquipmentCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.recipeEquipmentCategoryService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('recipe-equipment-category.create'))
  @Serialize(RecipeEquipmentCategoryResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new recipe equipment category', operationId: 'configRecipeEquipmentCategory_create', 'x-description-th': 'สร้างหมวดหมู่อุปกรณ์ทำอาหารใหม่' } as any)
  @ApiBody({ type: RecipeEquipmentCategoryCreateRequest })
  async create(@Req() req: Request, @Res() res: Response, @Param('bu_code') bu_code: string, @Body() createDto: RecipeEquipmentCategoryCreateDto, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, Config_RecipeEquipmentCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeEquipmentCategoryService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('recipe-equipment-category.update'))
  @Serialize(RecipeEquipmentCategoryResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a recipe equipment category', operationId: 'configRecipeEquipmentCategory_update', 'x-description-th': 'อัปเดตหมวดหมู่อุปกรณ์ทำอาหารทั้งหมด' } as any)
  @ApiBody({ type: RecipeEquipmentCategoryUpdateRequest })
  async update(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Body() updateDto: RecipeEquipmentCategoryUpdateDto, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, Config_RecipeEquipmentCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateRecipeEquipmentCategory = { ...updateDto, id };
    const result = await this.recipeEquipmentCategoryService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('recipe-equipment-category.patch'))
  @Serialize(RecipeEquipmentCategoryResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Patch a recipe equipment category', operationId: 'configRecipeEquipmentCategory_patch', 'x-description-th': 'อัปเดตบางฟิลด์ของหมวดหมู่อุปกรณ์ทำอาหาร' } as any)
  @ApiBody({ type: RecipeEquipmentCategoryUpdateRequest })
  async patch(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Body() updateDto: RecipeEquipmentCategoryUpdateDto, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'patch', id, updateDto, version }, Config_RecipeEquipmentCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateRecipeEquipmentCategory = { ...updateDto, id };
    const result = await this.recipeEquipmentCategoryService.patch(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('recipe-equipment-category.delete'))
  @Serialize(RecipeEquipmentCategoryResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a recipe equipment category', operationId: 'configRecipeEquipmentCategory_delete', 'x-description-th': 'ลบหมวดหมู่อุปกรณ์ทำอาหารออกจากระบบ' } as any)
  async delete(@Req() req: Request, @Res() res: Response, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Param('bu_code') bu_code: string, @Query('version') version: string = 'latest'): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, Config_RecipeEquipmentCategoryController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.recipeEquipmentCategoryService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
