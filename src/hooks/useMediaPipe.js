import { useEffect, useRef, useState } from 'react'
import {
  PoseLandmarker,
  HandLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision'

// Only accept a pose if its torso center is within the middle of the frame.
// This prevents locking onto people walking past in the background.
const CENTER_ZONE_MIN = 0.20
const CENTER_ZONE_MAX = 0.80

function isCentered(landmarks) {
  if (!landmarks?.length) return false
  // Torso = avg x of left/right shoulders (11,12) and left/right hips (23,24)
  const pts = [11, 12, 23, 24].map(i => landmarks[i]?.x ?? 0.5)
  const cx = pts.reduce((s, v) => s + v, 0) / pts.length
  return cx >= CENTER_ZONE_MIN && cx <= CENTER_ZONE_MAX
}

export default function useMediaPipe(videoRef) {
  const poseLandmarkerRef = useRef(null)
  const handLandmarkerRef = useRef(null)
  const rafRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)
  const lastPoseRef = useRef(null)

  const [poseResults, setPoseResults] = useState(null)
  const [handResults, setHandResults] = useState(null)
  const [ready, setReady] = useState(false)

  // Initialise both landmarkers once
  useEffect(() => {
    let cancelled = false

    async function init() {
      const vision = await FilesetResolver.forVisionTasks('/wasm')

      const [pose, hand] = await Promise.all([
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        }),
        HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        }),
      ])

      if (cancelled) {
        pose.close()
        hand.close()
        return
      }

      poseLandmarkerRef.current = pose
      handLandmarkerRef.current = hand
      setReady(true)
    }

    init().catch(console.error)
    return () => { cancelled = true }
  }, [])

  // Detection loop — runs once both models and the video are ready
  useEffect(() => {
    if (!ready) return

    function detect() {
      const video = videoRef.current
      if (
        !video ||
        video.readyState < 2 ||
        video.currentTime === lastVideoTimeRef.current
      ) {
        rafRef.current = requestAnimationFrame(detect)
        return
      }

      lastVideoTimeRef.current = video.currentTime
      const now = performance.now()

      const poseRes = poseLandmarkerRef.current.detectForVideo(video, now)
      const handRes = handLandmarkerRef.current.detectForVideo(video, now)

      // Reject poses that are outside the center zone (background passersby)
      const poseToUse = isCentered(poseRes?.landmarks?.[0])
        ? poseRes
        : lastPoseRef.current
      lastPoseRef.current = poseToUse

      setPoseResults(poseToUse)
      setHandResults(handRes)

      rafRef.current = requestAnimationFrame(detect)
    }

    rafRef.current = requestAnimationFrame(detect)
    return () => cancelAnimationFrame(rafRef.current)
  }, [ready, videoRef])

  return { poseResults, handResults, trackingReady: ready }
}
