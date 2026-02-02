import {
  ConsoleLogger,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { CreditTermService } from './credit-term.service';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  CreditTermDetailResponseSchema,
  CreditTermListItemResponseSchema,
} from '@/common';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/:bu_code/credit-term')
@ApiTags('Application - Credit Term')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class CreditTermController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditTermController.name,
  );
  constructor(private readonly creditTermService: CreditTermService) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('creditTerm.findAll'))
  @Serialize(CreditTermListItemResponseSchema)
  @ApiOperation({
    summary: 'Get all credit terms',
    description: 'Get all credit terms',
    tags: ['[Method] Get'],
  })
  @ApiUserFilterQueries()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditTermService.findAll(user_id, bu_code, query, version);
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('creditTerm.findOne'))
  @Serialize(CreditTermDetailResponseSchema)
  @ApiOperation({
    summary: 'Get a credit term by id',
    description: 'Get a credit term by id',
    tags: ['[Method] Get'],
  })
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditTermService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
