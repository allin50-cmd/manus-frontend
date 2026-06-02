import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

// find the headless shell that playwright downloaded
const base = '/opt/pw-browsers'
import { readdirSync } from 'fs'
let exe = null
for (const d of readdirSync(base)) {
  const p = `${base}/${d}/chrome-linux/headless_shell`
  if (existsSync(p)) { exe = p; break }
}
if (!exe) { console.error('no headless shell found'); process.exit(1) }

const file = process.argv[2]
const out = process.argv[3]

const browser = await chromium.launch({ executablePath: exe })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })
await page.goto('file://' + file, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log('saved', out)
