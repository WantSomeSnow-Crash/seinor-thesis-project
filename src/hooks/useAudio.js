import { useRef, useCallback } from 'react'
import * as Tone from 'tone'

export default function useAudio() {
  const synthsRef   = useRef(null)
  const reverbRef   = useRef(null)
  const startedRef  = useRef(false)
  const cooldownRef = useRef(0)

  const initAudio = useCallback(async () => {
    if (startedRef.current) return
    await Tone.start()
    startedRef.current = true

    const reverb = new Tone.Reverb({ decay: 2.2, wet: 0.30 }).toDestination()
    await reverb.ready
    reverbRef.current = reverb

    // One PluckSynth per string — Karplus-Strong algorithm gives a realistic pluck
    synthsRef.current = Array.from({ length: 6 }, () =>
      new Tone.PluckSynth({
        attackNoise : 1.4,
        dampening   : 3800,
        resonance   : 0.96,
      }).connect(reverb)
    )
  }, [])

  const playChord = useCallback(async (notes) => {
    if (!notes?.length) return

    // Enforce a short cooldown so rapid re-triggers don't stack
    const now = Date.now()
    if (now - cooldownRef.current < 350) return
    cooldownRef.current = now

    await initAudio()
    if (!synthsRef.current) return

    // Strum: each string fires 45 ms after the previous
    notes.forEach((note, i) => {
      setTimeout(() => {
        try {
          synthsRef.current[i % 6]?.triggerAttack(note, Tone.now())
        } catch (_) { /* ignore note errors */ }
      }, i * 45)
    })
  }, [initAudio])

  return { playChord, initAudio }
}
