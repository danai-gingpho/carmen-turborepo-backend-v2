import { Elysia } from 'elysia'
import { cronJobRoutes } from './cronJobRoutes'

export const routes = new Elysia()
  .use(cronJobRoutes)