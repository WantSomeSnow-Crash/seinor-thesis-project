const CHORDS = [
  { id: 'Em', label: 'E minor' },
  { id: 'G',  label: 'G Major' },
  { id: 'C',  label: 'C Major' },
  { id: 'D',  label: 'D Major' },
  { id: 'Am', label: 'A minor' },
]

export default function ChordSelector({ selectedChord, onChordChange }) {
  return (
    <div className="absolute top-6 left-1/2 z-20 flex flex-col items-center gap-4" style={{ transform: 'translateX(-65%)' }}>
      {/* Current chord display */}
      <div className="glass-panel rounded-2xl text-center">
        <p className="text-slate-400 text-sm font-sans uppercase tracking-widest mb-1">
          Selected Chord
        </p>
        <p className="text-emerald-400 text-6xl font-bold font-sans leading-none">
          {selectedChord}
        </p>
      </div>

      {/* Chord buttons */}
      <div className="flex gap-2">
        {CHORDS.map(chord => (
          <button
            key={chord.id}
            onClick={() => onChordChange(chord.id)}
            className={`glass-btn font-sans text-sm ${selectedChord === chord.id ? 'glass-btn-active' : ''}`}
          >
            {chord.label}
          </button>
        ))}
      </div>
    </div>
  )
}
