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
    // dots: per-chord x/y positions in outer-group local space.
    // Tune these individually so each chord looks right on your guitar model.
    dots: [
      { x: -0.025, y: 1.85 },  // A string, fret 2
      { x:  0.008, y: 1.85 },  // D string, fret 2
    ],
    acousticDots: [
      { x: -0.05, y: 1.55 },  // A string, fret 2
      { x:  0.0, y: 1.55 },  // D string, fret 2
    ],
    notes: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
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
    dots: [
      { x:  0.065, y: 1.65 },  // low E string, fret 3
      { x:  0.020, y: 1.75 },  // A string, fret 2
      { x: -0.020, y: 1.65 },  // B string, fret 3
      { x: -0.045, y: 1.65 },  // high e string, fret 3
    ],
    acousticDots: [
      { x:  0.065, y: 1.65 },  // low E string, fret 3
      { x:  0.020, y: 1.75 },  // A string, fret 2
      { x: -0.020, y: 1.65 },  // B string, fret 3
      { x: -0.045, y: 1.65 },  // high e string, fret 3
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
    dots: [
      { x: -0.038, y: 1.90 },  // A string, fret 3
      { x: -0.006, y: 1.80 },  // D string, fret 2
      { x:  0.058, y: 1.60 },  // B string, fret 1
    ],
    acousticDots: [
      { x: -0.038, y: 1.90 },  // A string, fret 3
      { x: -0.006, y: 1.80 },  // D string, fret 2
      { x:  0.058, y: 1.60 },  // B string, fret 1
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
    dots: [
      { x:  -.030, y: 1.85 },  // G string, fret 2
      { x:  0.010, y: 1.85 },  // B string, fret 3
      { x:  0.00, y: 1.70 },   // high e string, fret 2
    ],
    acousticDots: [
      { x:  -.030, y: 1.85 },  // G string, fret 2
      { x:  0.010, y: 1.85 },  // B string, fret 3
      { x:  0.00, y: 1.70 },   // high e string, fret 2
    ],
    notes: ['D3', 'A3', 'D4', 'F#4'],
    stringNotes: [null, null, 'D3', 'A3', 'D4', 'F#4'],
  },
  E: {
    label: 'E Major',
    fingers: [
      { string: 0, fret: 0 },
      { string: 1, fret: 2 },
      { string: 2, fret: 2 },
      { string: 3, fret: 1 },
      { string: 4, fret: 0 },
      { string: 5, fret: 0 },
    ],
    dots: [
      { x: -0.038, y: 1.85 },  // A string, fret 2
      { x: -0.006, y: 1.85 },  // D string, fret 2
      { x:  -0.001, y: 2.00 }, // G string, fret 1
    ],
    acousticDots: [
      { x: -0.038, y: 1.85 },  // A string, fret 2
      { x: -0.006, y: 1.85 },  // D string, fret 2
      { x:  -0.001, y: 2.00 }, // G string, fret 1
    ],
    notes: ['E2', 'B2', 'E3', 'Gs3', 'B3', 'E4'],
    stringNotes: ['E2', 'B2', 'E3', 'Gs3', 'B3', 'E4'],
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
    dots: [
      { x: -0.006, y: 1.80 },  // D string, fret 2
      { x:  0.026, y: 1.80 },  // G string, fret 2
      { x:  0.020, y: 1.95 },  // B string, fret 1
    ],
    acousticDots: [
      { x: -0.006, y: 1.80 },  // D string, fret 2
      { x:  0.026, y: 1.80 },  // G string, fret 2
      { x:  0.020, y: 1.95 },  // B string, fret 1
    ],
    notes: ['E2', 'A2', 'E3', 'A3', 'C4', 'E4'],
    stringNotes: ['E2', 'A2', 'E3', 'A3', 'C4', 'E4'],
  },
}

// ── Fretboard dot positions — in guitar outer-group local space ───────────────
// FRET_Y  — move a row of dots up/down along the neck.
//   Higher value = closer to headstock (up the neck).
export const FRET_Y = {
  1: 1.85,
  2: 1.80,
  3: 1.75,
}

// DOT_SCREEN_OFFSET — moves ALL dots in pure screen pixels.
//   DOT_SCREEN_OFFSET_X: positive = right, negative = left
//   DOT_SCREEN_OFFSET_Y: positive = up,    negative = down
export const DOT_SCREEN_OFFSET_X = -140
export const DOT_SCREEN_OFFSET_Y = 60

const STRING_OFFSET_X = 0.0
// STRING_X — one entry per string (0 = low E … 5 = high e).
// Tune each value to adjust individual string spacing.
// These are relative to STRING_OFFSET_X, so you rarely need to change them.
export const STRING_X = [
  STRING_OFFSET_X + (-0.07),   // string 0: low E
  STRING_OFFSET_X + (-0.038),  // string 1: A
  STRING_OFFSET_X + (-0.006),  // string 2: D
  STRING_OFFSET_X + ( 0.026),  // string 3: G
  STRING_OFFSET_X + ( 0.058),  // string 4: B
  STRING_OFFSET_X + ( 0.090),  // string 5: high e
]
