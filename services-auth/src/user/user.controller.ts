import { UserRepository } from './user.repository'
import { BaseController } from '../core/base-controller'
import { route } from './user.bootstrap'

export class UserController extends BaseController {
    constructor(private readonly userRepository: UserRepository) {
        super()
    }

    get = route.get('/').handler(async () => {
        return {
            data: await this.userRepository.getAll(),
        }
    })

    create = route.post('/')
}
