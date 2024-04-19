import { z } from 'zod'

export enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inActive',
}

export interface Todo {
    id?: string
    title: string
    description?: string
    completed: boolean
    startDate: string
    endDate: string
    status: Status
}

export const paramsSchema = z.object({
    id: z.string(),
})

export const todoSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    completed: z.boolean(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.nativeEnum(Status),
})
