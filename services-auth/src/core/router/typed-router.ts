import type { NextFunction, Request, Response } from 'express'
import { BaseResponse } from './response.js'
import { fromZodError } from 'zod-validation-error'
import { z } from 'zod'
import { ValidationError } from './errors.js'
export type MaybePromise<T> = T | Promise<T>

export type RequestHandler = (req: Request, res: Response, next: NextFunction) => MaybePromise<BaseResponse>

export interface HandlerMetadata {
  __handlerMetadata: true
  method: string
  path: string
  handler: RequestHandler
}

enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
}

export class TypeRoute {
  get = (path: string) => new TypedRouteHandler(path, HttpMethod.GET)
  post = (path: string) => new TypedRouteHandler(path, HttpMethod.POST)
  put = (path: string) => new TypedRouteHandler(path, HttpMethod.PUT)
  delete = (path: string) => new TypedRouteHandler(path, HttpMethod.DELETE)
  patch = (path: string) => new TypedRouteHandler(path, HttpMethod.PATCH)
}

export type TypedHandler<
  TQuery extends z.ZodTypeAny,
  TParams extends z.ZodTypeAny,
  TBody extends z.ZodTypeAny,
  TResponse extends BaseResponse = BaseResponse
> = (context: {
  query: z.infer<TQuery>
  params: z.infer<TParams>
  body: z.infer<TBody>
  req: Request<z.infer<TParams>, any, z.infer<TBody>, z.infer<TQuery>>
  res: Response<TResponse>
}) => MaybePromise<TResponse>

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
  constructor(private readonly path: string, private readonly method: string) {}

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
          throw new ValidationError(`${message} ${validationError.toString()}`)
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
