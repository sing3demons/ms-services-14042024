import { IContext } from '../core/context/context.js'
import Logger from '../core/logger/index.js'
import { UserRepository } from './user.repository.js'
import { IUserResponse } from './user.schema.js'
import config from '../config.js'
import { NotFoundError } from '../core/router/errors.js'

export class UserService {
  url: string
  constructor(private readonly userRepository: UserRepository, private readonly logger: Logger) {
    const { host, port } = config
    this.url = `http://${host}:${port}/users`
  }

  findOne = async (ctx: IContext, id: string) => {
    const logger = this.logger.Logger(ctx)
    const cmd = `${UserService.name}_${this.findOne.name}`
    logger.info(`${cmd} - id`, { id })
    const user = await this.userRepository.findOne(ctx, id)
    if (!user) {
      throw new NotFoundError('User not found')
    }
    return this.mappingResponse(user)
  }

  find = async (ctx: IContext, filter: object) => {
    const logger = this.logger.Logger(ctx)
    const cmd = `${UserService.name}_${this.find.name}`

    logger.info(`${cmd}`)
    const users = await this.userRepository.find(ctx, filter)

    return users.map((user) => this.mappingResponse(user))
  }

  delete = async (ctx: IContext, id: string) => {
    const logger = this.logger.Logger(ctx)
    const cmd = `${UserService.name}_${this.delete.name}`
    logger.info(`${cmd} - id`, { id })
    const result = await this.userRepository.delete(ctx, id)
    if (result.modifiedCount === 0) {
      throw new NotFoundError('User not found')
    }
    logger.info(`${cmd} - result`, result)
    return result
  }

  updateProfile = async <T extends object>(ctx: IContext, id: string, data: T) => {
    const logger = this.logger.Logger(ctx)
    const cmd = `${UserService.name}_${this.updateProfile.name}`
    logger.info(`${cmd} - id`, { id })
    const result = await this.userRepository.updateProfile(ctx, id, data)

    return result
  }

  private mappingResponse(user: IUserResponse) {
    const { id, name, email } = user
    return {
      id,
      href: `${this.url}/${id}`,
      name,
      email,
    }
  }
}
