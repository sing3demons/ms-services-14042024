import type { Request, Response } from 'express'
import Context from '../context/context.js'
import { TodoService } from './todo.service.js'
import Logger from '../logger/index.js'

export class TodoController {
    constructor(
        private readonly todoService: TodoService,
        private readonly logger: Logger
    ) { }

    createTodo = async (req: Request, res: Response) => {
        const ctx = Context.get()
        const logger = this.logger.Logger(ctx)
        try {
            const todo = await this.todoService.createTodo(ctx, req.body)
            logger.info('todo.controller', todo)
            res.status(201).json(todo)
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message })
            } else {
                res.status(500).json({ message: 'Internal server error' })
            }
        }
    }
}
