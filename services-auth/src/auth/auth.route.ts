import { Router } from 'express'
import { MongoClient } from 'mongodb'
import Logger from '../core/logger/index.js'
import { MyRouter, TypeRoute } from '../core/router/index.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { UserRepository } from '../user/user.repository.js'
import { RedisService } from '../core/redis/index.js'

export default class AuthRouter {
  constructor(
    private readonly route: TypeRoute,
    private readonly client: MongoClient,
    private readonly redisClient: RedisService,
    private readonly logger: Logger
  ) {}

  register(router: Router): Router {
    const authRepository: UserRepository = new UserRepository(this.client, this.logger)
    const authService = new AuthService(authRepository, this.redisClient, this.logger)
    const authController = new AuthController(this.route, authService, this.logger)
    return router.use('/auth', new MyRouter().Register(authController).instance)
  }
}
