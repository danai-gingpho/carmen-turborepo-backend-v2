import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { Result, ErrorCode } from '../result';

/**
 * Standard ZodValidationPipe that throws BadRequestException on validation failure
 * Use this in HTTP controllers
 */
@Injectable()
export class ZodValidationPipe<T = any> implements PipeTransform<unknown, T> {
  private readonly logger = new Logger(ZodValidationPipe.name);

  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = this.formatZodErrors(result.error);

      this.logger.warn(
        `Validation failed for ${metadata.type}: ${JSON.stringify(errors)}`,
      );

      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors,
        formattedErrors: errors,
      });
    }

    return result.data;
  }

  private formatZodErrors(error: ZodError): string[] {
    return error.errors.map((err) => {
      const path = err.path.length > 0 ? err.path.join('.') : 'value';
      return `${path}: ${err.message}`;
    });
  }
}

/**
 * ZodValidationPipe that returns Result instead of throwing exceptions
 * Use this in microservice handlers where you want to return Result types
 */
@Injectable()
export class ZodValidationResultPipe<T = any>
  implements PipeTransform<unknown, Result<T, any>>
{
  private readonly logger = new Logger(ZodValidationResultPipe.name);

  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): Result<T, any> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = this.formatZodErrors(result.error);
      const errorMessage = `Validation failed: ${errors.join(', ')}`;

      this.logger.warn(
        `Validation failed for ${metadata.type}: ${JSON.stringify(errors)}`,
      );

      return Result.error(errorMessage, ErrorCode.VALIDATION_FAILURE, {
        errors: result.error.errors,
        formattedErrors: errors,
      });
    }

    return Result.ok(result.data);
  }

  private formatZodErrors(error: ZodError): string[] {
    return error.errors.map((err) => {
      const path = err.path.length > 0 ? err.path.join('.') : 'value';
      return `${path}: ${err.message}`;
    });
  }
}

/**
 * Factory function to create a ZodValidationPipe with a schema
 * @param schema - The Zod schema to validate against
 * @returns A new ZodValidationPipe instance
 */
export function createZodValidationPipe<T>(
  schema: ZodSchema<T>,
): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}

/**
 * Factory function to create a ZodValidationResultPipe with a schema
 * @param schema - The Zod schema to validate against
 * @returns A new ZodValidationResultPipe instance
 */
export function createZodValidationResultPipe<T>(
  schema: ZodSchema<T>,
): ZodValidationResultPipe<T> {
  return new ZodValidationResultPipe(schema);
}

/**
 * Validates data against a Zod schema and returns a Result
 * Useful for manual validation in services
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Result with validated data or error
 */
export function validateWithZod<T>(
  schema: ZodSchema<T>,
  data: unknown,
): Result<T, any> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => {
      const path = err.path.length > 0 ? err.path.join('.') : 'value';
      return `${path}: ${err.message}`;
    });

    return Result.error(
      `Validation failed: ${errors.join(', ')}`,
      ErrorCode.VALIDATION_FAILURE,
      {
        errors: result.error.errors,
        formattedErrors: errors,
      },
    );
  }

  return Result.ok(result.data);
}
