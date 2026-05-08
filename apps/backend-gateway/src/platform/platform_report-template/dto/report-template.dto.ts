import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ReportTemplateCreateSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).min(1, { message: 'Name must not be empty' }),
  description: z.string().nullable().optional(),
  report_group: z.string({ required_error: 'Report group is required' }).min(1, { message: 'Report group must not be empty' }),
  dialog: z.string({ required_error: 'Dialog XML is required' }),
  content: z.string({ required_error: 'Content XML is required' }),
  is_standard: z.boolean().default(true).optional(),
  allow_business_unit: z.any().nullable().optional(),
  deny_business_unit: z.any().nullable().optional(),
  is_active: z.boolean().default(true).optional(),
});

export type IReportTemplateCreate = z.infer<typeof ReportTemplateCreateSchema>;
export class ReportTemplateCreateDto extends createZodDto(ReportTemplateCreateSchema) {}

export const ReportTemplateUpdateSchema = z.object({
  name: z.string().min(1, { message: 'Name must not be empty' }).optional(),
  description: z.string().nullable().optional(),
  report_group: z.string().min(1, { message: 'Report group must not be empty' }).optional(),
  dialog: z.string().optional(),
  content: z.string().optional(),
  is_standard: z.boolean().optional(),
  allow_business_unit: z.any().nullable().optional(),
  deny_business_unit: z.any().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type IReportTemplateUpdate = z.infer<typeof ReportTemplateUpdateSchema>;
export class ReportTemplateUpdateDto extends createZodDto(ReportTemplateUpdateSchema) {}
