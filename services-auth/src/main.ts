import express from 'express'
import helmet from 'helmet'
import Context from './core/context/context.js'
import MongoService from './core/mongo/index.js'
import Logger from './core/logger/index.js'
import { TypeRoute } from './core/router/typed-router.js'
import { globalErrorHandler, httpLogger } from './middleware/index.js'
import config from './config.js'
import { RedisService } from './core/redis/index.js'
import { Register } from './router.js'

const port = config.port

const logger = new Logger()
const route = new TypeRoute()
const mongoService = new MongoService(logger)
const redisClient = new RedisService(logger)

const app = express()

app.use(Context.Ctx)
app.use(helmet())
app.use(httpLogger)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

async function main() {
  await mongoService.connect()
  await redisClient.connect()

  // await mongoService.userCollection()

  const client = mongoService.getClient()
  app.get('/healthz', (_req, res) => res.status(200).json('OK'))
  app.use('/', Register(route, client, redisClient, logger))
  app.use(globalErrorHandler)
}

main()
  .then(() => {
    const server = app.listen(port, () => logger.info(`Server running on port ${port}`))

    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server')
      server.close(() => process.exit(0))
    })

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server')
      server.close(() => process.exit(0))
    })
  })
  .catch((err) => {
    logger.error(err)
    process.exit(1)
  })
