import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { MyPendingPurchaseOrderService } from './my-pending.purchase-order.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseHttpController } from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiVersionMinRequest, ApiUserFilterQueries } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/my-pending/purchase-order')
@ApiTags('Workflow: My Pending')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class MyPendingPurchaseOrderController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    MyPendingPurchaseOrderController.name,
  );

  constructor(
    private readonly myPendingPurchaseOrderService: MyPendingPurchaseOrderService,
  ) {
    super();
  }

  /**
   * Get count of pending purchase orders for the current user
   * ดึงจำนวนใบสั่งซื้อที่รอดำเนินการของผู้ใช้ปัจจุบัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Pending purchase order count / จำนวนใบสั่งซื้อที่รอดำเนินการ
   */
  @Get('pending')
  @UseGuards(new AppIdGuard('my-pending.purchaseOrder.findAllPending.count'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get count of all pending purchase orders',
    description: 'Returns the count of purchase orders currently awaiting the user\'s action in the approval pipeline, used for dashboard badge notifications and workload indicators.',
    operationId: 'findAllPendingPurchaseOrdersCount',
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
        description: 'Pending purchase order count retrieved successfully',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {
                    pending: 1,
                  },
                  message: 'Success',
                  status: 200,
                },
              },
            },
          },
        },
      },
      404: {
        description: 'No pending purchase orders found',
        content: {
          'application/json': {
            examples: {
              default: {
                value: {
                  data: {},
                  message: 'false',
                  status: 404,
                },
              },
            },
          },
        },
      },
    },
    'x-description-th': 'ดึงจำนวนใบสั่งซื้อที่รอดำเนินการของผู้ใช้ปัจจุบันในสายการอนุมัติ ใช้สำหรับแสดงป้ายแจ้งเตือนบนแดชบอร์ดและตัวบ่งชี้ภาระงาน',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAllPendingPurchaseOrdersCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingPurchaseOrdersCount',
        version,
      },
      MyPendingPurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.myPendingPurchaseOrderService.findAllMyPendingPurchaseOrdersCount(
        user_id,
        version,
      );
    this.respond(res, result);
  }

  /**
   * Get workflow stages for pending purchase orders
   * ดึงขั้นตอนการทำงานสำหรับใบสั่งซื้อที่รอดำเนินการ
   */
  @Get(':bu_code/workflow-stages')
  @UseGuards(
    new AppIdGuard('my-pending.purchaseOrder.findAllWorkflowStagesByPo'),
  )
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get workflow stages of purchase orders',
    description: 'Retrieves the approval workflow stages configured for purchase orders in the business unit, showing the sequence of approval steps that a purchase order must pass through.',
    operationId: 'findAllMyPendingPoWorkflowStages',
    'x-description-th': 'ดึงขั้นตอนการอนุมัติที่กำหนดไว้สำหรับใบสั่งซื้อในหน่วยธุรกิจ แสดงลำดับขั้นตอนที่ใบสั่งซื้อต้องผ่าน',
  } as any)
  @ApiResponse({ status: 200, description: 'Workflow stages retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workflow stages not found' })
  @HttpCode(HttpStatus.OK)
  async findAllWorkflowStagesByPo(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findAllWorkflowStagesByPo', version },
      MyPendingPurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result =
      await this.myPendingPurchaseOrderService.findAllMyPendingStages(
        user_id, bu_code, version,
      );
    this.respond(res, result);
  }

  /**
   * Find a pending purchase order by ID
   * ค้นหาใบสั่งซื้อที่รอดำเนินการรายการเดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase order details / รายละเอียดใบสั่งซื้อ
   */
  @Get(':bu_code/:id')
  @UseGuards(new AppIdGuard('my-pending.purchaseOrder.findOne'))
  @ApiVersionMinRequest()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a purchase order by ID',
    description: 'Retrieves the full details of a specific purchase order pending approval, including vendor information, ordered items, quantities, pricing, and current approval workflow stage.',
    operationId: 'findPendingPurchaseOrderById',
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'The purchase order was successfully retrieved',
      },
      404: {
        description: 'The purchase order was not found',
      },
    },
    'x-description-th': 'ดึงรายละเอียดทั้งหมดของใบสั่งซื้อที่รออนุมัติตาม ID รวมถึงข้อมูลผู้ขาย รายการสินค้า จำนวน ราคา และขั้นตอนอนุมัติปัจจุบัน',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findById(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findById',
        bu_code,
        id,
        version,
      },
      MyPendingPurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.myPendingPurchaseOrderService.findById(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all pending purchase orders for the current user
   * ค้นหารายการใบสั่งซื้อที่รอดำเนินการทั้งหมดของผู้ใช้ปัจจุบัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of pending purchase orders / รายการใบสั่งซื้อที่รอดำเนินการแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('my-pending.purchaseOrder.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all purchase orders',
    description: 'Lists all purchase orders in the user\'s pending approval queue with pagination, allowing approvers to review and process vendor orders awaiting authorization before goods are procured.',
    operationId: 'findAllPendingPurchaseOrders',
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
        description: 'The purchase orders were successfully retrieved',
      },
      404: {
        description: 'The purchase orders were not found',
      },
    },
    'x-description-th': 'แสดงรายการใบสั่งซื้อทั้งหมดที่รอการอนุมัติของผู้ใช้พร้อมการแบ่งหน้า ให้ผู้อนุมัติตรวจสอบและดำเนินการกับใบสั่งซื้อที่รออนุมัติ',
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
      MyPendingPurchaseOrderController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.myPendingPurchaseOrderService.findAll(
      user_id,
      paginate.bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }
}
