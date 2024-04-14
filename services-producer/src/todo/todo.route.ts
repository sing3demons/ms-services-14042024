import { KafkaService } from '../kafka/kafka.js'
import { RedisService } from '../redis/redis.js'
import { Router } from 'express'
import { TodoService } from './todo.service.js'
import { TodoController } from './todo.controller.js'
import Logger from '../logger/index.js'

export class TodoRoute {
    constructor(
        private readonly kafkaService: KafkaService,
        private readonly redisService: RedisService,
        private readonly logger: Logger
    ) {
        this.redisService.connect()
    }
    Register(router: Router) {
        const todoService = new TodoService(
            this.kafkaService,
            this.redisService,
            this.logger
        )
        const todoController = new TodoController(todoService, this.logger)

        router.post('/todo', todoController.createTodo)
        router.get('/todo/:id/status', todoController.getTodo)
        router.get('/todo', todoController.getTodos)

        return router
    }
}
