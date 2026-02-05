import { Controller, Get, HttpCode, HttpStatus, Param, Query, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { WorkflowService } from './workflow.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { WorkflowTypeParamDto } from './dto/workflow.dto';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  Serialize,
  WorkflowDetailResponseSchema,
  WorkflowListItemResponseSchema,
} from '@/common';

@Controller('api/:bu_code/workflow')
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiTags('Application - Workflow')
@ApiHeaderRequiredXAppId()
@ApiBearerAuth()
export class WorkflowController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    WorkflowController.name,
  );

  constructor(private readonly workflowService: WorkflowService) {
    super();
  }

  @Get('/type/:type')
  @UseGuards(new AppIdGuard('workflow.findByType'))
  @Serialize(WorkflowDetailResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all workflow types' })
  async findByType(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param() workflowType: WorkflowTypeParamDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findByType',
        workflowType,
        version,
      },
      WorkflowController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.workflowService.findByType(
      workflowType.type,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get(':workflow_id/previous_stages')
  @UseGuards(KeycloakGuard, TenantHeaderGuard)
  @Serialize(WorkflowListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get previous stages of a workflow' })
  async getPreviousStages(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('workflow_id') workflow_id: string,
    @Query('stage') stage: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getPreviousStages',
        workflow_id,
        stage,
        version,
      },
      WorkflowController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.workflowService.getPreviousStages(
      workflow_id,
      stage,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
