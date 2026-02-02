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
import { TransferDetailService } from './transfer-detail.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  Serialize,
  TransferMutationResponseSchema,
} from '@/common';
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

@Controller('api/:bu_code/transfer-detail')
@ApiTags('Application - Transfer Detail')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class TransferDetailController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(TransferDetailController.name);

  constructor(private readonly transferDetailService: TransferDetailService) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('transferDetail.findAll'))
  @UseGuards(TenantHeaderGuard)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Transfer Details with pagination',
    description: 'Retrieves all transfer detail records with pagination and filtering',
    operationId: 'findAllTransferDetails',
    tags: ['[Method] Get'],
    responses: {
      200: { description: 'Transfer Details retrieved successfully' },
    },
  })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findAll', query, version }, TransferDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.transferDetailService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transferDetail.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a Transfer Detail by ID',
    description: 'Retrieves a single transfer detail record by its ID',
    operationId: 'findOneTransferDetail',
    tags: ['[Method] Get'],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Transfer Detail ID' },
    ],
    responses: {
      200: { description: 'Transfer Detail retrieved successfully' },
      404: { description: 'Transfer Detail not found' },
    },
  })
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'findOne', id, version }, TransferDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferDetailService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transferDetail.create'))
  @Serialize(TransferMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new Transfer Detail',
    description: 'Creates a new transfer detail record. Requires transfer_id in the body. Only works for Transfer in draft status.',
    operationId: 'createTransferDetail',
    tags: ['[Method] Post'],
    responses: {
      201: { description: 'Transfer Detail created successfully' },
      400: { description: 'Cannot add detail to non-draft Transfer' },
      404: { description: 'Transfer not found' },
    },
  })
  async create(
    @Body() createDto: any,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'create', createDto, version }, TransferDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferDetailService.create(createDto, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transferDetail.update'))
  @Serialize(TransferMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a Transfer Detail',
    description: 'Updates an existing transfer detail record. Only works for Transfer in draft status.',
    operationId: 'updateTransferDetail',
    tags: ['[Method] Patch'],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Transfer Detail ID' },
    ],
    responses: {
      200: { description: 'Transfer Detail updated successfully' },
      400: { description: 'Cannot update detail of non-draft Transfer' },
      404: { description: 'Transfer Detail not found' },
    },
  })
  async update(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: any,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'update', id, updateDto, version }, TransferDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferDetailService.update(id, updateDto, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(TenantHeaderGuard)
  @UseGuards(new AppIdGuard('transferDetail.delete'))
  @Serialize(TransferMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Transfer Detail',
    description: 'Soft deletes an existing transfer detail record. Only works for Transfer in draft status.',
    operationId: 'deleteTransferDetail',
    tags: ['[Method] Delete'],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Transfer Detail ID' },
    ],
    responses: {
      200: { description: 'Transfer Detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Transfer' },
      404: { description: 'Transfer Detail not found' },
    },
  })
  async delete(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug({ function: 'delete', id, version }, TransferDetailController.name);

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.transferDetailService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
