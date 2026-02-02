import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Platform_UserClusterService } from './platform_user-cluster.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  IUserClusterUpdate,
  UserClusterDto,
  UserClusterUpdateDto,
} from './dto/user-cluster.dto';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController } from '@/common';

@Controller('api-system/user/cluster')
@ApiTags('Platform - User Cluster')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Platform_UserClusterController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_UserClusterController.name,
  );

  constructor(
    private readonly platform_userClusterService: Platform_UserClusterService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('userCluster.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async getUserCluster(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getUserCluster',
        id,
        version,
      },
      Platform_UserClusterController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_userClusterService.getUserCluster(
      id,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('userCluster.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async getUserClusterAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getUserClusterAll',
        query,
        version,
      },
      Platform_UserClusterController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.platform_userClusterService.getUserClusterAll(
      user_id,
      tenant_id,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('userCluster.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async CreateUserCluster(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: UserClusterDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'CreateUserCluster',
        body,
        version,
      },
      Platform_UserClusterController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_userClusterService.createUserCluster(
      body,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('userCluster.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async UpdateUserCluster(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UserClusterUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'UpdateUserCluster',
        id,
        body,
        version,
      },
      Platform_UserClusterController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const data: IUserClusterUpdate = {
      ...body,
      id,
    };
    const result = await this.platform_userClusterService.updateUserCluster(
      data,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('userCluster.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async DeleteUserCluster(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'DeleteUserCluster',
        id,
        version,
      },
      Platform_UserClusterController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_userClusterService.deleteUserCluster(
      id,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }
}
