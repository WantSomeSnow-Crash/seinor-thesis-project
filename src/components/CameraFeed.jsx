import { useEffect, useRef } from 'react'

export default function CameraFeed({ onStreamReady, deviceId = null }) {
  const videoRef = useRef(null)

  useEffect(() => {
    let stream = null

    async function startCamera() {
      try {
        const constraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
            if (onStreamReady) onStreamReady(videoRef.current)
          }
        }
      } catch (err) {
        console.error('Camera access denied:', err)
      }
    }

    startCamera()

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [onStreamReady, deviceId])

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ transform: 'scaleX(-1)' }}
      playsInline
      muted
    />
  )
}
