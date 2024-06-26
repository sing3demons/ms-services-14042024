import { Collection, MongoClient } from 'mongodb'
import { b64string } from '../../config.js'

export default class MongoService {
    private client: MongoClient

    constructor() {
        const buf = Buffer.from(b64string, 'base64')
        const uri = buf.toString('utf-8')
        this.client = new MongoClient(uri)
        this.client.on('connect', async () => {
            console.log('Connected to MongoDB')
        })
    }

    async connect() {
        const conn = await this.client.connect()
        conn.db('users')
            .collection('users')
            .createIndexes(
                [
                    { key: { email: 1 }, unique: true },
                    { key: { id: 1 }, unique: true },
                ],
                { unique: true }
            )
    }

    async disconnect() {
        await this.client.close()
    }

    getClient() {
        return this.client
    }

    getCollection<T extends object>(collection: string = 'tasks'): Collection<T> {
        return this.client.db('todo').collection(collection)
    }
}
