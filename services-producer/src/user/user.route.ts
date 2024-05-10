import { MyRoute, TypeRoute } from '../core/route/index.js'
import { Router } from 'express'
import { UserController } from './user.controller.js'
import { UserService } from './user.service.js'
import Logger from '../core/logger/index.js'
import { RedisService } from '../redis/redis.js'
import { KafkaService } from '../core/kafka/kafka.js'
import { authMiddleware } from '../core/middleware/index.js'

export class UserRoute {
    constructor(
        private readonly route: TypeRoute,
        private readonly kafka: KafkaService,
        private readonly client: RedisService,
        private readonly logger: Logger
    ) {}

    register(router: Router): Router {
        const userRepository = new UserService(this.kafka, this.client, this.logger)
        const userController = new UserController(this.route, userRepository, this.logger)

        return router.use('/users', authMiddleware, new MyRoute().Register(userController).instance)
    }
}
