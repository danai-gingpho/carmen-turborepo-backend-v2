import { Controller, HttpStatus } from '@nestjs/common';
import { NewsService } from './news.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class NewsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    NewsController.name,
  );

  constructor(private readonly newsService: NewsService) {
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

  @MessagePattern({ cmd: 'news.findAll', service: 'news' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAll', payload: payload },
      NewsController.name,
    );

    const paginate = payload.paginate;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.newsService.findAll(user_id, paginate, version),
    );

    this.logger.debug(
      { function: 'findAll', result: result },
      NewsController.name,
    );

    return this.handleResult(result, HttpStatus.OK);
  }

  @MessagePattern({ cmd: 'news.findOne', service: 'news' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findOne', payload: payload },
      NewsController.name,
    );

    const id = payload.id;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.newsService.findOne(id, user_id, version),
    );

    return this.handleResult(result, HttpStatus.OK);
  }

  @MessagePattern({ cmd: 'news.create', service: 'news' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'create', payload: payload },
      NewsController.name,
    );

    const data = payload.data;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.newsService.create(data, user_id, version),
    );

    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'news.update', service: 'news' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'update', payload: payload },
      NewsController.name,
    );

    const id = payload.id;
    const data = payload.data;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.newsService.update(id, data, user_id, version),
    );

    return this.handleResult(result, HttpStatus.OK);
  }

  @MessagePattern({ cmd: 'news.delete', service: 'news' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'delete', payload: payload },
      NewsController.name,
    );

    const id = payload.id;
    const user_id = payload.user_id;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.newsService.delete(id, user_id, version),
    );

    return this.handleResult(result, HttpStatus.OK);
  }
}
