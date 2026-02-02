import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Query,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_CreditTermService } from './config_credit_term.service';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  CreditTermCreateDto,
  CreditTermUpdateDto,
  IUpdateCreditTerm,
  Serialize,
  ZodSerializerInterceptor,
  CreditTermDetailResponseSchema,
  CreditTermListItemResponseSchema,
  CreditTermMutationResponseSchema,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@ApiTags('Config - Credit Term')
@ApiHeaderRequiredXAppId()
@Controller('api/config/:bu_code/credit-term')
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_CreditTermController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_CreditTermController.name,
  );

  constructor(
    private readonly configCreditTermService: Config_CreditTermService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('creditTerm.findOne'))
  @Serialize(CreditTermDetailResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  // @ApiOperation({
  //   summary: 'Get a credit term by ID',
  //   description: 'Retrieve a credit term by its unique identifier',
  //   operationId: 'findOneCreditTerm',
  //   tags: ['config-credit-term', '[Method] Get - Config'],
  //   deprecated: false,
  //   security: [
  //     {
  //       bearerAuth: [],
  //     },
  //   ],
  //   parameters: [
  //     {
  //       name: 'id',
  //       in: 'path',
  //       required: true,
  //     },
  //   ],
  //   responses: {
  //     200: {
  //       description: 'Credit term retrieved successfully',
  //     },
  //     404: {
  //       description: 'Credit term not found',
  //     },
  //   },
  // })
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configCreditTermService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('creditTerm.findAll'))
  @Serialize(CreditTermListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  // @ApiOperation({
  //   summary: 'Get all credit terms',
  //   description: 'Retrieve all credit terms',
  //   operationId: 'findAllCreditTerms',
  //   tags: ['config-credit-term', '[Method] Get - Config'],
  //   deprecated: false,
  //   security: [
  //     {
  //       bearerAuth: [],
  //     },
  //   ],
  //   parameters: [
  //     {
  //       name: 'version',
  //       in: 'query',
  //       required: false,
  //     },
  //   ],
  //   responses: {
  //     200: {
  //       description: 'Credit terms retrieved successfully',
  //     },
  //   },
  // })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.configCreditTermService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('creditTerm.create'))
  @Serialize(CreditTermMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  // @ApiOperation({
  //   summary: 'Create a new credit term',
  //   description: 'Create a new credit term',
  //   operationId: 'createCreditTerm',
  //   tags: ['config-credit-term', '[Method] Post - Config'],
  //   deprecated: false,
  //   security: [
  //     {
  //       bearerAuth: [],
  //     },
  //   ],
  //   parameters: [
  //     {
  //       name: 'version',
  //       in: 'query',
  //       required: false,
  //     },
  //   ],
  //   responses: {
  //     201: {
  //       description: 'Credit term created successfully',
  //     },
  //   },
  // })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: CreditTermCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configCreditTermService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('creditTerm.update'))
  @Serialize(CreditTermMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  // @ApiOperation({
  //   summary: 'Update a credit term',
  //   description: 'Update a credit term',
  //   operationId: 'updateCreditTerm',
  //   tags: ['config-credit-term', '[Method] Patch - Config'],
  //   deprecated: false,
  //   security: [
  //     {
  //       bearerAuth: [],
  //     },
  //   ],
  //   parameters: [
  //     {
  //       name: 'id',
  //       in: 'path',
  //       required: true,
  //     },
  //   ],
  //   responses: {
  //     200: {
  //       description: 'Credit term updated successfully',
  //     },
  //     404: {
  //       description: 'Credit term not found',
  //     },
  //   },
  // })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: CreditTermUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateCreditTerm = {
      ...updateDto,
      id,
    };
    const result = await this.configCreditTermService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('creditTerm.delete'))
  @Serialize(CreditTermMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  // @ApiOperation({
  //   summary: 'Delete a credit term',
  //   description: 'Delete a credit term',
  //   operationId: 'deleteCreditTerm',
  //   tags: ['config-credit-term', '[Method] Delete - Config'],
  //   deprecated: false,
  //   security: [
  //     {
  //       bearerAuth: [],
  //     },
  //   ],
  //   parameters: [
  //     {
  //       name: 'id',
  //       in: 'path',
  //       required: true,
  //     },
  //   ],
  //   responses: {
  //     200: {
  //       description: 'Credit term deleted successfully',
  //     },
  //     404: {
  //       description: 'Credit term not found',
  //     },
  //   },
  // })
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configCreditTermService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
