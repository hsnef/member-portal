import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Generate version information from git commits
 * Major version is set manually, minor/patch are auto-generated from git
 */

// Major version - update this manually when you want to increment major version
const MAJOR_VERSION = 1

try {
  // Get git commit count - try multiple methods for CI compatibility
  let commitCount = '0'

  // Method 1: Try git rev-list (works in full clones)
  try {
    commitCount = execSync('git rev-list --count HEAD 2>/dev/null', { encoding: 'utf-8' }).trim()
  } catch {
    // Method 2: Read from .commit-count file (for shallow clones like Vercel)
    const commitCountFile = join(process.cwd(), '.commit-count')
    if (existsSync(commitCountFile)) {
      commitCount = readFileSync(commitCountFile, 'utf-8').trim()
      console.log(`   Using .commit-count file: ${commitCount} commits`)
    }
  }

  // If git count returned a low number (shallow clone), prefer the file
  const commitCountFile = join(process.cwd(), '.commit-count')
  if (parseInt(commitCount) < 20 && existsSync(commitCountFile)) {
    const fileCount = readFileSync(commitCountFile, 'utf-8').trim()
    if (parseInt(fileCount) > parseInt(commitCount)) {
      commitCount = fileCount
      console.log(`   Shallow clone detected, using .commit-count: ${commitCount}`)
    }
  }

  // Get current branch name - prefer Vercel env vars for CI builds
  let branch = process.env.VERCEL_GIT_COMMIT_REF ||
               process.env.GITHUB_REF_NAME ||
               'main'

  // If no env var, try git command
  if (branch === 'main') {
    try {
      const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
      if (gitBranch && gitBranch !== 'HEAD') {
        branch = gitBranch
      }
    } catch {
      // Keep default
    }
  }

  // Get latest commit hash (short)
  let commitHash = ''
  try {
    commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    commitHash = 'unknown'
  }

  // Get latest commit date
  let commitDate = ''
  try {
    const dateString = execSync('git log -1 --format=%ci', { encoding: 'utf-8' }).trim()
    const date = new Date(dateString)
    commitDate = date.toISOString().split('T')[0] // Format: YYYY-MM-DD
  } catch {
    commitDate = new Date().toISOString().split('T')[0] // Fallback to today
  }

  // Calculate minor and patch versions from commit count
  // Minor = commitCount / 1000 (every 1000 commits)
  // Patch = commitCount % 1000 (remainder)
  const commitNum = parseInt(commitCount, 10) || 0
  const minorVersion = Math.floor(commitNum / 1000)
  const patchVersion = commitNum % 1000

  // Format version: MAJOR.MINOR.PATCH
  const version = `${MAJOR_VERSION}.${minorVersion}.${patchVersion}`

  // Build timestamp
  const buildDate = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
  const buildTime = new Date().toISOString()

  // Create version info object
  const versionInfo = {
    version,
    majorVersion: MAJOR_VERSION,
    minorVersion,
    patchVersion,
    commitCount: commitNum.toString(),
    commitHash,
    commitDate,
    buildDate,
    buildTime,
    branch,
  }

  // Ensure directory exists
  const outputDir = join(process.cwd(), 'lib', 'constants')
  mkdirSync(outputDir, { recursive: true })

  // Write generated version file as JSON (better for Next.js)
  const outputFile = join(outputDir, 'version.generated.json')
  const jsonContent = JSON.stringify(versionInfo, null, 2)
  writeFileSync(outputFile, jsonContent, 'utf-8')

  // Also write TypeScript file for type safety
  const tsOutputFile = join(outputDir, 'version.generated.ts')
  const tsFileContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file is generated automatically during build
 * Update MAJOR_VERSION in scripts/generate-version.ts to change major version
 */

export const APP_VERSION = '${version}'
export const MAJOR_VERSION = ${MAJOR_VERSION}
export const MINOR_VERSION = ${minorVersion}
export const PATCH_VERSION = ${patchVersion}
export const COMMIT_COUNT = '${commitNum}'
export const COMMIT_HASH = '${commitHash}'
export const COMMIT_DATE = '${commitDate}'
export const BUILD_DATE = '${buildDate}'
export const BUILD_TIME = '${buildTime}'
export const BRANCH = '${branch}'

/**
 * Get formatted version string
 */
export function getVersionString(): string {
  return \`v\${APP_VERSION}\`
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
  return \`v\${APP_VERSION} (\${COMMIT_HASH})\`
}
`

  writeFileSync(tsOutputFile, tsFileContent, 'utf-8')

  console.log('✅ Version info generated successfully:')
  console.log(`   Version: ${version}`)
  console.log(`   Commit: ${commitHash} (${commitNum} commits)`)
  console.log(`   Build Date: ${buildDate}`)
  console.log(`   Branch: ${branch}`)
} catch (error) {
  console.error('❌ Error generating version info:', error)
  // Fallback: create a version file with defaults
  const outputDir = join(process.cwd(), 'lib', 'constants')
  mkdirSync(outputDir, { recursive: true })
  
  const fallbackVersion = `${MAJOR_VERSION}.0.0`
  const fallbackDate = new Date().toISOString().split('T')[0]
  
  const fallbackVersionInfo = {
    version: fallbackVersion,
    majorVersion: MAJOR_VERSION,
    minorVersion: 0,
    patchVersion: 0,
    commitCount: '0',
    commitHash: 'unknown',
    commitDate: fallbackDate,
    buildDate: fallbackDate,
    buildTime: new Date().toISOString(),
    branch: 'unknown',
  }

  const fallbackTsContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Fallback version (git not available)
 */

export const APP_VERSION = '${fallbackVersion}'
export const MAJOR_VERSION = ${MAJOR_VERSION}
export const MINOR_VERSION = 0
export const PATCH_VERSION = 0
export const COMMIT_COUNT = '0'
export const COMMIT_HASH = 'unknown'
export const COMMIT_DATE = '${fallbackDate}'
export const BUILD_DATE = '${fallbackDate}'
export const BUILD_TIME = '${new Date().toISOString()}'
export const BRANCH = 'unknown'

export function getVersionString(): string {
  return \`v\${APP_VERSION}\`
}

export function getDeploymentDateString(): string {
  const date = new Date(BUILD_DATE)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getFullVersionString(): string {
  return \`v\${APP_VERSION} (\${COMMIT_HASH})\`
}
`
  
  writeFileSync(join(outputDir, 'version.generated.json'), JSON.stringify(fallbackVersionInfo, null, 2), 'utf-8')
  writeFileSync(join(outputDir, 'version.generated.ts'), fallbackTsContent, 'utf-8')
  console.log('⚠️  Using fallback version (git not available)')
  console.log(`   Version: ${fallbackVersion}`)
  console.log(`   Build Date: ${fallbackDate}`)
  // Exit with 0 to allow build to continue with fallback version
  process.exit(0)
}
