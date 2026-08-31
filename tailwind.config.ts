import type { Config } from "tailwindcss";

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
        background: "var(--background)",
        foreground: "var(--foreground)",

        // ---- HSNEF design system tokens ----
        // Every one resolves to a CSS variable, so runtime theming still works.
        canvas: "var(--canvas)",
        "canvas-deep": "var(--canvas-deep)",
        surface: "var(--surface)",
        "surface-sunk": "var(--surface-sunk)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        "ink-inverse": "var(--ink-inverse)",
        saffron: "var(--saffron)",
        "saffron-hover": "var(--saffron-hover)",
        "saffron-soft": "var(--saffron-soft)",
        "saffron-ring": "var(--saffron-ring)",
        marigold: "var(--marigold)",
        "marigold-ink": "var(--marigold-ink)",
        "marigold-soft": "var(--marigold-soft)",
        kumkum: "var(--kumkum)",
        "kumkum-ink": "var(--kumkum-ink)",
        "kumkum-soft": "var(--kumkum-soft)",
        tulsi: "var(--tulsi)",
        "tulsi-ink": "var(--tulsi-ink)",
        "tulsi-soft": "var(--tulsi-soft)",
        lotus: "var(--lotus)",
        "lotus-ink": "var(--lotus-ink)",
        "lotus-soft": "var(--lotus-soft)",
        copper: "var(--copper)",
        "copper-ink": "var(--copper-ink)",
        "copper-soft": "var(--copper-soft)",
        sandal: "var(--sandal)",
        "sandal-ink": "var(--sandal-ink)",
        "sandal-soft": "var(--sandal-soft)",
        gold: "var(--gold)",
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
        warning: "var(--warning)",
        "warning-soft": "var(--warning-soft)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        neutral: "var(--neutral)",
        "neutral-soft": "var(--neutral-soft)",

        // ---- Runtime theming contract ----
        "theme-bg": {
          primary: "var(--theme-bg-primary)",
          secondary: "var(--theme-bg-secondary)",
        },
        "theme-text": {
          primary: "var(--theme-text-primary)",
          secondary: "var(--theme-text-secondary)",
        },
        "theme-accent": {
          primary: "var(--theme-accent-primary)",
          secondary: "var(--theme-accent-secondary)",
        },
        "theme-border": "var(--theme-border)",
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
