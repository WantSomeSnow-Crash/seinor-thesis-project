import { useEffect, useRef } from 'react'
import { PoseLandmarker } from '@mediapipe/tasks-vision'

// ── Pose connections from MediaPipe ──────────────────────────────────────────
const POSE_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS

// ── Hand connections (21 landmarks, standard MediaPipe topology) ──────────────
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],       // thumb
  [0,5],[5,6],[6,7],[7,8],       // index
  [5,9],[9,10],[10,11],[11,12],  // middle
  [9,13],[13,14],[14,15],[15,16],// ring
  [13,17],[0,17],[17,18],[18,19],[19,20], // pinky + palm
]

// Landmark indices to highlight specially
const HIP_INDICES    = new Set([23, 24])
const SHOULDER_IDX   = new Set([11, 12])
const FINGERTIP_IDX  = new Set([4, 8, 12, 16, 20])

export default function TrackingCanvas({ poseResults, handResults, visible = true }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Match canvas resolution to its CSS size
    const { width, height } = canvas.getBoundingClientRect()
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width  = width
      canvas.height = height
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const W = canvas.width
    const H = canvas.height

    // Helper: normalised → canvas coords
    // MediaPipe gives x in [0,1] measured from the *natural* left of the video.
    // The video is CSS-mirrored (scaleX(-1)), so we mirror x here too.
    const px = (lm) => ((1 - lm.x) * W)
    const py = (lm) => (lm.y * H)

    // ── Draw pose ─────────────────────────────────────────────────────────────
    if (poseResults?.landmarks?.[0]) {
      const lms = poseResults.landmarks[0]

      // Skeleton lines
      ctx.lineWidth   = 2
      ctx.strokeStyle = 'rgba(99, 255, 200, 0.65)'
      for (const { start, end } of POSE_CONNECTIONS) {
        if (!lms[start] || !lms[end]) continue
        ctx.beginPath()
        ctx.moveTo(px(lms[start]), py(lms[start]))
        ctx.lineTo(px(lms[end]),   py(lms[end]))
        ctx.stroke()
      }

      // Landmark dots
      for (let i = 0; i < lms.length; i++) {
        const lm = lms[i]
        if (!lm) continue

        const isHip      = HIP_INDICES.has(i)
        const isShoulder = SHOULDER_IDX.has(i)
        const radius     = isHip || isShoulder ? 7 : 3

        ctx.beginPath()
        ctx.arc(px(lm), py(lm), radius, 0, Math.PI * 2)

        if (isHip) {
          ctx.fillStyle = '#10b981'   // emerald — anchor points
        } else if (isShoulder) {
          ctx.fillStyle = '#3b82f6'   // blue
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.55)'
        }
        ctx.fill()
      }
    }

    // ── Draw hands ────────────────────────────────────────────────────────────
    if (handResults?.landmarks) {
      handResults.landmarks.forEach((hand, hi) => {
        if (!hand) return

        const handedness = handResults.handedness?.[hi]?.[0]?.categoryName ?? ''
        const isRight    = handedness === 'Right'   // NB: MediaPipe labels from the video's POV; we re-map below

        const lineColor = isRight
          ? 'rgba(249, 115, 22, 0.75)'   // orange — strumming hand
          : 'rgba(168, 85, 247, 0.75)'   // purple — fretting hand

        // Skeleton
        ctx.lineWidth   = 2
        ctx.strokeStyle = lineColor
        for (const [a, b] of HAND_CONNECTIONS) {
          if (!hand[a] || !hand[b]) continue
          ctx.beginPath()
          ctx.moveTo(px(hand[a]), py(hand[a]))
          ctx.lineTo(px(hand[b]), py(hand[b]))
          ctx.stroke()
        }

        // Knuckle dots + glowing fingertips
        for (let i = 0; i < hand.length; i++) {
          const lm = hand[i]
          if (!lm) continue

          const isTip = FINGERTIP_IDX.has(i)
          const r     = isTip ? 6 : 3

          if (isTip) {
            // Glow ring
            ctx.beginPath()
            ctx.arc(px(lm), py(lm), r + 4, 0, Math.PI * 2)
            ctx.strokeStyle = isRight ? 'rgba(249,115,22,0.35)' : 'rgba(168,85,247,0.35)'
            ctx.lineWidth   = 3
            ctx.stroke()
          }

          ctx.beginPath()
          ctx.arc(px(lm), py(lm), r, 0, Math.PI * 2)
          ctx.fillStyle = isTip ? (isRight ? '#f97316' : '#a855f7') : 'rgba(255,255,255,0.6)'
          ctx.fill()
        }
      })
    }
  }, [poseResults, handResults])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      style={{ opacity: visible ? 1 : 0 }}
    />
  )
}
