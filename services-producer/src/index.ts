import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import Context from './context/context.js'
import { Routes } from './root-routes.js'
import { logger } from './core/logger/utils.js'
import { host, port } from './config.js'
import { httpLogger } from './core/middleware/index.js'

const app = express()

app.use((req, _res, next) => {
    if (!req.headers['x-session']) {
        req.headers['x-session'] = `default-${uuidv4()}`
    }
    Context.bind(req)
    next()
})

app.use(httpLogger)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_req, res) => {
    res.status(200).json({ message: 'OK' })
})

app.use('/api/v1', Routes)

const server = app.listen(port, () => logger.info(`Server is running on http://${host}:${port}`))

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server')
    server.close(() => process.exit(0))
})
process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server')
    server.close(() => process.exit(0))
})
