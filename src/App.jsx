import { useState, useCallback, useRef } from 'react'
import CameraFeed from './components/CameraFeed'
import ChordSelector from './components/ChordSelector'
import StatusBar from './components/StatusBar'
import TrackingCanvas from './components/TrackingCanvas'
import GuitarScene from './components/GuitarScene'
import useMediaPipe from './hooks/useMediaPipe'
import useAudio from './hooks/useAudio'
import useStrum from './hooks/useStrum'
import { CHORDS } from './data/chords'
import './index.css'

export default function App() {
  const [selectedChord, setSelectedChord] = useState('Em')
  const [cameraReady, setCameraReady]     = useState(false)
  const [leftHanded, setLeftHanded]       = useState(false)
  const [strumPulse, setStrumPulse]       = useState(0)  // incremented on each strum
  const [strumFlash, setStrumFlash]       = useState(false)

  const videoRef      = useRef(null)
  const guitarStateRef = useRef({ x: 0, y: 0, scale: 100 })

  // Viewport size for world-space coordinate mapping (matches R3F orthographic camera)
  const sizeRef = useRef({ width: window.innerWidth, height: window.innerHeight })

  const handleStreamReady = useCallback((videoEl) => {
    videoRef.current = videoEl
    setCameraReady(true)
  }, [])

  const { poseResults, handResults, trackingReady } = useMediaPipe(videoRef)
  const { playChord, initAudio }                    = useAudio()

  // Strum handler — plays the chord and triggers string flash
  const handleStrum = useCallback(() => {
    playChord(CHORDS[selectedChord]?.notes)
    setStrumPulse(n => n + 1)

    // Brief UI flash
    setStrumFlash(true)
    setTimeout(() => setStrumFlash(false), 250)
  }, [playChord, selectedChord])

  // Detect strum via hand entering guitar body zone
  useStrum({
    handResults,
    guitarStateRef,
    size     : sizeRef.current,
    leftHanded,
    onStrum  : handleStrum,
  })

  // Prime audio context on first chord button tap (browser requires a user gesture)
  const handleChordChange = useCallback((chord) => {
    initAudio()
    setSelectedChord(chord)
  }, [initAudio])

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans">

      {/* Layer 1 — camera */}
      <CameraFeed onStreamReady={handleStreamReady} />

      {/* Layer 2 — skeleton canvas */}
      <TrackingCanvas poseResults={poseResults} handResults={handResults} />

      {/* Layer 3 — 3D guitar */}
      <GuitarScene
        poseResults={poseResults}
        leftHanded={leftHanded}
        selectedChord={selectedChord}
        guitarStateRef={guitarStateRef}
        strumPulse={strumPulse}
      />

      {/* Layer 4 — vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 13,
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.50) 100%)',
        }}
      />

      {/* Strum flash overlay */}
      {strumFlash && (
        <div
          className="absolute inset-0 pointer-events-none z-[14]"
          style={{ background: 'rgba(16, 185, 129, 0.08)' }}
        />
      )}

      {/* ── UI panels ────────────────────────────────────────────────────── */}

      {/* App title */}
      <div className="absolute top-6 left-6 z-20">
        <div className="glass-panel rounded-2xl">
          <span className="text-slate-50 font-bold text-lg tracking-tight">
            🎸 Air Guitar
          </span>
        </div>
      </div>

      {/* Chord selector */}
      <ChordSelector
        selectedChord={selectedChord}
        onChordChange={handleChordChange}
      />

      {/* Right panel */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">

        {/* Handedness toggle */}
        <div className="glass-panel rounded-2xl">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Playing style</p>
          <div className="flex gap-2">
            <button
              onClick={() => setLeftHanded(false)}
              className={`glass-btn flex-1 text-sm ${!leftHanded ? 'glass-btn-active' : ''}`}
            >
              Right-handed
            </button>
            <button
              onClick={() => setLeftHanded(true)}
              className={`glass-btn flex-1 text-sm ${leftHanded ? 'glass-btn-active' : ''}`}
            >
              Left-handed
            </button>
          </div>
        </div>

        {/* Strum indicator */}
        <div className="glass-panel rounded-2xl">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Strum</p>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full transition-all duration-100
              ${strumFlash ? 'bg-emerald-400 scale-125 shadow-lg shadow-emerald-500/50' : 'bg-slate-600'}`}
            />
            <span className={`text-sm font-semibold transition-colors duration-100
              ${strumFlash ? 'text-emerald-400' : 'text-slate-400'}`}>
              {strumFlash ? selectedChord + ' ♪' : 'Swing your hand through the strings'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="glass-panel rounded-2xl">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Legend</p>
          <ul className="text-slate-300 text-sm space-y-1">
            <li><span className="text-emerald-400 font-bold">●</span> Finger position dots</li>
            <li><span className="text-orange-400 font-bold">●</span> Strumming hand</li>
            <li><span className="text-purple-400 font-bold">●</span> Fretting hand</li>
          </ul>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar cameraReady={cameraReady} trackingReady={trackingReady} step={4} />
    </div>
  )
}
