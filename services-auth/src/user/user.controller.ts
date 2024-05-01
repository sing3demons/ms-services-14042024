import { Request, Response } from 'express'
import { UserRepository } from './user.repository'
import { BaseController } from '../core/base-controller'
import { BaseResponse } from '../core/response'

export class UserController extends BaseController {
    constructor(private readonly userRepository: UserRepository) {
        super()
    }

    async getAll(req: Request, res: Response) {
        const users = await this.userRepository.getAll()
        return { data: users }
    }
}
