import { useState, useEffect, useRef, useCallback } from 'react'

export default function SongPlayer({ song, onChordChange, onStop }) {
  const [index, setIndex]       = useState(0)
  const [playing, setPlaying]   = useState(false)
  const [countdown, setCountdown] = useState(null) // 3,2,1 before start
  const intervalRef = useRef(null)
  const countRef    = useRef(null)

  const msPerChord = (60 / song.bpm) * song.beatsPerChord * 1000

  const stop = useCallback(() => {
    setPlaying(false)
    setCountdown(null)
    setIndex(0)
    clearInterval(intervalRef.current)
    clearInterval(countRef.current)
    onStop?.()
  }, [onStop])

  const start = useCallback(() => {
    let n = 3
    setCountdown(n)
    countRef.current = setInterval(() => {
      n--
      if (n <= 0) {
        clearInterval(countRef.current)
        setCountdown(null)
        setPlaying(true)
      } else {
        setCountdown(n)
      }
    }, 1000)
  }, [])

  // Advance chord on interval
  useEffect(() => {
    if (!playing) return
    onChordChange?.(song.chords[0])

    let i = 0
    intervalRef.current = setInterval(() => {
      i++
      if (i >= song.chords.length) {
        clearInterval(intervalRef.current)
        setPlaying(false)
        setIndex(0)
        onStop?.()
        return
      }
      setIndex(i)
      onChordChange?.(song.chords[i])
    }, msPerChord)

    return () => clearInterval(intervalRef.current)
  }, [playing]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleStart = Math.max(0, index - 1)
  const visible = song.chords.slice(visibleStart, visibleStart + 7)

  return (
    <div className="glass-panel rounded-2xl" style={{ minWidth: 340 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-bold text-sm leading-tight">{song.title}</p>
          <p className="text-slate-400 text-xs">{song.artist} · {song.bpm} BPM</p>
        </div>
        <button onClick={stop} className="glass-btn text-xs text-slate-400" style={{ padding: '0.3rem 0.7rem' }}>
          ✕ Stop
        </button>
      </div>

      {/* Countdown */}
      {countdown !== null && (
        <div className="flex items-center justify-center py-4">
          <span className="text-emerald-400 font-bold text-5xl">{countdown}</span>
        </div>
      )}

      {/* Chord scroll bar */}
      {countdown === null && (
        <div className="flex items-center gap-2 overflow-hidden">
          {visible.map((chord, vi) => {
            const actualIdx = visibleStart + vi
            const isCurrent = actualIdx === index
            const isPast    = actualIdx < index
            return (
              <div
                key={actualIdx}
                className="flex flex-col items-center gap-1 transition-all duration-300"
                style={{ minWidth: 52 }}
              >
                <div
                  className={`rounded-xl px-3 py-2 text-center font-bold transition-all duration-300 ${
                    isCurrent
                      ? 'bg-emerald-500 text-white text-xl scale-110 shadow-lg shadow-emerald-500/40'
                      : isPast
                      ? 'text-slate-600 text-sm'
                      : 'glass-btn text-slate-300 text-sm'
                  }`}
                  style={{ minWidth: 44 }}
                >
                  {chord}
                </div>
                {isCurrent && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Progress bar */}
      {playing && (
        <div className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${((index + 1) / song.chords.length) * 100}%` }}
          />
        </div>
      )}

      {/* Start button */}
      {!playing && countdown === null && (
        <button
          onClick={start}
          className="glass-btn w-full mt-3 text-emerald-400 font-bold"
          style={{ padding: '0.5rem' }}
        >
          ▶ Start
        </button>
      )}
    </div>
  )
}
