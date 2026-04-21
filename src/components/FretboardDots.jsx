import { useMemo } from 'react'
import { CHORDS } from '../data/chords'

/**
 * Renders glowing emerald dots on the fretboard showing where to place fingers.
 * Each chord has its own hand-tuned dot positions in chords.js — edit the
 * `dots` array on each chord to adjust positioning independently.
 */
export default function FretboardDots({ selectedChord }) {
  const dots = useMemo(() => CHORDS[selectedChord]?.dots ?? [], [selectedChord])

  return (
    <group>
      {dots.map((dot, i) => (
        <group key={i} position={[dot.x, dot.y, 0.1]}>
          <mesh renderOrder={999}>
            <circleGeometry args={[0.018, 20]} />
            <meshStandardMaterial
              color="#6ee7b7"
              emissive="#34d399"
              emissiveIntensity={3.0}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
