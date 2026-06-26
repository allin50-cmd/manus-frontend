import { execSync } from 'node:child_process'
import { existsSync, readdirSync, writeFileSync, appendFileSync } from 'node:fs'

function sh(cmd, fallback = '') {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return fallback
  }
}

const now = new Date().toISOString()
const branch = sh('git branch --show-current', 'unknown')
const commit = sh('git log -1 --oneline', 'unknown')
const tag = sh('git describe --tags --abbrev=0', 'none')
const status = sh('git status --short', '')
const migrations = existsSync('db/migrations')
  ? readdirSync('db/migrations').filter(f => f.endsWith('.sql')).length
  : 0
const appRoutes = existsSync('app')
  ? sh("find app -name 'page.tsx' -o -name 'route.ts' | wc -l", '0')
  : '0'

const currentState = `# Current State

Last updated: ${now}

## Git

Branch: ${branch}

Latest commit:
${commit}

Latest tag:
${tag}

Working tree:
${status ? 'Has uncommitted changes' : 'Clean'}

## Project Health

Known stable checkpoint:
v0.9.0-stable

Build status:
Run npm run build to verify.

TypeScript status:
Run npm run type-check to verify.

## Repository Facts

App pages/routes detected:
${appRoutes}

SQL migrations detected:
${migrations}

## Product Direction

This is a real working product.

Core rule:
One company workspace. Many enabled app modules. No app silos.

Current focus:
Build the company workspace experience and consolidate existing FineGuard/OS functionality into it.

FineGuard is the first real working app and should be reused, not rebuilt.

## Deployment Notes

Main projects are deployed successfully.

j8i7 failure is expected because PR #27 is archived. No action needed.
`

writeFileSync('ai/02_CURRENT_STATE.md', currentState)

appendFileSync(
  'ai/13_CHANGELOG.md',
  `\n## ${now}\n\n- Project state updated automatically.\n- Branch: ${branch}\n- Commit: ${commit}\n- Tag: ${tag}\n- Working tree: ${status ? 'dirty' : 'clean'}\n- Routes detected: ${appRoutes}\n- SQL migrations detected: ${migrations}\n`
)

console.log('Updated ai/02_CURRENT_STATE.md and ai/13_CHANGELOG.md')
