import express from 'express'
import { TodoRoute } from './todo/todo.route.js'

const router = express.Router()

router.use('/todo', TodoRoute.Register(router))

export const Router = router
