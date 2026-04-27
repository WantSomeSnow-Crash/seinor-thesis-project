import { useState } from 'react'
import HandCursor from './HandCursor'

const SLIDES = {
  rock: [
    {
      emoji: '📷',
      title: 'Camera Setup',
      body: 'Stand back so your upper body is visible from the waist up. Good lighting helps the camera track your hands more accurately.',
      tip: 'Tip: a plain wall behind you works best',
    },
    {
      emoji: '🎸',
      title: 'Strumming',
      body: 'Swing your strumming hand up or down through the string zone on the guitar. Both up and down strokes play the chord — just like a real guitar.',
      tip: 'Tip: a smooth, confident sweep works better than a fast flick',
    },
    {
      emoji: '🤘',
      title: 'Auto Chord Detection',
      body: 'Hold a chord shape with your fretting hand and we\'ll detect it automatically. Keep the shape still for a moment so the camera can read it.',
      tip: 'Tip: you can also tap any chord name at the top to switch manually',
    },
    {
      emoji: '⚙️',
      title: 'Settings & Amps',
      body: 'Hit the gear icon to change your amp sound — from clean Fender to heavy Mesa. You can also toggle left-handed mode and chord auto-detection.',
      tip: 'Tip: try Marshall Crunch for a classic rock tone',
    },
  ],
  learn: [
    {
      emoji: '📷',
      title: 'Camera Setup',
      body: 'Stand back so your upper body is visible from the waist up. Good lighting helps the camera track your hands more accurately.',
      tip: 'Tip: a plain wall behind you works best',
    },
    {
      emoji: '🎯',
      title: 'Finger Position Dots',
      body: 'Green dots appear on the guitar fretboard showing exactly where to place each finger for the selected chord.',
      tip: 'Tip: match your fingers to the dots before you strum',
    },
    {
      emoji: '🎸',
      title: 'Playing Strings',
      body: 'Swing your strumming hand through the strings. Each string plays a different note — strum all of them for the full chord sound.',
      tip: 'Tip: try plucking individual strings to hear each note',
    },
    {
      emoji: '🎵',
      title: 'Choosing Chords',
      body: 'Tap any chord name along the top of the screen to switch. The finger dots update instantly to show you the new shape.',
      tip: 'Tip: start with Em — it only uses two fingers',
    },
  ],
}

export default function HowToUse({ mode, onDone, dwellCursor }) {
  const [idx, setIdx] = useState(0)
  const slides = SLIDES[mode] ?? SLIDES.rock
  const slide  = slides[idx]
  const isLast = idx === slides.length - 1

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black">

      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(124,58,237,0.16) 0%, transparent 60%), ' +
            'radial-gradient(ellipse at 70% 75%, rgba(16,185,129,0.10) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-xl w-full">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-white font-bold text-4xl tracking-tight">How It Works</h1>
          <p className="text-slate-400 text-base">Quick overview before you play</p>
        </div>

        {/* Slide card */}
        <div
          className="glass-panel rounded-3xl w-full flex flex-col items-center gap-5"
          style={{ padding: '2.5rem 2rem' }}
        >
          <span className="text-7xl">{slide.emoji}</span>
          <div className="flex flex-col gap-2">
            <h2 className="text-white font-bold text-2xl tracking-tight">{slide.title}</h2>
            <p className="text-slate-300 text-base leading-relaxed">{slide.body}</p>
          </div>
          <p className="text-emerald-400 text-sm">{slide.tip}</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-3 items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 24 : 8,
                height: 8,
                borderRadius: 999,
                background: i === idx ? '#34d399' : 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 w-full">
          {idx > 0 && (
            <button
              onClick={() => setIdx(i => i - 1)}
              className="glass-btn text-sm text-slate-400"
              style={{ padding: '0.75rem 1.5rem' }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => isLast ? onDone() : setIdx(i => i + 1)}
            className="glass-btn glass-btn-active text-base flex-1"
            style={{ padding: '0.85rem 1.5rem' }}
          >
            {isLast ? (mode === 'rock' ? "Let's Rock 🤘" : "Let's Learn 🎓") : 'Next →'}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={onDone}
            className="text-slate-600 text-sm hover:text-slate-400 transition-colors"
          >
            Skip tutorial
          </button>
        )}

      </div>

      <HandCursor cursor={dwellCursor} />
    </div>
  )
}
