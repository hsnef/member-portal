import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        saffron: {
          DEFAULT: '#FF9933',
          50: '#FFF5ED',
          100: '#FFEAD5',
          200: '#FFD4AA',
          300: '#FFBE80',
          400: '#FFA855',
          500: '#FF9933',
          600: '#FF7A0E',
          700: '#E85C00',
          800: '#B34700',
          900: '#7E3200',
        },
        maroon: {
          DEFAULT: '#800000',
          50: '#FFE5E5',
          100: '#FFCCCC',
          200: '#FF9999',
          300: '#FF6666',
          400: '#FF3333',
          500: '#CC0000',
          600: '#990000',
          700: '#800000',
          800: '#660000',
          900: '#4D0000',
        },
      },
    },
  },
  plugins: [],
};

export default config;
