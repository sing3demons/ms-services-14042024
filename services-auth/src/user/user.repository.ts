import { Database } from '../core'
import { UserModel } from './user.model'

export class UserRepository {
    constructor(private readonly db: Database<UserModel>) {}
    async getAll() {
        console.log('Getting all users')
        return await this.db.readAll()
    }
}
