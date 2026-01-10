/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file is generated automatically during build
 * Update MAJOR_VERSION in scripts/generate-version.ts to change major version
 */

export const APP_VERSION = '1.0.25'
export const MAJOR_VERSION = 1
export const MINOR_VERSION = 0
export const PATCH_VERSION = 25
export const COMMIT_COUNT = '25'
export const COMMIT_HASH = '2537f54'
export const COMMIT_DATE = '2026-01-10'
export const BUILD_DATE = '2026-01-10'
export const BUILD_TIME = '2026-01-10T22:02:48.227Z'
export const BRANCH = 'dev'

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
