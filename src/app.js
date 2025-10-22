import express from 'express'
import cors from 'cors'


const app = express()

//Basic Configuration
app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(express.static('public'))

//cors configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.get('/', (req, res) => {
    res.send('Hello World!')
})

export default app