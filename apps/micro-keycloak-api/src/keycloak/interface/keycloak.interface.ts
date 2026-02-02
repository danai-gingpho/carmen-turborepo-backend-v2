export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token?: string;
  token_type: string;
  not_before_policy?: number;
  session_state?: string;
  scope: string;
}

export interface KeycloakUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  emailVerified?: boolean;
  createdTimestamp?: number;
  attributes?: Record<string, string[]>;
  requiredActions?: string[];
}

export interface CreateKeycloakUserDto {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  credentials?: KeycloakCredential[];
  attributes?: Record<string, string[]>;
  requiredActions?: string[];
}

export interface UpdateKeycloakUserDto {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  attributes?: Record<string, string[]>;
  requiredActions?: string[];
}

export interface KeycloakCredential {
  type: string;
  value: string;
  temporary?: boolean;
}

export interface KeycloakRole {
  id: string;
  name: string;
  description?: string;
  composite?: boolean;
  clientRole?: boolean;
  containerId?: string;
}

export interface KeycloakGroup {
  id: string;
  name: string;
  path: string;
  subGroups?: KeycloakGroup[];
  attributes?: Record<string, string[]>;
}

export interface KeycloakClient {
  id: string;
  clientId: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  protocol?: string;
  publicClient?: boolean;
  bearerOnly?: boolean;
  serviceAccountsEnabled?: boolean;
  directAccessGrantsEnabled?: boolean;
}

export interface KeycloakRealm {
  id: string;
  realm: string;
  displayName?: string;
  enabled?: boolean;
  sslRequired?: string;
  registrationAllowed?: boolean;
  loginWithEmailAllowed?: boolean;
  duplicateEmailsAllowed?: boolean;
  resetPasswordAllowed?: boolean;
  editUsernameAllowed?: boolean;
  bruteForceProtected?: boolean;
}

export interface ResetPasswordDto {
  type: 'password';
  value: string;
  temporary?: boolean;
}

export interface KeycloakAdminConfig {
  baseUrl: string;
  realm: string;
  clientId: string;
  adminClientSecret?: string;
  adminUsername?: string;
  adminPassword?: string;
  adminClientId: string;
}

export interface KeycloakUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  bu?: { bu_id: string; bu_code: string; role: string }[];
}

export interface ResetPasswordPayload {
  type: 'password';
  value: string;
  temporary: boolean;
}