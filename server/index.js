import express from 'express'
import cors from 'cors'
import { recognizeChord } from './chordRecognition.js'

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '50kb' }))

app.post('/api/recognize-chord', (req, res) => {
  const { landmarks } = req.body
  if (!Array.isArray(landmarks) || landmarks.length !== 21) {
    return res.status(400).json({ error: 'Invalid landmarks' })
  }
  const result = recognizeChord(landmarks)
  res.json(result)
})

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
