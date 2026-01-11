/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file is generated automatically during build
 * Update MAJOR_VERSION in scripts/generate-version.ts to change major version
 */

export const APP_VERSION = '1.0.32'
export const MAJOR_VERSION = 1
export const MINOR_VERSION = 0
export const PATCH_VERSION = 32
export const COMMIT_COUNT = '32'
export const COMMIT_HASH = '3739d02'
export const COMMIT_DATE = '2026-01-11'
export const BUILD_DATE = '2026-01-11'
export const BUILD_TIME = '2026-01-11T13:16:26.229Z'
export const BRANCH = 'feature/theme-system'

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
