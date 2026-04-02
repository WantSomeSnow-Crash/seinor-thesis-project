import { useEffect, useRef } from 'react'
import {
  MODEL_NORM_SCALE,
  NUM_STRINGS,
  FIRST_STRING_X,
  STRING_SPACING,
  STRUM_OFFSET_X,
  STRUM_OFFSET_Y,
  STRUM_Y_MIN,
  STRUM_Y_MAX,
  STRING_COOLDOWN,
} from '../data/strumZone'

// Minimum ms between whole-gesture strum fires (used for rock mode)
const GESTURE_COOLDOWN = 250

/**
 * Detects when the strumming hand sweeps across strings.
 *
 * onStringStrum(stringIndex) — fires per string crossed (learn mode)
 * onStrum(direction)         — fires once per sweep gesture, 'up' or 'down' (rock mode)
 */
export default function useStrum({ handResults, guitarStateRef, size, leftHanded, onStringStrum, onStrum }) {
  const prevZoneRef       = useRef(null)
  const lastStrumRef      = useRef(Array(NUM_STRINGS).fill(0))
  const lastGestureRef    = useRef(0)
  const onStringStrumRef  = useRef(onStringStrum)
  const onStrumRef        = useRef(onStrum)
  const leftHandedRef     = useRef(leftHanded)

  useEffect(() => { onStringStrumRef.current = onStringStrum }, [onStringStrum])
  useEffect(() => { onStrumRef.current       = onStrum       }, [onStrum])
  useEffect(() => { leftHandedRef.current    = leftHanded    }, [leftHanded])

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

    const effectiveScale = scale * MODEL_NORM_SCALE
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    const dx     =  wx - (gx + STRUM_OFFSET_X)
    const dy     =  wy - (gy + STRUM_OFFSET_Y)
    const localX = ( dx * cos + dy * sin) / effectiveScale
    const localY = (-dx * sin + dy * cos) / effectiveScale

    if (localY < STRUM_Y_MIN || localY > STRUM_Y_MAX) {
      prevZoneRef.current = null
      return
    }

    const rawZone    = Math.round((localX - FIRST_STRING_X) / STRING_SPACING)
    const stringZone = Math.max(0, Math.min(NUM_STRINGS - 1, rawZone))

    const prevZone = prevZoneRef.current
    prevZoneRef.current = stringZone

    if (prevZone === null || prevZone === stringZone) return

    const now = Date.now()

    // Direction: toward higher string index (low E → high e) = down strum
    const direction = stringZone > prevZone ? 'down' : 'up'

    // Fire once-per-gesture for rock mode
    if (now - lastGestureRef.current > GESTURE_COOLDOWN) {
      onStrumRef.current?.(direction)
      lastGestureRef.current = now
    }

    // Fire per-string for learn mode
    const lo = Math.min(prevZone, stringZone)
    const hi = Math.max(prevZone, stringZone)
    for (let i = lo; i <= hi; i++) {
      if (now - lastStrumRef.current[i] > STRING_COOLDOWN) {
        onStringStrumRef.current?.(i)
        lastStrumRef.current[i] = now
      }
    }
  }, [handResults, guitarStateRef, size])
}
