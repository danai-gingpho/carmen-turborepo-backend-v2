import { Controller, HttpStatus } from '@nestjs/common';
import { ClusterService } from './cluster.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  IClusterCreate,
  IClusterUpdate,
  IUserCluster,
  IUserClusterUpdate,
} from './interface/cluster.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class ClusterController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ClusterController.name,
  );
  constructor(private readonly clusterService: ClusterService) {
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

  @MessagePattern({ cmd: 'cluster.create', service: 'cluster' })
  async createCluster(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'createCluster', payload: payload },
      ClusterController.name,
    );
    const createCluster: IClusterCreate = {
      ...payload.data,
    };

    const user_id = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.clusterService.createCluster(createCluster, user_id));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'cluster.update', service: 'cluster' })
  async updateCluster(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'updateCluster', payload: payload },
      ClusterController.name,
    );
    const updateCluster: IClusterUpdate = {
      ...payload.data,
    };

    const user_id = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.clusterService.updateCluster(updateCluster, user_id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'cluster.delete', service: 'cluster' })
  async deleteCluster(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'deleteCluster', payload: payload },
      ClusterController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.clusterService.deleteCluster(id, user_id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'cluster.list', service: 'cluster' })
  async listCluster(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'listCluster', payload: payload },
      ClusterController.name,
    );
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.clusterService.listCluster(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'cluster.get-by-id', service: 'cluster' })
  async getClusterById(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getClusterById', payload: payload },
      ClusterController.name,
    );
    const id = payload.id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.clusterService.getClusterById(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'cluster.get-user-by-id', service: 'cluster' })
  async getUserClusterById(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getUserClusterById', payload: payload },
      ClusterController.name,
    );
    const cluster_id = payload.cluster_id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.clusterService.getUserClusterById(cluster_id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'cluster.get-all-user', service: 'cluster' })
  async getAllUserCluster(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getAllUserCluster', payload: payload },
      ClusterController.name,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.clusterService.getAllUserCluster());
    return this.handleResult(result);
  }


  @MessagePattern({ cmd: 'cluster.create-user', service: 'cluster' })
  async createUserCluster(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'createUserCluster', payload: payload },
      ClusterController.name,
    );
    const data: IUserCluster = {
      ...payload.data,
    };
    const user_id = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.clusterService.createUserCluster(data, user_id));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'cluster.update-user', service: 'cluster' })
  async updateUserCluster(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'updateUserCluster', payload: payload },
      ClusterController.name,
    );
    const data: IUserClusterUpdate = {
      ...payload.data,
    };
    const user_id = payload.user_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.clusterService.updateUserCluster(data, user_id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'cluster.delete-user', service: 'cluster' })
  async deleteUserCluster(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'deleteUserCluster', payload: payload },
      ClusterController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.clusterService.deleteUserCluster(id, user_id));
    return this.handleResult(result);
  }

  // @MessagePattern({ cmd: 'cluster.set-default-tenant', service: 'cluster' })
  // async setDefaultTenant(@Payload() payload: any) {
  //   const user_id = payload.user_id;
  //   const tenant_id = payload.tenant_id || payload.bu_code;

  //   return this.clusterService.setDefaultTenant(user_id, tenant_id);
  // }
}
