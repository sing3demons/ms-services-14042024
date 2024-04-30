import { Request, Response } from 'express'

export class UserController {
    async getAll(req: Request, res: Response) {
        console.log('Hello from user controller')
       
        res.send('Hello from user controller')
    }
}
// const router = new Router();

// export default router.instance
