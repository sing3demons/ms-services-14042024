import { z } from 'zod'
import { Request, Response } from 'express'
import { BaseResponse } from './response'
import { RequestHandler } from './router'

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

export interface HandlerMetadata {
    __handlerMetadata: true
    method: string
    path: string
    handler: RequestHandler
}

export type MaybePromise<T> = T | Promise<T>
