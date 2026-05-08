import { Logger } from '@nestjs/common';
import { Result } from '../common/result/result';

const errorLogger = new Logger('TryCatch');

export function TryCatch(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errorLogger.error(
        `Error in ${propertyKey}@${target.constructor.name}: ${err.name} ${err.message}`,
        err.stack,
        target.constructor.name,
      );

      return Result.error(err);
    }
  };
}
