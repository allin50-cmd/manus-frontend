import { spawnSync } from 'node:child_process'

const inheritedNodeEnv = process.env.NODE_ENV

if (inheritedNodeEnv && inheritedNodeEnv !== 'production') {
  console.warn(
    `[build] Overriding inherited NODE_ENV=${JSON.stringify(inheritedNodeEnv)} with NODE_ENV="production" for Next.js production build.`,
  )
}

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const result = spawnSync(npxCommand, ['--no-install', 'next', 'build'], {
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: 'inherit',
})

if (result.error) {
  console.error('[build] Unable to start the Next.js production build.', result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
