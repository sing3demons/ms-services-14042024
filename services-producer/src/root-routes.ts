import { Router } from 'express'
import { TodoRoute } from './todo/todo.route.js'
import Logger from './core/logger/index.js'
import { KafkaService } from './core/kafka/kafka.js'
import { RedisService } from './redis/redis.js'

const logger = new Logger()
const kafkaService = new KafkaService(logger)
const redisService = new RedisService(logger)

const router = Router()

new TodoRoute(kafkaService, redisService, logger).Register(router)

export const Routes = router
