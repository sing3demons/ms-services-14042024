import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'

const router = Router()

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send('Hello World')
})

export default router
