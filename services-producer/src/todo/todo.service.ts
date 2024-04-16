import { v4 as uuid } from 'uuid'
import { Todo } from './todo.model.js'
import { ContextType } from '../context/context.js'
import { RedisService } from '../redis/redis.js'
import Logger from '../core/logger/index.js'
import { KafkaService } from '../core/kafka/kafka.js'

export class TodoService {
    constructor(
        private readonly kafka: KafkaService,
        private readonly client: RedisService,
        private readonly logger: Logger
    ) {}

    async createTodo(ctx: ContextType, body: Todo) {
        try {
            const headers: Record<string, string> = {
                session: ctx.session,
                ip: ctx.ip ?? 'unknown',
                userAgent: ctx.userAgent ?? 'unknown',
                host: ctx.host ?? 'unknown',
            }

            const id = uuid()

            const todo: Todo = {
                id,
                title: body.title,
                description: body.description,
                done: false,
                startDate: body.startDate,
                endDate: body.endDate,
                status: body.status,
            }

            const topic = 'create.todos'
            const key = `todos::${id}`

            const record = await this.kafka.sendMessage(topic, todo, headers)

            const response = {
                id,
                status: 'pending',
                data: todo,
            }

            await this.client.set(key, JSON.stringify(response))

            this.logger.info('todo.service', { body, record, data: todo }, { session: ctx.session })
            return response
        } catch (error) {
            throw new Error(error)
        }
    }

    getTodos = async (ctx: ContextType) => {
        try {
            const todos = await this.client.getKeys('todos::*')
            this.logger.info('todo.service', todos, { session: ctx.session })
            const host = process.env.HOST ?? 'http://localhost'
            const port = process.env.PORT ?? '3000'
            const api = `${host}:${port}/api/v1/todo`
            return todos.map((key) => {
                const id = key.split('::')[1]
                return {
                    id,
                    href: `${api}/${id}/status`,
                }
            })
        } catch (error) {
            throw new Error(error)
        }
    }

    getTodo = async (ctx: ContextType, id: string) => {
        try {
            const key = `todos::${id}`
            const todo = await this.client.get(key)
            this.logger.info('todo.service', todo ? JSON.parse(todo) : {}, { session: ctx.session })
            return todo ? JSON.parse(todo) : {}
        } catch (error) {
            throw new Error(error)
        }
    }
}
