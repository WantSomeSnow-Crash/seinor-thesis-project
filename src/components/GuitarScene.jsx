import { Canvas } from '@react-three/fiber'
import GuitarPlaceholder from './GuitarPlaceholder'

export default function GuitarScene({ poseResults, leftHanded, selectedChord, guitarStateRef, strumPulse, showStrumZone }) {
  return (
    <Canvas
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 12, background: 'transparent' }}
      orthographic
      camera={{ zoom: 1, position: [0, 0, 500], near: 0.1, far: 1000 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 8, 5]} intensity={1.4} />
      <pointLight position={[-3, 2, 4]} intensity={0.6} color="#c084fc" />
      <GuitarPlaceholder
        poseResults={poseResults}
        leftHanded={leftHanded}
        selectedChord={selectedChord}
        guitarStateRef={guitarStateRef}
        strumPulse={strumPulse}
        showStrumZone={showStrumZone}
      />
    </Canvas>
  )
}
