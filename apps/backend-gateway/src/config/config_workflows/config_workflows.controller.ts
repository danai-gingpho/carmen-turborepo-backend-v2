import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  ConsoleLogger,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_WorkflowsService } from './config_workflows.service';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  IUpdateWorkflow,
  WorkflowCreateDto,
  WorkflowUpdateDto,
  Serialize,
  ZodSerializerInterceptor,
  WorkflowDetailResponseSchema,
  WorkflowListItemResponseSchema,
  WorkflowMutationResponseSchema,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/workflows')
@ApiTags('Config - Workflows')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_WorkflowsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_WorkflowsController.name,
  );
  constructor(
    private readonly config_workflowsService: Config_WorkflowsService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('workflow.findOne'))
  @Serialize(WorkflowDetailResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
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
      Config_WorkflowsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_workflowsService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('workflow.findAll'))
  @Serialize(WorkflowListItemResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  async findAll(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_WorkflowsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_workflowsService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('workflow.create'))
  @Serialize(WorkflowMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() createDto: WorkflowCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_WorkflowsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_workflowsService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('workflow.update'))
  @Serialize(WorkflowMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateDto: WorkflowUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_WorkflowsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateWorkflow = {
      ...updateDto,
      id,
    };
    const result = await this.config_workflowsService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('workflow.delete'))
  @Serialize(WorkflowMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
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
      Config_WorkflowsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_workflowsService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
