import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { userRoutes } from './user/index'

const router = Router()

router.use('/users', userRoutes)

router.get('/healthz', (req: Request, res: Response) => {
    res.send('ok')
})

export default router
