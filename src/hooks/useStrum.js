import { useEffect, useRef } from 'react'

/**
 * Detects when the strumming hand enters the guitar body zone.
 * Fires onStrum() once per crossing (with a cooldown).
 *
 * guitarStateRef: { x, y, scale } in orthographic world-space pixels
 * size:           { width, height } from useThree — matches world-space units
 * leftHanded:     if true, strumming hand is the player's left hand
 */
export default function useStrum({ handResults, guitarStateRef, size, leftHanded, onStrum }) {
  const wasInZoneRef  = useRef(false)
  const lastStrumRef  = useRef(0)
  const onStrumRef    = useRef(onStrum)
  const leftHandedRef = useRef(leftHanded)

  // Keep refs fresh without re-subscribing the effect
  useEffect(() => { onStrumRef.current    = onStrum   }, [onStrum])
  useEffect(() => { leftHandedRef.current = leftHanded }, [leftHanded])

  useEffect(() => {
    if (!handResults?.landmarks?.length) {
      wasInZoneRef.current = false
      return
    }

    // MediaPipe labels hands from the player's perspective (after mirroring).
    // Right-handed player strums with their RIGHT hand (label "Right").
    // Left-handed player strums with their LEFT hand (label "Left").
    const strumLabel = leftHandedRef.current ? 'Left' : 'Right'

    const strumIdx = handResults.handedness?.findIndex(
      h => h[0]?.categoryName === strumLabel
    ) ?? -1

    if (strumIdx === -1) {
      wasInZoneRef.current = false
      return
    }

    const hand  = handResults.landmarks[strumIdx]
    const wrist = hand?.[0]           // landmark 0 = wrist
    const indexTip = hand?.[8]        // landmark 8 = index fingertip
    if (!wrist) return

    // Use whichever point is detected; prefer index tip for precision
    const pt = indexTip ?? wrist

    // World space (mirrored x, same convention as the guitar anchor)
    const wx = (0.5 - pt.x) * size.width
    const wy = (0.5 - pt.y) * size.height

    const { x: gx, y: gy, scale } = guitarStateRef.current ?? {}
    if (!scale) return

    const dx   = wx - gx
    const dy   = wy - gy
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Strum zone ≈ guitar body radius (lower bout r=0.5 in model units, scaled up)
    const strumRadius = scale * 0.58

    const inZone = dist < strumRadius
    const now    = Date.now()

    if (inZone && !wasInZoneRef.current && now - lastStrumRef.current > 380) {
      onStrumRef.current?.()
      lastStrumRef.current = now
    }

    wasInZoneRef.current = inZone
  }, [handResults, guitarStateRef, size])
}
