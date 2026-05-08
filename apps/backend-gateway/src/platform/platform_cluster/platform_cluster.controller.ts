import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Platform_ClusterService } from './platform_cluster.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
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
import { BaseHttpController, EnrichAuditUsers } from '@/common';

@Controller('api-system/cluster')
@ApiTags('Platform: Clusters')
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

  /**
   * List all clusters with pagination
   * ค้นหารายการคลัสเตอร์ทั้งหมดพร้อมการแบ่งหน้า
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated cluster list / รายการคลัสเตอร์แบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('cluster.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get list of clusters',
    description: 'Lists all top-level organizations (hotel chains or companies) registered in the platform with pagination. Each cluster groups multiple business units (hotel properties) under a single corporate entity.',
    'x-description-th': 'แสดงรายการคลัสเตอร์ทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'platformCluster_findAll',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Clusters retrieved successfully' },
      401: { description: 'Unauthorized' },
    },
  } as any)
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

  /**
   * Get a cluster by ID
   * ค้นหาคลัสเตอร์เดียวตาม ID
   * @param id - Cluster ID / รหัสคลัสเตอร์
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param version - API version / เวอร์ชัน API
   * @returns Cluster details / รายละเอียดคลัสเตอร์
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('cluster.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'Cluster ID', type: 'string' })
  @ApiOperation({
    summary: 'Get cluster by ID',
    description: 'Retrieves the details of a specific hotel chain or company, including its name, configuration, and the business units (properties) it contains.',
    'x-description-th': 'ดึงข้อมูลคลัสเตอร์รายการเดียวตาม ID',
    operationId: 'platformCluster_findOne',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Cluster retrieved successfully' },
      401: { description: 'Unauthorized' },
      404: { description: 'Cluster not found' },
    },
  } as any)
  async getClusterById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
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

  /**
   * Create a new cluster
   * สร้างคลัสเตอร์ใหม่ในแพลตฟอร์ม
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param createClusterDto - Cluster creation data / ข้อมูลสำหรับสร้างคลัสเตอร์
   * @param version - API version / เวอร์ชัน API
   * @returns Created cluster / คลัสเตอร์ที่ถูกสร้าง
   */
  @Post()
  @UseGuards(new AppIdGuard('cluster.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiBody({ type: ClusterCreateDto, description: 'Create cluster data' })
  @ApiOperation({
    summary: 'Create a new cluster',
    description: 'Onboards a new hotel chain or company into the Carmen ERP platform. The cluster serves as the top-level organizational grouping under which individual hotel properties (business units) will be created.',
    'x-description-th': 'สร้างคลัสเตอร์ใหม่',
    operationId: 'platformCluster_create',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      201: { description: 'Cluster created successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
    },
  } as any)
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

  /**
   * Update an existing cluster
   * อัปเดตข้อมูลคลัสเตอร์ที่มีอยู่
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Cluster ID / รหัสคลัสเตอร์
   * @param updateClusterDto - Cluster update data / ข้อมูลสำหรับอัปเดตคลัสเตอร์
   * @param version - API version / เวอร์ชัน API
   * @returns Updated cluster / คลัสเตอร์ที่ถูกอัปเดต
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('cluster.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'Cluster ID', type: 'string' })
  @ApiBody({ type: ClusterUpdateDto, description: 'Update cluster data' })
  @ApiOperation({
    summary: 'Update a cluster',
    description: 'Modifies the details of an existing hotel chain or company, such as its name, contact information, or subscription settings.',
    'x-description-th': 'อัปเดตข้อมูลคลัสเตอร์ที่มีอยู่',
    operationId: 'platformCluster_update',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Cluster updated successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
      404: { description: 'Cluster not found' },
    },
  } as any)
  async updateCluster(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
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

  /**
   * Delete a cluster
   * ลบคลัสเตอร์ออกจากแพลตฟอร์ม
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Cluster ID / รหัสคลัสเตอร์
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('cluster.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'Cluster ID', type: 'string' })
  @ApiOperation({
    summary: 'Delete a cluster',
    description: 'Removes a hotel chain or company from the platform. This is a significant operation as it affects all business units and user assignments under this cluster.',
    'x-description-th': 'ลบคลัสเตอร์ตาม ID',
    operationId: 'platformCluster_delete',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Cluster deleted successfully' },
      401: { description: 'Unauthorized' },
      404: { description: 'Cluster not found' },
    },
  } as any)
  async deleteCluster(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
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
