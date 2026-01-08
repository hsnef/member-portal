/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file is generated automatically during build
 * Update MAJOR_VERSION in scripts/generate-version.ts to change major version
 */

export const APP_VERSION = '1.0.8'
export const MAJOR_VERSION = 1
export const MINOR_VERSION = 0
export const PATCH_VERSION = 8
export const COMMIT_COUNT = '8'
export const COMMIT_HASH = '703e638'
export const COMMIT_DATE = '2026-01-08'
export const BUILD_DATE = '2026-01-08'
export const BUILD_TIME = '2026-01-08T19:22:40.217Z'
export const BRANCH = 'main'

/**
 * Get formatted version string
 */
export function getVersionString(): string {
  return `v${APP_VERSION}`
}

/**
 * Get formatted deployment date string
 */
export function getDeploymentDateString(): string {
  const date = new Date(BUILD_DATE)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get full version info string (includes commit hash)
 */
export function getFullVersionString(): string {
  return `v${APP_VERSION} (${COMMIT_HASH})`
}
