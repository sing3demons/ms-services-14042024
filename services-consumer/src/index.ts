import { KafkaService } from './core/kafka/kafka.js'
import { RedisService } from './core/redis/redis.js'
import MongoService from './core/mongo/index.js'

import Logger from './core/logger/index.js'
import { topics } from './config.js'
import { ServiceManager } from './handler.js'

async function main() {
    const logger = new Logger()
    const mongoService = new MongoService()
    await mongoService.connect()
    const mongoClient = mongoService.getClient()

    const redisClient = new RedisService(logger)
    await redisClient.connect()

    const kafkaService = new KafkaService(logger)
    const serviceConsumer = new ServiceManager(redisClient, mongoClient, logger)

    await kafkaService.createTopics(topics)
    await kafkaService.consumeMessages(topics, serviceConsumer.consumer)
}

main().catch(console.error)
