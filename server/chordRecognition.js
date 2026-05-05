const FINGER_LANDMARKS = [
  [5,  6,  7,  8 ],
  [9,  10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
]

const MCP_INDICES = [5, 9, 13, 17]

function dist3(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
}

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

const CHORD_PROFILES = {
  Em: { curls: [0.55, 0.55, 0.10, 0.10], spread: 0.25 },
  E:  { curls: [0.55, 0.55, 0.42, 0.10], spread: 0.45 },
  G:  { curls: [0.50, 0.55, 0.55, 0.55], spread: 0.65 },
  C:  { curls: [0.35, 0.50, 0.65, 0.10], spread: 0.45 },
  D:  { curls: [0.50, 0.55, 0.55, 0.10], spread: 0.40 },
  Am: { curls: [0.38, 0.55, 0.52, 0.10], spread: 0.40 },
}

const CURL_WEIGHT         = 0.65
const SPREAD_WEIGHT       = 0.35
const CONFIDENCE_THRESHOLD = 0.55

export function recognizeChord(hand) {
  const curls  = [0, 1, 2, 3].map(i => getFingerCurl(hand, i))
  const spread = getCurledSpread(hand, curls)

  let bestChord = null
  let bestScore = Infinity

  for (const [chord, profile] of Object.entries(CHORD_PROFILES)) {
    const curlMSE   = profile.curls.reduce((s, e, i) => s + (curls[i] - e) ** 2, 0) / 4
    const spreadErr = (spread - profile.spread) ** 2
    const score     = CURL_WEIGHT * curlMSE + SPREAD_WEIGHT * spreadErr
    if (score < bestScore) { bestScore = score; bestChord = chord }
  }

  const confidence = 1 - Math.sqrt(bestScore)
  if (confidence < CONFIDENCE_THRESHOLD) return { chord: null, confidence }
  return { chord: bestChord, confidence }
}
