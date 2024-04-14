import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import Context from './context/context.js'
import { Router } from './root-routes.js'
const port = process.env.PORT || 3000

const app = express()

app.use((req, _res, next) => {
    if (!req.headers['x-session']) {
        req.headers['x-session'] = `default-${uuidv4()}`
    }
    Context.bind(req)
    next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_req, res) => {
    res.status(200).json({ message: 'OK' })
})

app.use('/api/v1', Router)

const server = app.listen(port, () =>
    console.log('Server is listening on port ' + port)
)

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server')
    server.close(() => process.exit(0))
})
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server')
    server.close(() => process.exit(0))
})
