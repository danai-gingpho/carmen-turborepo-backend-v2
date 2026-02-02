import { Controller, HttpStatus } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ICreateDepartments } from './interface/departments.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class DepartmentsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    DepartmentsController.name,
  );
  constructor(private readonly departmentsService: DepartmentsService) {
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

  @MessagePattern({ cmd: 'departments.findOne', service: 'departments' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, DepartmentsController.name);
    const id = payload.id;
    const withUsers = payload?.withUsers ?? false;
    this.departmentsService.userId = payload.user_id;
    this.departmentsService.bu_code = payload.bu_code;
    await this.departmentsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentsService.findOne(id, withUsers),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'departments.findAll', service: 'departments' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, DepartmentsController.name);
    this.departmentsService.userId = payload.user_id;
    this.departmentsService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.departmentsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentsService.findAll(paginate),
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'departments.create', service: 'departments' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, DepartmentsController.name);
    const data: ICreateDepartments = payload.data;
    this.departmentsService.userId = payload.user_id;
    this.departmentsService.bu_code = payload.bu_code;
    await this.departmentsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentsService.create(data),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'departments.update', service: 'departments' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, DepartmentsController.name);
    const data = payload.data;
    this.departmentsService.userId = payload.user_id;
    this.departmentsService.bu_code = payload.bu_code;
    await this.departmentsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentsService.update(data),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'departments.delete', service: 'departments' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, DepartmentsController.name);
    const id = payload.id;
    this.departmentsService.userId = payload.user_id;
    this.departmentsService.bu_code = payload.bu_code;
    await this.departmentsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentsService.delete(id),
    );
    return this.handleResult(result);
  }
}
