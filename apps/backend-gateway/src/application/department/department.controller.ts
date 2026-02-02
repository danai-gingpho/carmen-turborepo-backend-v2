import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { DepartmentService } from './department.service';
import {
  BaseHttpController,
  Serialize,
  ZodSerializerInterceptor,
  DepartmentDetailResponseSchema,
  DepartmentListItemResponseSchema,
} from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/:bu_code/department')
@ApiTags('Application - Department')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class DepartmentController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    DepartmentController.name,
  );

  constructor(private readonly departmentService: DepartmentService) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('department.findAll'))
  @Serialize(DepartmentListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all departments',
    description: 'Get all departments',
  })
  @HttpCode(HttpStatus.OK)
  async getDepartments(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getDepartments',
        query,
        version,
      },
      DepartmentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);

    const result = await this.departmentService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('department.findOne'))
  @Serialize(DepartmentDetailResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a department by id',
    description: 'Get a department by id',
  })
  @HttpCode(HttpStatus.OK)
  async getDepartment(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getDepartment',
        id,
        version,
      },
      DepartmentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.departmentService.getDepartment(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
