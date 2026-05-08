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

/** Keycloak token introspection response */
interface KeycloakTokenIntrospection {
  active: boolean;
  sub?: string;
  exp?: number;
  iat?: number;
  aud?: string | string[];
  typ?: string;
  [key: string]: unknown;
}

/** Keycloak user session info */
interface KeycloakUserSession {
  id: string;
  username?: string;
  userId?: string;
  ipAddress?: string;
  start?: number;
  lastAccess?: number;
  clients?: Record<string, string>;
  [key: string]: unknown;
}

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
    clientSecret: envConfig.KEYCLOAK_CLIENT_SECRET,
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

    const tokenUrl = `${this.config.baseUrl}/realms/master/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', this.config.adminClientId || 'admin-cli');
    params.append('username', this.config.adminUsername || '');
    params.append('password', this.config.adminPassword || '');
    if (this.config.adminClientSecret) {
      params.append('client_secret', this.config.adminClientSecret);
    }

    this.logger.debug(`Fetching new admin token from Keycloak: ${tokenUrl}`);
    this.logger.debug(`Params: ${params.toString()}`);

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
    params.append('username', username.toLowerCase());
    params.append('password', password);
    params.append('scope', 'openid');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    console.log('getUserToken response status:', response);
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
    body?: Record<string, unknown> | unknown[] | object,
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
      this.logger.error(
        `Keycloak Admin API error: ${response.status} - ${error}`,
      );
      throw new Error(
        `Keycloak Admin API error: ${response.status} - ${error}`,
      );
    }

    if (
      response.status === 204 ||
      response.headers.get('content-length') === '0'
    ) {
      return {} as T;
    }

    return response.json();
  }

  // ==================== User Management (Admin Token Required) ====================

  /**
   * Get all users from Keycloak realm
   * ค้นหารายการผู้ใช้ทั้งหมดจาก Keycloak realm
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Array of Keycloak users / อาร์เรย์ของผู้ใช้ Keycloak
   */
  async getUsers(realm?: string): Promise<KeycloakUser[]> {
    this.logger.log('Fetching all users from Keycloak');
    return this.request<KeycloakUser[]>('GET', '/users', undefined, realm);
  }

  /**
   * Get a user by their Keycloak ID
   * ค้นหารายการเดียวตาม ID ผู้ใช้ใน Keycloak
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Keycloak user / ผู้ใช้ Keycloak
   */
  async getUserById(userId: string, realm?: string): Promise<KeycloakUser> {
    this.logger.log(`Fetching user by ID: ${userId}`);
    return this.request<KeycloakUser>(
      'GET',
      `/users/${userId}`,
      undefined,
      realm,
    );
  }

  /**
   * Get a user by their username
   * ค้นหาผู้ใช้ตามชื่อผู้ใช้
   * @param username - Username to search / ชื่อผู้ใช้ที่ต้องการค้นหา
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Keycloak user or null if not found / ผู้ใช้ Keycloak หรือ null ถ้าไม่พบ
   */
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

  /**
   * Get a user by their email address
   * ค้นหาผู้ใช้ตามอีเมล
   * @param email - Email address to search / อีเมลที่ต้องการค้นหา
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Keycloak user or null if not found / ผู้ใช้ Keycloak หรือ null ถ้าไม่พบ
   */
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

  /**
   * Create a new user in Keycloak
   * สร้างผู้ใช้ใหม่ใน Keycloak
   * @param userData - User creation data / ข้อมูลสำหรับสร้างผู้ใช้
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Created user ID / ID ผู้ใช้ที่สร้างแล้ว
   */
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
   * Update user in Keycloak using GET-merge-PUT strategy
   * อัปเดตผู้ใช้ใน Keycloak โดยใช้กลยุทธ์ GET-merge-PUT
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param userData - Partial user data to update / ข้อมูลผู้ใช้บางส่วนที่ต้องการอัปเดต
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
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
    const { id, createdTimestamp, ...updatePayload } = mergedUser as Record<
      string,
      unknown
    >;

    // 4. PUT the full user object back
    await this.request<void>('PUT', `/users/${userId}`, updatePayload, realm);
  }

  /**
   * Delete a user from Keycloak
   * ลบผู้ใช้จาก Keycloak
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   */
  async deleteUser(userId: string, realm?: string): Promise<void> {
    this.logger.log(`Deleting user: ${userId}`);
    await this.request<void>('DELETE', `/users/${userId}`, undefined, realm);
  }

  /**
   * Reset user password in Keycloak
   * รีเซ็ตรหัสผ่านผู้ใช้ใน Keycloak
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param password - New password / รหัสผ่านใหม่
   * @param temporary - Whether password is temporary (user must change on next login) / รหัสผ่านเป็นแบบชั่วคราวหรือไม่
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   */
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
   * Add a BU to user's bu attribute. If BU with same bu_id exists, it will be updated
   * เพิ่มหน่วยธุรกิจให้ผู้ใช้ ถ้ามี bu_id ซ้ำจะอัปเดตแทน
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param bu - Business unit data / ข้อมูลหน่วยธุรกิจ
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
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
        buList = attributes['BusinessUnit'].map((item: string) =>
          JSON.parse(item),
        );
      } catch {
        this.logger.warn('Failed to parse existing BU attribute, resetting');
        buList = [];
      }
    }

    // Check if BU already exists (by bu_id)
    const existingIndex = buList.findIndex((b) => b.bu_id === bu.bu_id);
    if (existingIndex >= 0) {
      buList[existingIndex] = bu;
      this.logger.log(
        `Updated existing BU '${bu.bu_code}' for user: ${userId}`,
      );
    } else {
      buList.push(bu);
      this.logger.log(`Added new BU '${bu.bu_code}' to user: ${userId}`);
    }

    // Update the BU attribute in the user object
    user.attributes = user.attributes || {};
    user.attributes['BusinessUnit'] = buList.map((b) => JSON.stringify(b));

    // 3. PUT the full user object back (remove read-only fields)
    const { id, createdTimestamp, ...updatePayload } =
      user as unknown as Record<string, unknown>;
    await this.request<void>('PUT', `/users/${userId}`, updatePayload, realm);
  }

  /**
   * Remove a BU from user's bu attribute by bu_id
   * ลบหน่วยธุรกิจจากผู้ใช้ตาม bu_id
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param buId - Business unit ID to remove / ID หน่วยธุรกิจที่ต้องการลบ
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
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
    if (
      !user.attributes ||
      !user.attributes['BusinessUnit'] ||
      user.attributes['BusinessUnit'].length === 0
    ) {
      this.logger.log(`No BU attribute found on user: ${userId}`);
      return;
    }

    // 2. MODIFY the BU attribute locally
    let buList: { bu_id: string; bu_code: string; role: string }[] = [];
    try {
      buList = user.attributes['BusinessUnit'].map((item: string) =>
        JSON.parse(item),
      );
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
      user.attributes['BusinessUnit'] = filteredList.map((b) =>
        JSON.stringify(b),
      );
    }

    // 3. PUT the full user object back (remove read-only fields)
    const { id, createdTimestamp, ...updatePayload } =
      user as unknown as Record<string, unknown>;
    await this.request<void>('PUT', `/users/${userId}`, updatePayload, realm);
    this.logger.log(`BU '${buId}' removed from user: ${userId}`);
  }

  /**
   * Get user's BU list from Keycloak attributes
   * ค้นหารายการหน่วยธุรกิจทั้งหมดของผู้ใช้จาก Keycloak attributes
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Array of BU objects / อาร์เรย์ของอ็อบเจกต์หน่วยธุรกิจ
   */
  async getUserBuList(
    userId: string,
    realm?: string,
  ): Promise<{ bu_id: string; bu_code: string; role: string }[]> {
    const user = await this.getUserById(userId, realm);

    if (
      !user.attributes ||
      !user.attributes['BusinessUnit'] ||
      user.attributes['BusinessUnit'].length === 0
    ) {
      return [];
    }

    try {
      return user.attributes['BusinessUnit'].map((item: string) =>
        JSON.parse(item),
      );
    } catch {
      this.logger.warn('Failed to parse BU attribute');
      return [];
    }
  }

  /**
   * Manage user BU attribute (add or remove)
   * จัดการ attribute หน่วยธุรกิจของผู้ใช้ (เพิ่มหรือลบ)
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param action - 'add' or 'remove' / 'add' หรือ 'remove'
   * @param bu - BU data. For 'add': { bu_id, bu_code, role }, For 'remove': { bu_id } / ข้อมูลหน่วยธุรกิจ
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
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

  // ==================== User Cluster Attribute Management (Admin Token Required) ====================

  /**
   * Cluster attribute structure:
   * { cluster_id: string, cluster_code: string, role: string }
   *
   * Keycloak stores attributes as Record<string, string[]>
   * Each Cluster is stored as a JSON string in the array
   */

  /**
   * Add a Cluster to user's Cluster attribute. If same cluster_id exists, it will be updated
   * เพิ่ม Cluster ให้ผู้ใช้ ถ้ามี cluster_id ซ้ำจะอัปเดตแทน
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param cluster - Cluster data / ข้อมูล Cluster
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   */
  async addUserCluster(
    userId: string,
    cluster: { cluster_id: string; cluster_code: string; role: string },
    realm?: string,
  ): Promise<void> {
    this.logger.log(
      `Adding Cluster '${cluster.cluster_code}' to user: ${userId}`,
    );

    const user = await this.getUserById(userId, realm);

    const attributes = user.attributes || {};
    let clusterList: {
      cluster_id: string;
      cluster_code: string;
      role: string;
    }[] = [];

    if (attributes['Cluster'] && attributes['Cluster'].length > 0) {
      try {
        clusterList = attributes['Cluster'].map((item: string) =>
          JSON.parse(item),
        );
      } catch {
        this.logger.warn(
          'Failed to parse existing Cluster attribute, resetting',
        );
        clusterList = [];
      }
    }

    const existingIndex = clusterList.findIndex(
      (c) => c.cluster_id === cluster.cluster_id,
    );
    if (existingIndex >= 0) {
      clusterList[existingIndex] = cluster;
      this.logger.log(
        `Updated existing Cluster '${cluster.cluster_code}' for user: ${userId}`,
      );
    } else {
      clusterList.push(cluster);
      this.logger.log(
        `Added new Cluster '${cluster.cluster_code}' to user: ${userId}`,
      );
    }

    user.attributes = user.attributes || {};
    user.attributes['Cluster'] = clusterList.map((c) => JSON.stringify(c));

    const { id, createdTimestamp, ...updatePayload } =
      user as unknown as Record<string, unknown>;
    await this.request<void>('PUT', `/users/${userId}`, updatePayload, realm);
  }

  /**
   * Remove a Cluster from user's Cluster attribute by cluster_id
   * ลบ Cluster จากผู้ใช้ตาม cluster_id
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param clusterId - Cluster ID to remove / ID Cluster ที่ต้องการลบ
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   */
  async removeUserCluster(
    userId: string,
    clusterId: string,
    realm?: string,
  ): Promise<void> {
    this.logger.log(`Removing Cluster '${clusterId}' from user: ${userId}`);

    const user = await this.getUserById(userId, realm);

    if (
      !user.attributes ||
      !user.attributes['Cluster'] ||
      user.attributes['Cluster'].length === 0
    ) {
      this.logger.log(`No Cluster attribute found on user: ${userId}`);
      return;
    }

    let clusterList: {
      cluster_id: string;
      cluster_code: string;
      role: string;
    }[] = [];
    try {
      clusterList = user.attributes['Cluster'].map((item: string) =>
        JSON.parse(item),
      );
    } catch {
      this.logger.warn('Failed to parse Cluster attribute');
      return;
    }

    const filteredList = clusterList.filter((c) => c.cluster_id !== clusterId);

    if (filteredList.length === clusterList.length) {
      this.logger.log(`Cluster '${clusterId}' not found on user: ${userId}`);
      return;
    }

    if (filteredList.length === 0) {
      delete user.attributes['Cluster'];
    } else {
      user.attributes['Cluster'] = filteredList.map((c) => JSON.stringify(c));
    }

    const { id, createdTimestamp, ...updatePayload } =
      user as unknown as Record<string, unknown>;
    await this.request<void>('PUT', `/users/${userId}`, updatePayload, realm);
    this.logger.log(`Cluster '${clusterId}' removed from user: ${userId}`);
  }

  /**
   * Get user's Cluster list from Keycloak attributes
   * ค้นหารายการ Cluster ทั้งหมดของผู้ใช้จาก Keycloak attributes
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Array of Cluster objects / อาร์เรย์ของอ็อบเจกต์ Cluster
   */
  async getUserClusterList(
    userId: string,
    realm?: string,
  ): Promise<{ cluster_id: string; cluster_code: string; role: string }[]> {
    const user = await this.getUserById(userId, realm);

    if (
      !user.attributes ||
      !user.attributes['Cluster'] ||
      user.attributes['Cluster'].length === 0
    ) {
      return [];
    }

    try {
      return user.attributes['Cluster'].map((item: string) => JSON.parse(item));
    } catch {
      this.logger.warn('Failed to parse Cluster attribute');
      return [];
    }
  }

  /**
   * Manage user Cluster attribute (add or remove)
   * จัดการ attribute Cluster ของผู้ใช้ (เพิ่มหรือลบ)
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param action - 'add' or 'remove' / 'add' หรือ 'remove'
   * @param cluster - Cluster data. For 'add': { cluster_id, cluster_code, role }, For 'remove': { cluster_id } / ข้อมูล Cluster
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   */
  async manageUserCluster(
    userId: string,
    action: 'add' | 'remove',
    cluster: { cluster_id: string; cluster_code?: string; role?: string },
    realm?: string,
  ): Promise<void> {
    if (action === 'add') {
      if (!cluster.cluster_code || !cluster.role) {
        throw new Error('cluster_code and role are required for add action');
      }
      await this.addUserCluster(
        userId,
        {
          cluster_id: cluster.cluster_id,
          cluster_code: cluster.cluster_code,
          role: cluster.role,
        },
        realm,
      );
    } else if (action === 'remove') {
      await this.removeUserCluster(userId, cluster.cluster_id, realm);
    } else {
      throw new Error(`Invalid action: ${action}`);
    }
  }

  // ==================== Role Management (Admin Token Required) ====================

  /**
   * Get all realm roles from Keycloak
   * ค้นหารายการ role ทั้งหมดจาก Keycloak realm
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Array of realm roles / อาร์เรย์ของ role
   */
  async getRealmRoles(realm?: string): Promise<KeycloakRole[]> {
    this.logger.log('Fetching realm roles');
    return this.request<KeycloakRole[]>('GET', '/roles', undefined, realm);
  }

  /**
   * Get roles assigned to a user
   * ค้นหารายการ role ทั้งหมดที่กำหนดให้ผู้ใช้
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Array of user roles / อาร์เรย์ของ role ผู้ใช้
   */
  async getUserRoles(userId: string, realm?: string): Promise<KeycloakRole[]> {
    this.logger.log(`Fetching roles for user: ${userId}`);
    return this.request<KeycloakRole[]>(
      'GET',
      `/users/${userId}/role-mappings/realm`,
      undefined,
      realm,
    );
  }

  /**
   * Assign realm roles to a user
   * กำหนด role ให้ผู้ใช้
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param roles - Roles to assign / role ที่ต้องการกำหนด
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   */
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

  /**
   * Remove realm roles from a user
   * ลบ role จากผู้ใช้
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param roles - Roles to remove / role ที่ต้องการลบ
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   */
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

  /**
   * Get all groups from Keycloak
   * ค้นหารายการกลุ่มทั้งหมดจาก Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Array of groups / อาร์เรย์ของกลุ่ม
   */
  async getGroups(realm?: string): Promise<KeycloakGroup[]> {
    this.logger.log('Fetching all groups');
    return this.request<KeycloakGroup[]>('GET', '/groups', undefined, realm);
  }

  /**
   * Get a group by its ID
   * ค้นหารายการเดียวตาม ID กลุ่ม
   * @param groupId - Keycloak group ID / ID กลุ่ม Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Keycloak group / กลุ่ม Keycloak
   */
  async getGroupById(groupId: string, realm?: string): Promise<KeycloakGroup> {
    this.logger.log(`Fetching group by ID: ${groupId}`);
    return this.request<KeycloakGroup>(
      'GET',
      `/groups/${groupId}`,
      undefined,
      realm,
    );
  }

  /**
   * Get groups assigned to a user
   * ค้นหารายการกลุ่มทั้งหมดที่กำหนดให้ผู้ใช้
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Array of user groups / อาร์เรย์ของกลุ่มผู้ใช้
   */
  async getUserGroups(
    userId: string,
    realm?: string,
  ): Promise<KeycloakGroup[]> {
    this.logger.log(`Fetching groups for user: ${userId}`);
    return this.request<KeycloakGroup[]>(
      'GET',
      `/users/${userId}/groups`,
      undefined,
      realm,
    );
  }

  /**
   * Add a user to a group in Keycloak
   * เพิ่มผู้ใช้เข้ากลุ่มใน Keycloak
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param groupId - Keycloak group ID / ID กลุ่ม Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   */
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

  /**
   * Remove a user from a group in Keycloak
   * ลบผู้ใช้ออกจากกลุ่มใน Keycloak
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param groupId - Keycloak group ID / ID กลุ่ม Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   */
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
   * Authenticate a user and get their tokens via OIDC Resource Owner Password Credentials flow
   * ยืนยันตัวตนผู้ใช้และรับ token ผ่าน OIDC Resource Owner Password Credentials flow
   * @param email - User email / อีเมลผู้ใช้
   * @param password - User password / รหัสผ่านผู้ใช้
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Token response with access and refresh tokens / response ที่มี access และ refresh token
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
   * Logout user using their refresh token via OIDC logout endpoint
   * ออกจากระบบผู้ใช้โดยใช้ refresh token ผ่าน OIDC logout endpoint
   * @param refreshToken - User's refresh token / refresh token ของผู้ใช้
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
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
    if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret);
    }
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
   * Logout user by their ID using admin token (admin operation)
   * ออกจากระบบผู้ใช้ตาม ID โดยใช้ admin token (ต้องใช้สิทธิ์ admin)
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns True if logout successful / true ถ้าออกจากระบบสำเร็จ
   */
  async logoutUserById(userId: string, realm?: string) {
    // First get admin token
    const adminToken = await this.getAdminToken();

    this.logger.log(`Logout user by ID: ${userId}`);

    const targetRealm = realm || this.config.realm;
    const logoutUrl = `${this.config.baseUrl}/admin/realms/${targetRealm}/users/${userId}/logout`;

    const response = await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Logout failed: ${error}`);
      throw new Error(`Logout failed: ${response.status}`);
    }

    this.logger.log('Logout successful');
    return response.status === 204; // Success
  }

  /**
   * Refresh user's access token using their refresh token via OIDC token refresh
   * รีเฟรช access token ของผู้ใช้โดยใช้ refresh token ผ่าน OIDC token refresh
   * @param refreshToken - User's refresh token / refresh token ของผู้ใช้
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns New token response / token response ใหม่
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
   * Verify/introspect a token using client credentials (no admin token required)
   * ตรวจสอบ/introspect token โดยใช้ client credentials (ไม่ต้องใช้ admin token)
   * @param token - Token to verify / token ที่ต้องการตรวจสอบ
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Token introspection result / ผลการตรวจสอบ token
   */
  async verifyToken(
    token: string,
    realm?: string,
  ): Promise<KeycloakTokenIntrospection> {
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
   * Force logout a user by userId via Admin API (terminates all sessions)
   * บังคับออกจากระบบผู้ใช้ตาม userId ผ่าน Admin API (ยกเลิกทุก session)
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
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

  /**
   * Get active sessions for a user
   * ค้นหารายการ session ที่ใช้งานอยู่ทั้งหมดของผู้ใช้
   * @param userId - Keycloak user ID / ID ผู้ใช้ Keycloak
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Array of user sessions / อาร์เรย์ของ session ผู้ใช้
   */
  async getUserSessions(
    userId: string,
    realm?: string,
  ): Promise<KeycloakUserSession[]> {
    this.logger.log(`Fetching sessions for user: ${userId}`);
    return this.request<KeycloakUserSession[]>(
      'GET',
      `/users/${userId}/sessions`,
      undefined,
      realm,
    );
  }

  /**
   * Delete a specific user session
   * ลบ session ของผู้ใช้ที่ระบุ
   * @param sessionId - Session ID to delete / ID session ที่ต้องการลบ
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   */
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
   * Get user info from access token via OIDC userinfo endpoint (no admin token required)
   * ดึงข้อมูลผู้ใช้จาก access token ผ่าน OIDC userinfo endpoint (ไม่ต้องใช้ admin token)
   * @param accessToken - User's access token / access token ของผู้ใช้
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns User info / ข้อมูลผู้ใช้
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
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to get user info: ${error}`);
      if (response.status === 401) {
        throw new Error('Access token is expired or invalid');
      }
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    const userInfo: KeycloakUserInfo = await response.json();
    this.logger.debug(
      `User info fetched successfully for user: ${userInfo.sub}`,
    );
    return userInfo;
  }

  // ==================== Change Password ====================

  /**
   * Change password by verifying current password via login, then reset via Admin API
   * เปลี่ยนรหัสผ่านโดยตรวจสอบรหัสผ่านปัจจุบันก่อน แล้วรีเซ็ตผ่าน Admin API
   * @param accessToken - User's current access token / access token ปัจจุบันของผู้ใช้
   * @param currentPassword - Current password for verification / รหัสผ่านปัจจุบันสำหรับตรวจสอบ
   * @param newPassword - New password to set / รหัสผ่านใหม่ที่ต้องการตั้ง
   * @param userId - Optional Keycloak user ID (falls back to token sub) / ID ผู้ใช้ Keycloak (ถ้ามี)
   * @param realm - Optional realm name / ชื่อ realm (ถ้ามี)
   * @returns Success status / สถานะสำเร็จ
   */
  async changePassword(
    accessToken: string,
    currentPassword: string,
    newPassword: string,
    userId?: string,
    realm?: string,
  ): Promise<{ success: boolean }> {
    this.logger.log('Changing password: verifying current password');

    // 1. Get user email from access token
    const userInfo = await this.getUserInfo(accessToken, realm);
    const email = userInfo.email || userInfo.preferred_username;
    const keycloakUserId = userId || userInfo.sub;

    if (!email) {
      throw new Error('Unable to determine user email from token');
    }

    if (!keycloakUserId) {
      throw new Error('Unable to determine user ID from token');
    }

    // 2. Verify current password by attempting login
    const targetRealm = realm || this.config.realm;
    const tokenUrl = `${this.config.baseUrl}/realms/${targetRealm}/protocol/openid-connect/token`;

    const loginParams = new URLSearchParams();
    loginParams.append('grant_type', 'password');
    loginParams.append('client_id', this.config.clientId);
    loginParams.append('username', email);
    loginParams.append('password', currentPassword);

    try {
      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginParams.toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (!tokenRes.ok) {
        throw new Error('Login failed');
      }
    } catch {
      throw new Error('Current password is incorrect');
    }

    // 3. Set new password via Admin API (bypasses Account API scope issues)
    await this.resetPassword(keycloakUserId, newPassword, false, realm);

    this.logger.log('Password changed successfully');
    return { success: true };
  }

  // ==================== Health Check (No Auth Required) ====================

  /**
   * Check Keycloak server health via public .well-known endpoint (no auth required)
   * ตรวจสอบสถานะ Keycloak server ผ่าน .well-known endpoint สาธารณะ (ไม่ต้องยืนยันตัวตน)
   * @returns Health status with timestamp / สถานะสุขภาพพร้อม timestamp
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

      this.logger.warn(
        `Keycloak health check returned status: ${response.status}`,
      );
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Keycloak health check failed: ${errorMessage}`);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
