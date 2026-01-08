/**
 * Application version information
 * This file re-exports from the auto-generated version file
 * To update major version, edit MAJOR_VERSION in scripts/generate-version.ts
 */

// Import generated version file (will be created during build)
import * as generatedVersion from './version.generated'

// Re-export for use in the app
export const APP_VERSION = generatedVersion.APP_VERSION
export const DEPLOYMENT_DATE = generatedVersion.BUILD_DATE

export function getVersionString(): string {
  return generatedVersion.getVersionString()
}

export function getDeploymentDateString(): string {
  return generatedVersion.getDeploymentDateString()
}

/**
 * Get full version string with commit hash (for debugging)
 */
export function getFullVersionString(): string {
  return generatedVersion.getFullVersionString()
}
