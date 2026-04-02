import HandCursor from './HandCursor'

export default function ModeSelect({ onSelect, dwellCursor }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black">

      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 60% 40%, rgba(16,185,129,0.15) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(124,58,237,0.12) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center max-w-3xl w-full">

        {/* Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-white font-bold text-5xl tracking-tight">🎸 Choose your mode</h1>
          <p className="text-slate-400 text-lg">How do you want to play today?</p>
        </div>

        {/* Mode cards */}
        <div className="flex gap-6 w-full">

          {/* Rock mode */}
          <button
            onClick={() => onSelect('rock')}
            className="glass-btn flex-1 flex flex-col items-center gap-4 rounded-3xl"
            style={{ padding: '2.5rem 1.5rem' }}
          >
            <span className="text-6xl">🤘</span>
            <span className="text-white font-bold text-2xl">I Wanna Rock</span>
            <span className="text-slate-300 text-sm font-normal leading-relaxed">
              Strum full chords with natural up &amp; down strokes. Auto chord detection included — just make the shape and play.
            </span>
          </button>

          {/* Learn mode */}
          <button
            onClick={() => onSelect('learn')}
            className="glass-btn flex-1 flex flex-col items-center gap-4 rounded-3xl"
            style={{ padding: '2.5rem 1.5rem' }}
          >
            <span className="text-6xl">🎓</span>
            <span className="text-white font-bold text-2xl">I Wanna Learn</span>
            <span className="text-slate-300 text-sm font-normal leading-relaxed">
              See finger placement dots on the fretboard and pluck individual strings. Perfect for learning chord shapes.
            </span>
          </button>

        </div>

        <p className="text-slate-600 text-xs">
          Point your finger at a mode and hold to select hands-free
        </p>
      </div>

      <HandCursor cursor={dwellCursor} />
    </div>
  )
}
