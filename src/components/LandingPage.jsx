export default function LandingPage({ onEnter }) {
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

        {/* Feature highlights
        <div className="flex flex-col gap-3 w-full">
          {[
            { icon: '📷', label: 'Real-time pose & hand tracking' },
            { icon: '🎵', label: 'Strum chords with natural gestures' },
            { icon: '🎸', label: '3D guitar follows your body' },
          ].map(({ icon, label }) => (
            <div key={label} className="glass-panel rounded-2xl flex items-center gap-4 text-left">
              <span className="text-2xl">{icon}</span>
              <span className="text-slate-200 text-sm font-medium">{label}</span>
            </div>
          ))}
        </div> */}

        {/* CTA */}
        <button
          onClick={onEnter}
          className="glass-btn text-lg w-full"
        >
          Get Started
        </button>

        {/* Footer note */}
        <p className="text-slate-600 text-xs">
          Allow camera access when prompted.
        </p>
      </div>
    </div>
  )
}
