import { Collection, MongoClient } from 'mongodb'
import Logger from '../logger/index.js'
const url =
  'bW9uZ29kYjovL21vbmdvZGIxOjI3MDE3LG1vbmdvZGIyOjI3MDE4LG1vbmdvZGIzOjI3MDE5L3VzZXJzP3JlcGxpY2FTZXQ9bXktcmVwbGljYS1zZXQ='

export default class MongoService {
  private client: MongoClient

  constructor(private readonly logger: Logger) {
    const buf = Buffer.from(url, 'base64')
    const uri = buf.toString('utf-8')
    this.client = new MongoClient(uri)
    this.client.on('connect', () => {
      this.logger.info('MongoDB connected')
    })
  }

  async connect() {
    const conn = await this.client.connect()

    this.logger.info(`${MongoService.name}-${this.connect.name}`, {
      eventNames: conn.eventNames(),
    })
  }

  async disconnect() {
    await this.client.close()
  }

  getClient() {
    return this.client
  }

  getCollection<T extends object>(collection: string = 'users'): Collection<T> {
    return this.client.db('users').collection(collection)
  }

  async userCollection() {
    const db = this.client.db('users')

    try {
      // const createCollection = await db.createCollection('users', {
      //   validator: {
      //     $jsonSchema: {
      //       bsonType: 'object',
      //       required: ['id', 'name', 'email', 'password'],
      //       properties: {
      //         id: {
      //           bsonType: 'string',
      //           description: 'must be a string and is required',
      //         },
      //         name: {
      //           bsonType: 'string',
      //           description: 'must be a string and is required',
      //         },
      //         detailsLanguages: {
      //           bsonType: 'array',
      //           description: 'must be a string and is required',
      //         },
      //         username: {
      //           bsonType: 'string',
      //           description: 'must be a string and is required',
      //         },
      //         email: {
      //           bsonType: 'string',
      //           description: 'must be a string and is required',
      //         },
      //         password: {
      //           bsonType: 'string',
      //           description: 'must be a string and is required',
      //         },
      //         role: {
      //           bsonType: 'array',
      //           description: 'must be a string and is required',
      //         },
      //         createdAt: {
      //           bsonType: 'date',
      //           description: 'must be a date and is required',
      //         },
      //         updatedAt: {
      //           bsonType: 'date',
      //           description: 'must be a date and is required',
      //         },
      //         deleteDate: {
      //           bsonType: 'date',
      //           description: 'must be a date and is required',
      //         },
      //       },
      //     },
      //   },
      // })

      // this.logger.info(`${MongoService.name}-${this.userCollection.name}====`, {
      //   createCollection,
      // })

      const createIndex = await db.collection('users').createIndexes(
        [
          { key: { email: 1 }, unique: true },
          { key: { id: 1 }, unique: true },
        ],
        { unique: true }
      )

      this.logger.info(`${MongoService.name}-${this.userCollection.name}`, {
        createIndex,
      })
    } catch (error) {
      this.logger.error(`${MongoService.name}-${this.userCollection.name}`, error)
    }
  }
}
