import { useMemo } from 'react'
import { CHORDS } from '../data/chords'

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e']
const NUM_FRETS    = 4
const NUM_STRINGS  = 6

const W           = 118
const H           = 148
const PAD_L       = 14
const PAD_TOP     = 36   // room for string names + X/O markers
const STRING_GAP  = (W - PAD_L * 2) / (NUM_STRINGS - 1)   // ~18
const FRET_GAP    = (H - PAD_TOP - 8) / NUM_FRETS          // ~26

export default function ChordDiagram({ selectedChord }) {
  const chord = CHORDS[selectedChord]

  const { openStrings, mutedStrings, frettedNotes, startFret } = useMemo(() => {
    if (!chord) return { openStrings: [], mutedStrings: [], frettedNotes: [], startFret: 1 }

    const fingerMap = new Map()
    for (const f of chord.fingers) fingerMap.set(f.string, f.fret)

    const open = [], muted = [], fretted = []
    for (let s = 0; s < NUM_STRINGS; s++) {
      if (!fingerMap.has(s))            muted.push(s)
      else if (fingerMap.get(s) === 0)  open.push(s)
      else                              fretted.push({ string: s, fret: fingerMap.get(s) })
    }

    const nonZeroFrets = fretted.map(f => f.fret)
    const minFret      = nonZeroFrets.length ? Math.min(...nonZeroFrets) : 1
    const startFret    = minFret <= 3 ? 1 : minFret

    return { openStrings: open, mutedStrings: muted, frettedNotes: fretted, startFret }
  }, [chord])

  if (!chord) return null

  // Assign finger numbers: sort by fret asc, then string asc
  const sorted = [...frettedNotes].sort((a, b) => a.fret - b.fret || a.string - b.string)
  const fingerNum = (s, f) => sorted.findIndex(n => n.string === s && n.fret === f) + 1

  const nutY         = PAD_TOP
  const isOpenChord  = startFret === 1

  return (
    <div className="glass-panel rounded-2xl flex flex-col items-center" style={{ padding: '0.75rem 0.75rem 0.5rem' }}>
      <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">
        {chord.label}
      </p>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>

        {/* String names */}
        {STRING_NAMES.map((name, i) => (
          <text key={i}
            x={PAD_L + i * STRING_GAP} y={10}
            textAnchor="middle" fill="#64748b" fontSize={8.5} fontFamily="sans-serif"
          >{name}</text>
        ))}

        {/* Muted (X) / Open (O) markers */}
        {mutedStrings.map(s => (
          <text key={s}
            x={PAD_L + s * STRING_GAP} y={25}
            textAnchor="middle" fill="#ef4444" fontSize={12} fontFamily="sans-serif" fontWeight="bold"
          >×</text>
        ))}
        {openStrings.map(s => (
          <text key={s}
            x={PAD_L + s * STRING_GAP} y={25}
            textAnchor="middle" fill="#94a3b8" fontSize={11} fontFamily="sans-serif"
          >○</text>
        ))}

        {/* Nut — thick for open chords, thin bar otherwise */}
        <rect
          x={PAD_L - 1} y={nutY}
          width={(NUM_STRINGS - 1) * STRING_GAP + 2}
          height={isOpenChord ? 5 : 2}
          fill={isOpenChord ? '#e2e8f0' : '#475569'}
          rx={1}
        />

        {/* Fret lines */}
        {Array.from({ length: NUM_FRETS }).map((_, i) => (
          <line key={i}
            x1={PAD_L} y1={nutY + (i + 1) * FRET_GAP}
            x2={PAD_L + (NUM_STRINGS - 1) * STRING_GAP} y2={nutY + (i + 1) * FRET_GAP}
            stroke="#334155" strokeWidth={1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: NUM_STRINGS }).map((_, i) => (
          <line key={i}
            x1={PAD_L + i * STRING_GAP} y1={nutY}
            x2={PAD_L + i * STRING_GAP} y2={nutY + NUM_FRETS * FRET_GAP}
            stroke="#334155" strokeWidth={1}
          />
        ))}

        {/* Fret position label (non-open chords only) */}
        {!isOpenChord && (
          <text
            x={W - 2} y={nutY + FRET_GAP * 0.6}
            textAnchor="end" fill="#64748b" fontSize={8} fontFamily="sans-serif"
          >{startFret}fr</text>
        )}

        {/* Finger dots */}
        {frettedNotes.map(({ string, fret }) => {
          const cx = PAD_L + string * STRING_GAP
          const cy = nutY + (fret - startFret) * FRET_GAP + FRET_GAP / 2
          return (
            <g key={`${string}-${fret}`}>
              <circle cx={cx} cy={cy} r={8} fill="#1e293b" />
              <text
                x={cx} y={cy + 3.5}
                textAnchor="middle" fill="white" fontSize={8.5}
                fontFamily="sans-serif" fontWeight="bold"
              >{fingerNum(string, fret)}</text>
            </g>
          )
        })}

      </svg>
    </div>
  )
}
