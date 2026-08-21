import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const vercelEnv = process.env.VERCEL_ENV
const vercelTargetEnv = process.env.VERCEL_TARGET_ENV
const gitRef = process.env.VERCEL_GIT_COMMIT_REF

// Some Vercel projects do not expose VERCEL_ENV to the build process.
// Prefer Vercel's explicit environment markers, then fall back to the
// repository's production branch. PR/feature branches remain read-only.
const isProductionBuild =
  vercelEnv === 'production' ||
  vercelTargetEnv === 'production' ||
  gitRef === 'main'

console.log(
  `Migration gate: VERCEL_ENV=${vercelEnv ?? '<unset>'}, VERCEL_TARGET_ENV=${vercelTargetEnv ?? '<unset>'}, VERCEL_GIT_COMMIT_REF=${gitRef ?? '<unset>'}`,
)

if (!isProductionBuild) {
  console.log('Skipping Prisma migrate deploy outside production/main builds.')
  process.exit(0)
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required for production migration.')
  process.exit(1)
}

const prismaBin = resolve(
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
)

console.log('Applying pending Prisma migrations before production build...')
const result = spawnSync(prismaBin, ['migrate', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
})

if (result.error) {
  console.error(`Failed to start Prisma migrate deploy: ${result.error.message}`)
  process.exit(1)
}

if (result.status !== 0) {
  console.error(`Prisma migrate deploy exited with status ${result.status}.`)
  process.exit(result.status ?? 1)
}

console.log('Production Prisma migrations are up to date.')
