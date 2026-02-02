import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

export type AdjustmentType = 'stock-in' | 'stock-out';

export interface InventoryAdjustmentItem {
  id: string;
  type: AdjustmentType;
  document_no: string;
  date: string;
  location_id?: string;
  location_name?: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

@Injectable()
export class InventoryAdjustmentService {
  private readonly logger: BackendLogger = new BackendLogger(InventoryAdjustmentService.name);

  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
    type?: AdjustmentType,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate, version, type },
      InventoryAdjustmentService.name,
    );

    const results: InventoryAdjustmentItem[] = [];
    let totalStockIn = 0;
    let totalStockOut = 0;

    // Fetch stock-in data if type is not specified or type is 'stock-in'
    if (!type || type === 'stock-in') {
      const stockInRes: Observable<any> = this.inventoryService.send(
        { cmd: 'stock-in.findAll', service: 'stock-in' },
        { user_id, tenant_id, paginate, version },
      );

      const stockInResponse = await firstValueFrom(stockInRes);

      if (stockInResponse.response.status === HttpStatus.OK) {
        const stockInItems = (stockInResponse.data || []).map((item: any) => ({
          ...item,
          type: 'stock-in' as AdjustmentType,
          document_no: item.si_no || item.document_no,
        }));
        results.push(...stockInItems);
        totalStockIn = stockInResponse.paginate?.total || stockInItems.length;
      }
    }

    // Fetch stock-out data if type is not specified or type is 'stock-out'
    if (!type || type === 'stock-out') {
      const stockOutRes: Observable<any> = this.inventoryService.send(
        { cmd: 'stock-out.findAll', service: 'stock-out' },
        { user_id, tenant_id, paginate, version },
      );

      const stockOutResponse = await firstValueFrom(stockOutRes);

      if (stockOutResponse.response.status === HttpStatus.OK) {
        const stockOutItems = (stockOutResponse.data || []).map((item: any) => ({
          ...item,
          type: 'stock-out' as AdjustmentType,
          document_no: item.so_no || item.document_no,
        }));
        results.push(...stockOutItems);
        totalStockOut = stockOutResponse.paginate?.total || stockOutItems.length;
      }
    }

    // Sort by created_at descending (most recent first)
    results.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return Result.ok({
      data: results,
      paginate: {
        total: totalStockIn + totalStockOut,
        page: paginate.page,
        perPage: paginate.perPage,
        totalStockIn,
        totalStockOut,
      },
    });
  }

  async findOne(
    id: string,
    type: AdjustmentType,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, type, user_id, tenant_id, version },
      InventoryAdjustmentService.name,
    );

    const cmd = type === 'stock-in' ? 'stock-in.findOne' : 'stock-out.findOne';
    const service = type === 'stock-in' ? 'stock-in' : 'stock-out';

    const res: Observable<any> = this.inventoryService.send(
      { cmd, service },
      { id, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({
      ...response.data,
      type,
      document_no: type === 'stock-in'
        ? response.data.si_no || response.data.document_no
        : response.data.so_no || response.data.document_no,
    });
  }
}
