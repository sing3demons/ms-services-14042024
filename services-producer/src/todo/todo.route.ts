import { RedisService } from '../redis/redis.js'
import { Router } from 'express'
import { TodoService } from './todo.service.js'
import { TodoController } from './todo.controller.js'
import type Logger from '../core/logger/index.js'
import type { KafkaService } from '../core/kafka/kafka.js'
import { authMiddleware } from '../core/middleware/index.js'

export class TodoRoute {
    constructor(
        private readonly kafkaService: KafkaService,
        private readonly redisService: RedisService,
        private readonly logger: Logger
    ) {
        this.redisService.connect()
    }
    Register(router: Router) {
        const todoService = new TodoService(this.kafkaService, this.redisService, this.logger)
        const todoController = new TodoController(todoService, this.logger)

        router.post('/todo', authMiddleware, todoController.createTodo)
        router.get('/todo/:id/status', authMiddleware, todoController.getTodo)
        router.get('/todo', authMiddleware, todoController.getTodos)

        return router
    }
}
