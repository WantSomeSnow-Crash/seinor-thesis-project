import { useRef, useState, Suspense, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import HandCursor from './HandCursor'

// How tall the guitar should appear in world units (camera is at z=8, fov=35)
const TARGET_SIZE = 4.5

const GUITARS = [
  {
    key: 'electric',
    label: 'Electric Guitar',
    subtitle: 'Classic electric tone',
    emoji: '🎸',
    modelPath: '/models/electric_guitar.glb',
    rotation: [0, 0, 0],
  },
  {
    key: 'acoustic',
    label: 'Acoustic Guitar',
    subtitle: 'Warm acoustic sound',
    emoji: '🪕',
    modelPath: '/models/acoustic_guitar.glb',
    rotation: [0, 3, 0],
  },
]

GUITARS.forEach(g => useGLTF.preload(g.modelPath))

function LoadingGuitar() {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08)
  })
  return (
    <mesh ref={ref}>
      <torusGeometry args={[0.6, 0.06, 16, 60]} />
      <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1.5} />
    </mesh>
  )
}

function GuitarPreview({ modelPath, rotation, visible }) {
  const { scene } = useGLTF(modelPath)
  const clonedRef = useRef(null)
  const lastSceneRef = useRef(null)
  const normScaleRef = useRef(1)
  const centerRef = useRef(new THREE.Vector3())

  if (lastSceneRef.current !== scene) {
    lastSceneRef.current = scene
    const cloned = scene.clone(true)


    // Auto-fit: scale so the largest dimension equals TARGET_SIZE
    const box = new THREE.Box3().setFromObject(cloned)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    normScaleRef.current = maxDim > 0 ? TARGET_SIZE / maxDim : 1

    // Store center offset — applied via JSX group so it doesn't fight rotation
    box.getCenter(centerRef.current)
    clonedRef.current = cloned
  }

  const spinRef = useRef()
  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.y += delta * 0.5
  })

  const c = centerRef.current
  return (
    <group ref={spinRef} visible={visible}>
      <group rotation={rotation} scale={normScaleRef.current}>
        <group position={[-c.x, -c.y, -c.z]}>
          <primitive object={clonedRef.current} />
        </group>
      </group>
    </group>
  )
}

const SWIPE_THRESHOLD = 0.18  // fraction of screen width
const SWIPE_COOLDOWN  = 800   // ms between switches

export default function GuitarSelect({ onSelect, onBack, handResults, dwellCursor }) {
  const [idx, setIdx] = useState(0)
  const guitar = GUITARS[idx]

  const prev = () => setIdx(i => (i - 1 + GUITARS.length) % GUITARS.length)
  const next = () => setIdx(i => (i + 1) % GUITARS.length)

  // Swipe detection
  const prevXRef        = useRef(null)
  const accumRef        = useRef(0)
  const lastSwitchRef   = useRef(0)

  useEffect(() => {
    if (!handResults?.landmarks?.length) {
      prevXRef.current = null
      accumRef.current = 0
      return
    }
    const x = handResults.landmarks[0][0].x  // wrist x, 0=left 1=right in camera space
    if (prevXRef.current !== null) {
      const dx = x - prevXRef.current
      // reset accumulator if direction reversed
      accumRef.current = Math.sign(dx) === Math.sign(accumRef.current) ? accumRef.current + dx : dx
      const now = Date.now()
      if (Math.abs(accumRef.current) > SWIPE_THRESHOLD && now - lastSwitchRef.current > SWIPE_COOLDOWN) {
        // camera x is mirrored: increasing x = hand moving left on screen → prev
        accumRef.current > 0 ? prev() : next()
        accumRef.current = 0
        lastSwitchRef.current = now
      }
    }
    prevXRef.current = x
  }, [handResults])

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black">

      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, rgba(124,58,237,0.18) 0%, transparent 60%), ' +
            'radial-gradient(ellipse at 30% 75%, rgba(16,185,129,0.10) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full h-full py-10 gap-6">

        {/* Header */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-white font-bold text-4xl tracking-tight">Select Your Guitar</h1>
          <p className="text-slate-400 text-base">Choose your instrument</p>
        </div>

        {/* Preview row */}
        <div className="flex items-center gap-4 flex-1 w-full max-w-4xl px-6" style={{ minHeight: 0 }}>

          <button onClick={prev} className="glass-btn text-3xl flex-shrink-0" style={{ padding: '1rem 1.1rem' }}>
            ‹
          </button>

          <div className="flex-1 h-full">
            <Canvas
              camera={{ position: [0, 0.5, 8], fov: 35 }}
              gl={{ alpha: true, antialias: true }}
              style={{ background: 'transparent', width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.8} />
              <directionalLight position={[3, 8, 5]} intensity={1.5} />
              <pointLight position={[-3, 2, 4]} intensity={0.7} color="#c084fc" />
              {GUITARS.map((g, i) => (
                <Suspense key={g.key} fallback={i === idx ? <LoadingGuitar /> : null}>
                  <GuitarPreview modelPath={g.modelPath} rotation={g.rotation} visible={i === idx} />
                </Suspense>
              ))}
            </Canvas>
          </div>

          <button onClick={next} className="glass-btn text-3xl flex-shrink-0" style={{ padding: '1rem 1.1rem' }}>
            ›
          </button>
        </div>

        {/* Name + dots + CTA */}
        <div className="flex flex-col items-center gap-4 pb-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl">{guitar.emoji}</span>
            <h2 className="text-white font-bold text-2xl tracking-tight">{guitar.label}</h2>
            <p className="text-slate-400 text-sm">{guitar.subtitle}</p>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-3 items-center">
            {GUITARS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 24 : 8,
                  height: 8,
                  borderRadius: 999,
                  background: i === idx ? '#34d399' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>

          <button
            onClick={() => onSelect(guitar.key)}
            className="glass-btn glass-btn-active text-base"
            style={{ padding: '0.85rem 3rem', marginTop: 4 }}
          >
            Let's Rock →
          </button>
        </div>

        <p className="text-slate-600 text-xs">
          {handResults?.landmarks?.length ? '👋 Swipe your hand left or right to browse' : 'Point your finger at a button or swipe your hand to browse'}
        </p>

        {/* Back */}
        {onBack && (
          <button onClick={onBack} className="glass-btn text-sm text-slate-400" style={{ padding: '0.4rem 1.2rem' }}>
            ← Back
          </button>
        )}
      </div>

      <HandCursor cursor={dwellCursor} />
    </div>
  )
}
