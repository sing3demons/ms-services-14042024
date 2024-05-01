import { Router } from '../core'
import { userController } from './user.bootstrap'
import express from 'express'

const router = new Router()
router.get('/', userController.getAll)

export default router.instance
