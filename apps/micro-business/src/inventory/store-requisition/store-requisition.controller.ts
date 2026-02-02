import { Body, Controller, HttpStatus, UseFilters } from '@nestjs/common';
import { StoreRequisitionService } from './store-requisition.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  RejectStoreRequisitionDto,
  ReviewStoreRequisitionDto,
  BaseMicroserviceController,
} from '@/common';
import { StoreRequisitionLogic } from './logic/store-requisition.logic';
import { AllExceptionsFilter } from '@/common/exception/global.filter';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';

@UseFilters(new AllExceptionsFilter())
@Controller()
export class StoreRequisitionController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    StoreRequisitionController.name,
  );
  constructor(
    private readonly storeRequisitionService: StoreRequisitionService,
    private readonly storeRequisitionLogic: StoreRequisitionLogic,
  ) {
    super();
  }

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({
    cmd: 'store-requisition.find-by-id',
    service: 'store-requisition',
  })
  async getById(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getById', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const id = payload.id;
    const userData = payload.userData;

    await this.storeRequisitionService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findById(id, userData),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.find-all',
    service: 'store-requisition',
  })
  async getAll(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getAll', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const paginate = payload.paginate;
    const userDatas = payload.userDatas;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findAll(
        user_id,
        bu_code,
        paginate,
        userDatas,
      ),
    );

    return this.handleMultiPaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.create',
    service: 'store-requisition',
  })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'create', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionLogic.create(payload.data, user_id, bu_code),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'store-requisition.submit',
    service: 'store-requisition',
  })
  async submit(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'submit', payload },
      StoreRequisitionController.name,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionLogic.submit(
        payload.id,
        payload.payload,
        payload.user_id,
        payload.bu_code,
      ),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.approve',
    service: 'store-requisition',
  })
  async approve(
    @Payload()
    payload: {
      id: string;
      body: any;
      user_id: string;
      bu_code: string;
      version: string;
    },
  ): Promise<any> {
    this.logger.debug(
      { function: 'approve', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionLogic.approve(
        payload.id,
        payload.body,
        user_id,
        bu_code,
      ),
    );

    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.reject',
    service: 'store-requisition',
  })
  async reject(
    @Payload()
    payload: {
      id: string;
      body: any;
      user_id: string;
      bu_code: string;
      version: string;
    },
  ): Promise<any> {
    this.logger.debug(
      { function: 'reject', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const body: RejectStoreRequisitionDto = payload.body;

    await this.storeRequisitionService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.reject(payload.id, body),
    );

    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.review',
    service: 'store-requisition',
  })
  async review(
    @Payload()
    payload: {
      id: string;
      body: any;
      user_id: string;
      bu_code: string;
      version: string;
    },
  ): Promise<any> {
    this.logger.debug(
      { function: 'review', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const body: ReviewStoreRequisitionDto = payload.body;

    await this.storeRequisitionService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.review(payload.id, body),
    );

    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.save',
    service: 'store-requisition',
  })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'update', payload },
      StoreRequisitionController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionLogic.save(id, data, user_id, bu_code),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.delete',
    service: 'store-requisition',
  })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'delete', payload },
      StoreRequisitionController.name,
    );
    await this.storeRequisitionService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.delete(payload.id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'store-requisition.find-all-by-status',
    service: 'store-requisition',
  })
  async findAllByStatus(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllByStatus', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const status = payload.status;
    const paginate = payload.paginate;

    await this.storeRequisitionService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findAllByStatus(status, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'my-pending.store-requisition.find-all.count',
    service: 'my-pending',
  })
  async findAllMyPendingCount(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllMyPendingCount', payload },
      StoreRequisitionController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.storeRequisitionService.findAllMyPendingCount(user_id, bu_code),
    );

    return this.handleResult(result);
  }
}
