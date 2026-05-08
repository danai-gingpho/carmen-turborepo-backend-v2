import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class MyPendingPurchaseOrderService {
  private readonly logger: BackendLogger = new BackendLogger(
    MyPendingPurchaseOrderService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

  /**
   * Find a purchase order by ID
   * ค้นหาใบสั่งซื้อรายการเดียวตาม ID
   * @param id - Purchase order ID / รหัสใบสั่งซื้อ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Tenant ID / รหัส tenant
   * @param version - API version / เวอร์ชัน API
   * @returns Purchase order details / รายละเอียดใบสั่งซื้อ
   */
  async findById(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findById',
        id,
        version,
      },
      MyPendingPurchaseOrderService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'purchase-order.find-by-id', service: 'purchase-order' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * List all pending purchase orders for the user
   * ค้นหารายการใบสั่งซื้อที่รอดำเนินการทั้งหมดของผู้ใช้
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit codes / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of pending purchase orders / รายการใบสั่งซื้อที่รอดำเนินการแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    bu_code: string[],
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      MyPendingPurchaseOrderService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      { cmd: 'my-pending.purchase-order.find-all', service: 'my-pending' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
        version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Get count of pending purchase orders for the user
   * ดึงจำนวนใบสั่งซื้อที่รอดำเนินการของผู้ใช้
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Pending purchase order count / จำนวนใบสั่งซื้อที่รอดำเนินการ
   */
  async findAllMyPendingPurchaseOrdersCount(
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAllMyPendingPurchaseOrdersCount',
        version,
        user_id,
      },
      MyPendingPurchaseOrderService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'my-pending.purchase-order.find-all.count',
        service: 'my-pending',
      },
      {
        user_id,
        version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    this.logger.debug(
      {
        function: 'findAllMyPendingPurchaseOrdersCount',
        version,
        user_id,
        response,
      },
      MyPendingPurchaseOrderService.name,
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async findAllMyPendingStages(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllMyPendingStages', user_id, bu_code, version },
      MyPendingPurchaseOrderService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-order.find-all-my-pending-stages',
        service: 'purchase-order',
      },
      { user_id, bu_code, version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
