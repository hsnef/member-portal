import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)))

export default defineConfig({
  test: {
    // Node, not jsdom. Everything tested so far is a pure function; adding
    // component tests later means adding jsdom + @testing-library/react then,
    // rather than carrying them now for nothing.
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', 'design-kit/**'],
    // Sets the token secrets before any module reads them at import time.
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    // Mirrors tsconfig.json's "@/*": ["./*"].
    alias: { '@': root },
  },
})
