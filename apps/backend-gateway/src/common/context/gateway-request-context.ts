import { AsyncLocalStorage } from 'async_hooks';

export interface GatewayRequestContext {
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  traceparent?: string;
  tracestate?: string;
}

export const gatewayRequestContextStorage =
  new AsyncLocalStorage<GatewayRequestContext>();

/**
 * Get the current gateway request context from AsyncLocalStorage
 * ดึง context ของ request ปัจจุบันจาก AsyncLocalStorage
 * @returns Current request context or empty object / context ปัจจุบันหรือ object ว่าง
 */
export function getGatewayRequestContext(): GatewayRequestContext {
  return gatewayRequestContextStorage.getStore() ?? {};
}
