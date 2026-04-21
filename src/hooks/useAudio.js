import { useRef, useCallback } from 'react'

// All unique note samples used across every chord
const NOTE_FILES = [
  'E2','A2','B2','C3','D3','E3','G2','G3','Gs3',
  'A3','B3','C4','D4','E4','Fs4','G4',
]

// Strum samples: one up + one down per chord
const CHORD_NAMES = ['Em', 'E', 'G', 'C', 'D', 'Am']
const DIRECTIONS  = ['down', 'up']

// ── Amp Presets ───────────────────────────────────────────────────────────────
// Each preset shapes the audio signal chain:
//   distAmount  0–400  waveshaper drive (0 = clean)
//   lowGain     dB     bass shelf boost/cut
//   midGain     dB     mid peak boost/cut
//   highGain    dB     treble shelf boost/cut
//   midFreq     Hz     center frequency of mid EQ band
//   reverbMix   0–1    wet/dry reverb mix
//   outputGain  linear output level
//   irFile      string IR file in /ir/ folder, or null for no cab sim

export const AMP_PRESETS = {
  clean: {
    label: 'Fender Clean',
    emoji: '🎸',
    distAmount: 0,
    lowGain:    2,
    midGain:   -1,
    highGain:   4,
    midFreq:    800,
    reverbMix:  0.25,
    outputGain: 1.0,
    irFile:     null,
  },
  crunch: {
    label: 'Marshall Crunch',
    emoji: '🔥',
    distAmount: 120,
    lowGain:    3,
    midGain:    5,
    highGain:   3,
    midFreq:    1000,
    reverbMix:  0.15,
    outputGain: 0.85,
    irFile:     '/ir/marshall.wav',
  },
  heavy: {
    label: 'Mesa Heavy',
    emoji: '💀',
    distAmount: 280,
    lowGain:    6,
    midGain:   -4,
    highGain:   2,
    midFreq:    750,
    reverbMix:  0.10,
    outputGain: 0.75,
    irFile:     '/ir/mesa.wav',
  },
  warm: {
    label: 'Orange Warm',
    emoji: '🟠',
    distAmount: 60,
    lowGain:    5,
    midGain:    3,
    highGain:  -2,
    midFreq:    600,
    reverbMix:  0.30,
    outputGain: 0.90,
    irFile:     null,
  },
}

// Build a waveshaper distortion curve
function makeDistortionCurve(amount) {
  const n   = 256
  const curve = new Float32Array(n)
  const k = amount
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = k > 0
      ? ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x))
      : x
  }
  return curve
}

// Build a simple stereo reverb using two delay nodes
function buildReverb(ctx) {
  const merger  = ctx.createChannelMerger(2)
  const delay1  = ctx.createDelay(1.0)
  const delay2  = ctx.createDelay(1.0)
  const fb1     = ctx.createGain()
  const fb2     = ctx.createGain()
  const wet     = ctx.createGain()

  delay1.delayTime.value = 0.029
  delay2.delayTime.value = 0.037
  fb1.gain.value         = 0.45
  fb2.gain.value         = 0.40

  // Feedback loops
  delay1.connect(fb1)
  fb1.connect(delay1)
  delay2.connect(fb2)
  fb2.connect(delay2)

  delay1.connect(merger, 0, 0)
  delay2.connect(merger, 0, 1)
  merger.connect(wet)

  return { input: delay1, input2: delay2, output: wet }
}

// Build the full amp signal chain for a preset
// Returns { input, output } nodes to connect source → input and output → destination
function buildAmpChain(ctx, preset, irBuffer) {
  // Distortion
  const waveshaper = ctx.createWaveShaper()
  waveshaper.curve   = makeDistortionCurve(preset.distAmount)
  waveshaper.oversample = '4x'

  // 3-band EQ
  const bass = ctx.createBiquadFilter()
  bass.type      = 'lowshelf'
  bass.frequency.value = 250
  bass.gain.value      = preset.lowGain

  const mid = ctx.createBiquadFilter()
  mid.type      = 'peaking'
  mid.frequency.value = preset.midFreq
  mid.Q.value         = 1.2
  mid.gain.value      = preset.midGain

  const treble = ctx.createBiquadFilter()
  treble.type      = 'highshelf'
  treble.frequency.value = 3500
  treble.gain.value      = preset.highGain

  // Output gain
  const outGain = ctx.createGain()
  outGain.gain.value = preset.outputGain

  // Reverb (wet/dry mix)
  const dryGain = ctx.createGain()
  const wetGain = ctx.createGain()
  dryGain.gain.value = 1 - preset.reverbMix
  wetGain.gain.value = preset.reverbMix
  const reverb  = buildReverb(ctx)
  const mixBus  = ctx.createGain()

  // Cabinet IR (optional)
  let cabNode = null
  if (irBuffer) {
    cabNode = ctx.createConvolver()
    cabNode.buffer = irBuffer
  }

  // Wire the chain: waveshaper → bass → mid → treble → [cab] → dry+wet → outGain
  const eqChain = [waveshaper, bass, mid, treble]
  if (cabNode) eqChain.push(cabNode)

  for (let i = 0; i < eqChain.length - 1; i++) {
    eqChain[i].connect(eqChain[i + 1])
  }

  const lastEq = eqChain[eqChain.length - 1]
  lastEq.connect(dryGain)
  lastEq.connect(reverb.input)
  lastEq.connect(reverb.input2)

  dryGain.connect(mixBus)
  reverb.output.connect(wetGain)
  wetGain.connect(mixBus)
  mixBus.connect(outGain)

  return { input: waveshaper, output: outGain }
}

export default function useAudio() {
  const ctxRef          = useRef(null)
  const buffersRef      = useRef({})
  const strumBuffersRef = useRef({})
  const irBuffersRef    = useRef({})
  const loadedRef       = useRef(false)
  const ampPresetRef    = useRef('clean')

  const initAudio = useCallback(async () => {
    if (loadedRef.current) return

    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') await ctx.resume()

    // Load note samples, strum samples, and IR files in parallel
    await Promise.all([
      ...NOTE_FILES.map(async (note) => {
        try {
          const res = await fetch(`/sounds/${note}.mp3`)
          const buf = await res.arrayBuffer()
          buffersRef.current[note] = await ctx.decodeAudioData(buf)
        } catch (e) {
          console.warn(`Could not load sample: ${note}.mp3`, e)
        }
      }),
      ...CHORD_NAMES.flatMap(chord =>
        DIRECTIONS.map(async (dir) => {
          const key = `${chord}_${dir}`
          try {
            const res = await fetch(`/sounds/strums/${key}.mp3`)
            const buf = await res.arrayBuffer()
            strumBuffersRef.current[key] = await ctx.decodeAudioData(buf)
          } catch (e) {
            console.warn(`Could not load strum: ${key}.mp3`, e)
          }
        })
      ),
      // Load IR files for presets that have them
      ...Object.values(AMP_PRESETS)
        .filter(p => p.irFile)
        .map(async (preset) => {
          try {
            const res = await fetch(preset.irFile)
            const buf = await res.arrayBuffer()
            irBuffersRef.current[preset.irFile] = await ctx.decodeAudioData(buf)
          } catch (e) {
            console.warn(`Could not load IR: ${preset.irFile}`, e)
          }
        }),
    ])

    loadedRef.current = true
  }, [])

  const setAmp = useCallback((presetKey) => {
    ampPresetRef.current = presetKey
  }, [])

  // Route a buffer source through the current amp chain
  const playWithAmp = useCallback((buf) => {
    const ctx    = ctxRef.current
    if (!ctx || !buf) return

    const preset   = AMP_PRESETS[ampPresetRef.current] ?? AMP_PRESETS.clean
    const irBuffer = preset.irFile ? irBuffersRef.current[preset.irFile] : null
    const chain    = buildAmpChain(ctx, preset, irBuffer)

    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(chain.input)
    chain.output.connect(ctx.destination)
    src.start()
  }, [])

  const playString = useCallback(async (stringIndex, note) => {
    if (!note) return
    await initAudio()
    playWithAmp(buffersRef.current[note])
  }, [initAudio, playWithAmp])

  const playStrum = useCallback(async (chord, direction) => {
    await initAudio()
    playWithAmp(strumBuffersRef.current[`${chord}_${direction}`])
  }, [initAudio, playWithAmp])

  const playChord = useCallback(async (notes) => {
    if (!notes?.length) return
    await initAudio()
    notes.forEach((note, i) => {
      setTimeout(() => playString(i, note), i * 45)
    })
  }, [initAudio, playString])

  return { playChord, playString, playStrum, initAudio, setAmp }
}
