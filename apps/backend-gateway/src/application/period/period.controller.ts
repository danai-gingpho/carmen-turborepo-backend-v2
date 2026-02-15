import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  UseGuards,
  Req,
  Res,
  Query,
  HttpStatus,
  HttpCode,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { PeriodService } from './period.service';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { BaseHttpController } from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api')
@ApiTags('Application - Period')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class PeriodController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PeriodController.name,
  );

  constructor(
    private readonly periodService: PeriodService,
  ) {
    super();
  }

  @Get(':bu_code/period/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('period.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findOne', id, version },
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.periodService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get(':bu_code/period/')
  @UseGuards(new AppIdGuard('period.findAll'))
  @UseGuards(TenantHeaderGuard)
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
      { function: 'findAll', query, version },
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.periodService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  @Post(':bu_code/period')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('period.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Body() createDto: any,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'create', createDto, version },
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.periodService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':bu_code/period/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('period.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: any,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'update', id, updateDto, version },
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.periodService.update(id, updateDto, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':bu_code/period/:id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('period.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async delete(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'delete', id, version },
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.periodService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
