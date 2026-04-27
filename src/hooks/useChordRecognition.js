import { useEffect, useRef } from 'react'

// Finger landmark indices: [mcp, pip, dip, tip] for index/middle/ring/pinky
const FINGER_LANDMARKS = [
  [5,  6,  7,  8 ],  // index
  [9,  10, 11, 12],  // middle
  [13, 14, 15, 16],  // ring
  [17, 18, 19, 20],  // pinky
]

// MCP (base knuckle) index for each finger — used for spread measurement
const MCP_INDICES = [5, 9, 13, 17]

function dist3(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
}

// Returns 0 (extended) → 1 (fully curled) for one finger.
// Uses tip-to-wrist vs sum-of-segment-lengths — rotation independent.
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

// Spread: distance between the outermost curled fingers' base knuckles,
// normalized by palm size (wrist → middle MCP). Tells us how wide the
// chord shape is across the strings — G is very wide, Em is very narrow.
function getCurledSpread(hand, curls, threshold = 0.30) {
  const palmSize = dist3(hand[0], hand[9])
  if (palmSize < 0.001) return 0

  let first = -1, last = -1
  for (let i = 0; i < 4; i++) {
    if (curls[i] > threshold) {
      if (first === -1) first = i
      last = i
    }
  }
  if (first === -1 || first === last) return 0
  return dist3(hand[MCP_INDICES[first]], hand[MCP_INDICES[last]]) / palmSize
}

// ── Chord profiles ────────────────────────────────────────────────────────────
// curls:  [index, middle, ring, pinky] expected curl (0=open, 1=fully curled)
// spread: normalized distance between outermost curled finger knuckles
//
// Key discriminators:
//   G   → only chord with all 4 fingers curled + very wide spread
//   Em  → only 2 fingers (index+middle), very narrow spread
//   E   → 3 fingers in staircase (ring less curled than index+middle)
//   C   → 3 fingers, progressive staircase (ring deepest)
//   D   → 3 fingers (index+middle+ring), compact spread
//   Am  → 3 fingers similar to C but index lighter and less spread
//
// Tune spread values if detection feels off — they scale with hand size
// so should be consistent across users.
const CHORD_PROFILES = {
  Em: { curls: [0.55, 0.55, 0.10, 0.10], spread: 0.25 },
  E:  { curls: [0.55, 0.55, 0.42, 0.10], spread: 0.45 },
  G:  { curls: [0.50, 0.55, 0.55, 0.55], spread: 0.65 },
  C:  { curls: [0.35, 0.50, 0.65, 0.10], spread: 0.45 },
  D:  { curls: [0.50, 0.55, 0.55, 0.10], spread: 0.40 },
  Am: { curls: [0.38, 0.55, 0.52, 0.10], spread: 0.40 },
}

// How much each feature contributes to the total score.
// Curl is the primary signal; spread breaks ties between similar-curl chords.
const CURL_WEIGHT   = 0.65
const SPREAD_WEIGHT = 0.35

// Frames the same chord must match before switching.
// 6 frames ≈ 0.3s at 20fps — responsive but not jittery.
const CONFIRM_FRAMES = 6

// Minimum confidence to accept a match (0–1).
const CONFIDENCE_THRESHOLD = 0.55

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

    const curls  = [0, 1, 2, 3].map(i => getFingerCurl(hand, i))
    const spread = getCurledSpread(hand, curls)

    let bestChord = null
    let bestScore = Infinity

    for (const [chord, profile] of Object.entries(CHORD_PROFILES)) {
      const curlMSE   = profile.curls.reduce((s, e, i) => s + (curls[i] - e) ** 2, 0) / 4
      const spreadErr = (spread - profile.spread) ** 2
      const score     = CURL_WEIGHT * curlMSE + SPREAD_WEIGHT * spreadErr

      if (score < bestScore) {
        bestScore = score
        bestChord = chord
      }
    }

    const confidence = 1 - Math.sqrt(bestScore)

    if (confidence < CONFIDENCE_THRESHOLD) {
      candidateRef.current = { chord: null, count: 0 }
      return
    }

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
