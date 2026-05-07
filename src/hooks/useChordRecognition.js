import { useEffect, useRef } from 'react'

const CONFIRM_FRAMES = 6
const API_URL = (import.meta.env.VITE_API_URL ?? '') + '/api/recognize-chord'

export default function useChordRecognition({
  handResults,
  leftHanded,
  onChordDetected,
  enabled = true,
}) {
  const candidateRef = useRef({ chord: null, count: 0 })
  const pendingRef   = useRef(false)

  useEffect(() => {
    if (!enabled || !handResults?.landmarks?.length) {
      candidateRef.current = { chord: null, count: 0 }
      return
    }

    const fretLabel = leftHanded ? 'Right' : 'Left'
    const fretIdx   = handResults.handedness?.findIndex(
      h => h[0]?.categoryName === fretLabel
    ) ?? -1

    if (fretIdx === -1) {
      candidateRef.current = { chord: null, count: 0 }
      return
    }

    const hand = handResults.landmarks[fretIdx]
    if (!hand || pendingRef.current) return

    pendingRef.current = true

    fetch(API_URL, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ landmarks: hand }),
    })
      .then(r => r.json())
      .then(({ chord }) => {
        if (!chord) {
          candidateRef.current = { chord: null, count: 0 }
          return
        }
        if (chord === candidateRef.current.chord) {
          candidateRef.current.count++
          if (candidateRef.current.count === CONFIRM_FRAMES) {
            onChordDetected?.(chord)
          }
        } else {
          candidateRef.current = { chord, count: 1 }
        }
      })
      .catch(() => {})
      .finally(() => { pendingRef.current = false })
  }, [handResults, leftHanded, enabled, onChordDetected])
}
