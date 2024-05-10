import Context from '../core/context/context.js'
import Logger from '../core/logger/index.js'
import { TypeRoute } from '../core/router/typed-router.js'
import { ParamsSchema, ProfileSchema } from './user.schema.js'
import { UserService } from './user.service.js'

export class UserController {
  constructor(
    private readonly route: TypeRoute,
    private readonly userService: UserService,
    private readonly logger: Logger
  ) {}

  get = this.route.get('/').handler(async () => {
    const ctx = Context.get()
    const logger = this.logger.Logger(ctx)
    logger.info(`${UserController.name} - ${this.get.method}`)
    const data = await this.userService.find(ctx, {})
    return {
      data: data,
    }
  })

  getById = this.route
    .get('/:id')
    .params(ParamsSchema)
    .handler(async ({ params }) => {
      const ctx = Context.get()
      const logger = this.logger.Logger(ctx)
      logger.info(`${UserController.name} - ${this.getById.method}`)
      const data = await this.userService.findOne(ctx, params.id)
      return {
        data: data,
      }
    })

  delete = this.route
    .delete('/:id')
    .params(ParamsSchema)
    .handler(async ({ params }) => {
      const ctx = Context.get()
      const logger = this.logger.Logger(ctx)
      logger.info(`${UserController.name} - ${this.delete.method}`)
      const result = await this.userService.delete(ctx, params.id)
      return {
        message: 'User deleted',
        data: result,
      }
    })

  updateProfile = this.route
    .patch('/profile/:id')
    .params(ParamsSchema)
    .body(ProfileSchema)
    .handler(async ({ params, body }) => {
      const ctx = Context.get()
      const logger = this.logger.Logger(ctx)
      logger.info(`${UserController.name} - ${this.updateProfile.method}`)
      const result = await this.userService.updateProfile(ctx, params.id, body)
      return {
        message: 'User updated',
        data: result,
      }
    })
}
