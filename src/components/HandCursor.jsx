/**
 * Renders a floating cursor dot that follows the index finger tip.
 * Shows a progress ring that fills up during dwell — when full, a click fires.
 */
export default function HandCursor({ cursor }) {
  if (!cursor) return null

  const { x, y, progress } = cursor

  const R          = 22          // ring radius
  const STROKE     = 3
  const CIRCUMF    = 2 * Math.PI * R
  const dashOffset = CIRCUMF * (1 - progress)
  const isActive   = progress > 0

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {/* Progress ring */}
      <svg
        width={(R + STROKE) * 2}
        height={(R + STROKE) * 2}
        style={{ position: 'absolute', top: -(R + STROKE), left: -(R + STROKE) }}
      >
        {/* Background ring */}
        <circle
          cx={R + STROKE} cy={R + STROKE} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={R + STROKE} cy={R + STROKE} r={R}
          fill="none"
          stroke={progress >= 1 ? '#10b981' : '#6ee7b7'}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMF}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${R + STROKE} ${R + STROKE})`}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>

      {/* Centre dot */}
      <div
        style={{
          width:        10,
          height:       10,
          borderRadius: '50%',
          background:   isActive ? '#6ee7b7' : 'rgba(255,255,255,0.8)',
          boxShadow:    isActive
            ? '0 0 8px 2px rgba(16,185,129,0.7)'
            : '0 0 4px 1px rgba(255,255,255,0.4)',
          position:     'absolute',
          top: -5, left: -5,
          transition:   'background 0.1s, box-shadow 0.1s',
        }}
      />
    </div>
  )
}
