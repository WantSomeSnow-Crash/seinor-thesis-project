import { useMemo } from 'react'
import { CHORDS, FRET_Y, STRING_X } from '../data/chords'

/**
 * Renders glowing emerald dots on the fretboard showing where to place fingers
 * for the currently selected chord.
 */
export default function FretboardDots({ selectedChord }) {
  const dots = useMemo(() => {
    return (CHORDS[selectedChord]?.fingers ?? []).filter(f => f.fret > 0)
  }, [selectedChord])

  return (
    <group>
      {dots.map((f, i) => {
        const x = STRING_X[f.string]
        const y = FRET_Y[f.fret]
        if (y == null) return null

        return (
          <group key={i} position={[x, y, -0.05]}>
            {/* Outer glow */}
            <mesh>
              <circleGeometry args={[0.035, 20]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#10b981"
                emissiveIntensity={1.8}
                transparent
                opacity={0.35}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
            {/* Solid core dot */}
            <mesh>
              <circleGeometry args={[0.020, 20]} />
              <meshStandardMaterial
                color="#6ee7b7"
                emissive="#34d399"
                emissiveIntensity={3.0}
                depthTest={false}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
