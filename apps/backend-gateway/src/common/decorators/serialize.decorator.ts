import { SetMetadata } from '@nestjs/common';
import { ZodSchema } from 'zod';

export const SERIALIZER_SCHEMA_KEY = 'serializer:schema';

/**
 * Decorator to attach a Zod schema for response serialization
 * เดคอเรเตอร์สำหรับแนบ Zod schema เพื่อการแปลงข้อมูลการตอบกลับ
 */
export const Serialize = (schema: ZodSchema) =>
  SetMetadata(SERIALIZER_SCHEMA_KEY, schema);
