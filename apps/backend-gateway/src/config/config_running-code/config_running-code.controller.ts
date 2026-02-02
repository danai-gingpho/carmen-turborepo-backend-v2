import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  ConsoleLogger,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_RunningCodeService } from './config_running-code.service';
import { ZodSerializerInterceptor, BaseHttpController } from '@/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import {
  IRunningCodeUpdate,
  RunningCodeCreateDto,
  RunningCodeUpdateDto,
} from './dto/config_running-code.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/running-code')
@ApiTags('Config - Running Code')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_RunningCodeController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_RunningCodeController.name,
  );

  constructor(
    private readonly config_runningCodeService: Config_RunningCodeService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('runningCode.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_runningCodeService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get('result/:type')
  @UseGuards(new AppIdGuard('runningCode.findByType'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async findByType(
    @Param('type') type: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findByType',
        type,
        version,
      },
      Config_RunningCodeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_runningCodeService.findByType(
      type,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('runningCode.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
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
      Config_RunningCodeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_runningCodeService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('runningCode.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() createDto: RunningCodeCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_RunningCodeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_runningCodeService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('runningCode.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: RunningCodeUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_RunningCodeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IRunningCodeUpdate = {
      ...updateDto,
      id,
    };
    const result = await this.config_runningCodeService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('runningCode.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async remove(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_RunningCodeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_runningCodeService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
