import { createClient, RedisClientType, SetOptions } from 'redis'

const url = process.env.REDIS_URL || 'redis://localhost:6379'

export class RedisService {
    private client: RedisClientType

    constructor() {
        this.client = createClient({
            url,
            socket: {
                // host: 'localhost',
                // port: 6379,
                connectTimeout: 10000,
                reconnectStrategy: (retries: number) => {
                    if (retries > 20) {
                        console.log(
                            'Too many attempts to reconnect. Redis connection was terminated'
                        )
                        return new Error('Too many retries.')
                    } else {
                        return retries * 500
                    }
                },
            },
        })

        this.client.on('connect', async () => console.log('redis connected'))

        this.client.on('error', (error) => {
            console.error(error)
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
        console.log(`Get keys with pattern ${pattern}`, { keys })
        return keys
    }

    async getAllKeys() {
        const keys = await this.client.keys('*')
        console.log(`Get all keys`, { keys })
        return keys
    }

    async set(key: string, value: string, timeout?: number) {
        const options: SetOptions = {}
        if (timeout) {
            options.EX = timeout * 1000
        }
        const record = await this.client.set(key, value, options)
        console.log(`Set key ${key} with value ${value}`, { record })
    }

    async get(key: string) {
        const record = await this.client.get(key)
        console.log(`Get key ${key}`, { record })
        return record
    }

    async delete(key: string) {
        const record = await this.client.del(key)
        console.log(`Delete key ${key}`, { record })
    }
}
