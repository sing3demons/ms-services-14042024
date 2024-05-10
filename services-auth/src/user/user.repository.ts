import type { Document, Filter, FindOptions, InsertOneOptions, MongoClient } from 'mongodb'
import Logger from '../core/logger/index.js'
import { IContext } from '../core/context/context.js'
import { IProfile, IProfileLanguage, IUser, IUserResponse } from './user.schema.js'
import { v4 as uuidv4 } from 'uuid'

export class UserRepository {
  constructor(private readonly client: MongoClient, private readonly logger: Logger) {}

  private getCollection<T extends object>(collection: string = 'users') {
    return this.client.db('users').collection<T>(collection)
  }

  async create(ctx: IContext, data: object, options?: InsertOneOptions) {
    const logger = this.logger.Logger(ctx)
    logger.info(`${UserRepository.name} - ${this.create.name}`)
    const result = await this.getCollection().insertOne(data, options)
    logger.info(`${UserRepository.name} - ${this.create.name} - result`, result)
    return result
  }

  async find(ctx: IContext, filter: Filter<Document>, options?: FindOptions) {
    const logger = this.logger.Logger(ctx)
    logger.info(`${UserRepository.name} - ${this.find.name}`)
    filter = { ...filter, deleteDate: null }
    return await this.getCollection<IUserResponse>('users').find(filter, options).toArray()
  }

  async findOne(ctx: IContext, id: string) {
    const logger = this.logger.Logger(ctx)
    logger.info(`${UserRepository.name} - ${this.findOne.name}`)
    const filter = { id, deleteDate: null }
    return await this.getCollection<IUserResponse>('users').findOne(filter, {
      projection: { _id: 0, password: 0, createdAt: 0, updatedAt: 0, deleteDate: 0 },
    })
  }

  async findByEmail(ctx: IContext, email: string) {
    const logger = this.logger.Logger(ctx)
    logger.info(`${UserRepository.name} - ${this.findByEmail.name}`)
    const filter = { email, deleteDate: null }
    return await this.getCollection<IUser>('users').findOne(filter)
  }

  async delete(ctx: IContext, id: string) {
    const logger = this.logger.Logger(ctx)
    logger.info(`${UserRepository.name} - ${this.delete.name}`)
    const filter = { id, deleteDate: null }
    const update = { $set: { deleteDate: new Date().toString() } }
    return await this.getCollection<IUserResponse>('users').updateOne(filter, update)
  }

  async updateProfile<T extends object>(ctx: IContext, id: string, data: T) {
    const logger = this.logger.Logger(ctx)
    logger.info(`${UserRepository.name} - ${this.updateProfile.name}`)
    const filter = { id, deleteDate: null }
    const session = this.client.startSession()
    try {
      session.startTransaction()
      const user = await this.getCollection<IUserResponse>('users').findOne(filter, { session })
      if (!user) {
        throw new Error('User not found')
      }

      const { name, phone, address, languages } = data as IProfile
      console.log('=========================>data', data)

      const userLanguage = await this.getCollection<IProfileLanguage>('userLanguage')
        .find({ refId: id }, { session })
        .toArray()

      if (userLanguage.length !== 0) {
        const deleteLang = await this.getCollection<IProfileLanguage>('userLanguage').deleteMany(
          { refId: id },
          { session }
        )
        logger.info(`${UserRepository.name} - ${this.updateProfile.name} - deleteLanguage`, deleteLang)
      }

      let profileLanguage: IProfileLanguage[] = []
      for (const lang of languages || []) {
        const update: IProfileLanguage = {
          id: lang.id ?? uuidv4(),
          ref: id,
          '@Type': 'ProfileLanguage',
          languageCode: lang.languageCode,
          name: lang.name,
          description: lang.description,
          attachments: lang.attachments,
          createDate: new Date().toISOString(),
          updateDate: new Date().toISOString(),
        }
        profileLanguage.push(update)
      }
      console.log('=========================>profileLanguage', profileLanguage)

      const update = {
        $set: {
          email: user.email,
          name: name && name,
          phone: phone && phone,
          address: address && address,
          updatedAt: new Date().toString(),
          languages: profileLanguage.map((lang) => ({ id: lang.id, name: lang.name, languageCode: lang.languageCode })),
        },
      }
      const updateProfile = await this.getCollection<IUserResponse>('users').updateOne(filter, update, { session })

      if (profileLanguage.length !== 0) {
        const updateLang = await this.getCollection<IProfileLanguage>('userLanguage').insertMany(profileLanguage, {
          session,
        })
        logger.info(`${UserRepository.name} - ${this.updateProfile.name} - updateLanguage`, updateLang)
      }

      await session.commitTransaction()
      logger.info(`${UserRepository.name} - ${this.updateProfile.name} - updateProfile`, updateProfile)
      return {
        updateProfile,
      }
    } catch (error) {
      await session.abortTransaction()
      logger.error(`${UserRepository.name} - ${this.updateProfile.name} - error==============`, error)
      throw error
    } finally {
      await session.endSession()
    }
  }

  async upsertSession<T extends object>(ctx: IContext, username: string, data: T) {
    const logger = this.logger.Logger(ctx)
    logger.info(`${UserRepository.name} - ${this.upsertSession.name}`)

    const filter = { username: username }
    const result = await this.getCollection('sessions').findOneAndUpdate(
      filter,
      { $set: { id: ctx.session, payload: data, header: ctx, updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Upsert session failed')
    }
    logger.info(`${UserRepository.name} - ${this.upsertSession.name} - result`, result)
    return result
  }

  async findSession(ctx: IContext, username: string) {
    const logger = this.logger.Logger(ctx)
    logger.info(`${UserRepository.name} - ${this.findSession.name}`)
    const filter = { username }
    return await this.getCollection('sessions').findOne(filter)
  }
}
