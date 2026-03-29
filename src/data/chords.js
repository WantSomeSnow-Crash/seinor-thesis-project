// String indices: 0 = low E, 1 = A, 2 = D, 3 = G, 4 = B, 5 = high e
// Fret 0 = open string (no dot drawn); null fret = muted (not played)

export const CHORDS = {
  Em: {
    label: 'E minor',
    fingers: [
      { string: 0, fret: 0 },
      { string: 1, fret: 2 },
      { string: 2, fret: 2 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
    notes: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
    // Per-string notes indexed 0-5; null = muted string
    stringNotes: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
  },
  G: {
    label: 'G Major',
    fingers: [
      { string: 0, fret: 3 },
      { string: 1, fret: 2 },
      { string: 2, fret: 0 },
      { string: 3, fret: 0 },
      { string: 4, fret: 3 },
      { string: 5, fret: 3 },
    ],
    notes: ['G2', 'B2', 'D3', 'G3', 'B3', 'G4'],
    stringNotes: ['G2', 'B2', 'D3', 'G3', 'D4', 'G4'],
  },
  C: {
    label: 'C Major',
    fingers: [
      { string: 1, fret: 3 },
      { string: 2, fret: 2 },
      { string: 3, fret: 0 },
      { string: 4, fret: 1 },
      { string: 5, fret: 0 },
    ],
    notes: ['C3', 'E3', 'G3', 'C4', 'E4'],
    stringNotes: [null, 'C3', 'E3', 'G3', 'C4', 'E4'],
  },
  D: {
    label: 'D Major',
    fingers: [
      { string: 2, fret: 0 },
      { string: 3, fret: 2 },
      { string: 4, fret: 3 },
      { string: 5, fret: 2 },
    ],
    notes: ['D3', 'A3', 'D4', 'F#4'],
    stringNotes: [null, null, 'D3', 'A3', 'D4', 'F#4'],
  },
  Am: {
    label: 'A minor',
    fingers: [
      { string: 0, fret: 0 },
      { string: 1, fret: 0 },
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 1 },
      { string: 5, fret: 0 },
    ],
    notes: ['E2', 'A2', 'E3', 'A3', 'C4', 'E4'],
    stringNotes: ['E2', 'A2', 'E3', 'A3', 'C4', 'E4'],
  },
}

// ── Fretboard dot positions — in GLB model local space ───────────────────────
// If dots appear too high/low on the neck, adjust FRET_Y.
// If they're shifted left/right off the strings, adjust STRING_CENTER_X.
export const FRET_Y = {
  1: 2.1,
  2: 1.8,
  3: 1.5,
}

// X positions for each string on the fretboard.
const STRING_CENTER_X = 0.01
const STRING_SPACING  = 0.032
export const STRING_X = Array.from({ length: 6 }, (_, i) =>
  STRING_CENTER_X + (i - 2.5) * STRING_SPACING
)
