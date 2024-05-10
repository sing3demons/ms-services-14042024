import { Logger as WinstonLog } from 'winston'

import { ContextType, ILogger } from './type.js'
import { CreateLogger, makeStructuredClone } from './utils.js'

class Logger implements ILogger {
    private readonly log: WinstonLog
    constructor() {
        this.log = CreateLogger()
    }

    Logger(ctx?: ContextType, extra?: object): ILogger {
        return this.log.child({ ...ctx, ...extra }) as ILogger
    }

    info(message: string, data?: {} | [], ctx?: ContextType) {
        const action = { ...makeStructuredClone(data) }
        this.log.info(message, { action, session: ctx?.session })
    }

    warn(message: string, data?: {} | [], ctx?: ContextType) {
        const action = { ...makeStructuredClone(data) }
        this.log.warn(message, { action, ...ctx })
    }

    error(message: string, data?: any, ctx?: ContextType) {
        const action = { ...makeStructuredClone(data) }
        this.log.error(message, { action, ...ctx })
    }

    debug(message: string, data?: {} | [], ctx?: ContextType) {
        const action = { ...makeStructuredClone(data) }
        this.log.debug(message, { action, ...ctx })
    }
}

export default Logger
