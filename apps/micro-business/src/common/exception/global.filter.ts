import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { BackendLogger } from '../helpers/backend.logger';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import * as Sentry from "@sentry/nestjs";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new BackendLogger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const contextType = host.getType();    
    const rpcHost = host.switchToRpc();
    const data = rpcHost.getData();
    const pattern = rpcHost.getContext();

    this.logger.error({
      exception: exception.message || exception,
      stack: exception.stack,
      contextType,
      rpcPattern: pattern,
      rpcData: data,
    }, AllExceptionsFilter.name);

    Sentry.withScope((scope) => {
      scope.setTag('component', 'AllExceptionsFilter');
      scope.setTag('service', 'micro-tenant-master');
      scope.setTag('contextType', contextType);

      let safeData: string;
      try {
        safeData = JSON.stringify(data);
      } catch {
        safeData = '[Unable to stringify data - circular reference]';
      }

      scope.setContext('rpc', {
        pattern: pattern,
        data: safeData,
        timestamp: new Date().toISOString(),
      });

      if (data?.user_id) {
        scope.setUser({ id: data.user_id });
      }

      if (data?.tenant_id || data?.bu_code) {
        scope.setTag('tenant_id or bu_code', data.tenant_id || data.bu_code);
      }

      if (pattern) {
        scope.setFingerprint([pattern.cmd || 'unknown-cmd', exception.name || 'unknown-error']);
      }

      Sentry.captureException(exception);
    });

    let error: any;

    if (exception instanceof RpcException) {
      error = exception.getError();
    } else if (exception instanceof HttpException) {
      error = {
        status: exception.getStatus(),
        success: false,
        message: exception.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      };
    } else {
      error = {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: exception.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      };
    }

    return throwError(() => new RpcException(error));
  }
}