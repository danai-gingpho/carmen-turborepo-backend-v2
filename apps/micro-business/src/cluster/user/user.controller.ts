import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class UserController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    UserController.name,
  );

  constructor(private readonly userService: UserService) {
    super();
  }

  @MessagePattern({ cmd: 'user.list', service: 'user' })
  async listUsers(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'listUsers', payload: payload },
      UserController.name,
    );
    const { paginate } = payload;
    const result = await this.userService.listUsers(paginate);
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'user.get', service: 'user' })
  async getUser(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getUser', payload: payload },
      UserController.name,
    );
    const { id } = payload;
    const result = await this.userService.getUser(id);
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'user.create', service: 'user' })
  async createUser(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'createUser', payload: payload },
      UserController.name,
    );
    const { data } = payload;
    const result = await this.userService.createUser(data);
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'user.update', service: 'user' })
  async updateUser(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'updateUser', payload: payload },
      UserController.name,
    );
    const { id, data } = payload;
    const result = await this.userService.updateUser(id, data);
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'user.delete', service: 'user' })
  async deleteUser(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'deleteUser', payload: payload },
      UserController.name,
    );
    const { id } = payload;
    const result = await this.userService.deleteUser(id);
    return this.handleResult(result);
  }
}
