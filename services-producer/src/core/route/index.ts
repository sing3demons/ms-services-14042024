import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { fromZodError } from 'zod-validation-error'

type RequestHandler = <T>(req: Request, res: Response, next: NextFunction) => MaybePromise<T>

function catchAsync(fn: (...args: any[]) => any) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((err) => next(err))
    }
}

type MaybePromise<T> = T | Promise<T>

interface HandlerMetadata {
    __handlerMetadata: true
    method: string
    path: string
    handler: RequestHandler
}

type TypedHandler<
    TQuery extends z.ZodTypeAny,
    TParams extends z.ZodTypeAny,
    TBody extends z.ZodTypeAny,
    TResponse extends z.ZodTypeAny = any
> = (context: {
    query: z.infer<TQuery>
    params: z.infer<TParams>
    body: z.infer<TBody>
    req: Request<z.infer<TParams>, any, z.infer<TBody>, z.infer<TQuery>>
    res: Response<TResponse>
}) => MaybePromise<TResponse>

export class MyRoute {
    constructor(public readonly instance: Router = Router()) {}

    private preRequest(handler: RequestHandler) {
        const invokeHandler = async (req: Request, res: Response, next: NextFunction) => {
            const result = await handler(req, res, next)
            return result
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
                console.log(`${classInstance.constructor.name}_${method.toUpperCase()} ${path}`)
                ;(this.instance.route(path) as any)[method](this.preRequest(handler))
            }
        })
        return this
    }
}

// enum HttpMethod {
//     GET = 'get',
//     POST = 'post',
//     PUT = 'put',
//     DELETE = 'delete',
//     PATCH = 'patch',
// }

const httpMethod = ['get', 'post', 'put', 'delete', 'patch'] as const
type HttpMethod = (typeof httpMethod)[number]

export class TypeRoute {
    get = (path: string) => new TypedRouteHandler(path, 'get')
    post = (path: string) => new TypedRouteHandler(path, 'post')
    put = (path: string) => new TypedRouteHandler(path, 'put')
    delete = (path: string) => new TypedRouteHandler(path, 'delete')
    patch = (path: string) => new TypedRouteHandler(path, 'patch')
}

export class TypedRouteHandler<
    RouteQuery extends z.ZodTypeAny,
    RouteParams extends z.ZodTypeAny,
    RouteBody extends z.ZodTypeAny
> {
    private schema: {
        query?: z.ZodTypeAny
        params?: z.ZodTypeAny
        body?: z.ZodTypeAny
    } = {}
    constructor(private readonly path: string, private readonly method: HttpMethod) {}

    query<Query extends z.ZodTypeAny>(schema: Query) {
        this.schema.query = schema
        return this as unknown as TypedRouteHandler<Query, RouteParams, RouteBody>
    }

    body<Body extends z.ZodTypeAny>(schema: Body) {
        this.schema.body = schema
        return this as unknown as TypedRouteHandler<RouteQuery, RouteParams, Body>
    }

    params<Params extends z.ZodTypeAny>(schema: Params) {
        this.schema.params = schema
        return this as unknown as TypedRouteHandler<RouteQuery, Params, RouteBody>
    }

    handler(handler: TypedHandler<RouteQuery, RouteParams, RouteBody>): HandlerMetadata {
        const invokeHandler = async (req: Request, res: Response) => {
            let message = ''
            let query, params, body
            try {
                message = 'Query'
                query = this.schema.query ? this.schema.query.parse(req.query) : undefined
                message = 'Params'
                params = this.schema.params ? this.schema.params.parse(req.params) : undefined
                message = 'Body'
                body = this.schema.body ? this.schema.body.parse(req.body) : undefined
            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    const validationError = fromZodError(error)
                    throw new Error(`${message} ${validationError.toString()}`)
                }
            }
            return handler({ query, params, body, req, res })
        }
        return {
            method: this.method,
            path: this.path,
            handler: invokeHandler,
            __handlerMetadata: true,
        }
    }
}
