import { z } from 'zod'

export const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
})

export const ParamsSchema = z.object({
  id: z.string(),
})

export type userInfer = z.infer<typeof UserSchema>

export type IUser = userInfer & {
  id: string
  createdAt: string
  updatedAt: string
  role: string[]
}

export type IUserCollection = Omit<IUser, 'password' | 'createdAt' | 'updatedAt'>

export type IUserResponse = Omit<IUser, 'password' | 'createdAt' | 'updatedAt'> & {
  href: string
}

export const AttachmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  url: z.string().optional(),
  type: z.string().optional(),
  display: z
    .object({
      type: z.string(),
      value: z.array(z.string()),
    })
    .optional(),
})

export const IProfileLanguageSchema = z.object({
  id: z.string().optional(),
  languageCode: z.string().length(2).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional(),
  createDate: z.string().optional().default(new Date().toISOString()),
  updateDate: z.string().optional().default(new Date().toISOString()),
})

export type IProfileLanguage = z.infer<typeof IProfileLanguageSchema> & {
  '@Type': string
  ref: string
  href?: string
}

export type Attachment = z.infer<typeof AttachmentSchema>

export const ProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().length(10).optional(),
  address: z.string().optional(),
  languages: z.array(IProfileLanguageSchema).optional(),
  createDate: z.string().optional(),
  updateDate: z.string().optional().default(new Date().toISOString()),
})

export type IProfile = z.infer<typeof ProfileSchema> & {
  href?: string
}
