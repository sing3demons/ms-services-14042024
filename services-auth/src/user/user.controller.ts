import { Request, Response } from 'express'
import { UserRepository } from './user.repository'
import { BaseController } from '../core/base-controller'
import { BaseResponse } from '../core/response'
import autoBind from 'auto-bind';


export class UserController {
    constructor(private readonly userRepository: UserRepository) {
        autoBind(this);
    }

    async getAll(req: Request, res: Response) {
        const users = await this.userRepository.getAll()
        // return { data: users }
        return res.send({ data: users })
    }
}
