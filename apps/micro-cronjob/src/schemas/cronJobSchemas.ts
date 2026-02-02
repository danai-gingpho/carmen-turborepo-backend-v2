import { t } from 'elysia'

// ID parameter validation
export const idParamSchema = t.Object({
  id: t.String({ minLength: 1 })
})

// Create cron job schema
export const createCronJobSchema = t.Object({
  name: t.String({ minLength: 1 }),
  description: t.Optional(t.String()),
  cronExpression: t.String({ minLength: 9 }), // Minimum valid cron: "* * * * *"
  jobType: t.String({ minLength: 1 }),
  jobData: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  timezone: t.Optional(t.String())
})

// Update cron job schema (all fields optional)
export const updateCronJobSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String()),
  cronExpression: t.Optional(t.String({ minLength: 9 })),
  jobType: t.Optional(t.String({ minLength: 1 })),
  jobData: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  timezone: t.Optional(t.String())
})
