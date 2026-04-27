// Debug overlay — shows the strum detection zone in screen (world) space.
// Imported constants are the single source of truth shared with useStrum.js.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  MODEL_NORM_SCALE,
  NUM_STRINGS,
  STRING_SPACING,
  FIRST_STRING_X,
  STRUM_OFFSET_X,
  STRUM_OFFSET_Y,
  MODEL_STRUM_OFFSET,
  STRUM_Y_MIN,
  STRUM_Y_MAX,
} from '../data/strumZone'

const LAST_STRING_X = FIRST_STRING_X + (NUM_STRINGS - 1) * STRING_SPACING

// Strum zone dimensions in guitar local space
const boxW  = LAST_STRING_X - FIRST_STRING_X
const boxH  = STRUM_Y_MAX - STRUM_Y_MIN
const boxCX = (FIRST_STRING_X + LAST_STRING_X) / 2
const boxCY = (STRUM_Y_MIN + STRUM_Y_MAX) / 2

export default function StrumZoneDebug({ guitarStateRef, guitarModel = 'electric' }) {
  const groupRef = useRef()

  useFrame(() => {
    const g = groupRef.current
    if (!g) return

    const { x: gx, y: gy, scale, rotation } = guitarStateRef?.current ?? {}
    if (!scale || rotation == null) { g.visible = false; return }

    g.visible = true
    const E   = scale * MODEL_NORM_SCALE
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    const off = MODEL_STRUM_OFFSET[guitarModel] ?? { x: STRUM_OFFSET_X, y: STRUM_OFFSET_Y }
    const wx = gx + off.x + E * (boxCX * cos - boxCY * sin)
    const wy = gy + off.y + E * (boxCX * sin + boxCY * cos)

    g.position.set(wx, wy, 0)
    g.rotation.z = rotation
    g.scale.setScalar(E)
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* Filled semi-transparent background */}
      <mesh>
        <planeGeometry args={[boxW, boxH]} />
        <meshBasicMaterial
          color="#facc15"
          transparent
          opacity={0.15}
          depthTest={false}
        />
      </mesh>

      {/* Border edges */}
      {[
        [0,  boxH / 2, boxW, 0.008],   // top
        [0, -boxH / 2, boxW, 0.008],   // bottom
        [-boxW / 2, 0, 0.008, boxH],   // left
        [ boxW / 2, 0, 0.008, boxH],   // right
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.001]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.9} depthTest={false} />
        </mesh>
      ))}

      {/* Crosshair */}
      <mesh>
        <planeGeometry args={[boxW, 0.004]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.4} depthTest={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[0.004, boxH]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.4} depthTest={false} />
      </mesh>
    </group>
  )
}
