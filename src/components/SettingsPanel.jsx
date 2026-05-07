import { useEffect, useState } from 'react'
import AmpSelector from './AmpSelector'

export default function SettingsPanel({
  open,
  onClose,
  mode,
  autoChord,
  setAutoChord,
  leftHanded,
  setLeftHanded,
  showTracking,
  setShowTracking,
  showStrumZone,
  setShowStrumZone,
  currentAmp,
  onAmpChange,
  guitarModel,
  onGuitarModelChange,
  cameraDeviceId,
  onCameraDeviceChange,
  dotOffsetX = 0,
  dotOffsetY = 0,
  onDotOffsetChange,
}) {
  const [cameras, setCameras] = useState([])

  useEffect(() => {
    if (!open) return
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setCameras(devices.filter(d => d.kind === 'videoinput'))
    })
  }, [open])
  return (
    <>
      {/* Backdrop — click to close */}
      {open && (
        <div
          className="absolute inset-0 z-30"
          style={{ background: 'rgba(0,0,0,0.30)' }}
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className="absolute top-0 right-0 h-full z-40 flex flex-col gap-4 p-6 overflow-y-auto"
        style={{
          width: 320,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          background: 'rgba(10,10,10,0.75)',
          borderLeft: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-bold text-xl tracking-tight">Settings</h2>
          <button
            onClick={onClose}
            className="glass-btn text-sm px-3 py-1"
            style={{ padding: '0.35rem 0.85rem' }}
          >
            ✕
          </button>
        </div>

        {/* Chord detection — toggleable in both modes */}
        <div className="glass-panel rounded-2xl">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Chord detection</p>
          <button
            onClick={() => setAutoChord(v => !v)}
            className={`glass-btn w-full text-sm ${autoChord ? 'glass-btn-active' : ''}`}
          >
            {autoChord ? 'Auto-detect: On' : 'Auto-detect: Off'}
          </button>
        </div>

        {/* Guitar selector */}
        <div className="glass-panel rounded-2xl">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Guitar</p>
          <div className="flex gap-2">
            <button
              onClick={() => onGuitarModelChange('electric')}
              className={`glass-btn flex-1 text-sm ${guitarModel === 'electric' ? 'glass-btn-active' : ''}`}
            >
              🎸 Electric
            </button>
            <button
              onClick={() => onGuitarModelChange('acoustic')}
              className={`glass-btn flex-1 text-sm ${guitarModel === 'acoustic' ? 'glass-btn-active' : ''}`}
            >
              🪕 Acoustic
            </button>
          </div>
        </div>

        {/* Amp selector */}
        <AmpSelector currentAmp={currentAmp} onAmpChange={onAmpChange} />

        {/* Playing style */}
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

        {/* Dot position — learn mode only */}
        {mode === 'learn' && (
          <div className="glass-panel rounded-2xl">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Dot Position</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-slate-300 text-xs">Left / Right</span>
                  <span className="text-slate-400 text-xs">{dotOffsetX > 0 ? '+' : ''}{dotOffsetX}px</span>
                </div>
                <input type="range" min={-200} max={200} step={1} value={dotOffsetX}
                  onChange={e => onDotOffsetChange?.(Number(e.target.value), dotOffsetY)}
                  className="w-full accent-emerald-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-slate-300 text-xs">Up / Down</span>
                  <span className="text-slate-400 text-xs">{dotOffsetY > 0 ? '+' : ''}{dotOffsetY}px</span>
                </div>
                <input type="range" min={-200} max={200} step={1} value={dotOffsetY}
                  onChange={e => onDotOffsetChange?.(dotOffsetX, Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>
              <button
                onClick={() => onDotOffsetChange?.(0, 0)}
                className="glass-btn text-xs text-slate-400 w-full"
              >
                Reset to default
              </button>
            </div>
          </div>
        )}

        {/* Camera selector */}
        {cameras.length > 1 && (
          <div className="glass-panel rounded-2xl">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Camera</p>
            <div className="flex flex-col gap-2">
              {cameras.map(cam => (
                <button
                  key={cam.deviceId}
                  onClick={() => onCameraDeviceChange?.(cam.deviceId)}
                  className={`glass-btn w-full text-sm text-left ${cameraDeviceId === cam.deviceId ? 'glass-btn-active' : ''}`}
                >
                  {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Debug */}
        <div className="glass-panel rounded-2xl">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Debug</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowTracking(v => !v)}
              className={`glass-btn w-full text-sm ${!showTracking ? 'glass-btn-active' : ''}`}
            >
              {showTracking ? 'Hide tracking' : 'Show tracking'}
            </button>
            <button
              onClick={() => setShowStrumZone(v => !v)}
              className={`glass-btn w-full text-sm ${showStrumZone ? 'glass-btn-active' : ''}`}
            >
              {showStrumZone ? 'Hide strum zone' : 'Show strum zone'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
