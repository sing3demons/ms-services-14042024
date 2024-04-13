import { MongoClient } from 'mongodb'

const uri =
    process.env.MONGO_URI ??
    'mongodb://root:root@localhost:27017/todo?authSource=admin'

const client = new MongoClient(uri)

export async function connect() {
    try {
        await client.connect()
        console.log('Connected to MongoDB replica set')
        return client.db()
    } catch (error) {
        console.error('Error connecting to MongoDB:', error)
        process.exit(1)
    }
}


export function getClient() {
    return client.db('todo').collection('tasks')
}