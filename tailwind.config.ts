import type { Config } from "tailwindcss";

/**
 * Design system colours resolve to CSS variables so runtime theming keeps
 * working. But Tailwind 3 cannot apply an opacity modifier to a bare var():
 * `bg-kumkum/65` would silently emit nothing, because it needs the colour
 * broken into channels to compose an alpha.
 *
 * Returning a function lets us build the translucent value with color-mix(),
 * which takes the variable as-is. So `bg-kumkum` and `bg-kumkum/65` both work,
 * and both still follow the active theme.
 *
 * color-mix() is supported in Chrome 111+, Safari 16.2+, Firefox 113+.
 */
const token =
  (name: string) =>
  ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined || opacityValue === ""
      ? `var(--${name})`
      : `color-mix(in srgb, var(--${name}) calc(${opacityValue} * 100%), transparent)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Legacy (kept for backward compatibility) ----
        background: token("background"),
        foreground: token("foreground"),

        // ---- HSNEF design system tokens ----
        // Every one resolves to a CSS variable, so runtime theming still works.
        canvas: token("canvas"),
        "canvas-deep": token("canvas-deep"),
        surface: token("surface"),
        "surface-sunk": token("surface-sunk"),
        line: token("line"),
        "line-strong": token("line-strong"),
        ink: token("ink"),
        "ink-2": token("ink-2"),
        "ink-3": token("ink-3"),
        "ink-inverse": token("ink-inverse"),
        saffron: token("saffron"),
        "saffron-hover": token("saffron-hover"),
        "saffron-soft": token("saffron-soft"),
        "saffron-ring": token("saffron-ring"),
        marigold: token("marigold"),
        "marigold-ink": token("marigold-ink"),
        "marigold-soft": token("marigold-soft"),
        kumkum: token("kumkum"),
        "kumkum-ink": token("kumkum-ink"),
        "kumkum-soft": token("kumkum-soft"),
        tulsi: token("tulsi"),
        "tulsi-ink": token("tulsi-ink"),
        "tulsi-soft": token("tulsi-soft"),
        lotus: token("lotus"),
        "lotus-ink": token("lotus-ink"),
        "lotus-soft": token("lotus-soft"),
        copper: token("copper"),
        "copper-ink": token("copper-ink"),
        "copper-soft": token("copper-soft"),
        sandal: token("sandal"),
        "sandal-ink": token("sandal-ink"),
        "sandal-soft": token("sandal-soft"),
        gold: token("gold"),
        success: token("success"),
        "success-soft": token("success-soft"),
        warning: token("warning"),
        "warning-soft": token("warning-soft"),
        danger: token("danger"),
        "danger-soft": token("danger-soft"),
        neutral: token("neutral"),
        "neutral-soft": token("neutral-soft"),

        // ---- Runtime theming contract ----
        "theme-bg": {
          primary: token("theme-bg-primary"),
          secondary: token("theme-bg-secondary"),
        },
        "theme-text": {
          primary: token("theme-text-primary"),
          secondary: token("theme-text-secondary"),
        },
        "theme-accent": {
          primary: token("theme-accent-primary"),
          secondary: token("theme-accent-secondary"),
        },
        "theme-border": token("theme-border"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        "theme-header": "var(--theme-font-header)",
        "theme-body": "var(--theme-font-body)",
      },
      borderRadius: {
        xl: "13px",
        "2xl": "18px",
        "3xl": "26px",
        "4xl": "34px",
        "theme-card": "var(--theme-border-radius-card)",
        "theme-button": "var(--theme-border-radius-button)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        glow: "var(--shadow-glow)",
        "theme-card": "var(--theme-shadow-card)",
      },
      spacing: {
        "theme-card": "var(--theme-spacing-card)",
        "theme-section": "var(--theme-spacing-section)",
      },
      maxWidth: {
        // The kit's config had its content globs pasted in here by mistake.
        // This is the intended value: the shell's main content column.
        content: "1200px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
        "flame-flicker": {
          "0%, 100%": { opacity: "1", transform: "scaleY(1)" },
          "50%": { opacity: "0.82", transform: "scaleY(1.08)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s linear infinite",
        flame: "flame-flicker 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
