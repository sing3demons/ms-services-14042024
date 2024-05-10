import { Db, MongoClient } from 'mongodb'
import Logger from './core/logger/index.js'
import { RedisService } from './core/redis/redis.js'
import { ICachedResponse, IProfile, IProfileLanguage, IUser, Todo } from './model.js'
import { v4 as uuidv4 } from 'uuid'

export class ServiceManager {
    constructor(
        private readonly redis: RedisService,
        private readonly client: MongoClient,
        private readonly logger: Logger
    ) {}

    private userDb = this.client.db('users')
    private todoDb = this.client.db('todo')

    consumer = async (ctx: Record<string, string>, topic: string, message: string) => {
        const logger = this.logger.Logger(ctx)
        logger.info('Received message from topic', { topic, message })
        const payload = JSON.parse(message)
        switch (topic) {
            case 'create.todos':
                await this.createTodo(ctx, payload, this.todoDb)
                break
            case 'create.users':
                await this.createUsers(ctx, payload, this.userDb)
                break
            default:
                console.log('Unknown topic')
        }
    }

    private createTodo = async (ctx: Record<string, string>, payload: Todo, db: Db) => {
        const logger = this.logger.Logger(ctx)
        const key = `todos::${payload.id}`
        const col = db.collection<Todo>('tasks')
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
            logger.info(`${this.createTodo.name} success`, result)
            return
        } catch (error) {
            await this.redis.set(key, JSON.stringify({ status: 'error', data: payload }), 60)
            if (error instanceof Error) {
                this.logger.error(`${this.createTodo.name} error`, { error: error.message })
                return
            }
            logger.error(`${this.createTodo.name} error`, { error: 'Error create Todo' })
        }
    }

    private createUsers = async (ctx: Record<string, string>, payload: IUser, db: Db) => {
        const logger = this.logger.Logger(ctx)
        const col = db.collection<IUser>('users')
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
            logger.info(`${this.createTodo.name} success`, result)
            return
        } catch (error) {
            await this.redis.set(key, JSON.stringify({ status: 'error', data: payload }), 60)
            if (error instanceof Error) {
                this.logger.error(`${this.createUsers.name} error`, { error: error.message })
                return
            }
            logger.error(`${this.createUsers.name} error`, { error: 'Error deleting user' })
        }
    }

    private deleteUser = async (ctx: Record<string, string>, payload: { id: string; deleteDate: string }, db: Db) => {
        const logger = this.logger.Logger(ctx)
        const col = db.collection<IUser>('users')
        const key = `users::${payload.id}`
        try {
            await col.updateOne({ id: payload.id }, { $set: { deleteDate: payload.deleteDate } })
            await this.redis.delete(key)
            logger.info(`${this.deleteUser.name} success`, { id: payload.id })
        } catch (error) {
            await this.redis.set(key, JSON.stringify({ status: 'error', data: payload }), 60)
            if (error instanceof Error) {
                this.logger.error(`${this.deleteUser.name} error`, { error: error.message })
                return
            }
            logger.error(`${this.deleteUser.name} error`, { error: 'Error deleting user' })
        }
    }

    private updateProfile = async (ctx: Record<string, string>, payload: IProfile, client: MongoClient) => {
        const logger = this.logger.Logger(ctx)
        const id = payload.id!
        const key = `users::${id}`
        const filter = { id, deleteDate: null }
        const session = client.startSession()
        const db = client.db('users')

        try {
            const user = await db.collection<IUser>('users').findOne(filter, { session })
            if (!user) {
                throw new Error('User not found')
            }
            const { name, phone, address, languages } = payload
            const userLanguage = await db
                .collection<IProfileLanguage>('userLanguage')
                .find({ refId: id }, { session })
                .toArray()

            if (userLanguage.length !== 0) {
                const deleteLang = await db
                    .collection<IProfileLanguage>('userLanguage')
                    .deleteMany({ refId: id }, { session })
                logger.info(`${this.updateProfile.name} - deleteLanguage`, deleteLang)
            }

            let profileLanguage: IProfileLanguage[] = []
            for (const lang of languages || []) {
                const update: IProfileLanguage = {
                    id: lang.id ?? uuidv4(),
                    ref: id,
                    '@Type': 'ProfileLanguage',
                    languageCode: lang.languageCode,
                    name: lang.name,
                    description: lang.description,
                    attachments: lang.attachments,
                    createDate: new Date().toISOString(),
                    updateDate: new Date().toISOString(),
                }
                profileLanguage.push(update)
            }
            const update = {
                $set: {
                    name: name && name,
                    phone: phone && phone,
                    address: address && address,
                    updatedAt: new Date().toString(),
                    languages: profileLanguage.map((lang) => ({
                        id: lang.id,
                        name: lang.name,
                        languageCode: lang.languageCode,
                    })),
                },
            }
            const updateProfile = await db.collection<IUser>('users').updateOne(filter, update, {
                session,
            })

            if (profileLanguage.length !== 0) {
                const updateLang = await db.collection<IProfileLanguage>('userLanguage').insertMany(profileLanguage, {
                    session,
                })
                logger.info(`${this.updateProfile.name} - updateLanguage`, updateLang)
            }

            await session.commitTransaction()
            logger.info(`${this.updateProfile.name} - updateProfile`, updateProfile)
            return
        } catch (error) {
            await session.abortTransaction()
            await this.redis.set(key, JSON.stringify({ status: 'error', data: payload }), 60)
            if (error instanceof Error) {
                this.logger.error(`${this.updateProfile.name} error`, { error: error.message })
                return
            }
            logger.error(`${this.updateProfile.name} error`, { error: 'Error updating profile' })
        }
    }
}
