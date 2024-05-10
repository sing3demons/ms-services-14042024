import { z } from 'zod'

export interface IUser {
  id: string
  createdAt: string
  updatedAt: string
  role: string[]
  email: string
  name: string
  password: string
}

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})
