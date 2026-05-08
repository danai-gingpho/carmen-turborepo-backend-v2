import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import {
  context as otelContext,
  propagation,
  trace,
} from '@opentelemetry/api';

@Injectable()
export class TraceContextInterceptor implements NestInterceptor {
  intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const contextType = ctx.getType();

    if (contextType === 'rpc') {
      const payload = ctx.switchToRpc().getData();
      const traceparent = payload?.traceparent;
      const tracestate = payload?.tracestate;

      if (traceparent) {
        const carrier = {
          traceparent,
          ...(tracestate ? { tracestate } : {}),
        };
        const extractedContext = propagation.extract(
          otelContext.active(),
          carrier,
        );

        // Create a child span linked to the gateway's trace
        const tracer = trace.getTracer('micro-business');
        const handler = ctx.getHandler();
        const className = ctx.getClass()?.name || 'Unknown';
        const methodName = handler?.name || 'unknown';

        return from(
          otelContext.with(extractedContext, () => {
            return tracer.startActiveSpan(
              `${className}.${methodName}`,
              async (span) => {
                try {
                  return await new Promise<unknown>((resolve, reject) => {
                    next.handle().subscribe({
                      next: (value) => resolve(value),
                      error: (err) => reject(err),
                      complete: () => {},
                    });
                  });
                } catch (error) {
                  span.recordException(error as Error);
                  span.setStatus({ code: 2 }); // SpanStatusCode.ERROR
                  throw error;
                } finally {
                  span.end();
                }
              },
            );
          }),
        );
      }
    }

    return next.handle();
  }
}
