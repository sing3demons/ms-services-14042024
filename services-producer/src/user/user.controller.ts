import Context from '../context/context.js'
import Logger from '../core/logger/index.js'
import { TypeRoute } from '../core/route/index.js'
import { BaseResponse, UserSchema } from './user.model.js'
import { UserService } from './user.service.js'

export class UserController {
    constructor(
        private readonly route: TypeRoute,
        private readonly userService: UserService,
        private readonly logger: Logger
    ) {}

    get = this.route.get('/').handler(async ({ res }) => {
        const result = await this.userService.get()
        res.status(200).json({ status: 'success', data: result } satisfies BaseResponse)
    })

    create = this.route
        .post('/')
        .body(UserSchema)
        .handler(async ({ res, body }) => {
            const ctx = Context.get()
            const logger = this.logger.Logger(ctx)
            const result = await this.userService.create(ctx, body)
            const response = { status: 'success', data: result } satisfies BaseResponse
            logger.info(`${UserController.name}-create`, { response })
            res.status(201).json(response)
        })
}
