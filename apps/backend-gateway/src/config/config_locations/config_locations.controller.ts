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
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_LocationsService } from './config_locations.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  IUpdateLocation,
  LocationCreateDto,
  LocationUpdateDto,
  Serialize,
  EnrichAuditUsers,
  LocationDetailResponseSchema,
  LocationListItemResponseSchema,
  LocationMutationResponseSchema,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginate, PaginateDto } from 'src/shared-dto/paginate.dto';
// import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { LocationCreateRequestDto, LocationUpdateRequestDto } from './swagger/request';

@Controller('api/config/:bu_code/locations')
@ApiTags('Config: Locations')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_LocationsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_LocationsController.name,
  );

  constructor(
    private readonly config_locationsService: Config_LocationsService,
  ) {
    super();
  }

  /**
   * Get a location by ID
   * ค้นหาสถานที่เดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Location ID / รหัสสถานที่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param withUser - Include assigned users / รวมผู้ใช้ที่ได้รับมอบหมาย
   * @param withProducts - Include stocked products / รวมสินค้าในสต็อก
   * @param version - API version / เวอร์ชัน API
   * @returns Location detail / รายละเอียดสถานที่
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('location.findOne'))
  @Serialize(LocationDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a location by ID',
    description: 'Retrieves details of a specific storage location, warehouse, or store within the property, including assigned users and stocked products. Locations are the physical points where inventory is tracked.',
    operationId: 'configLocations_findOne',
    deprecated: false,
    // security: [
    //   {
    //     bearerAuth: [],
    //   },
    // ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Location retrieved successfully',
      },
    },
    'x-description-th': 'ดึงข้อมูลสถานที่/คลังสินค้ารายการเดียวตาม ID',
  } as any)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('withUser') withUser: boolean = true,
    @Query('withProducts') withProducts: boolean = true,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
        withUser,
        withProducts,
      },
      Config_LocationsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_locationsService.findOne(
      id,
      user_id,
      bu_code,
      withUser,
      withProducts,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get all locations with pagination
   * ค้นหารายการสถานที่ทั้งหมดพร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of locations / รายการสถานที่พร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('location.findAll'))
  @Serialize(LocationListItemResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all locations',
    description: 'Returns all storage locations, warehouses, and stores configured for the business unit. These locations are used for inventory tracking, stock transfers, and goods receiving.',
    operationId: 'configLocations_findAll',
    deprecated: false,
    // security: [
    //   {
    //     bearerAuth: [],
    //   },
    // ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Locations retrieved successfully',
      },
    },
    'x-description-th': 'แสดงรายการสถานที่/คลังสินค้าทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: PaginateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_LocationsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const rawSearch = query.search;

    const paginate: IPaginate = {
      page: query.page,
      perpage: query.perpage,
      search: typeof rawSearch === 'string' ? rawSearch : '',
      searchfields: Array.isArray(query.searchfields) ? query.searchfields : [],
      sort: Array.isArray(query.sort) ? query.sort : [],
      filter:
        typeof query.filter === 'object' && !Array.isArray(query.filter)
          ? query.filter
          : {},
      advance: query.advance ?? null,
      bu_code: query.bu_code ?? [],
    };

    const result = await this.config_locationsService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new location
   * สร้างสถานที่ใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Location creation data / ข้อมูลสำหรับสร้างสถานที่
   * @param version - API version / เวอร์ชัน API
   * @returns Created location / สถานที่ที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('location.create'))
  @Serialize(LocationMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new location',
    description: 'Defines a new storage location, warehouse, or store within the property. Once created, products can be assigned to it and inventory movements (stock-in, stock-out, transfers) can be recorded.',
    operationId: 'configLocations_create',
    deprecated: false,
    // security: [
    //   {
    //     bearerAuth: [],
    //   },
    // ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      201: {
        description: 'Location created successfully',
      },
    },
    'x-description-th': 'สร้างสถานที่/คลังสินค้าใหม่',
  } as any)
  @ApiBody({ type: LocationCreateRequestDto })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: LocationCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_LocationsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_locationsService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a location
   * อัปเดตสถานที่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Location ID / รหัสสถานที่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Location update data / ข้อมูลสำหรับอัปเดตสถานที่
   * @param version - API version / เวอร์ชัน API
   * @returns Updated location / สถานที่ที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('location.update'))
  @Serialize(LocationMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a location',
    description: 'Modifies an existing storage location configuration, such as its name, type, or capacity settings. Changes affect how inventory is organized and tracked at this location.',
    operationId: 'configLocations_update',
    deprecated: false,
    // security: [
    //   {
    //     bearerAuth: [],
    //   },
    // ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Location updated successfully',
      },
    },
    'x-description-th': 'อัปเดตข้อมูลสถานที่/คลังสินค้าที่มีอยู่',
  } as any)
  @ApiBody({ type: LocationUpdateRequestDto })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: LocationUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_LocationsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateLocation = {
      ...updateDto,
      id,
    };
    const result = await this.config_locationsService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a location
   * ลบสถานที่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Location ID / รหัสสถานที่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('location.delete'))
  @Serialize(LocationMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a location',
    description: 'Removes a storage location from active use. The location will no longer accept new inventory transactions, but historical stock movement records at this location are preserved.',
    operationId: 'configLocations_delete',
    deprecated: false,
    // security: [
    //   {
    //     bearerAuth: [],
    //   },
    // ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Location deleted successfully',
      },
    },
    'x-description-th': 'ลบสถานที่/คลังสินค้าตาม ID',
  } as any)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_LocationsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_locationsService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
