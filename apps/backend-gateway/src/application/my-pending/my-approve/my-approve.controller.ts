import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MyApproveService } from './my-approve.service';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BaseHttpController } from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiVersionMinRequest, ApiUserFilterQueries } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/my-approve')
@ApiTags('Workflow: My Approvals')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class MyApproveController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    MyApproveController.name,
  );

  constructor(private readonly myApproveService: MyApproveService) {
    super();
  }

  /**
   * Get combined count of all pending approvals (SR + PR + PO)
   * ดึงจำนวนรวมของเอกสารที่รออนุมัติทั้งหมด (ใบเบิก + ใบขอซื้อ + ใบสั่งซื้อ)
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Combined pending approval counts / จำนวนเอกสารที่รออนุมัติรวม
   */
  @Get('pending')
  @UseGuards(new AppIdGuard('my-approve.findAllPending.count'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get combined count of all pending approvals (SR + PR + PO)',
    description:
      'Provides a dashboard summary count of all documents awaiting the current user\'s approval across store requisitions, purchase requests, and purchase orders, helping approvers prioritize their workload.',
    'x-description-th': 'ดึงจำนวนรวมของเอกสารที่รออนุมัติทั้งหมด (ใบเบิกสินค้า + ใบขอซื้อ + ใบสั่งซื้อ) ช่วยให้ผู้อนุมัติจัดลำดับความสำคัญของงาน',
    operationId: 'findAllPendingApprovalsCount',
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The pending counts were successfully retrieved',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {
                    total: 15,
                    sr: 5,
                    pr: 10,
                    po: 0,
                  },
                  message: 'Success',
                  status: 200,
                },
              },
            },
          },
        },
      },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAllPendingCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingCount',
        version,
      },
      MyApproveController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myApproveService.findAllMyApproveCount(
      user_id,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all pending approvals grouped by document type
   * ค้นหารายการเอกสารที่รออนุมัติทั้งหมดจัดกลุ่มตามประเภท
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Pending approvals grouped by type / เอกสารที่รออนุมัติจัดกลุ่มตามประเภท
   */
  @Get()
  @UseGuards(new AppIdGuard('my-approve.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all pending approvals (SR + PR + PO) grouped by type',
    description:
      'Retrieves the full list of procurement documents pending the current user\'s approval, grouped by document type (store requisitions, purchase requests, purchase orders), serving as the approver\'s central task queue.',
    'x-description-th': 'แสดงรายการเอกสารจัดซื้อทั้งหมดที่รออนุมัติ จัดกลุ่มตามประเภท (ใบเบิกสินค้า ใบขอซื้อ ใบสั่งซื้อ) เป็นคิวงานหลักของผู้อนุมัติ',
    operationId: 'findAllPendingApprovals',
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'page',
        in: 'query',
        required: false,
      },
      {
        name: 'perpage',
        in: 'query',
        required: false,
      },
      {
        name: 'search',
        in: 'query',
        required: false,
      },
      {
        name: 'bu_code',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The pending approvals were successfully retrieved',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {
                    store_requisitions: [],
                    purchase_requests: [],
                    purchase_orders: [],
                  },
                  message: 'Success',
                  status: 200,
                },
              },
            },
          },
        },
      },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      MyApproveController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.myApproveService.findAll(
      user_id,
      paginate.bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }
}
