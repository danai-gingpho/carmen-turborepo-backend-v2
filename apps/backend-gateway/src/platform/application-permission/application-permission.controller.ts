import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApplicationPermissionService } from './application-permission.service';
import {
  CreateApplicationPermissionDto,
  UpdateApplicationPermissionDto,
} from './dto/application-permission.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController } from '@/common';

@Controller('api-system/permission')
@ApiTags('Application - Permission')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class ApplicationPermissionController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationPermissionController.name,
  );

  constructor(
    private readonly applicationPermissionService: ApplicationPermissionService,
  ) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('application-permission.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all application permissions',
    description: 'Retrieve all application permissions from micro_auth',
    operationId: 'getAllApplicationPermissions',
    tags: ['[Method] Get'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Application permissions retrieved successfully',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  })
  async findAll(
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      ApplicationPermissionController.name,
    );

    const result = await this.applicationPermissionService.findAll(version);
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('application-permission.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application permission ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Get application permission by ID',
    description: 'Retrieve a specific application permission by ID from micro_auth',
    operationId: 'getApplicationPermissionById',
    tags: ['[Method] Get'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Application permission ID',
      },
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Application permission retrieved successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application permission not found',
      },
    },
  })
  async findOne(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      ApplicationPermissionController.name,
    );

    const result = await this.applicationPermissionService.findOne(id, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('application-permission.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiBody({
    type: CreateApplicationPermissionDto,
    description: 'Create application permission data',
  })
  @ApiOperation({
    summary: 'Create new application permission',
    description: 'Create a new application permission in micro_auth',
    operationId: 'createApplicationPermission',
    tags: ['[Method] Post'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      201: {
        description: 'Application permission created successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  })
  async create(
    @Res() res: Response,
    @Body() createApplicationPermissionDto: CreateApplicationPermissionDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createApplicationPermissionDto,
        version,
      },
      ApplicationPermissionController.name,
    );

    const result = await this.applicationPermissionService.create(
      createApplicationPermissionDto,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('application-permission.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application permission ID',
    type: 'string',
  })
  @ApiBody({
    type: UpdateApplicationPermissionDto,
    description: 'Update application permission data',
  })
  @ApiOperation({
    summary: 'Update application permission',
    description: 'Update an existing application permission in micro_auth',
    operationId: 'updateApplicationPermission',
    tags: ['[Method] Put'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Application permission ID',
      },
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Application permission updated successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application permission not found',
      },
    },
  })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateApplicationPermissionDto: UpdateApplicationPermissionDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateApplicationPermissionDto,
        version,
      },
      ApplicationPermissionController.name,
    );

    const result = await this.applicationPermissionService.update(
      id,
      updateApplicationPermissionDto,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('application-permission.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application permission ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Delete application permission',
    description: 'Delete an application permission from micro_auth',
    operationId: 'deleteApplicationPermission',
    tags: ['[Method] Delete'],
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Application permission ID',
      },
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Application permission deleted successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application permission not found',
      },
    },
  })
  async delete(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      ApplicationPermissionController.name,
    );

    const result = await this.applicationPermissionService.delete(id, version);
    this.respond(res, result);
  }
}
