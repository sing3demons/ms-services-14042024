import { Router } from 'express'
import { TodoRoute } from './todo/todo.route.js'
import Logger from './core/logger/index.js'
import { KafkaService } from './core/kafka/kafka.js'
import { RedisService } from './redis/redis.js'
import { TypeRoute } from './core/route/index.js'
import { UserRoute } from './user/user.route.js'

const logger = new Logger()
const kafkaService = new KafkaService(logger)
const redisService = new RedisService(logger)

const router = Router()
const route = new TypeRoute()

new UserRoute(route, kafkaService, redisService, logger).register(router)
new TodoRoute(kafkaService, redisService, logger).Register(router)

export const Routes = router
