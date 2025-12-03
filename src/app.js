import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

//Basic Configuration
app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(express.static('public'))
app.use(cookieParser())

//cors configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}))

import healthcheckRoutes from './routes/healthcheck.routes.js'
import authRoutes from './routes/auth.routes.js'


app.use('/api/v1/healthcheck', healthcheckRoutes)
app.use('/api/v1/auth', authRoutes)



app.get('/', (req, res) => {
    res.send('Hello World!')
})

export default app