import { useEffect, useRef } from 'react'

// Full finger groups from base knuckle → tip for better palm coverage
const FINGER_GROUPS = [
  [1,  2,  3,  4],  // thumb
  [5,  6,  7,  8],  // index
  [9,  10, 11, 12], // middle
  [13, 14, 15, 16], // ring
  [17, 18, 19, 20], // pinky
]

// Palm landmark indices traced around the hand for a filled palm shape
const PALM_INDICES = [0, 1, 5, 9, 13, 17]

const FINGER_HALF_WIDTH = 18  // px — slightly wider than HandOverlay for full coverage

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
  const tip      = pts[pts.length - 1]
  const prev     = pts[pts.length - 2]
  const capDx    = tip.x - prev.x
  const capDy    = tip.y - prev.y
  const capLen   = Math.sqrt(capDx * capDx + capDy * capDy) || 1
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
// HandMask — draws filled hand shapes using destination-out blending so the
// guitar canvas becomes semi-transparent wherever hands are detected.
// Must be rendered inside a div with `isolation: isolate` alongside GuitarScene.
// ─────────────────────────────────────────────────────────────────────────────
export default function HandMask({ handResults, visible = true, opacity = 0.75 }) {
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

      const ctx = canvas.getContext('2d')
      const W   = canvas.width
      const H   = canvas.height

      ctx.clearRect(0, 0, W, H)

      const results = handRef.current
      if (!results?.landmarks?.length) return

      // destination-out: drawn pixels erase the guitar canvas beneath
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`

      results.landmarks.forEach(hand => {
        if (!hand) return

        const toCanvas = idx => ({
          x: (1 - hand[idx].x) * W,
          y:  hand[idx].y      * H,
        })

        // Filled palm polygon
        const palmPts = PALM_INDICES.map(toCanvas)
        ctx.beginPath()
        ctx.moveTo(palmPts[0].x, palmPts[0].y)
        for (let i = 1; i < palmPts.length; i++) ctx.lineTo(palmPts[i].x, palmPts[i].y)
        ctx.closePath()
        ctx.fill()

        // Filled finger tube polygons
        FINGER_GROUPS.forEach(group => {
          const pts  = group.map(toCanvas)
          const poly = fingerPolygon(pts, FINGER_HALF_WIDTH)
          if (poly.length < 3) return

          ctx.beginPath()
          ctx.moveTo(poly[0].x, poly[0].y)
          for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y)
          ctx.closePath()
          ctx.fill()
        })
      })
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [opacity])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        mixBlendMode : 'destination-out',
        opacity      : visible ? 1 : 0,
        zIndex       : 1,  // above GuitarScene within the isolated wrapper
      }}
    />
  )
}
