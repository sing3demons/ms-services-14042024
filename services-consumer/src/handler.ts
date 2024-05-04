import { Collection, MongoClient } from 'mongodb'
import Logger from './core/logger/index.js'
import { RedisService } from './core/redis/redis.js'
import { z } from 'zod'

export const UserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
})

export const ParamsSchema = z.object({
    id: z.string(),
})

export type userInfer = z.infer<typeof UserSchema>

export type IUser = userInfer & {
    id: string
    createdAt: string
    updatedAt: string
    role: string[]
}

export class ServiceManager {
    constructor(
        private readonly redis: RedisService,
        private readonly client: MongoClient,
        private readonly logger: Logger
    ) {}

    private userCollection = this.client.db('users').collection<IUser>('users')
    private todoCollection = this.client.db('todo').collection<Todo>('tasks')

    consumer = async (ctx: Record<string, string>, topic: string, message: string) => {
        const logger = this.logger.Logger(ctx)
        logger.info('Received message from topic', { topic, message })
        switch (topic) {
            case 'create.todos':
                await this.createTodo(message, this.todoCollection)
                break
            case 'create.users':
                await this.createUsers(message, this.userCollection)
                break
            default:
                console.log('Unknown topic')
        }
    }

    async createTodo(message: string, col: Collection<Todo>) {
        const payload = JSON.parse(message) as Todo
        const key = `todos::${payload.id}`
        try {
            const response = {
                id: payload.id,
                status: 'success',
                data: payload,
            }

            const insertOneResult = await col.insertOne(payload)
            const update = await this.redis.set(key, JSON.stringify(response), 60)
            const result = {
                insertOneResult,
                update,
                response,
            }
            this.logger.info(`${this.createTodo.name} success`, result)
            return
        } catch (error) {
            await this.redis.set(key, JSON.stringify({ status: 'error', data: payload }), 60)
            if (error instanceof Error) {
                throw new Error(error.message)
            }
            throw new Error('Error creating todo')
        }
    }

    async createUsers(message: string, col: Collection<IUser>) {
        const payload = JSON.parse(message) as IUser
        const key = `users::${payload.id}`
        try {
            const response: ICachedResponse<IUser> = {
                id: payload.id,
                status: 'success',
                href: `users/${payload.id}`,
                item: {
                    ...payload,
                    password: '********',
                },
            }
            const exists = await col.findOne({ email: payload.email })
            if (exists) {
                response.status = 'error'
                response.item = {
                    ...payload,
                    password: '********',
                }
                await this.redis.set(key, JSON.stringify(response), 60)
                throw new Error(String(response))
            }
            const insertOneResult = await col.insertOne(payload)
            const update = await this.redis.set(key, JSON.stringify(response), 60)
            const result = {
                insertOneResult,
                update,
                response,
            }
            this.logger.info(`${this.createTodo.name} success`, result)
            return
        } catch (error) {
            await this.redis.set(key, JSON.stringify({ status: 'error', data: payload }), 60)
            if (error instanceof Error) {
                throw new Error(error.message)
            }
            throw new Error('Error creating user')
        }
    }
}

interface ICachedResponse<T extends unknown> {
    id: string
    href: string
    status: string
    item?: T
}

export enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inActive',
}

export interface Todo {
    id: string
    title: string
    description?: string
    done: boolean
    startDate: string
    endDate: string
    status: Status
}
