import { z } from 'zod'
import Context from '../core/context/context.js'
import Logger from '../core/logger/index.js'
import { TypeRoute } from '../core/router/index.js'
import { LoginSchema } from './auth.model.js'
import { AuthService } from './auth.service.js'
import { UserSchema } from '../user/user.schema.js'
import { UnauthorizedError } from '../core/router/errors.js'

export class AuthController {
  constructor(
    private readonly route: TypeRoute,
    private readonly authService: AuthService,
    private readonly logger: Logger
  ) {}

  login = this.route
    .post('/login')
    .body(LoginSchema)
    .handler(async ({ body }) => {
      const ctx = Context.get()
      const logger = this.logger.Logger(ctx)
      const cmd = `${AuthController.name}_${this.login.method}`
      logger.info(`${cmd}`, body)
      const { email, password } = body
      const { access_token, refresh_token } = await this.authService.login(ctx, email, password)
      return {
        data: {
          access_token,
          refresh_token,
        },
      }
    })

  refreshToken = this.route
    .post('/refreshToken')
    .body(
      z.object({
        token: z.string(),
      })
    )
    .handler(async ({ body }) => {
      const ctx = Context.get()
      const logger = this.logger.Logger(ctx)
      logger.info(`${AuthController.name} - ${this.refreshToken.method}`)
      return {
        message: 'Auth controller',
        data: await this.authService.refresh(ctx, body.token),
      }
    })

  register = this.route
    .post('/register')
    .body(UserSchema)
    .handler(async ({ body }) => {
      const ctx = Context.get()
      const logger = this.logger.Logger(ctx)
      logger.info(`${AuthController.name} - ${this.register.method}`)
      const result = await this.authService.register(ctx, body)
      return {
        message: 'User created',
        data: result,
      }
    })

  verifyToken = this.route.get('/verifyToken').handler(async ({ req }) => {
    const ctx = Context.get()
    const logger = this.logger.Logger(ctx)
    const authHeader = req.header('authorization')
    if (!authHeader) {
      throw new UnauthorizedError('Token not found')
    }
    console.log('=========================>authHeader', authHeader)
    const [bearer, token] = authHeader.split(' ')
    if (bearer !== 'Bearer') {
      throw new UnauthorizedError('Invalid token')
    }
    if (!token) {
      throw new UnauthorizedError('Token not found')
    }
    const data = await this.authService.validateToken(ctx, token)
    logger.info(`${AuthController.name} - verifyToken`, data)
    return {
      success: true,
      statusCode: 200,
      message: 'success',
    }
  })
}
