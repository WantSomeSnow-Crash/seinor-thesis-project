import { AMP_PRESETS } from '../hooks/useAudio'

export default function AmpSelector({ currentAmp, onAmpChange }) {
  return (
    <div className="glass-panel rounded-2xl">
      <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Amp</p>
      <div className="flex flex-col gap-2">
        {Object.entries(AMP_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => onAmpChange(key)}
            className={`glass-btn text-sm text-left ${currentAmp === key ? 'glass-btn-active' : ''}`}
            style={{ padding: '0.5rem 1rem' }}
          >
            {preset.emoji} {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
