export interface MicroservicePayload {
  // Auth context
  user_id?: string;
  tenant_id?: string;
  bu_code?: string;

  // Audit context
  request_id?: string;
  ip_address?: string;
  user_agent?: string;

  // Entity data
   
  data?: any;
  id?: string;
  ids?: string[];

  // Query
   
  paginate?: any;
   
  filters?: any;
  version?: string;

  // Keycloak-specific fields
  email?: string;
  password?: string;
  realm?: string;
  refresh_token?: string;
  accessToken?: string;
  userId?: string;
  action?: 'add' | 'remove';
  bu?: { bu_id: string; bu_code?: string; role?: string };
  temporary?: boolean;

  // Allow additional domain-specific fields
   
  [key: string]: any;
}
