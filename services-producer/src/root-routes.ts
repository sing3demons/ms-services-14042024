import express from 'express'
import { TodoRoute } from './todo/todo.route.js'
import Logger from './logger/index.js'
import { KafkaService } from './kafka/kafka.js'
import { RedisService } from './redis/redis.js'

const logger = new Logger()
const kafkaService = new KafkaService()
const redisService = new RedisService()

const router = express.Router()


new TodoRoute(kafkaService, redisService, logger).Register(router)

export const Router = router
