import {
  Controller,
  HttpStatus,
  Get,
  Post,
  HttpCode,
  Query,
  Req,
  Res,
  UseGuards,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { CreditNoteReasonService } from './credit-note-reason.service';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('api/:bu_code/credit-note-reason')
@ApiTags('Application - Credit Note Reason')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
@Controller('api/:bu_code/credit-note-reason')
export class CreditNoteReasonController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteReasonController.name,
  );

  constructor(
    private readonly creditNoteReasonService: CreditNoteReasonService,
  ) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('creditNoteReason.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
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
      CreditNoteReasonController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.creditNoteReasonService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }
}
