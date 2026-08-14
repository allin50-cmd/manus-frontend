import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://fineguard-ii4yhj27.manus.space'
const PATHS = [
  '/api/health',
  '/health',
  '/api/status',
  '/api/companies',
  '/api/contacts',
  '/api/tasks',
  '/api/alerts',
  '/api/messages',
  '/api/documents',
  '/api/calls',
  '/api/invoices',
  '/api/quotes',
  '/api/properties',
  '/api/tenancies',
  '/api/maintenance',
  '/api/compliance',
  '/api/certificates',
  '/api/trpc',
  '/trpc',
  '/graphql',
  '/api/graphql',
  '/api/rpc',
  '/rpc',
] as const

async function probe(path: string) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        'user-agent': 'UltraCore-Manus-Discovery/1.0',
      },
      redirect: 'manual',
      signal: controller.signal,
      cache: 'no-store',
    })
    const text = (await response.text()).slice(0, 1200)
    return {
      path,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type') ?? '',
      location: response.headers.get('location'),
      preview: text,
    }
  } catch (error) {
    return {
      path,
      status: null,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const results = []
  for (const path of PATHS) results.push(await probe(path))

  return NextResponse.json({ baseUrl: BASE_URL, results })
}
