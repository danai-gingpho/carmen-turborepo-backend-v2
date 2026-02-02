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
import { ApplicationRoleService } from './application-role.service';
import {
  CreateApplicationRoleDto,
  UpdateApplicationRoleDto,
} from './dto/application-role.dto';
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

@Controller('api-system/role')
@ApiTags('Application - Role')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class ApplicationRoleController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationRoleController.name,
  );

  constructor(
    private readonly applicationRoleService: ApplicationRoleService,
  ) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('application-role.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all application roles',
    description: 'Retrieve all application roles from micro_auth',
    operationId: 'getAllApplicationRoles',
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
        description: 'Application roles retrieved successfully',
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
      ApplicationRoleController.name,
    );

    const result = await this.applicationRoleService.findAll(version);
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('application-role.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application role ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Get application role by ID',
    description: 'Retrieve a specific application role by ID from micro_auth',
    operationId: 'getApplicationRoleById',
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
        description: 'Application role ID',
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
        description: 'Application role retrieved successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application role not found',
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
      ApplicationRoleController.name,
    );

    const result = await this.applicationRoleService.findOne(id, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('application-role.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiBody({
    type: CreateApplicationRoleDto,
    description: 'Create application role data',
  })
  @ApiOperation({
    summary: 'Create new application role',
    description: 'Create a new application role in micro_auth',
    operationId: 'createApplicationRole',
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
        description: 'Application role created successfully',
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
    @Body() createApplicationRoleDto: CreateApplicationRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createApplicationRoleDto,
        version,
      },
      ApplicationRoleController.name,
    );

    const result = await this.applicationRoleService.create(
      createApplicationRoleDto,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('application-role.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application role ID',
    type: 'string',
  })
  @ApiBody({
    type: UpdateApplicationRoleDto,
    description: 'Update application role data',
  })
  @ApiOperation({
    summary: 'Update application role',
    description: 'Update an existing application role in micro_auth',
    operationId: 'updateApplicationRole',
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
        description: 'Application role ID',
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
        description: 'Application role updated successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application role not found',
      },
    },
  })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateApplicationRoleDto: UpdateApplicationRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateApplicationRoleDto,
        version,
      },
      ApplicationRoleController.name,
    );

    const result = await this.applicationRoleService.update(
      id,
      updateApplicationRoleDto,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('application-role.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application role ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Delete application role',
    description: 'Delete an application role from micro_auth',
    operationId: 'deleteApplicationRole',
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
        description: 'Application role ID',
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
        description: 'Application role deleted successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application role not found',
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
      ApplicationRoleController.name,
    );

    const result = await this.applicationRoleService.delete(id, version);
    this.respond(res, result);
  }
}
