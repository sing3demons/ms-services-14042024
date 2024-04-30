import { Request, Response } from 'express'
import { UserRepository } from './user.repository'

export class UserController {
    constructor(private readonly userRepository: UserRepository) {}

    async getAll(req: Request, res: Response) {
        console.log('Getting all users')
        const users = await this.userRepository.getAll()
        console.log('Users', users)
        return res.json(users)
    }
}
