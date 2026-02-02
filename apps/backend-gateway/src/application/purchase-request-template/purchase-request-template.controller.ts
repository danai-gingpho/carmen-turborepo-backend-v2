import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { PurchaseRequestTemplateService } from './purchase-request-template.service';
import { CreatePurchaseRequestTemplateDto } from './dto/purchase-requesr-template.dto';
import { UpdatePurchaseRequestTemplateDto } from './dto/update-purchase-request-template.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

import {
  BaseHttpController,
  ZodSerializerInterceptor,
} from '@/common';

@Controller('api/:bu_code/purchase-request-template')
@ApiTags('Application - Purchase Request Template')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class PurchaseRequestTemplateController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestTemplateController.name,
  );

  constructor(
    private readonly purchaseRequestTemplateService: PurchaseRequestTemplateService,
  ) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('purchaseRequestTemplate.findAll'))
  @HttpCode(HttpStatus.OK)
  async getPurchaseRequestTemplate(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getPurchaseRequestTemplate',
        query,
        version,
      },
      PurchaseRequestTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);

    const result = await this.purchaseRequestTemplateService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('purchaseRequestTemplate.findOne'))
  @HttpCode(HttpStatus.OK)
  async getPurchaseRequestTemplateById(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getPurchaseRequestTemplateById',
        id,
        version,
      },
      PurchaseRequestTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    const result = await this.purchaseRequestTemplateService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('purchaseRequestTemplate.create'))
  @HttpCode(HttpStatus.CREATED)
  async createPurchaseRequestTemplate(
    @Body() createPurchaseRequestTemplateDto: CreatePurchaseRequestTemplateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'createPurchaseRequestTemplate',
        createPurchaseRequestTemplateDto,
        version,
      },
      PurchaseRequestTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestTemplateService.create(
      createPurchaseRequestTemplateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('purchaseRequestTemplate.update'))
  @HttpCode(HttpStatus.OK)
  async updatePurchaseRequestTemplate(
    @Param('bu_code') bu_code: string,
    @Body() updatePurchaseRequestTemplateDto: UpdatePurchaseRequestTemplateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updatePurchaseRequestTemplate',
        updatePurchaseRequestTemplateDto,
        version,
      },
      PurchaseRequestTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestTemplateService.update(
      id,
      updatePurchaseRequestTemplateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('purchaseRequestTemplate.delete'))
  @HttpCode(HttpStatus.OK)
  async deletePurchaseRequestTemplate(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deletePurchaseRequestTemplate',
        id,
        version,
      },
      PurchaseRequestTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestTemplateService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
