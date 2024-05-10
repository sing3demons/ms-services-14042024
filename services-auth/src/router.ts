import { Router } from 'express'
import AuthRouter from './auth/auth.route.js'
import { TypeRoute } from './core/router/typed-router.js'
import { MongoClient } from 'mongodb'
import { RedisService } from './core/redis/index.js'
import Logger from './core/logger/index.js'
import UserRouter from './user/user.route.js'

export const Register = (route: TypeRoute, client: MongoClient, redisClient: RedisService, logger: Logger) => {
  const router = Router()
  new AuthRouter(route, client, redisClient, logger).register(router)
  new UserRouter(route, client, logger).register(router)
  return router
}
