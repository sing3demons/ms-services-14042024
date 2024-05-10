import type { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../core/logger/utils.js'
import { BaseResponse } from '../core/router/response.js'
import { HttpError } from '../core/router/errors.js'

const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now()
  const session = req.header('x-session') ?? `default-${uuidv4()}`
  const data = {
    request: {
      headers: req.headers,
      host: req.headers.host,
      baseUrl: req.baseUrl,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req?.params,
      query: req?.query,
      clientIp: req.headers['x-forwarded-for'] ?? req?.socket.remoteAddress,
    },
    response: {
      headers: res.getHeaders(),
      statusCode: res.statusCode,
      body: {} as any,
    },
  }

  const originalSend = res.json
  res.json = (body) => {
    data.response.body = body
    return originalSend.call(res, body)
  }
  next()
  res.on('finish', () => {
    const end = performance.now()
    logger.info('http-summary', { session, ...data, duration: (end - start).toFixed(2) })
  })
}

function globalErrorHandler(error: unknown, _request: Request, response: Response<BaseResponse>, _next: NextFunction) {
  let statusCode = 500
  let message = ''

  if (error instanceof HttpError) {
    statusCode = error.statusCode
  }

  if (error instanceof Error) {
    console.log(`${error.name}: ${error.message}`)
    message = error.message

    if (message.includes('not found')) {
      statusCode = 404
    }
  } else {
    console.log('Unknown error')
    message = `An unknown error occurred, ${String(error)}`
  }

  response.status(statusCode).send({
    statusCode: statusCode,
    message,
    success: false,
    data: null,
    traceStack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
  })
}

export { httpLogger, globalErrorHandler }
