import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { userRoutes } from './user/'

const router = Router()

router.use('/users', userRoutes)

// router.get('/', (req: Request, res: Response, next: NextFunction) => {
//     res.send('Hello World')
// })

export default router
