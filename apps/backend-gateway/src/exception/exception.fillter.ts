import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response, Request } from 'express'
import * as Sentry from '@sentry/node'

@Catch()
export class ExceptionFilter {
  private readonly logger = new Logger(ExceptionFilter.name);

  catch(exception: unknown | any, host: ArgumentsHost) {
    console.log(exception)
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception?.error?.message as string || 'Internal server error';
    try {
      message = JSON.parse(message);
    } catch {
      // Keep original message if parsing fails
    }
    let errorResponse: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle different response formats
      if (typeof exceptionResponse === 'string') {
        console.log('exceptionResponse is string')
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        console.log('exceptionResponse is object')
        message = (exceptionResponse as any).message || exception.message;
        errorResponse = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      console.log('exception is instance of Error')
      message = exception.message;
    }

    this.logger.error({ exception, message }, 'ExceptionFilter');
    Sentry.captureException(exception);

    response.status(status).json({
      success: false,
      status: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(errorResponse && typeof errorResponse === 'object' ? errorResponse : {}),
    });
  }
}