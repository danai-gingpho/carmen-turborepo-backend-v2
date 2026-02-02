import { Injectable } from '@nestjs/common';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { envConfig } from '@/libs/config.env';
import {
  KeycloakTokenResponse,
  KeycloakUser,
  CreateKeycloakUserDto,
  UpdateKeycloakUserDto,
  KeycloakRole,
  KeycloakGroup,
  ResetPasswordDto,
  KeycloakAdminConfig,
  KeycloakUserInfo,
  ResetPasswordPayload,
} from './interface/keycloak.interface';

@Injectable()
export class KeycloakService {
  private readonly logger: BackendLogger = new BackendLogger(
    KeycloakService.name,
  );

  // Admin token cache (for admin API operations)
  private adminAccessToken: string | null = null;
  private adminTokenExpiry: number = 0;

  private readonly config: KeycloakAdminConfig = {
    baseUrl: envConfig.KEYCLOAK_BASE_URL,
    realm: envConfig.KEYCLOAK_REALM,
    clientId: envConfig.KEYCLOAK_CLIENT_ID,
    adminClientId: envConfig.KEYCLOAK_ADMIN_CLIENT_ID,
    adminClientSecret: envConfig.KEYCLOAK_ADMIN_CLIENT_SECRET,
    adminUsername: envConfig.KEYCLOAK_ADMIN_USERNAME,
    adminPassword: envConfig.KEYCLOAK_ADMIN_PASSWORD,
  };

  // ==================== Token Acquisition Methods ====================

  /**
   * Get admin token for Keycloak Admin API operations.
   * Uses admin credentials (username/password) to obtain a token with admin privileges.
   *
   * Required for:
   * - User CRUD operations (create, update, delete users)
   * - Password reset (force change password)
   * - Role management
   * - Group management
   * - Session management
   * - Any /admin/realms/... API calls
   */
  private async getAdminToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid
    if (this.adminAccessToken && this.adminTokenExpiry > now) {
      return this.adminAccessToken;
    }

    this.logger.debug('Fetching new admin token from Keycloak');

    const tokenUrl = `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', this.config.adminClientId);
    params.append('username', this.config.adminUsername || '');
    params.append('password', this.config.adminPassword || '');
    params.append('client_secret', this.config.adminClientSecret);

    console.log('Keycloak Admin Token Request Params:', params.toString());

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to get admin token: ${error}`);
      throw new Error(`Failed to get admin token: ${response.status}`);
    }

    const data: KeycloakTokenResponse = await response.json();
    this.adminAccessToken = data.access_token;
    this.adminTokenExpiry = now + data.expires_in * 1000 - 30000; // 30 second buffer

    return this.adminAccessToken;
  }

  /**
   * Get user token using Resource Owner Password Credentials grant.
   * This is used for user authentication (login).
   *
   * Uses the regular client_id (not admin) because this is for end-user authentication.
   *
   * Required for:
   * - User login (returns user's access_token and refresh_token)
   */
  private async getUserToken(
    username: string,
    password: string,
    realm?: string,
  ): Promise<KeycloakTokenResponse> {
    const targetRealm = realm || this.config.realm;
    const tokenUrl = `${this.config.baseUrl}/realms/${targetRealm}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', this.config.clientId); // User client, not admin
    params.append('username', username);
    params.append('password', password);
    params.append('scope', 'openid');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      this.logger.error(`Failed to get user token: ${JSON.stringify(error)}`);
      throw new Error(
        error.error_description || error.error || 'Authentication failed',
      );
    }

    return response.json();
  }

  // ==================== Admin API Request Helper ====================

  /**
   * Make authenticated requests to Keycloak Admin API.
   * Automatically uses getAdminToken() for authentication.
   *
   * All methods using this helper require ADMIN privileges:
   * - User Management: getUsers, getUserById, getUserByUsername, getUserByEmail,
   *   createUser, updateUser, deleteUser
   * - Password Management: resetPassword (force password change)
   * - BU Attribute Management: addUserBu, removeUserBu, getUserBuList, manageUserBu
   * - Role Management: getRealmRoles, getUserRoles, assignRealmRolesToUser, removeRealmRolesFromUser
   * - Group Management: getGroups, getGroupById, getUserGroups, addUserToGroup, removeUserFromGroup
   * - Session Management: getUserSessions, deleteUserSession, logout (admin logout)
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any,
    realm?: string,
  ): Promise<T> {
    const token = await this.getAdminToken();
    const targetRealm = realm || this.config.realm;
    const url = `${this.config.baseUrl}/admin/realms/${targetRealm}${path}`;

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    this.logger.debug(`Keycloak Admin API request: ${method} ${url}`);

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Keycloak Admin API error: ${response.status} - ${error}`);
      throw new Error(`Keycloak Admin API error: ${response.status} - ${error}`);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    return response.json();
  }

  // ==================== User Management (Admin Token Required) ====================

  async getUsers(realm?: string): Promise<KeycloakUser[]> {
    this.logger.log('Fetching all users from Keycloak');
    return this.request<KeycloakUser[]>('GET', '/users', undefined, realm);
  }

  async getUserById(userId: string, realm?: string): Promise<KeycloakUser> {
    this.logger.log(`Fetching user by ID: ${userId}`);
    return this.request<KeycloakUser>('GET', `/users/${userId}`, undefined, realm);
  }

  async getUserByUsername(
    username: string,
    realm?: string,
  ): Promise<KeycloakUser | null> {
    this.logger.log(`Fetching user by username: ${username}`);
    const users = await this.request<KeycloakUser[]>(
      'GET',
      `/users?username=${encodeURIComponent(username)}&exact=true`,
      undefined,
      realm,
    );
    return users.length > 0 ? users[0] : null;
  }

  async getUserByEmail(
    email: string,
    realm?: string,
  ): Promise<KeycloakUser | null> {
    this.logger.log(`Fetching user by email: ${email}`);
    const users = await this.request<KeycloakUser[]>(
      'GET',
      `/users?email=${encodeURIComponent(email)}&exact=true`,
      undefined,
      realm,
    );
    return users.length > 0 ? users[0] : null;
  }

  async createUser(
    userData: CreateKeycloakUserDto,
    realm?: string,
  ): Promise<string> {
    this.logger.log(`Creating user: ${userData.username}`);

    const token = await this.getAdminToken();
    const targetRealm = realm || this.config.realm;
    const url = `${this.config.baseUrl}/admin/realms/${targetRealm}/users`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to create user: ${error}`);
      throw new Error(`Failed to create user: ${response.status} - ${error}`);
    }

    const locationHeader = response.headers.get('Location');
    if (locationHeader) {
      const userId = locationHeader.split('/').pop();
      this.logger.log(`User created with ID: ${userId}`);
      return userId || '';
    }

    return '';
  }

  /**
   * Update user in Keycloak
   *
   * Strategy: GET full user → merge with update data → PUT full user back
   * This ensures we don't accidentally remove existing fields when doing partial updates.
   */
  async updateUser(
    userId: string,
    userData: UpdateKeycloakUserDto,
    realm?: string,
  ): Promise<void> {
    this.logger.log(`Updating user: ${userId}`);

    // 1. GET the current user (full JSON) to preserve existing data
    const currentUser = await this.getUserById(userId, realm);

    // 2. Merge the update data with existing data (update only provided fields)
    const mergedUser = {
      ...currentUser,
      ...userData,
      // Preserve attributes by merging them if both exist
      attributes: {
        ...currentUser.attributes,
        ...userData.attributes,
      },
    };

    // 3. Remove read-only fields before PUT
    const { id, createdTimestamp, ...updatePayload } = mergedUser as any;

    // 4. PUT the full user object back
    await this.request<void>('PUT', `/users/${userId}`, updatePayload, realm);
  }

  async deleteUser(userId: string, realm?: string): Promise<void> {
    this.logger.log(`Deleting user: ${userId}`);
    await this.request<void>('DELETE', `/users/${userId}`, undefined, realm);
  }

  async resetPassword(
    userId: string,
    password: string,
    temporary: boolean = false,
    realm?: string,
  ): Promise<void> {
    this.logger.log(`Resetting password for user: ${userId}`);
    const credential: ResetPasswordDto = {
      type: 'password',
      value: password,
      temporary,
    };
    await this.request<void>(
      'PUT',
      `/users/${userId}/reset-password`,
      credential,
      realm,
    );
  }

  // ==================== User BU Attribute Management (Admin Token Required) ====================

  /**
   * BU attribute structure:
   * { bu_id: string, bu_code: string, role: string }
   *
   * Keycloak stores attributes as Record<string, string[]>
   * Each BU is stored as a JSON string in the array
   */

  /**
   * Add a BU to user's bu attribute
   * If BU with same bu_id exists, it will be updated
   *
   * Strategy: GET full user → modify BU attribute → PUT full user back
   */
  async addUserBu(
    userId: string,
    bu: { bu_id: string; bu_code: string; role: string },
    realm?: string,
  ): Promise<void> {
    this.logger.log(`Adding BU '${bu.bu_code}' to user: ${userId}`);

    // 1. GET the current user (full JSON)
    const user = await this.getUserById(userId, realm);

    // 2. MODIFY the BU attribute locally
    const attributes = user.attributes || {};
    let buList: { bu_id: string; bu_code: string; role: string }[] = [];

    if (attributes['BusinessUnit'] && attributes['BusinessUnit'].length > 0) {
      try {
        buList = attributes['BusinessUnit'].map((item: string) => JSON.parse(item));
      } catch {
        this.logger.warn('Failed to parse existing BU attribute, resetting');
        buList = [];
      }
    }

    // Check if BU already exists (by bu_id)
    const existingIndex = buList.findIndex((b) => b.bu_id === bu.bu_id);
    if (existingIndex >= 0) {
      buList[existingIndex] = bu;
      this.logger.log(`Updated existing BU '${bu.bu_code}' for user: ${userId}`);
    } else {
      buList.push(bu);
      this.logger.log(`Added new BU '${bu.bu_code}' to user: ${userId}`);
    }

    // Update the BU attribute in the user object
    user.attributes = user.attributes || {};
    user.attributes['BusinessUnit'] = buList.map((b) => JSON.stringify(b));

    // 3. PUT the full user object back (remove read-only fields)
    const { id, createdTimestamp, ...updatePayload } = user as any;
    await this.request<void>('PUT', `/users/${userId}`, updatePayload, realm);
  }

  /**
   * Remove a BU from user's bu attribute by bu_id
   *
   * Strategy: GET full user → modify BU attribute → PUT full user back
   */
  async removeUserBu(
    userId: string,
    buId: string,
    realm?: string,
  ): Promise<void> {
    this.logger.log(`Removing BU '${buId}' from user: ${userId}`);

    // 1. GET the current user (full JSON)
    const user = await this.getUserById(userId, realm);

    // Check if BU attribute exists
    if (!user.attributes || !user.attributes['BusinessUnit'] || user.attributes['BusinessUnit'].length === 0) {
      this.logger.log(`No BU attribute found on user: ${userId}`);
      return;
    }

    // 2. MODIFY the BU attribute locally
    let buList: { bu_id: string; bu_code: string; role: string }[] = [];
    try {
      buList = user.attributes['BusinessUnit'].map((item: string) => JSON.parse(item));
    } catch {
      this.logger.warn('Failed to parse BU attribute');
      return;
    }

    const filteredList = buList.filter((b) => b.bu_id !== buId);

    if (filteredList.length === buList.length) {
      this.logger.log(`BU '${buId}' not found on user: ${userId}`);
      return;
    }

    // Update or remove the BU attribute
    if (filteredList.length === 0) {
      delete user.attributes['BusinessUnit'];
    } else {
      user.attributes['BusinessUnit'] = filteredList.map((b) => JSON.stringify(b));
    }

    // 3. PUT the full user object back (remove read-only fields)
    const { id, createdTimestamp, ...updatePayload } = user as any;
    await this.request<void>('PUT', `/users/${userId}`, updatePayload, realm);
    this.logger.log(`BU '${buId}' removed from user: ${userId}`);
  }

  /**
   * Get user's BU list
   */
  async getUserBuList(
    userId: string,
    realm?: string,
  ): Promise<{ bu_id: string; bu_code: string; role: string }[]> {
    const user = await this.getUserById(userId, realm);

    if (!user.attributes || !user.attributes['BusinessUnit'] || user.attributes['BusinessUnit'].length === 0) {
      return [];
    }

    try {
      return user.attributes['BusinessUnit'].map((item: string) => JSON.parse(item));
    } catch {
      this.logger.warn('Failed to parse BU attribute');
      return [];
    }
  }

  /**
   * Manage user BU attribute (add or remove)
   * @param action 'add' | 'remove'
   * @param bu For 'add': { bu_id, bu_code, role }, For 'remove': { bu_id }
   */
  async manageUserBu(
    userId: string,
    action: 'add' | 'remove',
    bu: { bu_id: string; bu_code?: string; role?: string },
    realm?: string,
  ): Promise<void> {
    if (action === 'add') {
      if (!bu.bu_code || !bu.role) {
        throw new Error('bu_code and role are required for add action');
      }
      await this.addUserBu(
        userId,
        { bu_id: bu.bu_id, bu_code: bu.bu_code, role: bu.role },
        realm,
      );
    } else if (action === 'remove') {
      await this.removeUserBu(userId, bu.bu_id, realm);
    } else {
      throw new Error(`Invalid action: ${action}`);
    }
  }

  // ==================== Role Management (Admin Token Required) ====================

  async getRealmRoles(realm?: string): Promise<KeycloakRole[]> {
    this.logger.log('Fetching realm roles');
    return this.request<KeycloakRole[]>('GET', '/roles', undefined, realm);
  }

  async getUserRoles(userId: string, realm?: string): Promise<KeycloakRole[]> {
    this.logger.log(`Fetching roles for user: ${userId}`);
    return this.request<KeycloakRole[]>(
      'GET',
      `/users/${userId}/role-mappings/realm`,
      undefined,
      realm,
    );
  }

  async assignRealmRolesToUser(
    userId: string,
    roles: KeycloakRole[],
    realm?: string,
  ): Promise<void> {
    this.logger.log(`Assigning realm roles to user: ${userId}`);
    await this.request<void>(
      'POST',
      `/users/${userId}/role-mappings/realm`,
      roles,
      realm,
    );
  }

  async removeRealmRolesFromUser(
    userId: string,
    roles: KeycloakRole[],
    realm?: string,
  ): Promise<void> {
    this.logger.log(`Removing realm roles from user: ${userId}`);
    await this.request<void>(
      'DELETE',
      `/users/${userId}/role-mappings/realm`,
      roles,
      realm,
    );
  }

  // ==================== Group Management (Admin Token Required) ====================

  async getGroups(realm?: string): Promise<KeycloakGroup[]> {
    this.logger.log('Fetching all groups');
    return this.request<KeycloakGroup[]>('GET', '/groups', undefined, realm);
  }

  async getGroupById(groupId: string, realm?: string): Promise<KeycloakGroup> {
    this.logger.log(`Fetching group by ID: ${groupId}`);
    return this.request<KeycloakGroup>(
      'GET',
      `/groups/${groupId}`,
      undefined,
      realm,
    );
  }

  async getUserGroups(userId: string, realm?: string): Promise<KeycloakGroup[]> {
    this.logger.log(`Fetching groups for user: ${userId}`);
    return this.request<KeycloakGroup[]>(
      'GET',
      `/users/${userId}/groups`,
      undefined,
      realm,
    );
  }

  async addUserToGroup(
    userId: string,
    groupId: string,
    realm?: string,
  ): Promise<void> {
    this.logger.log(`Adding user ${userId} to group ${groupId}`);
    await this.request<void>(
      'PUT',
      `/users/${userId}/groups/${groupId}`,
      undefined,
      realm,
    );
  }

  async removeUserFromGroup(
    userId: string,
    groupId: string,
    realm?: string,
  ): Promise<void> {
    this.logger.log(`Removing user ${userId} from group ${groupId}`);
    await this.request<void>(
      'DELETE',
      `/users/${userId}/groups/${groupId}`,
      undefined,
      realm,
    );
  }

  // ==================== Authentication (User Token - No Admin Required) ====================
  // These methods use the USER client_id for end-user authentication.
  // They do NOT require admin credentials - they work with user's own credentials or tokens.

  /**
   * Authenticate a user and get their tokens.
   * Uses getUserToken internally with the regular client_id (not admin).
   *
   * This is a standard OIDC Resource Owner Password Credentials flow.
   */
  async login(
    email: string,
    password: string,
    realm?: string,
  ): Promise<KeycloakTokenResponse> {
    this.logger.log(`User login attempt: ${email}`);

    const data = await this.getUserToken(email, password, realm);
    this.logger.log(`Login successful for ${email}`);
    return data;
  }

  /**
   * Logout user using their refresh token.
   * Uses the user client_id (not admin) - this is an OIDC logout endpoint.
   */
  async logoutWithRefreshToken(
    refreshToken: string,
    realm?: string,
  ): Promise<void> {
    this.logger.log('Logout with refresh token');
    const targetRealm = realm || this.config.realm;
    const logoutUrl = `${this.config.baseUrl}/realms/${targetRealm}/protocol/openid-connect/logout`;

    const params = new URLSearchParams();
    params.append('client_id', this.config.clientId);
    params.append('client_secret', this.config.adminClientSecret);
    params.append('refresh_token', refreshToken);

    const response = await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Logout failed: ${error}`);
      throw new Error(`Logout failed: ${response.status}`);
    }

    this.logger.log('Logout successful');
  }


  // async changeUserPassword(
  //   userId: string,
  //   newPassword: string,
  //   temporary = false,
  //   realm?: string,
  // ) {
  //   const adminToken = await this.getAdminToken();

  //   const payload: ResetPasswordPayload = {
  //     type: 'password',
  //     value: newPassword,
  //     temporary, // true = user must change on next login
  //   };

  //   const targetRealm = realm || this.config.realm;
  //   const resetPasswordUrl = `${this.config.baseUrl}/admin/realms/${targetRealm}/users/${userId}/reset-password`;

  //   const response = await fetch(
  //     resetPasswordUrl,
  //     {
  //       method: 'PUT',
  //       headers: {
  //         'Authorization': `Bearer ${adminToken}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(payload),
  //     }
  //   );

  //   if (response.status === 204) {
  //     return { success: true };
  //   }

  //   const error = await response.json();
  //   throw new Error(error.errorMessage || 'Password reset failed');
  // }

  /**
   * Logout user by their ID using admin token.
   * This is an admin operation and requires admin credentials.
   */
  async logoutUserById(userId: string, realm?: string) {
    // First get admin token
    const adminToken = await this.getAdminToken();

    this.logger.log(`Logout user by ID: ${userId}`);

    const targetRealm = realm || this.config.realm;
    const logoutUrl = `${this.config.baseUrl}/admin/realms/${targetRealm}/users/${userId}/logout`;

    const response = await fetch(
      logoutUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Logout failed: ${error}`);
      throw new Error(`Logout failed: ${response.status}`);
    }

    this.logger.log('Logout successful');
    return response.status === 204; // Success
  }

  /**
   * Refresh user's access token using their refresh token.
   * Uses the user client_id (not admin) - this is an OIDC token refresh.
   */
  async refreshToken(
    refreshToken: string,
    realm?: string,
  ): Promise<KeycloakTokenResponse> {
    this.logger.log('Refreshing token');
    const targetRealm = realm || this.config.realm;
    const tokenUrl = `${this.config.baseUrl}/realms/${targetRealm}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', this.config.clientId);
    params.append('refresh_token', refreshToken);
    params.append('scope', 'openid');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      this.logger.error(`Token refresh failed: ${JSON.stringify(error)}`);
      throw new Error(
        error.error_description || error.error || 'Token refresh failed',
      );
    }

    const data: KeycloakTokenResponse = await response.json();
    this.logger.log('Token refresh successful');
    return data;
  }

  // ==================== Token Management (User Token - No Admin Required) ====================
  // Token introspection uses client credentials but doesn't need admin privileges

  /**
   * Verify/introspect a token.
   * Uses client credentials to introspect - does NOT require admin token.
   */
  async verifyToken(token: string, realm?: string): Promise<any> {
    const targetRealm = realm || this.config.realm;
    const introspectUrl = `${this.config.baseUrl}/realms/${targetRealm}/protocol/openid-connect/token/introspect`;

    const params = new URLSearchParams();
    params.append('token', token);
    params.append('client_id', this.config.clientId);

    const response = await fetch(introspectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Token verification failed: ${error}`);
      throw new Error(`Token verification failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Force logout a user by userId (Admin API).
   * Requires ADMIN token - this terminates all sessions for the user.
   */
  async logout(userId: string, realm?: string): Promise<void> {
    this.logger.log(`Logging out user: ${userId}`);
    await this.request<void>(
      'POST',
      `/users/${userId}/logout`,
      undefined,
      realm,
    );
  }

  // ==================== Session Management (Admin Token Required) ====================

  async getUserSessions(userId: string, realm?: string): Promise<any[]> {
    this.logger.log(`Fetching sessions for user: ${userId}`);
    return this.request<any[]>(
      'GET',
      `/users/${userId}/sessions`,
      undefined,
      realm,
    );
  }

  async deleteUserSession(sessionId: string, realm?: string): Promise<void> {
    this.logger.log(`Deleting session: ${sessionId}`);
    await this.request<void>(
      'DELETE',
      `/sessions/${sessionId}`,
      undefined,
      realm,
    );
  }

  // ==================== User Info (User Token - No Admin Required) ====================

  /**
   * Get user info from access token via userinfo endpoint.
   * Uses the user's own access token directly - does NOT require admin token.
   * This is a standard OIDC userinfo endpoint.
   */
  async getUserInfo(
    accessToken: string,
    realm?: string,
  ): Promise<KeycloakUserInfo> {
    const targetRealm = realm || this.config.realm;
    const userInfoUrl = `${this.config.baseUrl}/realms/${targetRealm}/protocol/openid-connect/userinfo`;

    this.logger.debug(`Fetching user info from Keycloak userinfo endpoint`);

    const response = await fetch(userInfoUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to get user info: ${error}`);
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    const userInfo: KeycloakUserInfo = await response.json();
    this.logger.debug(`User info fetched successfully for user: ${userInfo.sub}`);
    return userInfo;
  }

  // ==================== Health Check (No Auth Required) ====================

  /**
   * Check Keycloak server health.
   * Uses public .well-known endpoint - no authentication required.
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const url = `${this.config.baseUrl}/realms/${this.config.realm}/.well-known/openid-configuration`;

      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
        };
      }

      this.logger.warn(`Keycloak health check returned status: ${response.status}`);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Keycloak health check failed: ${errorMessage}`);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
