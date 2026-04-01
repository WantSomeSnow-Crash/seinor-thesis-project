import { useEffect, useRef } from 'react'

// Finger landmark indices: [mcp, pip, dip, tip] for index/middle/ring/pinky
const FINGER_LANDMARKS = [
  [5,  6,  7,  8 ],   // index
  [9,  10, 11, 12],   // middle
  [13, 14, 15, 16],   // ring
  [17, 18, 19, 20],   // pinky
]

function dist3(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
}

/**
 * Returns a curl ratio for one finger.
 * 0 = fully extended, 1 = fully curled.
 * Uses the ratio of straight-line tip-to-wrist distance vs the
 * sum of all segment lengths — orientation-independent.
 */
function getFingerCurl(hand, fingerIndex) {
  const [mcpI, pipI, dipI, tipI] = FINGER_LANDMARKS[fingerIndex]
  const wrist = hand[0]
  const mcp   = hand[mcpI]
  const pip   = hand[pipI]
  const dip   = hand[dipI]
  const tip   = hand[tipI]

  const extended = dist3(wrist, mcp) + dist3(mcp, pip) + dist3(pip, dip) + dist3(dip, tip)
  const actual   = dist3(wrist, tip)

  return extended > 0 ? 1 - actual / extended : 0
}

// ── Chord profiles ────────────────────────────────────────────────────────────
// Each entry is [index, middle, ring, pinky] expected curl (0 = open, 1 = fully curled).
// Values tuned for standard guitar fingering positions.
//
// Em:  index + middle pressed (fret 2), ring + pinky open
// G:   all four fingers pressed across two frets
// C:   index (fret 1) + middle (fret 2) + ring (fret 3), staircase up
// D:   index + middle + ring on high strings, pinky open
// Am:  index + middle + ring similar depth to C/D, pinky open
const CHORD_PROFILES = {
  Em: [0.55, 0.55, 0.10, 0.10],
  G:  [0.50, 0.55, 0.55, 0.55],
  C:  [0.35, 0.50, 0.65, 0.10],
  D:  [0.50, 0.55, 0.55, 0.10],
  Am: [0.38, 0.55, 0.52, 0.10],
}

// How many consecutive matching frames before switching chords.
// Higher = more stable but slower to respond. 8 ≈ ~0.4s at 20fps.
const CONFIRM_FRAMES       = 8

// Minimum confidence (0–1) required to accept a match.
// Lower = more permissive but more false positives.
const CONFIDENCE_THRESHOLD = 0.60

export default function useChordRecognition({
  handResults,
  leftHanded,
  onChordDetected,
  enabled = true,
}) {
  const candidateRef = useRef({ chord: null, count: 0 })

  useEffect(() => {
    if (!enabled || !handResults?.landmarks?.length) {
      candidateRef.current = { chord: null, count: 0 }
      return
    }

    // Fretting hand is opposite of strum hand
    const fretLabel = leftHanded ? 'Right' : 'Left'
    const fretIdx   = handResults.handedness?.findIndex(
      h => h[0]?.categoryName === fretLabel
    ) ?? -1

    if (fretIdx === -1) {
      candidateRef.current = { chord: null, count: 0 }
      return
    }

    const hand = handResults.landmarks[fretIdx]
    if (!hand) return

    // Compute curl for each of the 4 fingers
    const curls = [0, 1, 2, 3].map(i => getFingerCurl(hand, i))

    // Find the chord whose profile is closest (lowest mean squared error)
    let bestChord = null
    let bestScore = Infinity

    for (const [chord, profile] of Object.entries(CHORD_PROFILES)) {
      const score = profile.reduce((sum, expected, i) => sum + (curls[i] - expected) ** 2, 0)
      if (score < bestScore) {
        bestScore = score
        bestChord = chord
      }
    }

    // Convert MSE to a 0–1 confidence value
    const confidence = 1 - Math.sqrt(bestScore / 4)

    if (confidence < CONFIDENCE_THRESHOLD) {
      candidateRef.current = { chord: null, count: 0 }
      return
    }

    // Require N consecutive matching frames before firing
    if (bestChord === candidateRef.current.chord) {
      candidateRef.current.count++
      if (candidateRef.current.count === CONFIRM_FRAMES) {
        onChordDetected?.(bestChord)
      }
    } else {
      candidateRef.current = { chord: bestChord, count: 1 }
    }
  }, [handResults, leftHanded, enabled, onChordDetected])
}
