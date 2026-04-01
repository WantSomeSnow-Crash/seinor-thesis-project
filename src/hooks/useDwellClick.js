import { useEffect, useRef, useState } from 'react'

const DWELL_MS     = 1000   // ms to hold over a button before it clicks
const MOVE_THRESH  = 30     // px — if finger moves more than this, reset the timer

export default function useDwellClick({ handResults, enabled = true }) {
  const [cursor, setCursor] = useState(null)  // { x, y, progress 0-1 } | null

  const startRef    = useRef(null)   // { x, y, time, el }
  const rafRef      = useRef(null)

  useEffect(() => {
    if (!enabled) {
      setCursor(null)
      startRef.current = null
      return
    }

    if (!handResults?.landmarks?.length) {
      setCursor(null)
      startRef.current = null
      return
    }

    // Use whichever hand is visible — prefer index finger tip (landmark 8)
    const hand = handResults.landmarks[0]
    const tip  = hand?.[8] ?? hand?.[0]
    if (!tip) return

    // Mirror x to match the CSS-mirrored video
    const sx = (1 - tip.x) * window.innerWidth
    const sy = tip.y * window.innerHeight

    setCursor(prev => ({ x: sx, y: sy, progress: prev?.progress ?? 0 }))

    const prev = startRef.current

    if (!prev) {
      // First detection — start tracking
      startRef.current = { x: sx, y: sy, time: Date.now(), el: document.elementFromPoint(sx, sy) }
      return
    }

    const dist = Math.hypot(sx - prev.x, sy - prev.y)
    if (dist > MOVE_THRESH) {
      // Finger moved — reset
      startRef.current = { x: sx, y: sy, time: Date.now(), el: document.elementFromPoint(sx, sy) }
      setCursor({ x: sx, y: sy, progress: 0 })
      return
    }

    // Check we're still over the same interactive element
    const el = document.elementFromPoint(sx, sy)
    const btn = el?.closest('button, [role="button"], a')

    if (!btn) {
      startRef.current = { x: sx, y: sy, time: Date.now(), el: null }
      setCursor({ x: sx, y: sy, progress: 0 })
      return
    }

    if (btn !== prev.el) {
      // Moved to a different button — reset on this one
      startRef.current = { x: sx, y: sy, time: Date.now(), el: btn }
      setCursor({ x: sx, y: sy, progress: 0 })
      return
    }

    // Same button — compute dwell progress
    const elapsed  = Date.now() - prev.time
    const progress = Math.min(elapsed / DWELL_MS, 1)
    setCursor({ x: sx, y: sy, progress })

    if (progress >= 1) {
      btn.click()
      // Reset so it doesn't fire repeatedly
      startRef.current = { x: sx, y: sy, time: Date.now() + 600, el: null }
    }
  }, [handResults, enabled])

  // Clear cursor when disabled
  useEffect(() => {
    if (!enabled) setCursor(null)
  }, [enabled])

  return cursor  // { x, y, progress } or null
}
