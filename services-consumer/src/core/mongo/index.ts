import { Collection, MongoClient } from 'mongodb'

const b64string =
    process.env.MONGO_URI ??
    'bW9uZ29kYjovL0RFVl9VU0VSOkMzQkFENTYyLTg5NjgtNENENC05MENFLTQzQjZFMEJBMjM2MkBsb2NhbGhvc3Q6MjcwMTcvdG9kbz9hdXRoU291cmNlPWFkbWlu'

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
        await this.client.connect()
    }

    async disconnect() {
        await this.client.close()
    }

    getClient() {
        return this.client
    }

    getCollection<T extends object>(collection: string = 'tasks'): Collection<T> {
        return this.client.db('todo').collection(collection);
    }


}