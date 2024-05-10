import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError } from '../core/router/errors.js'
import config from '../config.js'
import jwt from 'jsonwebtoken'

export function verifyToken(req: Request, _res: Response, next: NextFunction) {
  const token = getToken(req)
  if (!token) {
    throw new UnauthorizedError('Invalid token')
  }

  const secret = config.jwt.publicKey
  if (!secret) {
    throw new UnauthorizedError('Invalid token')
  }

  const secretOrPrivateKey = Buffer.from(secret, 'base64')

  try {
    const payload = jwt.verify(token, secretOrPrivateKey) as PayloadToken
    if (!payload) {
      throw new UnauthorizedError('Invalid token')
    }

    (req as CustomRequest).user = payload
    next()
  } catch (err) {
    throw new UnauthorizedError('Invalid token')
  }
}

// interface JWTRequest extends Request {
//   user?: PayloadToken
// }

type CustomRequest = Request & { user?: PayloadToken }

interface PayloadToken {
  userId?: string
  role?: string[]
  sub?: string
  username?: string
}

function getToken(req: Request) {
  try {
    const authHeader = req.header('authorization')
    if (!authHeader) {
      throw new UnauthorizedError('Token not found')
    }
    const [bearer, token] = authHeader.split(' ')
    if (bearer !== 'Bearer') {
      throw new UnauthorizedError('Invalid token')
    }
    if (!token) {
      throw new UnauthorizedError('Token not found')
    }
    return token
  } catch (err) {
    if (err instanceof Error) {
      throw new UnauthorizedError('Invalid token')
    } else {
      throw new UnauthorizedError('Invalid token')
    }
  }
}
