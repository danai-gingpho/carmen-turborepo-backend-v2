import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result } from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class MyApproveService {
  private readonly logger: BackendLogger = new BackendLogger(
    MyApproveService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
    @Inject('BUSINESS_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

  /**
   * Get combined count of all pending approvals (SR + PR + PO)
   * ดึงจำนวนรวมของเอกสารที่รออนุมัติทั้งหมด (ใบเบิก + ใบขอซื้อ + ใบสั่งซื้อ)
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Combined pending approval counts / จำนวนเอกสารที่รออนุมัติรวม
   */
  async findAllMyApproveCount(
    user_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllMyApproveCount',
        user_id,
        version,
      },
      MyApproveService.name,
    );

    const [srResult, prResult, poResult] = await Promise.all([
      this.getSRCount(user_id, version),
      this.getPRCount(user_id, version),
      this.getPOCount(user_id, version),
    ]);

    return Result.ok({
      total: srResult.pending + prResult.pending + poResult.pending,
      sr: srResult.pending,
      pr: prResult.pending,
      po: poResult.pending,
    });
  }

  /**
   * List all pending approvals grouped by document type (SR, PR, PO)
   * ค้นหารายการเอกสารที่รออนุมัติทั้งหมดจัดกลุ่มตามประเภท (ใบเบิก, ใบขอซื้อ, ใบสั่งซื้อ)
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit codes / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Pending approvals grouped by type / เอกสารที่รออนุมัติจัดกลุ่มตามประเภท
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
      MyApproveService.name,
    );

    const [srResult, prResult, poResult] = await Promise.all([
      this.getSRList(user_id, bu_code, paginate, version),
      this.getPRList(user_id, bu_code, paginate, version),
      this.getPOList(user_id, bu_code, paginate, version),
    ]);

    return Result.ok({
      store_requisitions: srResult,
      purchase_requests: prResult,
      purchase_orders: poResult,
    });
  }

  private async getSRCount(
    user_id: string,
    version: string,
  ): Promise<{ pending: number }> {
    this.logger.debug(
      {
        function: 'getSRCount',
        user_id,
        version,
      },
      MyApproveService.name,
    );

    try {
      const res: Observable<any> = this.inventoryService.send(
      {
          cmd: 'my-pending.store-requisition.find-all.count',
          service: 'my-pending',
        },
      {
          user_id,
          version, ...getGatewayRequestContext() },
    );

      const response = await firstValueFrom(res);

      if (response.response.status !== HttpStatus.OK) {
        this.logger.warn(
          {
            function: 'getSRCount',
            message: 'Failed to get SR count',
            response,
          },
          MyApproveService.name,
        );
        return { pending: 0 };
      }

      return { pending: response.data?.pending || 0 };
    } catch (error) {
      this.logger.error(
        {
          function: 'getSRCount',
          error: error.message,
        },
        MyApproveService.name,
      );
      return { pending: 0 };
    }
  }

  private async getPRCount(
    user_id: string,
    version: string,
  ): Promise<{ pending: number }> {
    this.logger.debug(
      {
        function: 'getPRCount',
        user_id,
        version,
      },
      MyApproveService.name,
    );

    try {
      const res: Observable<any> = this.procurementService.send(
      {
          cmd: 'my-pending.purchase-request.find-all.count',
          service: 'my-pending',
        },
      {
          user_id,
          version, ...getGatewayRequestContext() },
    );

      const response = await firstValueFrom(res);

      if (response.response.status !== HttpStatus.OK) {
        this.logger.warn(
          {
            function: 'getPRCount',
            message: 'Failed to get PR count',
            response,
          },
          MyApproveService.name,
        );
        return { pending: 0 };
      }

      return { pending: response.data?.pending || 0 };
    } catch (error) {
      this.logger.error(
        {
          function: 'getPRCount',
          error: error.message,
        },
        MyApproveService.name,
      );
      return { pending: 0 };
    }
  }

  private async getSRList(
    user_id: string,
    bu_code: string[],
    paginate: IPaginate,
    version: string,
  ): Promise<any[]> {
    this.logger.debug(
      {
        function: 'getSRList',
        user_id,
        bu_code,
        paginate,
        version,
      },
      MyApproveService.name,
    );

    try {
      const res: Observable<any> = this.inventoryService.send(
      {
          cmd: 'my-pending.store-requisition.find-all',
          service: 'my-pending',
        },
      {
          user_id,
          bu_code,
          paginate,
          version, ...getGatewayRequestContext() },
    );

      const response = await firstValueFrom(res);

      if (response.response.status !== HttpStatus.OK) {
        this.logger.warn(
          {
            function: 'getSRList',
            message: 'Failed to get SR list',
            response,
          },
          MyApproveService.name,
        );
        return [];
      }

      return response.data || [];
    } catch (error) {
      this.logger.error(
        {
          function: 'getSRList',
          error: error.message,
        },
        MyApproveService.name,
      );
      return [];
    }
  }

  private async getPRList(
    user_id: string,
    bu_code: string[],
    paginate: IPaginate,
    version: string,
  ): Promise<any[]> {
    this.logger.debug(
      {
        function: 'getPRList',
        user_id,
        bu_code,
        paginate,
        version,
      },
      MyApproveService.name,
    );

    try {
      const res: Observable<any> = this.procurementService.send(
      {
          cmd: 'my-pending.purchase-request.find-all',
          service: 'my-pending',
        },
      {
          user_id,
          bu_code,
          paginate,
          version, ...getGatewayRequestContext() },
    );

      const response = await firstValueFrom(res);

      if (response.response.status !== HttpStatus.OK) {
        this.logger.warn(
          {
            function: 'getPRList',
            message: 'Failed to get PR list',
            response,
          },
          MyApproveService.name,
        );
        return [];
      }

      return response.data || [];
    } catch (error) {
      this.logger.error(
        {
          function: 'getPRList',
          error: error.message,
        },
        MyApproveService.name,
      );
      return [];
    }
  }

  private async getPOCount(
    user_id: string,
    version: string,
  ): Promise<{ pending: number }> {
    this.logger.debug(
      {
        function: 'getPOCount',
        user_id,
        version,
      },
      MyApproveService.name,
    );

    try {
      const res: Observable<any> = this.procurementService.send(
      {
          cmd: 'my-pending.purchase-order.find-all.count',
          service: 'my-pending',
        },
      {
          user_id,
          version, ...getGatewayRequestContext() },
    );

      const response = await firstValueFrom(res);

      if (response.response.status !== HttpStatus.OK) {
        this.logger.warn(
          {
            function: 'getPOCount',
            message: 'Failed to get PO count',
            response,
          },
          MyApproveService.name,
        );
        return { pending: 0 };
      }

      return { pending: response.data?.pending || 0 };
    } catch (error) {
      this.logger.error(
        {
          function: 'getPOCount',
          error: error.message,
        },
        MyApproveService.name,
      );
      return { pending: 0 };
    }
  }

  private async getPOList(
    user_id: string,
    bu_code: string[],
    paginate: IPaginate,
    version: string,
  ): Promise<any[]> {
    this.logger.debug(
      {
        function: 'getPOList',
        user_id,
        bu_code,
        paginate,
        version,
      },
      MyApproveService.name,
    );

    try {
      const res: Observable<any> = this.procurementService.send(
      {
          cmd: 'my-pending.purchase-order.find-all',
          service: 'my-pending',
        },
      {
          user_id,
          bu_code,
          paginate,
          version, ...getGatewayRequestContext() },
    );

      const response = await firstValueFrom(res);

      if (response.response.status !== HttpStatus.OK) {
        this.logger.warn(
          {
            function: 'getPOList',
            message: 'Failed to get PO list',
            response,
          },
          MyApproveService.name,
        );
        return [];
      }

      return response.data || [];
    } catch (error) {
      this.logger.error(
        {
          function: 'getPOList',
          error: error.message,
        },
        MyApproveService.name,
      );
      return [];
    }
  }
}
