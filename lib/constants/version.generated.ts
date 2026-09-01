/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file is generated automatically during build
 * Update MAJOR_VERSION in scripts/generate-version.ts to change major version
 */

export const APP_VERSION = '1.0.36'
export const MAJOR_VERSION = 1
export const MINOR_VERSION = 0
export const PATCH_VERSION = 36
export const COMMIT_COUNT = '36'
export const COMMIT_HASH = 'ef8e981'
export const COMMIT_DATE = '2026-08-31'
export const BUILD_DATE = '2026-09-01'
export const BUILD_TIME = '2026-09-01T01:30:49.937Z'
export const BRANCH = 'redesign/design-system'

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
