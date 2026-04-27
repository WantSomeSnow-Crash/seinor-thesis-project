import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import FretboardDots from './FretboardDots'
import StrumZoneDebug from './StrumZoneDebug'
import { DOT_SCREEN_OFFSET_X, DOT_SCREEN_OFFSET_Y } from '../data/chords'
import { MODEL_NORM_SCALE } from '../data/strumZone'

// ── Model calibration ─────────────────────────────────────────────────────────
// To scale the guitar: change MODEL_NORM_SCALE in src/data/strumZone.js
// That single value controls the model size, dot positions, and strum zone together.

const MODEL_ROTATION   = [0, 40, 0]
const MODEL_X_OFFSET   = 0.0
const MODEL_Y_OFFSET   = 0.0

// ── Anchor / positioning constants ───────────────────────────────────────────
const GUITAR_TILT      = 1
const ANCHOR_HIP_BLEND = 0.80
const ANCHOR_UP_RATIO  = -0.10
const ANCHOR_X_OFFSET  = .60
const GUITAR_VS_TORSO  = 2.5
const MODEL_SPAN       = 2.85

// Reusable vectors
const _anchor      = new THREE.Vector3()
const _hipMid      = new THREE.Vector3()
const _shoulderMid = new THREE.Vector3()
const _torso       = new THREE.Vector3()
const _targetScale = new THREE.Vector3()

const GUITAR_MODELS = {
  electric: '/models/electric_guitar.glb',
  acoustic: '/models/acoustic_guitar.glb',
}

// Per-model scale multiplier — tune if a model appears too large or small
const GUITAR_MODEL_SCALE = {
  electric: 1.0,
  acoustic: 0.28,
}

// Per-model position offset in model-local space — tune to align origin to hip anchor
const GUITAR_MODEL_OFFSET = {
  electric: [0.0, 0.0],
  acoustic: [0.0, 0.3],
}

// Per-model dot screen offsets in pixels — tune X/Y independently per guitar
// X: positive = right, negative = left
// Y: positive = up,    negative = down
const GUITAR_DOT_OFFSET = {
  electric: { x: DOT_SCREEN_OFFSET_X, y: DOT_SCREEN_OFFSET_Y },
  acoustic:  { x: DOT_SCREEN_OFFSET_X, y: DOT_SCREEN_OFFSET_Y },
}

// Preload both models upfront
useGLTF.preload(GUITAR_MODELS.electric)
useGLTF.preload(GUITAR_MODELS.acoustic)

export default function GuitarPlaceholder({
  poseResults,
  handResults,
  leftHanded     = false,
  selectedChord  = 'Em',
  guitarStateRef,
  strumPulse     = 0,
  showStrumZone  = false,
  showDots       = true,
  guitarModel    = 'electric',
}) {
  const groupRef    = useRef()
  const dotsGroupRef = useRef()
  const { size } = useThree()

  const modelPath = GUITAR_MODELS[guitarModel] ?? GUITAR_MODELS.electric
  const { scene } = useGLTF(modelPath)

  // Re-clone whenever the model changes, disposing the old clone to free GPU memory
  const modelScene  = useRef(null)
  const lastScene   = useRef(null)
  if (lastScene.current !== scene) {
    if (modelScene.current) {
      modelScene.current.traverse(obj => {
        if (obj.isMesh) {
          obj.geometry?.dispose()
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach(m => {
            m?.map?.dispose()
            m?.dispose()
          })
        }
      })
    }
    lastScene.current  = scene
    modelScene.current = scene.clone(true)
  }

  const poseRef      = useRef(poseResults)
  const handRef      = useRef(handResults)
  const leftRef      = useRef(leftHanded)
  const pulseRef     = useRef(0)
  const lastPulseRef = useRef(strumPulse)

  useEffect(() => { poseRef.current  = poseResults  }, [poseResults])
  useEffect(() => { handRef.current  = handResults  }, [handResults])
  useEffect(() => { leftRef.current  = leftHanded   }, [leftHanded])

  useEffect(() => {
    if (strumPulse !== lastPulseRef.current) {
      pulseRef.current     = 1.0
      lastPulseRef.current = strumPulse
    }
  }, [strumPulse])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    const lms = poseRef.current?.landmarks?.[0]
    if (!lms?.[23] || !lms?.[24] || !lms?.[11] || !lms?.[12]) {
      group.visible = false
      return
    }

    group.visible = true

    const W = size.width
    const H = size.height

    const wx = (lm) => (0.5 - lm.x) * W
    const wy = (lm) => (0.5 - lm.y) * H

    const lHipW = { x: wx(lms[23]), y: wy(lms[23]) }
    const rHipW = { x: wx(lms[24]), y: wy(lms[24]) }

    _hipMid.set(
      (lHipW.x + rHipW.x) * 0.5,
      (lHipW.y + rHipW.y) * 0.5,
      0
    )
    _shoulderMid.set(
      (wx(lms[11]) + wx(lms[12])) * 0.5,
      (wy(lms[11]) + wy(lms[12])) * 0.5,
      0
    )

    _torso.subVectors(_shoulderMid, _hipMid)
    const torsoLen = _torso.length()
    if (torsoLen < 10) return

    const isLeft  = leftRef.current
    const sideHip = isLeft ? lHipW : rHipW

    _anchor.set(
      sideHip.x * ANCHOR_HIP_BLEND + _hipMid.x * (1 - ANCHOR_HIP_BLEND),
      sideHip.y * ANCHOR_HIP_BLEND + _hipMid.y * (1 - ANCHOR_HIP_BLEND),
      0
    )
    _anchor.addScaledVector(_torso.clone().normalize(), torsoLen * ANCHOR_UP_RATIO)
    _anchor.x += torsoLen * (isLeft ? -ANCHOR_X_OFFSET : ANCHOR_X_OFFSET)

    const torsoTilt   = Math.atan2(_torso.x, _torso.y)
    const guitarAngle = isLeft ? -GUITAR_TILT : GUITAR_TILT
    const targetRot   = torsoTilt + guitarAngle
    const scale       = (torsoLen * GUITAR_VS_TORSO) / MODEL_SPAN

    // Neck grab — fretting hand near guitar pulls it slightly
    const hands = handRef.current?.landmarks ?? []
    if (hands.length > 0) {
      let minDist = Infinity
      let nearHx = 0, nearHy = 0
      for (const lms of hands) {
        const hx = wx(lms[0])
        const hy = wy(lms[0])
        const d  = Math.hypot(hx - group.position.x, hy - group.position.y)
        if (d < minDist) { minDist = d; nearHx = hx; nearHy = hy }
      }
      const grabRadius = group.scale.x * 1.2
      if (minDist < grabRadius) {
        const t = (1 - minDist / grabRadius) * 0.35
        _anchor.x += (nearHx - _anchor.x) * t
        _anchor.y += (nearHy - _anchor.y) * t
      }
    }

    group.position.lerp(_anchor, 0.18)
    group.rotation.z += (targetRot - group.rotation.z) * 0.18
    _targetScale.setScalar(scale)
    group.scale.lerp(_targetScale, 0.18)

    if (guitarStateRef) {
      guitarStateRef.current = {
        x        : group.position.x,
        y        : group.position.y,
        scale    : group.scale.x,
        rotation : group.rotation.z,
      }
    }

    // Convert screen-pixel dot offset → outer group local space
    if (dotsGroupRef.current) {
      const rot  = group.rotation.z
      const s    = group.scale.x
      const dotX = GUITAR_DOT_OFFSET[guitarModel]?.x ?? DOT_SCREEN_OFFSET_X
      const dotY = GUITAR_DOT_OFFSET[guitarModel]?.y ?? DOT_SCREEN_OFFSET_Y
      dotsGroupRef.current.position.x = ( dotX * Math.cos(rot) + dotY * Math.sin(rot)) / s
      dotsGroupRef.current.position.y = (-dotX * Math.sin(rot) + dotY * Math.cos(rot)) / s
    }

    // Strum flash
    if (pulseRef.current > 0) {
      pulseRef.current = Math.max(0, pulseRef.current - delta * 4)
      const extra = pulseRef.current * 1.5
      modelScene.current?.traverse(obj => {
        if (obj.isMesh && obj.material?.emissive) {
          obj.material.emissiveIntensity = extra
        }
      })
    }
  })

  return (
    <>
      <group ref={groupRef} visible={false}>
        {/* Guitar model — rotated and scaled */}
        <group
          rotation={MODEL_ROTATION}
          scale={[MODEL_NORM_SCALE * (GUITAR_MODEL_SCALE[guitarModel] ?? 1), MODEL_NORM_SCALE * (GUITAR_MODEL_SCALE[guitarModel] ?? 1), MODEL_NORM_SCALE * (GUITAR_MODEL_SCALE[guitarModel] ?? 1)]}
          position={[MODEL_X_OFFSET + (GUITAR_MODEL_OFFSET[guitarModel]?.[0] ?? 0), MODEL_Y_OFFSET + (GUITAR_MODEL_OFFSET[guitarModel]?.[1] ?? 0), 0]}
        >
          <primitive object={modelScene.current} />
        </group>

        {/* Dots — direct child of outer group, no extra scale or rotation */}
        {showDots && (
          <group ref={dotsGroupRef}>
            <FretboardDots selectedChord={selectedChord} guitarModel={guitarModel} />
          </group>
        )}

      </group>

      {/* StrumZoneDebug lives outside the guitar group so it uses screen-space
          coordinates — STRUM_X_CENTER moves it left/right, not diagonally. */}
      {showStrumZone && <StrumZoneDebug guitarStateRef={guitarStateRef} guitarModel={guitarModel} />}
    </>
  )
}
