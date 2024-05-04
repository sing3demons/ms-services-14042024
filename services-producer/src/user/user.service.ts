import { v4 as uuidv4 } from 'uuid'
import { ContextType } from '../context/context.js'
import { KafkaService } from '../core/kafka/kafka.js'
import Logger from '../core/logger/index.js'
import { RedisService } from '../redis/redis.js'
import { ICachedResponse, IProfile, IUser, userInfer } from './user.model.js'
import { makeStructuredClone } from '../core/logger/utils.js'

export class UserService {
    constructor(
        private readonly kafka: KafkaService,
        private readonly client: RedisService,
        private readonly logger: Logger
    ) {}
    async get() {
        return { message: 'OK' }
    }

    async create(ctx: ContextType, body: userInfer) {
        const logger = this.logger.Logger(ctx)
        logger.info(`${UserService.name}-${this.create.name}`, { body: body })

        const headers: Record<string, string> = {
            session: ctx.session,
            ip: ctx.ip ?? 'unknown',
            userAgent: ctx.userAgent ?? 'unknown',
            host: ctx.host ?? 'unknown',
        }

        const topic = 'create.users'
        const id = uuidv4()
        const key = `users::${id}`
        const payload: IUser = {
            id: id,
            name: body.name,
            email: body.email,
            password: body.password,
            role: ['user'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        const clone = makeStructuredClone(payload)

        const response: ICachedResponse<typeof clone> = {
            id,
            href: `users/${id}`,
            status: 'pending',
            item: clone,
        }

        const record = await this.kafka.sendMessage(topic, payload, headers)
        const cache = await this.client.set(key, JSON.stringify(response))
        logger.info(`${UserService.name}-${this.create.name}`, { payload, headers, record, cache })

        return response
    }

    async update(ctx: ContextType, body: IProfile) {
        const logger = this.logger.Logger(ctx)
        logger.info(`${UserService.name}-${this.create.name}`, { body: body })

        const headers: Record<string, string> = {
            session: ctx.session,
            ip: ctx.ip ?? 'unknown',
            userAgent: ctx.userAgent ?? 'unknown',
            host: ctx.host ?? 'unknown',
        }

        const topic = 'update.profile'
        const id = uuidv4()
        const key = `users::${id}`

        const clone = makeStructuredClone(body)

        const response: ICachedResponse<typeof clone> = {
            id,
            href: `users/${id}`,
            status: 'pending',
            item: clone,
        }

        const record = await this.kafka.sendMessage(topic, body, headers)
        const cache = await this.client.set(key, JSON.stringify(response))
        logger.info(`${UserService.name}-${this.create.name}`, { body, record, cache })

        return response
    }

    async delete(ctx: ContextType, id: string) {
        const logger = this.logger.Logger(ctx)
        logger.info(`${UserService.name}-${this.delete.name}`, { id: id })

        const headers: Record<string, string> = {
            session: ctx.session,
            ip: ctx.ip ?? 'unknown',
            userAgent: ctx.userAgent ?? 'unknown',
            host: ctx.host ?? 'unknown',
        }

        const topic = 'delete.users'
        const key = `users::${id}`
        const body = {
            id,
            deleteDate: new Date().toISOString(),
        }

        const record = await this.kafka.sendMessage(topic, body, headers)
        const cache = await this.client.delete(key)

        logger.info(`${UserService.name}-${this.delete.name}`, { body, record, cache })
        return { id, status: 'deleted' }
    }
}
