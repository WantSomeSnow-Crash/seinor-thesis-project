import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import FretboardDots from './FretboardDots'

// ── Model calibration ─────────────────────────────────────────────────────────
// Tweak these if the guitar still looks off after changes:
//   MODEL_ROTATION  – if neck points wrong way, try [0,0,Math.PI/2] or [0,Math.PI,0]
//   MODEL_NORM_SCALE – increase to make the model bigger inside the anchor group
//   MODEL_X/Y_OFFSET – nudge the model body onto the anchor point

const MODEL_ROTATION   = [0, 40, 0]   // adjust once you see how the model loads
const MODEL_NORM_SCALE = 2.0
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

// Preload so the model is ready before the user steps in frame
useGLTF.preload('/models/electric_guitar.glb')

export default function GuitarPlaceholder({
  poseResults,
  leftHanded     = false,
  selectedChord  = 'Em',
  guitarStateRef,
  strumPulse     = 0,
}) {
  const groupRef = useRef()
  const { size } = useThree()

  const { scene } = useGLTF('/models/electric_guitar.glb')

  // Clone the scene once so this instance owns its own graph
  const modelScene = useRef(null)
  if (!modelScene.current) modelScene.current = scene.clone(true)

  const poseRef      = useRef(poseResults)
  const leftRef      = useRef(leftHanded)
  const pulseRef     = useRef(0)
  const lastPulseRef = useRef(strumPulse)

  useEffect(() => { poseRef.current = poseResults }, [poseResults])
  useEffect(() => { leftRef.current = leftHanded  }, [leftHanded])

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
    <group ref={groupRef} visible={false}>
      {/* Guitar model with its calibration rotation */}
      <group
        rotation={MODEL_ROTATION}
        scale={[MODEL_NORM_SCALE, MODEL_NORM_SCALE, MODEL_NORM_SCALE]}
        position={[MODEL_X_OFFSET, MODEL_Y_OFFSET, 0]}
      >
        <primitive object={modelScene.current} />
      </group>

      {/* Fretboard dots — in outer group (screen-aligned) space,
          unaffected by MODEL_ROTATION. Calibrate FRET_Y / STRING_X
          in chords.js to line them up with the visible fretboard. */}
      <FretboardDots selectedChord={selectedChord} />
    </group>
  )
}
