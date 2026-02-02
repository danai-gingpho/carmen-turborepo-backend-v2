import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentManagementService } from './document-management.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  Result,
  ErrorCode,
  ZodSerializerInterceptor,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/:bu_code/documents')
@ApiTags('Application - Document Management')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class DocumentManagementController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    DocumentManagementController.name,
  );

  constructor(
    private readonly documentManagementService: DocumentManagementService,
  ) {
    super();
  }

  @Post('upload')
  @UseGuards(new AppIdGuard('documents.upload'))
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload a document',
    description: 'Uploads a document file to storage',
    operationId: 'uploadDocument',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'uploadDocument',
        fileName: file?.originalname,
        bu_code,
      },
      DocumentManagementController.name,
    );

    if (!file) {
      const result = Result.error('No file provided', ErrorCode.INVALID_ARGUMENT);
      this.respond(res, result);
      return;
    }

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.documentManagementService.uploadDocument(
      file.buffer,
      file.originalname,
      file.mimetype,
      user_id,
      bu_code,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Get()
  @UseGuards(new AppIdGuard('documents.list'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List documents',
    description: 'Retrieves a paginated list of documents',
    operationId: 'listDocuments',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perpage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'searchfields', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, type: String })
  async listDocuments(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'listDocuments',
        bu_code,
        query,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.documentManagementService.listDocuments(
      bu_code,
      user_id,
      paginate,
    );
    this.respond(res, result);
  }

  @Get(':filetoken')
  @UseGuards(new AppIdGuard('documents.get'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get document by token',
    description: 'Retrieves a document by its file token',
    operationId: 'getDocument',
  })
  async getDocument(
    @Param('filetoken') fileToken: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getDocument',
        fileToken,
        bu_code,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.documentManagementService.getDocument(fileToken, user_id, bu_code);
    this.respond(res, result);
  }

  @Get(':filetoken/info')
  @UseGuards(new AppIdGuard('documents.info'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get document info',
    description: 'Retrieves metadata for a document by its file token',
    operationId: 'getDocumentInfo',
  })
  async getDocumentInfo(
    @Param('filetoken') fileToken: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getDocumentInfo',
        fileToken,
        bu_code,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.documentManagementService.getDocumentInfo(
      fileToken,
      user_id,
      bu_code,
    );
    this.respond(res, result);
  }

  @Get(':filetoken/presigned-url')
  @UseGuards(new AppIdGuard('documents.presignedUrl'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get presigned URL',
    description: 'Generates a presigned URL for document access',
    operationId: 'getPresignedUrl',
  })
  @ApiQuery({ name: 'expirySeconds', required: false, type: Number })
  async getPresignedUrl(
    @Param('filetoken') fileToken: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('expirySeconds') expirySeconds?: string,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getPresignedUrl',
        fileToken,
        bu_code,
        expirySeconds,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const expiry = expirySeconds ? parseInt(expirySeconds) : undefined;
    const result = await this.documentManagementService.getPresignedUrl(
      fileToken,
      user_id,
      bu_code,
      expiry,
    );
    this.respond(res, result);
  }

  @Delete(':filetoken')
  @UseGuards(new AppIdGuard('documents.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Deletes a document by its file token',
    operationId: 'deleteDocument',
  })
  async deleteDocument(
    @Param('filetoken') fileToken: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deleteDocument',
        fileToken,
        bu_code,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.documentManagementService.deleteDocument(
      fileToken,
      user_id,
      bu_code,
    );
    this.respond(res, result);
  }
}
