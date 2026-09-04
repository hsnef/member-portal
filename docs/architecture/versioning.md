# Application Versioning System

This application uses an automatic versioning system based on git commits. The version number is automatically generated during build time.

## How It Works

1. **Major Version**: Manually set in `scripts/generate-version.ts` (constant `MAJOR_VERSION`)
2. **Minor Version**: Automatically calculated as `commitCount / 1000` (increments every 1000 commits)
3. **Patch Version**: Automatically calculated as `commitCount % 1000` (remainder of commit count)

## Version Format

The version follows semantic versioning: `MAJOR.MINOR.PATCH`

Example:
- 8 commits total → Version: `1.0.8`
- 1000 commits total → Version: `1.1.0`
- 1005 commits total → Version: `1.1.5`
- 2000 commits total → Version: `1.2.0`

## How to Update Major Version

1. Open `scripts/generate-version.ts`
2. Find the `MAJOR_VERSION` constant at the top
3. Update it to the new major version number (e.g., change `1` to `2`)
4. Commit and push the change

## Automatic Generation

The version is automatically generated when you run:
- `npm run dev` - Development mode
- `npm run build` - Production build
- `npm run generate-version` - Manual generation

The script:
- Reads git commit count
- Gets latest commit hash
- Gets latest commit date
- Generates version number
- Creates `lib/constants/version.generated.ts` with version info

## Generated File

> **`lib/constants/version.generated.ts` is gitignored and is NOT committed**
> (changed 2026-09-03). It is a build stamp, so a tracked copy meant every local
> build dirtied the working tree. It is created by `npm install` (via `prepare`),
> and rewritten by `npm run dev`, `npm run build` and `npm run generate-version`.
>
> `lib/constants/version.ts` imports it, so it must exist before `npx tsc --noEmit`
> will pass. On a fresh clone `npm install` handles that; if you ever see
> `TS2307: Cannot find module './version.generated'`, run `npm run generate-version`.

The generated file (`lib/constants/version.generated.ts`) contains:
- `APP_VERSION` - Full version string (e.g., "1.0.8")
- `MAJOR_VERSION` - Major version number
- `MINOR_VERSION` - Minor version number
- `PATCH_VERSION` - Patch version number
- `COMMIT_COUNT` - Total number of commits
- `COMMIT_HASH` - Latest commit hash (short)
- `COMMIT_DATE` - Latest commit date
- `BUILD_DATE` - Build date (YYYY-MM-DD)
- `BUILD_TIME` - Full build timestamp
- `BRANCH` - Current git branch

## Display in Application

The version is displayed in the footer of every page showing:
- **Version**: v1.0.8 (from `getVersionString()`)
- **Deployed**: January 8, 2026 (from `getDeploymentDateString()`)

## Fallback Behavior

If git is not available (e.g., in CI/CD or when git is not installed):
- Version defaults to: `MAJOR_VERSION.0.0`
- Build date defaults to: Current date
- Commit hash defaults to: "unknown"

## Troubleshooting

### Version not updating
1. Make sure you're in a git repository
2. Ensure you have commits in the repository
3. Run `npm run generate-version` manually to test
4. Check that `lib/constants/version.generated.ts` was created/updated

### TypeScript errors
1. Make sure `tsx` is installed: `npm install tsx --save-dev`
2. Run `npm run generate-version` to create the initial file
3. Check that the generated file exists in `lib/constants/` — it is gitignored,
   so a fresh clone will not have it until `npm install` or that command runs

### Version shows as 1.0.0
- This is the fallback version when git is not available
- Check that you're in a git repository
- Verify git commands work: `git rev-list --count HEAD`
