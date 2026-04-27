import { useEffect, useRef } from 'react'

// Upper-finger landmark groups only (skips palm / wrist)
// Each group: [proximal_knuckle, middle_joint, tip]
const FINGER_GROUPS = [
  [2,  3,  4],  // thumb
  [6,  7,  8],  // index
  [10, 11, 12], // middle
  [14, 15, 16], // ring
  [18, 19, 20], // pinky
]

const FINGER_HALF_WIDTH = 14  // px — how wide each finger tube is

// Build a capsule polygon tracing the outline of one finger
function fingerPolygon(pts, halfWidth) {
  const left  = []
  const right = []

  for (let i = 0; i < pts.length; i++) {
    let dx, dy
    if (i < pts.length - 1) {
      dx = pts[i + 1].x - pts[i].x
      dy = pts[i + 1].y - pts[i].y
    } else {
      dx = pts[i].x - pts[i - 1].x
      dy = pts[i].y - pts[i - 1].y
    }
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const nx  = -dy / len
    const ny  =  dx / len

    left.push ({ x: pts[i].x + nx * halfWidth, y: pts[i].y + ny * halfWidth })
    right.push({ x: pts[i].x - nx * halfWidth, y: pts[i].y - ny * halfWidth })
  }

  // Semicircular cap at fingertip
  const tip  = pts[pts.length - 1]
  const prev = pts[pts.length - 2]
  const capDx = tip.x - prev.x
  const capDy = tip.y - prev.y
  const capLen = Math.sqrt(capDx * capDx + capDy * capDy) || 1
  const capAngle = Math.atan2(capDy / capLen, capDx / capLen)

  const capPts = []
  const steps  = 8
  for (let s = 0; s <= steps; s++) {
    const a = capAngle - Math.PI / 2 + (Math.PI * s) / steps
    capPts.push({ x: tip.x + Math.cos(a) * halfWidth, y: tip.y + Math.sin(a) * halfWidth })
  }

  return [...left, ...capPts, ...[...right].reverse()]
}

// ─────────────────────────────────────────────────────────────────────────────
// HandOverlay — draws real camera pixels clipped to per-finger tube shapes so
// the physical fingers appear to wrap around / over the 3D guitar.
// ─────────────────────────────────────────────────────────────────────────────
export default function HandOverlay({ videoRef, handResults, visible = true }) {
  const canvasRef = useRef(null)
  const handRef   = useRef(handResults)

  useEffect(() => { handRef.current = handResults }, [handResults])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf

    const draw = () => {
      raf = requestAnimationFrame(draw)

      const { width, height } = canvas.getBoundingClientRect()
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width  = width
        canvas.height = height
      }

      const ctx     = canvas.getContext('2d')
      const W       = canvas.width
      const H       = canvas.height

      ctx.clearRect(0, 0, W, H)

      const video   = videoRef.current
      const results = handRef.current
      if (!video || !results?.landmarks?.length) return

      results.landmarks.forEach(hand => {
        if (!hand) return

        FINGER_GROUPS.forEach(group => {
          // Map normalised landmarks → canvas coords (mirrored to match video CSS)
          const pts = group.map(idx => ({
            x: (1 - hand[idx].x) * W,
            y:  hand[idx].y      * H,
          }))

          const poly = fingerPolygon(pts, FINGER_HALF_WIDTH)
          if (poly.length < 3) return

          ctx.save()

          ctx.beginPath()
          ctx.moveTo(poly[0].x, poly[0].y)
          for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y)
          ctx.closePath()
          ctx.clip()

          // Draw the live video frame mirrored horizontally
          ctx.scale(-1, 1)
          ctx.drawImage(video, -W, 0, W, H)

          ctx.restore()
        })
      })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [videoRef])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[16]"
      style={{ opacity: visible ? 1 : 0 }}
    />
  )
}
