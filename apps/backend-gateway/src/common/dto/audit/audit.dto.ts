import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class AuditEntryDto {
  @ApiProperty({ type: String, format: 'date-time', required: false, example: '2026-04-29T08:30:00.000Z' })
  at?: string;
  @ApiProperty({ required: false, example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id?: string;
  @ApiProperty({ required: false, example: 'John Doe' })
  name?: string;
}

export class AuditDto {
  @ApiProperty({ type: AuditEntryDto, required: false })
  created?: AuditEntryDto;
  @ApiProperty({ type: AuditEntryDto, required: false })
  updated?: AuditEntryDto;
  @ApiProperty({ type: AuditEntryDto, required: false })
  deleted?: AuditEntryDto;
}

export const AuditEntrySchema = z.object({
  at: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
});

export const AuditSchema = z.object({
  created: AuditEntrySchema.optional(),
  updated: AuditEntrySchema.optional(),
  deleted: AuditEntrySchema.optional(),
});

export type Audit = z.infer<typeof AuditSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
