import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { auditContextStorage } from '../context/audit-context.js';
import type { AuditContext } from '../types/log-event.types.js';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
	/**
	 * Intercepts incoming requests to establish an audit context for the request lifecycle
	 * ดักจับ request ที่เข้ามาเพื่อสร้าง audit context สำหรับวงจรชีวิตของ request
	 * @param context - The NestJS execution context containing request details / execution context ของ NestJS ที่มีรายละเอียด request
	 * @param next - The call handler to proceed to the next interceptor or route handler / call handler สำหรับส่งต่อไปยัง interceptor หรือ route handler ถัดไป
	 * @returns An observable wrapping the response within the audit context / Observable ที่ห่อหุ้ม response ภายใต้ audit context
	 */
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const contextType = context.getType();

		let auditContext: AuditContext;

		if (contextType === 'http') {
			const request = context.switchToHttp().getRequest();
			auditContext = {
				tenant_id: request.params?.bu_code || 'unknown',
				user_id: request.user?.user_id || request.headers?.['x-user-id'] || 'anonymous',
				request_id: request.headers?.['x-request-id'] || uuidv4(),
				ip_address: request.ip || request.headers?.['x-forwarded-for'],
				user_agent: request.headers?.['user-agent'],
			};
		} else if (contextType === 'rpc') {
			const payload = context.switchToRpc().getData();
			auditContext = {
				tenant_id: payload?.bu_code || payload?.tenant_id || 'unknown',
				user_id: payload?.user_id || 'anonymous',
				request_id: payload?.request_id || uuidv4(),
				ip_address: payload?.ip_address,
				user_agent: payload?.user_agent,
			};
		} else {
			auditContext = {
				tenant_id: 'unknown',
				user_id: 'anonymous',
				request_id: uuidv4(),
			};
		}

		// Use AsyncLocalStorage.run() with a Promise wrapper to ensure
		// context is maintained across all async operations
		return from(
			auditContextStorage.run(auditContext, () => {
				return new Promise<unknown>((resolve, reject) => {
					next.handle().subscribe({
						next: value => resolve(value),
						error: err => reject(err),
						complete: () => {},
					});
				});
			}),
		);
	}
}
