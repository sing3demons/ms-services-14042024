import { Router, Request, Response, NextFunction } from 'express'
import { HandlerMetadata, RequestHandler } from './typed-router.js'
import { BaseResponse } from './response.js'
import { logger } from '../logger/utils.js'

export function catchAsync(fn: (...args: any[]) => any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err))
  }
}

export class MyRouter {
  constructor(public readonly instance: Router = Router()) {}

  private preRequest(handler: RequestHandler) {
    const invokeHandler = async (req: Request, res: Response, next: NextFunction) => {
      const result = await handler(req, res, next)
      return res.send({
        success: true,
        message: 'Request successful',
        ...result,
      } satisfies BaseResponse)
    }
    return catchAsync(invokeHandler)
  }

  Register(classInstance: object) {
    const fields = Object.values(classInstance)
    fields.forEach((field) => {
      const route = field as HandlerMetadata
      if (route.__handlerMetadata) {
        const { path, handler } = route
        const method = route.method.toLowerCase()
        logger.info(`${classInstance.constructor.name}_${method.toUpperCase()} ${path}`)
        ;(this.instance.route(path) as any)[method](this.preRequest(handler))
      }
    })
    return this
  }
}
