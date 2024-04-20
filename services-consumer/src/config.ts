import ip from 'ip'

class Config {
    port: string
    host: string
    redis_url: string
    host_url: string
    brokers: string[]
    clientId: string
    requestTimeout: string | number
    retry: number | string
    initialRetryTime: string | number
    logLevelKafka: string | number
    groupId: string
    b64string: string
    topics: string[]

    constructor() {
        this.port = process.env.PORT ?? '3000'
        this.host = process.env.HOST_IP ?? ip.address()
        this.redis_url = process.env.REDIS_URL ?? `redis://${ip.address()}:6379`
        this.host_url = process.env.HOST ?? `http://${ip.address()}`
        this.brokers = process.env.KAFKA_BROKERS?.split(',') ?? [`${this.host}:9092`]
        this.clientId = process.env.KAFKA_CLIENT_ID ?? 'my-app-1'
        this.requestTimeout = process.env?.KAFKA_REQUEST_TIMEOUT ?? 30000
        this.retry = process.env?.KAFKA_RETRY ?? 8
        this.initialRetryTime = process.env?.KAFKA_INITIAL_RETRY_TIME ?? 100
        this.logLevelKafka = process.env?.KAFKA_LOG_LEVEL ?? 4
        this.groupId = process.env.KAFKA_GROUP_ID ?? 'my-group-1'
        this.b64string =
            process.env.MONGO_URI ??
            'bW9uZ29kYjovL0RFVl9VU0VSOkMzQkFENTYyLTg5NjgtNENENC05MENFLTQzQjZFMEJBMjM2MkBsb2NhbGhvc3Q6MjcwMTcvdG9kbz9hdXRoU291cmNlPWFkbWlu'
        this.topics = process.env.KAFKA_TOPIC?.split(',') ?? ['create.todos']
    }
}

const config = new Config()

export const {
    port,
    host,
    redis_url,
    host_url,
    brokers,
    clientId,
    requestTimeout,
    retry,
    initialRetryTime,
    logLevelKafka,
    groupId,
    b64string,
    topics
} = config
