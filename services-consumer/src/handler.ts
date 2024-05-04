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

    consumer = async (ctx: Record<string, string>, topic: string, message: string) => {
        const logger = this.logger.Logger(ctx)
        const db = this.client.db('todo')
        logger.info('Received message from topic', { topic, message })
        switch (topic) {
            case 'create.todos':
                const col = db.collection<Todo>('tasks')
                const payload = JSON.parse(message) as Todo
                const key = `todos::${payload.id}`

                const response = await this.createTodo(key, payload, col)
                logger.info('Todo created', response)

                break
            case 'create.users':
                const user = JSON.parse(message) as IUser
                await this.createUsers(`users::${user.id}`, user, this.client.db('users').collection<IUser>('users'))
                break
            default:
                console.log('Unknown topic')
        }
    }

    async createTodo(key: string, payload: Todo, col: Collection<Todo>) {
        try {
            const response = {
                id: payload.id,
                status: 'success',
                data: payload,
            }

            const insertOneResult = await col.insertOne(payload)
            const update = await this.redis.set(key, JSON.stringify(response), 60)
            return {
                insertOneResult,
                update,
                response,
            }
        } catch (error) {
            await this.redis.set(key, JSON.stringify({ status: 'error', data: payload }), 60)
            if (error instanceof Error) {
                throw new Error(error.message)
            }
            throw new Error('Error creating todo')
        }
    }

    async createUsers(key: string, payload: IUser, col: Collection<IUser>) {
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
            return {
                insertOneResult,
                update,
                response,
            }
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
