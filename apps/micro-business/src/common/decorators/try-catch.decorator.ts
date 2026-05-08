import { Logger } from '@nestjs/common';
import { Result } from '../result/result';
import { ErrorCode } from '../result/error';

const errorLogger = new Logger('TryCatch');

function isZodError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'name' in error) {
    return (error as Error).name === 'ZodError';
  }
  return false;
}

function isPrismaValidationError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as Error).name;
    return name === 'PrismaClientValidationError' || name === 'PrismaClientKnownRequestError';
  }
  return false;
}

function extractPrismaMessage(message: string): string {
  // Prisma error messages contain a code block followed by the actual error.
  // Extract the last non-empty paragraph after the code snippet.
  const parts = message.split('\n\n').map((p) => p.trim()).filter(Boolean);
  const last = parts[parts.length - 1];
  return last ?? message;
}

export function TryCatch(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      const err = error instanceof Error
        ? error
        : new Error(typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error));
      errorLogger.error(
        `Error in ${propertyKey}@${target.constructor.name}: ${err.name} ${err.message}`,
        err.stack,
        target.constructor.name,
      );

      if (isZodError(error) || isPrismaValidationError(error)) {
        const cleanMessage = isPrismaValidationError(error)
          ? extractPrismaMessage(err.message)
          : err.message;
        return Result.error(cleanMessage, ErrorCode.INVALID_ARGUMENT);
      }

      return Result.error(err);
    }
  };
}
