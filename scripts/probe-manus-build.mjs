const base = (process.env.MANUS_BASE_URL || 'https://fineguard-ii4yhj27.manus.space').replace(/\/$/, '')

const candidates = {
  properties: ['/api/properties', '/api/la/properties', '/api/property/properties'],
  tenancies: ['/api/tenancies', '/api/la/tenancies'],
  certificates: ['/api/certificates', '/api/compliance', '/api/la/compliance', '/api/property/certificates'],
  maintenance: ['/api/maintenance', '/api/la/maintenance', '/api/property/maintenance'],
}

function countRows(value) {
  if (Array.isArray(value)) return value.length
  if (!value || typeof value !== 'object') return null
  for (const key of ['data', 'items', 'results', 'rows', 'properties', 'tenancies', 'certificates', 'maintenance', 'jobs']) {
    if (Array.isArray(value[key])) return value[key].length
  }
  return null
}

async function probe(path) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch(base + path, {
      headers: { Accept: 'application/json', 'User-Agent': 'UltraCore-Manus-Build-Probe/1.0' },
      redirect: 'manual',
      signal: controller.signal,
    })
    const contentType = response.headers.get('content-type') || ''
    let count = null
    if (contentType.includes('json')) {
      try { count = countRows(await response.json()) } catch {}
    }
    return { path, status: response.status, contentType, count }
  } catch (error) {
    return { path, error: error instanceof Error ? error.message : String(error) }
  } finally {
    clearTimeout(timer)
  }
}

console.log('ULTRACORE_MANUS_PROBE_START ' + JSON.stringify({ base }))
for (const [domain, paths] of Object.entries(candidates)) {
  let found = null
  const attempts = []
  for (const path of paths) {
    const result = await probe(path)
    attempts.push(result)
    if (result.status >= 200 && result.status < 300 && Number.isInteger(result.count)) {
      found = result
      break
    }
  }
  console.log('ULTRACORE_MANUS_PROBE ' + JSON.stringify({ domain, found, attempts }))
}
console.log('ULTRACORE_MANUS_PROBE_END')
