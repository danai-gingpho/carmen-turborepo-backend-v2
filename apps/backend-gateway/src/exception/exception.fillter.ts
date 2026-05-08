import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response, Request } from 'express'
import { ZodValidationException } from 'nestjs-zod'
import * as Sentry from '@sentry/node'

@Catch()
export class ExceptionFilter {
  private readonly logger = new Logger(ExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    // Extract message from various exception shapes
    const exc = exception as Record<string, unknown>;
    if (exc?.error) {
      const error = exc.error as Record<string, unknown>;
      if (typeof error === 'string') {
        message = error;
      } else if (error?.message) {
        message = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
      } else {
        message = JSON.stringify(error);
      }
    } else if (exc?.message && typeof exc.message === 'string') {
      message = exc.message;
    }

    // Try to parse JSON-encoded messages
    try {
      const parsed = JSON.parse(message as string);
      if (typeof parsed === 'string') {
        message = parsed;
      } else if (Array.isArray(parsed)) {
        message = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        message = parsed.message ?? JSON.stringify(parsed);
      }
    } catch {
      // Keep original message if parsing fails
    }
    let errorResponse: Record<string, unknown> | null = null;

    // Handle Zod validation errors with detailed field-level messages
    if (exception instanceof ZodValidationException) {
      status = exception.getStatus();
      const zodError = exception.getZodError();
      const fieldErrors = zodError.errors.map((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : '(root)';
        const detail = 'expected' in err ? ` (expected ${err.expected}, received ${err.received})` : '';
        return `${path}: ${err.message}${detail}`;
      });
      message = fieldErrors;
      errorResponse = {
        statusCode: status,
        error: 'Validation failed',
        errors: zodError.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          ...('expected' in err ? { expected: err.expected, received: err.received } : {}),
        })),
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle different response formats
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as Record<string, unknown>).message as string || exception.message;
        errorResponse = exceptionResponse as Record<string, unknown>;
      }
    } else if (exception instanceof Error) {
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