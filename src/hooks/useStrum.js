import { useEffect, useRef } from 'react'

// These must match GuitarPlaceholder.jsx constants
const MODEL_NORM_SCALE = 0.3
const NUM_STRINGS      = 6
const STRING_SPACING   = 0.032
const FIRST_STRING_X   = (0 - 2.5) * STRING_SPACING   // = -0.08

// Strum zone in guitar local space (body / soundhole area — not the fretboard)
const STRUM_Y_MIN = -0.55
const STRUM_Y_MAX =  0.05

// Minimum ms before the same string can fire again
const STRING_COOLDOWN = 80

/**
 * Detects when the strumming hand sweeps across individual strings.
 * Fires onStringStrum(stringIndex) for each string crossed.
 *
 * guitarStateRef: { x, y, scale, rotation } in orthographic world-space pixels
 * size:           { width, height } matching world-space units
 * leftHanded:     if true, strumming hand is the player's left hand
 */
export default function useStrum({ handResults, guitarStateRef, size, leftHanded, onStringStrum }) {
  const prevZoneRef      = useRef(null)
  const lastStrumRef     = useRef(Array(NUM_STRINGS).fill(0))
  const onStrumRef       = useRef(onStringStrum)
  const leftHandedRef    = useRef(leftHanded)

  useEffect(() => { onStrumRef.current    = onStringStrum }, [onStringStrum])
  useEffect(() => { leftHandedRef.current = leftHanded    }, [leftHanded])

  useEffect(() => {
    if (!handResults?.landmarks?.length) {
      prevZoneRef.current = null
      return
    }

    const strumLabel = leftHandedRef.current ? 'Left' : 'Right'
    const strumIdx   = handResults.handedness?.findIndex(
      h => h[0]?.categoryName === strumLabel
    ) ?? -1

    if (strumIdx === -1) {
      prevZoneRef.current = null
      return
    }

    const hand     = handResults.landmarks[strumIdx]
    const wrist    = hand?.[0]
    const indexTip = hand?.[8]
    if (!wrist) return

    const pt = indexTip ?? wrist
    const wx = (0.5 - pt.x) * size.width
    const wy = (0.5 - pt.y) * size.height

    const { x: gx, y: gy, scale, rotation } = guitarStateRef.current ?? {}
    if (!scale || rotation == null) return

    // Total scale from model-local units → screen pixels
    const effectiveScale = scale * MODEL_NORM_SCALE
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    // Project hand position into guitar local space
    const dx     =  wx - gx
    const dy     =  wy - gy
    const localX = ( dx * cos + dy * sin) / effectiveScale
    const localY = (-dx * sin + dy * cos) / effectiveScale

    // Only detect strums in the body / soundhole zone, not on the neck
    if (localY < STRUM_Y_MIN || localY > STRUM_Y_MAX) {
      prevZoneRef.current = null
      return
    }

    // Map localX to the nearest string index (0 = low E, 5 = high e)
    const rawZone    = Math.round((localX - FIRST_STRING_X) / STRING_SPACING)
    const stringZone = Math.max(0, Math.min(NUM_STRINGS - 1, rawZone))

    const prevZone = prevZoneRef.current
    prevZoneRef.current = stringZone

    // No previous position or still on same string — nothing to fire yet
    if (prevZone === null || prevZone === stringZone) return

    // Hand swept across one or more strings — fire each one in sweep order
    const now = Date.now()
    const lo  = Math.min(prevZone, stringZone)
    const hi  = Math.max(prevZone, stringZone)

    for (let i = lo; i <= hi; i++) {
      if (now - lastStrumRef.current[i] > STRING_COOLDOWN) {
        onStrumRef.current?.(i)
        lastStrumRef.current[i] = now
      }
    }
  }, [handResults, guitarStateRef, size])
}
