import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UsePipes,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
  Query,
  ConsoleLogger,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { CreditNoteService } from './credit-note.service';
import {
  ApiHeader,
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiResponseProperty,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  CreditNoteDetailResponseSchema,
  CreditNoteListItemResponseSchema,
  CreditNoteMutationResponseSchema,
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
import { CreateCreditNoteDto, UpdateCreditNoteDto } from '@/common';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/:bu_code/credit-note')
@ApiTags('Application - Credit Note')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class CreditNoteController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteController.name,
  );

  constructor(private readonly creditNoteService: CreditNoteService) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('creditNote.findOne'))
  @Serialize(CreditNoteDetailResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      CreditNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('creditNote.findAll'))
  @Serialize(CreditNoteListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {

    console.log('this is header:', req.headers);
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      CreditNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.creditNoteService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('creditNote.create'))
  @Serialize(CreditNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateCreditNoteDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      CreditNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('creditNote.update'))
  @Serialize(CreditNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCreditNoteDto,
    @Param('bu_code') bu_code: string,
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
      CreditNoteController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: UpdateCreditNoteDto = {
      ...updateDto,
      id,
    };
    const result = await this.creditNoteService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('creditNote.delete'))
  @Serialize(CreditNoteMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async delete(
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
      'delete',
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
