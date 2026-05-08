import { Controller, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class UserController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    UserController.name,
  );

  constructor(private readonly userService: UserService) {
    super();
  }

  @MessagePattern({ cmd: 'user.list', service: 'user' })
  async listUsers(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'listUsers', payload: payload },
      UserController.name,
    );
    const { paginate } = payload;
    const result = await this.userService.listUsers(paginate);
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'user.get', service: 'user' })
  async getUser(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getUser', payload: payload },
      UserController.name,
    );
    const { id } = payload;
    const result = await this.userService.getUser(id);
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'user.create', service: 'user' })
  async createUser(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'createUser', payload: payload },
      UserController.name,
    );
    const { data } = payload;
    const result = await this.userService.createUser(data);
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'user.update', service: 'user' })
  async updateUser(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'updateUser', payload: payload },
      UserController.name,
    );
    const { id, data } = payload;
    const result = await this.userService.updateUser(id, data);
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'user.ensure-exists', service: 'user' })
  async ensureUserExists(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'ensureUserExists', payload: payload },
      UserController.name,
    );
    const { data } = payload;
    const result = await this.userService.ensureUserExists(data);
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'user.delete', service: 'user' })
  async deleteUser(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'deleteUser', payload: payload },
      UserController.name,
    );
    const { id } = payload;
    const result = await this.userService.deleteUser(id);
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'user.hard-delete', service: 'user' })
  async hardDeleteUser(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'hardDeleteUser', payload: payload },
      UserController.name,
    );
    const { id } = payload;
    const result = await this.userService.hardDeleteUser(id);
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'user.resolveByIds', service: 'user' })
  async resolveByIds(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    const ids = Array.isArray(payload?.ids) ? (payload.ids as string[]) : [];
    this.logger.debug(
      { function: 'resolveByIds', count: ids.length },
      UserController.name,
    );
    const data = await this.userService.resolveByIds(ids);
    return {
      data,
      response: {
        status: HttpStatus.OK,
        message: 'Success',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
