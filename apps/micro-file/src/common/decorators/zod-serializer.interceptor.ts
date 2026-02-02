import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { ZodSchema } from 'zod';
import { SERIALIZER_SCHEMA_KEY } from './serialize.decorator';

@Injectable()
export class ZodSerializerInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const schema = this.reflector.get<ZodSchema>(
      SERIALIZER_SCHEMA_KEY,
      context.getHandler(),
    );

    if (!schema) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => this.serialize(data, schema)),
    );
  }

  private serialize(data: any, schema: ZodSchema) {
    // Skip serialization for void/undefined responses (manual response handling with @Res())
    if (data === undefined) {
      return data;
    }

    try {
      if (data?.data && Array.isArray(data.data)) {
        return {
          ...data,
          data: data.data.map((item) => schema.parse(item)),
        };
      }

      if (Array.isArray(data)) {
        return data.map((item) => schema.parse(item));
      }

      return schema.parse(data);
    } catch (error: unknown) {
      const zodError = error as { errors?: unknown };
      throw new InternalServerErrorException({
        message: 'Response serialization failed',
        errors: zodError?.errors ?? error,
      });
    }
  }
}
