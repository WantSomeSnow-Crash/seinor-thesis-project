import { useEffect, useRef, useState } from 'react'
import useMediaPipe from '../hooks/useMediaPipe'
import useDwellClick from '../hooks/useDwellClick'
import HandCursor from './HandCursor'

export default function LandingPage({ onEnter }) {
  const [camStatus, setCamStatus] = useState('pending')  // pending | granted | denied
  const videoRef = useRef(null)

  // Ask for camera permission as soon as the page loads
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCamStatus('granted')
      })
      .catch(() => setCamStatus('denied'))
  }, [])

  // Pass videoRef directly — useMediaPipe reads .current each frame so it
  // picks up the stream automatically once the camera is granted
  const { handResults } = useMediaPipe(videoRef)
  const dwellCursor     = useDwellClick({ handResults, enabled: camStatus === 'granted' })

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black">

      {/* Hidden video — needed for hand tracking but not shown on landing page */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute"
        style={{ opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
      />

      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 60% 40%, rgba(16,185,129,0.15) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(124,58,237,0.12) 0%, transparent 55%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-2xl">

        {/* Icon */}
        <div className="glass-panel rounded-3xl text-6xl leading-none">
          🎸
        </div>

        {/* Title */}
        <div className="flex flex-col gap-3">
          <h1 className="text-white font-bold text-6xl tracking-tight">
            Air Guitar
          </h1>
          <p className="text-slate-400 text-xl">
            Learn to play guitar with just your hands and a camera.
          </p>
        </div>

        {/* Camera status */}
        {camStatus === 'pending' && (
          <div className="glass-panel rounded-2xl text-slate-300 text-sm">
            Requesting camera access…
          </div>
        )}
        {camStatus === 'denied' && (
          <div className="glass-panel rounded-2xl text-red-400 text-sm">
            Camera access denied. Please allow camera access in your browser and reload.
          </div>
        )}

        {/* CTA — only shown once camera is ready */}
        {camStatus === 'granted' && (
          <>
            <button
              onClick={onEnter}
              className="glass-btn text-lg w-full"
            >
              Get Started
            </button>
            <p className="text-slate-500 text-xs">
              Point your finger at the button and hold to continue hands-free
            </p>
          </>
        )}
      </div>

      {/* Hand cursor with dwell ring */}
      <HandCursor cursor={dwellCursor} />
    </div>
  )
}
