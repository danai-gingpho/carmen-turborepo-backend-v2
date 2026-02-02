import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ConsoleLogger,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_LocationsService } from './config_locations.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  IUpdateLocation,
  LocationCreateDto,
  LocationUpdateDto,
  Serialize,
  ZodSerializerInterceptor,
  LocationDetailResponseSchema,
  LocationListItemResponseSchema,
  LocationMutationResponseSchema,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginate, IPaginateQuery, PaginateDto } from 'src/shared-dto/paginate.dto';
// import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/locations')
@ApiTags('Config - Locations')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
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

  @Get(':id')
  @UseGuards(new AppIdGuard('location.findOne'))
  @Serialize(LocationDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a location by ID',
    description: 'Get a location by ID',
    operationId: 'findOneLocation',
    tags: ['config-locations', '[Method] Get - Config'],
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
  })
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
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

  @Get()
  @UseGuards(new AppIdGuard('location.findAll'))
  @Serialize(LocationListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all locations',
    description: 'Get all locations',
    operationId: 'findAllLocations',
    tags: ['config-locations', '[Method] Get - Config'],
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
  })
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

  @Post()
  @UseGuards(new AppIdGuard('location.create'))
  @Serialize(LocationMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new location',
    description: 'Create a new location',
    operationId: 'createLocation',
    tags: ['config-locations', '[Method] Post - Config'],
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
  })
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

  @Patch(':id')
  @UseGuards(new AppIdGuard('location.update'))
  @Serialize(LocationMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a location',
    description: 'Update a location',
    operationId: 'updateLocation',
    tags: ['config-locations', '[Method] Patch - Config'],
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
  })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
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

  @Delete(':id')
  @UseGuards(new AppIdGuard('location.delete'))
  @Serialize(LocationMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a location',
    description: 'Delete a location',
    operationId: 'deleteLocation',
    tags: ['config-locations', '[Method] Delete - Config'],
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
  })
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
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
