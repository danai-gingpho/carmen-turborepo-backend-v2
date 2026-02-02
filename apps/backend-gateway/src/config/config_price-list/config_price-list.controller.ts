import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  Res,
  UseGuards,
  ConsoleLogger,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Config_PriceListService } from './config_price-list.service';
import {
  PriceListCreateDto,
  PriceListUpdateDto,
  ZodSerializerInterceptor,
  BaseHttpController,
  Result,
  ErrorCode,
} from '@/common';
import {
  IPaginate,
  IPaginateQuery,
  PaginateQuery,
} from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/price-list')
@ApiTags('Config - Price List')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class Config_PriceListController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_PriceListController.name,
  );

  constructor(
    private readonly configPriceListService: Config_PriceListService,
  ) {
    super();
  }

  @Post('upload-excel')
  @UseGuards(new AppIdGuard('priceList.uploadExcel'))
  @HttpCode(HttpStatus.CREATED)
  async uploadExcel(
    @Body() createConfigPriceListDto: PriceListCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'uploadExcel',
        createConfigPriceListDto,
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    this.logger.log(
      `uploadExcel config-price-list ${createConfigPriceListDto} ${user_id} ${bu_code} ${version}`,
    );
    const result = await this.configPriceListService.uploadExcel(
      createConfigPriceListDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Get(':id/download-excel')
  @UseGuards(new AppIdGuard('priceList.downloadExcel'))
  @HttpCode(HttpStatus.OK)
  async downloadExcel(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'downloadExcel',
        id,
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    this.logger.log(
      `downloadExcel config-price-list ${id} ${user_id} ${bu_code} ${version}`,
    );
    const result = await this.configPriceListService.downloadExcel(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('priceList.create'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createConfigPriceListDto: PriceListCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        data: JSON.stringify(createConfigPriceListDto),
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configPriceListService.create(
      createConfigPriceListDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Get()
  @UseGuards(new AppIdGuard('priceList.findAll'))
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: IPaginateQuery,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query) as IPaginate;
    this.logger.log(
      `findAll config-price-list ${user_id} ${bu_code} ${paginate} ${version}`,
    );
    const result = await this.configPriceListService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('priceList.findOne'))
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
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    this.logger.log(
      `findOne config-price-list ${id} ${user_id} ${bu_code} ${version}`,
    );
    const result = await this.configPriceListService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('priceList.update'))
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateConfigPriceListDto: PriceListUpdateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateConfigPriceListDto,
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    this.logger.log(
      `update config-price-list ${id} ${user_id} ${bu_code} ${version}`,
    );
    const result = await this.configPriceListService.update(
      id,
      updateConfigPriceListDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('priceList.remove'))
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'remove',
        id,
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    this.logger.log(
      `remove config-price-list ${id} ${user_id} ${bu_code} ${version}`,
    );
    const result = await this.configPriceListService.remove(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  @Post('import-csv')
  @UseGuards(new AppIdGuard('priceList.importCsv'))
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Import price lists from CSV',
    description: 'Uploads a CSV file to import/upsert price lists with their details. Invalid rows are skipped and reported in the response.',
    operationId: 'importPriceListCsv',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing price list data',
        },
      },
      required: ['file'],
    },
  })
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'importCsv',
        fileName: file?.originalname,
        fileSize: file?.size,
        version,
      },
      Config_PriceListController.name,
    );

    if (!file) {
      const result = Result.error('No file provided', ErrorCode.INVALID_ARGUMENT);
      this.respond(res, result);
      return;
    }

    // Validate file type
    const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      const result = Result.error(
        `Invalid file type: ${file.mimetype}. Please upload a CSV file.`,
        ErrorCode.INVALID_ARGUMENT
      );
      this.respond(res, result);
      return;
    }

    const { user_id } = ExtractRequestHeader(req);
    const csvContent = file.buffer.toString('utf-8');

    this.logger.log(
      `importCsv config-price-list ${file.originalname} ${user_id} ${bu_code} ${version}`,
    );

    const result = await this.configPriceListService.importCsv(
      csvContent,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }
}
