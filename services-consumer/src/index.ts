import { KafkaService } from './core/kafka/kafka.js'
import { RedisService } from './core/redis/redis.js'
import MongoService from './core/mongo/index.js'
import { Collection, MongoClient } from 'mongodb'
import Logger from './core/logger/index.js'

const topic = process.env.KAFKA_TOPIC || 'create.todos'

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

class ServiceManager {
    constructor(
        private readonly redis: RedisService,
        private readonly client: MongoClient,
        private readonly logger: Logger
    ) {}

    consumer = async (
        ctx: Record<string, string>,
        topic: string,
        message: string
    ) => {
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
            case 'topic2':
                await this.redis.delete('topic1::' + ctx.session)
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
            const update = await this.redis.set(
                key,
                JSON.stringify(response),
                60
            )
            return {
                insertOneResult,
                update,
                response,
            }
        } catch (error) {
            await this.redis.set(
                key,
                JSON.stringify({ status: 'error', data: payload }),
                60
            )
            if (error instanceof Error) {
                throw new Error(error.message)
            }
            throw new Error('Error creating todo')
        }
    }
}

async function main() {
    const mongoService = new MongoService()
    await mongoService.connect()
    const mongoClient = mongoService.getClient()
    const topics = topic.split(',')

    const redisClient = new RedisService()
    await redisClient.connect()
    const logger = new Logger()

    const kafkaService = new KafkaService(logger)
    const serviceConsumer = new ServiceManager(redisClient, mongoClient, logger)

    await kafkaService.createTopics(topics)
    await kafkaService.consumeMessages(topics, serviceConsumer.consumer)
}

main().catch(console.error)
