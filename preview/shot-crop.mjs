import { chromium } from 'playwright-core'
import { existsSync, readdirSync } from 'fs'

const base = '/opt/pw-browsers'
let exe = null
for (const d of readdirSync(base)) {
  const p = `${base}/${d}/chrome-linux/headless_shell`
  if (existsSync(p)) { exe = p; break }
}

const file = process.argv[2]
const out = process.argv[3]
const nth = parseInt(process.argv[4], 10) // section index

const browser = await chromium.launch({ executablePath: exe })
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 })
await page.goto('file://' + file, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const sections = await page.$$('section')
await sections[nth].screenshot({ path: out })
await browser.close()
console.log('saved', out)
