import express from 'express'

import router from './root-routes'
import { globalErrorHandler } from './core'

const app = express()

app.use(express.json())

app.use(express.urlencoded({ extended: true }))
app.use(router)
app.use(globalErrorHandler)

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
})
