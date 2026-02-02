import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ConsoleLogger,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { Platform_BusinessUnitService as Platform_BusinessUnitService } from './platform_business-unit.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BusinessUnitConfigDto,
  BusinessUnitCreateDto,
  BusinessUnitUpdateDto,
} from './dto/business-unit.dto';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController } from '@/common';

@Controller('api-system/business-unit')
@ApiTags('Platform - Business Unit')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Platform_BusinessUnitController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_BusinessUnitController.name,
  );
  constructor(
    private readonly platform_businessUnitService: Platform_BusinessUnitService,
  ) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('businessUnit.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  async getBusinessUnitList(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getBusinessUnitList',
        query,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.platform_businessUnitService.getBusinessUnitList(
      user_id,
      tenant_id,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('businessUnit.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async getBusinessUnitById(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getBusinessUnitById',
        id,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.getBusinessUnitById(
      id,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('businessUnit.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async createBusinessUnit(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createBusinessUnitDto: BusinessUnitCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'createBusinessUnit',
        createBusinessUnitDto,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.createBusinessUnit(
      createBusinessUnitDto,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('businessUnit.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async updateBusinessUnit(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateBusinessUnitDto: BusinessUnitUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updateBusinessUnit',
        id,
        updateBusinessUnitDto,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    updateBusinessUnitDto.id = id;
    const result = await this.platform_businessUnitService.updateBusinessUnit(
      updateBusinessUnitDto,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('businessUnit.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async deleteBusinessUnit(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deleteBusinessUnit',
        id,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.deleteBusinessUnit(
      id,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/system-configs')
  @UseGuards(new AppIdGuard('businessUnit.getSystemConfigs'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async getBusinessUnitSystemConfigs(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getBusinessUnitSystemConfigs',
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.getBusinessUnitSystemConfigs(
      bu_code,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/configs')
  @UseGuards(new AppIdGuard('businessUnit.getConfigs'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async getBusinessUnitConfigs(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getBusinessUnitConfigs',
        bu_code,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.getBusinessUnitConfigs(
      bu_code,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':bu_code/configs')
  @UseGuards(new AppIdGuard('businessUnit.patchConfigs'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async patchBusinessUnitConfigs(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() patchBusinessUnitConfigsDto: BusinessUnitConfigDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'patchBusinessUnitConfigs',
        bu_code,
        patchBusinessUnitConfigsDto,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.patchBusinessUnitConfigs(
      bu_code,
      patchBusinessUnitConfigsDto,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Put(':bu_code/configs')
  @UseGuards(new AppIdGuard('businessUnit.putConfigs'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async putBusinessUnitConfigs(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() putBusinessUnitConfigsDto: BusinessUnitConfigDto[],
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'putBusinessUnitConfigs',
        bu_code,
        putBusinessUnitConfigsDto,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.putBusinessUnitConfigs(
      bu_code,
      putBusinessUnitConfigsDto,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/configs/:key')
  @UseGuards(new AppIdGuard('businessUnit.getConfigByKey'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async getBusinessUnitConfigByKey(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('key') key: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getBusinessUnitConfigByKey',
        bu_code,
        key,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.getBusinessUnitConfigByKey(
      bu_code,
      key,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':bu_code/configs/:key')
  @UseGuards(new AppIdGuard('businessUnit.deleteConfigByKey'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async deleteBusinessUnitConfigByKey(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('key') key: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deleteBusinessUnitConfigByKey',
        bu_code,
        key,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.deleteBusinessUnitConfigByKey(
      bu_code,
      key,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Get(':bu_code/configs/:key/exists')
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async getBusinessUnitConfigByKeyExists(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('key') key: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getBusinessUnitConfigByKeyExists',
        bu_code,
        key,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.getBusinessUnitConfigByKeyExists(
      bu_code,
      key,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }
}
