import { Database } from '../core'
import { UserController } from './user.controller'
import { UserModel } from './user.model'
import { UserRepository } from './user.repository'
import { v4 as uuidv4 } from 'uuid'

const db = new Database<UserModel>('users', {
    defaultData: [
        { id: uuidv4(), username: 'John Doe', email: 'user1@dev.com' },
        { id: uuidv4(), username: 'Jane Doe', email: 'user2@dev.com' },
    ],
})
const userRepository = new UserRepository(db)
export const userController = new UserController(userRepository)
