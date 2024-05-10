import type { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../logger/utils.js'
import axios from 'axios'
import { serviceAuth } from '../../config.js'
import jwt from 'jsonwebtoken'

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
        logger.info('httpLogger', { session, ...data, duration: (end - start).toFixed(2) })
    })
}

interface PayloadToken {
    userId?: string
    role?: string[]
    sub?: string
    username?: string
}

interface JWTRequest extends Request {
    user?: PayloadToken
}

async function customRequest(req: JWTRequest, res: Response, next: NextFunction) {
    const authHeader = req.header('authorization')
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const xSession = req.header('x-session')
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-session': xSession }
    try {
        const { data } = await axios.get(serviceAuth, { headers })
        if (!data) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        if (data.statusCode === 200 && data.message === 'success') {
            const jwtPayload = jwt.decode(token) as PayloadToken
            req.user = jwtPayload
            return next()
        } else {
            return res.status(401).json({ message: 'Unauthorized' })
        }
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) =>
    customRequest(req as JWTRequest, res, next)

export { httpLogger, authMiddleware }
