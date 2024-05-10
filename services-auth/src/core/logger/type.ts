export type ContextType = Record<string, string>
export type ILogger = {
    info: (message: string, data?: {} | [], ctx?: ContextType) => void
    warn: (message: string, data?: {} | [], ctx?: ContextType) => void
    error: (message: string, data?: any, ctx?: ContextType) => void
    debug: (message: string, data?: {} | [], ctx?: ContextType) => void
}

export interface ISensitive {
    maskNumber(mobileNo: string, mask?: string): string
    maskEmail(email: string): string
    maskPassword(password: string): string
    masking(item: any): void
}

export interface IgnoreCase {
    equal(a: string, b: string): boolean
    notEqual(a: string, b: string): boolean
    contain(a: string, b: string): boolean
    notContain(a: string, b: string): boolean
    startWith(a: string, b: string): boolean
}

export type ILog = {
    info: (message: string, extra?: object) => void
    error: (message: string, extra?: object) => void
    warn: (message: string, extra?: object) => void
    debug: (message: string, extra?: object) => void
}
