import type { Request } from 'express'
import { hostname } from 'os'
import { v4 as uuidv4 } from 'uuid'

export type ContextType = ReturnType<typeof Context.getHeaders>

export default class Context {
    private static _bindings = new Map<Context, ContextType>()

    static bind(req: Request): void {
        const headers = Context.getHeaders(req)
        Context._bindings.set('x-session', headers)
    }

    static get() {
        return Context._bindings.get('x-session') as ContextType
    }

    static clear(): void {
        Context._bindings.delete('x-session')
    }

    static getHeaders(req: Request): ICustomHeaders {
        return {
            session: (req.headers['x-session'] as string) ?? `default-${uuidv4()}`,
            ip: (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            host: hostname() || undefined,
        }
    }
}

export type ICustomHeaders = {
    session: string
    ip?: string
    userAgent?: string
    host?: string
}