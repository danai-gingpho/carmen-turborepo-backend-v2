import { Controller } from '@nestjs/common';
import { RunningCodeService } from './running-code.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { ICommonResponse } from '@/common/interface/common.interface';
import { IPattern } from '@/common/helpers/running-code.helper';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';

@Controller()
export class RunningCodeController {
  private readonly logger: BackendLogger = new BackendLogger(
    RunningCodeController.name,
  );
  constructor(private readonly runningCodeService: RunningCodeService) {}

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'running-code.findOne', service: 'running-codes' })
  async findOne(@Payload() payload: any) : Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, RunningCodeController.name);
    const id = payload.id;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.findOne(id));
  }

  @MessagePattern({ cmd: 'running-code.findAll', service: 'running-codes' })
  async findAll(@Payload() payload: any) : Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, RunningCodeController.name);
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.findAll(paginate));
  }

  @MessagePattern({
    cmd: 'running-code.find-by-type',
    service: 'running-codes',
  })
  async findByType(@Payload() payload: any) : Promise<any> {
    this.logger.debug({ function: 'findByType', payload }, RunningCodeController.name);
    const type = payload.type;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.findByType(type));
  }

  @MessagePattern({ cmd: 'running-code.create', service: 'running-codes' })
  async create(@Payload() payload: any) : Promise<any> {
    this.logger.debug({ function: 'create', payload }, RunningCodeController.name);
    const data = payload.data;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.create(data));
  }

  @MessagePattern({ cmd: 'running-code.update', service: 'running-codes' })
  async update(@Payload() payload: any) : Promise<any> {
    this.logger.debug({ function: 'update', payload }, RunningCodeController.name);
    const data = payload.data;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.update(data));
  }

  @MessagePattern({ cmd: 'running-code.delete', service: 'running-codes' })
  async delete(@Payload() payload: any) : Promise<any> {
    this.logger.debug({ function: 'delete', payload }, RunningCodeController.name);
    const id = payload.id;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.delete(id));
  }

  @MessagePattern({
    cmd: 'running-code.generate-code',
    service: 'running-codes',
  })
  async generateCode(@Payload() payload: any) : Promise<any> {
    this.logger.debug({ function: 'generateCode', payload }, RunningCodeController.name);
    const type = payload.type;
    const issueDate = payload.issueDate;
    const last_no = payload.last_no;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.generateCode(
      type,
      issueDate,
      last_no,
    ));
  }

  @MessagePattern({
    cmd: 'running-code.get-pattern-by-type',
    service: 'running-codes',
  })
  async getRunningPatternByType(
    @Payload() payload: any,
  ): Promise<ICommonResponse<IPattern[]>> {
    this.logger.debug(
      { function: 'getRunningPatternByType', payload },
      RunningCodeController.name,
    );
    const type = payload.type;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.getRunningPatternByType(
      type,
    ));
  }
}
