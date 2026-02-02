import { Controller, HttpStatus } from '@nestjs/common';
import { PriceListService } from './price-list.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class PriceListController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListController.name,
  );
  constructor(private readonly priceListService: PriceListService) {
    super();
  }

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'price-list.findOne', service: 'price-list' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    const id = payload.id;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'price-list.findAll', service: 'price-list' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'price-list.find-all-by-id', service: 'price-list' })
  async findAllById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllById', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const ids = payload.ids;
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.findAllById(ids, paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'price-list.price-compare', service: 'price-list' })
  async priceCompare(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'priceCompare', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.priceCompare(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'price-list.create', service: 'price-list' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'price-list.update', service: 'price-list' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'price-list.remove', service: 'price-list' })
  async remove(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'remove', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const id = payload.id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.remove(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'price-list.uploadExcel', service: 'price-list' })
  async uploadExcel(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'uploadExcel', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.uploadExcel(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'price-list.downloadExcel', service: 'price-list' })
  async downloadExcel(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'downloadExcel', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.downloadExcel(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'price-list.find-all-by-detail-id', service: 'price-list' })
  async findAllByDetailId(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllByDetailId', payload }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const price_list_detail_ids = payload.ids;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.findAllByDetail(price_list_detail_ids));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'price-list.importCsv', service: 'price-list' })
  async importCsv(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'importCsv', payload: { ...payload, csvContent: payload.csvContent?.substring(0, 100) + '...' } }, PriceListController.name);
    this.priceListService.userId = payload.user_id;
    this.priceListService.bu_code = payload.bu_code;
    await this.priceListService.initializePrismaService(payload.bu_code, payload.user_id);
    const csvContent = payload.csvContent;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.priceListService.importCsv(csvContent));
    return this.handleResult(result, HttpStatus.CREATED);
  }
}
