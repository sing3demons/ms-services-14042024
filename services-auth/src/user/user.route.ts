import express from 'express'

import { userController } from './user.bootstrap'

const router = express.Router()

router.get('/', userController.getAll.bind(userController))

export default router
