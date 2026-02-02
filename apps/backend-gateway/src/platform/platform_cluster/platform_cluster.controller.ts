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
} from '@nestjs/common';
import { Response } from 'express';
import { Platform_ClusterService } from './platform_cluster.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClusterCreateDto, ClusterUpdateDto } from './dto/cluster.dto';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController } from '@/common';

@Controller('api-system/cluster')
@ApiTags('Platform - Cluster')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Platform_ClusterController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_ClusterController.name,
  );
  constructor(private readonly clusterService: Platform_ClusterService) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('cluster.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  async getListCluster(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getListCluster',
        query,
        version,
      },
      Platform_ClusterController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.clusterService.getlistCluster(
      user_id,
      tenant_id,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('cluster.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async getClusterById(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getClusterById',
        id,
        version,
      },
      Platform_ClusterController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.clusterService.getClusterById(id, user_id, tenant_id, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('cluster.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async createCluster(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createClusterDto: ClusterCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'createCluster',
        createClusterDto,
        version,
      },
      Platform_ClusterController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.clusterService.createCluster(
      createClusterDto,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('cluster.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async updateCluster(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateClusterDto: ClusterUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updateCluster',
        id,
        updateClusterDto,
        version,
      },
      Platform_ClusterController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    updateClusterDto.id = id;
    const result = await this.clusterService.updateCluster(
      updateClusterDto,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('cluster.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  async deleteCluster(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deleteCluster',
        id,
        version,
      },
      Platform_ClusterController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.clusterService.deleteCluster(id, user_id, tenant_id, version);
    this.respond(res, result);
  }
}
