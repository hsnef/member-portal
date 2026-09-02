/**
 * Email palette.
 *
 * Email clients strip <style> blocks and ignore CSS variables, so the design
 * system's tokens cannot be used directly here — every value has to be a
 * literal hex, inlined on the element. This file is the single place those
 * literals live, so the emails stay in step with app/globals.css instead of
 * drifting into their own colour scheme.
 *
 * KEEP IN SYNC with the `:root` tokens in app/globals.css. If a token changes
 * there, change it here too — nothing enforces this automatically.
 */
export const EMAIL = {
  /** Page background behind the card. */
  canvas: '#fffbf4',
  /** The card itself. */
  surface: '#ffffff',
  /** Sunk panels inside the card. */
  surfaceSunk: '#faf5ec',
  /** Hairlines and table borders. */
  line: '#f1e6d5',

  /** Body text. */
  ink: '#2b2018',
  /** Secondary text. */
  ink2: '#6a5b4b',
  /** Muted text, captions, footers. */
  ink3: '#9b8c7a',
  /** Text on a dark ground. */
  inkInverse: '#fffbf4',

  /** The header band. Deep, not orange — white text on saffron fails AA. */
  kumkum: '#7b2d26',
  /** Buttons, links, accents. */
  saffron: '#c75b12',
  /** Tint behind an accented panel. */
  saffronSoft: '#fdefe2',
  /** Highlight, used sparingly on a dark ground. */
  marigold: '#f5a524',

  /** Success. */
  success: '#4e7a63',
  successSoft: '#eaf2ec',
  /** Warning. */
  warning: '#a06c05',
  warningSoft: '#fef4de',
  /** Danger. */
  danger: '#b23a2e',
  dangerSoft: '#fbebe8',
  /** Neutral panel, replaces the blue "info" boxes. */
  neutral: '#6a5b4b',
  neutralSoft: '#f4ede3',
} as const

/**
 * The font stack for emails. Instrument Sans is a webfont and will not load in
 * most clients, so this is a system stack that reads similarly.
 */
export const EMAIL_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
