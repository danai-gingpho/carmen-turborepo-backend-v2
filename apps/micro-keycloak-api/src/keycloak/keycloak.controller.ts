import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KeycloakService } from './keycloak.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { CreateKeycloakUserDto, UpdateKeycloakUserDto } from './interface/keycloak.interface';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, Result, ErrorCode } from '@/common';

@Controller()
export class KeycloakController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    KeycloakController.name,
  );

  constructor(private readonly keycloakService: KeycloakService) {
    super();
  }

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code || payload.realm,
      user_id: payload.user_id || payload.userId,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  // ==================== Authentication ====================

  @MessagePattern({ cmd: 'keycloak.auth.login', service: 'keycloak' })
  async handleLogin(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleLogin', email: payload.email },
      KeycloakController.name,
    );
    try {
      const { email, password, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      const tokenResponse = await runWithAuditContext(auditContext, () =>
        this.keycloakService.login(email, password, realm)
      );
      const result = Result.ok({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type,
      });
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Authentication failed', ErrorCode.UNAUTHENTICATED);
      return this.handleResult(result);
    }
  }

  @MessagePattern({ cmd: 'keycloak.auth.logout', service: 'keycloak' })
  async handleLogout(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleLogout' },
      KeycloakController.name,
    );
    try {
      const { refresh_token, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      await runWithAuditContext(auditContext, () =>
        this.keycloakService.logoutWithRefreshToken(refresh_token, realm)
      );
      const result = Result.ok({ message: 'Logout successful' });
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Logout failed', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  @MessagePattern({ cmd: 'keycloak.auth.logoutById', service: 'keycloak' })
  async handleLogoutById(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleLogoutById' },
      KeycloakController.name,
    );
    try {
      const { user_id, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      await runWithAuditContext(auditContext, () =>
        this.keycloakService.logoutUserById(user_id, realm)
      );
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  }

  @MessagePattern({ cmd: 'keycloak.auth.refresh', service: 'keycloak' })
  async handleRefreshToken(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleRefreshToken' },
      KeycloakController.name,
    );
    try {
      const { refresh_token, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      const tokenResponse = await runWithAuditContext(auditContext, () =>
        this.keycloakService.refreshToken(refresh_token, realm)
      );
      const result = Result.ok({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type,
      });
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Token refresh failed', ErrorCode.UNAUTHENTICATED);
      return this.handleResult(result);
    }
  }

  @MessagePattern({ cmd: 'keycloak.auth.getUserInfo', service: 'keycloak' })
  async handleGetUserInfo(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleGetUserInfo' },
      KeycloakController.name,
    );
    try {
      const { accessToken, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      const userInfo = await runWithAuditContext(auditContext, () =>
        this.keycloakService.getUserInfo(accessToken, realm)
      );
      const result = Result.ok(userInfo);
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Failed to get user info', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  // ==================== User Management ====================

  @MessagePattern({ cmd: 'keycloak.users.create', service: 'keycloak' })
  async handleCreateUser(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleCreateUser', payload },
      KeycloakController.name,
    );
    try {
      const userData: CreateKeycloakUserDto = payload.data;
      const realm = payload.realm;
      const auditContext = this.createAuditContext(payload);
      const userId = await runWithAuditContext(auditContext, () =>
        this.keycloakService.createUser(userData, realm)
      );
      const result = Result.ok({ userId });
      return this.handleResult(result, HttpStatus.CREATED);
    } catch (error: any) {
      const result = Result.error(error.message || 'Failed to create user', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  @MessagePattern({ cmd: 'keycloak.users.getByEmail', service: 'keycloak' })
  async handleGetUserByEmail(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleGetUserByEmail', payload },
      KeycloakController.name,
    );
    try {
      const { email, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      const user = await runWithAuditContext(auditContext, () =>
        this.keycloakService.getUserByEmail(email, realm)
      );
      if (!user) {
        const result = Result.error('User not found', ErrorCode.NOT_FOUND);
        return this.handleResult(result);
      }
      const result = Result.ok(user);
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Failed to get user', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Update user profile in Keycloak
   * Payload:
   *   - userId: string (Keycloak user ID)
   *   - data: UpdateKeycloakUserDto (firstName, lastName, email, etc.)
   *   - realm?: string
   */
  @MessagePattern({ cmd: 'keycloak.users.update', service: 'keycloak' })
  async handleUpdateUser(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleUpdateUser', payload },
      KeycloakController.name,
    );
    try {
      const { userId, data, realm } = payload;
      const userData: UpdateKeycloakUserDto = data;
      const auditContext = this.createAuditContext(payload);
      await runWithAuditContext(auditContext, () =>
        this.keycloakService.updateUser(userId, userData, realm)
      );
      const result = Result.ok({ message: 'User updated successfully' });
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Failed to update user', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  @MessagePattern({ cmd: 'keycloak.users.resetPassword', service: 'keycloak' })
  async handleResetPassword(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleResetPassword', payload },
      KeycloakController.name,
    );
    try {
      const { userId, password, temporary, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      await runWithAuditContext(auditContext, () =>
        this.keycloakService.resetPassword(userId, password, temporary ?? false, realm)
      );
      const result = Result.ok({ message: 'Password reset successfully' });
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Failed to reset password', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Manage user BU attribute (add or remove)
   * Payload:
   *   - userId: string (Keycloak user ID)
   *   - action: 'add' | 'remove'
   *   - bu: { bu_id: string, bu_code?: string, role?: string }
   *   - realm?: string
   *
   * Example for adding BU:
   *   { userId: 'xxx', action: 'add', bu: { bu_id: '...', bu_code: 'C1', role: 'purchasing' } }
   *
   * Example for removing BU:
   *   { userId: 'xxx', action: 'remove', bu: { bu_id: '...' } }
   */
  @MessagePattern({ cmd: 'keycloak.users.manageBu', service: 'keycloak' })
  async handleManageUserBu(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleManageUserBu', payload },
      KeycloakController.name,
    );
    try {
      const { userId, action, bu, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      await runWithAuditContext(auditContext, () =>
        this.keycloakService.manageUserBu(userId, action, bu, realm)
      );
      const result = Result.ok({ message: 'User BU managed successfully' });
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Failed to manage user BU', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Get user's BU list
   * Payload:
   *   - userId: string (Keycloak user ID)
   *   - realm?: string
   */
  @MessagePattern({ cmd: 'keycloak.users.getBuList', service: 'keycloak' })
  async handleGetUserBuList(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleGetUserBuList', payload },
      KeycloakController.name,
    );
    try {
      const { userId, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      const buList = await runWithAuditContext(auditContext, () =>
        this.keycloakService.getUserBuList(userId, realm)
      );
      const result = Result.ok(buList);
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Failed to get user BU list', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Get all users from Keycloak realm
   * Payload:
   *   - realm?: string
   */
  @MessagePattern({ cmd: 'keycloak.users.getAll', service: 'keycloak' })
  async handleGetAllUsers(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'handleGetAllUsers', payload },
      KeycloakController.name,
    );
    try {
      const { realm } = payload;
      const auditContext = this.createAuditContext(payload);
      const users = await runWithAuditContext(auditContext, () =>
        this.keycloakService.getUsers(realm)
      );
      const result = Result.ok(users);
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Failed to get users', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  // ==================== Health Check ====================

  @MessagePattern({ cmd: 'keycloak.health', service: 'keycloak' })
  async handleHealthCheck(): Promise<any> {
    this.logger.debug(
      { function: 'handleHealthCheck' },
      KeycloakController.name,
    );
    try {
      const auditContext: AuditContext = {
        tenant_id: undefined,
        user_id: undefined,
      };
      const healthStatus = await runWithAuditContext(auditContext, () => this.keycloakService.healthCheck());
      const result = Result.ok(healthStatus);
      return this.handleResult(result);
    } catch (error: any) {
      const result = Result.error(error.message || 'Health check failed', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }
}
