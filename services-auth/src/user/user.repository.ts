import { UserModel } from "./user.model";

export class UserRepository {
    async getAll(){
        const users: UserModel[] = [{
            id: '1',
            username: 'user1',
            password: 'password',
            email: 'user1@dev.com'
        }]
        return users
    }
}