import { useMemo } from 'react'
import { CHORDS } from '../data/chords'

export default function FretboardDots({ selectedChord, guitarModel = 'electric' }) {
  const dots = useMemo(() => {
    const chord = CHORDS[selectedChord]
    if (!chord) return []
    if (guitarModel === 'acoustic')   return chord.acousticDots ?? chord.dots ?? []
    if (guitarModel === 'Working_RH') return chord.rhDots      ?? chord.dots ?? []
    return chord.dots ?? []
  }, [selectedChord, guitarModel])

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
