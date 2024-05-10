import { Router } from '../core'
import { userController } from './user.bootstrap'

// const router = new Router()
// router.get('/', userController.getAll)

// export default router.instance

export default new Router().Register(userController).instance
