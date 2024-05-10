import { Router } from 'express'
import { MongoClient } from 'mongodb'
import Logger from '../core/logger/index.js'
import { MyRouter, TypeRoute } from '../core/router/index.js'
import { UserController } from './user.controller.js'
import { UserRepository } from './user.repository.js'
import { UserService } from './user.service.js'
import { verifyToken } from '../middleware/auth.js'

export default class UserRouter {
  constructor(
    private readonly route: TypeRoute,
    private readonly client: MongoClient,
    private readonly logger: Logger
  ) {}

  register(router: Router): Router {
    const userRepository = new UserRepository(this.client, this.logger)
    const userService = new UserService(userRepository, this.logger)
    const userController = new UserController(this.route, userService, this.logger)
    return router.use('/users', verifyToken, new MyRouter().Register(userController).instance)
  }
}
