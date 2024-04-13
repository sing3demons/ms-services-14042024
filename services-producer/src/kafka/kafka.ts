import { Admin, IHeaders, Kafka, KafkaConfig, KafkaMessage, Logger, Message } from 'kafkajs';
import { v4 as uuid } from 'uuid'

type MessageCallback = (ctx: Record<string, string>, topic: string, message: string) => void

const brokers = process.env.KAFKA_BROKERS?.split(',') ?? ['localhost:9092']
const clientId = process.env.KAFKA_CLIENT_ID ?? 'my-app-1'
const requestTimeout = process.env?.KAFKA_REQUEST_TIMEOUT ?? 30000
const retry = process.env?.KAFKA_RETRY ?? 8
const initialRetryTime = process.env?.KAFKA_INITIAL_RETRY_TIME ?? 100
const logLevel = process.env?.KAFKA_LOG_LEVEL ?? 4

const kafkaConfig: KafkaConfig = {
    clientId: clientId,
    brokers: brokers,
    requestTimeout: Number(requestTimeout),
    retry: {
        initialRetryTime: Number(initialRetryTime),
        retries: Number(retry),
    },
    connectionTimeout: 3000,
    logLevel: Number(logLevel),
}


export class KafkaService {
    private logger: Logger
    private admin: Admin
    private readonly kafka: Kafka

    constructor(
    ) {
        this.kafka = new Kafka(kafkaConfig)
        this.logger = this.kafka.logger()
        this.admin = this.kafka.admin()
    }

    async createTopics(topics: string[]) {
        await this.admin.connect();
        const existingTopics = await this.admin.listTopics();
        console.log('=============+> Existing topics:', existingTopics)
        const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic));
        if (topicsToCreate.length !== 0) {
            await this.admin.createTopics({
                topics: topics.map(topic => ({ topic })),
            });
        }
        this.logger.info(`Creating topics ${topicsToCreate.join(', ')}`)


        await this.admin.disconnect();
    }

    async sendMessage(topic: string, message: Array<Object> | Object | string, headers?: IHeaders) {
        const producer = this.kafka.producer();
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
            await producer.connect();
            const record = await producer.send({
                topic,
                messages,
            });

            this.logger.info(`Message sent to topic ${topic}`, { record, topic, messages })

            await producer.disconnect();
            return record
        } catch (error) {
            this.logger.error(`Error sending message to topic ${topic}`, { error, topic, messages })
            await producer.disconnect();
            throw error
        }
    }

    async consumeMessages(topics: string[], callback: MessageCallback) {
        const groupId = process.env.KAFKA_GROUP_ID ?? 'my-group-1'

        const consumer = this.kafka.consumer({ groupId });
        await consumer.connect();
        await consumer.subscribe({ topics, fromBeginning: true });
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
        });
    }
}