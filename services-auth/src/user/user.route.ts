import express from 'express'

import { userController } from './user.bootstrap'

const router = express.Router()

router.route('/').get(userController.getAll)

export default router
