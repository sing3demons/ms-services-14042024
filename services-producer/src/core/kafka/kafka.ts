import { Admin, IHeaders, Kafka, KafkaConfig, KafkaMessage, logLevel, Message } from 'kafkajs'
import { v4 as uuid } from 'uuid'
import Logger from '../logger/index.js'
import { CreateLogger } from '../logger/utils.js'
import { MessageCallback } from './type.js'
import { brokers, clientId, initialRetryTime, logLevelKafka, requestTimeout, retry, groupId } from '../../config.js'

const kafkaConfig: KafkaConfig = {
    clientId: clientId,
    brokers: brokers,
    requestTimeout: Number(requestTimeout),
    retry: {
        initialRetryTime: Number(initialRetryTime),
        retries: Number(retry),
    },
    connectionTimeout: 3000,
    logLevel: Number(logLevelKafka),
    logCreator: (_logLevel: logLevel) => {
        const logger = CreateLogger()
        return ({ level, log }: { namespace: string; level: logLevel; label: string; log: any }) => {
            const { message, ...extra } = log
            logger.log({
                level: ((level: any) => {
                    switch (level) {
                        case logLevel.ERROR:
                        case logLevel.NOTHING:
                            return 'error'
                        case logLevel.WARN:
                            return 'warn'
                        case logLevel.INFO:
                            return 'info'
                        case logLevel.DEBUG:
                            return 'debug'
                        default:
                            return 'info'
                    }
                })(level),
                message,
                extra,
            })
        }
    },
}

export class KafkaService {
    private admin: Admin
    private kafka: Kafka

    constructor(private readonly logger: Logger) {
        this.kafka = new Kafka(kafkaConfig)
        this.admin = this.kafka.admin()
        this.logger.info('KafkaService initialized')
    }

    async createTopics(topics: string[]) {
        await this.admin.connect()
        const existingTopics = await this.admin.listTopics()
        const topicsToCreate = topics.filter((topic) => !existingTopics.includes(topic))
        if (topicsToCreate.length !== 0) {
            await this.admin.createTopics({
                topics: topics.map((topic) => ({
                    topic,
                    numPartitions: 1,
                    replicationFactor: 1,
                })),
            })
        }
        this.logger.info(`Creating topics ${topicsToCreate.join(', ')}`)

        await this.admin.disconnect()
    }

    async sendMessage(topic: string, message: Array<Object> | Object | string, headers?: IHeaders) {
        const producer = this.kafka.producer()
        if (!headers) {
            headers = { session: `unknown-${uuid()}` }
        }

        if (!headers?.session) {
            headers.session = `default-${uuid()}`
        }

        this.logger.info(`Sending message to topic ${topic}`)

        const messages: Message[] = []
        if (typeof message === 'object') {
            if (Array.isArray(message)) {
                message.forEach((msg) => {
                    messages.push({ headers, value: JSON.stringify(msg) })
                })
            } else {
                messages.push({ headers, value: JSON.stringify(message) })
            }
        } else {
            messages.push({ headers, value: message })
        }

        try {
            await producer.connect()
            const record = await producer.send({
                topic,
                messages,
            })

            this.logger.info(`Message sent to topic ${topic}`, {
                record,
                topic,
                messages,
            })

            await producer.disconnect()
            return record
        } catch (error) {
            this.logger.error(`Error sending message to topic ${topic}`, {
                error,
                topic,
                messages,
            })
            await producer.disconnect()
            throw error
        }
    }

    async consumeMessages(topics: string[], callback: MessageCallback) {
        const consumer = this.kafka.consumer({ groupId: groupId })
        await consumer.connect()
        await consumer.subscribe({ topics, fromBeginning: true })
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                this.logger.info(`Received message from topic ${topic}`)

                const { headers, value, timestamp, attributes, key, offset, size }: KafkaMessage = message

                for (const key in headers) {
                    if (headers?.hasOwnProperty(key) && Buffer.isBuffer(headers[key])) {
                        headers[key] = headers[key]?.toString()
                    }
                }

                const ctx = {
                    session: headers?.['session']?.toString() ?? `unknown-${uuid()}`,
                    timestamp: timestamp?.toString() ?? new Date().toISOString(),
                    ip: headers?.['ip']?.toString() ?? 'unknown',
                    partition: partition?.toString(),
                    key: key?.toString() ?? '',
                    offset: offset?.toString() ?? '',
                    size: size?.toString() ?? '',
                    attributes: attributes?.toString() ?? '',
                    ...headers,
                }

                // Handle the received message
                const payload = value?.toString()
                if (!payload) {
                    throw new Error('Invalid message')
                }

                callback(ctx, topic, payload)
            },
        })
    }
}
