import { KafkaService } from '../kafka/kafka.js'
import { v4 as uuid } from 'uuid'
import { Todo } from './todo.model.js'
import { ContextType } from '../context/context.js'
import { RedisService } from '../redis/redis.js'
import Logger from '../logger/index.js'

export class TodoService {
    constructor(
        private readonly kafka: KafkaService,
        private readonly client: RedisService,
        private readonly logger: Logger
    ) { }

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
            const key = `${topic}::${id}`

            const record = await this.kafka.sendMessage(topic, todo, headers)

            const response = {
                id,
                status: 'pending',
                data: todo,
            }


            await this.client.set(key, JSON.stringify(response))

            this.logger.info(
                'todo.service',
                { body, record, data: todo },
                { session: ctx.session }
            )
            return response
        } catch (error) {
            throw new Error(error)
        }
    }
}
