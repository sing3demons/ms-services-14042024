import Logger from '../logger/index.js'
import { KafkaService } from '../kafka/kafka.js'
import { TodoService } from './todo.service.js'
import { TodoController } from './todo.controller.js'
import { RedisService } from '../redis/redis.js'

const logger = new Logger()
const kafkaService = new KafkaService()
const redisService = new RedisService()
redisService.connect()
const todoService = new TodoService(kafkaService, redisService, logger)

export const todoController = new TodoController(todoService, logger)