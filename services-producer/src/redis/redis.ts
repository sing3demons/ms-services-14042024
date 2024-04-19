import { createClient, RedisClientType, SetOptions } from 'redis'
import Logger from '../core/logger/index.js'
import { redis_url } from '../config.js'

export class RedisService {
    private client: RedisClientType
    constructor(private readonly logger: Logger) {
        this.client = createClient({
            url: redis_url,
            socket: {
                connectTimeout: 10000,
                reconnectStrategy: (retries: number) => {
                    if (retries > 20) {
                        this.logger.error('Too many attempts to reconnect. Redis connection was terminated')
                        return new Error('Too many retries.')
                    } else {
                        return retries * 500
                    }
                },
            },
        })

        this.client.on('connect', async () => {
            this.logger.info('Connected to Redis', { url: redis_url })
        })

        this.client.on('error', (error) => {
            this.logger.error('Error in Redis connection', { error })
        })
    }

    async connect() {
        await this.client.connect()
    }

    async disconnect() {
        await this.client.disconnect()
    }

    async getKeys(pattern: string) {
        const keys = await this.client.keys(pattern)
        return keys
    }

    async getAllKeys() {
        const keys = await this.client.keys('*')
        return keys
    }

    async set(key: string, value: string, timeout?: number) {
        const options: SetOptions = {}
        if (timeout) {
            options.EX = timeout * 1000
        }
        const record = await this.client.set(key, value, options)
        return record
    }

    async get(key: string) {
        const record = await this.client.get(key)
        return record
    }

    async delete(key: string) {
        const record = await this.client.del(key)
        return record
    }
}
