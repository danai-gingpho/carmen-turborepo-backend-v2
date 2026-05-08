import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KeycloakService } from './keycloak.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { CreateKeycloakUserDto, UpdateKeycloakUserDto } from './interface/keycloak.interface';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, Result, ErrorCode, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class KeycloakController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    KeycloakController.name,
  );

  constructor(private readonly keycloakService: KeycloakService) {
    super();
  }

  /**
   * Create audit context from microservice payload
   * สร้าง audit context จาก payload ของ microservice
   * @param payload - Microservice payload / ข้อมูล payload ของ microservice
   * @returns Audit context object / อ็อบเจกต์ audit context
   */
  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code || payload.realm,
      user_id: payload.user_id || payload.userId,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  // ==================== Authentication ====================

  /**
   * Handle user login via Keycloak authentication
   * จัดการการเข้าสู่ระบบผู้ใช้ผ่านการยืนยันตัวตน Keycloak
   * @param payload - Payload with email and password / ข้อมูลพร้อมอีเมลและรหัสผ่าน
   * @returns Token response / response ที่มี token
   */
  @MessagePattern({ cmd: 'keycloak.auth.login', service: 'keycloak' })
  async handleLogin(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Authentication failed', ErrorCode.UNAUTHENTICATED);
      return this.handleResult(result);
    }
  }

  /**
   * Handle user logout using refresh token
   * จัดการการออกจากระบบผู้ใช้โดยใช้ refresh token
   * @param payload - Payload with refresh_token / ข้อมูลพร้อม refresh_token
   * @returns Logout result / ผลการออกจากระบบ
   */
  @MessagePattern({ cmd: 'keycloak.auth.logout', service: 'keycloak' })
  async handleLogout(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Logout failed', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Handle user logout by user ID (admin operation)
   * จัดการการออกจากระบบผู้ใช้ตาม ID (ต้องใช้สิทธิ์ admin)
   * @param payload - Payload with user_id / ข้อมูลพร้อม user_id
   * @returns Logout result / ผลการออกจากระบบ
   */
  @MessagePattern({ cmd: 'keycloak.auth.logoutById', service: 'keycloak' })
  async handleLogoutById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
      const result = Result.ok({ success: true });
      return this.handleResult(result);
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Logout failed', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Handle access token refresh using refresh token
   * จัดการการรีเฟรช access token โดยใช้ refresh token
   * @param payload - Payload with refresh_token / ข้อมูลพร้อม refresh_token
   * @returns New token response / token response ใหม่
   */
  @MessagePattern({ cmd: 'keycloak.auth.refresh', service: 'keycloak' })
  async handleRefreshToken(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Token refresh failed', ErrorCode.UNAUTHENTICATED);
      return this.handleResult(result);
    }
  }

  /**
   * Get user info from access token via OIDC userinfo endpoint
   * ดึงข้อมูลผู้ใช้จาก access token ผ่าน OIDC userinfo endpoint
   * @param payload - Payload with accessToken / ข้อมูลพร้อม accessToken
   * @returns User info / ข้อมูลผู้ใช้
   */
  @MessagePattern({ cmd: 'keycloak.auth.getUserInfo', service: 'keycloak' })
  async handleGetUserInfo(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get user info';
      const isAuthError = message.includes('expired') || message.includes('invalid') || message.includes('unauthorized');
      const result = Result.error(message, isAuthError ? ErrorCode.UNAUTHENTICATED : ErrorCode.INTERNAL);
      return this.handleResult(result, isAuthError ? HttpStatus.UNAUTHORIZED : undefined);
    }
  }

  // ==================== User Management ====================

  /**
   * Create a new user in Keycloak
   * สร้างผู้ใช้ใหม่ใน Keycloak
   * @param payload - Payload with user data / ข้อมูลพร้อมข้อมูลผู้ใช้
   * @returns Created user ID / ID ผู้ใช้ที่สร้างแล้ว
   */
  @MessagePattern({ cmd: 'keycloak.users.create', service: 'keycloak' })
  async handleCreateUser(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to create user', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Get user by email address from Keycloak
   * ค้นหาผู้ใช้ตามอีเมลจาก Keycloak
   * @param payload - Payload with email / ข้อมูลพร้อมอีเมล
   * @returns User data or not found error / ข้อมูลผู้ใช้หรือข้อผิดพลาดไม่พบ
   */
  @MessagePattern({ cmd: 'keycloak.users.getByEmail', service: 'keycloak' })
  async handleGetUserByEmail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to get user', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Update user profile in Keycloak
   * อัปเดตโปรไฟล์ผู้ใช้ใน Keycloak
   * @param payload - Payload with userId and update data / ข้อมูลพร้อม userId และข้อมูลที่ต้องการอัปเดต
   * @returns Update result / ผลการอัปเดต
   */
  @MessagePattern({ cmd: 'keycloak.users.update', service: 'keycloak' })
  async handleUpdateUser(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to update user', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Reset user password in Keycloak
   * รีเซ็ตรหัสผ่านผู้ใช้ใน Keycloak
   * @param payload - Payload with userId, password, and temporary flag / ข้อมูลพร้อม userId, รหัสผ่าน, และ flag ชั่วคราว
   * @returns Reset result / ผลการรีเซ็ต
   */
  @MessagePattern({ cmd: 'keycloak.users.resetPassword', service: 'keycloak' })
  async handleResetPassword(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to reset password', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Manage user BU attribute (add or remove)
   * จัดการ attribute หน่วยธุรกิจของผู้ใช้ (เพิ่มหรือลบ)
   * @param payload - Payload with userId, action, and bu data / ข้อมูลพร้อม userId, action, และข้อมูลหน่วยธุรกิจ
   * @returns Management result / ผลการจัดการ
   */
  @MessagePattern({ cmd: 'keycloak.users.manageBu', service: 'keycloak' })
  async handleManageUserBu(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to manage user BU', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Get user's BU list from Keycloak
   * ค้นหารายการหน่วยธุรกิจทั้งหมดของผู้ใช้จาก Keycloak
   * @param payload - Payload with userId / ข้อมูลพร้อม userId
   * @returns BU list / รายการหน่วยธุรกิจ
   */
  @MessagePattern({ cmd: 'keycloak.users.getBuList', service: 'keycloak' })
  async handleGetUserBuList(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to get user BU list', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Manage user Cluster attribute (add or remove)
   * จัดการ attribute Cluster ของผู้ใช้ (เพิ่มหรือลบ)
   * @param payload - Payload with userId, action, and cluster data / ข้อมูลพร้อม userId, action, และข้อมูล Cluster
   * @returns Management result / ผลการจัดการ
   */
  @MessagePattern({ cmd: 'keycloak.users.manageCluster', service: 'keycloak' })
  async handleManageUserCluster(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'handleManageUserCluster', payload },
      KeycloakController.name,
    );
    try {
      const { userId, action, cluster, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      await runWithAuditContext(auditContext, () =>
        this.keycloakService.manageUserCluster(userId, action, cluster, realm)
      );
      const result = Result.ok({ message: 'User Cluster managed successfully' });
      return this.handleResult(result);
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to manage user Cluster', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Get user's Cluster list from Keycloak
   * ค้นหารายการ Cluster ทั้งหมดของผู้ใช้จาก Keycloak
   * @param payload - Payload with userId / ข้อมูลพร้อม userId
   * @returns Cluster list / รายการ Cluster
   */
  @MessagePattern({ cmd: 'keycloak.users.getClusterList', service: 'keycloak' })
  async handleGetUserClusterList(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'handleGetUserClusterList', payload },
      KeycloakController.name,
    );
    try {
      const { userId, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      const clusterList = await runWithAuditContext(auditContext, () =>
        this.keycloakService.getUserClusterList(userId, realm)
      );
      const result = Result.ok(clusterList);
      return this.handleResult(result);
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to get user Cluster list', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Manage user Keycloak group for Cluster (add/remove user from group)
   * จัดการกลุ่ม Keycloak สำหรับ Cluster ของผู้ใช้ (เพิ่ม/ลบผู้ใช้จากกลุ่ม)
   * @param payload - Payload with userId, groupId, and action / ข้อมูลพร้อม userId, groupId, และ action
   * @returns Management result / ผลการจัดการ
   */
  @MessagePattern({ cmd: 'keycloak.users.manageClusterGroup', service: 'keycloak' })
  async handleManageClusterGroup(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'handleManageClusterGroup', payload },
      KeycloakController.name,
    );
    try {
      const { userId, groupId, action, realm } = payload;
      const auditContext = this.createAuditContext(payload);

      if (action === 'add') {
        await runWithAuditContext(auditContext, () =>
          this.keycloakService.addUserToGroup(userId, groupId, realm)
        );
      } else if (action === 'remove') {
        await runWithAuditContext(auditContext, () =>
          this.keycloakService.removeUserFromGroup(userId, groupId, realm)
        );
      } else {
        const result = Result.error(`Invalid action: ${action}`, ErrorCode.INVALID_ARGUMENT);
        return this.handleResult(result);
      }

      const result = Result.ok({ message: `User ${action === 'add' ? 'added to' : 'removed from'} cluster group successfully` });
      return this.handleResult(result);
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to manage cluster group', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Delete a user from Keycloak
   * ลบผู้ใช้จาก Keycloak
   * @param payload - Payload with userId / ข้อมูลพร้อม userId
   * @returns Delete result / ผลการลบ
   */
  @MessagePattern({ cmd: 'keycloak.users.delete', service: 'keycloak' })
  async handleDeleteUser(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'handleDeleteUser', payload },
      KeycloakController.name,
    );
    try {
      const { userId, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      await runWithAuditContext(auditContext, () =>
        this.keycloakService.deleteUser(userId, realm)
      );
      const result = Result.ok({ message: 'User deleted from Keycloak successfully' });
      return this.handleResult(result);
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to delete user from Keycloak', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  /**
   * Get all users from Keycloak realm
   * ค้นหารายการผู้ใช้ทั้งหมดจาก Keycloak realm
   * @param payload - Payload with optional realm / ข้อมูลพร้อม realm (ถ้ามี)
   * @returns Array of all users / อาร์เรย์ของผู้ใช้ทั้งหมด
   */
  @MessagePattern({ cmd: 'keycloak.users.getAll', service: 'keycloak' })
  async handleGetAllUsers(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Failed to get users', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }

  // ==================== Change Password ====================

  /**
   * Change password: verify current password via login, then reset via Admin API
   * เปลี่ยนรหัสผ่าน: ตรวจสอบรหัสผ่านปัจจุบันก่อน แล้วรีเซ็ตผ่าน Admin API
   * @param payload - Payload with accessToken, currentPassword, and newPassword / ข้อมูลพร้อม accessToken, รหัสผ่านปัจจุบัน, และรหัสผ่านใหม่
   * @returns Change password result / ผลการเปลี่ยนรหัสผ่าน
   */
  @MessagePattern({ cmd: 'keycloak.auth.changePassword', service: 'keycloak' })
  async handleChangePassword(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'handleChangePassword' },
      KeycloakController.name,
    );
    try {
      const { accessToken, currentPassword, newPassword, userId, realm } = payload;
      const auditContext = this.createAuditContext(payload);
      const result = await runWithAuditContext(auditContext, () =>
        this.keycloakService.changePassword(accessToken, currentPassword, newPassword, userId, realm)
      );
      return this.handleResult(Result.ok(result));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      const isAuthError = message.includes('expired') || message.includes('invalid') || message.includes('401');
      const isInvalidPassword = message.includes('password is incorrect');
      const errorCode = isAuthError ? ErrorCode.UNAUTHENTICATED
        : isInvalidPassword ? ErrorCode.INVALID_ARGUMENT
        : ErrorCode.INTERNAL;
      const result = Result.error(message, errorCode);
      return this.handleResult(result);
    }
  }

  // ==================== Health Check ====================

  /**
   * Check Keycloak server health status
   * ตรวจสอบสถานะการทำงานของ Keycloak server
   * @returns Health status / สถานะสุขภาพ
   */
  @MessagePattern({ cmd: 'keycloak.health', service: 'keycloak' })
  async handleHealthCheck(): Promise<MicroserviceResponse> {
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
    } catch (error: unknown) {
      const result = Result.error(error instanceof Error ? error.message : 'Health check failed', ErrorCode.INTERNAL);
      return this.handleResult(result);
    }
  }
}
