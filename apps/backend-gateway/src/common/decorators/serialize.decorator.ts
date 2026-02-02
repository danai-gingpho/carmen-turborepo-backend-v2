import { SetMetadata } from '@nestjs/common';
import { ZodSchema } from 'zod';

export const SERIALIZER_SCHEMA_KEY = 'serializer:schema';

export const Serialize = (schema: ZodSchema) =>
  SetMetadata(SERIALIZER_SCHEMA_KEY, schema);
