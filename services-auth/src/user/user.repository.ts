import { Database } from '../core'
import { UserModel } from './user.model'

export class UserRepository {
    constructor(private readonly db: Database<UserModel>) {}
    async getAll() {
        return await this.db.readAll()
    }
}
