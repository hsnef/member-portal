/**
 * The HSNEF accent family. Every hue lives in the warm half of the wheel —
 * saffron, marigold, kumkum, tulsi, lotus, copper, sandal — so icons can carry
 * real colour and meaning without the palette turning gaudy.
 */
export type Tone =
'saffron' |
'marigold' |
'kumkum' |
'tulsi' |
'lotus' |
'copper' |
'sandal' |
'neutral';

interface ToneSet {
  /** Tinted fill + coloured glyph — the default icon treatment */
  tile: string;
  /** Solid fill, inverse glyph — for one hero moment per screen */
  solid: string;
  /** Text colour only */
  text: string;
  /** Soft background only */
  bg: string;
  /** Border colour */
  border: string;
  /** Raw CSS variable for inline use */
  varName: string;
}

export const tones: Record<Tone, ToneSet> = {
  saffron: {
    tile: 'bg-saffron-soft text-saffron ring-1 ring-inset ring-saffron/15',
    solid: 'bg-saffron text-white',
    text: 'text-saffron',
    bg: 'bg-saffron-soft',
    border: 'border-saffron/25',
    varName: '--saffron'
  },
  marigold: {
    tile: 'bg-marigold-soft text-marigold-ink ring-1 ring-inset ring-marigold/30',
    solid: 'bg-marigold text-ink',
    text: 'text-marigold-ink',
    bg: 'bg-marigold-soft',
    border: 'border-marigold/35',
    varName: '--marigold'
  },
  kumkum: {
    tile: 'bg-kumkum-soft text-kumkum ring-1 ring-inset ring-kumkum/15',
    solid: 'bg-kumkum text-white',
    text: 'text-kumkum',
    bg: 'bg-kumkum-soft',
    border: 'border-kumkum/20',
    varName: '--kumkum'
  },
  tulsi: {
    tile: 'bg-tulsi-soft text-tulsi-ink ring-1 ring-inset ring-tulsi/20',
    solid: 'bg-tulsi text-white',
    text: 'text-tulsi-ink',
    bg: 'bg-tulsi-soft',
    border: 'border-tulsi/25',
    varName: '--tulsi'
  },
  lotus: {
    tile: 'bg-lotus-soft text-lotus-ink ring-1 ring-inset ring-lotus/20',
    solid: 'bg-lotus text-white',
    text: 'text-lotus-ink',
    bg: 'bg-lotus-soft',
    border: 'border-lotus/25',
    varName: '--lotus'
  },
  copper: {
    tile: 'bg-copper-soft text-copper-ink ring-1 ring-inset ring-copper/20',
    solid: 'bg-copper text-white',
    text: 'text-copper-ink',
    bg: 'bg-copper-soft',
    border: 'border-copper/25',
    varName: '--copper'
  },
  sandal: {
    tile: 'bg-sandal-soft text-sandal-ink ring-1 ring-inset ring-sandal/20',
    solid: 'bg-sandal text-white',
    text: 'text-sandal-ink',
    bg: 'bg-sandal-soft',
    border: 'border-sandal/25',
    varName: '--sandal'
  },
  neutral: {
    tile: 'bg-neutral-soft text-neutral ring-1 ring-inset ring-ink/10',
    solid: 'bg-neutral text-white',
    text: 'text-neutral',
    bg: 'bg-neutral-soft',
    border: 'border-line-strong',
    varName: '--neutral'
  }
};