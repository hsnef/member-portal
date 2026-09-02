/**
 * PDF palette.
 *
 * jsPDF takes RGB triplets, not hex, so the design system's tokens are
 * restated here as [r, g, b]. This is the single place those live, so
 * receipts and invoices stay in step with app/globals.css.
 *
 * KEEP IN SYNC with the `:root` tokens in app/globals.css.
 */
export const PDF = {
  /** #7b2d26 — header bands and totals. White text on this passes AA at 9.35:1. */
  kumkum: [123, 45, 38] as [number, number, number],
  /** #c75b12 — accents and table headers. */
  saffron: [199, 91, 18] as [number, number, number],
  /** #2b2018 — body text. */
  ink: [43, 32, 24] as [number, number, number],
  /** #6a5b4b — secondary text. */
  ink2: [106, 91, 75] as [number, number, number],
  /** #9b8c7a — captions and footers. */
  ink3: [155, 140, 122] as [number, number, number],
  /** #fffbf4 — the warm page ground. */
  canvas: [255, 251, 244] as [number, number, number],
  /** #faf5ec — sunk panels and zebra striping. */
  surfaceSunk: [250, 245, 236] as [number, number, number],
  /** #f1e6d5 — hairlines. */
  line: [241, 230, 213] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],

  /** #4e7a63 — paid, confirmed. */
  success: [78, 122, 99] as [number, number, number],
  /** #a06c05 — sent, awaiting. */
  warning: [160, 108, 5] as [number, number, number],
  /** #b23a2e — overdue, cancelled. */
  danger: [178, 58, 46] as [number, number, number],
  /** #6a5b4b — draft and other neutral states. */
  neutral: [106, 91, 75] as [number, number, number],
} as const
