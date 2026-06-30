#!/usr/bin/env node
// Fails the build if governance documents are missing from the repo root.
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const required = ['ULTRATECHOS.md', 'ANTI_DRIFT.md']
const missing = required.filter((f) => !fs.existsSync(path.join(root, f)))

if (missing.length > 0) {
  console.error('Governance check failed: missing required files:')
  missing.forEach((f) => console.error(`  - ${f}`))
  console.error('These files define the product constitution and engineering rules.')
  console.error('Do not delete them.')
  process.exit(1)
}

console.log('Governance check passed.')
