import { createClient, RedisClientType, SetOptions } from 'redis'
import config from '../../config.js'
import Logger from '../logger/index.js'
export class RedisService {
  private client: RedisClientType

  constructor(private readonly logger: Logger) {
    this.client = createClient({
      url: config.redis_url,
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

    this.client.on('connect', () => this.logger.info('Connected to Redis', { url: config.redis_url }))

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

  async set(key: string, value: string, timeout?: number) {
    const options: SetOptions = {}
    if (timeout) {
      options.EX = timeout
    }
    const record = await this.client.set(key, value, options)
    return record
  }

  async setEx(key: string, value: string, timeout: number) {
    const record = await this.client.setEx(key, timeout, value)
    return record
  }

  async exists(key: string) {
    const record = await this.client.exists(key)
    return record
  }

  async get(key: string) {
    const record = await this.client.get(key)
    console.log(`Get key ${key}`, { record })
    return record
  }

  async delete(key: string) {
    const record = await this.client.del(key)
    return record
  }
}
