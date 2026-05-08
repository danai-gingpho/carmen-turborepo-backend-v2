import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { context as otelContext, propagation } from '@opentelemetry/api';
import {
  gatewayRequestContextStorage,
  GatewayRequestContext,
} from '../context/gateway-request-context';

@Injectable()
export class GatewayRequestContextInterceptor implements NestInterceptor {
  /**
   * Intercepts HTTP requests to capture client IP, user-agent, and request ID
   * into AsyncLocalStorage so gateway services can forward them to microservices.
   * ดักจับ HTTP request เพื่อเก็บ IP, user-agent และ request ID ใน AsyncLocalStorage
   * เพื่อให้ gateway services ส่งต่อไปยัง microservices ได้
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const contextType = context.getType();

    let requestContext: GatewayRequestContext = {};

    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest();
      // Inject OTEL trace context for TCP propagation
      const carrier: Record<string, string> = {};
      propagation.inject(otelContext.active(), carrier);

      requestContext = {
        ip_address:
          request.ip ||
          request.headers?.['x-forwarded-for'] ||
          request.connection?.remoteAddress,
        user_agent: request.headers?.['user-agent'],
        request_id: request.headers?.['x-request-id'] || uuidv4(),
        traceparent: carrier['traceparent'],
        tracestate: carrier['tracestate'],
      };
    }

    return from(
      gatewayRequestContextStorage.run(requestContext, () => {
        return new Promise<unknown>((resolve, reject) => {
          next.handle().subscribe({
            next: (value) => resolve(value),
            error: (err) => reject(err),
            complete: () => {},
          });
        });
      }),
    );
  }
}
