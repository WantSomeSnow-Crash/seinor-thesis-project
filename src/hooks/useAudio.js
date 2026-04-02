import { useRef, useCallback } from 'react'

// All unique note samples used across every chord
const NOTE_FILES = [
  'E2','A2','B2','C3','D3','E3','G2','G3','Gs3',
  'A3','B3','C4','D4','E4','Fs4','G4',
]

// Strum samples: one up + one down per chord
const CHORD_NAMES = ['Em', 'E', 'G', 'C', 'D', 'Am']
const DIRECTIONS  = ['down', 'up']

export default function useAudio() {
  const ctxRef          = useRef(null)
  const buffersRef      = useRef({})   // note name → AudioBuffer
  const strumBuffersRef = useRef({})   // "Em_down" etc → AudioBuffer
  const loadedRef       = useRef(false)

  const initAudio = useCallback(async () => {
    if (loadedRef.current) return

    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') await ctx.resume()

    // Load individual note samples + strum samples in parallel
    await Promise.all([
      ...NOTE_FILES.map(async (note) => {
        try {
          const res = await fetch(`/sounds/${note}.mp3`)
          const buf = await res.arrayBuffer()
          buffersRef.current[note] = await ctx.decodeAudioData(buf)
        } catch (e) {
          console.warn(`Could not load sample: ${note}.mp3`, e)
        }
      }),
      ...CHORD_NAMES.flatMap(chord =>
        DIRECTIONS.map(async (dir) => {
          const key = `${chord}_${dir}`
          try {
            const res = await fetch(`/sounds/strums/${key}.mp3`)
            const buf = await res.arrayBuffer()
            strumBuffersRef.current[key] = await ctx.decodeAudioData(buf)
          } catch (e) {
            console.warn(`Could not load strum: ${key}.mp3`, e)
          }
        })
      ),
    ])

    loadedRef.current = true
  }, [])

  // Play a single note sample (learn mode)
  const playString = useCallback(async (stringIndex, note) => {
    if (!note) return
    await initAudio()
    const ctx = ctxRef.current
    const buf = buffersRef.current[note]
    if (!ctx || !buf) return
    const src  = ctx.createBufferSource()
    src.buffer = buf
    const gain = ctx.createGain()
    gain.gain.value = 1.0
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start()
  }, [initAudio])

  // Play a full chord strum recording (rock mode)
  const playStrum = useCallback(async (chord, direction) => {
    await initAudio()
    const ctx = ctxRef.current
    const buf = strumBuffersRef.current[`${chord}_${direction}`]
    if (!ctx || !buf) return
    const src  = ctx.createBufferSource()
    src.buffer = buf
    const gain = ctx.createGain()
    gain.gain.value = 1.2
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start()
  }, [initAudio])

  // playChord kept for compatibility
  const playChord = useCallback(async (notes) => {
    if (!notes?.length) return
    await initAudio()
    notes.forEach((note, i) => {
      setTimeout(() => playString(i, note), i * 45)
    })
  }, [initAudio, playString])

  return { playChord, playString, playStrum, initAudio }
}
