import { createClient, RedisClientType, SetOptions } from 'redis';

const url = process.env.REDIS_URL || 'redis://localhost:6379';


export class RedisService {
    private client: RedisClientType

    constructor() {
        console.log('Creating Redis client');
        this.client = createClient({
            url,
            socket: {
                // host: 'localhost',
                // port: 6379,
                connectTimeout: 10000,
                reconnectStrategy: (retries: number) => {
                    if (retries > 20) {
                        console.log("Too many attempts to reconnect. Redis connection was terminated");
                        return new Error("Too many retries.");
                    } else {
                        return retries * 500;
                    }
                },
            },
        });

        this.client.on('connect', async () => {
            // await this.client.connect();
            console.log('=========================> connected');
        });

        this.client.on('error', (error) => {
            console.error(error);
        });
    }

    async connect() {
        await this.client.connect();
    }

    async disconnect() {
        await this.client.disconnect();
    }

    async set(key: string, value: string, timeout?: number) {
        const options: SetOptions = {}
        if (timeout) {
            options.EX = timeout
        }
        const record = await this.client.set(key, value, options)
        return record
    }

    async get(key: string) {
        const record = await this.client.get(key)
        console.log(`Get key ${key}`, { record })
        return record
    }


    async delete(key: string) {
        const record = await this.client.del(key);
        console.log(`Delete key ${key}`, { record });
    }

}