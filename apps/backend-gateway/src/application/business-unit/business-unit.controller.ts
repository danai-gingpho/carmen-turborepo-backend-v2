import { Controller, Get, HttpCode, HttpStatus, Param, Query, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { BusinessUnitService } from './business-unit.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { ApiTags } from '@nestjs/swagger';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  BusinessUnitDetailResponseSchema,
  BusinessUnitListItemResponseSchema,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { response_getConfigByKey } from './swagger/response';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('/api/:bu_code/business-unit')
@ApiTags('Application - business unit')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class BusinessUnitController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    BusinessUnitController.name,
  );

  constructor(private readonly businessUnitService: BusinessUnitService) {
    super();
  }

  @Get('/system-configs')
  @UseGuards(new AppIdGuard('businessUnit.getSystemConfigs'))
  @Serialize(BusinessUnitListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiResponse(response_getConfigByKey['200'])
  @ApiResponse(response_getConfigByKey['400'])
  @ApiTags('[Method] Get System Configs')
  @ApiOperation({
    summary: 'Get system configs',
    description: 'Get system configs',
  })
  async getSystemConfigs(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.businessUnitService.getSystemConfigs(user_id, bu_code);
    this.respond(res, result);
  }

  @Get('/configs/:key')
  @UseGuards(new AppIdGuard('businessUnit.getConfigByKey'))
  @Serialize(BusinessUnitDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiResponse(response_getConfigByKey['200'])
  @ApiResponse(response_getConfigByKey['400'])
  @ApiTags('[Method] Get')
  @ApiOperation({
    summary: 'Find current config by key',
    description: 'Find current config by key',
    parameters: [
      {
        name: 'key',
        description: 'The key of the config',
        required: true,
        in: 'path',
      },
    ],
  })
  async findConfigByKey(
    @Param('key') key: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findConfigByKey',
        key: key,
        version: version,
      },
      BusinessUnitController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.businessUnitService.findCurrentConfigByKey(
      key,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
