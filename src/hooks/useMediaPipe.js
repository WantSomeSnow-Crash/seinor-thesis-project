import { useEffect, useRef, useState } from 'react'
import {
  PoseLandmarker,
  HandLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision'

export default function useMediaPipe(videoRef) {
  const poseLandmarkerRef = useRef(null)
  const handLandmarkerRef = useRef(null)
  const rafRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)

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
            modelAssetPath: '/models/pose_landmarker_full.task',
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

      setPoseResults(poseRes)
      setHandResults(handRes)

      rafRef.current = requestAnimationFrame(detect)
    }

    rafRef.current = requestAnimationFrame(detect)
    return () => cancelAnimationFrame(rafRef.current)
  }, [ready, videoRef])

  return { poseResults, handResults, trackingReady: ready }
}
