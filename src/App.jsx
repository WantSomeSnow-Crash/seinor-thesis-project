import { useState, useCallback, useRef } from 'react'
import CameraFeed from './components/CameraFeed'
import ChordSelector from './components/ChordSelector'
import StatusBar from './components/StatusBar'
import TrackingCanvas from './components/TrackingCanvas'
import GuitarScene from './components/GuitarScene'
import LandingPage from './components/LandingPage'
import ModeSelect from './components/ModeSelect'
import useMediaPipe from './hooks/useMediaPipe'
import useAudio from './hooks/useAudio'
import useStrum from './hooks/useStrum'
import useDwellClick from './hooks/useDwellClick'
import useChordRecognition from './hooks/useChordRecognition'
import HandCursor from './components/HandCursor'
import SettingsPanel from './components/SettingsPanel'
import { CHORDS } from './data/chords'
import './index.css'

export default function App() {
  const [showApp, setShowApp]           = useState(false)
  const [mode, setMode]                 = useState(null)   // null | 'rock' | 'learn'
  const [selectedChord, setSelectedChord] = useState('Em')
  const [cameraReady, setCameraReady]   = useState(false)
  const [leftHanded, setLeftHanded]     = useState(false)
  const [strumPulse, setStrumPulse]     = useState(0)
  const [strumFlash, setStrumFlash]     = useState(false)
  const [strumDirection, setStrumDirection] = useState(null)  // 'up' | 'down' | null
  const [showStrumZone, setShowStrumZone] = useState(false)
  const [showTracking, setShowTracking] = useState(true)
  const [darkMode, setDarkMode]         = useState(false)
  const [autoChordLearn, setAutoChordLearn] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const videoRef       = useRef(null)
  const guitarStateRef = useRef({ x: 0, y: 0, scale: 100 })
  const sizeRef        = useRef({ width: window.innerWidth, height: window.innerHeight })

  // Rock mode always has auto-detect on; learn mode uses its own toggle
  const autoChord = mode === 'rock' ? true : autoChordLearn

  const handleStreamReady = useCallback((videoEl) => {
    videoRef.current = videoEl
    setCameraReady(true)
  }, [])

  const { poseResults, handResults, trackingReady } = useMediaPipe(videoRef)
  const { playString, playStrum, initAudio }        = useAudio()
  const dwellCursor                                 = useDwellClick({ handResults })

  // Learn mode — play individual string note
  const handleStringStrum = useCallback((stringIndex) => {
    if (mode !== 'learn') return
    const note = CHORDS[selectedChord]?.stringNotes?.[stringIndex]
    initAudio()
    if (note) playString(stringIndex, note)
    setStrumPulse(n => n + 1)
    setStrumFlash(true)
    setTimeout(() => setStrumFlash(false), 250)
  }, [playString, initAudio, selectedChord, mode])

  // Rock mode — play full chord strum recording
  const handleRockStrum = useCallback((direction) => {
    if (mode !== 'rock') return
    initAudio()
    playStrum(selectedChord, direction)
    setStrumPulse(n => n + 1)
    setStrumFlash(true)
    setStrumDirection(direction)
    setTimeout(() => setStrumFlash(false), 250)
    setTimeout(() => setStrumDirection(null), 400)
  }, [playStrum, initAudio, selectedChord, mode])

  useStrum({
    handResults,
    guitarStateRef,
    size          : sizeRef.current,
    leftHanded,
    onStringStrum : mode === 'learn' ? handleStringStrum : undefined,
    onStrum       : mode === 'rock'  ? handleRockStrum   : undefined,
  })

  const handleChordChange = useCallback((chord) => {
    initAudio()
    setSelectedChord(chord)
  }, [initAudio])

  useChordRecognition({
    handResults,
    leftHanded,
    enabled: autoChord,
    onChordDetected: handleChordChange,
  })

  // ── Screen routing ───────────────────────────────────────────────────────────
  if (!showApp) {
    return <LandingPage onEnter={() => setShowApp(true)} />
  }

  if (!mode) {
    return (
      <>
        {/* Camera runs hidden so useMediaPipe can feed hand tracking to dwell-click */}
        <div style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}>
          <CameraFeed onStreamReady={handleStreamReady} />
        </div>
        <ModeSelect onSelect={setMode} dwellCursor={dwellCursor} />
      </>
    )
  }

  // ── Main app ─────────────────────────────────────────────────────────────────
  const showDots = mode === 'learn'

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden font-sans${darkMode ? ' dark-mode' : ''}`}>

      {/* Layer 1 — camera */}
      <CameraFeed onStreamReady={handleStreamReady} />

      {/* Layer 2 — skeleton canvas */}
      <TrackingCanvas poseResults={poseResults} handResults={handResults} visible={showTracking} />

      {/* Layer 3 — 3D guitar */}
      <GuitarScene
        poseResults={poseResults}
        leftHanded={leftHanded}
        selectedChord={selectedChord}
        guitarStateRef={guitarStateRef}
        strumPulse={strumPulse}
        showStrumZone={showStrumZone}
        showDots={showDots}
      />

      {/* Layer 4 — vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 13,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.50) 100%)',
        }}
      />

      {/* Strum flash overlay */}
      {strumFlash && (
        <div
          className="absolute inset-0 pointer-events-none z-[14]"
          style={{ background: 'rgba(16, 185, 129, 0.08)' }}
        />
      )}

      {/* ── UI panels ─────────────────────────────────────────────────────── */}

      {/* App title + mode badge */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
        <div className="glass-panel rounded-2xl">
          <span className="text-slate-50 font-bold text-lg tracking-tight">
            🎸 Air Guitar
          </span>
        </div>
        <button
          onClick={() => setMode(null)}
          className="glass-btn text-xs text-slate-400"
          style={{ padding: '0.35rem 0.85rem' }}
        >
          {mode === 'rock' ? '🤘 Rock mode' : '🎓 Learn mode'} — switch
        </button>
      </div>

      {/* Chord selector */}
      <ChordSelector
        selectedChord={selectedChord}
        onChordChange={handleChordChange}
      />

      {/* Settings gear + strum indicator + legend */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">

        <button
          onClick={() => setSettingsOpen(v => !v)}
          className={`glass-btn text-xl ${settingsOpen ? 'glass-btn-active' : ''}`}
          style={{ padding: '0.65rem 1rem' }}
        >
          ⚙️
        </button>

        {/* Strum indicator */}
        <div className="glass-panel rounded-2xl">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Strum</p>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full transition-all duration-100
              ${strumFlash ? 'bg-emerald-400 scale-125 shadow-lg shadow-emerald-500/50' : 'bg-slate-600'}`}
            />
            <span className={`text-sm font-semibold transition-colors duration-100
              ${strumFlash ? 'text-emerald-400' : 'text-slate-400'}`}>
              {mode === 'rock'
                ? (strumDirection ? `${strumDirection === 'down' ? '↓' : '↑'} ${selectedChord}` : 'Strum through the strings')
                : (strumFlash ? selectedChord + ' ♪' : 'Swing your hand through the strings')
              }
            </span>
          </div>
        </div>

        {/* Legend — only in learn mode */}
        {mode === 'learn' && (
          <div className="glass-panel rounded-2xl">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Legend</p>
            <ul className="text-slate-300 text-sm space-y-1">
              <li><span className="text-emerald-400 font-bold">●</span> Finger position dots</li>
              <li><span className="text-orange-400 font-bold">●</span> Strumming hand</li>
              <li><span className="text-purple-400 font-bold">●</span> Fretting hand</li>
            </ul>
          </div>
        )}
      </div>

      {/* Settings panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        mode={mode}
        autoChord={autoChordLearn}
        setAutoChord={setAutoChordLearn}
        leftHanded={leftHanded}
        setLeftHanded={setLeftHanded}
        showTracking={showTracking}
        setShowTracking={setShowTracking}
        showStrumZone={showStrumZone}
        setShowStrumZone={setShowStrumZone}
      />

      {/* Dark mode toggle — bottom left */}
      <div className="absolute bottom-6 left-6 z-20">
        <button
          onClick={() => setDarkMode(v => !v)}
          className={`glass-btn text-sm ${darkMode ? 'glass-btn-active' : ''}`}
        >
          {darkMode ? '☀ Light mode' : '🌙 Dark mode'}
        </button>
      </div>

      {/* Status bar */}
      <StatusBar cameraReady={cameraReady} trackingReady={trackingReady} step={4} />

      {/* Hand cursor with dwell-click ring */}
      <HandCursor cursor={dwellCursor} />
    </div>
  )
}
