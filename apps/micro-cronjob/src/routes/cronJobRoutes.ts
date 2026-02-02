import { Elysia } from 'elysia'
import { cronJobController } from '../controllers/cronJobController'
import { idParamSchema, createCronJobSchema, updateCronJobSchema } from '../schemas/cronJobSchemas'

export const cronJobRoutes = new Elysia({ prefix: '/api/cronjobs' })
  .get('/', ({ set }) => cronJobController.getAll({ set, params: {}, body: {} } as any))
  .get('/:id', ({ params, set }) => cronJobController.getById({ params, set, body: {} } as any), {
    params: idParamSchema
  })
  .post('/', ({ body, set }) => cronJobController.create({ body, set, params: {} } as any), {
    body: createCronJobSchema
  })
  .put('/:id', ({ params, body, set }) => cronJobController.update({ params, body, set } as any), {
    params: idParamSchema,
    body: updateCronJobSchema
  })
  .delete('/:id', ({ params, set }) => cronJobController.delete({ params, set, body: {} } as any), {
    params: idParamSchema
  })
  .post('/:id/start', ({ params, set }) => cronJobController.start({ params, set, body: {} } as any), {
    params: idParamSchema
  })
  .post('/:id/stop', ({ params, set }) => cronJobController.stop({ params, set, body: {} } as any), {
    params: idParamSchema
  })
  .post('/:id/execute', ({ params, set }) => cronJobController.execute({ params, set, body: {} } as any), {
    params: idParamSchema
  })
  .get('/debug/memory', ({ set }) => cronJobController.getActiveInMemory({ set, params: {}, body: {} } as any))