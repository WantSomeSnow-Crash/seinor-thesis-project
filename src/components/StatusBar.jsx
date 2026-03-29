export default function StatusBar({ cameraReady, trackingReady, step = 1 }) {
  const label = !cameraReady
    ? 'Waiting for camera…'
    : !trackingReady
      ? 'Loading MediaPipe models…'
      : 'Tracking active'

  const dotColor = !cameraReady || !trackingReady
    ? 'bg-amber-500 animate-pulse'
    : 'bg-emerald-500'

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center gap-3 border border-slate-700/50 shadow-xl">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="text-slate-50 text-sm font-sans">{label}</span>
        <span className="ml-4 text-slate-400 text-xs font-sans border-l border-slate-700 pl-4">
          Step {step} — {step === 1 ? 'Camera + UI' : step === 2 ? 'MediaPipe Tracking' : '3D Guitar'}
        </span>
      </div>
    </div>
  )
}
