import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

if (process.env.VERCEL_ENV !== 'production') {
  console.log('Skipping Prisma migrate deploy outside Vercel production.')
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
