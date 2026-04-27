// Single source of truth for strum detection geometry.
// useStrum.js and StrumZoneDebug.jsx both import from here.

export const MODEL_NORM_SCALE = 2.5   // single source of truth — change here to scale the guitar
export const NUM_STRINGS      = 6
export const STRING_SPACING   = 0.032
export const FIRST_STRING_X   = (0 - 2.5) * STRING_SPACING  // = -0.08

// Shift the strum zone in SCREEN PIXELS (these are easy to understand):
//   STRUM_OFFSET_X  positive = right,  negative = left
//   STRUM_OFFSET_Y  positive = up,     negative = down
export const STRUM_OFFSET_X   = -330
export const STRUM_OFFSET_Y   = 260

// Per-model overrides — set to null to fall back to the defaults above
export const MODEL_STRUM_OFFSET = {
  electric: { x: STRUM_OFFSET_X, y: STRUM_OFFSET_Y },
  acoustic:  { x: STRUM_OFFSET_X, y: STRUM_OFFSET_Y - 100 },
}

// Y range of the strum zone in guitar local space (body / soundhole area)
export const STRUM_Y_MIN      = -0.20
export const STRUM_Y_MAX      =  0.001

// Minimum ms before the same string can fire again
export const STRING_COOLDOWN  = 50
