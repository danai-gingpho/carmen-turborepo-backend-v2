export interface MicroservicePayload {
  // Auth context
  user_id?: string;
  tenant_id?: string;
  bu_code?: string;

  // Audit context
  request_id?: string;
  ip_address?: string;
  user_agent?: string;

  // OpenTelemetry trace context
  traceparent?: string;
  tracestate?: string;

  // Entity data
   
  data?: any;
  id?: string;
  ids?: string[];

  // Query
   
  paginate?: any;
   
  filters?: any;
  version?: string;

  // Allow additional domain-specific fields
   
  [key: string]: any;
}
