/**
 * Business Unit information from Keycloak
 */
export interface BusinessUnit {
  bu_id: string;
  bu_code: string;
  role: string;
}

/**
 * User information from Keycloak token
 */
export interface KeycloakUserInfo {
  sub: string;
  bu?: BusinessUnit[];
  address?: Record<string, any>;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
}

/**
 * Validated user data from Keycloak strategy
 */
export interface ValidatedUser {
  user_id: string;
  name?: string;
  username?: string;
  email?: string;
  bu: BusinessUnit[];
}

/**
 * User data with permissions attached to request
 */
export interface AuthenticatedUser {
  user_id: string;
  name?: string;
  username?: string;
  email?: string;
  permissions?: Record<string, string[]>;
}

/**
 * Extended Express Request with authenticated user
 */
export interface RequestWithUser {
  user: AuthenticatedUser;
  headers: Record<string, any>;
  params: Record<string, any>;
  query: Record<string, any>;
  body: any;
}
